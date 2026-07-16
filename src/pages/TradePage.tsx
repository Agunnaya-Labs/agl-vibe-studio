import React, { useState, useEffect } from "react";
import { Token, WalletState, Activity } from "../types";
import BondingCurveChart from "../components/BondingCurveChart";
import TerminalLog, { TerminalLine } from "../components/TerminalLog";
import { 
  getSpotPrice, 
  getTokensForEth, 
  getEthCostForTokens, 
  getEthReturnForTokens,
  AgunnayaDatabase,
  BASE_PRICE,
  SLOPE
} from "../lib/db";
import { 
  ArrowLeftRight, 
  TrendingUp, 
  ArrowLeft, 
  Coins, 
  ExternalLink, 
  Twitter, 
  Globe, 
  Cpu, 
  DollarSign, 
  Sparkles,
  Award
} from "lucide-react";

interface TradePageProps {
  token: Token;
  wallet: WalletState;
  onBack: () => void;
  onRefreshWallet: () => void;
  terminalLogs: TerminalLine[];
  addTerminalLog: (type: "info" | "success" | "error" | "buy" | "sell" | "system", message: string) => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function TradePage({ 
  token, 
  wallet, 
  onBack, 
  onRefreshWallet, 
  terminalLogs, 
  addTerminalLog,
  showToast
}: TradePageProps) {
  const [tradeMode, setTradeMode] = useState<"buy" | "sell">("buy");
  const [inputVal, setInputVal] = useState("");
  const [estimatedOutput, setEstimatedOutput] = useState(0);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [chartView, setChartView] = useState<"bonding" | "gecko">("bonding");

  // Re-estimate on input change
  useEffect(() => {
    const num = parseFloat(inputVal) || 0;
    if (num <= 0) {
      setEstimatedOutput(0);
      return;
    }

    if (tradeMode === "buy") {
      // Calculate how many tokens for num ETH
      const tokens = getTokensForEth(token.supply, num);
      setEstimatedOutput(tokens);
    } else {
      // Calculate how much ETH for num tokens
      const { net } = getEthReturnForTokens(token.supply, num);
      setEstimatedOutput(net);
    }
  }, [inputVal, tradeMode, token.supply]);

  // Execute Buy / Sell Order
  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.isConnected) {
      showToast("Please connect your wallet first.", "error");
      return;
    }
    const num = parseFloat(inputVal) || 0;
    if (num <= 0 || tradeLoading) return;

    setTradeLoading(true);

