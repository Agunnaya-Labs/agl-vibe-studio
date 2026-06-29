import UserLeaderboards from "../components/UserLeaderboards";
import { Token, AIAgent, Activity } from "../types";
import { Trophy, Zap } from "lucide-react";

interface LeaderboardsPageProps {
  tokens: Token[];
  agents: AIAgent[];
  activities: Activity[];
}

export default function LeaderboardsPage({ tokens, agents, activities }: LeaderboardsPageProps) {

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-white">Community Leaderboards</h1>
          <p className="text-xs text-zinc-400 mt-1">Compete with other developers and claim your place in the rankings</p>
        </div>
        <div className="px-4 py-2.5 rounded-xl bg-brand-purple/10 border border-brand-purple/20 flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand-purple" />
          <span className="text-xs font-mono font-bold text-brand-purple">Live Rankings</span>
        </div>
      </div>

      {/* Main Leaderboards Component */}
      <UserLeaderboards
        tokens={tokens}
        agents={agents}
        activities={activities}
      />

      {/* Leaderboard Guide */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-yellow-400" />
          How to Climb the Leaderboards
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-bold text-brand-blue uppercase mb-2">Top Traders</h4>
            <ul className="text-[10px] text-zinc-300 space-y-1 list-disc list-inside">
              <li>Execute high-volume token swaps and trades</li>
              <li>Trade across multiple bonding curves</li>
              <li>Participate actively in 24h trading sessions</li>
              <li>Build a diverse trading portfolio</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-400 uppercase mb-2">Top Creators</h4>
            <ul className="text-[10px] text-zinc-300 space-y-1 list-disc list-inside">
              <li>Deploy popular tokens via bonding curves</li>
              <li>Maximize creator fee earnings</li>
              <li>Build successful NFT collections</li>
              <li>Create valuable AI agents</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-cyan-400 uppercase mb-2">Top Agents</h4>
            <ul className="text-[10px] text-zinc-300 space-y-1 list-disc list-inside">
              <li>Deploy AI agents with high usage fees</li>
              <li>Increase query count and adoption</li>
              <li>Maintain 100% uptime and performance</li>
              <li>Generate consistent query revenue</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-brand-purple uppercase mb-2">Community Contributors</h4>
            <ul className="text-[10px] text-zinc-300 space-y-1 list-disc list-inside">
              <li>Complete on-chain quests and missions</li>
              <li>Unlock achievements and badges</li>
              <li>Participate in governance voting</li>
              <li>Share referrals and build community</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Rewards Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-yellow-500/5">
          <h4 className="text-xs font-bold text-yellow-400 uppercase mb-2">Rank Rewards</h4>
          <div className="space-y-1.5 text-[10px] text-zinc-300">
            <div className="flex justify-between items-center">
              <span>1st Place:</span>
              <span className="font-bold text-yellow-400">500 AGL</span>
            </div>
            <div className="flex justify-between items-center">
              <span>2nd Place:</span>
              <span className="font-bold text-slate-300">300 AGL</span>
            </div>
            <div className="flex justify-between items-center">
              <span>3rd Place:</span>
              <span className="font-bold text-orange-400">150 AGL</span>
            </div>
            <div className="flex justify-between items-center">
              <span>4-10th:</span>
              <span className="font-bold text-zinc-400">50 AGL</span>
            </div>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-emerald-500/5">
          <h4 className="text-xs font-bold text-emerald-400 uppercase mb-2">Weekly Updates</h4>
          <p className="text-[10px] text-zinc-300 mb-3">Rankings are updated every 24 hours. New weekly seasons reset on Mondays at 00:00 UTC.</p>
          <div className="text-[9px] text-zinc-500 font-mono">Last Updated: Just now</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-cyan-500/5">
          <h4 className="text-xs font-bold text-cyan-400 uppercase mb-2">Seasonal Goals</h4>
          <ul className="text-[10px] text-zinc-300 space-y-1 list-disc list-inside">
            <li>Reach Top 100 traders</li>
            <li>Deploy 5+ projects</li>
            <li>Unlock all badges</li>
            <li>Build community</li>
          </ul>
        </div>
      </div>

      {/* Competition Stats */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-4">
        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white">Current Season Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
          <div className="p-3 bg-zinc-900/40 rounded-lg border border-white/5">
            <span className="text-zinc-500 block mb-2">Total Players</span>
            <span className="text-lg font-bold text-white">{(tokens.length + agents.length) * 5}</span>
          </div>
          <div className="p-3 bg-zinc-900/40 rounded-lg border border-white/5">
            <span className="text-zinc-500 block mb-2">Total Volume</span>
            <span className="text-lg font-bold text-brand-blue">{tokens.reduce((sum, t) => sum + t.volume24h, 0).toFixed(1)} ETH</span>
          </div>
          <div className="p-3 bg-zinc-900/40 rounded-lg border border-white/5">
            <span className="text-zinc-500 block mb-2">Prize Pool</span>
            <span className="text-lg font-bold text-emerald-400">5,000 AGL</span>
          </div>
          <div className="p-3 bg-zinc-900/40 rounded-lg border border-white/5">
            <span className="text-zinc-500 block mb-2">Season End</span>
            <span className="text-lg font-bold text-brand-purple">6 days</span>
          </div>
        </div>
      </div>
    </div>
  );
}
