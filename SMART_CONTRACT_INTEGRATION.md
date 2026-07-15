# AGLCredits Smart Contract Integration with Vibe Studio

## Executive Summary

The `AGLCredits` contract (deployed on Base blockchain at `0x13866F31c60822Ff70684213b9727915Ddf2c183`) is the **on-chain source of truth** for the tokenomics layer of Agunnaya Labs' Vibe Studio platform. It implements a **burn-for-credits** model where users permanently burn AGL tokens to receive compute credits for powering AI/developer tools within the studio.

---

## Architecture Overview

### The Flow

```
User → Wallet (has AGL) 
    ↓
Burn AGL via AGLCredits.purchaseCredits()
    ↓
AGL transferred to 0x...dEaD (permanent burn)
    ↓
CreditsPurchased event emitted with (user, aglAmount, creditsGranted, timestamp)
    ↓
Vercel + Supabase off-chain indexer listens to event
    ↓
Supabase real-time ledger updates user's credit balance
    ↓
Vibe Studio frontend/backend deducts credits per AI call
    ↓
Credits spent (off-chain ledger), AGL permanently removed from circulation
```

### Key Design Principle: Dual Ledger

- **On-Chain (AGLCredits Contract)**: Immutable record of all AGL burned. Acts as the source of truth for auditing and verification.
- **Off-Chain (Supabase)**: Real-time credit ledger for fast, low-latency metering of individual API calls (burning AGL per keystroke would be impractical due to block confirmation times and gas costs).

---

## How It Fits Vibe Studio

### 1. **Monetization & Tokenomics**

**Current State (Before Integration)**
- Vibe Studio offers developer tools, AI prompts, code generation
- Usage is currently free or limited

**With AGLCredits Integration**
- Premium features require spending AGL credits
- Users must burn AGL tokens to access compute-intensive features
- Creates sustainable revenue model aligned with token value

**Benefits:**
- Utility-driven demand for AGL token
- Deflationary mechanism (tokens permanently burned, not locked)
- Transparent on-chain record of platform usage metrics

### 2. **User Flows to Implement**

#### A. Top-Up Credits Flow
```
User opens Vibe Studio → Sees "Buy Credits"
    ↓
Shows current credit balance (from Supabase)
    ↓
User enters AGL amount or clicks preset (e.g., 100 AGL)
    ↓
UI shows preview: "100 AGL = X credits @ current rate"
    ↓
User clicks "Burn & Purchase"
    ↓
Wallet confirms transaction (MetaMask, Frame, etc.)
    ↓
Transaction sent to Base network
    ↓
AGLCredits.purchaseCredits() executes
    ↓
Event emitted → Supabase indexer updates ledger
    ↓
UI shows "✓ X credits added to your account"
```

#### B. Feature Usage with Credit Deduction
```
User runs "AI Code Generator"
    ↓
Frontend checks Supabase: user has 500 credits
    ↓
Calls /api/generate-code with user's wallet address
    ↓
Backend checks Supabase: user has 500 credits
    ↓
Executes Anthropic API call (or other AI provider)
    ↓
Response received, costs 42 credits
    ↓
Backend: UPDATE users SET credits = credits - 42 WHERE wallet = user
    ↓
Response returned to user
    ↓
UI updates: "458 credits remaining"
```

---

## Technical Integration Points

### 1. **Wallet Connection**

The existing `WalletModal` and wallet context in Vibe Studio already handles:
- ✅ Wallet connection (MetaMask, WalletConnect, etc.)
- ✅ User address tracking
- ✅ Transaction signing

**No changes needed** — reuse existing wallet infrastructure.

### 2. **Contract Interaction Layer** (New)

Create `/src/lib/agltokenomics.ts`:

