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

// ─── Firebase Admin SDK (Fix #2 — privileged server writes bypass Firestore rules) ──
// Initialize at module load time so the singleton is ready for every request.
// Falls back to the REST API if FIREBASE_SERVICE_ACCOUNT is not yet set.
import { initializeApp as initAdminApp, getApps as getAdminApps, cert } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";

let adminFirestore: Firestore | null = null;

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
if (serviceAccountJson) {
  try {
    const credential = cert(JSON.parse(serviceAccountJson));
    const adminApp = getAdminApps().length
      ? getAdminApps()[0]
      : initAdminApp({ credential });
    adminFirestore = getAdminFirestore(adminApp!, fbConfig.firestoreDatabaseId);
    console.log("[TG Auth] Firebase Admin SDK initialized — using Admin Firestore");
  } catch (e) {
    console.warn("[TG Auth] Firebase Admin init failed, falling back to REST API:", (e as Error).message);
  }
} else {
  console.warn(
    "[TG Auth] FIREBASE_SERVICE_ACCOUNT not set — using REST API fallback " +
    "(less secure; set the secret to enable Admin SDK)"
  );
}

// ─── Firestore REST API fallback ──────────────────────────────────────────────
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${fbConfig.projectId}/databases/${fbConfig.firestoreDatabaseId}/documents`;
const FS_KEY  = fbConfig.apiKey;

async function restGet(collection: string, docId: string): Promise<any | null> {
  const res = await fetch(`${FS_BASE}/${collection}/${docId}?key=${FS_KEY}`);
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

async function restSet(collection: string, docId: string, data: Record<string, string | number>): Promise<void> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === "number") fields[k] = { integerValue: String(v) };
    else fields[k] = { stringValue: v };
  }
  const res = await fetch(`${FS_BASE}/${collection}/${docId}?key=${FS_KEY}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`Firestore REST write failed (${res.status}): ${await res.text()}`);
}

async function restDelete(collection: string, docId: string): Promise<void> {
  await fetch(`${FS_BASE}/${collection}/${docId}?key=${FS_KEY}`, { method: "DELETE" });
}

// ─── Config ───────────────────────────────────────────────────────────────────
const BOT_TOKEN           = process.env.TELEGRAM_BOT_TOKEN ?? "";
const JWT_SECRET          = process.env.SESSION_SECRET ?? "";
const NONCE_TTL_MS        = 5 * 60 * 1000;  // 5 min
const INIT_DATA_MAX_AGE_S = 24 * 60 * 60;   // 24 h

// ─── Nonce helpers (Fix #1 — Firestore-backed, survives restarts + multi-instance) ──
async function saveNonce(telegramId: string, nonce: string): Promise<void> {
  const expiresAt = Date.now() + NONCE_TTL_MS;
  if (adminFirestore) {
    await adminFirestore.collection("tg_nonces").doc(telegramId).set({ nonce, expiresAt });
  } else {
    await restSet("tg_nonces", telegramId, { nonce, expiresAt });
  }
}

async function getNonce(telegramId: string): Promise<{ nonce: string; expiresAt: number } | null> {
  if (adminFirestore) {
    const snap = await adminFirestore.collection("tg_nonces").doc(telegramId).get();
    if (!snap.exists) return null;
    return snap.data() as { nonce: string; expiresAt: number };
  }
  const doc = await restGet("tg_nonces", telegramId);
  if (!doc?.fields) return null;
  return {
    nonce:     doc.fields.nonce?.stringValue ?? "",
    expiresAt: Number(doc.fields.expiresAt?.integerValue ?? 0),
  };
}

async function deleteNonce(telegramId: string): Promise<void> {
  if (adminFirestore) {
    await adminFirestore.collection("tg_nonces").doc(telegramId).delete();
  } else {
    await restDelete("tg_nonces", telegramId);
  }
}

// ─── User helpers ─────────────────────────────────────────────────────────────
async function upsertUser(telegramId: string, walletAddress: string): Promise<void> {
  const data = { telegramId, walletAddress: walletAddress.toLowerCase(), updatedAt: Date.now() };
  if (adminFirestore) {
    await adminFirestore.collection("tg_users").doc(telegramId).set(data, { merge: true });
  } else {
    await restSet("tg_users", telegramId, data);
  }
}

