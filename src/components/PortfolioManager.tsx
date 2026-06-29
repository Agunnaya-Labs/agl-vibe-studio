import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw, Download, Plus, X, Target, Activity } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  symbol: string;
  amount: number;
  currentPrice: number;
  costBasis: number;
  purchaseDate: string;
  category: 'token' | 'nft' | 'stake';
}

interface PortfolioManagerProps {
  userTokens: any[];
  userNFTs: any[];
  userAgents: any[];
  walletBalance: number;
  showToast: (message: string, type: string) => void;
}

export default function PortfolioManager({ userTokens, userNFTs, userAgents, walletBalance, showToast }: PortfolioManagerProps) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [rebalancingMode, setRebalancingMode] = useState(false);
  const [targetAllocation, setTargetAllocation] = useState<Record<string, number>>({});
  const [sortBy, setSortBy] = useState<'value' | 'gain' | 'name'>('value');

  // Calculate portfolio metrics
  const assets = useMemo(() => {
    const allAssets: Asset[] = [];
    
    userTokens.forEach((token: any) => {
      allAssets.push({
        id: token.address,
        name: token.name,
        symbol: token.symbol,
        amount: token.balance,
        currentPrice: token.priceUsd || 0,
        costBasis: token.purchaseCost || token.priceUsd * 0.9,
        purchaseDate: token.purchaseDate || new Date().toISOString(),
        category: 'token'
      });
    });

    userNFTs.forEach((nft: any) => {
      allAssets.push({
        id: nft.id,
        name: nft.name,
        symbol: 'NFT',
        amount: 1,
        currentPrice: nft.floorPrice || 0,
        costBasis: nft.purchasePrice || 0,
        purchaseDate: nft.purchaseDate || new Date().toISOString(),
        category: 'nft'
      });
    });

    return allAssets;
  }, [userTokens, userNFTs]);

  const portfolioStats = useMemo(() => {
    const totalValue = assets.reduce((sum, asset) => sum + (asset.amount * asset.currentPrice), 0) + walletBalance;
    const totalCost = assets.reduce((sum, asset) => sum + (asset.amount * asset.costBasis), 0);
    const totalGain = totalValue - totalCost;
    const gainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalGain,
      gainPercent,
      assetCount: assets.length,
      diversificationScore: calculateDiversification(assets, totalValue)
    };
  }, [assets, walletBalance]);

  const calculateDiversification = (assetList: Asset[], total: number) => {
    if (total === 0) return 0;
    const weights = assetList.map(a => (a.amount * a.currentPrice) / total);
    const herfindahl = weights.reduce((sum, w) => sum + w * w, 0);
    const maxAssets = Math.min(assetList.length, 10);
    return Math.round(((1 - herfindahl) / (1 - 1 / maxAssets)) * 100);
  };

  const rebalancingSuggestions = useMemo(() => {
    if (assets.length === 0) return [];
    const suggestions = [];
    const totalValue = portfolioStats.totalValue;
    const targetPerAsset = totalValue / Math.min(assets.length, 5);

    assets.forEach((asset, idx) => {
      if (idx < 5) {
        const currentValue = asset.amount * asset.currentPrice;
        const currentPercent = (currentValue / totalValue) * 100;
        const targetPercent = 20;
        const diff = targetPercent - currentPercent;

        if (Math.abs(diff) > 5) {
          suggestions.push({
            asset: asset.symbol,
            currentPercent: currentPercent.toFixed(1),
            targetPercent: targetPercent.toFixed(1),
            action: diff > 0 ? 'BUY' : 'SELL',
            amount: Math.abs((diff / 100) * totalValue)
          });
        }
      }
    });

    return suggestions;
  }, [assets, portfolioStats]);

  const sortedAssets = useMemo(() => {
    return [...assets].sort((a, b) => {
      if (sortBy === 'value') {
        return (b.amount * b.currentPrice) - (a.amount * a.currentPrice);
      } else if (sortBy === 'gain') {
        const gainA = a.amount * (a.currentPrice - a.costBasis);
        const gainB = b.amount * (b.currentPrice - b.costBasis);
        return gainB - gainA;
      } else {
        return a.name.localeCompare(b.name);
      }
    });
  }, [assets, sortBy]);

  const exportPortfolio = () => {
    const csv = [
      ['Asset', 'Amount', 'Current Price', 'Value', 'Cost Basis', 'Gain/Loss', 'Gain %'].join(','),
      ...sortedAssets.map(asset => {
        const value = asset.amount * asset.currentPrice;
        const cost = asset.amount * asset.costBasis;
        const gain = value - cost;
        const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;
        return [asset.name, asset.amount, asset.currentPrice, value.toFixed(2), cost.toFixed(2), gain.toFixed(2), gainPercent.toFixed(2)].join(',');
      })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('Portfolio exported successfully', 'success');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Portfolio Manager</h1>
              <p className="text-slate-400">Track, analyze, and optimize your crypto portfolio</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportPortfolio}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
              >
                <Download size={18} /> Export
              </button>
              <button
                onClick={() => setRebalancingMode(!rebalancingMode)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
              >
                <RefreshCw size={18} /> Rebalance
              </button>
            </div>
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
            <div className="text-slate-400 text-sm mb-2">Total Value</div>
            <div className="text-3xl font-bold text-white mb-2">${portfolioStats.totalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
            <div className={`text-sm ${portfolioStats.totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {portfolioStats.totalGain >= 0 ? '+' : ''} ${portfolioStats.totalGain.toLocaleString('en-US', { maximumFractionDigits: 2 })} ({portfolioStats.gainPercent.toFixed(2)}%)
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
            <div className="text-slate-400 text-sm mb-2">Cash Balance</div>
            <div className="text-3xl font-bold text-white">${walletBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
            <div className="text-slate-500 text-sm mt-2">{((walletBalance / portfolioStats.totalValue) * 100).toFixed(1)}% of portfolio</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
            <div className="text-slate-400 text-sm mb-2">Assets</div>
            <div className="text-3xl font-bold text-white">{portfolioStats.assetCount}</div>
            <div className="text-slate-500 text-sm mt-2">Total holdings</div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
            <div className="text-slate-400 text-sm mb-2">Diversification</div>
            <div className="text-3xl font-bold text-white">{portfolioStats.diversificationScore}%</div>
            <div className="text-slate-500 text-sm mt-2">
              {portfolioStats.diversificationScore > 75 ? 'Well diversified' : portfolioStats.diversificationScore > 50 ? 'Good diversification' : 'Low diversification'}
            </div>
          </div>
        </div>

        {/* Rebalancing Mode */}
        {rebalancingMode && (
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="text-blue-400 mt-1" size={20} />
              <div>
                <h3 className="text-white font-semibold mb-2">Rebalancing Suggestions</h3>
                <p className="text-slate-300 text-sm">Optimize your portfolio to maintain 20% allocation per top 5 assets</p>
              </div>
            </div>

            <div className="space-y-3">
              {rebalancingSuggestions.length > 0 ? (
                rebalancingSuggestions.map((suggestion, idx) => (
                  <div key={idx} className="bg-slate-800/50 p-4 rounded border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">{suggestion.asset}</div>
                      <div className="text-sm text-slate-400">Current: {suggestion.currentPercent}% → Target: {suggestion.targetPercent}%</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`font-bold ${suggestion.action === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                          {suggestion.action}
                        </div>
                        <div className="text-sm text-slate-400">${suggestion.amount.toFixed(2)}</div>
                      </div>
                      <button className={`px-3 py-1 rounded text-sm font-medium ${suggestion.action === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white transition`}>
                        {suggestion.action}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-sm py-4">Your portfolio is well-balanced! No rebalancing needed.</div>
              )}
            </div>
          </div>
        )}

        {/* Assets Table */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Holdings</h2>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-700 text-white rounded px-3 py-2 text-sm"
              >
                <option value="value">Sort by Value</option>
                <option value="gain">Sort by Gain</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400">Asset</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400">Price</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400">Value</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400">Gain/Loss</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400">Allocation</th>
                </tr>
              </thead>
              <tbody>
                {sortedAssets.map((asset) => {
                  const value = asset.amount * asset.currentPrice;
                  const cost = asset.amount * asset.costBasis;
                  const gain = value - cost;
                  const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;
                  const allocation = ((value / portfolioStats.totalValue) * 100);

                  return (
                    <tr
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className="border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer transition"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-white">{asset.name}</div>
                          <div className="text-sm text-slate-400">{asset.symbol}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-white">{asset.amount.toLocaleString('en-US', { maximumFractionDigits: 4 })}</td>
                      <td className="px-6 py-4 text-right text-white">${asset.currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-right font-semibold text-white">${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                      <td className={`px-6 py-4 text-right font-semibold ${gain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {gain >= 0 ? '+' : ''} ${gain.toLocaleString('en-US', { maximumFractionDigits: 2 })} ({gainPercent.toFixed(1)}%)
                      </td>
                      <td className="px-6 py-4 text-right text-slate-400">{allocation.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Asset Detail Modal */}
        {selectedAsset && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{selectedAsset.name}</h3>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-slate-400 text-sm">Amount</div>
                  <div className="text-2xl font-bold text-white">{selectedAsset.amount.toLocaleString('en-US', { maximumFractionDigits: 4 })}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-slate-400 text-sm">Current Price</div>
                    <div className="text-lg font-bold text-white">${selectedAsset.currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-sm">Cost Basis</div>
                    <div className="text-lg font-bold text-white">${selectedAsset.costBasis.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-sm">Total Value</div>
                  <div className="text-2xl font-bold text-white">${(selectedAsset.amount * selectedAsset.currentPrice).toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
                </div>

                <div>
                  <div className="text-slate-400 text-sm">Gain/Loss</div>
                  <div className={`text-lg font-bold ${(selectedAsset.amount * (selectedAsset.currentPrice - selectedAsset.costBasis)) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${(selectedAsset.amount * (selectedAsset.currentPrice - selectedAsset.costBasis)).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAsset(null)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition mt-6"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
