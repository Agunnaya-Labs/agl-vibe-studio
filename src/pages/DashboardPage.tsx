import { WalletState, Token, NFTCollection, DAO, GameFiProject, AIAgent, Activity } from "../types";
import { AgunnayaDatabase } from "../lib/db";
import ImageWithFallback from "../components/ImageWithFallback";
import { 
  Briefcase, 
  Layers, 
  Coins, 
  Disc, 
  Users, 
  Bot, 
  ShieldCheck, 
  Compass, 
  Award,
  FlameKindling
} from "lucide-react";

interface DashboardPageProps {
  wallet: WalletState;
  userTokens: Token[];
  userNFTs: NFTCollection[];
  userDAOs: DAO[];
  userGameFi: GameFiProject[];
  userAgents: AIAgent[];
  activities: Activity[];
  onOpenConnect: () => void;
  onSelectTab: (tab: string) => void;
}

export default function DashboardPage({ 
  wallet, 
  userTokens, 
  userNFTs, 
  userDAOs, 
  userGameFi, 
  userAgents,
  activities,
  onOpenConnect,
  onSelectTab
}: DashboardPageProps) {
  
  if (!wallet.isConnected) {
    return (
      <div id="dashboard-disconnected" className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto space-y-6">
        <div className="w-16 h-16 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue">
          <Briefcase className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight text-white">Your Web3 Workspace</h2>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            Connect your wallet to unlock your personalized developer workspace. Monitor holdings, sponsor deployment gas, launch DAOs, manage AI agents, and claim staking awards.
          </p>
        </div>
        <button
          id="dashboard-connect-btn"
          onClick={onOpenConnect}
          className="px-6 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 font-semibold font-display text-xs transition-all flex items-center gap-2"
        >
          <Briefcase className="w-4 h-4" />
          <span>Connect Web3 Wallet</span>
        </button>
      </div>
    );
  }

  const tokenBalances = wallet.address ? AgunnayaDatabase.getTokenBalances(wallet.address) : {};

  // Calculate some mock totals
  const myCreatedProjectsCount = 
    userTokens.filter(t => t.creator === wallet.address).length +
    userNFTs.filter(n => n.creator === wallet.address).length +
    userDAOs.filter(d => d.creator === wallet.address).length +
    userGameFi.filter(g => g.creator === wallet.address).length +
    userAgents.filter(a => a.creator === wallet.address).length;

  const totalCreatorFeesEarned = userTokens
    .filter(t => t.creator === wallet.address)
    .reduce((sum, t) => sum + t.creatorFeesEarned, 0);

  // Gas sponsorship progress %
  const gasSponsorshipPct = (wallet.sponsoredGasEth / 0.05) * 100;

  return (
    <div id="dashboard-connected-root" className="space-y-6 animate-fade-in">
      {/* Upper Cards Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Details Profile */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/40 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-brand-blue/5 blur-2xl pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Secured Web3 Identity</span>
              <span className="text-[10px] bg-brand-blue/20 text-brand-blue font-bold font-mono px-2 py-0.5 rounded uppercase">
                {wallet.walletType === "smart" ? "AA Smart" : "Extern EOA"}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-white font-mono">{wallet.address}</h3>
            <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Simulated Base Network Secure Link</span>
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-xs">
            <span className="text-zinc-500">Identity Provider:</span>
            <span className="font-semibold text-zinc-300 font-mono capitalize">{wallet.walletType}</span>
          </div>
        </div>

        {/* Account Abstraction Gas Sponsorship Meter */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/40 relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Sponsored Dev Gas (AA)</span>
              <span className="text-xs font-mono font-bold text-white">{wallet.sponsoredGasEth.toFixed(4)} / 0.0500 ETH</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden mt-3 mb-2">
              <div 
                className="bg-gradient-to-r from-brand-purple to-brand-blue h-full rounded-full"
                style={{ width: `${gasSponsorshipPct}%` }}
              ></div>
            </div>

            <p className="text-[10px] text-zinc-500 leading-normal mt-2">
              Our Account Abstraction gas sponsor automatically covers gas for token launches, DAO voting and staking operations!
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs">
            <span className="text-zinc-500">Status:</span>
            <button
              id="dashboard-manage-gas-btn"
              onClick={() => onSelectTab("gas-dashboard")}
              className="font-bold text-emerald-400 flex items-center gap-1 font-mono hover:text-brand-purple transition-colors bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 hover:border-brand-purple/30 hover:bg-brand-purple/10"
            >
              <FlameKindling className="w-3.5 h-3.5 animate-pulse" /> Manage & Faucet
            </button>
          </div>
        </div>

        {/* Platform Rewards Metrics */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/40 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-brand-purple/5 blur-2xl pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Developer Metrics</span>
              <span className="text-zinc-500 font-mono text-[10px]">Lifetime</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">Your Deployed Projects:</span>
                <span className="font-mono text-sm font-bold text-brand-purple">{myCreatedProjectsCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">Total Curve Fees Earned:</span>
                <span className="font-mono text-sm font-bold text-emerald-400">{totalCreatorFeesEarned.toFixed(4)} ETH</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs">
            <span className="text-zinc-500">Fee discount tier:</span>
            <span className="font-bold text-white font-mono bg-brand-purple/20 text-brand-purple px-2 py-0.5 rounded">10% Off via AGL</span>
          </div>
        </div>
      </div>

      {/* Main split sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Holdings and Deployed Registry */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Custom Deployed Contracts */}
          <div className="glass-panel rounded-2xl border border-white/5 p-6 bg-zinc-900/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white">My Deployed Contracts</h3>
              <button 
                id="dash-launch-prompt"
                onClick={() => onSelectTab("ai-builder")}
                className="text-[10px] text-brand-purple hover:text-white bg-brand-purple/10 border border-brand-purple/20 px-3 py-1 rounded-lg font-mono font-bold transition-all"
              >
                + Deploy New
              </button>
            </div>

            {myCreatedProjectsCount === 0 ? (
              <div className="text-center py-10 border border-dashed border-white/5 rounded-xl">
                <Compass className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">You haven't deployed any custom contracts yet.</p>
                <p className="text-[10px] text-zinc-600 mt-1">Use the AI Architect or Launchpad to deploy on Base.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {userTokens.filter(t => t.creator === wallet.address).map((t) => (
                  <div key={t.address} className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <ImageWithFallback src={t.logoUrl} alt={t.name} fallbackText={t.symbol} className="w-8 h-8 rounded-lg object-cover" />
                      <div>
                        <span className="block text-xs font-semibold text-white">{t.name} ({t.symbol})</span>
                        <span className="block text-[9px] font-mono text-zinc-500">Token Contract · {t.address.slice(0, 8)}...</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs font-mono text-emerald-400">{(t.supply / 1000000).toFixed(2)}M Minted</span>
                      <span className="block text-[9px] text-zinc-500 font-mono">Market Cap: {t.marketCap.toFixed(2)} ETH</span>
                    </div>
                  </div>
                ))}
                {userDAOs.filter(d => d.creator === wallet.address).map((d) => (
                  <div key={d.contractAddress} className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-white">{d.name} DAO ({d.symbol})</span>
                        <span className="block text-[9px] font-mono text-zinc-500">Governance · {d.contractAddress.slice(0, 8)}...</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs font-mono text-white">{d.memberCount} Members</span>
                      <span className="block text-[9px] text-zinc-500 font-mono">Treasury: {d.treasuryBalanceEth} ETH</span>
                    </div>
                  </div>
                ))}
                {userAgents.filter(a => a.creator === wallet.address).map((a) => (
                  <div key={a.id} className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <ImageWithFallback src={a.avatarUrl} alt={a.name} fallbackText={a.symbol} className="w-8 h-8 rounded-lg object-cover" />
                      <div>
                        <span className="block text-xs font-semibold text-white">{a.name} ({a.symbol})</span>
                        <span className="block text-[9px] font-mono text-zinc-500">Autonomous Agent · SENT_CORE</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs font-mono text-brand-purple">{a.queryCount} Queries Executed</span>
                      <span className="block text-[9px] text-zinc-500 font-mono">Revenue: {a.lifetimeRevenueEth.toFixed(3)} ETH</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wallet holdings grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tokens Portfolios holdings */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-zinc-900/20">
              <h3 className="text-xs font-bold font-display uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-brand-purple" /> Token Assets
              </h3>
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                <div className="flex justify-between items-center p-2.5 bg-black/30 rounded-xl border border-white/5 text-xs">
                  <span className="font-bold text-white font-mono font-display">AGL Token</span>
                  <span className="font-mono text-zinc-300">{wallet.aglTokenBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} AGL</span>
                </div>
                {userTokens.filter(t => t.symbol !== "AGL").map(t => {
                  const bal = tokenBalances[t.address.toLowerCase()] || 0;
                  const isPreset = t.symbol === "CHAD" || t.symbol === "BAIC";
                  if (!isPreset && bal <= 0) return null;
                  return (
                    <div key={t.address} className="flex justify-between items-center p-2.5 bg-black/30 rounded-xl border border-white/5 text-xs">
                      <div className="flex items-center gap-1.5">
                        {t.logoUrl && <ImageWithFallback src={t.logoUrl} alt={t.symbol} fallbackText={t.symbol} className="w-4 h-4 rounded-full object-cover" />}
                        <span className="font-bold text-white font-mono">{t.symbol}</span>
                      </div>
                      <span className="font-mono text-zinc-300">{bal.toLocaleString(undefined, { maximumFractionDigits: 2 })} {t.symbol}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* NFTs Portfolios holdings */}
            <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-zinc-900/20">
              <h3 className="text-xs font-bold font-display uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                <Disc className="w-4 h-4 text-brand-blue" /> Minted NFTs
              </h3>
              {userNFTs.reduce((sum, n) => sum + n.items.length, 0) === 0 ? (
                <div className="text-center py-6 border border-dashed border-white/5 rounded-xl">
                  <p className="text-[10px] text-zinc-500">No NFTs in your vault.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {userNFTs.map(n => n.items.map(item => (
                    <div key={item.id} className="flex items-center gap-2.5 p-2 bg-black/30 rounded-xl border border-white/5 text-xs">
                      <ImageWithFallback src={item.imageUrl} alt={item.name} fallbackText={n.name} className="w-7 h-7 rounded object-cover" />
                      <div>
                        <span className="block font-bold text-white">{item.name}</span>
                        <span className="block text-[8px] text-zinc-500 font-mono">{n.name} · #{item.id}</span>
                      </div>
                    </div>
                  )))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Platform activity logs */}
        <div className="glass-panel rounded-2xl border border-white/5 p-6 bg-zinc-900/20 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-brand-purple" /> Global Activity Log
            </h3>
            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
              {activities.slice(0, 6).map((act) => (
                <div key={act.id} className="text-xs border-b border-white/5 pb-3">
                  <div className="flex items-center justify-between mb-1 font-mono text-[9px] text-zinc-500">
                    <span className="uppercase text-brand-purple">{act.type}</span>
                    <span>{new Date(act.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-zinc-200 leading-normal">{act.details}</p>
                  <span className="block text-[9px] font-mono text-zinc-600 truncate mt-1">User: {act.user}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-white/5 mt-4 text-center">
            <button 
              id="dash-view-analytics"
              onClick={() => onSelectTab("analytics")}
              className="text-[10px] font-mono text-brand-blue hover:text-white font-bold transition-all"
            >
              Analyze Base Statistics →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
