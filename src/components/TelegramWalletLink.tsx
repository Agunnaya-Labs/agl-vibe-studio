import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageCircle,
  Wallet,
  LinkIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Key,
  RefreshCw,
} from "lucide-react";
import { useWalletLink, getTelegramLinkedWallet } from "../hooks/useWalletLink";
import { WalletState } from "../types";

interface TelegramWalletLinkProps {
  wallet: WalletState;
  onOpenWalletModal: () => void;
}

const statusConfig = {
  idle: {
    icon: LinkIcon,
    color: "text-brand-purple",
    bg: "bg-brand-purple/10",
    border: "border-brand-purple/30",
    label: "Link Wallet to Telegram",
  },
  authenticating: {
    icon: Loader2,
    color: "text-brand-blue",
    bg: "bg-brand-blue/10",
    border: "border-brand-blue/30",
    label: "Verifying Telegram identity…",
  },
  "awaiting-signature": {
    icon: Key,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/30",
    label: "Sign in your wallet…",
  },
  linked: {
    icon: CheckCircle2,
    color: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-400/30",
    label: "Wallet Linked ✓",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
    label: "Link Failed",
  },
};

function StepBadge({
  n,
  label,
  done,
  active,
}: {
  n: number;
  label: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${active ? "opacity-100" : done ? "opacity-70" : "opacity-40"}`}>
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
          done
            ? "bg-green-400/20 border-green-400/50 text-green-400"
            : active
            ? "bg-brand-purple/30 border-brand-purple text-white"
            : "bg-white/5 border-white/10 text-zinc-400"
        }`}
      >
        {done ? "✓" : n}
      </div>
      <span className={`text-xs font-mono ${active ? "text-white" : "text-zinc-400"}`}>{label}</span>
    </div>
  );
}

export default function TelegramWalletLink({
  wallet,
  onOpenWalletModal,
}: TelegramWalletLinkProps) {
  const { status, token, linkedWallet, error, linkWallet, reset } = useWalletLink();
  const [isTgContext, setIsTgContext] = useState<boolean | null>(null);
  const [alreadyLinked, setAlreadyLinked] = useState<string | null>(null);

  // Detect Telegram WebApp context and any existing session
  useEffect(() => {
    const tgAvailable = !!(window.Telegram?.WebApp?.initData);
    setIsTgContext(tgAvailable);
    const cached = getTelegramLinkedWallet();
    if (cached) setAlreadyLinked(cached);
  }, []);

  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;

  const step1Done = ["awaiting-signature", "linked"].includes(status);
  const step2Done = status === "linked";
  const step1Active = status === "authenticating";
  const step2Active = status === "awaiting-signature";

  const isLoading = status === "authenticating" || status === "awaiting-signature";

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-brand-purple/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-brand-blue/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-brand-purple/20">
            <MessageCircle className="w-5 h-5 text-brand-purple" />
          </div>
          <div>
            <h2 className="text-lg font-semibold font-display tracking-tight text-white">
              Telegram Mini App Auth
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Link your wallet to your Telegram identity on AGL Studio
            </p>
          </div>
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed">
          This two-step flow cryptographically binds your Telegram account to a Base wallet
          address. Your identity is verified via Telegram's HMAC scheme; your wallet ownership
          is proven by signing a one-time nonce — no private keys are ever transmitted.
        </p>
      </div>

      {/* Already linked banner */}
      {alreadyLinked && status !== "linked" && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl border border-green-400/20 bg-green-400/5"
        >
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-green-400">Session active from this device</p>
            <p className="text-xs text-zinc-400 font-mono truncate">{alreadyLinked}</p>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem("agl_tg_token");
              sessionStorage.removeItem("agl_tg_wallet");
              setAlreadyLinked(null);
              reset();
            }}
            className="ml-auto text-zinc-500 hover:text-red-400 transition-colors"
            title="Clear session"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Not inside Telegram warning */}
      {isTgContext === false && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-yellow-400/20 bg-yellow-400/5">
          <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-yellow-400">Not running inside Telegram</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Open this app as a Telegram Mini App (via your bot link) to use wallet linking.
              The UI is fully rendered below for development preview.
            </p>
          </div>
        </div>
      )}

      {/* Main action panel */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-5">
        {/* Step tracker */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Auth Flow</p>
          <div className="flex flex-col gap-2.5">
            <StepBadge n={1} label="Verify Telegram identity" done={step1Done} active={step1Active} />
            <StepBadge n={2} label="Sign nonce with wallet" done={step2Done} active={step2Active} />
          </div>
        </div>

        <div className="border-t border-white/5" />

        {/* Status indicator */}
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}
          >
            <StatusIcon
              className={`w-5 h-5 ${cfg.color} ${isLoading ? "animate-spin" : ""} shrink-0`}
            />
            <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
          </motion.div>
        </AnimatePresence>

        {/* Error detail */}
        {status === "error" && error && (
          <p className="text-xs text-red-400 font-mono bg-red-400/5 border border-red-400/15 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Linked success */}
        {status === "linked" && linkedWallet && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-2"
          >
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
              Linked wallet
            </p>
            <div className="flex items-center gap-2 font-mono text-xs text-green-400 bg-green-400/5 border border-green-400/15 rounded-lg px-3 py-2 break-all">
              <Shield className="w-3.5 h-3.5 shrink-0" />
              {linkedWallet}
            </div>
            <p className="text-[10px] text-zinc-500">
              JWT session active · expires in 12 h · stored in sessionStorage
            </p>
          </motion.div>
        )}

        {/* Wallet not connected */}
        {!wallet.isConnected && status !== "linked" && (
          <button
            onClick={onOpenWalletModal}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-brand-purple/30 bg-brand-purple/10 hover:bg-brand-purple/20 text-white text-sm font-semibold transition-all"
          >
            <Wallet className="w-4 h-4" />
            Connect Wallet First
          </button>
        )}

        {/* Primary action button */}
        {wallet.isConnected && status !== "linked" && (
          <button
            disabled={isLoading}
            onClick={() => linkWallet(wallet.address)}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              isLoading
                ? "bg-white/5 border border-white/10 text-zinc-400 cursor-not-allowed"
                : "bg-gradient-to-r from-brand-purple to-brand-blue text-white hover:opacity-90 active:scale-[0.98] shadow-lg shadow-brand-purple/20"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {status === "authenticating" ? "Verifying Telegram…" : "Awaiting signature…"}
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4" />
                {status === "error" ? "Retry Link" : "Link Wallet to Telegram"}
              </>
            )}
          </button>
        )}

        {/* Reset after error */}
        {status === "error" && (
          <button
            onClick={reset}
            className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1"
          >
            Clear &amp; start over
          </button>
        )}
      </div>

      {/* Security note */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
        <Shield className="w-4 h-4 text-brand-blue mt-0.5 shrink-0" />
        <p className="text-xs text-zinc-500 leading-relaxed">
          <span className="text-zinc-300 font-medium">Zero-knowledge wallet proof.</span> Only an
          EIP-191 personal signature is collected — your private key and seed phrase are never
          requested. The nonce expires in 5 minutes and is deleted immediately after use.
        </p>
      </div>
    </div>
  );
}
