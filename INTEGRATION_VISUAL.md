# Agunnaya Labs - Smart Contract Integration Visual Guide

## System Architecture

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    AGUNNAYA LABS VIBE STUDIO ECOSYSTEM                    ║
╚═══════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER (React)                          │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │   Landing Page   │  │    Dashboard     │  │   AI Features    │   │
│  │                  │  │                  │  │                  │   │
│  │  ┌────────────┐  │  │  ┌────────────┐  │  │  ┌────────────┐  │   │
│  │  │   Logo     │  │  │  │ Sidebar    │  │  │  │ Generator  │  │   │
│  │  │  (FIXED)   │  │  │  │ (Mobile    │  │  │  │  (Credit   │  │   │
│  │  │            │  │  │  │  Hidden)   │  │  │  │   Gated)   │  │   │
│  │  └────────────┘  │  │  └────────────┘  │  │  └────────────┘  │   │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘   │
│           │                     │                     │               │
│           └─────────────────────┼─────────────────────┘               │
│                                 ▼                                      │
│                    ┌──────────────────────────┐                        │
│                    │  Wallet Context          │                        │
│                    │  (User Address, Signer)  │                        │
│                    └──────────┬───────────────┘                        │
└─────────────────────────────────┼──────────────────────────────────────┘
                                  │
                   ┌──────────────▼──────────────┐
                   │  BUY CREDITS MODAL (NEW)    │
                   │                            │
                   │  ┌────────────────────────┐│
                   │  │ Show exchange rate      ││
                   │  │ (Credits per AGL)       ││
                   │  │                         ││
                   │  │ Input: 100 AGL          ││
                   │  │ Preview: 50,000 credits ││
                   │  │                         ││
                   │  │ [BURN & PURCHASE]       ││
                   │  └────────────────────────┘│
                   └──────────────┬──────────────┘
                                  │
┌─────────────────────────────────▼──────────────────────────────────────┐
│              WEB3 INTEGRATION LAYER (aglTokenomics.ts)                 │
│                                                                        │
│  Functions:                                                           │
│  • previewCredits(aglAmount)                                          │
│  • purchaseCredits(aglAmount)                                         │
│  • checkAllowance(wallet, aglToken)                                   │
│  • approveAGL(aglAmount)                                              │
│  • watchCreditsPurchasedEvents()                                      │
│                                                                        │
│  Libraries: ethers.js v6 + Base RPC                                  │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
    ┌────────────────┐    ┌──────────────────┐    ┌──────────────────┐
    │  AGL Token     │    │  AGLCredits      │    │  Base Network    │
    │  (ERC-20)      │◄───►  Contract       │    │  RPC Endpoint    │
    │                │    │  (Source of     │    │                  │
    │  • approve()   │    │   Truth)        │    │  Chain ID: 8453  │
    │  • balanceOf() │    │                 │    │                  │
    │  • allowance() │    │  Functions:     │    │  PoW → PoS       │
    │                │    │  • purchaseC.() │    │                  │
    └────────────────┘    │  • previewC.()  │    │  ┌────────────┐  │
                          │  • views        │    │  │   Events   │  │
                          │                 │    │  │            │  │
                          │  • Burn Address │    │  │ CreditsPur-│  │
                          │    0x...dEaD    │    │  │ chased     │  │
                          │    (permanent)  │    │  │            │  │
                          └────────┬────────┘    │  │ Emission: ▶├─────┐
                                   │            │  │  Real-time │  │   │
                                   │            │  └────────────┘  │   │
                                   │            └──────────────────┘   │
                                   │                                   │
                                   ▼                                   │
                       ┌───────────────────────┐                      │
                       │  AGL Permanently      │                      │
                       │  Burned!              │                      │
                       │                       │                      │
                       │  Supply ↓ Inflation ↓ │                      │
                       │  Token Value ↑        │                      │
                       └───────────────────────┘                      │
                                                                       │
                                                                       │
                                                    ┌──────────────────┘
                                                    │
