import { useState, useCallback } from "react";
import { BrowserProvider } from "ethers";

// Extend Window to include the Telegram WebApp SDK
declare global {
  interface Window {
    Telegram?: { WebApp?: { initData: string; close?: () => void } };
    ethereum?: any;
  }
}

export type LinkStatus =
  | "idle"
  | "authenticating"
  | "awaiting-signature"
  | "linked"
  | "error";

export interface WalletLinkResult {
  status: LinkStatus;
  token: string | null;
  linkedWallet: string | null;
  error: string | null;
  linkWallet: (walletAddress: string) => Promise<void>;
  reset: () => void;
}

/**
 * useWalletLink
 *
 * Drives the two-step Telegram Mini App → wallet-link flow:
 *   1. POST /api/miniapp/auth/telegram  — validate Telegram identity, receive nonce
 *   2. Sign the nonce with the user's browser wallet (window.ethereum via ethers)
 *   3. POST /api/miniapp/auth/wallet-link — verify signature, receive JWT session token
 *
 * Adapted from the wagmi-based original to use ethers BrowserProvider directly,
 * matching the existing wallet infrastructure in AGL Vibe Studio.
 *
 * @param walletAddress - The address of the currently-connected wallet (from app-level WalletState)
 */
export function useWalletLink(): WalletLinkResult {
  const [status, setStatus]           = useState<LinkStatus>("idle");
  const [token, setToken]             = useState<string | null>(null);
  const [linkedWallet, setLinkedWallet] = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setToken(null);
    setLinkedWallet(null);
    setError(null);
  }, []);

  const linkWallet = useCallback(async (walletAddress: string) => {
    setError(null);

    // ── Guard: Telegram WebApp context ────────────────────────────────────────
    const initData = window.Telegram?.WebApp?.initData;
    if (!initData) {
      setStatus("error");
      setError("This feature is only available inside the Telegram Mini App.");
      return;
    }

    // ── Guard: wallet must be connected ───────────────────────────────────────
    if (!walletAddress) {
      setStatus("error");
      setError("Connect a wallet first before linking.");
      return;
    }

    // ── Guard: window.ethereum must be available ───────────────────────────────
    if (!window.ethereum) {
      setStatus("error");
      setError("No Web3 provider found. Install MetaMask or Coinbase Wallet.");
      return;
    }

    try {
      // Step 1: exchange Telegram initData for a nonce
      setStatus("authenticating");
      const authRes = await fetch("/api/miniapp/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });

      if (!authRes.ok) {
        const body = await authRes.json().catch(() => ({}));
        throw new Error(body.error ?? `Auth failed (${authRes.status})`);
      }

      // nonceToken is a signed JWT — opaque to the client, verified server-side
      const { nonceToken, message } = await authRes.json();

      // Step 2: sign the nonce message with the user's wallet
      setStatus("awaiting-signature");
      const provider = new BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();
      const signature = await signer.signMessage(message);

      // Step 3: send nonceToken (not telegramId) — server verifies its own JWT
      const linkRes = await fetch("/api/miniapp/auth/wallet-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nonceToken, walletAddress, signature }),
      });

      if (!linkRes.ok) {
        const body = await linkRes.json().catch(() => ({}));
        throw new Error(body.error ?? `Wallet link failed (${linkRes.status})`);
      }

      const { token: sessionToken, walletAddress: confirmedWallet } = await linkRes.json();

      // Persist the JWT so the app can attach it to future authenticated requests
      sessionStorage.setItem("agl_tg_token", sessionToken);
      sessionStorage.setItem("agl_tg_wallet", confirmedWallet);

      setToken(sessionToken);
      setLinkedWallet(confirmedWallet);
      setStatus("linked");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    }
  }, []);

  return { status, token, linkedWallet, error, linkWallet, reset };
}

/** Retrieve the stored Telegram session token (if any) */
export function getTelegramToken(): string | null {
  return sessionStorage.getItem("agl_tg_token");
}

/** Retrieve the stored linked wallet address (if any) */
export function getTelegramLinkedWallet(): string | null {
  return sessionStorage.getItem("agl_tg_wallet");
}
