/**
 * aglTokenomics.ts — on-chain AGL token interaction helpers.
 *
 * Used by credits.ts to execute the approve → purchaseCredits flow
 * on the AGLCredits contract via a real MetaMask signer.
 */
import type { Signer, BigNumberish } from "ethers";

const AGL_CREDITS_ADDRESS = "0x13866F31c60822Ff70684213b9727915Ddf2c183";

const ERC20_APPROVE_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
];

const AGL_CREDITS_ABI = [
  "function purchaseCredits(uint256 aglAmount) external",
  "function totalCreditsPurchased(address) view returns (uint256)",
  "function creditsPerAGL() view returns (uint256)",
  "function aglToken() view returns (address)",
];

/**
 * Approve the AGLCredits contract to spend `aglWei` AGL tokens
 * on behalf of the signer.  Waits for the approval tx to be mined.
 */
export async function approveAGL(
  signer: Signer,
  aglTokenAddress: string,
  aglWei: BigNumberish
): Promise<void> {
  // Dynamic import so this module is only loaded when actually needed
  const { Contract } = await import("ethers");
  const tokenContract = new Contract(aglTokenAddress, ERC20_APPROVE_ABI, signer);
  const tx = await tokenContract.approve(AGL_CREDITS_ADDRESS, aglWei);
  await tx.wait();
}

/**
 * Call purchaseCredits on the AGLCredits contract.
 * The AGL tokens must have been approved first via `approveAGL`.
 * @returns The transaction hash string.
 */
export async function purchaseCredits(
  signer: Signer,
  aglWei: BigNumberish
): Promise<string> {
  const { Contract } = await import("ethers");
  const creditsContract = new Contract(AGL_CREDITS_ADDRESS, AGL_CREDITS_ABI, signer);
  const tx = await creditsContract.purchaseCredits(aglWei);
  await tx.wait();
  return tx.hash as string;
}

/**
 * Read the live AGL price from a JsonRpcProvider (no signer needed).
 * Returns the price in ETH per 1 AGL (as a number).
 */
export async function readAGLPriceFromChain(rpcUrl = "https://base.publicnode.com"): Promise<number | null> {
  try {
    const { JsonRpcProvider, Contract, formatUnits } = await import("ethers");
    const provider = new JsonRpcProvider(rpcUrl);
    const credits = new Contract(AGL_CREDITS_ADDRESS, AGL_CREDITS_ABI, provider);
    const creditsPerAGL: bigint = await credits.creditsPerAGL();
    // creditsPerAGL is how many credits per 1 AGL (18 decimals)
    // We expose this for informational use; spot price still comes from bonding curve
    return Number(formatUnits(creditsPerAGL, 0));
  } catch {
    return null;
  }
}
