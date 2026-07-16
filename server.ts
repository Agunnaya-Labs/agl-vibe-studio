import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { ethers } from "ethers";

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

// ─── AGLCredits on-chain integration ────────────────────────────────────────
const AGL_CREDITS_ADDRESS = "0x13866F31c60822Ff70684213b9727915Ddf2c183";
const BASE_RPC = "https://base.publicnode.com";

const AGL_CREDITS_ABI = [
  "function totalCreditsPurchased(address) view returns (uint256)",
  "function totalAGLBurnedBy(address) view returns (uint256)",
  "function creditsPerAGL() view returns (uint256)",
  "function totalAGLBurned() view returns (uint256)",
  "function aglToken() view returns (address)",
  "function previewCredits(uint256) view returns (uint256)",
];

function getCreditsContract() {
  const provider = new ethers.JsonRpcProvider(BASE_RPC);
  return new ethers.Contract(AGL_CREDITS_ADDRESS, AGL_CREDITS_ABI, provider);
}

/** Credits deducted per AI call type (matches client-side CREDIT_COSTS in credits.ts) */
const CREDIT_COSTS: Record<string, number> = {
  build: 50,
  "agent-chat": 5,
  "draft-email": 10,
};

/**
 * Per-session spend ledger. Keys are lowercase wallet addresses.
 * Resets on server restart — upgrade path: persist to Firestore with firebase-admin.
 */
const spendLedger = new Map<string, number>();

/**
 * Middleware: reads on-chain totalCreditsPurchased for the calling wallet and
 * enforces the credit cost. Wallets with 0 on-chain credits (sandbox users) pass
 * through freely. Only wallets that have real credits but have spent them all are
 * blocked with a 402.
 */
async function checkAndDeductCredits(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const endpoint = req.path.replace("/api/ai/", "");
  const cost = CREDIT_COSTS[endpoint] ?? 0;
  const rawAddress: string = (req.body?.walletAddress || "").trim();
  const key = rawAddress.toLowerCase();

  if (!key || cost === 0) return next();

  try {
    const contract = getCreditsContract();
    const totalPurchased = Number(await contract.totalCreditsPurchased(rawAddress));
    const spent = spendLedger.get(key) || 0;
    const remaining = totalPurchased - spent;

    if (totalPurchased > 0 && remaining < cost) {
      return res.status(402).json({
        error: `Insufficient AGL credits. This action costs ${cost} credits but you only have ${remaining} remaining. Burn more AGL on the Credits panel to top up.`,
        creditsNeeded: cost,
        creditsRemaining: remaining,
      });
    }

    // Deduct only for wallets that have real on-chain credits
    if (totalPurchased > 0) {
      spendLedger.set(key, spent + cost);
    }
  } catch {
    // RPC failure — don't block the user; log and continue
    console.warn("[Credits] Chain read failed — allowing call without credit check.");
  }

  next();
}

app.use(express.json());

// Security headers (replaces broken <meta> CSP tags in index.html)
app.use((req, res, next) => {
  const isDev = process.env.NODE_ENV !== "production";
  const frameAncestors = isDev
    ? "frame-ancestors 'self' https://*.replit.dev https://*.replit.app https://*.repl.co"
    : "frame-ancestors 'none'";
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
  if (!isDev) res.setHeader("X-Frame-Options", "DENY");
  next();
});

// Lazy-loaded GoogleGenAI client
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

// ─── Credits API endpoints ───────────────────────────────────────────────────

