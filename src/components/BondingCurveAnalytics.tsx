import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart } from "recharts";
import { TrendingUp, BarChart4, Volume2, Zap, Calendar, Filter } from "lucide-react";
import { Token } from "../types";
import { useState } from "react";

interface BondingCurveAnalyticsProps {
  tokens: Token[];
  onSelectToken?: (token: Token) => void;
}

export default function BondingCurveAnalytics({ tokens, onSelectToken }: BondingCurveAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<"1d" | "7d" | "30d" | "90d">("7d");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Category filtering
  const categories = Array.from(new Set(tokens.map(t => t.category)));
  const filteredTokens = selectedCategory === "all" ? tokens : tokens.filter(t => t.category === selectedCategory);

  // Calculate ecosystem metrics
  const totalEcosystemVolume = filteredTokens.reduce((sum, t) => sum + t.volume24h, 0);
  const totalEcosystemReserves = filteredTokens.reduce((sum, t) => sum + t.reserveEth, 0);
  const totalMarketCap = filteredTokens.reduce((sum, t) => sum + t.marketCap, 0);
  const totalFeesGenerated = filteredTokens.reduce((sum, t) => sum + t.creatorFeesEarned, 0);

  // Volume trend data (mock)
  const volumeTrendData = [
    { date: "Mon", volume: totalEcosystemVolume * 0.75, fees: totalFeesGenerated * 0.75, liquidity: totalEcosystemReserves * 0.8 },
    { date: "Tue", volume: totalEcosystemVolume * 0.88, fees: totalFeesGenerated * 0.88, liquidity: totalEcosystemReserves * 0.85 },
    { date: "Wed", volume: totalEcosystemVolume * 0.82, fees: totalFeesGenerated * 0.82, liquidity: totalEcosystemReserves * 0.83 },
    { date: "Thu", volume: totalEcosystemVolume * 0.95, fees: totalFeesGenerated * 0.95, liquidity: totalEcosystemReserves * 0.9 },
    { date: "Fri", volume: totalEcosystemVolume * 1.1, fees: totalFeesGenerated * 1.1, liquidity: totalEcosystemReserves * 0.95 },
    { date: "Sat", volume: totalEcosystemVolume * 1.2, fees: totalFeesGenerated * 1.2, liquidity: totalEcosystemReserves * 1.02 },
    { date: "Sun", volume: totalEcosystemVolume, fees: totalFeesGenerated, liquidity: totalEcosystemReserves }
  ];

  // Fee distribution by category
  const feesByCategory = categories.map(cat => ({
    category: cat,
    fees: tokens.filter(t => t.category === cat).reduce((sum, t) => sum + t.creatorFeesEarned, 0),
    volume: tokens.filter(t => t.category === cat).reduce((sum, t) => sum + t.volume24h, 0)
  })).sort((a, b) => b.fees - a.fees);

  // Token performance ranking
  const topTokensByVolume = [...filteredTokens]
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, 8)
    .map((t, idx) => ({
      symbol: t.symbol,
      volume: t.volume24h,
      marketCap: t.marketCap,
      reserves: t.reserveEth,
      fees: t.creatorFeesEarned,
      priceChange: (Math.random() * 30 - 15), // Mock price change %
      rank: idx + 1
    }));

  // Liquidity provider data
  const topLiquidityProviders = [...filteredTokens]
    .sort((a, b) => b.reserveEth - a.reserveEth)
    .slice(0, 5)
    .map((t, idx) => ({
      symbol: t.symbol,
      name: t.name,
      reserves: t.reserveEth,
      supply: t.supply,
      marketCap: t.marketCap,
      apr: (Math.random() * 80 + 20).toFixed(1), // Mock APR
      rank: idx + 1
    }));

  // Fee accumulation by day
  const feeAccumulationData = [
    { date: "Mon", accumulated: 2.15, daily: 0.28 },
    { date: "Tue", accumulated: 2.88, daily: 0.73 },
    { date: "Wed", accumulated: 3.42, daily: 0.54 },
    { date: "Thu", accumulated: 4.15, daily: 0.73 },
    { date: "Fri", accumulated: 5.22, daily: 1.07 },
    { date: "Sat", accumulated: 6.98, daily: 1.76 },
    { date: "Sun", accumulated: 8.24, daily: 1.26 }
  ];

  return (
    <div id="bonding-curve-analytics-root" className="space-y-6 animate-fade-in">
      
      {/* Ecosystem Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-xl border border-white/5 bg-zinc-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-brand-blue/5 blur-2xl pointer-events-none"></div>
          <span className="block text-[9px] uppercase font-bold text-zinc-500 mb-2">24h Ecosystem Volume</span>
          <span className="block text-2xl font-mono font-bold text-white">{totalEcosystemVolume.toFixed(2)} ETH</span>
          <span className="text-[10px] text-emerald-400 font-mono mt-2 block">+18.5% from yesterday</span>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-white/5 bg-zinc-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-brand-purple/5 blur-2xl pointer-events-none"></div>
          <span className="block text-[9px] uppercase font-bold text-zinc-500 mb-2">Total Fees Generated</span>
          <span className="block text-2xl font-mono font-bold text-white">{totalFeesGenerated.toFixed(2)} ETH</span>
          <span className="text-[10px] text-brand-purple font-mono mt-2 block">1% curve fee share</span>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-white/5 bg-zinc-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none"></div>
          <span className="block text-[9px] uppercase font-bold text-zinc-500 mb-2">Total Market Valuation</span>
          <span className="block text-2xl font-mono font-bold text-white">{totalMarketCap.toFixed(2)} ETH</span>
          <span className="text-[10px] text-emerald-400 font-mono mt-2 block">${(totalMarketCap * 2500).toLocaleString()} USD</span>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-white/5 bg-zinc-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-cyan-500/5 blur-2xl pointer-events-none"></div>
          <span className="block text-[9px] uppercase font-bold text-zinc-500 mb-2">Locked Reserves (TVL)</span>
          <span className="block text-2xl font-mono font-bold text-white">{totalEcosystemReserves.toFixed(2)} ETH</span>
          <span className="text-[10px] text-cyan-400 font-mono mt-2 block">{filteredTokens.length} active curves</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Volume & Fees Trend */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-brand-blue" />
                Volume & Fee Trends
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono block mt-1">7-day ecosystem activity</span>
            </div>
            <div className="flex gap-1.5">
              {(["1d", "7d", "30d", "90d"] as const).map(range => (
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
              <ComposedChart data={volumeTrendData}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" />
                <XAxis dataKey="date" stroke="#52525b" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis stroke="#52525b" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }} />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar dataKey="volume" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="fees" stroke="#8b5cf6" strokeWidth={2} yAxisId="right" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fee Accumulation Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
          <div>
            <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              Cumulative Fee Distribution
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono block mt-1">Protocol earnings accumulation</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={feeAccumulationData}>
                <defs>
                  <linearGradient id="colorAccum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" />
                <XAxis dataKey="date" stroke="#52525b" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis stroke="#52525b" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }} />
                <Area type="monotone" dataKey="accumulated" stroke="#10b981" fillOpacity={1} fill="url(#colorAccum)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/30 border border-white/5">
        <Filter className="w-4 h-4 text-zinc-400" />
        <span className="text-xs font-mono text-zinc-400">Category Filter:</span>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-all ${
              selectedCategory === "all"
                ? "bg-brand-blue text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-all capitalize ${
                selectedCategory === cat
                  ? "bg-brand-purple text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Top Tokens by Volume */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
          <Volume2 className="w-4 h-4 text-brand-blue" />
          Top Tokens by 24h Volume
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/5 text-zinc-500">
                <th className="pb-3 pl-2">Rank</th>
                <th className="pb-3">Symbol</th>
                <th className="pb-3">24h Volume</th>
                <th className="pb-3">Market Cap</th>
                <th className="pb-3">Reserves</th>
                <th className="pb-3 text-right pr-2">Price Change</th>
              </tr>
            </thead>
            <tbody>
              {topTokensByVolume.map((token) => (
                <tr key={token.symbol} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                  <td className="py-3 pl-2 font-bold text-brand-purple">#{token.rank}</td>
                  <td className="py-3 font-bold text-white">{token.symbol}</td>
                  <td className="py-3 text-cyan-400">{token.volume.toFixed(3)} ETH</td>
                  <td className="py-3 text-zinc-300">{token.marketCap.toFixed(2)} ETH</td>
                  <td className="py-3 text-zinc-300">{token.reserves.toFixed(3)} ETH</td>
                  <td className={`py-3 text-right pr-2 font-bold ${token.priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {token.priceChange >= 0 ? '+' : ''}{token.priceChange.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Liquidity Providers */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
          <BarChart4 className="w-4 h-4 text-emerald-400" />
          Highest Liquidity Pools
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {topLiquidityProviders.map((pool, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-white/5 bg-zinc-900/40 hover:border-brand-blue/50 transition-all cursor-pointer"
              onClick={() => {
                const token = tokens.find(t => t.symbol === pool.symbol);
                if (token && onSelectToken) onSelectToken(token);
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-bold text-white">{pool.symbol}</div>
                  <div className="text-[9px] text-zinc-500 truncate">{pool.name}</div>
                </div>
                <span className="text-[10px] bg-brand-blue/20 text-brand-blue font-bold px-2 py-1 rounded">#{pool.rank}</span>
              </div>
              <div className="space-y-1.5 text-[9px]">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Reserves:</span>
                  <span className="font-mono font-bold text-cyan-400">{pool.reserves.toFixed(2)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">APR:</span>
                  <span className="font-mono font-bold text-emerald-400">{pool.apr}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Market Cap:</span>
                  <span className="font-mono font-bold text-white">{pool.marketCap.toFixed(2)} ETH</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fee Distribution by Category */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
          <BarChart4 className="w-4 h-4 text-brand-purple" />
          Fee Distribution by Category
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/5 text-zinc-500">
                <th className="pb-3 pl-2">Category</th>
                <th className="pb-3">Total Fees</th>
                <th className="pb-3">24h Volume</th>
                <th className="pb-3 text-right pr-2">Fee %</th>
              </tr>
            </thead>
            <tbody>
              {feesByCategory.map((cat, idx) => {
                const totalFees = feesByCategory.reduce((sum, c) => sum + c.fees, 0);
                const feePercent = ((cat.fees / totalFees) * 100) || 0;
                return (
                  <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                    <td className="py-3 pl-2 font-bold text-white capitalize">{cat.category}</td>
                    <td className="py-3 text-emerald-400">{cat.fees.toFixed(3)} ETH</td>
                    <td className="py-3 text-cyan-400">{cat.volume.toFixed(2)} ETH</td>
                    <td className="py-3 text-right pr-2 text-brand-purple font-bold">{feePercent.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/30 border border-white/5 text-[10px] text-zinc-400">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>Data refreshed: {new Date().toLocaleTimeString()}</span>
        </div>
        <span className="font-mono">Base Network - Live Metrics</span>
      </div>
    </div>
  );
}
