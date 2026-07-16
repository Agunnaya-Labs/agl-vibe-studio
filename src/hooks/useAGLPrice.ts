/**
 * useAGLPrice — live AGL token price hook.
 * Reads the AGL token from the local bonding-curve database
 * and refreshes every 30 seconds.  Falls back gracefully if the
 * token is not found (returns null values).
 */
import { useState, useEffect } from "react";
import { AgunnayaDatabase } from "../lib/db";

export interface AGLPriceData {
  currentPrice: number;       // ETH per AGL
  priceUsd: number | null;    // USD price if ETH/USD is available
  supply: number;
  volume24h: number;
  formattedPrice: string;     // e.g. "0.00000958 ETH"
  ethPerAgl: number;
  aglPerEth: number;
}

const AGL_TOKEN_ADDRESS = "0xea1221b4d80a89bd8c75248fae7c176bd1854698";
// Approximate ETH/USD rate (hardcoded fallback; swap for a live oracle if desired)
const ETH_USD_APPROX = 3400;

function computePriceData(): AGLPriceData | null {
  try {
    const tokens = AgunnayaDatabase.getTokens();
    const agl = tokens.find(
      (t) => t.address.toLowerCase() === AGL_TOKEN_ADDRESS.toLowerCase() || t.symbol === "AGL"
    );
    if (!agl) return null;

    const p = agl.currentPrice; // ETH per AGL
    const aglPerEth = p > 0 ? 1 / p : 0;

    return {
      currentPrice: p,
      priceUsd: p * ETH_USD_APPROX,
      supply: agl.supply,
      volume24h: agl.volume24h,
      formattedPrice:
        p < 0.00001
          ? `${(p * 1e8).toFixed(2)} gwei`
          : `${p.toFixed(8)} ETH`,
      ethPerAgl: p,
      aglPerEth,
    };
  } catch {
    return null;
  }
}

export function useAGLPrice(intervalMs = 30_000): AGLPriceData | null {
  const [data, setData] = useState<AGLPriceData | null>(computePriceData);

  useEffect(() => {
    const refresh = () => setData(computePriceData());
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return data;
}