// Live on-chain balance + session spend for a wallet address
app.get("/api/credits/balance/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const contract = getCreditsContract();

    const [totalPurchased, totalAGLBurnedBy, creditsPerAGL, totalAGLBurned, aglTokenAddress] =
      await Promise.all([
        contract.totalCreditsPurchased(address),
        contract.totalAGLBurnedBy(address),
        contract.creditsPerAGL(),
        contract.totalAGLBurned(),
        contract.aglToken(),
      ]);

    const totalPurchasedNum = Number(totalPurchased);
    const spent = spendLedger.get(address.toLowerCase()) || 0;

    res.json({
      totalCreditsPurchased: totalPurchasedNum,
      creditsSpent: spent,
      creditsRemaining: Math.max(0, totalPurchasedNum - spent),
      totalAGLBurnedBy: ethers.formatUnits(totalAGLBurnedBy, 18),
      creditsPerAGL: Number(creditsPerAGL),
      totalProtocolAGLBurned: ethers.formatUnits(totalAGLBurned, 18),
      aglTokenAddress,
      costs: CREDIT_COSTS,
    });
  } catch (error: any) {
    console.error("[Credits] Balance error:", error);
    res.status(500).json({ error: "Failed to read credits from Base network." });
  }
});

// Preview how many credits a given AGL wei amount would grant
app.get("/api/credits/preview/:aglWei", async (req, res) => {
  try {
    const contract = getCreditsContract();
    const credits = await contract.previewCredits(BigInt(req.params.aglWei));
    res.json({ credits: Number(credits) });
  } catch (error: any) {
    res.status(500).json({ error: "Preview failed." });
  }
});

// ─── AI endpoints (credit-gated) ─────────────────────────────────────────────

// AI Builder endpoint
app.post("/api/ai/build", checkAndDeductCredits, async (req, res) => {
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

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Build a project of type "${type || 'ERC-20 Token'}" based on this prompt: "${prompt}"`,
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
app.post("/api/ai/agent-chat", checkAndDeductCredits, async (req, res) => {
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

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW
        }
      }
    });

    res.json({ content: response.text || "Decompressing agent core response..." });
  } catch (error: any) {
    console.error("AI Agent Chat Error:", error);
    res.status(500).json({ error: error.message || "Autonomous agent system offline." });
  }
});

// AI Prompt Optimizer Endpoint
app.post("/api/ai/optimize-prompt", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Prompt is required" });
      return;
    }

    const client = getAIClient();

    const systemInstruction = `You are an expert prompt engineer specializing in Web3 Autonomous Agents and LLM system prompts.
Your task is to take a simple user directive or prompt and expand it into a highly detailed, extremely professional, and optimized system instruction for a Gemini-powered blockchain agent.
Ensure the output:
- Outlines clear behavioral directives and domain expertise (e.g. Solidity auditing, DeFi yields, tokenomics, marketing).
- Enforces safety constraints (never leak private keys, maintain a secure and helpful posture).
- Defines a distinct professional tone (confident, intelligent, Web3 terminal aesthetic).
- Keeps the prompt compact but rich in cognitive value to save token overhead.
Return only the optimized prompt text directly. No quotes, no preamble, no commentary.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Optimize this directive: "${prompt}"`,
      config: {
        systemInstruction,
        temperature: 0.7,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW
        }
      }
    });

    res.json({ optimizedPrompt: response.text || prompt });
  } catch (error: any) {
    console.error("AI Prompt Optimize Error:", error);
    res.status(500).json({ error: error.message || "Could not optimize system prompt." });
  }
});

// AI Gmail Assistant / Drafting Endpoint
app.post("/api/ai/draft-email", checkAndDeductCredits, async (req, res) => {
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

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptMessage,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW
        },
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

// ─── Image upload endpoint (Feature 3: IPFS / logo upload) ──────────────────
// Accepts a base64 data URI and returns the same URL so the client can persist
// it in localStorage / Firestore.  For production, swap the return value for
// an IPFS/S3 URL.  Max payload enforced by express.json limit.
app.post("/api/upload/image", express.json({ limit: "8mb" }), (req, res) => {
  const { dataUri, filename } = req.body as { dataUri?: string; filename?: string };
  if (!dataUri || !dataUri.startsWith("data:image/")) {
    res.status(400).json({ error: "Invalid or missing image data URI." });
    return;
  }
  // Return the data URI as-is — the client stores it in the token record.
  // Replace this with an IPFS pin call when an API key is available.
  res.json({ url: dataUri, filename: filename || "upload" });
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
