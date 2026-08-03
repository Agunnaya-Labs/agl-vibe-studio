import { useState, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";

declare global {
  interface Window {
    Telegram?: { WebApp?: { initData: string } };
  }
}

type LinkStatus = "idle" | "authenticating" | "awaiting-signature" | "linked" | "error";

interface WalletLinkResult {
  status: LinkStatus;
  token: string | null;
  error: string | null;
  linkWallet: () => Promise<void>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export function useWalletLink(): WalletLinkResult {
  const [status, setStatus] = useState<LinkStatus>("idle");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const linkWallet = useCallback(async () => {
    setError(null);

    const initData = window.Telegram?.WebApp?.initData;
    if (!initData) {
      setStatus("error");
      setError("Not running inside Telegram WebApp");
      return;
    }
    if (!address) {
      setStatus("error");
      setError("Connect a wallet first");
      return;
    }

    try {
      setStatus("authenticating");
      const authRes = await fetch(`${API_BASE}/auth/telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      if (!authRes.ok) throw new Error((await authRes.json()).error ?? "Auth failed");
      const { telegramId, message } = await authRes.json();

      setStatus("awaiting-signature");
      const signature = await signMessageAsync({ message });

      const linkRes = await fetch(`${API_BASE}/auth/wallet-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId, walletAddress: address, signature }),
      });
      if (!linkRes.ok) throw new Error((await linkRes.json()).error ?? "Wallet link failed");
      const { token: sessionToken } = await linkRes.json();

      setToken(sessionToken);
      setStatus("linked");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [address, signMessageAsync]);

  return { status, token, error, linkWallet };
}
