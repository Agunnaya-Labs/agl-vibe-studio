import { useState, useRef, useEffect } from "react";
import { Wallet, Coins, RefreshCw, Layers, Database, Search, X, Bot, Palette, Cloud, CloudOff } from "lucide-react";
import { WalletState, Token, NFTCollection, AIAgent } from "../types";

interface HeaderProps {
  wallet: WalletState;
  onOpenConnect: () => void;
  onDisconnect: () => void;
  onFundWallet: () => void;
  network: "mainnet" | "sepolia";
  setNetwork: (network: "mainnet" | "sepolia") => void;
  tokens: Token[];
  nfts: NFTCollection[];
  agents: AIAgent[];
  onSelectToken: (token: Token) => void;
  onSelectTab: (tab: string) => void;
  firebaseUser?: any;
  onSignInWithGoogle?: () => void;
  onSignOut?: () => void;
}

export default function Header({ 
  wallet, 
  onOpenConnect, 
  onDisconnect, 
  onFundWallet, 
  network, 
  setNetwork,
  tokens = [],
  nfts = [],
  agents = [],
  onSelectToken,
  onSelectTab,
  firebaseUser = null,
  onSignInWithGoogle,
  onSignOut
}: HeaderProps) {
  const shortAddress = wallet.isConnected && wallet.address
    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    : "";

  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation/dismiss
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchRef.current?.querySelector("input")?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const query = searchQuery.trim().toLowerCase();

  const filteredTokens = query
    ? (tokens || []).filter(t => 
        t.name.toLowerCase().includes(query) || 
        t.symbol.toLowerCase().includes(query) ||
        t.address.toLowerCase().includes(query)
      )
    : [];

  const filteredNFTs = query
    ? (nfts || []).filter(n => 
        n.name.toLowerCase().includes(query) || 
        n.symbol.toLowerCase().includes(query) ||
        n.contractAddress.toLowerCase().includes(query)
      )
    : [];

  const filteredAgents = query
    ? (agents || []).filter(a => 
        a.name.toLowerCase().includes(query) || 
        a.symbol.toLowerCase().includes(query) ||
        a.contractAddress.toLowerCase().includes(query)
      )
    : [];

  const hasResults = filteredTokens.length > 0 || filteredNFTs.length > 0 || filteredAgents.length > 0;

  return (
    <header id="app-header" className="sticky top-0 z-40 w-full h-16 border-b border-white/10 bg-[#050505]/50 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
      {/* Search / Network info on desktop */}
      <div className="flex items-center gap-4">
        {/* Immersive UI Brand Title */}
        <div className="hidden lg:flex items-center gap-3">
          <h1 className="text-xs font-semibold tracking-wider text-white/80 uppercase">
            AGUNNAYA LABS STUDIO <span className="text-[#0052FF] font-bold">v2.4</span>
          </h1>
          <div className="h-4 w-px bg-white/10"></div>
        </div>

        {/* Network Switcher */}
        <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-white/10 text-xs font-mono">
          <button
            id="switch-network-mainnet"
            onClick={() => setNetwork("mainnet")}
            className={`px-3 py-1 rounded-md transition-all ${
              network === "mainnet"
                ? "bg-[#0052FF] text-white shadow-[0_0_15px_rgba(0,82,255,0.4)] font-bold text-[11px]"
                : "text-zinc-500 hover:text-zinc-200 text-[11px]"
            }`}
          >
            Base Mainnet
          </button>
          <button
            id="switch-network-sepolia"
            onClick={() => setNetwork("sepolia")}
            className={`px-3 py-1 rounded-md transition-all ${
              network === "sepolia"
                ? "bg-brand-purple text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] font-bold text-[11px]"
                : "text-zinc-500 hover:text-zinc-200 text-[11px]"
            }`}
          >
            Sepolia Sandbox
          </button>
        </div>

        {/* Live Gas Monitor */}
        <button
          id="header-gas-monitor"
          onClick={() => onSelectTab("gas-dashboard")}
          className="hidden md:flex items-center gap-2 text-zinc-500 hover:text-brand-purple hover:bg-white/5 px-2 py-1 rounded-md transition-all text-xs font-mono group"
        >
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981] group-hover:bg-brand-purple group-hover:shadow-[0_0_8px_rgba(139,92,246,0.6)]"></span>
          <span className="text-[10px] font-bold">GAS: 0.01 gwei</span>
        </button>
      </div>

      {/* Global Search Component */}
      <div ref={searchRef} className="relative hidden md:block w-48 sm:w-64 md:w-72 lg:w-80 focus-within:w-80 lg:focus-within:w-[400px] transition-all duration-300">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search tokens, NFTs, agents..."
            className="w-full h-9 pl-9 pr-8 bg-zinc-950/80 border border-white/10 rounded-lg text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/20 transition-all"
          />
          {searchQuery ? (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-3 hidden lg:inline-flex items-center gap-0.5 h-5 select-none rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[9px] font-medium text-zinc-500">
              <span>/</span>
            </kbd>
          )}
        </div>

        {/* Search Dropdown Panel */}
        {isOpen && searchQuery && (
          <div className="absolute top-11 left-0 right-0 max-h-[420px] overflow-y-auto bg-zinc-950 border border-white/10 rounded-xl shadow-2xl backdrop-blur-md z-50 divide-y divide-white/5">
            {!hasResults ? (
              <div className="p-4 text-center text-zinc-500 text-xs font-mono">
                No matching assets found
              </div>
            ) : (
              <>
                {/* TOKENS SECTION */}
                {filteredTokens.length > 0 && (
                  <div className="p-2 space-y-1">
                    <div className="px-3 py-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono flex items-center justify-between">
                      <span>Tokens</span>
                      <span className="text-[8px] bg-[#0052FF]/10 text-[#0052FF] border border-[#0052FF]/20 px-1 py-0.2 rounded">BONDING CURVE</span>
                    </div>
                    {filteredTokens.map(token => (
                      <button
                        key={token.address}
                        onClick={() => {
                          onSelectToken(token);
                          setSearchQuery("");
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-all text-left group"
                      >
                        <div className="flex items-center gap-2">
                          {token.logoUrl ? (
                            <img src={token.logoUrl} alt={token.name} className="w-6 h-6 rounded-md object-cover border border-white/10" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-6 h-6 rounded-md bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-[10px] text-zinc-400">
                              {token.symbol.slice(0, 2)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-zinc-100 group-hover:text-white truncate">{token.name}</p>
                            <p className="text-[10px] text-zinc-500 font-mono truncate">{token.symbol} • {token.address.slice(0, 6)}...{token.address.slice(-4)}</p>
                          </div>
                        </div>
                        <div className="text-right font-mono text-[10px]">
                          <p className="text-zinc-300 font-semibold">{token.currentPrice ? `${token.currentPrice.toFixed(6)} ETH` : "0.00 ETH"}</p>
                          <p className="text-zinc-500">MC: ${Math.floor(token.marketCap || 0).toLocaleString()}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* NFTS SECTION */}
                {filteredNFTs.length > 0 && (
                  <div className="p-2 space-y-1">
                    <div className="px-3 py-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono flex items-center justify-between">
                      <span>NFT Collections</span>
                      <span className="text-[8px] bg-brand-purple/10 text-brand-purple border border-brand-purple/20 px-1 py-0.2 rounded">COLLECTION</span>
                    </div>
                    {filteredNFTs.map(nft => (
                      <button
                        key={nft.contractAddress}
                        onClick={() => {
                          onSelectTab("nfts");
                          setSearchQuery("");
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-all text-left group"
                      >
                        <div className="flex items-center gap-2">
                          {nft.imageUrl ? (
                            <img src={nft.imageUrl} alt={nft.name} className="w-6 h-6 rounded-md object-cover border border-white/10" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-6 h-6 rounded-md bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-[10px] text-zinc-400">
                              <Palette className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-zinc-100 group-hover:text-white truncate">{nft.name}</p>
                            <p className="text-[10px] text-zinc-500 font-mono truncate">{nft.symbol} • {nft.contractAddress.slice(0, 6)}...{nft.contractAddress.slice(-4)}</p>
                          </div>
                        </div>
                        <div className="text-right font-mono text-[10px]">
                          <p className="text-zinc-300 font-semibold">{nft.mintPrice ? `${nft.mintPrice} ETH` : "Free"}</p>
                          <p className="text-zinc-500">Supply: {nft.currentSupply}/{nft.maxSupply}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* AI AGENTS SECTION */}
                {filteredAgents.length > 0 && (
                  <div className="p-2 space-y-1">
                    <div className="px-3 py-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono flex items-center justify-between">
                      <span>AI Agents</span>
                      <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded">INTELLIGENCE</span>
                    </div>
                    {filteredAgents.map(agent => (
                      <button
                        key={agent.id}
                        onClick={() => {
                          onSelectTab("ai-agents");
                          setSearchQuery("");
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-all text-left group"
                      >
                        <div className="flex items-center gap-2">
                          {agent.avatarUrl ? (
                            <img src={agent.avatarUrl} alt={agent.name} className="w-6 h-6 rounded-md object-cover border border-white/10" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-6 h-6 rounded-md bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400">
                              <Bot className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-zinc-100 group-hover:text-white truncate">{agent.name}</p>
                            <p className="text-[10px] text-zinc-500 font-mono truncate">{agent.symbol} • {agent.id.slice(0, 8)}</p>
                          </div>
                        </div>
                        <div className="text-right font-mono text-[10px]">
                          <p className="text-zinc-300 font-semibold">{agent.usageFeeEth} ETH fee</p>
                          <p className="text-zinc-500">{agent.queryCount} queries</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Web3 User Status / Connect Buttons */}
      <div className="flex items-center gap-3">
        {wallet.isConnected && (
          <>
            {/* Faucet/Fund Button */}
            <button
              id="faucet-button"
              onClick={onFundWallet}
              title="Synchronize balances with Base Mainnet"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-mono font-medium transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
              <span>Sync Wallet</span>
            </button>

            {/* AGL Balance display */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#0052FF]/10 border border-[#0052FF]/30 rounded-lg text-xs font-mono shadow-[0_0_15px_rgba(0,82,255,0.1)]">
              <Coins className="w-4 h-4 text-[#0052FF]" />
              <span className="text-zinc-400">AGL:</span>
              <span className="text-white font-bold">{wallet.aglTokenBalance.toLocaleString()}</span>
            </div>

            {/* AGL Credits display */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-mono shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <Bot className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-zinc-400">Credits:</span>
              <span className="text-white font-bold">{(wallet.aglCredits || 0).toLocaleString()}</span>
            </div>

            {/* ETH Balance display */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-purple/10 border border-brand-purple/30 rounded-lg text-xs font-mono shadow-[0_0_15px_rgba(139,92,246,0.1)]">
              <Database className="w-4 h-4 text-brand-purple" />
              <span className="text-zinc-400">ETH:</span>
              <span className="text-white font-bold">{wallet.balanceEth.toFixed(4)}</span>
            </div>
          </>
        )}

        {/* Google Cloud Sync Widget */}
        {firebaseUser ? (
          <div className="flex items-center gap-1.5 bg-black/50 border border-emerald-500/30 rounded-xl p-1 font-mono text-xs shadow-[0_0_15px_rgba(16,185,129,0.05)]">
            <div className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
              <Cloud className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden lg:inline">Cloud Sync Active</span>
            </div>
            {firebaseUser.photoURL ? (
              <img 
                src={firebaseUser.photoURL} 
                alt={firebaseUser.displayName || "Google User"} 
                className="w-5 h-5 rounded-full border border-white/10"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-[9px] text-zinc-400">
                G
              </div>
            )}
            <button
              onClick={onSignOut}
              className="px-2 py-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-red-400 transition-all text-[10px]"
              title="Sign out of Google Cloud Backup"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={onSignInWithGoogle}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-white/10 rounded-lg text-xs font-mono font-medium transition-all"
            title="Authenticate with Google to persist and share your creations in the cloud"
          >
            <CloudOff className="w-3.5 h-3.5 text-zinc-500" />
            <span>Cloud Backup</span>
          </button>
        )}

        {/* Connection Widget */}
        {wallet.isConnected ? (
          <div className="flex items-center gap-1 bg-black/50 border border-white/10 rounded-xl p-1 font-mono text-xs shadow-[0_0_15px_rgba(255,255,255,0.02)]">
            {/* Wallet Type icon */}
            <div className="px-2.5 py-1 rounded-lg bg-white/5 text-zinc-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#0052FF] rounded-full animate-pulse shadow-[0_0_8px_#0052ff]"></span>
              <span className="capitalize text-[10px]">{wallet.walletType === "smart" ? "AA Smart" : wallet.walletType}</span>
            </div>
            
            <button
              id="wallet-info-dropdown"
              onClick={onDisconnect}
              className="px-3 py-1 rounded-lg hover:bg-white/5 text-zinc-300 hover:text-white transition-all flex items-center gap-1 font-bold"
              title="Click to Disconnect Wallet"
            >
              <span>{shortAddress}</span>
              <span className="text-[10px] text-zinc-500 hover:text-red-400 ml-1">✕</span>
            </button>
          </div>
        ) : (
          <button
            id="connect-wallet-header"
            onClick={onOpenConnect}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-white/90 text-black font-bold text-xs rounded-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all font-display"
          >
            <Wallet className="w-4 h-4" />
            <span>Connect Wallet</span>
          </button>
        )}
      </div>
    </header>
  );
}
