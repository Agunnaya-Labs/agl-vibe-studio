/**
 * SEO Metadata Configuration for Agunnaya Labs Studio
 * Centralized SEO management for all pages and features
 */

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: string;
}

export const defaultSEO: SEOMetadata = {
  title: "Agunnaya Labs Studio - AI Web3 Creation Engine on Base",
  description: "Create, launch, and scale audited smart contracts, ERC-20 tokens, DAOs, AI agents, and GameFi projects on Base mainnet. No Solidity required.",
  keywords: [
    "Web3", "blockchain", "Base network", "smart contracts", "ERC-20",
    "DAO", "AI agents", "GameFi", "crypto", "token creation",
    "Solidity", "DeFi", "NFT", "bonding curves", "autonomous agents"
  ],
  image: "/images/brand/agunnaya-logo.png",
  url: "https://agunnaya-labs.studio",
  type: "website"
};

export const pageSEO: Record<string, SEOMetadata> = {
  dashboard: {
    title: "Dashboard - Agunnaya Labs Studio",
    description: "Manage your Web3 projects, tokens, and AI agents from your personal dashboard.",
    keywords: ["dashboard", "portfolio", "token management", "project management"],
    image: "/images/backgrounds/dashboard-dark.png"
  },
  
  explore: {
    title: "Explore - Agunnaya Labs Studio",
    description: "Discover and trade tokens, explore the ecosystem of projects built on Agunnaya.",
    keywords: ["token explorer", "token trading", "DEX", "liquidity", "bonding curves"],
    image: "/images/placeholders/token-default.png"
  },
  
  "ai-builder": {
    title: "AI Smart Contract Architect - Agunnaya Labs Studio",
    description: "Generate audited Solidity smart contracts using AI. Describe what you want to build in plain English.",
    keywords: ["smart contract generation", "Solidity", "AI code generation", "contract templates"],
    image: "/images/backgrounds/hero-gradient.png"
  },
  
  nfts: {
    title: "NFT Studio - Agunnaya Labs Studio",
    description: "Create, mint, and manage NFT collections without coding. Full ERC-721 and ERC-1155 support.",
    keywords: ["NFT", "NFT creation", "ERC-721", "ERC-1155", "digital art", "NFT marketplace"],
    image: "/images/placeholders/nft-default.png"
  },
  
  daos: {
    title: "DAO Builder - Agunnaya Labs Studio",
    description: "Launch decentralized autonomous organizations with governance tokens and proposal systems.",
    keywords: ["DAO", "governance", "voting", "treasury", "community", "decentralized governance"],
    image: "/images/placeholders/dao-default.png"
  },
  
  gamefi: {
    title: "GameFi Suite - Agunnaya Labs Studio",
    description: "Build play-to-earn games with tokenomics, achievements, and reward systems.",
    keywords: ["GameFi", "play-to-earn", "gaming", "rewards", "achievements", "game development"],
    image: "/images/placeholders/game-default.png"
  },
  
  "ai-agents": {
    title: "AI Agent Studio - Agunnaya Labs Studio",
    description: "Launch autonomous AI agents with custom profiles, earning transaction fees from utility.",
    keywords: ["AI agents", "autonomous agents", "AI", "chatbots", "utility tokens", "automation"],
    image: "/images/backgrounds/hero-gradient.png"
  },
  
  defi: {
    title: "DeFi Hub - Agunnaya Labs Studio",
    description: "Access staking vaults, liquidity pools, and yield farming strategies.",
    keywords: ["DeFi", "staking", "yield farming", "liquidity pools", "yield", "passive income"],
    image: "/images/backgrounds/dashboard-dark.png"
  },
  
  analytics: {
    title: "Analytics - Agunnaya Labs Studio",
    description: "Real-time analytics and insights into your projects, tokens, and ecosystem metrics.",
    keywords: ["analytics", "metrics", "charts", "data visualization", "statistics", "reports"],
    image: "/images/backgrounds/dashboard-dark.png"
  },
  
  admin: {
    title: "Admin Panel - Agunnaya Labs Studio",
    description: "Platform administration and management tools for Agunnaya Labs.",
    keywords: ["admin", "administration", "management", "settings", "configuration"],
    image: "/images/backgrounds/dashboard-dark.png"
  },
  
  referrals: {
    title: "Referral Program - Agunnaya Labs Studio",
    description: "Earn rewards by referring users to Agunnaya Labs Studio. Start earning today.",
    keywords: ["referral", "affiliate", "rewards", "commission", "earning", "referral program"],
    image: "/images/backgrounds/hero-gradient.png"
  },
  
  gdrive: {
    title: "Google Drive Integration - Agunnaya Labs Studio",
    description: "Connect your Google Drive to store and manage project files.",
    keywords: ["Google Drive", "file storage", "integration", "cloud storage", "documents"],
    image: "/images/backgrounds/dashboard-dark.png"
  },
  
  gmail: {
    title: "Gmail Assistant - Agunnaya Labs Studio",
    description: "AI-powered email drafting and management integrated with Gmail.",
    keywords: ["Gmail", "email", "AI assistant", "email drafting", "productivity", "communication"],
    image: "/images/backgrounds/dashboard-dark.png"
  }
};

/**
 * Get SEO metadata for a specific page
 */
export function getPageSEO(page: string): SEOMetadata {
  return pageSEO[page] || defaultSEO;
}

/**
 * Generate structured data for JSON-LD
 */
export function getStructuredData(seo: SEOMetadata) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": seo.title,
    "description": seo.description,
    "url": seo.url || defaultSEO.url,
    "image": seo.image,
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Organization",
      "name": "Agunnaya Labs",
      "url": "https://agunnaya-labs.studio"
    }
  };
}

/**
 * Generate Open Graph meta tags
 */
export function getOpenGraphTags(seo: SEOMetadata) {
  return {
    "og:title": seo.title,
    "og:description": seo.description,
    "og:image": seo.image,
    "og:url": seo.url,
    "og:type": seo.type || "website",
    "og:site_name": "Agunnaya Labs Studio"
  };
}

/**
 * Generate Twitter Card meta tags
 */
export function getTwitterCardTags(seo: SEOMetadata) {
  return {
    "twitter:card": "summary_large_image",
    "twitter:title": seo.title,
    "twitter:description": seo.description,
    "twitter:image": seo.image,
    "twitter:url": seo.url,
    "twitter:creator": "@AgunnayaLabs"
  };
}
