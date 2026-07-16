import { useState, useEffect, useRef, useCallback } from "react";
import { Zap, X, ExternalLink, Loader2, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import { fetchCreditBalance, previewCreditsForAmount, purchaseCreditsWithMetaMask, CREDIT_COSTS } from "../lib/credits";
import type { CreditBalance } from "../lib/credits";

interface CreditsWidgetProps {
  walletAddress: string;
}

type PurchaseStep = "idle" | "approving" | "purchasing" | "done" | "error";

export default function CreditsWidget({ walletAddress }: CreditsWidgetProps) {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Buy credits form
  const [aglAmount, setAglAmount] = useState("0.1");
  const [previewCredits, setPreviewCredits] = useState<number | null>(null);
  const [purchaseStep, setPurchaseStep] = useState<PurchaseStep>("idle");
  const [purchaseStatus, setPurchaseStatus] = useState("");
  const [txHash, setTxHash] = useState("");

  const popoverRef = useRef<HTMLDivElement>(null);

  // ── Fetch on-chain balance ──────────────────────────────────────────────
  const loadBalance = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      const data = await fetchCreditBalance(walletAddress);
      setBalance(data);
    } catch {
      // RPC/network unavailable — widget still renders with null
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  // ── Live credit preview as user types AGL amount ───────────────────────
  useEffect(() => {
    if (!aglAmount || isNaN(parseFloat(aglAmount)) || parseFloat(aglAmount) <= 0) {
      setPreviewCredits(null);
      return;
    }
    const t = setTimeout(async () => {
      const c = await previewCreditsForAmount(aglAmount);
      setPreviewCredits(c);
    }, 400);
    return () => clearTimeout(t);
  }, [aglAmount]);

  // ── Close on outside click ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    function handler(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // ── Purchase flow ───────────────────────────────────────────────────────
  const handlePurchase = async () => {
    if (!balance?.aglTokenAddress || purchaseStep !== "idle") return;
    setPurchaseStep("approving");
    setTxHash("");
    try {
      const hash = await purchaseCreditsWithMetaMask(
        aglAmount,
        balance.aglTokenAddress,
        (msg) => {
          setPurchaseStatus(msg);
          if (msg.includes("2/2")) setPurchaseStep("purchasing");
        }
      );
      setTxHash(hash);
      setPurchaseStep("done");
      setPurchaseStatus("Credits purchased! Refreshing balance…");
      setTimeout(() => {
        loadBalance();
        setPurchaseStep("idle");
        setPurchaseStatus("");
      }, 4000);
    } catch (err: any) {
      setPurchaseStep("error");
      setPurchaseStatus(err.message || "Transaction failed.");
    }
  };

  // ── Derived display values ─────────────────────────────────────────────
  const remaining = balance?.creditsRemaining ?? 0;
  const hasOnChainCredits = (balance?.totalCreditsPurchased ?? 0) > 0;
  const isWorking = purchaseStep === "approving" || purchaseStep === "purchasing";
  const isLow = hasOnChainCredits && remaining > 0 && remaining < 20;

  const chipLabel = loading
    ? "…"
    : hasOnChainCredits
    ? remaining.toLocaleString()
    : "0";

  return (
    <div className="relative" ref={popoverRef}>
      {/* ── Header chip ── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        title="AGL Credits — click to manage"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all
          ${isLow
            ? "bg-red-500/10 border-red-500/40 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.12)] animate-pulse"
            : hasOnChainCredits && remaining > 0
            ? "bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.08)]"
            : "bg-zinc-900 border-white/10 text-zinc-400"
          } hover:brightness-110`}
      >
        <Zap className={`w-3.5 h-3.5 ${hasOnChainCredits && remaining > 0 ? "text-amber-400" : "text-zinc-500"}`} />
        <span>{chipLabel}</span>
        <span className="text-[9px] uppercase tracking-wider opacity-60">CRED</span>
        <ChevronDown className={`w-3 h-3 opacity-40 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* ── Popover panel ── */}
      {isOpen && (
        <div className="absolute right-0 top-11 w-80 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white font-display uppercase tracking-wider">AGL Credits</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* ── Low-credits banner ── */}
            {isLow && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2 text-xs text-red-300">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Only <strong>{remaining}</strong> credits left — top up to avoid AI call failures.</span>
              </div>
            )}
            {/* ── Balance table ── */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-white/5">
                <Stat label="Credits Purchased" value={balance ? balance.totalCreditsPurchased.toLocaleString() : "—"} />
                <Stat label="Credits Remaining" value={balance ? remaining.toLocaleString() : "—"} highlight={hasOnChainCredits && remaining > 0} />
              </div>
              <div className="border-t border-white/5 grid grid-cols-2 divide-x divide-white/5">
                <Stat label="AGL Burned (you)" value={balance ? `${parseFloat(balance.totalAGLBurnedBy).toFixed(4)} AGL` : "—"} />
                <Stat label="Rate" value={balance ? `${balance.creditsPerAGL.toLocaleString()} / AGL` : "—"} />
              </div>
            </div>

            {/* ── AI call costs ── */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Credit cost per AI call</p>
              <div className="flex gap-2 flex-wrap">
                <CostChip label="Contract Build" cost={CREDIT_COSTS.build} color="blue" />
                <CostChip label="Agent Chat" cost={CREDIT_COSTS["agent-chat"]} color="purple" />
                <CostChip label="Email Draft" cost={CREDIT_COSTS["draft-email"]} color="emerald" />
              </div>
            </div>

            <div className="border-t border-white/5" />

            {/* ── Buy credits section ── */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-3">Buy More Credits</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0.001"
                    step="0.1"
                    value={aglAmount}
                    onChange={(e) => setAglAmount(e.target.value)}
                    disabled={isWorking}
                    className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
                    placeholder="AGL amount"
                  />
                  <span className="text-xs text-zinc-500 font-mono">AGL</span>
                  {previewCredits !== null && (
                    <span className="text-xs text-amber-400 font-bold font-mono whitespace-nowrap">
                      → {previewCredits.toLocaleString()} cr
                    </span>
                  )}
                </div>

                {/* Status message */}
                {purchaseStatus && (
                  <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${
                    purchaseStep === "done"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : purchaseStep === "error"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                    {purchaseStep === "done" ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> :
                     purchaseStep === "error" ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> :
                     <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />}
                    <span>{purchaseStatus}</span>
                  </div>
                )}

                {/* Tx link */}
                {txHash && (
                  <a
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white transition-colors font-mono"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View on BaseScan
                  </a>
                )}

                <button
                  onClick={handlePurchase}
                  disabled={isWorking || purchaseStep === "done" || !aglAmount}
                  className="w-full py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold font-display uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  {isWorking ? purchaseStep === "approving" ? "Approving…" : "Purchasing…" : "Burn AGL → Get Credits"}
                </button>

                <p className="text-[10px] text-zinc-600 text-center leading-relaxed">
                  Requires MetaMask on Base Mainnet. AGL is permanently burned to the dead address.{" "}
                  <a
                    href={`https://basescan.org/address/${AGL_CREDITS_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-500 hover:text-zinc-300 underline transition-colors"
                  >
                    View contract ↗
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="px-3 py-2.5">
      <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold mb-0.5">{label}</p>
      <p className={`text-sm font-bold font-mono ${highlight ? "text-amber-300" : "text-white"}`}>{value}</p>
    </div>
  );
}

function CostChip({ label, cost, color }: { label: string; cost: number; color: "blue" | "purple" | "emerald" }) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-mono ${colors[color]}`}>
      <Zap className="w-2.5 h-2.5" />
      {cost} — {label}
    </span>
  );
}

// Contract address for the "View contract" link in the widget
const AGL_CREDITS_ADDRESS = "0x13866F31c60822Ff70684213b9727915Ddf2c183";
