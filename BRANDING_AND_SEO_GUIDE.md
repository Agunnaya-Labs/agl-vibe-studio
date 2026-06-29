# Branding & SEO Implementation Guide

## Overview

This guide documents the comprehensive branding system and SEO implementation for Agunnaya Labs Studio.

## Contents

1. [Branding System](#branding-system)
2. [SEO Configuration](#seo-configuration)
3. [Image & Asset Management](#image--asset-management)
4. [Implementation Examples](#implementation-examples)
5. [Best Practices](#best-practices)

---

## Branding System

### Centralized Brand Configuration

All branding assets are managed through `/src/lib/branding.ts`:

```typescript
import { brand, colors, typography, assets } from '@/lib/branding';

// Access brand information
console.log(brand.name); // "Agunnaya Labs Studio"
console.log(colors.primary.blue); // "#0052FF"
```

### Brand Identity

- **Name**: Agunnaya Labs Studio
- **Tagline**: Next-Generation AI Web3 Creation Engine
- **Website**: https://agunnaya-labs.studio
- **Primary Colors**: Blue (#0052FF) & Purple (#A855F7)

### Asset Locations

All brand assets are stored in `/public/images/`:

```
public/images/
├── brand/
│   └── agunnaya-logo.png          # Primary logo
├── backgrounds/
│   ├── hero-gradient.png          # Hero section background
│   └── dashboard-dark.png         # Dashboard background
├── placeholders/
│   ├── nft-default.png           # NFT placeholder
│   ├── token-default.png         # Token placeholder
│   ├── dao-default.png           # DAO placeholder
│   └── game-default.png          # Game placeholder
└── avatars/
    └── default.png               # Default user avatar
```

---

## SEO Configuration

### SEO Utility (`/src/lib/seo.ts`)

The SEO system provides:

1. **Default SEO Metadata** - Applied to landing page
2. **Page-specific Metadata** - Customized for each section
3. **Open Graph Tags** - Social media sharing
4. **Twitter Cards** - Twitter integration
5. **Structured Data** - JSON-LD for search engines

### SEO Head Component

Use the `SEOHead` component to apply SEO metadata to pages:

```typescript
import { SEOHead } from '@/components/SEOHead';
import { getPageSEO } from '@/lib/seo';

export default function MyPage() {
  const seo = getPageSEO('dashboard');
  
  return (
    <>
      <SEOHead seo={seo} />
      {/* Page content */}
    </>
  );
}
```

### Meta Tags Added

**In `index.html`:**
- Title, description, keywords
- Theme color and color scheme
- Open Graph tags (og:title, og:description, og:image)
- Twitter Card tags (twitter:card, twitter:title)
- Canonical URL
- Preconnect hints for performance
- Security headers (CSP, X-Frame-Options)
- Favicons

**In App Component:**
- Dynamic page titles based on current tab
- Social sharing images
- Structured data (JSON-LD)

### Page-Specific SEO

Each page has customized metadata:

| Page | Title | Keywords |
|------|-------|----------|
| Dashboard | Dashboard - Agunnaya Labs Studio | dashboard, portfolio, management |
| Explore | Explore - Agunnaya Labs Studio | token explorer, trading, DEX |
| AI Builder | AI Smart Contract Architect | smart contracts, Solidity, AI |
| NFTs | NFT Studio | NFT creation, ERC-721, digital art |
| DAOs | DAO Builder | governance, voting, treasury |
| GameFi | GameFi Suite | games, play-to-earn, rewards |
| AI Agents | AI Agent Studio | AI agents, automation, bots |
| DeFi | DeFi Hub | staking, yield farming, liquidity |
| Analytics | Analytics | metrics, charts, data visualization |

---

## Image & Asset Management

### Asset Manager Hook

The `useImage` hook provides automatic image fallback:

```typescript
import { useImage } from '@/lib/assetManager';

export default function MyComponent() {
  const logo = useImage('agunnaya-logo');
  
  return <img src={logo} alt="Logo" />;
}
```

**Fallback Chain:**
1. Local asset from registry
2. External URL (if registered)
3. Generic placeholder
4. Inline SVG fallback

### Registering New Assets

Add to asset registry in `/src/lib/assetManager.ts`:

```typescript
export const assetRegistry = {
  'my-image': {
    local: '/images/my-category/my-image.png',
    external: 'https://example.com/image.png',
    placeholder: '/images/placeholders/generic.png'
  }
};
```

### Image Best Practices

1. **Always use `alt` text** for accessibility
2. **Use `useImage()` hook** for automatic fallbacks
3. **Compress images** before deployment
4. **Use placeholders** for loading states
5. **Lazy load** images below the fold

---

## Implementation Examples

### Example 1: Adding Logo to Header

```typescript
import { useImage } from '@/lib/assetManager';

export default function Header() {
  const logo = useImage('agunnaya-logo');
  
  return (
    <img
      src={logo}
      alt="Agunnaya Labs Logo"
      className="w-8 h-8 rounded-lg"
    />
  );
}
```

### Example 2: Creating SEO-Optimized Page

```typescript
import SEOHead from '@/components/SEOHead';
import { getPageSEO } from '@/lib/seo';

export default function NFTStudio() {
  const seo = getPageSEO('nfts');
  
  return (
    <>
      <SEOHead seo={seo} />
      <div className="space-y-6">
        {/* Page content */}
      </div>
    </>
  );
}
```

### Example 3: Using Branding System

```typescript
import { brand, colors, assets, typography } from '@/lib/branding';

export default function BrandShowcase() {
  return (
    <div style={{
      backgroundColor: colors.primary.dark,
      color: colors.neutral.white,
      fontFamily: typography.fonts.display,
      padding: '24px'
    }}>
      <img src={assets.logos.full} alt={brand.name} />
      <h1>{brand.name}</h1>
      <p>{brand.tagline}</p>
    </div>
  );
}
```

### Example 4: Social Media Sharing

The SEOHead component automatically generates:

- Open Graph meta tags for Facebook sharing
- Twitter Card meta tags for Twitter sharing
- Structured data for search engines

Just add the SEOHead component to your page, and social platforms will automatically use the configured image and description.

---

## Best Practices

### SEO Best Practices

1. **Use Descriptive Titles** - Include main keyword and brand
2. **Write Compelling Descriptions** - 150-160 characters, keyword-focused
3. **Optimize Keywords** - Use 5-8 relevant keywords per page
4. **Use Schema Markup** - Implement JSON-LD for rich snippets
5. **Include Images** - Use high-quality images with alt text
6. **Build Internal Links** - Connect related pages
7. **Mobile Responsive** - Ensure all pages are mobile-friendly
8. **Fast Loading** - Optimize images and use code splitting

### Branding Best Practices

1. **Consistent Logo Usage** - Always use the official logo
2. **Color Consistency** - Use brand colors consistently
3. **Typography** - Use Display font for headings, Sans for body
4. **Brand Voice** - Maintain consistent messaging
5. **Social Presence** - Link to official social accounts
6. **Documentation** - Document all brand usage

### Image Best Practices

1. **Responsive Images** - Use srcset for different screen sizes
2. **Lazy Loading** - Load images only when needed
3. **Optimization** - Compress without losing quality
4. **Accessibility** - Always provide descriptive alt text
5. **Caching** - Use browser caching for images
6. **CDN Delivery** - Serve images from CDN for speed
7. **WebP Format** - Use modern formats when possible

### Performance Tips

1. **Code Splitting** - Lazy load pages for faster initial load
2. **Image Optimization** - Compress all images
3. **Preload Critical Resources** - Preconnect to important domains
4. **Minify CSS/JS** - Reduce bundle size
5. **Gzip Compression** - Enable on server
6. **Browser Caching** - Set appropriate cache headers
7. **CDN** - Use CDN for static assets

---

## Troubleshooting

### Broken Images

**Problem:** Images not loading

**Solution:**
1. Check file path in asset registry
2. Verify file exists in `/public/` directory
3. Use `useImage()` hook for automatic fallback
4. Check console for 404 errors

### SEO Not Appearing

**Problem:** Meta tags not showing in page source

**Solution:**
1. Ensure SEOHead component is rendering
2. Check Helmet provider wraps your component
3. Verify meta tags in browser DevTools
4. Check React Helmet documentation

### Branding Inconsistency

**Problem:** Colors or fonts not consistent

**Solution:**
1. Use `brand.*` variables instead of hardcoding
2. Import from `/src/lib/branding.ts`
3. Use Tailwind classes for consistency
4. Reference design guidelines

---

## Files Reference

| File | Purpose |
|------|---------|
| `/src/lib/seo.ts` | SEO metadata configuration |
| `/src/lib/branding.ts` | Brand colors, typography, assets |
| `/src/lib/assetManager.ts` | Image/asset management and fallbacks |
| `/src/components/SEOHead.tsx` | SEO meta tags component |
| `/index.html` | Global SEO meta tags and security headers |

---

## Resources

- [React Helmet Async Docs](https://github.com/steverob/react-helmet-async)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Tags](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [JSON-LD Schema.org](https://schema.org/)
- [Next.js Image Optimization](https://nextjs.org/docs/api-reference/next/image)
- [Web Performance Tips](https://web.dev/performance/)

---

**Last Updated:** 2026-06-29
**Version:** 1.0.0