```typescript
import { ethers } from 'ethers';
import { AGLCredits_ABI } from '@/lib/abis/AGLCredits.json';

const CONTRACT_ADDRESS = '0x13866F31c60822Ff70684213b9727915Ddf2c183';
const BASE_RPC = 'https://base.publicnode.com'; // or your Alchemy/Infura endpoint

export async function purchaseCredits(
  signer: ethers.Signer,
  aglAmountWei: bigint
): Promise<string> {
  const contract = new ethers.Contract(CONTRACT_ADDRESS, AGLCredits_ABI, signer);
  const tx = await contract.purchaseCredits(aglAmountWei);
  return tx.hash;
}

export async function previewCredits(aglAmountWei: bigint): Promise<bigint> {
  const provider = new ethers.JsonRpcProvider(BASE_RPC);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, AGLCredits_ABI, provider);
  return contract.previewCredits(aglAmountWei);
}

export async function getUserCreditHistory(walletAddress: string): Promise<{
  totalAGLBurned: bigint;
  totalCreditsPurchased: bigint;
}> {
  const provider = new ethers.JsonRpcProvider(BASE_RPC);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, AGLCredits_ABI, provider);
  
  const [burned, credits] = await Promise.all([
    contract.totalAGLBurnedBy(walletAddress),
    contract.totalCreditsPurchased(walletAddress),
  ]);
  
  return { totalAGLBurned: burned, totalCreditsPurchased: credits };
}
```

### 3. **Supabase Indexer Setup** (New)

Create a backend service that:

**Listens to contract events:**
```typescript
import { ethers } from 'ethers';
import { supabase } from '@/lib/supabase';

const provider = new ethers.JsonRpcProvider('https://base.publicnode.com');
const contract = new ethers.Contract(CONTRACT_ADDRESS, AGLCredits_ABI, provider);

// Listen to CreditsPurchased events
contract.on('CreditsPurchased', async (user, aglBurned, creditsGranted, timestamp) => {
  // Add credits to user's Supabase ledger
  await supabase
    .from('user_credits')
    .update({ balance: supabase.rpc('add_credits', { amount: creditsGranted }) })
    .eq('wallet_address', user);

  // Log transaction
  await supabase.from('credit_transactions').insert({
    wallet: user,
    agl_burned: aglBurned.toString(),
    credits_purchased: creditsGranted.toString(),
    tx_hash: /* get from event logs */,
    created_at: new Date(timestamp * 1000),
  });
});
```

### 4. **Frontend Components to Create**

#### A. `<BuyCreditsModal />`
```
Shows:
- Current credit balance (from Supabase)
- AGL input field
- Live preview of credits to receive
- Current exchange rate (from contract)
- "Burn & Purchase" button
- Transaction status (pending → confirmed)
```

#### B. `<CreditBalance />`
```
Shows:
- Remaining credits (from Supabase)
- Credits used this session
- Total AGL burned (lifetime)
- Link to BurnHistory
```

#### C. `<CreditBurnHistory />`
```
Table showing:
- Date burned
- AGL amount
- Credits received
- Current rate used
- TX hash (link to BaseScan)
```

#### D. `<CreditUsageChart />`
```
Display:
- Credits used per feature (pie chart)
- Daily spend trend (line chart)
- Estimated credits remaining (runway)
```

### 5. **Database Schema** (Supabase)

```sql
-- User credit account
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  balance BIGINT DEFAULT 0,
  total_purchased BIGINT DEFAULT 0,
  total_burned_agl BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Credit transaction history
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL,
  agl_burned NUMERIC(78, 0) NOT NULL,
  credits_purchased BIGINT NOT NULL,
  tx_hash TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL
);

-- Usage log per feature
CREATE TABLE credit_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL,
  feature_name TEXT NOT NULL,  -- "ai-code-gen", "prompt-library", etc.
  credits_spent BIGINT NOT NULL,
  request_id TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_wallet ON user_credits(wallet_address);
CREATE INDEX idx_usage_wallet_date ON credit_usage_log(wallet, created_at);
```

### 6. **API Routes to Create**

#### `GET /api/credits/balance` 
```
Query: { wallet: "0x..." }
Response: { balance: 1000, total_purchased: 5000, total_burned: 5 }
```

#### `POST /api/credits/purchase`
```
Body: { aglAmount: "100" (in wei), txHash: "0x..." }
Effect: Verify transaction on Base, add credits to Supabase
Response: { credits_added: 50000, new_balance: 51000 }
```

#### `POST /api/credits/spend`
```
Body: { wallet: "0x...", feature: "ai-code-gen", amount: 42 }
Effect: Deduct credits, log usage
Response: { remaining: 958, used_today: 100 }
```

