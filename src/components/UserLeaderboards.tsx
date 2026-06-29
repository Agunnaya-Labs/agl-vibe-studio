import { Crown, TrendingUp, Zap, Coins, Gift, Award, Medal } from "lucide-react";
import { Token, AIAgent, Activity } from "../types";
import { useState } from "react";

interface LeaderboardUser {
  rank: number;
  address: string;
  username: string;
  avatar: string;
  score: number;
  change: number;
  badges: string[];
}

interface UserLeaderboardsProps {
  tokens: Token[];
  agents: AIAgent[];
  activities: Activity[];
}

export default function UserLeaderboards({ tokens, agents, activities }: UserLeaderboardsProps) {
  const [activeLeaderboard, setActiveLeaderboard] = useState<"traders" | "creators" | "agents" | "contributors">("traders");

  // Generate mock leaderboard data from actual data
  const generateLeaderboardData = () => {
    // Extract unique creators and traders from tokens
    const creators: LeaderboardUser[] = [];
    const creatorMap = new Map<string, number>();
    
    tokens.forEach(t => {
      creatorMap.set(t.creator, (creatorMap.get(t.creator) || 0) + t.creatorFeesEarned);
    });

    let rank = 1;
    Array.from(creatorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([creator, fees]) => {
        creators.push({
          rank: rank++,
          address: creator,
          username: `Creator_${creator.slice(0, 6)}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator}`,
          score: fees,
          change: Math.random() * 20 - 5,
          badges: fees > 5 ? ["top_creator", "verified"] : fees > 2 ? ["verified"] : []
        });
      });

    // Generate traders from activity
    const traders: LeaderboardUser[] = [];
    const traderMap = new Map<string, number>();

    activities.slice(0, 100).forEach(act => {
      if (act.type === "buy" || act.type === "sell") {
        traderMap.set(act.user, (traderMap.get(act.user) || 0) + act.ethValue);
      }
    });

    rank = 1;
    Array.from(traderMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([trader, volume]) => {
        traders.push({
          rank: rank++,
          address: trader,
          username: `Trader_${trader.slice(0, 6)}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${trader}`,
          score: volume,
          change: Math.random() * 15 - 5,
          badges: volume > 3 ? ["top_trader"] : []
        });
      });

    // Agent operators leaderboard
    const agentOperators: LeaderboardUser[] = agents
      .sort((a, b) => b.queryCount - a.queryCount)
      .slice(0, 10)
      .map((agent, idx) => ({
        rank: idx + 1,
        address: agent.creator,
        username: agent.name,
        avatar: agent.avatarUrl,
        score: agent.queryCount,
        change: Math.random() * 25 - 10,
        badges: agent.queryCount > 100 ? ["top_agent"] : []
      }));

    // Community contributors
    const contributors: LeaderboardUser[] = [];
    const contributorMap = new Map<string, number>();

    activities.forEach(act => {
      const points = act.type === "deployment" ? 50 : act.type === "create" ? 30 : act.type === "achievement" ? 20 : 5;
      contributorMap.set(act.user, (contributorMap.get(act.user) || 0) + points);
    });

    rank = 1;
    Array.from(contributorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([user, points]) => {
        contributors.push({
          rank: rank++,
          address: user,
          username: `Contributor_${user.slice(0, 6)}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user}`,
          score: points,
          change: Math.random() * 30 - 10,
          badges: points > 100 ? ["community_hero"] : points > 50 ? ["active"] : []
        });
      });

    return { creators, traders, agentOperators, contributors };
  };

  const leaderboards = generateLeaderboardData();

  const getLeaderboardData = () => {
    switch (activeLeaderboard) {
      case "creators":
        return { data: leaderboards.creators, title: "Top Token Creators", subtitle: "Ranked by total creator fees earned", icon: Coins };
      case "agents":
        return { data: leaderboards.agentOperators, title: "Top AI Agents", subtitle: "Ranked by query count and revenue", icon: Zap };
      case "contributors":
        return { data: leaderboards.contributors, title: "Community Contributors", subtitle: "Ranked by activity and engagement points", icon: Gift };
      default:
        return { data: leaderboards.traders, title: "Top Traders", subtitle: "Ranked by 24h trading volume and activity", icon: TrendingUp };
    }
  };

  const { data: currentData, title, subtitle, icon: IconComp } = getLeaderboardData();

  const getBadgeColor = (badge: string) => {
    if (badge.includes("verified")) return "bg-brand-blue/20 text-brand-blue";
    if (badge.includes("top")) return "bg-emerald-500/20 text-emerald-400";
    if (badge.includes("hero")) return "bg-brand-purple/20 text-brand-purple";
    return "bg-zinc-700/50 text-zinc-300";
  };

  const getScoreLabel = () => {
    switch (activeLeaderboard) {
      case "creators":
        return "Total Fees (ETH)";
      case "agents":
        return "Query Count";
      case "contributors":
        return "Points";
      default:
        return "Volume (ETH)";
    }
  };

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-silver" />;
      case 3:
        return <Medal className="w-5 h-5 text-orange-600" />;
      default:
        return <span className="font-mono font-bold text-zinc-400">#{rank}</span>;
    }
  };

  return (
    <div id="user-leaderboards-root" className="space-y-6 animate-fade-in">
      
      {/* Leaderboard Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {[
          { id: "traders" as const, label: "Top Traders", icon: TrendingUp },
          { id: "creators" as const, label: "Top Creators", icon: Coins },
          { id: "agents" as const, label: "Top Agents", icon: Zap },
          { id: "contributors" as const, label: "Contributors", icon: Gift }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveLeaderboard(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all whitespace-nowrap ${
              activeLeaderboard === tab.id
                ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20"
                : "bg-zinc-800 text-zinc-400 hover:text-white border border-white/5"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Leaderboard Card */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-6">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <IconComp className="w-5 h-5 text-brand-purple" />
            <h2 className="text-xl font-bold font-display text-white">{title}</h2>
          </div>
          <p className="text-xs text-zinc-400 font-mono">{subtitle}</p>
        </div>

        {/* Top 3 Podium */}
        {currentData.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {currentData.slice(0, 3).map((user, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  idx === 0
                    ? "bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20"
                    : idx === 1
                    ? "bg-gradient-to-br from-slate-300/10 to-slate-400/5 border-slate-400/20"
                    : "bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-600/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  {getRankMedal(idx + 1)}
                  <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                    idx === 0 ? "bg-yellow-500/30 text-yellow-300" : idx === 1 ? "bg-slate-400/30 text-slate-200" : "bg-orange-600/30 text-orange-200"
                  }`}>
                    #{idx + 1}
                  </span>
                </div>
                <img src={user.avatar} alt={user.username} className="w-12 h-12 rounded-lg mb-2 object-cover" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-white truncate">{user.username}</p>
                  <p className="font-mono text-[9px] text-zinc-400 truncate">{user.address.slice(0, 8)}...</p>
                  <p className={`font-mono font-bold text-sm ${
                    idx === 0 ? "text-yellow-400" : idx === 1 ? "text-slate-300" : "text-orange-400"
                  }`}>
                    {typeof user.score === "number" ? user.score.toFixed(2) : user.score}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/5 text-zinc-500">
                <th className="pb-3 pl-2">Rank</th>
                <th className="pb-3">User</th>
                <th className="pb-3 text-right">{getScoreLabel()}</th>
                <th className="pb-3 text-right">24h Change</th>
                <th className="pb-3 text-right pr-2">Badges</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((user, idx) => (
                <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-2">
                      {getRankMedal(user.rank)}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <img src={user.avatar} alt={user.username} className="w-6 h-6 rounded-lg object-cover" />
                      <div>
                        <div className="font-bold text-white">{user.username}</div>
                        <div className="text-[9px] text-zinc-500 font-mono">{user.address.slice(0, 10)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <span className="font-bold text-brand-blue">
                      {typeof user.score === "number" ? user.score.toFixed(2) : user.score}
                    </span>
                  </td>
                  <td className={`py-3 text-right font-bold ${user.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {user.change >= 0 ? "+" : ""}{user.change.toFixed(1)}%
                  </td>
                  <td className="py-3 text-right pr-2 space-x-1">
                    {user.badges.length > 0 ? (
                      <div className="flex justify-end gap-1">
                        {user.badges.slice(0, 2).map((badge, bidx) => (
                          <span
                            key={bidx}
                            className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${getBadgeColor(badge)}`}
                          >
                            {badge.split("_").join(" ")}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-zinc-600">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leaderboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-zinc-900/40">
          <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-2">Total Participants</span>
          <span className="text-2xl font-mono font-bold text-white">{currentData.length}</span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-zinc-900/40">
          <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-2">Weekly Active</span>
          <span className="text-2xl font-mono font-bold text-brand-blue">{Math.floor(currentData.length * 0.7)}</span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-zinc-900/40">
          <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-2">Top Score</span>
          <span className="text-2xl font-mono font-bold text-emerald-400">
            {currentData[0] ? (typeof currentData[0].score === "number" ? currentData[0].score.toFixed(2) : currentData[0].score) : "-"}
          </span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-zinc-900/40">
          <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-2">Average Score</span>
          <span className="text-2xl font-mono font-bold text-brand-purple">
            {(currentData.reduce((sum, u) => sum + (typeof u.score === "number" ? u.score : 0), 0) / currentData.length).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Achievement Badges Guide */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
          <Award className="w-4 h-4 text-brand-purple" />
          Achievement Badges
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-white/5 bg-zinc-900/40">
            <span className="inline-block px-2 py-1 rounded text-[8px] font-bold uppercase bg-yellow-500/20 text-yellow-400 mb-2">Top Creator</span>
            <p className="text-[9px] text-zinc-400">Earned 5+ ETH in creator fees</p>
          </div>
          <div className="p-3 rounded-lg border border-white/5 bg-zinc-900/40">
            <span className="inline-block px-2 py-1 rounded text-[8px] font-bold uppercase bg-brand-blue/20 text-brand-blue mb-2">Top Trader</span>
            <p className="text-[9px] text-zinc-400">Generated 2+ ETH in volume</p>
          </div>
          <div className="p-3 rounded-lg border border-white/5 bg-zinc-900/40">
            <span className="inline-block px-2 py-1 rounded text-[8px] font-bold uppercase bg-emerald-500/20 text-emerald-400 mb-2">Verified</span>
            <p className="text-[9px] text-zinc-400">Multiple projects deployed</p>
          </div>
          <div className="p-3 rounded-lg border border-white/5 bg-zinc-900/40">
            <span className="inline-block px-2 py-1 rounded text-[8px] font-bold uppercase bg-brand-purple/20 text-brand-purple mb-2">Community Hero</span>
            <p className="text-[9px] text-zinc-400">150+ activity points earned</p>
          </div>
        </div>
      </div>
    </div>
  );
}
