# Agunnaya Labs Studio (v2.4)

A full-stack AI-powered decentralized developer studio for Base Mainnet and Sepolia Sandbox.

## Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + Vite
- **Backend**: Express.js server (`server.ts`) with Vite middleware in dev mode
- **AI**: Google Gemini (`@google/generative-ai`) — server-side via `GEMINI_API_KEY`
- **Auth/Data**: Firebase (Firestore, Auth) — client-side via `VITE_FIREBASE_*` secrets
- **Blockchain**: ethers.js + web3.js for Base Mainnet & Sepolia interactions

## Running the app

```
npm run dev      # Dev server on port 5000 (Vite + Express)
npm run build    # Build frontend (Vite) + bundle server (esbuild → dist/server.cjs)
npm run start    # Run production build
npm run lint     # TypeScript type check
npm run clean    # Remove dist/ and cached outputs
```

The workflow **"Start application"** runs `npm run dev` and serves on port 5000.

## Required secrets (set in Replit Secrets)

| Secret | Description |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio API key for AI features |
| `VITE_FIREBASE_API_KEY` | Firebase project API key |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_DATABASE_URL` | Firebase Realtime Database URL |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

## Environment variables (shared)

| Variable | Value |
|---|---|
| `NODE_ENV` | `development` |
| `PORT` | `5000` |

## Notes

- The server reads `PORT` from the environment (defaults to 5000). Replit webview requires port 5000.
- Firebase Firestore must be enabled in the Firebase Console for data features to work.
- AI features (contract generation, agent chat) require `GEMINI_API_KEY` to be set.
- The Gemini client is lazy-loaded — the server starts even if the key is missing; AI endpoints return a 500 error instead.
