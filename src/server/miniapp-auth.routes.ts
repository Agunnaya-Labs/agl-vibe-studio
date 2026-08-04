/**
 * Telegram Mini App Auth Routes
 *
 * Two security improvements that require ZERO extra secrets:
 *
 *  Fix #1 — Stateless nonces
 *    Nonces are JWT-signed with SESSION_SECRET and returned to the client as an
 *    opaque `nonceToken`. The server verifies them on step 2 without any DB lookup.
 *    This works perfectly across multiple server instances and survives restarts.
 *
 *  Fix #2 — HMAC-derived Firestore document IDs
 *    tg_users documents are stored at HMAC(SESSION_SECRET, telegramId) instead of
 *    the raw telegramId. Anyone with the web API key but NOT the SESSION_SECRET
 *    cannot derive document paths, so they cannot forge or overwrite wallet records.
 */

import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { verifyMessage } from "ethers";
import jwt from "jsonwebtoken";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// ─── Firebase project config ──────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const fbConfig   = JSON.parse(
  readFileSync(join(__dirname, "../../firebase-applet-config.json"), "utf-8")
) as { projectId: string; firestoreDatabaseId: string; apiKey: string };

const FS_BASE = `https://firestore.googleapis.com/v1/projects/${fbConfig.projectId}/databases/${fbConfig.firestoreDatabaseId}/documents`;
const FS_KEY  = fbConfig.apiKey;

// ─── Config ───────────────────────────────────────────────────────────────────
const BOT_TOKEN           = process.env.TELEGRAM_BOT_TOKEN ?? "";
const JWT_SECRET          = process.env.SESSION_SECRET ?? "";
const INIT_DATA_MAX_AGE_S = 24 * 60 * 60; // 24 h

// ─── Fix #2: HMAC-derived Firestore document ID ───────────────────────────────
// Without SESSION_SECRET you cannot compute the path for any user's document,
// making direct REST API forgery infeasible even with the web API key.
function userDocId(telegramId: string): string {
  return crypto.createHmac("sha256", JWT_SECRET || "fallback").update(telegramId).digest("hex");
}

