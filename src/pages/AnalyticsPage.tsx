import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Token } from "../types";
import { TrendingUp, BarChart4, DollarSign, Wallet2, Award, ArrowUpRight } from "lucide-react";

interface AnalyticsPageProps {
  tokens: Token[];
  onSelectToken: (token: Token) => void;
}

export default function AnalyticsPage({ tokens, onSelectToken }: AnalyticsPageProps) {
  // Chart seed data
  const volumeHistory = [
    { name: "Mon", Volume: 12.4, TVL: 45.2, Fees: 0.12 },
    { name: "Tue", Volume: 15.8, TVL: 45.8, Fees: 0.15 },
    { name: "Wed", Volume: 11.2, TVL: 46.1, Fees: 0.11 },
    { name: "Thu", Volume: 18.9, TVL: 47.4, Fees: 0.18 },
    { name: "Fri", Volume: 24.5, TVL: 48.9, Fees: 0.24 },
    { name: "Sat", Volume: 32.1, TVL: 51.2, Fees: 0.32 },
    { name: "Sun", Volume: 28.4, TVL: 52.4, Fees: 0.28 }
  ];

  const sortedByMcap = [...tokens].sort((a, b) => b.marketCap - a.marketCap).slice(0, 5);

  return (
    <div id="analytics-suite-root" className="space-y-6 animate-fade-in">
      
      {/* Visual statistics grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-5 rounded-xl border border-white/5 bg-zinc-900/40 relative">
          <span className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Cumulative Swaps Volume</span>
          <span className="block text-xl font-mono font-bold text-white tracking-tight">173.3 ETH</span>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 block flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +15.4% (24h)
          </span>
        </div>
        <div className="glass-panel p-5 rounded-xl border border-white/5 bg-zinc-900/40 relative">
          <span className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Total Fee Share Collected</span>
          <span className="block text-xl font-mono font-bold text-white tracking-tight">1.733 ETH</span>
          <span className="text-[10px] text-zinc-500 font-mono mt-1 block">1% flat linear curve fee</span>
        </div>
        <div className="glass-panel p-5 rounded-xl border border-white/5 bg-zinc-900/40 relative">
          <span className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Locked reserves TVL</span>
          <span className="block text-xl font-mono font-bold text-white tracking-tight">28.42 ETH</span>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 block flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +8.2% (24h)
          </span>
        </div>
        <div className="glass-panel p-5 rounded-xl border border-white/5 bg-zinc-900/40 relative">
          <span className="block text-[9px] uppercase font-bold text-zinc-500 mb-1">Ecosystem Transactions</span>
          <span className="block text-xl font-mono font-bold text-white tracking-tight">8,142 TXS</span>
          <span className="text-[10px] text-brand-purple font-mono mt-1 block font-bold uppercase">Base Sepolia L2 active</span>
        </div>
      </div>

      {/* Main double charting splits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cumulative area chart */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
          <div>
            <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-brand-purple" />
              Volume Trajectory History
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono block">Weekly ETH volume traded in bonding curves</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeHistory}>
                <defs>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" />
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis stroke="#52525b" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }} />
                <Area type="monotone" dataKey="Volume" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorVol)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Protocol fees bar chart */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
          <div>
            <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
              <BarChart4 className="w-4 h-4 text-brand-blue" />
              Fee Allocations Distribution
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono block">Daily protocol earnings from linear curves</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" />
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis stroke="#52525b" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }} />
                <Bar dataKey="Fees" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Top Performing Token Table list */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
          <Award className="w-4 h-4 text-brand-purple" />
          Top 5 Performing Bonding Curves
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/5 text-zinc-500">
                <th className="pb-3 pl-2">Rank</th>
                <th className="pb-3">Asset</th>
                <th className="pb-3">Spot Price</th>
                <th className="pb-3">Market Valuation</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedByMcap.map((token, index) => (
                <tr key={token.address} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                  <td className="py-4 pl-2 font-bold text-brand-purple">#{index + 1}</td>
                  <td className="py-4 font-sans font-bold flex items-center gap-2">
                    <img src={token.logoUrl} alt={token.name} className="w-6 h-6 rounded-lg object-cover border border-white/5" />
                    <div>
                      <span className="block text-white text-xs leading-none">{token.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{token.symbol}</span>
                    </div>
                  </td>
                  <td className="py-4 text-zinc-300">{(token.currentPrice * 1000000).toFixed(3)} μETH</td>
                  <td className="py-4 text-emerald-400 font-bold">{token.marketCap.toFixed(3)} ETH</td>
                  <td className="py-4 text-right pr-2">
                    <button
                      id={`analytic-trade-trigger-${token.address}`}
                      onClick={() => onSelectToken(token)}
                      className="px-3 py-1 bg-zinc-800 hover:bg-brand-purple text-zinc-300 hover:text-white rounded text-[10px] font-bold transition-all"
                    >
                      Trade →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