┌───────────────────────────────────────────────────▼────────────────────┐
│              BACKEND INDEXER SERVICE (Node.js + Ethers)               │
│                                                                       │
│  • Listens to CreditsPurchased events (real-time)                   │
│  • Validates transaction on-chain                                  │
│  • Parses event parameters                                         │
│  • Logs: { user, aglBurned, creditsGranted, txHash, timestamp }   │
│  • Calls Supabase API to update ledger                            │
│                                                                       │
│  Event Schema:                                                       │
│  CreditsPurchased(                                                  │
│    indexed address user,                                           │
│    uint256 aglBurned,                                             │
│    uint256 creditsGranted,                                        │
│    uint256 timestamp                                              │
│  )                                                                   │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │  SUPABASE (Real-time Ledger)  │
                    │                               │
                    │  Tables:                      │
                    │  • user_credits               │
                    │    - wallet_address (PK)      │
                    │    - balance                  │
                    │    - total_purchased          │
                    │    - total_burned_agl         │
                    │                               │
                    │  • credit_transactions        │
                    │    - wallet                   │
                    │    - agl_burned               │
                    │    - credits_purchased        │
                    │    - tx_hash                  │
                    │    - created_at               │
                    │                               │
                    │  • credit_usage_log           │
                    │    - wallet                   │
                    │    - feature_name             │
                    │    - credits_spent            │
                    │    - created_at               │
                    │                               │
                    │  Realtime: Enabled            │
                    │  RLS: Configured              │
                    └───────────────┬───────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
   │  API Endpoint│         │  API Endpoint│         │  API Endpoint│
   │              │         │              │         │              │
   │ GET /api/    │         │ POST /api/   │         │ POST /api/   │
   │ credits/     │         │ credits/     │         │ credits/     │
   │ balance      │         │ purchase     │         │ spend        │
   │              │         │              │         │              │
   │ Returns:     │         │ Params:      │         │ Params:      │
   │ • balance    │         │ • aglAmount  │         │ • wallet     │
   │ • total_p    │         │ • txHash     │         │ • feature    │
   │ • total_b    │         │              │         │ • amount     │
   └──────────────┘         │ Returns:     │         │              │
                            │ • credits_a  │         │ Returns:     │
                            │ • new_bal    │         │ • remaining  │
                            └──────────────┘         │ • used_today │
                                                     └──────────────┘
                                                             │
                    ┌────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │  FRONTEND REALTIME UPDATE  │
        │                           │
        │  SWR Hook:                │
        │  useSWR('/api/credits/    │
        │    balance?wallet=0x...')  │
        │                           │
        │  Updates:                 │
        │  • Balance displayed      │
        │  • Feature buttons        │
        │    (enabled/disabled)     │
        │  • Usage chart            │
        │  • Remaining credits      │
        └───────────────────────────┘
```

---

## User Flow Diagram

### Scenario 1: Purchase Credits

```
User Opens Vibe Studio
  │
  ├─→ [Checks Wallet Connected]
  │     │
  │     └─→ [Show "Connect Wallet" if needed]
  │
  ├─→ [Loads Credits Balance from Supabase]
  │     │
  │     └─→ [Displays current balance: 1,000 credits]
  │
  ├─→ [User clicks "Buy More Credits"]
  │     │
  │     └─→ [BuyCreditsModal Opens]
  │           │
  │           ├─→ [Fetches current exchange rate from contract]
  │           │   [Shows: 500 credits per 1 AGL]
  │           │
  │           ├─→ [User enters: 100 AGL]
  │           │
  │           ├─→ [Live preview updates: 50,000 credits]
  │           │
  │           └─→ [User clicks "Burn & Purchase"]
  │                 │
  │                 ├─→ Wallet Confirmation:
  │                 │   • Check if wallet has 100 AGL
  │                 │   • Check if 100 AGL approved for contract
  │                 │   │
  │                 │   └─→ [If not approved, request approval]
  │                 │       └─→ User approves AGL spending
  │                 │
  │                 ├─→ [Transaction submitted to Base]
  │                 │   • Method: purchaseCredits(100e18)
  │                 │   • Gas: ~50k
  │                 │   • Status: Pending
  │                 │
  │                 ├─→ [Modal shows: "Burning AGL..."]
  │                 │
  │                 ├─→ [Transaction Confirmed on Base]
  │                 │   • Emit: CreditsPurchased(user, 100e18, 50000e18, timestamp)
  │                 │   • 100 AGL → 0x...dEaD (burned permanently)
  │                 │
  │                 ├─→ [Indexer Service catches event]
  │                 │   • Parses event parameters
  │                 │   • Validates transaction
  │                 │   • Calls Supabase API
  │                 │
  │                 ├─→ [Supabase updates:]
  │                 │   • user_credits.balance += 50,000
  │                 │   • user_credits.total_purchased += 50,000
  │                 │   • user_credits.total_burned_agl += 100e18
  │                 │   • Logs in credit_transactions
  │                 │
  │                 ├─→ [Frontend receives realtime update]
  │                 │   • SWR hook refreshes balance
  │                 │   • Display: "51,000 credits available"
  │                 │
  │                 └─→ [Modal closes with success message]
  │                      "✓ 50,000 credits added!"
  │
  └─→ User can now use features with credits
```

### Scenario 2: Use Feature with Credits

```
User Opens AI Code Generator
  │
  ├─→ [Feature shows: Cost = 42 credits]
  │
  ├─→ [Fetches balance from Supabase: 51,000 credits]
  │
  ├─→ [Button enabled: "Generate Code (42 credits)"]
  │
  ├─→ [User clicks button]
  │     │
  │     ├─→ Frontend checks: 51,000 >= 42? YES ✓
  │     │
  │     ├─→ POST /api/ai/generate-code
  │     │   • wallet: 0x...
  │     │   • prompt: "function to add numbers"
  │     │
  │     ├─→ Backend receives request:
  │     │   │
  │     │   ├─→ Verify wallet has >= 42 credits
  │     │   │   SELECT balance FROM user_credits WHERE wallet = 0x...
  │     │   │   [Returns: 51,000]
  │     │   │
  │     │   ├─→ Call AI API (Anthropic/OpenAI)
  │     │   │   • Generate code
  │     │   │   • Get response
  │     │   │
  │     │   ├─→ Deduct credits from Supabase
  │     │   │   UPDATE user_credits
  │     │   │   SET balance = balance - 42
  │     │   │   WHERE wallet = 0x...
  │     │   │
  │     │   ├─→ Log usage
  │     │   │   INSERT INTO credit_usage_log
  │     │   │   (wallet, feature_name, credits_spent, request_id)
  │     │   │
  │     │   └─→ Return generated code + new balance
  │     │
  │     ├─→ Frontend receives response:
  │     │   {
  │     │     code: "function add(a, b) { return a + b; }",
  │     │     remaining: 50958
  │     │   }
  │     │
  │     ├─→ Display code to user
  │     │
  │     ├─→ Update UI:
  │     │   • "50,958 credits remaining"
  │     │   • "Used 42 credits on code generation"
  │     │   • "Daily spend: 84 credits"
  │     │
  │     └─→ Log usage in analytics
  │
  └─→ User can continue using features until credits run out
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRANSACTION FLOW                             │
└─────────────────────────────────────────────────────────────────┘

USER WALLET (MetaMask)
  │
  │ Has: 1,000 AGL + ETH for gas
  │
  ├─→ approveAGL(AGLCredits address, 100e18)
  │   │
  │   ├─→ AGL Token Contract receives call
  │   │   • owner = User Wallet
  │   │   • spender = AGLCredits Contract
  │   │   • amount = 100e18
  │   │
  │   ├─→ Stores allowance: allowance[user][AGLCredits] = 100e18
  │   │
  │   └─→ Emits Approval event
  │
  ├─→ purchaseCredits(100e18)
  │   │
  │   ├─→ AGLCredits Contract receives call
  │   │   │
  │   │   ├─→ Check: not paused? ✓
  │   │   │
  │   │   ├─→ Calculate: 100e18 * 500 / 10^18 = 50,000 credits
  │   │   │
  │   │   ├─→ Update state:
  │   │   │   • totalCreditsPurchased[user] += 50,000
  │   │   │   • totalAGLBurnedBy[user] += 100e18
  │   │   │   • totalAGLBurned += 100e18
  │   │   │
  │   │   ├─→ Emit CreditsPurchased event
  │   │   │   (user, 100e18, 50000e18, block.timestamp)
  │   │   │
  │   │   └─→ Call: aglToken.safeTransferFrom(
  │   │       from: user,
  │   │       to: 0x...dEaD (BURN ADDRESS),
  │   │       amount: 100e18
  │   │     )
  │   │
  │   ├─→ AGL Token transfers 100 AGL to dead address
  │   │   │
  │   │   └─→ PERMANENTLY BURNED ✗ (can't be recovered)
  │   │
  │   └─→ Transaction confirmed on Base
  │
  ├─→ Block Explorer (BaseScan) shows:
  │   • From: User Wallet
  │   • To: AGLCredits Contract
  │   • Function: purchaseCredits
  │   • Value: 100 AGL
  │   • Status: Success ✓
  │   • Hash: 0x...
  │
  └─→ EVENT LISTENER catches emission
      │
      ├─→ Reads logs from transaction receipt
      │   • user = 0xUser
      │   • aglBurned = 100000000000000000000
      │   • creditsGranted = 50000000000000000000
      │   • timestamp = 1706123456
      │
      ├─→ Supabase API call:
      │   POST /credit-purchase
      │   {
      │     "wallet": "0xUser",
      │     "aglAmount": "100000000000000000000",
      │     "creditsAmount": "50000000000000000000",
      │     "txHash": "0x...",
      │     "timestamp": 1706123456
      │   }
      │
      ├─→ Supabase updates tables:
      │   │
      │   ├─→ UPDATE user_credits
      │   │   SET balance = balance + 50000e18,
      │   │       total_purchased = total_purchased + 50000e18,
      │   │       total_burned_agl = total_burned_agl + 100e18
      │   │   WHERE wallet_address = '0xUser'
      │   │
      │   └─→ INSERT INTO credit_transactions
      │       (wallet, agl_burned, credits_purchased, tx_hash, created_at)
      │
      └─→ Frontend subscribed to realtime updates
          │
          ├─→ Receives Supabase update
          │
          └─→ Re-renders CreditBalance component
              • Before: "1,000 credits"
              • After: "51,000 credits"

```

---

## State Management

```
┌────────────────────────────────────────────────────────────────┐
│                 WHERE DATA LIVES                               │
└────────────────────────────────────────────────────────────────┘

📦 COMPONENT STATE (React)
├── UI state (modals open/closed)
├── Loading states (pending transactions)
├── Error messages (connection failures)
└── Temporary form inputs (before submission)

⛓️ BLOCKCHAIN STATE (Base Chain)
├── AGLCredits contract:
│   ├── totalCreditsPurchased[wallet] (permanent history)
│   ├── totalAGLBurnedBy[wallet] (permanent history)
│   ├── creditsPerAGL (owner-controlled)
│   └── totalAGLBurned (protocol stats)
└── AGL Token contract:
    ├── balances[wallet]
    ├── allowances[owner][spender]
    └── totalSupply (reduced by burns)

💾 DATABASE STATE (Supabase)
├── user_credits
│   ├── wallet_address (primary key)
│   ├── balance (real-time, mutable)
│   ├── total_purchased (historical)
│   └── total_burned_agl (historical)
├── credit_transactions (immutable log)
└── credit_usage_log (analytics)

🔄 DERIVED STATE (Computed)
├── remainingCredits = balance - used
├── dailyBurnRate = sum(credits_spent today)
├── exchangeRate = creditsPerAGL from contract
└── percentageUsed = (total_purchased - balance) / total_purchased

⚠️ SOURCE OF TRUTH HIERARCHY
1st: Blockchain (AGLCredits contract) - immutable, auditable
2nd: Supabase ledger - for performance & real-time updates
3rd: Component state - temporary UI state only
```

---

## Security Layers

```
┌──────────────────────────────────────────────────────────────┐
│                SECURITY ARCHITECTURE                         │
└──────────────────────────────────────────────────────────────┘

🔐 SMART CONTRACT LEVEL
├── ReentrancyGuard (prevent reentrant calls)
├── Pausable (emergency shutdown)
├── Permanent burn (no recovery possible)
├── Safe ERC20 transfers (no failed transfers)
├── Owner controls (rate updates, pause)
└── Read-only functions (safe public view)

🔐 BLOCKCHAIN LEVEL
├── Base network security (Ethereum L2)
├── Transaction signatures (immutable)
├── Block finality (1-2 blocks confirmations)
└── Public auditability (anyone can verify on BaseScan)

🔐 BACKEND LEVEL
├── Environment variables (no secrets in code)
├── Rate limiting (prevent DoS)
├── Input validation (prevent injection)
├── Server-side credit deduction (not client-side)
├── Transaction verification (validate receipts)
├── Database RLS (row-level security)
└── Audit logging (all modifications logged)

🔐 FRONTEND LEVEL
├── Wallet connection security (MetaMask handles keys)
├── Transaction signing (user confirmation)
├── Constant address verification (0x...dEaD immutable)
├── No localStorage for credits (Supabase only)
├── HTTPS only (no man-in-the-middle)
└── CSP headers (prevent XSS attacks)

🔐 OPERATIONAL LEVEL
├── Monitoring & alerts (unusual activity)
├── Rate limits per wallet
├── Maximum purchase limits
├── Pause capability (emergency)
├── Rollback procedures (if compromise)
└── Regular security audits
```

---

## Performance Characteristics

```
┌──────────────────────────────────────────────────────────────┐
│                    LATENCY BUDGET                            │
└──────────────────────────────────────────────────────────────┘

Operation                           Latency         Source
─────────────────────────────────────────────────────────────
1. View balance (read)              <100ms          Supabase
2. Preview credits (contract view)  <200ms          Base RPC
3. Check allowance (contract view)  <200ms          Base RPC
4. Approve AGL (transaction)        ~2-5s (pending) + wallet
                                    1-2 blocks      Base network
5. Purchase credits (transaction)   ~2-5s (pending) + wallet
                                    1-2 blocks      Base network
6. Update balance (indexer)         ~30s            Event + Supabase
7. Spend credits (API call)         <100ms          Backend
8. Use feature (AI generation)      5-30s           Anthropic API
─────────────────────────────────────────────────────────────

TOTAL TIME FOR COMPLETE PURCHASE FLOW
├── User interaction:              ~10 seconds
├── Wallet confirmation:           ~5 seconds
├── Transaction pending:           ~2-5 seconds
├── Block confirmation:            ~12 seconds
├── Indexer processing:            ~30 seconds
├── Balance update visible:        ~30 seconds
└─────────────────────────────────────────
   TOTAL:                          ~1-2 minutes

USER SEES:
[Click Purchase] → [Confirm in Wallet] → [Pending...] → [✓ Success!]
     <2s              <5s               5-30s          Then refresh
```

---

## Summary: How It All Fits Together

The **AGLCredits smart contract** is the **tokenomics engine** for Vibe Studio:

1. **Users** buy compute credits with AGL tokens
2. **Tokens** are permanently burned (deflationary)
3. **Purchase recorded** on-chain (permanent audit trail)
4. **Event emitted** to update off-chain ledger
5. **Credits indexed** in Supabase (real-time)
6. **Features gate** credit spending
7. **Backend enforces** deductions server-side
8. **Analytics tracked** for insights

This creates a **sustainable, Web3-native monetization model** where:
- ✅ Revenue is aligned with token value
- ✅ Users have skin in the game (burn AGL)
- ✅ Platform is transparent (on-chain record)
- ✅ No third-party payment processor needed
- ✅ Global, permissionless access

**Result**: A fully decentralized compute marketplace powered by AGL tokenomics.
