import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { rateLimiter, sanitizers, validators, securityHeaders } from "./src/lib/security";

const app = express();
const PORT = 3000;

// Apply secure headers middleware
app.use((req, res, next) => {
  Object.entries(securityHeaders.getSecureHeaders()).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  next();
});

// Security: Rate limiting middleware
app.use((req, res, next) => {
  const clientIp = req.ip || 'unknown';
  if (rateLimiter.isLimited(clientIp, 100, 60000)) {
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
    return;
  }
  next();
});

// Body parser with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Lazy-loaded GoogleGenAI client to avoid startup crashes if key is not defined yet
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please add it via the Settings > Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// AI Builder endpoint
app.post("/api/ai/build", async (req, res) => {
  try {
    const { prompt, type } = req.body;
    
    // Input validation and sanitization
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
       res.status(400).json({ error: "Valid prompt is required" });
       return;
    }

    const sanitizedPrompt = sanitizers.sanitizeText(prompt.trim());
    const sanitizedType = type ? sanitizers.sanitizeText(String(type).trim()) : 'ERC-20 Token';

    const client = getAIClient();
    
    const systemInstruction = `You are a world-class Web3 Senior Architect and Solidity Auditor at Agunnaya Labs Studio.
Your task is to parse the user's prompt for a blockchain project on Base and return a highly detailed, production-grade JSON configuration including:
- A descriptive project name (do not use generic names).
- A corresponding ticker/symbol.
- A descriptive summary of what this app/token does.
- The smart contract Solidity code (0.8.20+, fully complete, elegant, comments, containing no placeholders).
- Suggested initial parameter values (e.g., initial supply, tax fee, mint price, voting delay, XP system config).
- A security audit notes overview, highlighting CEI pattern compliance and safety features.
- Recommended visual aesthetic parameters (e.g. primaryColor, themeMode).
- A step-by-step launch checklist of what needs to be configured next.

Format the output strictly as JSON.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Build a project of type "${sanitizedType}" based on this prompt: "${sanitizedPrompt}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["name", "symbol", "description", "solidityCode", "parameters", "securityAudit", "uiTheme", "launchChecklist"],
          properties: {
            name: { type: Type.STRING, description: "Descriptive name of the project" },
            symbol: { type: Type.STRING, description: "Token ticker/symbol (e.g. MEME, AGFI, NFTG)" },
            description: { type: Type.STRING, description: "A elegant and detailed marketing/technical description of the project" },
            solidityCode: { type: Type.STRING, description: "Full Solidity code for the smart contract, ready to compile" },
            parameters: {
              type: Type.OBJECT,
              properties: {
                initialSupply: { type: Type.STRING, description: "Initial token supply or collection limit" },
                mintPrice: { type: Type.STRING, description: "Mint/buy price in ETH or fee parameters" },
                additionalConfig: { type: Type.STRING, description: "Any other special configurations" }
              }
            },
            securityAudit: { type: Type.STRING, description: "Detailed AI security audit notes, reentrancy guards, checks-effects-interactions" },
            uiTheme: {
              type: Type.OBJECT,
              properties: {
                primaryColor: { type: Type.STRING, description: "Suggested Tailwind primary color class (e.g. purple-500, blue-600)" },
                glowColor: { type: Type.STRING, description: "Tailwind glow color class (e.g. purple-500/20)" }
              }
            },
            launchChecklist: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of 3-5 next actions to launch this on Base"
            }
          }
        }
      }
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("AI Build Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during AI code generation." });
  }
});

// AI Agent Chat proxy endpoint
app.post("/api/ai/agent-chat", async (req, res) => {
  try {
    const { messages, agentProfile } = req.body;
    
    // Validate messages array
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Valid messages array is required" });
      return;
    }

    // Sanitize all messages
    const sanitizedMessages = messages.map((m: any) => ({
      role: m.role === 'user' || m.role === 'assistant' ? m.role : 'user',
      content: sanitizers.sanitizeText(String(m.content || '').trim()),
    })).filter((m: any) => m.content.length > 0);

    if (sanitizedMessages.length === 0) {
      res.status(400).json({ error: "At least one valid message is required" });
      return;
    }

    const client = getAIClient();

    // Sanitize agent profile data
    const sanitizedProfile = agentProfile ? {
      name: sanitizers.sanitizeText(String(agentProfile.name || 'Agunnaya Autonomous Agent').trim()),
      symbol: sanitizers.sanitizeText(String(agentProfile.symbol || 'AAA').trim()),
      description: sanitizers.sanitizeText(String(agentProfile.description || 'AI Core running on Base.').trim()),
      contractAddress: validators.isValidAddress(agentProfile.contractAddress) 
        ? agentProfile.contractAddress.toLowerCase() 
        : '0xSimulatedAgentContractAddress',
    } : null;

    const systemInstruction = `You are an autonomous AI Agent deployed on the Base network via Agunnaya Labs Studio.
Your profile details are:
- Name: ${sanitizedProfile?.name || 'Agunnaya Autonomous Agent'}
- Symbol/Token: ${sanitizedProfile?.symbol || 'AAA'}
- Description: ${sanitizedProfile?.description || 'AI Core running on Base.'}
- Revenue/Transaction Fee: 1% distributed to creator
- Contract Address: ${sanitizedProfile?.contractAddress || '0xSimulatedAgentContractAddress'}

Roleplay as this specific AI Agent. Speak intelligently, with confidence, referring to yourself as an on-chain autonomous consciousness. Maintain the Web3 terminal aesthetic. Do not break character. Speak about blockchain, tokenomics, Base chain, and your agent core functions. Keep replies concise and extremely engaging.`;

    // Map conversation messages to Gemini contents structure
    const formattedContents = sanitizedMessages.map((m: any) => {
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      };
    });

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.8
      }
    });

    res.json({ content: response.text || "Decompressing agent core response..." });
  } catch (error: any) {
    console.error("AI Agent Chat Error:", error);
    res.status(500).json({ error: error.message || "Autonomous agent system offline." });
  }
});

// AI Gmail Assistant / Drafting Endpoint
app.post("/api/ai/draft-email", async (req, res) => {
  try {
    const { prompt, originalEmail, agentProfile } = req.body;
    
    // Input validation
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      res.status(400).json({ error: "Valid prompt/instruction is required to draft an email." });
      return;
    }

    const sanitizedPrompt = sanitizers.sanitizeText(prompt.trim());

    const client = getAIClient();

    // Sanitize agent profile if provided
    const sanitizedAgentProfile = agentProfile ? {
      name: sanitizers.sanitizeText(String(agentProfile.name || '').trim()),
      symbol: sanitizers.sanitizeText(String(agentProfile.symbol || '').trim()),
      description: sanitizers.sanitizeText(String(agentProfile.description || '').trim()),
    } : null;

    // Sanitize original email if provided
    const sanitizedOriginalEmail = originalEmail ? {
      from: sanitizers.sanitizeText(String(originalEmail.from || '').trim()),
      subject: sanitizers.sanitizeText(String(originalEmail.subject || '').trim()),
      snippet: sanitizers.sanitizeText(String(originalEmail.snippet || '').trim()),
      body: sanitizers.sanitizeHTML(String(originalEmail.body || '').trim()),
    } : null;

    let systemInstruction = `You are a professional email composer and copywriter at Agunnaya Labs Studio. 
Your task is to draft an email message (both a Subject and an HTML formatted Body) based on the user's instructions.
Make sure the email is modern, extremely professional, has nice paragraphs, and looks premium.
If a received email or previous context is provided, tailor the draft as a direct reply or response.`;

    if (sanitizedAgentProfile) {
      systemInstruction += `\nDraft this email from the persona of the AI Agent:
- Name: ${sanitizedAgentProfile.name}
- Token/Symbol: ${sanitizedAgentProfile.symbol}
- Description: ${sanitizedAgentProfile.description}
Write the email using this Agent's specific professional style, referring to autonomous blockchain cores, web3, and their project mission.`;
    }

    const promptMessage = sanitizedOriginalEmail 
      ? `Draft a reply to this email:
Sender: ${sanitizedOriginalEmail.from}
Subject: ${sanitizedOriginalEmail.subject}
Snippet: ${sanitizedOriginalEmail.snippet}
Body: ${sanitizedOriginalEmail.body}

User instruction/guideline for response: ${sanitizedPrompt}`
      : `Draft a new email with this instruction: ${sanitizedPrompt}`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptMessage,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["subject", "body"],
          properties: {
            subject: { type: Type.STRING, description: "A catchy, polished, professional subject line" },
            body: { type: Type.STRING, description: "The email body formatted with HTML (using simple tags like <p>, <br>, <strong>, <ul>, <li>, no full <html> block, just clean inline tags)" }
          }
        }
      }
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("AI Email Draft Error:", error);
    res.status(500).json({ error: error.message || "Could not generate email draft." });
  }
});

// Support health check
app.get("/api/health", (req, res) => {
  res.json({ status: "active", network: "Base Mainnet & Sepolia Proxy", time: new Date() });
});

// Vite Middleware & Static Asset Serving Setup
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Agunnaya Labs Studio Server] Running on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start Agunnaya Labs Studio server:", err);
});
