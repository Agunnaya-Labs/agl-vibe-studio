import React, { useState } from "react";
import { Token } from "../types";
import { AgunnayaDatabase } from "../lib/db";
import { ShieldCheck, Settings, AlertTriangle, Users, ToggleLeft, Activity, Plus, ShieldAlert, CheckCircle } from "lucide-react";

interface AdminPanelPageProps {
  tokens: Token[];
  onRefreshTokens: () => void;
  addTerminalLog: (type: "info" | "success" | "error" | "buy" | "sell" | "system", message: string) => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function AdminPanelPage({ tokens, onRefreshTokens, addTerminalLog, showToast }: AdminPanelPageProps) {
  // Global params state
  const [flatFee, setFlatFee] = useState(1);
  const [sponsorshipGasLimit, setSponsorshipGasLimit] = useState(0.05);
  const [slopeParam, setSlopeParam] = useState(0.0000000005);
  const [loading, setLoading] = useState(false);

  // Toggle Verification of tokens
  const handleToggleVerification = (tokenAddress: string) => {
    const all = AgunnayaDatabase.getTokens();
    const t = all.find(item => item.address === tokenAddress);
    if (t) {
      t.isVerified = !t.isVerified;
      AgunnayaDatabase.saveTokens(all);
      onRefreshTokens();

      addTerminalLog("system", `ADMIN: Toggled verification status of ${t.symbol} to ${t.isVerified ? "TRUE" : "FALSE"}`);
    }
  };

  const handleUpdateProtocol = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    addTerminalLog("info", "Broadcasting protocol parameter update transaction to Factory contract...");

    setTimeout(() => {
      addTerminalLog("success", `Factory settings saved. Flat curve fee adjusted to ${flatFee}%, AA max gas to ${sponsorshipGasLimit} ETH.`);
      setLoading(false);
      showToast("Factory parameters updated successfully on simulated nodes!", "success");
    }, 1500);
  };

  return (
    <div id="admin-workspace-root" className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      
      {/* Parameters configuration */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-6">
          <div>
            <h2 className="text-sm font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-brand-purple" />
              Ecosystem Factory Settings
            </h2>
            <p className="text-[11px] text-zinc-500 mt-1">
              Adjust parameters that govern linear bonding curve pricing rates, fee deductions, and EOA account abstraction gas coverage limits.
            </p>
          </div>

          <form onSubmit={handleUpdateProtocol} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1.5">Flat Curve Fee (%)</label>
                <input
                  id="admin-fee-input"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={flatFee}
                  onChange={(e) => setFlatFee(parseFloat(e.target.value) || 1)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1.5">AA Sponsorship Cap (ETH)</label>
                <input
                  id="admin-sponsor-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={sponsorshipGasLimit}
                  onChange={(e) => setSponsorshipGasLimit(parseFloat(e.target.value) || 0.05)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1.5">Slope Parameter Invariant</label>
              <input
                id="admin-slope-input"
                type="number"
                step="0.0000000001"
                value={slopeParam}
                onChange={(e) => setSlopeParam(parseFloat(e.target.value) || 0.0000000005)}
                className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-zinc-500 focus:outline-none font-mono"
              />
            </div>

            <button
              id="admin-update-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-purple hover:bg-purple-600 font-semibold font-display text-xs text-white shadow-lg disabled:bg-zinc-800 disabled:text-zinc-500 transition-all"
            >
              <span>{loading ? "Broadcasting upgrade transaction..." : "Save Protocol Parameters"}</span>
            </button>
          </form>
        </div>

        {/* Security / System Audit Alert */}
        <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold font-display text-white">Administrative Multisig Overrides Active</h4>
            <p className="text-[11px] text-zinc-400 leading-normal leading-relaxed">
              Caution: Modifying Factory contract invariants directly affects previously launched linear bonding curves, causing reserve discrepancies. All parameter changes trigger a 24-hour time-lock on simulated Base nodes.
            </p>
          </div>
        </div>
      </div>

      {/* Token Moderation panel */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white">Active Launchpad Assets</h3>
        <p className="text-[10px] text-zinc-500 leading-normal">
          Toggle the verification badges of launched tokens to certify their creator profiles and highlight them on the Explore browser page.
        </p>

        <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1 border-t border-white/5 pt-4">
          {tokens.map((token) => (
            <div key={token.address} className="flex justify-between items-center bg-zinc-950 p-2.5 rounded-xl border border-white/5 text-xs">
              <div className="flex items-center gap-2">
                <img src={token.logoUrl} alt={token.name} className="w-6 h-6 rounded-lg object-cover" />
                <div>
                  <span className="block text-[11px] font-bold text-zinc-200 leading-none">{token.name}</span>
                  <span className="text-[9px] font-mono text-zinc-500">{token.symbol}</span>
                </div>
              </div>

              <button
                id={`toggle-verify-btn-${token.address}`}
                onClick={() => handleToggleVerification(token.address)}
                className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded-lg transition-all ${
                  token.isVerified
                    ? "bg-brand-blue/20 text-brand-blue border border-brand-blue/30"
                    : "bg-zinc-900 text-zinc-500 border border-white/5"
                }`}
              >
                {token.isVerified ? "✓ Verified" : "Unverified"}
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