#### `GET /api/credits/history`
```
Query: { wallet: "0x...", limit: 50 }
Response: [ { date, agl_burned, credits, tx_hash }, ... ]
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Create ABI file for AGLCredits contract
- [ ] Build `agltokenomics.ts` library
- [ ] Set up Supabase tables
- [ ] Write indexer service (Node.js/TypeScript)
- [ ] Create wallet integration tests

### Phase 2: UI Components (Week 2-3)
- [ ] Build `<BuyCreditsModal />`
- [ ] Build `<CreditBalance />` widget
- [ ] Add to Header/Dashboard
- [ ] Connect to wallet context
- [ ] Test purchase flow

### Phase 3: Backend Integration (Week 3-4)
- [ ] Create API routes (/api/credits/*)
- [ ] Wire up credit deduction in AI features
- [ ] Add usage logging
- [ ] Build credit limit enforcement

### Phase 4: Polish & Analytics (Week 4-5)
- [ ] Build analytics dashboard
- [ ] Add transaction history UI
- [ ] Create burn history charts
- [ ] Set up monitoring/alerts
- [ ] User documentation

---

## Security Considerations

### 1. **Contract Level**
- ✅ ReentrancyGuard protects against reentrancy
- ✅ Pausable allows emergency halt
- ✅ Tokens sent to immutable dead address (permanent burn)
- ✅ Uses SafeERC20 for safe token transfer

### 2. **Backend Level**
- Verify transaction receipt before crediting (prevent double-spending)
- Use server-side credit deduction (never trust client)
- Implement rate limiting on purchase endpoint
- Log all credit modifications with timestamps
- Use wallet signing for sensitive operations

### 3. **Frontend Level**
- Never store credits in localStorage (source of truth is Supabase)
- Always fetch fresh balance before showing to user
- Validate contract address before sending transactions
- Show clear transaction status (pending → confirmed → failed)

---

## Example: Adding AI Feature with Credits

```typescript
// /src/pages/Dashboard/AICodeGenerator.tsx

import { useWallet } from '@/contexts/WalletContext';
import { spendCredits } from '@/lib/supabase';
import { useQuery } from 'swr';

export function AICodeGenerator() {
  const { address } = useWallet();
  const { data: balance } = useQuery(`/api/credits/balance?wallet=${address}`);
  
  const FEATURE_COST = 42; // credits per generation
  
  async function handleGenerate(prompt: string) {
    if (!balance || balance.balance < FEATURE_COST) {
      setError('Insufficient credits. Purchase more to continue.');
      return;
    }
    
    try {
      const response = await fetch('/api/ai/generate-code', {
        method: 'POST',
        body: JSON.stringify({ prompt, wallet: address }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Backend already deducted credits
        setCode(result.code);
        setBalance(prev => prev - FEATURE_COST);
      }
    } catch (err) {
      setError('Generation failed. Credits not deducted.');
    }
  }
  
  return (
    <div>
      <h2>AI Code Generator</h2>
      <p>Credits available: {balance?.balance || 0}</p>
      <p>Cost per generation: {FEATURE_COST}</p>
      <button 
        onClick={() => handleGenerate(prompt)}
        disabled={!balance || balance.balance < FEATURE_COST}
      >
        Generate (Costs {FEATURE_COST} credits)
      </button>
    </div>
  );
}
```

---

## Monitoring & Metrics

Track:
- Daily AGL burned volume
- Average credits purchased per user
- Credit burn rate per feature
- Exchange rate history
- Contract pause events
- Failed purchase transactions

---

## External Resources

- **Contract on BaseScan**: https://basescan.org/address/0x13866F31c60822Ff70684213b9727915Ddf2c183#code
- **Base Network Docs**: https://docs.base.org/
- **ethers.js**: https://docs.ethers.org/
- **Supabase Realtime**: https://supabase.com/docs/guides/realtime

---

## Next Steps

1. Review contract code with security team
2. Deploy indexer service to production
3. Set up Supabase tables and RLS policies
4. Begin Phase 1 implementation
5. Conduct security audit before mainnet usage
