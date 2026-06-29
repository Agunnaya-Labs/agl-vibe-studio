import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { TrendingUp, TrendingDown, Wallet, DollarSign, ArrowUpRight, ArrowDownLeft, Eye, Download, Calendar } from "lucide-react";
import { Token, NFTCollection, AIAgent } from "../types";
import { useState } from "react";

interface PortfolioAnalyticsProps {
  userTokens: Token[];
  userNFTs: NFTCollection[];
  userAgents: AIAgent[];
  walletBalance: number;
  aglBalance: number;
  onExport?: () => void;
}

export default function PortfolioAnalytics({
  userTokens,
  userNFTs,
  userAgents,
  walletBalance,
  aglBalance,
  onExport
}: PortfolioAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<"1d" | "7d" | "30d" | "all">("7d");
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  // Calculate portfolio metrics
  const totalTokenValue = userTokens.reduce((sum, t) => sum + t.marketCap, 0);
  const nftValue = userNFTs.reduce((sum, n) => sum + (n.mintPrice * n.currentSupply * 0.8), 0); // Estimated 80% of mint value
  const agentRevenue = userAgents.reduce((sum, a) => sum + a.lifetimeRevenueEth, 0);
  const totalPortfolioValue = walletBalance + totalTokenValue + nftValue + agentRevenue + aglBalance * 0.000001;
  
  // P&L Calculation (mock 24h change)
  const portfolioChange24h = totalPortfolioValue * (Math.random() * 0.08 - 0.04);
  const portfolioChangePercent = (portfolioChange24h / totalPortfolioValue) * 100;

  // Asset allocation data
  const allocationData = [
    { name: "ETH Wallet", value: walletBalance, color: "#6366f1" },
    { name: "Token Holdings", value: totalTokenValue, color: "#8b5cf6" },
    { name: "NFT Collections", value: nftValue, color: "#ec4899" },
    { name: "Agent Revenue", value: agentRevenue, color: "#06b6d4" },
    { name: "AGL Tokens", value: aglBalance * 0.000001, color: "#f59e0b" }
  ].filter(item => item.value > 0);

  // Performance history (mock data)
  const performanceHistory = [
    { date: "Mon", value: totalPortfolioValue * 0.92 },
    { date: "Tue", value: totalPortfolioValue * 0.95 },
    { date: "Wed", value: totalPortfolioValue * 0.93 },
    { date: "Thu", value: totalPortfolioValue * 0.98 },
    { date: "Fri", value: totalPortfolioValue * 1.02 },
    { date: "Sat", value: totalPortfolioValue * 1.01 },
    { date: "Sun", value: totalPortfolioValue }
  ];

  // Token performance ranking
  const tokenPerformance = userTokens.map((token, idx) => ({
    symbol: token.symbol,
    change: (Math.random() * 40 - 20), // Mock 24h change %
    volume: token.volume24h,
    marketCap: token.marketCap,
    index: idx
  })).sort((a, b) => b.change - a.change);

  // Top holdings
  const topHoldings = [
    ...userTokens.map(t => ({ type: "token", name: t.name, symbol: t.symbol, value: t.marketCap, logo: t.logoUrl })),
    ...userNFTs.map(n => ({ type: "nft", name: n.name, symbol: n.symbol, value: n.mintPrice * n.currentSupply * 0.8, logo: n.imageUrl })),
    ...userAgents.map(a => ({ type: "agent", name: a.name, symbol: a.symbol, value: a.lifetimeRevenueEth, logo: a.avatarUrl }))
  ].sort((a, b) => b.value - a.value).slice(0, 5);

  return (
    <div id="portfolio-analytics-root" className="space-y-6 animate-fade-in">
      
      {/* Portfolio Overview Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Portfolio Value */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 bg-zinc-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-brand-blue/5 blur-2xl pointer-events-none"></div>
          <span className="block text-[9px] uppercase font-bold text-zinc-500 mb-2">Total Portfolio Value</span>
          <span className="block text-2xl font-mono font-bold text-white">{totalPortfolioValue.toFixed(3)} ETH</span>
          <span className={`text-[10px] font-mono mt-2 block flex items-center gap-1 ${portfolioChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {portfolioChange24h >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
            {Math.abs(portfolioChange24h).toFixed(4)} ETH ({portfolioChangePercent.toFixed(2)}%) 24h
          </span>
        </div>

        {/* Asset Breakdown */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 bg-zinc-900/40">
          <span className="block text-[9px] uppercase font-bold text-zinc-500 mb-2">Assets Breakdown</span>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Holdings:</span>
              <span className="font-mono font-bold text-white">{(userTokens.length + userNFTs.length + userAgents.length)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Token Value:</span>
              <span className="font-mono font-bold text-brand-purple">{totalTokenValue.toFixed(3)} ETH</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Liquid Balance:</span>
              <span className="font-mono font-bold text-emerald-400">{walletBalance.toFixed(3)} ETH</span>
            </div>
          </div>
        </div>

        {/* Unrealized P&L */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 bg-zinc-900/40">
          <span className="block text-[9px] uppercase font-bold text-zinc-500 mb-2">Unrealized P&L</span>
          <span className="block text-2xl font-mono font-bold text-emerald-400">+{(totalPortfolioValue * 0.18).toFixed(2)} ETH</span>
          <span className="text-[10px] text-zinc-400 mt-2 block font-mono">+12.3% gain from purchases</span>
        </div>

        {/* Diversification Score */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 bg-zinc-900/40">
          <span className="block text-[9px] uppercase font-bold text-zinc-500 mb-2">Diversification</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-brand-purple">78</span>
            <span className="text-xs text-zinc-400">/ 100</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-gradient-to-r from-brand-purple to-brand-blue h-full rounded-full" style={{ width: "78%" }}></div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Portfolio Performance Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-brand-blue" />
                Portfolio Performance
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono block mt-1">7-day historical value</span>
            </div>
            <div className="flex gap-1.5">
              {(["1d", "7d", "30d", "all"] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2 py-1 text-[9px] font-mono rounded transition-all ${
                    timeRange === range
                      ? "bg-brand-blue text-white"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceHistory}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" />
                <XAxis dataKey="date" stroke="#52525b" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis stroke="#52525b" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }}
                  formatter={(value: number) => [`${value.toFixed(3)} ETH`, "Value"]}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#0ea5e9" 
                  strokeWidth={2} 
                  dot={false}
                  fill="url(#colorValue)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Allocation Pie Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
          <div>
            <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-brand-purple" />
              Asset Allocation
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono block mt-1">Portfolio composition breakdown</span>
          </div>
          <div className="flex items-center justify-center h-64">
            {allocationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }}
                    formatter={(value: number) => `${value.toFixed(3)} ETH`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-zinc-400 text-xs">
                No holdings to display
              </div>
            )}
          </div>
          {allocationData.length > 0 && (
            <div className="grid grid-cols-2 gap-2 text-[9px]">
              {allocationData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-zinc-400">{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Token Performance Ranking */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-brand-purple" />
          Token Performance (24h)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/5 text-zinc-500">
                <th className="pb-3 pl-2">Symbol</th>
                <th className="pb-3">Change (24h)</th>
                <th className="pb-3">Volume (24h)</th>
                <th className="pb-3 text-right pr-2">Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {tokenPerformance.slice(0, 5).map((token, idx) => (
                <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/2 cursor-pointer">
                  <td className="py-3 pl-2">
                    <span className={`font-bold ${idx === 0 ? 'text-emerald-400' : idx === tokenPerformance.length - 1 ? 'text-red-400' : 'text-white'}`}>
                      {token.symbol}
                    </span>
                  </td>
                  <td className={`py-3 ${token.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {token.change >= 0 ? '+' : ''}{token.change.toFixed(2)}%
                  </td>
                  <td className="py-3 text-zinc-300">{token.volume.toFixed(2)} ETH</td>
                  <td className="py-3 text-right pr-2 text-zinc-300">{token.marketCap.toFixed(3)} ETH</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Holdings */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-brand-blue" />
          Top Holdings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {topHoldings.map((holding, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedAsset(holding.symbol)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedAsset === holding.symbol
                  ? 'bg-brand-blue/10 border-brand-blue'
                  : 'bg-zinc-900/30 border-white/5 hover:border-white/10'
              }`}
            >
              <img 
                src={holding.logo} 
                alt={holding.symbol}
                className="w-8 h-8 rounded object-cover mb-2"
              />
              <div className="text-[10px] space-y-1">
                <div className="font-bold text-white">{holding.symbol}</div>
                <div className="text-zinc-400 truncate">{holding.name}</div>
                <div className="font-mono font-bold text-brand-blue">{holding.value.toFixed(3)} ETH</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export & Actions */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/30 border border-white/5">
        <div className="text-xs text-zinc-400">
          <Calendar className="w-3.5 h-3.5 inline mr-2" />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onExport}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-brand-blue text-zinc-300 hover:text-white rounded text-[10px] font-mono font-bold transition-all flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
