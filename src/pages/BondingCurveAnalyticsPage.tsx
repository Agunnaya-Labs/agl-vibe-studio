import BondingCurveAnalytics from "../components/BondingCurveAnalytics";
import { Token } from "../types";
import { RefreshCw, Download } from "lucide-react";

interface BondingCurveAnalyticsPageProps {
  tokens: Token[];
  onSelectToken?: (token: Token) => void;
  onRefresh?: () => void;
}

export default function BondingCurveAnalyticsPage({
  tokens,
  onSelectToken,
  onRefresh
}: BondingCurveAnalyticsPageProps) {

  const handleExportAnalytics = () => {
    try {
      // Build CSV content with comprehensive bonding curve data
      let csvContent = "Bonding Curve Analytics Report\n";
      csvContent += `Generated: ${new Date().toISOString()}\n\n`;

      csvContent += "=== ECOSYSTEM METRICS ===\n";
      const totalVolume = tokens.reduce((sum, t) => sum + t.volume24h, 0);
      const totalReserves = tokens.reduce((sum, t) => sum + t.reserveEth, 0);
      const totalMarketCap = tokens.reduce((sum, t) => sum + t.marketCap, 0);
      const totalFees = tokens.reduce((sum, t) => sum + t.creatorFeesEarned, 0);

      csvContent += `Total 24h Volume,${totalVolume.toFixed(6)} ETH\n`;
      csvContent += `Total Reserves (TVL),${totalReserves.toFixed(6)} ETH\n`;
      csvContent += `Total Market Cap,${totalMarketCap.toFixed(6)} ETH\n`;
      csvContent += `Total Fees Generated,${totalFees.toFixed(6)} ETH\n`;
      csvContent += `Active Bonding Curves,${tokens.length}\n\n`;

      csvContent += "=== BONDING CURVE TOKENS ===\n";
      csvContent += "Symbol,Name,Category,Supply,Market Cap ETH,24h Volume ETH,Reserves ETH,Current Price ETH,Creator Fees ETH,Created Date\n";
      tokens.forEach(t => {
        const date = new Date(t.createdAt).toISOString();
        csvContent += `${t.symbol},${t.name},${t.category},${t.supply.toLocaleString()},${t.marketCap.toFixed(6)},${t.volume24h.toFixed(6)},${t.reserveEth.toFixed(6)},${t.currentPrice.toFixed(12)},${t.creatorFeesEarned.toFixed(6)},${date}\n`;
      });

      csvContent += "\n=== CATEGORY BREAKDOWN ===\n";
      csvContent += "Category,Token Count,Total Volume,Total Market Cap,Total Reserves\n";
      const categories = Array.from(new Set(tokens.map(t => t.category)));
      categories.forEach(cat => {
        const catTokens = tokens.filter(t => t.category === cat);
        const catVolume = catTokens.reduce((sum, t) => sum + t.volume24h, 0);
        const catMcap = catTokens.reduce((sum, t) => sum + t.marketCap, 0);
        const catReserves = catTokens.reduce((sum, t) => sum + t.reserveEth, 0);
        csvContent += `${cat},${catTokens.length},${catVolume.toFixed(6)},${catMcap.toFixed(6)},${catReserves.toFixed(6)}\n`;
      });

      // Download CSV
      const element = document.createElement("a");
      element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent));
      element.setAttribute("download", `bonding-curve-analytics-${Date.now()}.csv`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error("Failed to export analytics", error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-white">Bonding Curve Performance</h1>
          <p className="text-xs text-zinc-400 mt-1">System-wide metrics, volume trends, and liquidity analytics</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onRefresh}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-semibold font-display text-xs transition-all flex items-center gap-2 text-white"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportAnalytics}
            className="px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 font-semibold font-display text-xs transition-all flex items-center gap-2 text-white"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Main Analytics Component */}
      <BondingCurveAnalytics
        tokens={tokens}
        onSelectToken={onSelectToken}
      />

      {/* Educational Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-brand-blue/5">
          <h4 className="text-xs font-bold text-brand-blue uppercase mb-2">How Bonding Curves Work</h4>
          <p className="text-[10px] text-zinc-300 leading-relaxed">
            Bonding curves automatically adjust token prices based on supply. As demand increases, the price rises proportionally, creating a continuous liquidity mechanism. The 1% fee is distributed to protocol creators and stakeholders.
          </p>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-brand-purple/5">
          <h4 className="text-xs font-bold text-brand-purple uppercase mb-2">Liquidity & Reserves</h4>
          <p className="text-[10px] text-zinc-300 leading-relaxed">
            Every token on our platform holds ETH reserves backing its supply. These reserves ensure fair pricing and enable seamless trading at any time. Higher reserves typically indicate greater market stability and trust in the project.
          </p>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-emerald-500/5">
          <h4 className="text-xs font-bold text-emerald-400 uppercase mb-2">Fee Distribution</h4>
          <p className="text-[10px] text-zinc-300 leading-relaxed">
            Each trade generates a 1% fee. These fees support the creators, reward referrers with 20%, and fund platform development. Monitor fee trends to identify the most actively traded tokens.
          </p>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-cyan-500/5">
          <h4 className="text-xs font-bold text-cyan-400 uppercase mb-2">Price Discovery</h4>
          <p className="text-[10px] text-zinc-300 leading-relaxed">
            Our linear bonding curve model enables fair price discovery for new tokens. Volume and 24h trends help identify emerging projects and market sentiment shifts across different token categories.
          </p>
        </div>
      </div>
    </div>
  );
}
