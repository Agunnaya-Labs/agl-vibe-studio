/**
 * AGL Credits — client-side utilities
 * Interfaces with /api/credits/* and the AGLCredits contract via MetaMask.
 */

export interface CreditBalance {
  totalCreditsPurchased: number;
  creditsSpent: number;
  creditsRemaining: number;
  totalAGLBurnedBy: string;        // formatted (e.g. "0.5")
  creditsPerAGL: number;           // credits per 1 whole AGL
  totalProtocolAGLBurned: string;  // formatted
  aglTokenAddress: string;
  costs: Record<string, number>;
}

/** Credit cost for each AI call type — keep in sync with server CREDIT_COSTS */
export const CREDIT_COSTS = {
  build: 50,
  'agent-chat': 5,
  'draft-email': 10,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

export async function fetchCreditBalance(address: string): Promise<CreditBalance> {
  const res = await fetch(`/api/credits/balance/${address}`);
  if (!res.ok) throw new Error('Failed to fetch credit balance from server.');
  return res.json();
}

/**
 * Preview how many credits a given AGL amount (as a human-readable string like "0.5") yields.
 */
export async function previewCreditsForAmount(aglAmountHuman: string): Promise<number> {
  try {
    // Use ethers to convert to wei
    const aglWei = BigInt(Math.floor(parseFloat(aglAmountHuman) * 1e18)).toString();
    const res = await fetch(`/api/credits/preview/${aglWei}`);
    if (!res.ok) return 0;
    const { credits } = await res.json();
    return credits;
  } catch {
    return 0;
  }
}

/**
 * Purchase credits by burning AGL tokens via real MetaMask.
 * Runs the two-step approve → purchaseCredits flow.
 *
 * @param aglAmountHuman  Human-readable AGL amount (e.g. "0.5")
 * @param aglTokenAddress On-chain AGL token contract address
 * @param onStatus        Callback for status updates shown in the UI
 * @returns Transaction hash of the purchaseCredits tx
 */
export async function purchaseCreditsWithMetaMask(
  aglAmountHuman: string,
  aglTokenAddress: string,
  onStatus: (msg: string) => void
): Promise<string> {
  const eth = (window as any).ethereum;
  if (!eth) {
    throw new Error('MetaMask not detected. Install MetaMask to purchase credits on Base Mainnet.');
  }

  // Dynamic imports — only loaded when the user actually tries to buy
  const { ethers: e } = await import('ethers');
  const { approveAGL, purchaseCredits } = await import('./aglTokenomics');

  const provider = new e.BrowserProvider(eth);
  const signer = await provider.getSigner();
  const aglWei = e.parseUnits(aglAmountHuman, 18);

  onStatus('Step 1/2 — Requesting AGL spend approval in MetaMask…');
  await approveAGL(signer, aglTokenAddress, aglWei);

  onStatus('Step 2/2 — Burning AGL for credits…');
  const txHash = await purchaseCredits(signer, aglWei);

  return txHash;
}
