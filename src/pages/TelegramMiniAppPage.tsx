import React from "react";
import { MessageCircle, Bot, Zap, Shield } from "lucide-react";
import TelegramWalletLink from "../components/TelegramWalletLink";
import { WalletState } from "../types";

interface TelegramMiniAppPageProps {
  wallet: WalletState;
  onOpenWalletModal: () => void;
}

const features = [
  {
    icon: MessageCircle,
    title: "Telegram-native auth",
    desc: "Your Telegram identity is verified via the official HMAC scheme — no third-party OAuth.",
    color: "text-brand-blue",
    bg: "bg-brand-blue/10",
  },
  {
    icon: Shield,
    title: "Cryptographic wallet proof",
    desc: "EIP-191 personal signature binds your Base wallet to your Telegram ID on-chain.",
    color: "text-brand-purple",
    bg: "bg-brand-purple/10",
  },
  {
    icon: Zap,
    title: "12-hour JWT session",
    desc: "After linking, a signed token unlocks authenticated AGL Studio API endpoints.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icon: Bot,
    title: "Bot-ready integration",
    desc: "Works with any AGL Telegram bot — link once, use your wallet identity everywhere.",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
];

export default function TelegramMiniAppPage({
  wallet,
  onOpenWalletModal,
}: TelegramMiniAppPageProps) {
  return (
    <div className="p-4 md:p-6 space-y-8 max-w-3xl mx-auto">
      {/* Page header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-purple/20">
            <MessageCircle className="w-4 h-4 text-brand-purple" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Mini App Integration
          </span>
        </div>
        <h1 className="text-2xl font-display font-bold text-white tracking-tight">
          Telegram Wallet Link
        </h1>
        <p className="text-sm text-zinc-400">
          Securely bind your Telegram account to a Base wallet — enabling bot commands, referral
          tracking, and authenticated AGL Studio API access.
        </p>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="glass-panel rounded-xl p-4 border border-white/5 flex items-start gap-3"
            >
              <div className={`p-2 rounded-lg ${f.bg} shrink-0`}>
                <Icon className={`w-4 h-4 ${f.color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{f.title}</p>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Auth widget */}
      <TelegramWalletLink wallet={wallet} onOpenWalletModal={onOpenWalletModal} />

      {/* API reference card */}
      <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
        <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">API Endpoints</p>
        <div className="space-y-2 font-mono text-xs">
          {[
            { method: "POST", path: "/api/miniapp/auth/telegram", desc: "Exchange initData → nonce" },
            { method: "POST", path: "/api/miniapp/auth/wallet-link", desc: "Submit signature → JWT" },
            { method: "GET",  path: "/api/miniapp/auth/user/:telegramId", desc: "Look up linked wallet" },
          ].map((ep) => (
            <div
              key={ep.path}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/5"
            >
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  ep.method === "POST"
                    ? "bg-brand-purple/20 text-brand-purple"
                    : "bg-brand-blue/20 text-brand-blue"
                }`}
              >
                {ep.method}
              </span>
              <span className="text-zinc-300 flex-1">{ep.path}</span>
              <span className="text-zinc-500 hidden sm:block">{ep.desc}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-600 leading-relaxed">
          Protected endpoints accept{" "}
          <code className="text-zinc-400">Authorization: Bearer &lt;token&gt;</code> headers.
          The JWT is signed with <code className="text-zinc-400">SESSION_SECRET</code> and expires in 12 h.
        </p>
      </div>
    </div>
  );
}
