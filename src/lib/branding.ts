/**
 * Agunnaya Labs Studio - Branding & Visual Identity System
 * Centralized brand assets, colors, and design tokens
 */

export const brand = {
  name: "Agunnaya Labs Studio",
  tagline: "Next-Generation AI Web3 Creation Engine",
  description: "Create, launch, and scale audited smart contracts, ERC-20 tokens, DAOs, AI agents, and GameFi projects on Base mainnet.",
  
  // Brand URLs
  website: "https://agunnaya-labs.studio",
  documentation: "https://docs.agunnaya-labs.studio",
  github: "https://github.com/agunnaya-labs",
  twitter: "https://twitter.com/AgunnayaLabs",
  discord: "https://discord.gg/agunnaya-labs",
  
  // Social Handles
  social: {
    twitter: "@AgunnayaLabs",
    discord: "Agunnaya Labs",
    github: "agunnaya-labs"
  }
};

export const colors = {
  // Primary Colors
  primary: {
    blue: "#0052FF",
    purple: "#A855F7",
    dark: "#050505"
  },
  
  // Secondary Colors
  secondary: {
    emerald: "#10B981",
    amber: "#F59E0B",
    sky: "#0EA5E9",
    pink: "#EC4899"
  },
  
  // Neutrals
  neutral: {
    white: "#FFFFFF",
    black: "#000000",
    gray: {
      50: "#F9FAFB",
      100: "#F3F4F6",
      200: "#E5E7EB",
      300: "#D1D5DB",
      400: "#9CA3AF",
      500: "#6B7280",
      600: "#4B5563",
      700: "#374151",
      800: "#1F2937",
      900: "#111827"
    }
  },
  
  // Status Colors
  status: {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6"
  }
};

export const typography = {
  fonts: {
    display: "'Inter', sans-serif",
    sans: "'Inter', sans-serif",
    mono: "'Fira Code', monospace"
  },
  
  sizes: {
    xs: "12px",
    sm: "14px",
    base: "16px",
    lg: "18px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "30px",
    "4xl": "36px",
    "5xl": "48px",
    "6xl": "60px"
  },
  
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800
  },
  
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
    loose: 1.8
  }
};

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "32px",
  "3xl": "48px",
  "4xl": "64px"
};

export const borderRadius = {
  none: "0px",
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px"
};

export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  glow: "0 0 20px rgba(0, 82, 255, 0.3)"
};

export const assets = {
  logos: {
    full: "/images/brand/agunnaya-logo.png",
    icon: "/images/brand/agunnaya-logo.png"
  },
  
  backgrounds: {
    hero: "/images/backgrounds/hero-gradient.png",
    dashboard: "/images/backgrounds/dashboard-dark.png"
  },
  
  placeholders: {
    nft: "/images/placeholders/nft-default.png",
    token: "/images/placeholders/token-default.png",
    dao: "/images/placeholders/dao-default.png",
    game: "/images/placeholders/game-default.png",
    avatar: "/images/avatars/default.png"
  }
};

export const breakpoints = {
  xs: "320px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px"
};

// Helper function to get contrasting text color for a background
export function getContrastingTextColor(bgColor: string): string {
  // Simple luminance calculation
  const hex = bgColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? colors.neutral.black : colors.neutral.white;
}

// Helper function to create CSS variables from branding system
export function generateCSSVariables(): string {
  const vars: Record<string, string> = {
    // Colors
    "--color-primary-blue": colors.primary.blue,
    "--color-primary-purple": colors.primary.purple,
    "--color-primary-dark": colors.primary.dark,
    "--color-secondary-emerald": colors.secondary.emerald,
    "--color-secondary-amber": colors.secondary.amber,
    "--color-status-success": colors.status.success,
    "--color-status-error": colors.status.error,
    
    // Typography
    "--font-display": typography.fonts.display,
    "--font-sans": typography.fonts.sans,
    "--font-mono": typography.fonts.mono,
    
    // Spacing
    "--space-md": spacing.md,
    "--space-lg": spacing.lg,
    "--space-xl": spacing.xl,
    
    // Shadows
    "--shadow-glow": shadows.glow
  };
  
  return Object.entries(vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join("\n");
}
