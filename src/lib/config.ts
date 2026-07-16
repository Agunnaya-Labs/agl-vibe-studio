/**
 * Centralized configuration for the Agunnaya Studio application.
 * All magic values, API endpoints, contract addresses, and external service configs
 * should be defined here for easy maintenance and environment switching.
 */

export const CONFIG = {
  // Network Configuration
  NETWORKS: {
    BASE_RPC_MAINNET: "https://mainnet.base.org",
    BASE_RPC_SEPOLIA: "https://sepolia.base.org",
  },

  // Smart Contract Addresses
  CONTRACTS: {
    AGL_TOKEN: "0xea1221b4d80a89bd8c75248fae7c176bd1854698",
    AGL_DECIMALS: 18,
  },

  // Google OAuth Configuration
  GOOGLE: {
    SCOPES: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/drive.metadata",
      "https://www.googleapis.com/auth/drive.metadata.readonly",
      "https://mail.google.com/",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.labels",
    ],
  },

  // Terminal & Logging
  TERMINAL: {
    MAX_LOG_LINES: 1000,
    LOG_RETENTION_MS: 3600000, // 1 hour
  },

  // Toast Notifications
  TOAST: {
    AUTO_DISMISS_MS: 4000,
  },

  // Wallet Configuration
  WALLET: {
    DEFAULT_GAS_SPONSORED_ETH: 0.05, // for smart accounts
    DEFAULT_AGL_CREDITS: 500,
  },

  // Firestore Configuration
  FIRESTORE: {
    ACTIVITIES_LIMIT: 50,
    COLLECTION_NAMES: {
      ACTIVITIES: "activities",
    },
  },
} as const;

/**
 * Get the appropriate RPC endpoint based on network selection
 */
export function getRpcEndpoint(network: "sepolia" | "mainnet"): string {
  return network === "mainnet" ? CONFIG.NETWORKS.BASE_RPC_MAINNET : CONFIG.NETWORKS.BASE_RPC_SEPOLIA;
}

/**
 * Get AGL contract details
 */
export function getAglContractDetails() {
  return {
    address: CONFIG.CONTRACTS.AGL_TOKEN,
    abi: ["function balanceOf(address) external view returns (uint256)"],
    decimals: CONFIG.CONTRACTS.AGL_DECIMALS,
  };
}
