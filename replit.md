# Agunnaya Labs Studio (v2.5)

A full-stack, AI-powered decentralized developer studio for Base Mainnet and Sepolia Sandbox.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + Vite
- **Backend**: Express.js server (`server.ts`) with Vite middleware in dev mode
- **AI**: Google Gemini via `@google/genai` SDK (server-side proxied)
- **Blockchain**: ethers.js v6 — Base Mainnet + Sepolia multi-node RPC failover
- **Database**: Firebase Firestore (client SDK for frontend; REST API for server-side auth routes)
- **Auth**: Firebase Auth (Google sign-in) + Telegram Mini App HMAC + JWT (SESSION_SECRET)

## Running the App

```bash
npm run dev      # Dev server on port 3000 (tsx + Vite middleware)
npm run build    # Vite frontend build + esbuild server bundle → dist/
npm run start    # Production: node dist/server.cjs
npm run lint     # TypeScript type check (tsc --noEmit)
```

## Project Structure

```
server.ts                        # Express server (AI endpoints, auth routes, Vite middleware)
src/
  App.tsx                        # Root component — tab routing, global wallet/auth state
  types.ts                       # Shared TypeScript interfaces
  components/                    # Reusable UI widgets
  pages/                         # One file per studio page/tab
  hooks/
    useWalletLink.ts             # Telegram Mini App → wallet linking hook (ethers-based)
  server/
    miniapp-auth.routes.ts       # Express router: Telegram auth + wallet-link endpoints
  lib/
    firebase.ts                  # Firebase init (client SDK + Firestore)
    db.ts                        # AgunnayaDatabase — in-memory data store
    tokenFactory.ts              # Base RPC helpers
    gemini.ts                    # Gemini client helpers
firebase-applet-config.json      # Firebase web config (projectId, apiKey, databaseId, etc.)
firestore.rules                  # Firestore security rules
```

## Required Secrets (Replit Secrets panel)

| Secret | Purpose |
|---|---|
| `GEMINI_API_KEY` | Google Gemini AI — all AI endpoints |
| `SESSION_SECRET` | JWT signing key for Telegram Mini App sessions (32+ chars) |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot token from @BotFather — HMAC initData validation |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON — enables Admin SDK (privileged Firestore writes, bypasses security rules). Get from Firebase Console → Project Settings → Service Accounts → Generate New Private Key. |
| `TELEGRAM_WEBHOOK_SECRET` | Optional random string to authenticate incoming Telegram webhook updates. Pass as `secret_token` when registering the webhook URL. |

## Telegram Mini App Integration

Three new server endpoints mounted at `/api/miniapp/`:

| Method | Path | Description |
|---|---|---|
| POST | `/api/miniapp/auth/telegram` | Exchange Telegram `initData` for a nonce |
| POST | `/api/miniapp/auth/wallet-link` | Submit wallet signature → receive 12-hour JWT |
| GET | `/api/miniapp/auth/user/:telegramId` | Look up a linked wallet address |

The frontend hook is at `src/hooks/useWalletLink.ts`. The UI page is at **Sidebar → Telegram Wallet Link**.

JWT is signed with `SESSION_SECRET`. User records (`telegramId` + `walletAddress`) are persisted to the `tg_users` Firestore collection.

## User Preferences

- Keep the existing project structure and stack — do not restructure or migrate.
- Use the AGL Vibe Studio immersive UI design language (glassmorphism, `#050505` background, `brand-purple` / `brand-blue` accents) for any new UI.
