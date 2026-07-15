/**
 * AGL Tokenomics Library
 * 
 * Handles all interactions with the AGLCredits smart contract on Base network.
 * This is the bridge between Vibe Studio's frontend/backend and the blockchain.
 * 
 * Contract Address: 0x13866F31c60822Ff70684213b9727915Ddf2c183
 * Network: Base (8453)
 */

import { ethers } from 'ethers';

// ABI for AGLCredits contract
const AGLCredits_ABI = [
  {
    type: 'function',
    name: 'purchaseCredits',
    inputs: [{ name: 'aglAmount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'previewCredits',
    inputs: [{ name: 'aglAmount', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalCreditsPurchased',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalAGLBurnedBy',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'creditsPerAGL',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalAGLBurned',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'aglToken',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'CreditsPurchased',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'aglBurned', type: 'uint256' },
      { name: 'creditsGranted', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'RateUpdated',
    inputs: [
      { name: 'oldCreditsPerAGL', type: 'uint256' },
      { name: 'newCreditsPerAGL', type: 'uint256' },
    ],
  },
];

// AGL Token ABI (ERC20 interface for approval)
const ERC20_ABI = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
];

// Configuration
export const AGL_CONFIG = {
  CONTRACT_ADDRESS: '0x13866F31c60822Ff70684213b9727915Ddf2c183',
  BASE_RPC: process.env.REACT_APP_BASE_RPC || 'https://base.publicnode.com',
  BASE_CHAIN_ID: 8453,
  AGL_DECIMALS: 18,
  BURN_ADDRESS: '0x000000000000000000000000000000000000dEaD',
};

/**
 * Get a read-only provider for Base network
 */
export function getReadProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(AGL_CONFIG.BASE_RPC);
}

/**
 * Get contract instance (read-only)
 */
export function getContractReader(): ethers.Contract {
  const provider = getReadProvider();
  return new ethers.Contract(AGL_CONFIG.CONTRACT_ADDRESS, AGLCredits_ABI, provider);
}

/**
 * Get contract instance for writing (requires signer)
 */
export function getContractWriter(signer: ethers.Signer): ethers.Contract {
  return new ethers.Contract(AGL_CONFIG.CONTRACT_ADDRESS, AGLCredits_ABI, signer);
}

/**
 * Preview how many credits an AGL amount would grant at current rate
 * 
 * @param aglAmountWei Amount of AGL in wei (18 decimals)
 * @returns Number of credits that would be granted
 */
export async function previewCredits(aglAmountWei: string | bigint): Promise<bigint> {
  try {
    const contract = getContractReader();
    const credits = await contract.previewCredits(aglAmountWei);
    return credits;
  } catch (error) {
    console.error('[AGLTokenomics] Error previewing credits:', error);
    throw error;
  }
}

/**
 * Purchase credits by burning AGL
 * 
 * @param signer Signer object (from wallet)
 * @param aglAmountWei Amount of AGL to burn in wei
 * @returns Transaction hash
 */
export async function purchaseCredits(
  signer: ethers.Signer,
  aglAmountWei: string | bigint
): Promise<string> {
  try {
    const contract = getContractWriter(signer);
    
    // Execute purchase
    const tx = await contract.purchaseCredits(aglAmountWei);
    console.log('[AGLTokenomics] Purchase transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait(1);
    console.log('[AGLTokenomics] Purchase confirmed:', receipt.hash);
    
    return tx.hash;
  } catch (error) {
    console.error('[AGLTokenomics] Error purchasing credits:', error);
    throw error;
  }
}

/**
 * Approve AGL token spending (required before purchasing)
 * 
 * @param signer Signer object
 * @param aglTokenAddress Address of AGL token contract
 * @param aglAmountWei Amount to approve in wei
 * @returns Transaction hash
 */
export async function approveAGL(
  signer: ethers.Signer,
  aglTokenAddress: string,
  aglAmountWei: string | bigint
): Promise<string> {
  try {
    const contract = new ethers.Contract(aglTokenAddress, ERC20_ABI, signer);
    
    const tx = await contract.approve(AGL_CONFIG.CONTRACT_ADDRESS, aglAmountWei);
    console.log('[AGLTokenomics] Approval transaction sent:', tx.hash);
    
    const receipt = await tx.wait(1);
    console.log('[AGLTokenomics] Approval confirmed:', receipt.hash);
    
    return tx.hash;
  } catch (error) {
    console.error('[AGLTokenomics] Error approving AGL:', error);
    throw error;
  }
}

/**
 * Check current AGL allowance for the AGLCredits contract
 * 
 * @param walletAddress User's wallet address
 * @param aglTokenAddress Address of AGL token contract
 * @returns Allowance amount in wei
 */
export async function checkAllowance(
  walletAddress: string,
  aglTokenAddress: string
): Promise<bigint> {
  try {
    const provider = getReadProvider();
    const contract = new ethers.Contract(aglTokenAddress, ERC20_ABI, provider);
    
    const allowance = await contract.allowance(walletAddress, AGL_CONFIG.CONTRACT_ADDRESS);
    return allowance;
  } catch (error) {
    console.error('[AGLTokenomics] Error checking allowance:', error);
    throw error;
  }
}

/**
 * Get total AGL burned by a wallet
 * 
 * @param walletAddress User's wallet address
 * @returns Total AGL burned in wei
 */
export async function getTotalAGLBurned(walletAddress: string): Promise<bigint> {
  try {
    const contract = getContractReader();
    const total = await contract.totalAGLBurnedBy(walletAddress);
    return total;
  } catch (error) {
    console.error('[AGLTokenomics] Error fetching total AGL burned:', error);
    throw error;
  }
}

/**
 * Get total credits purchased by a wallet
 * 
 * @param walletAddress User's wallet address
 * @returns Total credits purchased
 */
export async function getTotalCreditsPurchased(walletAddress: string): Promise<bigint> {
  try {
    const contract = getContractReader();
    const total = await contract.totalCreditsPurchased(walletAddress);
    return total;
  } catch (error) {
    console.error('[AGLTokenomics] Error fetching total credits:', error);
    throw error;
  }
}

/**
 * Get current exchange rate
 * 
 * @returns Credits per 1 whole AGL (with 18 decimals)
 */
export async function getExchangeRate(): Promise<bigint> {
  try {
    const contract = getContractReader();
    const rate = await contract.creditsPerAGL();
    return rate;
  } catch (error) {
    console.error('[AGLTokenomics] Error fetching exchange rate:', error);
    throw error;
  }
}

/**
 * Get protocol-wide total AGL burned (deflationary counter)
 * 
 * @returns Total AGL burned by all users in wei
 */
export async function getProtocolTotalAGLBurned(): Promise<bigint> {
  try {
    const contract = getContractReader();
    const total = await contract.totalAGLBurned();
    return total;
  } catch (error) {
    console.error('[AGLTokenomics] Error fetching protocol total:', error);
    throw error;
  }
}

/**
 * Get AGL token address from contract
 * 
 * @returns AGL token contract address
 */
export async function getAGLTokenAddress(): Promise<string> {
  try {
    const contract = getContractReader();
    const tokenAddress = await contract.aglToken();
    return tokenAddress;
  } catch (error) {
    console.error('[AGLTokenomics] Error fetching AGL token address:', error);
    throw error;
  }
}

/**
 * Format AGL amount from wei to human-readable
 * 
 * @param weiAmount Amount in wei
 * @returns Formatted amount (e.g., "1.5")
 */
export function formatAGL(weiAmount: bigint | string): string {
  return ethers.formatUnits(weiAmount, AGL_CONFIG.AGL_DECIMALS);
}

/**
 * Parse human-readable AGL amount to wei
 * 
 * @param amount Human-readable amount (e.g., "1.5")
 * @returns Amount in wei
 */
export function parseAGL(amount: string): bigint {
  return ethers.parseUnits(amount, AGL_CONFIG.AGL_DECIMALS);
}

/**
 * Watch for CreditsPurchased events in real-time
 * 
 * @param callback Function to call when event occurs
 * @returns Unsubscribe function
 */
export function watchCreditsPurchasedEvents(
  callback: (user: string, aglBurned: bigint, creditsGranted: bigint, timestamp: bigint) => void
): () => void {
  const contract = getContractReader();
  
  const listener = (user: string, aglBurned: bigint, creditsGranted: bigint, timestamp: bigint) => {
    callback(user, aglBurned, creditsGranted, timestamp);
  };
  
  contract.on('CreditsPurchased', listener);
  
  // Return unsubscribe function
  return () => {
    contract.off('CreditsPurchased', listener);
  };
}

export default {
  previewCredits,
  purchaseCredits,
  approveAGL,
  checkAllowance,
  getTotalAGLBurned,
  getTotalCreditsPurchased,
  getExchangeRate,
  getProtocolTotalAGLBurned,
  getAGLTokenAddress,
  formatAGL,
  parseAGL,
  watchCreditsPurchasedEvents,
  AGL_CONFIG,
};