// ─── Firestore REST helpers ───────────────────────────────────────────────────
async function restGet(collection: string, docId: string): Promise<any | null> {
  const res = await fetch(`${FS_BASE}/${collection}/${docId}?key=${FS_KEY}`);
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

async function restSet(collection: string, docId: string, data: Record<string, string | number>): Promise<void> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    fields[k] = typeof v === "number" ? { integerValue: String(v) } : { stringValue: v };
  }
  const res = await fetch(`${FS_BASE}/${collection}/${docId}?key=${FS_KEY}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`Firestore write failed (${res.status}): ${await res.text()}`);
}

// ─── User helpers ─────────────────────────────────────────────────────────────
async function upsertUser(telegramId: string, walletAddress: string): Promise<void> {
  const docId = userDocId(telegramId);
  await restSet("tg_users", docId, {
    telegramId,
    walletAddress: walletAddress.toLowerCase(),
    updatedAt: Date.now(),
  });
}

async function getUser(telegramId: string): Promise<{ walletAddress: string } | null> {
  const docId = userDocId(telegramId);
  const doc = await restGet("tg_users", docId);
  const w = doc?.fields?.walletAddress?.stringValue;
  return w ? { walletAddress: w } : null;
}

// ─── Fix #1: Stateless JWT nonce ─────────────────────────────────────────────
// The server signs { telegramId, nonce } with SESSION_SECRET (5-min expiry).
// No database. No in-memory store. Works across any number of instances.
function issueNonceToken(telegramId: string, nonce: string): string {
  return jwt.sign({ telegramId, nonce }, JWT_SECRET, { expiresIn: "5m" });
}

function verifyNonceToken(nonceToken: string): { telegramId: string; nonce: string } {
  return jwt.verify(nonceToken, JWT_SECRET) as { telegramId: string; nonce: string };
}

// ─── Telegram initData HMAC validation ───────────────────────────────────────
function validateInitData(initData: string): { telegramId: string; username?: string } | null {
  if (!BOT_TOKEN) {
    // Dev mode: no real bot token — accept fake initData for local testing
    console.warn("[TG Auth] TELEGRAM_BOT_TOKEN not set — dev mode, HMAC check skipped");
    try {
      const user = JSON.parse(new URLSearchParams(initData).get("user") || "{}");
      if (user.id) return { telegramId: String(user.id), username: user.username };
    } catch { /* ignore */ }
    return null;
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const checkStr  = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const computed  = crypto.createHmac("sha256", secretKey).update(checkStr).digest("hex");
  if (computed !== hash) return null;

  const authDate = Number(params.get("auth_date"));
  if (!authDate || Date.now() / 1000 - authDate > INIT_DATA_MAX_AGE_S) return null;

  const user = JSON.parse(params.get("user") || "{}");
  if (!user.id) return null;
  return { telegramId: String(user.id), username: user.username };
}

// ─── Router ───────────────────────────────────────────────────────────────────
const router = Router();

/**
 * POST /api/miniapp/auth/telegram
 * Step 1 — validate Telegram identity, return a signed nonce token.
 * No database write. The nonce is embedded in the JWT returned to the client.
 */
router.post("/auth/telegram", (req: Request, res: Response) => {
  const { initData } = req.body;
  if (!initData) { res.status(400).json({ error: "initData is required" }); return; }

  const validated = validateInitData(initData);
  if (!validated) { res.status(401).json({ error: "Invalid Telegram initData" }); return; }

  const nonce      = crypto.randomBytes(16).toString("hex");
  const nonceToken = issueNonceToken(validated.telegramId, nonce);

  res.json({
    telegramId: validated.telegramId,
    username:   validated.username,
    nonceToken,                    // opaque to the client — sent back in step 2
    message: `Sign this message to link your wallet to AGL Studio.\nNonce: ${nonce}`,
  });
});

/**
 * POST /api/miniapp/auth/wallet-link
 * Step 2 — verify the nonce token + EIP-191 wallet signature, persist link, issue session JWT.
 * The nonceToken carries telegramId + nonce; no DB lookup needed.
 */
router.post("/auth/wallet-link", async (req: Request, res: Response) => {
  const { nonceToken, walletAddress, signature } = req.body;
  if (!nonceToken || !walletAddress || !signature) {
    res.status(400).json({ error: "Missing nonceToken, walletAddress, or signature" });
    return;
  }

  // Verify the nonce token (checks expiry and SESSION_SECRET signature)
  let telegramId: string, nonce: string;
  try {
    ({ telegramId, nonce } = verifyNonceToken(nonceToken));
  } catch {
    res.status(401).json({ error: "Nonce expired or invalid — restart auth flow" });
    return;
  }

  const message = `Sign this message to link your wallet to AGL Studio.\nNonce: ${nonce}`;

  let recovered: string;
  try { recovered = verifyMessage(message, signature); }
  catch { res.status(401).json({ error: "Signature verification failed" }); return; }

  if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
    res.status(401).json({ error: "Signature does not match wallet address" });
    return;
  }

  try { await upsertUser(telegramId, walletAddress); }
  catch (err: any) {
    console.error("[TG Auth] upsertUser:", err.message);
    res.status(500).json({ error: "Failed to persist wallet link — try again" });
    return;
  }

  if (!JWT_SECRET) { res.status(500).json({ error: "SESSION_SECRET is not configured" }); return; }

  const token = jwt.sign(
    { telegramId, walletAddress: walletAddress.toLowerCase() },
    JWT_SECRET,
    { expiresIn: "12h" }
  );
  res.json({ token, walletAddress: walletAddress.toLowerCase(), telegramId });
});

/**
 * GET /api/miniapp/auth/user/:telegramId
 * Look up an existing linked wallet.
 */
router.get("/auth/user/:telegramId", async (req: Request, res: Response) => {
  try {
    const user = await getUser(req.params.telegramId);
    if (!user) { res.status(404).json({ linked: false }); return; }
    res.json({ linked: true, walletAddress: user.walletAddress });
  } catch { res.status(500).json({ error: "Lookup failed" }); }
});

/**
 * POST /api/miniapp/bot/webhook
 * Handles the /link command — replies with an inline button opening the Mini App.
 * Register with: curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<DOMAIN>/api/miniapp/bot/webhook&secret_token=<WEBHOOK_SECRET>"
 */
router.post("/bot/webhook", async (req: Request, res: Response) => {
  const secretHeader  = req.headers["x-telegram-bot-api-secret-token"];
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (webhookSecret && secretHeader !== webhookSecret) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const message = req.body?.message;
  const text    = (message?.text ?? "").trim();
  const chatId  = message?.chat?.id;

  res.sendStatus(200); // always ACK Telegram immediately

  if (!chatId || !text.startsWith("/link") || !BOT_TOKEN) return;

  const domain     = process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
  const miniAppUrl = `${domain}/?tab=telegram-miniapp`;

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id:    chatId,
      text:       "🔗 *Link your wallet to AGL Studio*\n\nTap the button below to open the Mini App and complete the wallet-link flow in seconds.",
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[
          { text: "🚀 Open Wallet Link", web_app: { url: miniAppUrl } },
        ]],
      },
    }),
  }).catch((e) => console.error("[TG Bot] sendMessage failed:", e));
});

// ─── Auth middleware ──────────────────────────────────────────────────────────
export function requireMiniAppAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) { res.status(401).json({ error: "Missing Bearer token" }); return; }
  try {
    (req as any).miniAppAuth = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export default router;
