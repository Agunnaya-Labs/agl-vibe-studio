import React, { useState } from "react";
import { GameFiProject, WalletState } from "../types";
import { AgunnayaDatabase } from "../lib/db";
import { Award, ShieldAlert, Sparkles, Trophy, UserCheck, Plus, Zap, Activity } from "lucide-react";

interface GameFiPageProps {
  wallet: WalletState;
  games: GameFiProject[];
  onRefreshGames: () => void;
  addTerminalLog: (type: "info" | "success" | "error" | "buy" | "sell" | "system", message: string) => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function GameFiPage({ wallet, games, onRefreshGames, addTerminalLog, showToast }: GameFiPageProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prizePool, setPrizePool] = useState("0.1");
  const [loading, setLoading] = useState(false);

  // Claim achievement state
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.isConnected) {
      showToast("Connect wallet first.", "error");
      return;
    }
    if (!name || !description) return;
    setLoading(true);

    addTerminalLog("info", `Initiating GameFi Arena smart pool deployment for ${name}...`);

    setTimeout(() => {
      const generatedAddress = "0x" + Math.random().toString(16).substr(2, 40);
      const newGame: GameFiProject = {
        contractAddress: generatedAddress,
        name,
        symbol: "GMFI",
        description,
        creator: wallet.address,
        prizePoolEth: parseFloat(prizePool) || 0.1,
        activeSeasons: 1,
        missions: [
          { id: "m1", title: "Complete Bonding Swap", description: "Buy/Sell tokens on a curve", xpReward: 200, aglReward: 10, completed: false },
          { id: "m2", title: "Lock AGL for Staking", description: "Lock tokens inside the DeFi staking vaults", xpReward: 500, aglReward: 20, completed: false },
          { id: "m3", title: "Submit DAO Voting Ballot", description: "Participate in decentralized governance", xpReward: 300, aglReward: 5, completed: false }
        ],
        achievements: [
          { id: "ach-1", title: "Novice Gamer", description: "Complete your first on-chain challenge", badgeIcon: "Sparkles", unlocked: false }
        ],
        leaderboard: [
          { user: wallet.address, score: 0, rank: 1, xp: 0 },
          { user: "0x3456...bcde", score: 850, rank: 2, xp: 850 },
          { user: "0xcd78...3210", score: 620, rank: 3, xp: 620 }
        ],
        battlePass: [
          { level: 1, xpRequired: 100, rewardName: "Elite Badge", rewardType: "badge", unlocked: true }
        ],
        createdAt: Date.now()
      };

      const current = AgunnayaDatabase.getGameFi();
      current.push(newGame);
      AgunnayaDatabase.saveGameFi(current);

      // Deduct ETH
      const updatedWallet = { ...wallet, balanceEth: Math.max(0, wallet.balanceEth - (parseFloat(prizePool) + 0.005)) };
      AgunnayaDatabase.saveWallet(updatedWallet);
      onRefreshGames();

      AgunnayaDatabase.addActivity({
        type: "create",
        tokenSymbol: "GMFI",
        tokenAddress: newGame.contractAddress,
        user: wallet.address,
        amount: 0,
        ethValue: parseFloat(prizePool),
        details: `Created custom GameFi tournament Arena: ${newGame.name} with ${newGame.prizePoolEth} ETH locked in prize reward pool.`
      });

      addTerminalLog("success", `GameFi reward pools online at ${newGame.contractAddress}`);
      setLoading(false);
      setName("");
      setDescription("");
    }, 2000);
  };

  const handleClaimAchievement = (gameAddress: string, missionId: string) => {
    setClaimingId(missionId);

    setTimeout(() => {
      const all = AgunnayaDatabase.getGameFi();
      const game = all.find(g => g.contractAddress === gameAddress);

      if (game) {
        const mission = game.missions.find(m => m.id === missionId);
        if (mission) {
          mission.completed = true;
          // Add score
          const leader = game.leaderboard.find(l => l.user === wallet.address);
          if (leader) {
            leader.score += mission.xpReward;
          }

          AgunnayaDatabase.saveGameFi(all);
          onRefreshGames();

          AgunnayaDatabase.addActivity({
            type: "vote",
            tokenSymbol: "XP",
            tokenAddress: game.contractAddress,
            user: wallet.address,
            amount: mission.xpReward,
            ethValue: 0,
            details: `Completed mission "${mission.title}" in ${game.name} Arena. Awarded +${mission.xpReward} XP!`
          });

          addTerminalLog("success", `Awarded +${mission.xpReward} XP for achievements compliance!`);
        }
      }
      setClaimingId(null);
    }, 1200);
  };

  return (
    <div id="gamefi-studio-root" className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      
      {/* Create form panel */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-6">
          <div>
            <h2 className="text-base font-bold font-display text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-brand-purple" />
              GameFi Arena Builder
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Assemble fully verifiable smart-contract backed seasons with custom prize allocation pools, automated player achievements registries, and real-time leadership rosters.
            </p>
          </div>

          <form onSubmit={handleCreateTournament} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1.5">Tournament / Season Name</label>
                <input
                  id="game-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cyber Punk Grand Arena"
                  required
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-purple/40"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1.5">Initial Reward Pool (ETH)</label>
                <input
                  id="game-prizepool-input"
                  type="number"
                  step="0.01"
                  value={prizePool}
                  onChange={(e) => setPrizePool(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-purple/40 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1.5">Tournament Rules & Mission parameters</label>
              <textarea
                id="game-desc-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Give players a detailed overview of what tasks are required to claim portions of the ETH prize rewards..."
                required
                className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
              />
            </div>

            <button
              id="game-create-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-purple hover:bg-purple-600 font-semibold font-display text-xs text-white shadow-lg shadow-brand-purple/20 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all flex items-center justify-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              <span>{loading ? "Deploying reward escrow contract..." : "Deploy GameFi Arena"}</span>
            </button>
          </form>
        </div>

        {/* Player Developer Battle Pass progress bar card */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-brand-purple/5 blur-3xl pointer-events-none"></div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Agunnaya Season Battle Pass</span>
              <h3 className="text-sm font-semibold text-white mt-1">Level 4 Builder Apprentice</h3>
            </div>
            <span className="text-xs font-mono font-bold text-brand-purple">2,400 / 3,000 XP</span>
          </div>
          <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden mb-3">
            <div className="bg-gradient-to-r from-brand-purple to-brand-blue h-full rounded-full" style={{ width: "80%" }}></div>
          </div>
          <p className="text-[10px] text-zinc-500">
            Earn experience points (XP) by minting NFTs, submitting governance proposals, or completing linear curve trades! Claim AGL staking rewards upon level up.
          </p>
        </div>
      </div>

      {/* Deployed GameFi arenas list */}
      <div className="space-y-6">
        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-brand-purple" /> Deployed Arenas
        </h3>

        {games.length === 0 ? (
          <div className="text-center py-24 bg-zinc-950/20 border border-dashed border-white/5 rounded-2xl">
            <Trophy className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">No tournaments deployed.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {games.map((g) => (
              <div key={g.contractAddress} className="glass-panel rounded-2xl border border-white/5 p-4 bg-zinc-900/10 space-y-4">
                <div>
                  <h4 className="font-display font-bold text-white text-xs">{g.name}</h4>
                  <span className="block text-[8px] font-mono text-zinc-500 truncate">Reward Pool Contract: {g.contractAddress}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-black/40 p-2.5 rounded-lg border border-white/5">
                  <div>
                    <span className="text-zinc-500">Escrow Pool: </span>
                    <span className="text-emerald-400 font-bold">{g.prizePoolEth.toFixed(2)} ETH</span>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-500">Active Competitors: </span>
                    <span className="text-white font-bold">{g.leaderboard.length + 9}</span>
                  </div>
                </div>

                {/* Achievements missions list */}
                <div className="space-y-2 border-t border-white/5 pt-3">
                  <span className="block text-[8px] uppercase font-bold text-zinc-500">Arena Accomplishment Tasks</span>
                  {g.missions.map((mission) => (
                    <div key={mission.id} className="flex justify-between items-center p-2 bg-black/30 rounded-lg border border-white/5 text-xs">
                      <div>
                        <span className={`block font-bold text-zinc-200 ${mission.completed ? "line-through text-zinc-500" : ""}`}>{mission.title}</span>
                        <span className="text-[9px] text-brand-purple font-mono font-bold">+{mission.xpReward} XP</span>
                      </div>
                      
                      {mission.completed ? (
                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" /> Claimed
                        </span>
                      ) : (
                        <button
                          id={`claim-mission-${mission.id}`}
                          onClick={() => handleClaimAchievement(g.contractAddress, mission.id)}
                          disabled={claimingId === mission.id}
                          className="py-1 px-3 bg-brand-purple/20 hover:bg-brand-purple text-brand-purple hover:text-white border border-brand-purple/30 text-[9px] font-bold font-mono rounded transition-all"
                        >
                          {claimingId === mission.id ? "Verifying..." : "Claim"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
