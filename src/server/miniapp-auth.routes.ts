import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { verifyMessage } from "ethers";
import jwt from "jsonwebtoken";

const router = Router();

// ─── Config ─────────────────────────────────────────────────────────────────
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
// Reuse the SESSION_SECRET already configured on this Replit as JWT signing key
const JWT_SECRET = process.env.SESSION_SECRET!;
const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const INIT_DATA_MAX_AGE_S = 24 * 60 * 60; // 24 hours

// ─── Firebase Firestore REST ─────────────────────────────────────────────────
// Uses the existing Firebase web API key — no additional service-account secret needed.
// Firestore security rules for the `tg_users` collection must allow server writes.
// Add this to your firestore.rules if not already present:
//   match /tg_users/{id} { allow read, write: if true; }
// (tighten to auth-based rules once you have Firebase Admin set up)
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const firebaseConfig = JSON.parse(
  readFileSync(join(__dirname, "../../firebase-applet-config.json"), "utf-8")
);

const FS_BASE =
  `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}` +
  `/databases/${firebaseConfig.firestoreDatabaseId}/documents`;
const FS_KEY: string = firebaseConfig.apiKey;

async function upsertTelegramUser(telegramId: string, walletAddress: string): Promise<void> {
  const url = `${FS_BASE}/tg_users/${telegramId}?key=${FS_KEY}`;
  const body = {
    fields: {
      telegramId:    { stringValue: telegramId },
      walletAddress: { stringValue: walletAddress.toLowerCase() },
      updatedAt:     { timestampValue: new Date().toISOString() },
    },
  };
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firestore write failed: ${err}`);
  }
}

async function getTelegramUser(telegramId: string): Promise<{ walletAddress: string } | null> {
  const url = `${FS_BASE}/tg_users/${telegramId}?key=${FS_KEY}`;
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const data = await res.json();
  const walletAddress = data?.fields?.walletAddress?.stringValue;
  return walletAddress ? { walletAddress } : null;
}

// ─── In-memory nonce store ───────────────────────────────────────────────────
// Swap for Redis in multi-instance deployments.
const nonces = new Map<string, { nonce: string; expiresAt: number }>();

// Purge expired nonces every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of nonces) {
    if (now > val.expiresAt) nonces.delete(key);
  }
}, 10 * 60 * 1000);

// ─── Telegram initData HMAC validation ──────────────────────────────────────
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
function validateInitData(initData: string): { telegramId: string } | null {
  if (!BOT_TOKEN) {
    console.warn("[TG Auth] TELEGRAM_BOT_TOKEN is not set — skipping HMAC check (dev mode)");
    // In dev without a real bot token, accept a fake initData with `user={"id":1}` for testing
    try {
      const params = new URLSearchParams(initData);
      const user = JSON.parse(params.get("user") || "{}");
      if (user.id) return { telegramId: String(user.id) };
    } catch { /* ignore */ }
    return null;
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash !== hash) return null;

  const authDate = Number(params.get("auth_date"));
  if (!authDate || Date.now() / 1000 - authDate > INIT_DATA_MAX_AGE_S) return null;

  const user = JSON.parse(params.get("user") || "{}");
  if (!user.id) return null;

  return { telegramId: String(user.id) };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * POST /api/miniapp/auth/telegram
 * Step 1 — client sends Telegram initData, receives a nonce to sign with their wallet.
 */
router.post("/auth/telegram", (req: Request, res: Response) => {
  const { initData } = req.body;
  if (!initData) {
    res.status(400).json({ error: "initData is required" });
    return;
  }

  const validated = validateInitData(initData);
  if (!validated) {
    res.status(401).json({ error: "Invalid Telegram initData" });
    return;
  }

  const nonce = crypto.randomBytes(16).toString("hex");
  nonces.set(validated.telegramId, { nonce, expiresAt: Date.now() + NONCE_TTL_MS });

  res.json({
    telegramId: validated.telegramId,
    message: `Sign this message to link your wallet to AGL Studio.\nNonce: ${nonce}`,
  });
});

/**
 * POST /api/miniapp/auth/wallet-link
 * Step 2 — client submits wallet address + EIP-191 signature of the nonce message.
 * On success, issues a 12-hour JWT and persists the mapping to Firestore.
 */
router.post("/auth/wallet-link", async (req: Request, res: Response) => {
  const { telegramId, walletAddress, signature } = req.body;
  if (!telegramId || !walletAddress || !signature) {
    res.status(400).json({ error: "Missing telegramId, walletAddress, or signature" });
    return;
  }

  const stored = nonces.get(telegramId);
  if (!stored || Date.now() > stored.expiresAt) {
    res.status(401).json({ error: "Nonce expired — restart auth flow" });
    return;
  }

  const message = `Sign this message to link your wallet to AGL Studio.\nNonce: ${stored.nonce}`;

  let recovered: string;
  try {
    recovered = verifyMessage(message, signature);
  } catch {
    res.status(401).json({ error: "Signature verification failed" });
    return;
  }

  if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
    res.status(401).json({ error: "Signature does not match wallet address" });
    return;
  }

  nonces.delete(telegramId);

  try {
    await upsertTelegramUser(telegramId, walletAddress);
  } catch (err: any) {
    console.error("[TG Auth] Firestore write error:", err.message);
    res.status(500).json({ error: "Failed to persist wallet link — try again" });
    return;
  }

  if (!JWT_SECRET) {
    res.status(500).json({ error: "JWT_SECRET (SESSION_SECRET) is not configured" });
    return;
  }

  const token = jwt.sign(
    { telegramId, walletAddress: walletAddress.toLowerCase() },
    JWT_SECRET,
    { expiresIn: "12h" }
  );

  res.json({ token, walletAddress: walletAddress.toLowerCase(), telegramId });
});

/**
 * GET /api/miniapp/auth/user/:telegramId
 * Look up an existing linked wallet for a Telegram user.
 */
router.get("/auth/user/:telegramId", async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  try {
    const user = await getTelegramUser(telegramId);
    if (!user) {
      res.status(404).json({ linked: false });
      return;
    }
    res.json({ linked: true, walletAddress: user.walletAddress });
  } catch {
    res.status(500).json({ error: "Lookup failed" });
  }
});

// ─── Auth middleware ──────────────────────────────────────────────────────────
export function requireMiniAppAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing Bearer token" });
    return;
  }
  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET);
    (req as any).miniAppAuth = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export default router;