async function getUser(telegramId: string): Promise<{ walletAddress: string } | null> {
  if (adminFirestore) {
    const snap = await adminFirestore.collection("tg_users").doc(telegramId).get();
    if (!snap.exists) return null;
    const d = snap.data()!;
    return d.walletAddress ? { walletAddress: d.walletAddress as string } : null;
  }
  const doc = await restGet("tg_users", telegramId);
  const w = doc?.fields?.walletAddress?.stringValue;
  return w ? { walletAddress: w } : null;
}

// ─── Telegram initData HMAC validation ───────────────────────────────────────
function validateInitData(initData: string): { telegramId: string; username?: string } | null {
  if (!BOT_TOKEN) {
    // Dev-mode: no HMAC check — accept any initData that has a user.id
    console.warn("[TG Auth] TELEGRAM_BOT_TOKEN not set — dev mode, skipping HMAC");
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
 * Step 1 — exchange Telegram initData for a nonce stored in Firestore.
 */
router.post("/auth/telegram", async (req: Request, res: Response) => {
  const { initData } = req.body;
  if (!initData) { res.status(400).json({ error: "initData is required" }); return; }

  const validated = validateInitData(initData);
  if (!validated) { res.status(401).json({ error: "Invalid Telegram initData" }); return; }

  const nonce = crypto.randomBytes(16).toString("hex");
  try {
    await saveNonce(validated.telegramId, nonce);
  } catch (err: any) {
    console.error("[TG Auth] saveNonce:", err.message);
    res.status(500).json({ error: "Could not store nonce — try again" });
    return;
  }

  res.json({
    telegramId: validated.telegramId,
    username:   validated.username,
    message:    `Sign this message to link your wallet to AGL Studio.\nNonce: ${nonce}`,
  });
});

/**
 * POST /api/miniapp/auth/wallet-link
 * Step 2 — verify EIP-191 signature, persist wallet link, issue JWT.
 */
router.post("/auth/wallet-link", async (req: Request, res: Response) => {
  const { telegramId, walletAddress, signature } = req.body;
  if (!telegramId || !walletAddress || !signature) {
    res.status(400).json({ error: "Missing telegramId, walletAddress, or signature" });
    return;
  }

  let stored: { nonce: string; expiresAt: number } | null;
  try { stored = await getNonce(telegramId); }
  catch { res.status(500).json({ error: "Nonce lookup failed" }); return; }

  if (!stored || Date.now() > stored.expiresAt) {
    res.status(401).json({ error: "Nonce expired — restart auth flow" });
    return;
  }

  const message = `Sign this message to link your wallet to AGL Studio.\nNonce: ${stored.nonce}`;

  let recovered: string;
  try { recovered = verifyMessage(message, signature); }
  catch { res.status(401).json({ error: "Signature verification failed" }); return; }

  if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
    res.status(401).json({ error: "Signature does not match wallet address" });
    return;
  }

  // Consume nonce immediately — prevents replay attacks
  await deleteNonce(telegramId).catch(() => {});

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

// ─── Fix #3 — Telegram Bot webhook (/link command) ───────────────────────────
/**
 * POST /api/miniapp/bot/webhook
 *
 * Register this URL with BotFather:
 *   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://YOUR_DOMAIN/api/miniapp/bot/webhook&secret_token=YOUR_WEBHOOK_SECRET"
 *
 * Handles /link — replies with an inline button that opens the Mini App.
 */
router.post("/bot/webhook", async (req: Request, res: Response) => {
  // Verify the update is genuinely from Telegram
  const secretHeader   = req.headers["x-telegram-bot-api-secret-token"];
  const webhookSecret  = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (webhookSecret && secretHeader !== webhookSecret) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const message = req.body?.message;
  const text    = (message?.text ?? "").trim();
  const chatId  = message?.chat?.id;

  // Always ACK Telegram — never leave it without a 200
  res.sendStatus(200);

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

// ─── Auth middleware (for protected routes) ───────────────────────────────────
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
