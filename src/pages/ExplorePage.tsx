import React, { useState } from "react";
import { Token } from "../types";
import ImageWithFallback from "../components/ImageWithFallback";
import { Search, Star, StarOff, Filter, Percent, Copy, Check, X } from "lucide-react";

interface ExplorePageProps {
  tokens: Token[];
  onSelectToken: (token: Token) => void;
}

export default function ExplorePage({ tokens, onSelectToken }: ExplorePageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("trending");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const toggleWatchlist = (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    setWatchlist(prev => 
      prev.includes(address) ? prev.filter(a => a !== address) : [...prev, address]
    );
  };

  const handleCopyAddress = (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const categories = [
    { id: "all", label: "All Categories" },
    { id: "meme", label: "Meme Coins" },
    { id: "defi", label: "DeFi Tokens" },
    { id: "ai", label: "AI Agents" },
    { id: "gamefi", label: "GameFi Assets" },
    { id: "utility", label: "Platform Utilities" }
  ];

  // Filters & Searches in real-time
  const filteredTokens = tokens.filter(t => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = 
      !query ||
      t.name.toLowerCase().includes(query) || 
      t.symbol.toLowerCase().includes(query) ||
      (t.address && t.address.toLowerCase().includes(query));
    
    const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Sorting logic
  const sortedTokens = [...filteredTokens].sort((a, b) => {
    if (sortBy === "trending") {
      return b.volume24h - a.volume24h;
    } else if (sortBy === "marketcap") {
      return b.marketCap - a.marketCap;
    } else if (sortBy === "newest") {
      return b.createdAt - a.createdAt;
    } else if (sortBy === "watchlist") {
      const aWatch = watchlist.includes(a.address) ? 1 : 0;
      const bWatch = watchlist.includes(b.address) ? 1 : 0;
      return bWatch - aWatch;
    }
    return 0;
  });

  return (
    <div id="explore-tokens-root" className="space-y-6 animate-fade-in">
      {/* Search and Filters Hub */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="w-full lg:max-w-md relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
          <input
            id="explore-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tokens by symbol, name, or contract address (0x...)"
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-white/5 focus:border-brand-purple/40 text-xs text-white placeholder:text-zinc-600 focus:outline-none font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-zinc-500 hover:text-white p-0.5 rounded-full hover:bg-white/10 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter count & Sorting Dropdown */}
        <div className="w-full lg:w-auto flex items-center justify-between lg:justify-end gap-3">
          <span className="text-[11px] font-mono text-zinc-500 bg-zinc-900/80 px-2.5 py-1.5 rounded-lg border border-white/5">
            Showing <strong className="text-brand-purple">{sortedTokens.length}</strong> / {tokens.length} tokens
          </span>

          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-mono text-xs flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Sort By:
            </span>
            <select
              id="explore-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-zinc-900 border border-white/5 px-3 py-2 text-xs text-zinc-300 rounded-xl focus:outline-none focus:border-brand-purple/40 w-full sm:w-48 font-mono"
            >
              <option value="trending">🔥 Volume & Activity</option>
              <option value="marketcap">💎 Market Valuation</option>
              <option value="newest">🕒 Recently Created</option>
              <option value="watchlist">⭐ My Watchlist</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Tabs list */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((c) => (
          <button
            id={`category-tab-${c.id}`}
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
              selectedCategory === c.id
                ? "bg-brand-purple text-white shadow-md font-bold"
                : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-white/5"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Tokens List Grid */}
      {sortedTokens.length === 0 ? (
        <div className="text-center py-20 bg-zinc-950/20 border border-dashed border-white/5 rounded-2xl">
          <Search className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-400 font-medium">No projects match your search parameters.</p>
          <p className="text-xs text-zinc-600 mt-1">
            {searchQuery ? `No tokens found matching "${searchQuery}". Try searching by symbol (e.g. AGL, ETH) or contract address.` : 'Try selecting another category filter.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 px-3 py-1.5 rounded-lg bg-brand-purple/20 hover:bg-brand-purple/30 text-brand-purple text-xs font-mono font-bold transition-all"
            >
              Clear Search Query
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTokens.map((t) => {
            // Calculate a mock bonding curve filling percentage (e.g. up to 20M tokens max reserve limit)
            const curvePct = Math.min(100, (t.supply / 20000000) * 100);
            const isWatch = watchlist.includes(t.address);

            return (
              <div
                id={`token-card-${t.address}`}
                key={t.address}
                onClick={() => onSelectToken(t)}
                className="glass-panel p-5 rounded-2xl border border-white/5 bg-zinc-900/10 cursor-pointer relative overflow-hidden group hover:border-brand-purple/30 shadow-lg hover:shadow-brand-purple/5 transition-all duration-300"
              >
                {/* Glowing border effects */}
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-brand-purple/5 blur-2xl pointer-events-none group-hover:bg-brand-purple/15 transition-all"></div>

                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <ImageWithFallback src={t.logoUrl} alt={t.name} fallbackText={t.symbol} className="w-10 h-10 rounded-xl object-cover border border-white/5" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-display font-bold text-white text-sm group-hover:text-brand-purple transition-colors leading-tight">{t.name}</h3>
                        {t.isVerified && (
                          <span className="text-[8px] font-mono font-bold bg-brand-blue/15 text-brand-blue border border-brand-blue/20 px-1 py-0.2 rounded">VERIFIED</span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 font-semibold">{t.symbol} · {t.category.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Watchlist Star */}
                  <button
                    id={`watchlist-star-${t.address}`}
                    onClick={(e) => toggleWatchlist(e, t.address)}
                    className="p-1.5 rounded-lg hover:bg-zinc-800 transition-all text-zinc-500 hover:text-amber-400"
                  >
                    {isWatch ? (
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ) : (
                      <StarOff className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Contract Address Bar */}
                <div className="mb-3 flex items-center justify-between bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 text-[10px] font-mono text-zinc-400">
                  <span className="truncate mr-2">
                    <span className="text-zinc-600">CA:</span> {t.address.slice(0, 8)}...{t.address.slice(-6)}
                  </span>
                  <button
                    onClick={(e) => handleCopyAddress(e, t.address)}
                    className="text-zinc-500 hover:text-white transition-colors shrink-0"
                    title="Copy Contract Address"
                  >
                    {copiedAddress === t.address ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Description snippet */}
                <p className="text-zinc-400 text-[11px] leading-relaxed line-clamp-2 min-h-[32px] mb-4">
                  {t.description}
                </p>

                {/* Bonding Curve Meter */}
                <div className="space-y-1.5 mb-4 border-t border-white/5 pt-3.5">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3 h-3 text-brand-purple" /> Bonding Progress:
                    </span>
                    <span className="text-white font-bold">{curvePct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-brand-purple to-brand-blue h-full rounded-full transition-all duration-500"
                      style={{ width: `${curvePct}%` }}
                    ></div>
                  </div>
                </div>

                {/* Financial metrics bar */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono border-t border-white/5 pt-3">
                  <div>
                    <span className="block text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Price</span>
                    <span className="text-zinc-100 font-bold">{(t.currentPrice * 1000000).toFixed(2)} μETH</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">24h Vol</span>
                    <span className="text-emerald-400 font-bold">+{t.volume24h.toFixed(2)} ETH</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