    if (tradeMode === "buy") {
      if (num > wallet.balanceEth) {
        showToast("Insufficient ETH balance.", "error");
        setTradeLoading(false);
        return;
      }

      addTerminalLog("info", `Broadcasting linear curve BUY order for ${num} ETH against ${token.name}...`);

      setTimeout(() => {
        const tokensMinted = getTokensForEth(token.supply, num);
        const fee = num * 0.01;
        
        // Mutate token state
        const tokensList = AgunnayaDatabase.getTokens();
        const found = tokensList.find(t => t.address === token.address);
        if (found) {
          found.supply += tokensMinted;
          found.reserveEth += num - fee;
          found.creatorFeesEarned += fee;
          found.currentPrice = getSpotPrice(found.supply);
          found.marketCap = found.currentPrice * found.supply;
          found.volume24h += num;
          
          AgunnayaDatabase.saveTokens(tokensList);
          // Sync local prop state
          token.supply = found.supply;
          token.reserveEth = found.reserveEth;
          token.creatorFeesEarned = found.creatorFeesEarned;
          token.currentPrice = found.currentPrice;
          token.marketCap = found.marketCap;
          token.volume24h = found.volume24h;
        }

        // Deduct from wallet
        const updatedWallet = { 
          ...wallet, 
          balanceEth: wallet.balanceEth - num,
          aglTokenBalance: wallet.aglTokenBalance + 10 // reward 10 AGL on trades!
        };
        AgunnayaDatabase.saveWallet(updatedWallet);
        AgunnayaDatabase.addReferralPayout(wallet.address, "buy order", fee);
        onRefreshWallet();

        // Save activity
        AgunnayaDatabase.addActivity({
          type: "buy",
          tokenSymbol: token.symbol,
          tokenAddress: token.address,
          user: wallet.address,
          amount: tokensMinted,
          ethValue: num,
          details: `Bought +${tokensMinted.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${token.symbol} for ${num} ETH`
        });

        addTerminalLog("buy", `${wallet.address.slice(0, 6)}... bought +${tokensMinted.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${token.symbol} for ${num} ETH`);
        
        setInputVal("");
        setTradeLoading(false);
      }, 1500);

    } else {
      // Sell logic
      // In our mock database, we can assume the user has the tokens they bought, or allow testing sells easily
      addTerminalLog("info", `Initiating linear curve BURN/SELL execution for ${num} ${token.symbol}...`);

      setTimeout(() => {
        const { net, fee } = getEthReturnForTokens(token.supply, num);
        
        // Mutate token state
        const tokensList = AgunnayaDatabase.getTokens();
        const found = tokensList.find(t => t.address === token.address);
        if (found) {
          found.supply = Math.max(0, found.supply - num);
          found.reserveEth = Math.max(0, found.reserveEth - (net + fee));
          found.creatorFeesEarned += fee;
          found.currentPrice = getSpotPrice(found.supply);
          found.marketCap = found.currentPrice * found.supply;
          found.volume24h += net;

          AgunnayaDatabase.saveTokens(tokensList);
          // Sync local prop state
          token.supply = found.supply;
          token.reserveEth = found.reserveEth;
          token.creatorFeesEarned = found.creatorFeesEarned;
          token.currentPrice = found.currentPrice;
          token.marketCap = found.marketCap;
          token.volume24h = found.volume24h;
        }

        // Add to wallet balance
        const updatedWallet = { 
          ...wallet, 
          balanceEth: wallet.balanceEth + net,
          aglTokenBalance: wallet.aglTokenBalance + 5 // reward 5 AGL
        };
        AgunnayaDatabase.saveWallet(updatedWallet);
        AgunnayaDatabase.addReferralPayout(wallet.address, "sell order", fee);
        onRefreshWallet();

        // Save activity
        AgunnayaDatabase.addActivity({
          type: "sell",
          tokenSymbol: token.symbol,
          tokenAddress: token.address,
          user: wallet.address,
          amount: num,
          ethValue: net,
          details: `Sold -${num.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${token.symbol} for ${net.toFixed(5)} ETH`
        });

        addTerminalLog("sell", `${wallet.address.slice(0, 6)}... sold -${num.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${token.symbol} for ${net.toFixed(5)} ETH`);
        
        setInputVal("");
        setTradeLoading(false);
      }, 1500);
    }
  };

  return (
    <div id="trading-workspace-root" className="space-y-6 animate-fade-in">
      {/* Return button */}
      <button
        id="trade-back-btn"
        onClick={onBack}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/80 text-xs font-semibold text-zinc-400 hover:text-white transition-all font-display"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Explore launchpad</span>
      </button>

      {/* Main split sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Token Info & Chart */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Stats bar */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
            <div className="flex items-center gap-4">
              <img src={token.logoUrl} alt={token.name} className="w-12 h-12 rounded-2xl object-cover border border-white/5 shadow-md" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold font-display text-white">{token.name}</h2>
                  <span className="text-[10px] font-mono font-bold bg-brand-purple/20 text-brand-purple px-1.5 py-0.5 rounded">{token.symbol}</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 font-semibold truncate block max-w-xs sm:max-w-md">Contract: {token.address}</span>
              </div>
            </div>

            {/* Price change info */}
            <div className="grid grid-cols-2 gap-4 md:text-right font-mono text-xs border-t md:border-t-0 border-white/5 pt-3 md:pt-0 w-full md:w-auto">
              <div>
                <span className="block text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Spot Price</span>
                <span className="text-white font-bold text-sm">{(token.currentPrice * 1000000).toFixed(3)} μETH</span>
              </div>
              <div>
                <span className="block text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Market Cap</span>
                <span className="text-brand-purple font-bold text-sm">{token.marketCap.toFixed(3)} ETH</span>
              </div>
            </div>
          </div>

          {/* Chart Section with Dual-View Options */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/40 p-3 rounded-xl border border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Chart Mode:</span>
                <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-white/5">
                  <button
                    id="chart-mode-bonding"
                    type="button"
                    onClick={() => setChartView("bonding")}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                      chartView === "bonding"
                        ? "bg-brand-purple text-white shadow-md font-extrabold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Bonding Curve Model
                  </button>
                  <button
                    id="chart-mode-gecko"
                    type="button"
                    onClick={() => setChartView("gecko")}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 ${
                      chartView === "gecko"
                        ? "bg-emerald-500 text-black shadow-md font-extrabold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    Live Base DEX (GeckoTerminal)
                  </button>
                </div>
              </div>

              {chartView === "gecko" && (
                <a
                  href="https://www.geckoterminal.com/base/pools/0xe7d6de2bf95c563a819eb62cbf0c7e9020df53c875ccfbaf3fdccaa1fd25b085"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono text-zinc-400 hover:text-emerald-400 transition-all flex items-center gap-1 hover:underline"
                >
                  View full pool contract <ExternalLink className="w-3 h-3 text-emerald-400" />
                </a>
              )}
            </div>

            {chartView === "bonding" ? (
              <BondingCurveChart currentSupply={token.supply} maxSupply={token.maxSupply} tokenSymbol={token.symbol} />
            ) : (
              <div className="w-full h-[450px] rounded-2xl overflow-hidden border border-white/10 bg-black relative shadow-2xl">
                {/* Embedded GeckoTerminal Live Chart */}
                <iframe
                  id="geckoterminal-chart-embed"
                  width="100%"
                  height="100%"
                  src="https://www.geckoterminal.com/base/pools/0xe7d6de2bf95c563a819eb62cbf0c7e9020df53c875ccfbaf3fdccaa1fd25b085?embed=1&info=0&swaps=1&theme=dark"
                  title="GeckoTerminal Live Base DEX Pool Chart"
                  frameBorder="0"
                  allow="clipboard-write"
                  allowFullScreen
                  className="bg-black w-full h-full border-0"
                ></iframe>
              </div>
            )}
          </div>

          {/* macOS command terminal logs */}
          <TerminalLog logs={terminalLogs} />

        </div>

        {/* Trade Execution panel & metrics */}
        <div className="space-y-6">
          
          {/* Interactive Buy/Sell Form */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-zinc-950 space-y-5 relative">
            <div className="flex bg-zinc-900 p-1 rounded-xl">
              <button
                id="trade-buy-tab"
                onClick={() => { setTradeMode("buy"); setInputVal(""); }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold font-display transition-all ${
                  tradeMode === "buy"
                    ? "bg-emerald-500 text-black font-bold shadow"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Buy {token.symbol}
              </button>
              <button
                id="trade-sell-tab"
                onClick={() => { setTradeMode("sell"); setInputVal(""); }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold font-display transition-all ${
                  tradeMode === "sell"
                    ? "bg-rose-500 text-white font-bold shadow"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Sell {token.symbol}
              </button>
            </div>

            <form onSubmit={handleExecuteTrade} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1.5">
                  {tradeMode === "buy" ? "Investment Amount (ETH)" : "Quantity to Burn (Tokens)"}
                </label>
                <div className="relative">
                  <input
                    id="trade-amount-input"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder={tradeMode === "buy" ? "0.05" : "10,000"}
                    required
                    className="w-full bg-zinc-900 border border-white/5 rounded-xl p-3 pr-12 text-xs font-mono text-white focus:outline-none focus:border-brand-purple/40"
                  />
                  <span className="absolute right-3.5 top-3.5 text-xs text-zinc-500 font-bold font-mono">
                    {tradeMode === "buy" ? "ETH" : token.symbol}
                  </span>
                </div>
              </div>

              {/* Real-time estimation outputs */}
              <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-white/5 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-zinc-400">
                  <span>Est. Output:</span>
                  <span className="text-white font-bold">
                    {estimatedOutput.toLocaleString(undefined, { maximumFractionDigits: 2 })} {tradeMode === "buy" ? token.symbol : "ETH"}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500 text-[10px]">
                  <span>Creator Fee (1%):</span>
                  <span>
                    {tradeMode === "buy"
                      ? `${((parseFloat(inputVal) || 0) * 0.01).toFixed(6)} ETH`
                      : `${((estimatedOutput) * 0.01).toFixed(6)} ETH`}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500 text-[10px]">
                  <span>AGL Trade Bonus:</span>
                  <span className="text-brand-purple font-bold">+{tradeMode === "buy" ? "10 AGL" : "5 AGL"}</span>
                </div>
              </div>

              <button
                id="trade-submit-btn"
                type="submit"
                disabled={tradeLoading || !inputVal || parseFloat(inputVal) <= 0}
                className={`w-full py-3.5 rounded-xl font-bold font-display text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                  tradeMode === "buy"
                    ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10 text-black font-bold"
                    : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/10 text-white font-bold"
                }`}
              >
                <ArrowLeftRight className={`w-4 h-4 ${tradeLoading ? "animate-spin" : ""}`} />
                <span>{tradeLoading ? "Executing on Base L2..." : tradeMode === "buy" ? `Buy ${token.symbol} Asset` : `Sell ${token.symbol} Asset`}</span>
              </button>
            </form>
          </div>

          {/* Token metadata, creator info, socials */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
            <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white">Project Specifics</h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              {token.description}
            </p>

            <div className="border-t border-white/5 pt-3 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-500">
                <span>Creator Earnings:</span>
                <span className="text-zinc-200">{token.creatorFeesEarned.toFixed(5)} ETH</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Vesting Period:</span>
                <span className="text-zinc-200">{token.vestingWeeks > 0 ? `${token.vestingWeeks} Weeks` : "None"}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Referral Payout:</span>
                <span className="text-zinc-200">{token.referralRewardsPct}%</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Curve Reserves:</span>
                <span className="text-emerald-400 font-bold">{token.reserveEth.toFixed(4)} ETH</span>
              </div>
            </div>

            {/* Social icons links */}
            <div className="flex gap-2 border-t border-white/5 pt-4">
              {token.socials.website && (
                <a
                  href={token.socials.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-all"
                >
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {token.socials.twitter && (
                <a
                  href={token.socials.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-all"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-500 text-xs font-mono flex items-center gap-1.5 ml-auto leading-none">
                <Cpu className="w-3.5 h-3.5 text-brand-blue" />
                <span>Linear Reserve Synced</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
