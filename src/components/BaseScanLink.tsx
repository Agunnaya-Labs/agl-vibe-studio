/**
 * BaseScanLink — renders a compact link to basescan.org for any
 * contract address or transaction hash.  Used after deployment
 * simulations so users can verify the generated address on-chain.
 */
import { ExternalLink } from "lucide-react";

interface BaseScanLinkProps {
  /** Address (0x…) or tx hash (0x…) */
  value: string;
  /** "address" renders /address/…; "tx" renders /tx/… */
  type?: "address" | "tx";
  label?: string;
  className?: string;
  /** Show as a pill badge instead of plain link */
  badge?: boolean;
}

export default function BaseScanLink({
  value,
  type = "address",
  label,
  className = "",
  badge = false,
}: BaseScanLinkProps) {
  const href = `https://basescan.org/${type}/${value}`;
  const displayLabel = label ?? (type === "tx" ? "View TX on BaseScan" : "View on BaseScan ↗");

  if (badge) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-brand-blue/25 bg-brand-blue/10 text-brand-blue text-[10px] font-mono hover:bg-brand-blue/20 transition-all ${className}`}
        title={`Open ${value} on BaseScan`}
      >
        <ExternalLink className="w-3 h-3 shrink-0" />
        {displayLabel}
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-zinc-400 hover:text-brand-blue text-[10px] font-mono transition-colors ${className}`}
      title={`Open ${value} on BaseScan`}
    >
      <ExternalLink className="w-3 h-3 shrink-0" />
      {displayLabel}
    </a>
  );
}
