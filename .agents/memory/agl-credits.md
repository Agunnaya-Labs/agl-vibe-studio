---
name: AGLCredits contract integration
description: How the AGLCredits on-chain contract is wired into the app's AI endpoints and credits widget.
---

## Deployed addresses (Base Mainnet, chain 8453)
- AGLCredits contract: `0x13866F31c60822Ff70684213b9727915Ddf2c183`
- AGL token (from `aglToken()` view): `0xEA1221B4d80A89BD8C75248Fae7c176BD1854698`
- Exchange rate (on-chain): 1,000 credits per 1 AGL burned

## Architecture
- `src/lib/aglTokenomics.ts` — ethers.js read/write helpers for the contract (already existed)
- `src/lib/credits.ts` — client-side utilities: `fetchCreditBalance`, `previewCreditsForAmount`, `purchaseCreditsWithMetaMask`
- `src/components/CreditsWidget.tsx` — header chip + popover: shows live balance, costs per AI call, approve+burn flow
- `server.ts` — `checkAndDeductCredits` middleware on all three AI endpoints; `/api/credits/balance/:address` and `/api/credits/preview/:aglWei` endpoints; in-memory `spendLedger` Map

## Credit costs (server CREDIT_COSTS, mirrored in client CREDIT_COSTS)
- `build` (contract generation): 50 credits
- `agent-chat` (per message): 5 credits
- `draft-email`: 10 credits

## Enforcement rules
- Wallets with 0 on-chain credits pass through freely (sandbox users unblocked)
- Wallets with real credits but exhausted → 402 with `creditsNeeded` / `creditsRemaining`
- RPC failure → non-blocking, call proceeds

**Why:** The contract's `totalCreditsPurchased` mapping is the on-chain source of truth for purchases; spend tracking is in-memory on the server (upgrade: persist to Firestore with firebase-admin).

## Purchase flow (MetaMask required)
1. User enters AGL amount in CreditsWidget → live preview via `/api/credits/preview/:aglWei`
2. Click "Burn AGL → Get Credits" → `approveAGL(signer, aglTokenAddress, aglWei)` then `purchaseCredits(signer, aglWei)`
3. Contract emits `CreditsPurchased` event; `totalCreditsPurchased` increments on-chain
4. Widget auto-refreshes balance after 4s
