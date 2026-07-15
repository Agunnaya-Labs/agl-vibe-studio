import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

app.use(express.json());

// Security headers (replaces broken <meta> CSP tags in index.html)
app.use((req, res, next) => {
  const isDev = process.env.NODE_ENV !== "production";

  // Allow Replit preview iframe in dev; lock down in production
  const frameAncestors = isDev
    ? "frame-ancestors 'self' https://*.replit.dev https://*.replit.app https://*.repl.co"
    : "frame-ancestors 'none'";

  // Allow Vite HMR WebSocket in dev
  const connectSrc = isDev
    ? "connect-src 'self' https: wss: ws:"
    : "connect-src 'self' https:";

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    connectSrc,
    frameAncestors,
  ].join("; ");

  res.setHeader("Content-Security-Policy", csp);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  if (!isDev) {
    res.setHeader("X-Frame-Options", "DENY");
  }

  next();
});

// Lazy-loaded GoogleGenerativeAI client to avoid startup crashes if key is not defined yet
let aiClient: GoogleGenerativeAI | null = null;

function getAIClient(): GoogleGenerativeAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please add it via the Settings > Secrets panel.");
    }
    aiClient = new GoogleGenerativeAI(apiKey);
  }
  return aiClient;
}

// AI Builder endpoint
app.post("/api/ai/build", async (req, res) => {
  try {
    const { prompt, type } = req.body;
    if (!prompt) {
       res.status(400).json({ error: "Prompt is required" });
       return;
    }

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

    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const response = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: `Build a project of type "${type || 'ERC-20 Token'}" based on this prompt: "${prompt}"` }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING, description: "Descriptive name of the project" },
            symbol: { type: SchemaType.STRING, description: "Token ticker/symbol (e.g. MEME, AGFI, NFTG)" },
            description: { type: SchemaType.STRING, description: "A elegant and detailed marketing/technical description of the project" },
            solidityCode: { type: SchemaType.STRING, description: "Full Solidity code for the smart contract, ready to compile" },
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                initialSupply: { type: SchemaType.STRING, description: "Initial token supply or collection limit" },
                mintPrice: { type: SchemaType.STRING, description: "Mint/buy price in ETH or fee parameters" },
                additionalConfig: { type: SchemaType.STRING, description: "Any other special configurations" }
              }
            },
            securityAudit: { type: SchemaType.STRING, description: "Detailed AI security audit notes, reentrancy guards, checks-effects-interactions" },
            uiTheme: {
              type: SchemaType.OBJECT,
              properties: {
                primaryColor: { type: SchemaType.STRING, description: "Suggested Tailwind primary color class (e.g. purple-500, blue-600)" },
                glowColor: { type: SchemaType.STRING, description: "Tailwind glow color class (e.g. purple-500/20)" }
              }
            },
            launchChecklist: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: "A list of 3-5 next actions to launch this on Base"
            }
          },
          required: ["name", "symbol", "description", "solidityCode", "parameters", "securityAudit", "uiTheme", "launchChecklist"]
        }
      }
    });
    
    const systemContext = { systemInstruction };

    const text = response.response.text();
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
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Messages array is required" });
      return;
    }

    const client = getAIClient();

    const systemInstruction = `You are an autonomous AI Agent deployed on the Base network via Agunnaya Labs Studio.
Your profile details are:
- Name: ${agentProfile?.name || 'Agunnaya Autonomous Agent'}
- Symbol/Token: ${agentProfile?.symbol || 'AAA'}
- Description: ${agentProfile?.description || 'AI Core running on Base.'}
- Revenue/Transaction Fee: 1% distributed to creator
- Contract Address: ${agentProfile?.contractAddress || '0xSimulatedAgentContractAddress'}

Roleplay as this specific AI Agent. Speak intelligently, with confidence, referring to yourself as an on-chain autonomous consciousness. Maintain the Web3 terminal aesthetic. Do not break character. Speak about blockchain, tokenomics, Base chain, and your agent core functions. Keep replies concise and extremely engaging.`;

    // Map conversation messages to Gemini contents structure
    const formattedContents = messages.map((m: any) => {
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      };
    });

    const model = client.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction
    });

    const response = await model.generateContent({
      contents: formattedContents,
      generationConfig: {
        temperature: 0.8
      }
    });

    const content = response.response.text();
    res.json({ content });
  } catch (error: any) {
    console.error("AI Agent Chat Error:", error);
    res.status(500).json({ error: error.message || "Autonomous agent system offline." });
  }
});

// AI Gmail Assistant / Drafting Endpoint
app.post("/api/ai/draft-email", async (req, res) => {
  try {
    const { prompt, originalEmail, agentProfile } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Prompt/Instruction is required to draft an email." });
      return;
    }

    const client = getAIClient();

    let systemInstruction = `You are a professional email composer and copywriter at Agunnaya Labs Studio. 
Your task is to draft an email message (both a Subject and an HTML formatted Body) based on the user's instructions.
Make sure the email is modern, extremely professional, has nice paragraphs, and looks premium.
If a received email or previous context is provided, tailor the draft as a direct reply or response.`;

    if (agentProfile) {
      systemInstruction += `\nDraft this email from the persona of the AI Agent:
- Name: ${agentProfile.name}
- Token/Symbol: ${agentProfile.symbol}
- Description: ${agentProfile.description}
Write the email using this Agent's specific professional style, referring to autonomous blockchain cores, web3, and their project mission.`;
    }

    const promptMessage = originalEmail 
      ? `Draft a reply to this email:
Sender: ${originalEmail.from}
Subject: ${originalEmail.subject}
Snippet: ${originalEmail.snippet}
Body: ${originalEmail.body}

User instruction/guideline for response: ${prompt}`
      : `Draft a new email with this instruction: ${prompt}`;

    const model = client.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction
    });

    const response = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: promptMessage }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            subject: { type: SchemaType.STRING, description: "A catchy, polished, professional subject line" },
            body: { type: SchemaType.STRING, description: "The email body formatted with HTML (using simple tags like <p>, <br>, <strong>, <ul>, <li>, no full <html> block, just clean inline tags)" }
          },
          required: ["subject", "body"]
        }
      }
    });

    const text = response.response.text();
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
