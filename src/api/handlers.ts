/**
 * API Route Handlers
 * Handles token transactions, trades, and other on-chain operations
 * These will be called from both frontend and backend
 */

import { Token, Activity } from '../types';
import { AgunnayaDatabase } from '../lib/db';
import { getEthCostForTokens, getEthReturnForTokens } from '../lib/db';
import { errorHandler, ErrorCodes } from '../lib/errorHandler';

interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  data?: any;
}

/**
 * Handle token purchase (bonding curve)
 */
export async function handleTokenPurchase(
  tokenAddress: string,
  ethAmount: number,
  userAddress: string
): Promise<TransactionResult> {
  try {
    if (ethAmount <= 0) {
      throw new Error('ETH amount must be greater than 0');
    }

    const tokens = AgunnayaDatabase.getTokens();
    const token = tokens.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());

    if (!token) {
      throw new Error('Token not found');
    }

    // Calculate tokens for ETH using bonding curve
    const tokensReceived = getEthCostForTokens(token.supply, ethAmount).total / (token.currentPrice || 0.000001);

    // Update token state
    token.supply += tokensReceived;
    token.reserveEth += ethAmount;
    token.currentPrice = token.currentPrice * 1.01; // Price increases slightly
    token.volume24h += ethAmount;

    AgunnayaDatabase.saveTokens(tokens);

    // Log activity
    AgunnayaDatabase.addActivity({
      type: 'buy',
      tokenSymbol: token.symbol,
      tokenAddress: token.address,
      user: userAddress,
      amount: tokensReceived,
      ethValue: ethAmount,
      details: `Bought ${tokensReceived.toFixed(2)} ${token.symbol} for ${ethAmount} ETH`,
    });

    // Process referrals if applicable
    const referrer = AgunnayaDatabase.getReferrerOf(userAddress);
    if (referrer) {
      const fee = ethAmount * 0.01; // 1% fee
      AgunnayaDatabase.addReferralPayout(userAddress, 'buy', fee);
    }

    return {
      success: true,
      txHash: `0x${Math.random().toString(16).substring(2)}`,
      data: {
        tokenSymbol: token.symbol,
        tokensReceived,
        ethSpent: ethAmount,
        newPrice: token.currentPrice,
      },
    };
  } catch (error) {
    errorHandler.handle(error, ErrorCodes.TRANSACTION_FAILED, 'error', {
      operation: 'token-purchase',
      tokenAddress,
      ethAmount,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transaction failed',
    };
  }
}

/**
 * Handle token sale (bonding curve)
 */
export async function handleTokenSale(
  tokenAddress: string,
  tokenAmount: number,
  userAddress: string
): Promise<TransactionResult> {
  try {
    if (tokenAmount <= 0) {
      throw new Error('Token amount must be greater than 0');
    }

    const tokens = AgunnayaDatabase.getTokens();
    const token = tokens.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());

    if (!token) {
      throw new Error('Token not found');
    }

    if (token.supply < tokenAmount) {
      throw new Error('Insufficient token supply');
    }

    // Calculate ETH return using bonding curve
    const { net: ethReturned } = getEthReturnForTokens(token.supply, tokenAmount);

    // Update token state
    token.supply -= tokenAmount;
    token.reserveEth -= ethReturned;
    token.currentPrice = token.currentPrice * 0.99; // Price decreases slightly
    token.volume24h += ethReturned;

    AgunnayaDatabase.saveTokens(tokens);

    // Log activity
    AgunnayaDatabase.addActivity({
      type: 'sell',
      tokenSymbol: token.symbol,
      tokenAddress: token.address,
      user: userAddress,
      amount: tokenAmount,
      ethValue: ethReturned,
      details: `Sold ${tokenAmount.toFixed(2)} ${token.symbol} for ${ethReturned} ETH`,
    });

    return {
      success: true,
      txHash: `0x${Math.random().toString(16).substring(2)}`,
      data: {
        tokenSymbol: token.symbol,
        tokensSold: tokenAmount,
        ethReceived: ethReturned,
        newPrice: token.currentPrice,
      },
    };
  } catch (error) {
    errorHandler.handle(error, ErrorCodes.TRANSACTION_FAILED, 'error', {
      operation: 'token-sale',
      tokenAddress,
      tokenAmount,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transaction failed',
    };
  }
}

/**
 * Deploy new token to bonding curve
 */
export async function handleTokenDeployment(
  token: Omit<Token, 'createdAt' | 'address'>,
  creatorAddress: string
): Promise<TransactionResult> {
  try {
    if (!token.name || !token.symbol) {
      throw new Error('Token name and symbol are required');
    }

    if (token.symbol.length > 10) {
      throw new Error('Token symbol must be 10 characters or less');
    }

    // Generate token address (in production, this would be from blockchain)
    const newToken: Token = {
      ...token,
      address: `0x${Math.random().toString(16).substring(2)}`,
      createdAt: Date.now(),
      creator: creatorAddress,
    };

    const tokens = AgunnayaDatabase.getTokens();
    tokens.push(newToken);
    AgunnayaDatabase.saveTokens(tokens);

    // Log activity
    AgunnayaDatabase.addActivity({
      type: 'create',
      tokenSymbol: newToken.symbol,
      tokenAddress: newToken.address,
      user: creatorAddress,
      amount: newToken.supply,
      ethValue: 0,
      details: `Deployed new token: ${newToken.name} (${newToken.symbol})`,
    });

    return {
      success: true,
      txHash: `0x${Math.random().toString(16).substring(2)}`,
      data: {
        tokenAddress: newToken.address,
        tokenSymbol: newToken.symbol,
      },
    };
  } catch (error) {
    errorHandler.handle(error, ErrorCodes.TRANSACTION_FAILED, 'error', {
      operation: 'token-deployment',
      tokenSymbol: token.symbol,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deployment failed',
    };
  }
}

/**
 * Validate transaction before submission
 */
export function validateTransaction(
  type: 'buy' | 'sell' | 'stake' | 'vote',
  amount: number,
  userBalance: number
): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  if (type === 'buy' || type === 'stake') {
    if (userBalance < amount) {
      return { valid: false, error: 'Insufficient balance' };
    }
  }

  return { valid: true };
}
