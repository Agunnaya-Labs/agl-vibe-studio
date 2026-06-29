/**
 * Asset Manager - Centralized management of all static assets
 * Maps external URLs to local alternatives and provides fallback strategies
 */

interface ImageAsset {
  name: string;
  local: string;
  external: string;
  category: 'hero' | 'token' | 'nft' | 'avatar' | 'brand' | 'background';
  size: 'small' | 'medium' | 'large';
}

interface AssetConfig {
  images: Map<string, ImageAsset>;
  fallbackImage: string;
  enableExternalFallback: boolean;
}

class AssetManager {
  private config: AssetConfig;
  private loadingCache: Map<string, boolean> = new Map();

  constructor() {
    this.config = {
      images: new Map(),
      fallbackImage: '/images/placeholder.png',
      enableExternalFallback: false,
    };
    this.initializeAssets();
  }

  private initializeAssets() {
    // Brand/Hero Images
    this.registerImage('agunnaya-logo', {
      name: 'Agunnaya Logo',
      local: '/images/brand/agunnaya-logo.png',
      external: 'https://agunnaya.labs/logo.png',
      category: 'brand',
      size: 'medium',
    });

    this.registerImage('hero-background', {
      name: 'Hero Background',
      local: '/images/backgrounds/hero-gradient.png',
      external: 'https://images.unsplash.com/photo-1639322537228-f710d846310a',
      category: 'background',
      size: 'large',
    });

    this.registerImage('nft-placeholder', {
      name: 'NFT Placeholder',
      local: '/images/placeholders/nft-default.png',
      external: 'https://images.unsplash.com/photo-1620321503375-a001b71ed04e',
      category: 'nft',
      size: 'medium',
    });

    this.registerImage('token-placeholder', {
      name: 'Token Placeholder',
      local: '/images/placeholders/token-default.png',
      external: 'https://images.unsplash.com/photo-1621504891691-8ba36be552da',
      category: 'token',
      size: 'medium',
    });

    this.registerImage('avatar-default', {
      name: 'Default Avatar',
      local: '/images/avatars/default.png',
      external: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
      category: 'avatar',
      size: 'small',
    });

    // Dashboard background
    this.registerImage('dashboard-bg', {
      name: 'Dashboard Background',
      local: '/images/backgrounds/dashboard-dark.png',
      external: 'https://images.unsplash.com/photo-1557821552-17105176677c',
      category: 'background',
      size: 'large',
    });

    // DAO placeholder
    this.registerImage('dao-placeholder', {
      name: 'DAO Placeholder',
      local: '/images/placeholders/dao-default.png',
      external: 'https://images.unsplash.com/photo-1552664730-d307ca884978',
      category: 'brand',
      size: 'medium',
    });

    // Game placeholder
    this.registerImage('game-placeholder', {
      name: 'GameFi Placeholder',
      local: '/images/placeholders/game-default.png',
      external: 'https://images.unsplash.com/photo-1611339555312-e607c25352ca',
      category: 'brand',
      size: 'large',
    });
  }

  /**
   * Register an image asset with fallback chain
   */
  private registerImage(id: string, asset: ImageAsset) {
    this.config.images.set(id, asset);
  }

  /**
   * Get the best available image URL (local first, then external, then fallback)
   */
  getImage(id: string): string {
    const asset = this.config.images.get(id);
    
    if (!asset) {
      console.warn(`[AssetManager] Image '${id}' not registered`);
      return this.config.fallbackImage;
    }

    // Always try local first (faster, no CORS issues)
    if (this.imageExists(asset.local)) {
      return asset.local;
    }

    // Fall back to external if enabled
    if (this.config.enableExternalFallback && asset.external) {
      console.info(`[AssetManager] Using external fallback for '${id}'`);
      return asset.external;
    }

    // Return placeholder
    return this.config.fallbackImage;
  }

  /**
   * Get multiple images
   */
  getImages(ids: string[]): string[] {
    return ids.map(id => this.getImage(id));
  }

  /**
   * Get images by category
   */
  getImagesByCategory(category: ImageAsset['category']): Map<string, string> {
    const result = new Map<string, string>();
    
    this.config.images.forEach((asset, id) => {
      if (asset.category === category) {
        result.set(id, this.getImage(id));
      }
    });

    return result;
  }

  /**
   * Check if local image exists
   */
  private imageExists(path: string): boolean {
    // In a real app, you'd ping the image to verify existence
    // For now, assume all registered local images exist
    return path.startsWith('/images/');
  }

  /**
   * Register custom asset
   */
  registerCustomImage(id: string, asset: ImageAsset) {
    this.config.images.set(id, asset);
  }

  /**
   * Enable/disable external fallback
   */
  setExternalFallback(enabled: boolean) {
    this.config.enableExternalFallback = enabled;
  }

  /**
   * Get all registered image IDs
   */
  getAllImageIds(): string[] {
    return Array.from(this.config.images.keys());
  }

  /**
   * Get asset metadata
   */
  getAsset(id: string): ImageAsset | undefined {
    return this.config.images.get(id);
  }
}

// Export singleton instance
export const assetManager = new AssetManager();

/**
 * React hook for getting image with fallback
 */
export function useImage(id: string, fallback?: string) {
  return fallback || assetManager.getImage(id);
}

/**
 * React hook for getting multiple images
 */
export function useImages(ids: string[]) {
  return assetManager.getImages(ids);
}

/**
 * React hook for getting images by category
 */
export function useImagesByCategory(category: ImageAsset['category']) {
  return assetManager.getImagesByCategory(category);
}
