import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Users, Award, DollarSign, Gift, ArrowUpRight, ArrowDownLeft, Calendar, Copy } from "lucide-react";
import { Token, AIAgent, ReferralRecord } from "../types";
import { useState } from "react";

interface RevenueAnalyticsProps {
  userTokens: Token[];
  userAgents: AIAgent[];
  referralCode?: string;
  totalCreatorFeesEarned?: number;
  aglTokenBalance?: number;
  onCopyReferralLink?: () => void;
}

export default function RevenueAnalytics({
  userTokens,
  userAgents,
  referralCode,
  totalCreatorFeesEarned = 0,
  aglTokenBalance = 0,
  onCopyReferralLink
}: RevenueAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [selectedRevenueSource, setSelectedRevenueSource] = useState<string>("all");

  // Calculate revenue metrics
  const creatorFeesFromTokens = userTokens.reduce((sum, t) => sum + t.creatorFeesEarned, 0);
  const agentRevenueTotal = userAgents.reduce((sum, a) => sum + a.lifetimeRevenueEth, 0);
  const referralRevenueEstimated = creatorFeesFromTokens * 0.2; // 20% referral share
  const totalRevenueEarned = creatorFeesFromTokens + agentRevenueTotal + referralRevenueEstimated;

  // Monthly revenue data
  const monthlyRevenueData = [
    { month: "Week 1", creator: 0.12, agent: 0.05, referral: 0.034 },
    { month: "Week 2", creator: 0.18, agent: 0.08, referral: 0.054 },
    { month: "Week 3", creator: 0.25, agent: 0.12, referral: 0.075 },
    { month: "Week 4", creator: 0.35, agent: 0.15, referral: 0.105 },
    { month: "Week 5", creator: 0.42, agent: 0.18, referral: 0.126 },
    { month: "Week 6", creator: 0.51, agent: 0.22, referral: 0.153 },
    { month: "Week 7", creator: 0.62, agent: 0.28, referral: 0.186 },
    { month: "Week 8", creator: 0.75, agent: 0.35, referral: 0.225 }
  ];

  // Revenue by source
  const revenueBySource = [
    { name: "Creator Fees", value: creatorFeesFromTokens, color: "#8b5cf6" },
    { name: "Agent Revenue", value: agentRevenueTotal, color: "#0ea5e9" },
    { name: "Referral Rewards", value: referralRevenueEstimated, color: "#10b981" }
  ].filter(item => item.value > 0);

  // Payout history (mock)
  const payoutHistory = [
    { id: "1", date: "2025-06-28", type: "Creator Fees", amount: 0.15, status: "Completed", txHash: "0x1234...5678" },
    { id: "2", date: "2025-06-27", type: "Referral Rewards", amount: 0.042, status: "Completed", txHash: "0x9abc...def0" },
    { id: "3", date: "2025-06-26", type: "Agent Revenue", amount: 0.08, status: "Pending", txHash: "-" },
    { id: "4", date: "2025-06-25", type: "Creator Fees", amount: 0.22, status: "Completed", txHash: "0x5678...9abc" },
    { id: "5", date: "2025-06-24", type: "Referral Rewards", amount: 0.058, status: "Completed", txHash: "0xdef0...1234" },
    { id: "6", date: "2025-06-23", type: "Agent Revenue", amount: 0.12, status: "Completed", txHash: "0xabcd...ef12" },
    { id: "7", date: "2025-06-22", type: "Creator Fees", amount: 0.18, status: "Completed", txHash: "0x1234...abcd" }
  ];

  // Top earning tokens
  const topEarningTokens = [...userTokens]
    .sort((a, b) => b.creatorFeesEarned - a.creatorFeesEarned)
    .slice(0, 5);

  // Top earning agents
  const topEarningAgents = [...userAgents]
    .sort((a, b) => b.lifetimeRevenueEth - a.lifetimeRevenueEth)
    .slice(0, 5);

  // Referral performance metrics
  const estimatedReferrals = Math.floor(creatorFeesFromTokens / 0.5); // Estimate based on fees
  const referralConversionRate = estimatedReferrals > 0 ? (creatorFeesFromTokens / estimatedReferrals) * 100 : 0;

  return (
    <div id="revenue-analytics-root" className="space-y-6 animate-fade-in">
      
      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 bg-zinc-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none"></div>
          <span className="block text-[9px] uppercase font-bold text-zinc-500 mb-2">Total Revenue Earned</span>
          <span className="block text-2xl font-mono font-bold text-emerald-400">{totalRevenueEarned.toFixed(3)} ETH</span>
          <span className="text-[10px] text-zinc-400 mt-2 block font-mono">≈ ${(totalRevenueEarned * 2500).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD</span>
        </div>

        {/* Creator Fees */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 bg-zinc-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-brand-purple/5 blur-2xl pointer-events-none"></div>
          <span className="block text-[9px] uppercase font-bold text-zinc-500 mb-2">Creator Fees Earned</span>
          <span className="block text-2xl font-mono font-bold text-brand-purple">{creatorFeesFromTokens.toFixed(3)} ETH</span>
          <span className="text-[10px] text-zinc-400 mt-2 block font-mono">{userTokens.length} tokens deployed</span>
        </div>

        {/* Agent Revenue */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 bg-zinc-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-cyan-500/5 blur-2xl pointer-events-none"></div>
          <span className="block text-[9px] uppercase font-bold text-zinc-500 mb-2">Agent Query Revenue</span>
          <span className="block text-2xl font-mono font-bold text-cyan-400">{agentRevenueTotal.toFixed(3)} ETH</span>
          <span className="text-[10px] text-zinc-400 mt-2 block font-mono">{userAgents.length} active agents</span>
        </div>

        {/* Referral Rewards */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 bg-zinc-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none"></div>
          <span className="block text-[9px] uppercase font-bold text-zinc-500 mb-2">Referral Rewards (20%)</span>
          <span className="block text-2xl font-mono font-bold text-emerald-400">{referralRevenueEstimated.toFixed(3)} ETH</span>
          <span className="text-[10px] text-zinc-400 mt-2 block font-mono">Est. {estimatedReferrals} referrals</span>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
          <Gift className="w-4 h-4 text-brand-purple" />
          Your Referral Code
        </h3>
        <div className="flex items-center gap-3 p-4 bg-zinc-900/40 rounded-xl border border-white/10">
          <div className="flex-1">
            <div className="text-[9px] text-zinc-500 mb-1 uppercase font-bold">Referral Link</div>
            <div className="font-mono text-sm text-white break-all">
              https://agl-studio.io/?ref={referralCode || "your-code"}
            </div>
          </div>
          <button
            onClick={onCopyReferralLink}
            className="px-3 py-2.5 bg-brand-blue hover:bg-blue-600 rounded-lg transition-all flex items-center gap-2 text-white text-[10px] font-bold whitespace-nowrap"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 text-[10px]">
          <div className="p-3 bg-zinc-900/40 rounded-lg border border-white/5">
            <span className="text-zinc-400 block mb-1">Share Rate</span>
            <span className="font-bold text-emerald-400 text-sm">20%</span>
          </div>
          <div className="p-3 bg-zinc-900/40 rounded-lg border border-white/5">
            <span className="text-zinc-400 block mb-1">Est. Referrals</span>
            <span className="font-bold text-brand-blue text-sm">{estimatedReferrals}</span>
          </div>
          <div className="p-3 bg-zinc-900/40 rounded-lg border border-white/5">
            <span className="text-zinc-400 block mb-1">Conversion Rate</span>
            <span className="font-bold text-cyan-400 text-sm">{referralConversionRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Trend Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-brand-blue" />
                Revenue Trends
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono block mt-1">Weekly earnings breakdown</span>
            </div>
            <div className="flex gap-1.5">
              {(["7d", "30d", "90d", "all"] as const).map(range => (
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
              <BarChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" />
                <XAxis dataKey="month" stroke="#52525b" fontSize={9} fontFamily="JetBrains Mono" />
                <YAxis stroke="#52525b" fontSize={9} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }} />
                <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />
                <Bar dataKey="creator" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="agent" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="referral" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Distribution Pie Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
          <div>
            <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Revenue Sources
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono block mt-1">Breakdown by earning type</span>
          </div>
          <div className="flex items-center justify-center h-64">
            {revenueBySource.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueBySource}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {revenueBySource.map((entry, index) => (
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
              <div className="text-center text-zinc-400 text-xs">No revenue data available</div>
            )}
          </div>
          {revenueBySource.length > 0 && (
            <div className="space-y-2 text-[9px]">
              {revenueBySource.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-zinc-400">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-white">{item.value.toFixed(3)} ETH</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Earning Tokens */}
      {topEarningTokens.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
          <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
            <Award className="w-4 h-4 text-brand-purple" />
            Top Earning Tokens
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500">
                  <th className="pb-3 pl-2">Token</th>
                  <th className="pb-3">Fees Earned</th>
                  <th className="pb-3">Volume 24h</th>
                  <th className="pb-3 text-right pr-2">Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {topEarningTokens.map((token, idx) => (
                  <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                    <td className="py-3 pl-2 font-bold text-white">{token.symbol}</td>
                    <td className="py-3 text-emerald-400">{token.creatorFeesEarned.toFixed(3)} ETH</td>
                    <td className="py-3 text-cyan-400">{token.volume24h.toFixed(2)} ETH</td>
                    <td className="py-3 text-right pr-2 text-zinc-300">{token.marketCap.toFixed(2)} ETH</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Earning Agents */}
      {topEarningAgents.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
          <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
            <Award className="w-4 h-4 text-cyan-400" />
            Top Earning Agents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {topEarningAgents.map((agent, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-white/5 bg-zinc-900/40">
                <div className="flex items-start gap-3 mb-3">
                  <img src={agent.avatarUrl} alt={agent.name} className="w-8 h-8 rounded object-cover" />
                  <div>
                    <span className="block text-xs font-bold text-white">{agent.name}</span>
                    <span className="block text-[9px] text-zinc-500 font-mono">{agent.symbol}</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-[9px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Lifetime Revenue:</span>
                    <span className="font-mono font-bold text-emerald-400">{agent.lifetimeRevenueEth.toFixed(3)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Queries:</span>
                    <span className="font-mono font-bold text-cyan-400">{agent.queryCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Fee per Query:</span>
                    <span className="font-mono font-bold text-white">{agent.usageFeeEth.toFixed(6)} ETH</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payout History */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-brand-blue" />
          Recent Payouts
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/5 text-zinc-500">
                <th className="pb-3 pl-2">Date</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right pr-2">TX Hash</th>
              </tr>
            </thead>
            <tbody>
              {payoutHistory.map((payout) => (
                <tr key={payout.id} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                  <td className="py-3 pl-2 text-zinc-400">{payout.date}</td>
                  <td className="py-3 text-white font-bold">{payout.type}</td>
                  <td className="py-3 text-emerald-400">{payout.amount.toFixed(4)} ETH</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-[9px] font-bold ${
                      payout.status === "Completed" 
                        ? "bg-emerald-500/20 text-emerald-400" 
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {payout.status}
                    </span>
                  </td>
                  <td className="py-3 text-right pr-2 text-zinc-400">{payout.txHash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
