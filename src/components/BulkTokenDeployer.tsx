import React, { useState } from "react";
import { 
  Layers, 
  Plus, 
  Trash2, 
  Sparkles, 
  Rocket, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  Coins, 
  ShieldCheck, 
  FileJson,
  Zap,
  Info,
  Flame
} from "lucide-react";
import { 
  BatchTokenSpec, 
  BatchDeploymentProgress, 
  BatchDeploymentResult, 
  bulkCreateTokensOnChain 
} from "../lib/tokenFactory";
import { WalletState } from "../types";

interface BulkTokenDeployerProps {
  wallet: WalletState;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  onOpenConnectWallet: () => void;
  addTerminalLog?: (type: "info" | "success" | "error" | "buy" | "sell" | "system", text: string) => void;
  onDeploymentComplete?: () => void;
}

const PRESET_BUNDLES: {
  title: string;
  tag: string;
  desc: string;
  items: Omit<BatchTokenSpec, "id">[ ];
}[] = [
  {
    title: "DeFi Protocol Suite",
    tag: "3 Smart Contracts",
    desc: "Governance token, Yield Vault pass, and Liquidity Mining token",
    items: [
      { name: "Agunnaya Governance Token", symbol: "AGLGOV", assetType: "erc20" },
      { name: "Agunnaya Yield Pass NFT", symbol: "AGLPASS", assetType: "nft" },
      { name: "Agunnaya Liquidity Token", symbol: "AGLLIQ", assetType: "erc20" }
    ]
  },
  {
    title: "AI Fleet Multi-Asset",
    tag: "3 Smart Contracts",
    desc: "Compute token, Data oracle token, and AI Agent Access Pass NFT",
    items: [
      { name: "Agunnaya AI Compute Token", symbol: "AGLCOMP", assetType: "erc20" },
      { name: "Agunnaya Data Stream Token", symbol: "AGLDATA", assetType: "erc20" },
      { name: "Agunnaya Agent Pass NFT", symbol: "AGLAGENT", assetType: "nft" }
    ]
  },
  {
    title: "GameFi Ecosystem",
    tag: "3 Smart Contracts",
    desc: "In-game Gold currency, Hero Character NFT, and Quest Bounty Token",
    items: [
      { name: "Agunnaya Realm Gold", symbol: "AGLGOLD", assetType: "erc20" },
      { name: "Agunnaya Hero Pass NFT", symbol: "AGLHERO", assetType: "nft" },
      { name: "Agunnaya Quest Token", symbol: "AGLQUEST", assetType: "erc20" }
    ]
  }
];

