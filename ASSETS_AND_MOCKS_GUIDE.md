# Assets Management & Mock Data Migration Guide

## Overview
This guide outlines strategies for managing local assets and transitioning from mock data to real data sources.

## Asset Structure

### Local Asset Directories
```
public/
├── images/
│   ├── brand/           # Logo, branding
│   ├── avatars/         # User avatars
│   ├── backgrounds/     # Hero, dashboard backgrounds
│   ├── placeholders/    # Fallback images
│   └── icons/          # Icon assets
├── fonts/              # Custom fonts
├── videos/             # Short videos/demos
└── documents/          # PDFs, guides
```

## Using Asset Manager

### Import and Usage
```typescript
import { assetManager, useImage, useImages } from '@/lib/assetManager';

// In components
export function MyComponent() {
  const heroImage = useImage('hero-background');
  const tokenImages = useImages(['token-placeholder', 'nft-placeholder']);
  
  return (
    <img src={heroImage} alt="Hero" />
  );
}
```

### Registering Custom Assets
```typescript
import { assetManager } from '@/lib/assetManager';

// Register a new asset
assetManager.registerCustomImage('my-custom-image', {
  name: 'My Custom Image',
  local: '/images/custom/my-image.png',
  external: 'https://example.com/image.png',
  category: 'brand',
  size: 'medium',
});

// Use it
const imageUrl = assetManager.getImage('my-custom-image');
```

## Mock Data Migration Strategy

### Phase 1: Identify Mock Data
Search for:
- `mock`, `Mock`, `MOCK` keywords
- `TODO:`, `FIXME:`, placeholder comments
- Hardcoded arrays/objects used as data
- Unsplash/external image URLs

### Phase 2: Create Real Data Handlers
```typescript
// Before: Mock data
const tokens = [
  { id: '1', name: 'Token1', symbol: 'TK1', price: 100 },
  { id: '2', name: 'Token2', symbol: 'TK2', price: 200 },
];

// After: Real data from database/API
async function getTokens() {
  const response = await fetch('/api/tokens');
  return response.json();
}
```

### Phase 3: Add Empty States
When no real data exists, show meaningful empty states:

```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-gray-400 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn btn-primary">
          {action.label}
        </button>
      )}
    </div>
  );
}
```

## Mock Data Cleanup Checklist

### High Priority (Remove First)
- [ ] Hardcoded token lists
- [ ] Sample NFT collections
- [ ] Test DAO configurations
- [ ] Placeholder game data
- [ ] Mock AI agents

### Medium Priority
- [ ] Sample transaction histories
- [ ] Mock analytics data
- [ ] Placeholder portfolio data
- [ ] Test wallet addresses

### Low Priority (Can Keep for Testing)
- [ ] Development/test mode toggles
- [ ] Demo data flags
- [ ] Sample configurations for onboarding

## Broken Image Fix Strategy

### 1. Unsplash Images → Local Assets
Replace:
```typescript
// Before
<img src="https://images.unsplash.com/photo-1534721452754-7f64ba76e920" />

// After
<img src={assetManager.getImage('hero-background')} />
```

### 2. External CDN → Local
```typescript
// Before
<img src="https://example-cdn.com/assets/image.png" />

// After
import heroImage from '@/assets/hero.png';
<img src={heroImage} />
```

### 3. Broken References → Fallback
```typescript
// Before
<img src="/nonexistent/image.png" onerror="..." />

// After
<img 
  src={assetManager.getImage('token-placeholder')}
  alt="Token"
  onError={(e) => {
    e.currentTarget.src = assetManager.getImage('token-placeholder');
  }}
/>
```

## Image Optimization Guidelines

### Size Considerations
- **Hero images**: 1920x1080 (desktop), 640x480 (mobile)
- **Avatars**: 64x64, 128x128, 256x256 (srcset)
- **Thumbnails**: 300x300, 400x400
- **Background**: 1920x1080 (use CSS background)

### Format Selection
- **PNG**: Graphics, logos (with transparency)
- **JPEG**: Photos, gradients (smaller file size)
- **WebP**: Modern browsers (20-30% smaller)
- **SVG**: Icons, logos (scalable, lightweight)

### Responsive Images
```typescript
<img
  src="/images/token-large.png"
  srcSet="
    /images/token-small.png 300w,
    /images/token-medium.png 600w,
    /images/token-large.png 1200w
  "
  alt="Token"
/>
```

## Performance Tips

### 1. Lazy Loading
```typescript
<img
  src={assetManager.getImage('nft-placeholder')}
  loading="lazy"
  alt="NFT"
/>
```

### 2. Image Compression
- Use tools like TinyPNG, ImageOptim
- Keep file sizes < 200KB for avatars, < 500KB for heroes
- Use Next.js Image component for optimization (if using Next.js)

### 3. CDN Caching
- Set cache headers to 1 year for versioned assets
- Use cache busting for updated assets

## Testing Assets

### Unit Tests
```typescript
import { assetManager } from '@/lib/assetManager';

describe('AssetManager', () => {
  it('should return local image for registered asset', () => {
    const image = assetManager.getImage('hero-background');
    expect(image).toContain('/images/');
  });

  it('should return fallback for unregistered asset', () => {
    const image = assetManager.getImage('nonexistent');
    expect(image).toBe(assetManager.getImage('fallback'));
  });
});
```

### Manual Testing
1. Verify all local images load
2. Check responsive images on different screen sizes
3. Verify fallbacks work when images fail to load
4. Test on slow network (DevTools throttling)

## Migration Timeline

1. **Week 1**: Set up asset manager, audit current images
2. **Week 2**: Replace Unsplash/external URLs with local assets
3. **Week 3**: Create empty states for mock data
4. **Week 4**: Migrate mock data to API/database calls
5. **Week 5**: Performance testing and optimization

## References
- Asset Management Best Practices: https://web.dev/performance-images/
- Image Optimization Guide: https://www.smashingmagazine.com/2021/07/guidelines-for-web-performance-budgets/
- Responsive Images: https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images
