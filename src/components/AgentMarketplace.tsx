import React, { useState, useMemo } from 'react';
import { Star, Download, TrendingUp, Users, Zap, Search, Filter, Check, X, ArrowRight } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  creator: string;
  category: string;
  version: string;
  rating: number;
  reviews: number;
  downloads: number;
  monthlyFee: number;
  performance: {
    avgResponseTime: number;
    successRate: number;
    uptime: number;
  };
  features: string[];
  tags: string[];
  icon?: string;
  trending?: boolean;
}

interface AgentMarketplaceProps {
  userAgents: any[];
  showToast: (message: string, type: string) => void;
}

const MARKETPLACE_AGENTS: Agent[] = [
  {
    id: 'agent-alpha',
    name: 'Market Analyzer Pro',
    description: 'Advanced AI for real-time market analysis and trend prediction',
    creator: 'Agunnaya Labs',
    category: 'Trading',
    version: '2.1.0',
    rating: 4.9,
    reviews: 342,
    downloads: 12500,
    monthlyFee: 99,
    performance: {
      avgResponseTime: 240,
      successRate: 98.5,
      uptime: 99.8
    },
    features: ['Real-time Analysis', 'Trend Prediction', 'Risk Assessment', 'Portfolio Optimization'],
    tags: ['trading', 'analysis', 'ai', 'predictive'],
    trending: true
  },
  {
    id: 'agent-beta',
    name: 'Smart Arbitrage Bot',
    description: 'Automated arbitrage detection across multiple DEXs',
    creator: 'DeFi Labs',
    category: 'DeFi',
    version: '1.8.3',
    rating: 4.7,
    reviews: 287,
    downloads: 8900,
    monthlyFee: 149,
    performance: {
      avgResponseTime: 150,
      successRate: 97.2,
      uptime: 99.9
    },
    features: ['Multi-DEX Scanning', 'Flash Loan Support', 'Gas Optimization', 'Profit Tracking'],
    tags: ['defi', 'arbitrage', 'dex', 'automation'],
    trending: true
  },
  {
    id: 'agent-gamma',
    name: 'NFT Valuation Engine',
    description: 'AI-powered NFT rarity scoring and valuation',
    creator: 'NFT Analytics',
    category: 'NFT',
    version: '1.5.2',
    rating: 4.6,
    reviews: 198,
    downloads: 5200,
    monthlyFee: 79,
    performance: {
      avgResponseTime: 320,
      successRate: 96.8,
      uptime: 99.6
    },
    features: ['Rarity Scoring', 'Price Prediction', 'Collection Analytics', 'Whale Tracking'],
    tags: ['nft', 'valuation', 'analytics', 'rarity'],
    trending: false
  },
  {
    id: 'agent-delta',
    name: 'Yield Optimizer',
    description: 'Autonomous yield farming strategy optimizer',
    creator: 'Yield Protocol',
    category: 'Yield',
    version: '2.0.1',
    rating: 4.8,
    reviews: 425,
    downloads: 15600,
    monthlyFee: 129,
    performance: {
      avgResponseTime: 200,
      successRate: 98.9,
      uptime: 99.95
    },
    features: ['Multi-Protocol', 'Auto-Compound', 'Risk Management', 'Performance Tracking'],
    tags: ['yield', 'farming', 'defi', 'optimization'],
    trending: true
  },
  {
    id: 'agent-epsilon',
    name: 'Governance Voter',
    description: 'Intelligent DAO governance voting assistant',
    creator: 'DAO Tools',
    category: 'Governance',
    version: '1.3.0',
    rating: 4.5,
    reviews: 156,
    downloads: 3400,
    monthlyFee: 49,
    performance: {
      avgResponseTime: 180,
      successRate: 99.2,
      uptime: 99.99
    },
    features: ['Proposal Analysis', 'Vote Recommendation', 'Impact Simulation', 'History Tracking'],
    tags: ['governance', 'dao', 'voting', 'analysis'],
    trending: false
  }
];