export default function BulkTokenDeployer({
  wallet,
  showToast,
  onOpenConnectWallet,
  addTerminalLog,
  onDeploymentComplete
}: BulkTokenDeployerProps) {
  const [batchItems, setBatchItems] = useState<BatchTokenSpec[]>([
    { id: "1", name: "Agunnaya Sovereign Token", symbol: "AGLS", assetType: "erc20" },
    { id: "2", name: "Agunnaya Founding Pass NFT", symbol: "AGLNFT", assetType: "nft" }
  ]);

  const [isDeploying, setIsDeploying] = useState(false);
  const [currentProgressIndex, setCurrentProgressIndex] = useState<number | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, BatchDeploymentProgress>>({});
  const [deploymentResults, setDeploymentResults] = useState<BatchDeploymentResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // CSV Import state
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvRawText, setCsvRawText] = useState("");

  const handleAddItem = () => {
    const newId = Date.now().toString();
    setBatchItems((prev) => [
      ...prev,
      {
        id: newId,
        name: `Agunnaya Asset #${prev.length + 1}`,
        symbol: `AGL${prev.length + 1}`,
        assetType: prev.length % 2 === 0 ? "erc20" : "nft"
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (batchItems.length <= 1) {
      showToast("Batch must contain at least 1 token or NFT.", "info");
      return;
    }
    setBatchItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof BatchTokenSpec, value: string) => {
    setBatchItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleApplyPreset = (items: Omit<BatchTokenSpec, "id">[]) => {
    const formatted = items.map((it, idx) => ({
      id: (Date.now() + idx).toString(),
      name: it.name,
      symbol: it.symbol,
      assetType: it.assetType
    }));
    setBatchItems(formatted);
    setDeploymentResults(null);
    setProgressMap({});
    showToast("Preset bundle loaded into batch editor!", "success");
  };

  const handleParseCsv = () => {
    if (!csvRawText.trim()) {
      showToast("Please paste CSV data first.", "error");
      return;
    }

    const lines = csvRawText.split("\n");
    const parsed: BatchTokenSpec[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const parts = trimmed.split(",").map((p) => p.trim());
      if (parts.length >= 2) {
        const name = parts[0];
        const symbol = parts[1].toUpperCase();
        const typeRaw = parts[2] ? parts[2].toLowerCase() : "";
        const assetType: "erc20" | "nft" = typeRaw.includes("nft") ? "nft" : "erc20";
        parsed.push({
          id: (Date.now() + idx).toString(),
          name,
          symbol,
          assetType
        });
      }
    });

    if (parsed.length > 0) {
      setBatchItems(parsed);
      setCsvRawText("");
      setShowCsvModal(false);
      setDeploymentResults(null);
      setProgressMap({});
      showToast(`Parsed and loaded ${parsed.length} items from CSV!`, "success");
    } else {
      showToast("No valid rows found. Format: Name, Symbol, Type (erc20/nft)", "error");
    }
  };

  const handleExecuteBatch = async () => {
    // Validation
    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i];
      if (!item.name.trim() || !item.symbol.trim()) {
        showToast(`Item #${i + 1} has empty Name or Symbol.`, "error");
        return;
      }
    }

    if (!wallet.isConnected) {
      showToast("Please connect your Web3 wallet first.", "info");
      onOpenConnectWallet();
      return;
    }

    setIsDeploying(true);
    setDeploymentResults(null);
    setProgressMap({});
    setCurrentProgressIndex(0);

    if (addTerminalLog) {
      addTerminalLog(
        "info",
        `[BulkMint] Starting batch deployment sequence for ${batchItems.length} tokens/NFTs on Base Mainnet...`
      );
    }

    try {
      const res = await bulkCreateTokensOnChain(batchItems, (prog) => {
        setCurrentProgressIndex(prog.index);
        setProgressMap((prev) => ({
          ...prev,
          [prog.id]: prog
        }));

        if (prog.status === "deploying" && addTerminalLog) {
          addTerminalLog(
            "info",
            `[BulkMint ${prog.index + 1}/${prog.total}] Deploying "${prog.name}" ($${prog.symbol})...`
          );
        } else if (prog.status === "confirmed" && addTerminalLog) {
          addTerminalLog(
            "success",
            `[BulkMint ${prog.index + 1}/${prog.total}] Deployed "${prog.name}" -> ${prog.newTokenAddress} (Tx: ${prog.txHash})`
          );
        } else if (prog.status === "failed" && addTerminalLog) {
          addTerminalLog(
            "error",
            `[BulkMint ${prog.index + 1}/${prog.total}] Deployment failed for "${prog.name}": ${prog.error}`
          );
        }
      });

      setDeploymentResults(res);

      if (res.successfulCount > 0) {
        showToast(
          `Batch Deployment Complete! ${res.successfulCount}/${batchItems.length} deployed on Base Mainnet.`,
          "success"
        );
        if (addTerminalLog) {
          addTerminalLog(
            "success",
            `[BulkMint] Sequence finished! ${res.successfulCount} contract(s) created.`
          );
        }
        if (onDeploymentComplete) {
          onDeploymentComplete();
        }
      }

      if (res.failedCount > 0) {
        showToast(`${res.failedCount} deployment(s) failed or were rejected.`, "error");
      }
    } catch (err: any) {
      console.error("Bulk deployment sequence error:", err);
      showToast(`Batch sequence execution failed: ${err?.message || "Unknown error"}`, "error");
      if (addTerminalLog) {
        addTerminalLog("error", `[BulkMint] Critical sequence error: ${err?.message}`);
      }
    } finally {
      setIsDeploying(false);
      setCurrentProgressIndex(null);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast("Copied to clipboard!", "success");
  };

  const handleDownloadManifest = () => {
    if (!deploymentResults) return;
    const manifestData = {
      timestamp: new Date().toISOString(),
      network: "Base Mainnet (Chain ID 8453)",
      factoryContract: "0x6EF504b98b4369C0a1aF4fD1885D7acCf843dDf6",
      deployerWallet: wallet.address,
      totalCount: batchItems.length,
      successfulCount: deploymentResults.successfulCount,
      failedCount: deploymentResults.failedCount,
      deployments: deploymentResults.deployedItems
    };

    const jsonString = JSON.stringify(manifestData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `agunnaya_batch_manifest_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Batch deployment manifest JSON downloaded!", "success");
  };

  return (
    <div id="bulk-token-minting-panel" className="glass-panel p-6 md:p-8 rounded-3xl border border-purple-500/30 bg-gradient-to-br from-zinc-950 via-zinc-950 to-purple-950/20 space-y-8 shadow-2xl relative overflow-hidden">
      
      {/* GLOW DECORATION */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/10 pb-6 relative z-10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Multi-Asset Batch Deployer
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
              Base Mainnet Factory
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold font-display text-white tracking-tight flex items-center gap-2.5">
            <Rocket className="w-7 h-7 text-purple-400" />
            Bulk Token & NFT Batch Minting
          </h2>

          <p className="text-zinc-400 text-xs md:text-sm max-w-2xl leading-relaxed">
            Deploy multiple custom ERC-20 utility tokens and ERC-721 NFT collection passes in a single transaction sequence using the Agunnaya Labs Factory contract.
          </p>
        </div>

        {/* QUICK CSV & PRESET ACTIONS */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setShowCsvModal(true)}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 hover:border-purple-500/50 text-purple-300 hover:text-white font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-purple-400" />
            <span>CSV Batch Import</span>
          </button>
          
          <button
            type="button"
            onClick={handleAddItem}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* PRESET BUNDLES SELECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Preset Ecosystem Launch Bundles
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">Click to load pre-configured specs</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRESET_BUNDLES.map((bundle, idx) => (
            <div
              key={idx}
              onClick={() => handleApplyPreset(bundle.items)}
              className="p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-white/10 hover:border-purple-500/50 cursor-pointer transition-all group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-display text-white group-hover:text-purple-300 transition-colors">
                  {bundle.title}
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                  {bundle.tag}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug mb-3">
                {bundle.desc}
              </p>
              <div className="flex flex-wrap gap-1">
                {bundle.items.map((it, i) => (
                  <span key={i} className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/5">
                    ${it.symbol} ({it.assetType.toUpperCase()})
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BATCH ITEMS TABLE / LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-300 font-bold">Configured Batch Sequence</span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px]">
              {batchItems.length} Smart Contract{batchItems.length === 1 ? "" : "s"}
            </span>
          </div>

          {batchItems.length > 0 && (
            <button
              type="button"
              onClick={() => setBatchItems([])}
              className="text-[11px] text-zinc-500 hover:text-rose-400 transition-colors font-mono flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {batchItems.map((item, index) => {
            const progress = progressMap[item.id];
            const isItemDeploying = progress?.status === "deploying";
            const isItemConfirmed = progress?.status === "confirmed";
            const isItemFailed = progress?.status === "failed";

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isItemDeploying
                    ? "bg-purple-950/40 border-purple-500/80 shadow-lg shadow-purple-500/10"
                    : isItemConfirmed
                    ? "bg-emerald-950/30 border-emerald-500/50"
                    : isItemFailed
                    ? "bg-rose-950/30 border-rose-500/50"
                    : "bg-zinc-900/90 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  
                  {/* INDEX & STATUS BADGE */}
                  <div className="md:col-span-1 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs font-bold text-zinc-400">
                      #{index + 1}
                    </span>
                  </div>

                  {/* TOKEN NAME INPUT */}
                  <div className="md:col-span-4 space-y-1">
                    <label className="text-[10px] font-mono text-zinc-500 font-bold uppercase">
                      Contract / Asset Name
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                      placeholder="e.g. Agunnaya Sovereign"
                      disabled={isDeploying}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-purple-500 disabled:opacity-50"
                    />
                  </div>

                  {/* TOKEN SYMBOL INPUT */}
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[10px] font-mono text-zinc-500 font-bold uppercase">
                      Ticker / Symbol
                    </label>
                    <input
                      type="text"
                      value={item.symbol}
                      onChange={(e) => handleUpdateItem(item.id, "symbol", e.target.value.toUpperCase())}
                      placeholder="e.g. AGLS"
                      maxLength={10}
                      disabled={isDeploying}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-purple-500 uppercase disabled:opacity-50"
                    />
                  </div>

                  {/* ASSET TYPE SELECTOR */}
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[10px] font-mono text-zinc-500 font-bold uppercase">
                      Standard
                    </label>
                    <select
                      value={item.assetType}
                      onChange={(e) => handleUpdateItem(item.id, "assetType", e.target.value as "erc20" | "nft")}
                      disabled={isDeploying}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-purple-500 disabled:opacity-50"
                    >
                      <option value="erc20">ERC-20 Token</option>
                      <option value="nft">ERC-721 NFT Collection</option>
                    </select>
                  </div>

                  {/* DELETE BUTTON */}
                  <div className="md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={isDeploying || batchItems.length <= 1}
                      className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-all disabled:opacity-30 cursor-pointer"
                      title="Remove from batch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* ITEM PROGRESS TELEMETRY */}
                {progress && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      {isItemDeploying && (
                        <span className="flex items-center gap-1.5 text-purple-300 font-bold">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                          Executing createToken() transaction on Base...
                        </span>
                      )}

                      {isItemConfirmed && (
                        <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Contract Deployed: <span className="select-all text-white">{progress.newTokenAddress}</span>
                        </span>
                      )}

                      {isItemFailed && (
                        <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          Failed: {progress.error}
                        </span>
                      )}
                    </div>

                    {progress.txHash && (
                      <a
                        href={`https://basescan.org/tx/${progress.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0052FF] hover:underline flex items-center gap-1 text-[11px] font-bold"
                      >
                        BaseScan Tx
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* EXECUTION BAR & PROGRESS */}
      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 font-mono text-xs">
            <div className="flex items-center gap-2 text-zinc-300 font-bold">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Batch Execution Summary</span>
            </div>
            <p className="text-zinc-400 text-[11px]">
              {batchItems.length} contract creation calls will be sent sequentially via wallet signer.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExecuteBatch}
            disabled={isDeploying || batchItems.length === 0}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:opacity-95 text-white font-bold text-xs font-display flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-purple-600/25 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>Deploying Item {currentProgressIndex !== null ? currentProgressIndex + 1 : 1} of {batchItems.length}...</span>
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5 text-amber-300" />
                <span>Execute Batch Sequence ({batchItems.length} Tokens / NFTs)</span>
              </>
            )}
          </button>
        </div>

        {/* PROGRESS BAR */}
        {isDeploying && currentProgressIndex !== null && (
          <div className="space-y-1.5 pt-2 border-t border-white/5 font-mono text-xs">
            <div className="flex justify-between text-[10px] text-zinc-400">
              <span>Deploying Batch Sequence...</span>
              <span>
                {Math.round(((currentProgressIndex + 1) / batchItems.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 transition-all duration-300"
                style={{
                  width: `${Math.round(((currentProgressIndex + 1) / batchItems.length) * 100)}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* BATCH RESULTS & MANIFEST EXPORT */}
      {deploymentResults && (
        <div className="p-5 rounded-2xl bg-zinc-950 border border-purple-500/30 space-y-4 animate-fade-in font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Batch Deployment Complete</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-[11px]">
                {deploymentResults.successfulCount} / {batchItems.length} Deployed
              </span>

              <button
                type="button"
                onClick={handleDownloadManifest}
                className="px-3 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold flex items-center gap-1.5 transition-all cursor-pointer text-[11px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Manifest JSON</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase text-zinc-400">
              Deployed Contract Registry & BaseScan Links:
            </span>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {deploymentResults.deployedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-zinc-900 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-purple-400" />
                    <div>
                      <span className="font-bold text-white">{item.name}</span>{" "}
                      <span className="text-zinc-400">(${item.symbol})</span>
                    </div>
                  </div>

                  {item.status === "deployed" ? (
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-300 font-bold select-all text-[11px]">
                        {item.newTokenAddress}
                      </span>
                      <button
                        onClick={() => copyToClipboard(item.newTokenAddress, `batch_${idx}`)}
                        className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300"
                        title="Copy Address"
                      >
                        {copiedKey === `batch_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={`https://basescan.org/address/${item.newTokenAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-blue-400"
                        title="View on BaseScan"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-rose-400 font-bold">{item.error || "Failed"}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-950 border border-purple-500/40 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-white font-bold font-display">
                <FileJson className="w-5 h-5 text-purple-400" />
                <span>CSV Batch Import</span>
              </div>
              <button
                onClick={() => setShowCsvModal(false)}
                className="text-zinc-500 hover:text-white font-mono text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <p className="text-zinc-400 leading-relaxed">
                Paste line-by-line CSV entries in the format: <code className="text-purple-300 font-bold">Name, Symbol, Standard</code>
              </p>
              <div className="p-3 rounded-xl bg-zinc-900 border border-white/10 text-[11px] text-zinc-400 space-y-1">
                <p className="text-purple-300 font-bold">Example CSV Input:</p>
                <p>Agunnaya Sovereign Token, AGLS, erc20</p>
                <p>Agunnaya Cyber Pass NFT, CYBER, nft</p>
                <p>Agunnaya Yield Vault, YIELD, erc20</p>
              </div>

              <textarea
                rows={6}
                value={csvRawText}
                onChange={(e) => setCsvRawText(e.target.value)}
                placeholder="Name, Symbol, Standard (erc20 or nft)..."
                className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 font-mono text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleParseCsv}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs cursor-pointer shadow-lg shadow-purple-600/20"
              >
                Parse & Import to Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
