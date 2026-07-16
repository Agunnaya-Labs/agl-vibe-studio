/**
 * Page metadata configuration for dynamic Open Graph previews.
 * Centralized metadata for all tabs and pages to avoid repetitive switch statements.
 */

export interface PageMetadata {
  title: string;
  description: string;
  image: string;
  url: string;
}

export const DEFAULT_METADATA: PageMetadata = {
  title: "Agunnaya Labs Studio - High Performance Web3 Developer Studio",
  description:
    "The ultimate decentralized AI studio for smart contract creation, automated bonding curves, high APY staking, and sovereign agent hosting.",
  image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80",
  url: "https://ais-pre-co5l5sfwvl3kmcbjbxsv7j-290898077867.europe-west3.run.app/",
};

export const PAGE_METADATA_CONFIG: Record<string, PageMetadata> = {
  dashboard: {
    title: "Dashboard | Agunnaya Labs Studio",
    description:
      "Monitor your connected Base smart accounts, token creations, active yield pools, on-chain agents, and recent studio transactions.",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80",
    url: "https://ais-pre-co5l5sfwvl3kmcbjbxsv7j-290898077867.europe-west3.run.app/?tab=dashboard",
  },
  explore: {
    title: "Explore Bonding Curves | Agunnaya Labs Studio",
    description:
      "Discover hot decentralized assets, meme tokens, and innovative utility primitives deployed across Base Mainnet and Sepolia Sandbox.",
    image: "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&w=1200&q=80",
    url: "https://ais-pre-co5l5sfwvl3kmcbjbxsv7j-290898077867.europe-west3.run.app/?tab=explore",
  },
  "ai-builder": {
    title: "AI Architect & Token Launchpad | Agunnaya Labs Studio",
    description:
      "Describe custom smart contract logic in plain English to compile Solidity via Gemini AI or deploy new tokens to bonding curves instantly.",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    url: "https://ais-pre-co5l5sfwvl3kmcbjbxsv7j-290898077867.europe-west3.run.app/?tab=ai-builder",
  },
  nfts: {
    title: "NFT Generative Studio | Agunnaya Labs Studio",
    description:
      "Mint and host decentralized generative artwork collections with custom maximum supply parameters and dynamic base metadata structures.",
    image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1200&q=80",
    url: "https://ais-pre-co5l5sfwvl3kmcbjbxsv7j-290898077867.europe-west3.run.app/?tab=nfts",
  },
  daos: {
    title: "Sovereign DAO Governance Builder | Agunnaya Labs Studio",
    description:
      "Build custom on-chain DAOs, register custom governance symbols, draft decentralization proposals, and cast weighted cryptographic votes.",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80",
    url: "https://ais-pre-co5l5sfwvl3kmcbjbxsv7j-290898077867.europe-west3.run.app/?tab=daos",
  },
  gamefi: {
    title: "GameFi Quest Arena | Agunnaya Labs Studio",
    description:
      "Unlock seasonal developer battle passes, complete on-chain missions, level up dynamic achievements, and claim native AGL token bounties.",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80",
    url: "https://ais-pre-co5l5sfwvl3kmcbjbxsv7j-290898077867.europe-west3.run.app/?tab=gamefi",
  },
  "ai-agents": {
    title: "Autonomous AI Agent Studio | Agunnaya Labs Studio",
    description:
      "Deploy self-contained autonomous agent registry modules with specific prompt guidelines, set custom query fees, and track performance.",
    image: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80",
    url: "https://ais-pre-co5l5sfwvl3kmcbjbxsv7j-290898077867.europe-west3.run.app/?tab=ai-agents",
  },
  defi: {
    title: "AMM Token Swap & Staking | Agunnaya Labs Studio",
    description:
      "Perform instant low-slippage swaps between ETH and native AGL utility tokens or lock up liquidity in compounding high-yield staking vaults.",
    image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=1200&q=80",
    url: "https://ais-pre-co5l5sfwvl3kmcbjbxsv7j-290898077867.europe-west3.run.app/?tab=defi",
  },
  analytics: {
    title: "Real-Time Market Analytics | Agunnaya Labs Studio",
    description:
      "Track live trading volumes, transaction histories, price tickers, and advanced line charts powered by dynamic bonding curve calculations.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    url: "https://ais-pre-co5l5sfwvl3kmcbjbxsv7j-290898077867.europe-west3.run.app/?tab=analytics",
  },
  admin: {
    title: "Factory Tuning Parameters | Agunnaya Labs Studio",
    description:
      "Adjust global system configurations including curve fees, AA sponsorship maximum values, and view global node performance parameters.",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80",
    url: "https://ais-pre-co5l5sfwvl3kmcbjbxsv7j-290898077867.europe-west3.run.app/?tab=admin",
  },
  referrals: {
    title: "Earn 20% Fee Share Rewards | Agunnaya Labs Studio",
    description:
      "Invite colleagues to deploy bonding curves or trade assets, and earn a massive 20% of all generated fees dynamically settled in AGL tokens.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    url: "https://ais-pre-co5l5sfwvl3kmcbjbxsv7j-290898077867.europe-west3.run.app/?tab=referrals",
  },
  "agl-credits": {
    title: "AGL Credits On-Chain Burn Portal | Agunnaya Labs Studio",
    description:
      "Permanently burn AGL tokens to purchase low-latency compute credits recorded securely on Base Mainnet.",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80",
    url: "https://ais-pre-co5l5sfwvl3kmcbjbxsv7j-290898077867.europe-west3.run.app/?tab=agl-credits",
  },
  "gas-dashboard": {
    title: "Paymaster Gas Sponsorship Pad | Agunnaya Labs Studio",
    description:
      "Request free developer gas allowances and monitor Base L2 paymaster statistics.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    url: "https://ais-pre-co5l5sfwvl3kmcbjbxsv7j-290898077867.europe-west3.run.app/?tab=gas-dashboard",
  },
};

/**
 * Get metadata for a specific page tab, with token context
 */
export function getPageMetadata(
  currentTab: string,
  selectedToken?: any
): PageMetadata {
  if (selectedToken) {
    return {
      title: `Trade ${selectedToken.name} (${selectedToken.symbol}) | Agunnaya Labs Studio`,
      description: `Join the dynamic bonding curve for ${selectedToken.name} (${selectedToken.symbol}). Market Cap: $${Math.floor(
        selectedToken.marketCap
      ).toLocaleString()} USD. Deployed securely on Base.`,
      image: "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&w=1200&q=80",
      url: `https://ais-pre-co5l5sfwvl3kmcbjbxsv7j-290898077867.europe-west3.run.app/?token=${selectedToken.address}`,
    };
  }

  return PAGE_METADATA_CONFIG[currentTab] || DEFAULT_METADATA;
}