export default function AgentMarketplace({ userAgents, showToast }: AgentMarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'downloads' | 'price' | 'trending'>('trending');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [subscribedAgents, setSubscribedAgents] = useState<string[]>(
    userAgents.map((a: any) => a.id)
  );

  const categories = Array.from(new Set(MARKETPLACE_AGENTS.map(a => a.category)));

  const filteredAgents = useMemo(() => {
    let result = MARKETPLACE_AGENTS.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           agent.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = !selectedCategory || agent.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort
    if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'downloads') {
      result.sort((a, b) => b.downloads - a.downloads);
    } else if (sortBy === 'price') {
      result.sort((a, b) => a.monthlyFee - b.monthlyFee);
    } else if (sortBy === 'trending') {
      result.sort((a, b) => {
        if (a.trending === b.trending) return b.downloads - a.downloads;
        return a.trending ? -1 : 1;
      });
    }

    return result;
  }, [searchQuery, selectedCategory, sortBy]);

  const handleSubscribe = (agentId: string) => {
    if (subscribedAgents.includes(agentId)) {
      setSubscribedAgents(subscribedAgents.filter(id => id !== agentId));
      showToast('Unsubscribed from agent', 'info');
    } else {
      setSubscribedAgents([...subscribedAgents, agentId]);
      showToast('Successfully subscribed to agent', 'success');
    }
  };

  const totalMonthlyFee = useMemo(() => {
    return MARKETPLACE_AGENTS
      .filter(a => subscribedAgents.includes(a.id))
      .reduce((sum, agent) => sum + agent.monthlyFee, 0);
  }, [subscribedAgents]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Agent Marketplace</h1>
          <p className="text-slate-400">Discover and subscribe to AI agents for enhanced automation and intelligence</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-2">Agents Available</div>
            <div className="text-2xl font-bold text-white">{MARKETPLACE_AGENTS.length}</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-2">Subscribed</div>
            <div className="text-2xl font-bold text-white">{subscribedAgents.length}</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-2">Monthly Cost</div>
            <div className="text-2xl font-bold text-white">${totalMonthlyFee}</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-2">Avg Rating</div>
            <div className="text-2xl font-bold text-white">{(MARKETPLACE_AGENTS.reduce((sum, a) => sum + a.rating, 0) / MARKETPLACE_AGENTS.length).toFixed(1)}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="trending">Trending</option>
              <option value="rating">Top Rated</option>
              <option value="downloads">Most Downloaded</option>
              <option value="price">Lowest Price</option>
            </select>
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredAgents.map(agent => (
            <div
              key={agent.id}
              className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg overflow-hidden hover:border-purple-500/50 transition group cursor-pointer"
              onClick={() => setSelectedAgent(agent)}
            >
              {/* Card Header */}
              <div className="p-6 bg-gradient-to-r from-slate-700/50 to-transparent border-b border-slate-700">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition">{agent.name}</h3>
                    <p className="text-sm text-slate-400">{agent.creator}</p>
                  </div>
                  {agent.trending && (
                    <div className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                      <TrendingUp size={12} /> Trending
                    </div>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-300">{agent.description}</p>

                {/* Rating and Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Star size={14} className="text-yellow-500" fill="currentColor" />
                      <span className="text-sm font-bold text-white">{agent.rating}</span>
                    </div>
                    <div className="text-xs text-slate-400">{agent.reviews} reviews</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Download size={14} className="text-blue-400" />
                      <span className="text-sm font-bold text-white">{(agent.downloads / 1000).toFixed(1)}k</span>
                    </div>
                    <div className="text-xs text-slate-400">downloads</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Zap size={14} className="text-green-400" />
                      <span className="text-sm font-bold text-white">${agent.monthlyFee}</span>
                    </div>
                    <div className="text-xs text-slate-400">/month</div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="space-y-2 pt-4 border-t border-slate-700">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Response Time</span>
                    <span className="text-white font-semibold">{agent.performance.avgResponseTime}ms</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Success Rate</span>
                    <span className="text-green-400 font-semibold">{agent.performance.successRate}%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Uptime</span>
                    <span className="text-green-400 font-semibold">{agent.performance.uptime}%</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 pt-4">
                  {agent.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-6 border-t border-slate-700 bg-slate-900/50 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubscribe(agent.id);
                  }}
                  className={`flex-1 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                    subscribedAgents.includes(agent.id)
                      ? 'bg-red-600/20 text-red-400 border border-red-500/50 hover:bg-red-600/30'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {subscribedAgents.includes(agent.id) ? (
                    <>
                      <Check size={16} /> Subscribed
                    </>
                  ) : (
                    <>
                      <ArrowRight size={16} /> Subscribe
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Agent Detail Modal */}
        {selectedAgent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedAgent.name}</h2>
                  <p className="text-slate-400">by {selectedAgent.creator}</p>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-slate-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <p className="text-slate-300 mb-6">{selectedAgent.description}</p>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-3">Features</h4>
                  <ul className="space-y-2">
                    {selectedAgent.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-slate-300">
                        <Check size={16} className="text-green-400" /> {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-3">Performance</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Response Time</div>
                      <div className="text-lg font-bold text-white">{selectedAgent.performance.avgResponseTime}ms</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Success Rate</div>
                      <div className="text-lg font-bold text-green-400">{selectedAgent.performance.successRate}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Uptime</div>
                      <div className="text-lg font-bold text-green-400">{selectedAgent.performance.uptime}%</div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  handleSubscribe(selectedAgent.id);
                  setSelectedAgent(null);
                }}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  subscribedAgents.includes(selectedAgent.id)
                    ? 'bg-red-600/20 text-red-400 border border-red-500/50 hover:bg-red-600/30'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {subscribedAgents.includes(selectedAgent.id) ? 'Unsubscribe' : `Subscribe - $${selectedAgent.monthlyFee}/month`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
