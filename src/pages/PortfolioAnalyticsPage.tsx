import PortfolioAnalytics from "../components/PortfolioAnalytics";
import { Token, NFTCollection, AIAgent } from "../types";
import { Download } from "lucide-react";

interface PortfolioAnalyticsPageProps {
  userTokens: Token[];
  userNFTs: NFTCollection[];
  userAgents: AIAgent[];
  walletBalance: number;
  aglBalance: number;
  showToast?: (message: string, type: "success" | "error" | "info") => void;
}

export default function PortfolioAnalyticsPage({
  userTokens,
  userNFTs,
  userAgents,
  walletBalance,
  aglBalance,
  showToast
}: PortfolioAnalyticsPageProps) {

  const handleExportPortfolio = () => {
    try {
      // Calculate portfolio data
      const totalTokenValue = userTokens.reduce((sum, t) => sum + t.marketCap, 0);
      const nftValue = userNFTs.reduce((sum, n) => sum + (n.mintPrice * n.currentSupply * 0.8), 0);
      const agentRevenue = userAgents.reduce((sum, a) => sum + a.lifetimeRevenueEth, 0);
      const totalValue = walletBalance + totalTokenValue + nftValue + agentRevenue + aglBalance * 0.000001;

      // Build CSV content
      let csvContent = "Portfolio Export Report\n";
      csvContent += `Exported: ${new Date().toISOString()}\n\n`;
      
      csvContent += "=== PORTFOLIO SUMMARY ===\n";
      csvContent += `Total Portfolio Value,${totalValue.toFixed(6)} ETH\n`;
      csvContent += `ETH Balance,${walletBalance.toFixed(6)} ETH\n`;
      csvContent += `AGL Balance,${aglBalance.toFixed(0)} AGL\n\n`;

      csvContent += "=== TOKEN HOLDINGS ===\n";
      csvContent += "Symbol,Name,Supply,Market Cap ETH,Price ETH\n";
      userTokens.forEach(t => {
        csvContent += `${t.symbol},${t.name},${t.supply.toLocaleString()},${t.marketCap.toFixed(6)},${t.currentPrice.toFixed(12)}\n`;
      });

      csvContent += "\n=== NFT COLLECTIONS ===\n";
      csvContent += "Symbol,Name,Mint Price ETH,Current Supply,Max Supply\n";
      userNFTs.forEach(n => {
        csvContent += `${n.symbol},${n.name},${n.mintPrice.toFixed(6)},${n.currentSupply},${n.maxSupply}\n`;
      });

      csvContent += "\n=== AI AGENTS ===\n";
      csvContent += "Symbol,Name,Lifetime Revenue ETH,Query Count,Usage Fee ETH\n";
      userAgents.forEach(a => {
        csvContent += `${a.symbol},${a.name},${a.lifetimeRevenueEth.toFixed(6)},${a.queryCount},${a.usageFeeEth.toFixed(6)}\n`;
      });

      // Download CSV
      const element = document.createElement("a");
      element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent));
      element.setAttribute("download", `portfolio-export-${Date.now()}.csv`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      showToast?.("Portfolio exported to CSV successfully!", "success");
    } catch (error) {
      showToast?.("Failed to export portfolio", "error");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-white">Portfolio Analytics</h1>
          <p className="text-xs text-zinc-400 mt-1">Comprehensive analysis of your Web3 assets and holdings</p>
        </div>
        <button
          onClick={handleExportPortfolio}
          className="px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 font-semibold font-display text-xs transition-all flex items-center gap-2 text-white"
        >
          <Download className="w-4 h-4" />
          <span>Export Full Report</span>
        </button>
      </div>

      {/* Main Analytics Component */}
      <PortfolioAnalytics
        userTokens={userTokens}
        userNFTs={userNFTs}
        userAgents={userAgents}
        walletBalance={walletBalance}
        aglBalance={aglBalance}
        onExport={handleExportPortfolio}
      />

      {/* Portfolio Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-brand-blue/5">
          <h4 className="text-xs font-bold text-brand-blue uppercase mb-2">Diversification Tip</h4>
          <p className="text-[10px] text-zinc-300 leading-relaxed">
            Maintain a diversified portfolio across multiple asset types to reduce risk and maximize returns.
          </p>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-brand-purple/5">
          <h4 className="text-xs font-bold text-brand-purple uppercase mb-2">Rebalancing Guide</h4>
          <p className="text-[10px] text-zinc-300 leading-relaxed">
            Regularly rebalance your portfolio to maintain target allocations and lock in gains.
          </p>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-emerald-500/5">
          <h4 className="text-xs font-bold text-emerald-400 uppercase mb-2">Tax Planning</h4>
          <p className="text-[10px] text-zinc-300 leading-relaxed">
            Use the export feature to track all transactions for accurate tax reporting.
          </p>
        </div>
      </div>
    </div>
  );
}
