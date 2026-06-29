# Performance Optimization Guide

## Performance Metrics Targets

### Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **TTFB (Time to First Byte)**: < 600ms

### Page Load
- **First Paint**: < 1s
- **Interactive (TTI)**: < 3s
- **Total Bundle Size**: < 500KB (gzipped)
- **Time to Interactive**: < 4s

## 1. Code Splitting & Lazy Loading

### Dynamic Imports for Pages
```typescript
// Before: All pages loaded upfront
import DashboardPage from './pages/DashboardPage';
import CreatePage from './pages/CreatePage';

// After: Lazy loaded
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CreatePage = lazy(() => import('./pages/CreatePage'));

// With Suspense boundary
<Suspense fallback={<LoadingSpinner />}>
  <DashboardPage />
</Suspense>
```

### Component-Level Code Splitting
```typescript
// Heavy components
const ChartComponent = lazy(() => import('@/components/ChartComponent'));
const DataTable = lazy(() => import('@/components/DataTable'));

// Load only when visible
<Suspense fallback={<Skeleton />}>
  {showChart && <ChartComponent />}
</Suspense>
```

### Route-Based Splitting
```typescript
// Automatic with React Router v6+
const routes = [
  {
    path: 'dashboard',
    element: <DashboardLayout />,
    children: [
      {
        path: 'analytics',
        lazy: () => import('./pages/Analytics'),
      },
    ],
  },
];
```

## 2. Image Optimization

### Responsive Images
```typescript
<img
  src="/images/hero-large.png"
  srcSet="
    /images/hero-small.png 640w,
    /images/hero-medium.png 1024w,
    /images/hero-large.png 1920w
  "
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 1200px"
  alt="Hero"
/>
```

### Next-Gen Formats
```typescript
<picture>
  <source srcSet="/images/hero.webp" type="image/webp" />
  <source srcSet="/images/hero.png" type="image/png" />
  <img src="/images/hero.png" alt="Hero" />
</picture>
```

### Progressive Image Loading
```typescript
export function ProgressiveImage({ src, placeholder }: Props) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [loading, setLoading] = useState(true);

  return (
    <img
      src={imageSrc}
      className={loading ? 'blur-lg' : ''}
      onLoad={() => {
        if (imageSrc === placeholder) {
          setImageSrc(src);
        }
        setLoading(false);
      }}
      alt="Content"
    />
  );
}
```

## 3. Bundle Analysis & Optimization

### Analyze Bundle Size
```bash
# Install analyzer
npm install -D vite-plugin-visualizer

# Generate report
npm run build -- --mode analyze
```

### Tree Shaking
```typescript
// ✓ Good - named exports for tree shaking
export { Component1, Component2 };

// ✗ Avoid - default exports prevent tree shaking
export default { Component1, Component2 };
```

### Remove Unused Dependencies
```bash
# Find unused dependencies
npm install -D depcheck
npx depcheck

# Remove unused
npm uninstall unused-package
```

## 4. Caching Strategy

### Browser Caching Headers
```
# Cache versioned assets forever
*.abc123.js: Cache-Control: public, max-age=31536000

# Cache CSS/JS with hash
*.js: Cache-Control: public, max-age=31536000

# Don't cache HTML
index.html: Cache-Control: no-cache, no-store, must-revalidate
```

### Service Worker Caching
```typescript
// Precache critical resources
const CACHE_NAME = 'app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/main.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});
```

## 5. Database Query Optimization

### Pagination
```typescript
// API endpoint
app.get('/api/tokens', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const tokens = db.tokens.slice(offset, offset + limit);
  res.json({ tokens, page, total: db.tokens.length });
});
```

### Caching Results
```typescript
const cache = new Map();

function getCachedTokens(page: number) {
  const key = `tokens_page_${page}`;
  
  if (cache.has(key)) {
    return cache.get(key);
  }

  const tokens = fetchTokensFromDB(page);
  cache.set(key, tokens);
  
  // Clear cache after 5 minutes
  setTimeout(() => cache.delete(key), 5 * 60 * 1000);
  
  return tokens;
}
```

## 6. React Performance

### Memoization
```typescript
// Prevent unnecessary re-renders
const TokenCard = memo(({ token }: Props) => {
  return <div>{token.name}</div>;
});

// With custom comparison
const TokenCard = memo(
  ({ token }: Props) => <div>{token.name}</div>,
  (prev, next) => prev.token.id === next.token.id
);
```

### useMemo & useCallback
```typescript
const Component = ({ items }: Props) => {
  // Memoize expensive computation
  const sortedItems = useMemo(
    () => items.sort((a, b) => a.price - b.price),
    [items]
  );

  // Memoize callback
  const handleSelect = useCallback(
    (item) => {
      setSelected(item);
    },
    []
  );

  return <div>{sortedItems.map(item => ...)}</div>;
};
```

### useTransition for Non-Urgent Updates
```typescript
const [isPending, startTransition] = useTransition();

const handleSearch = (query: string) => {
  // Priority update - update input immediately
  setSearchQuery(query);

  // Non-priority update - filter results in background
  startTransition(() => {
    setFilteredResults(filterResults(query));
  });
};
```

## 7. Network Optimization

### Compression
```bash
# Enable gzip in Express
npm install compression

app.use(compression());
```

### Request Batching
```typescript
// Instead of multiple requests
// GET /api/tokens
// GET /api/nfts
// GET /api/daos

// Single request
GET /api/data?resources=tokens,nfts,daos
```

### Debouncing API Calls
```typescript
import { debounce } from 'lodash';

const handleSearch = debounce((query: string) => {
  fetchResults(query);
}, 500); // Wait 500ms after last keystroke
```

## 8. Build Optimization

### Vite Configuration
```typescript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui': ['lucide-react'],
          'utils': ['axios', 'date-fns'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
  },
};
```

## 9. Monitoring Performance

### Performance API
```typescript
// Measure custom performance
performance.mark('filter-start');
const filtered = items.filter(item => item.price > 100);
performance.mark('filter-end');
performance.measure('filter', 'filter-start', 'filter-end');

const measure = performance.getEntriesByName('filter')[0];
console.log(`Filter took ${measure.duration}ms`);
```

### Web Vitals Tracking
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## 10. Deployment Optimization

### Server-Side Rendering (SSR)
- Faster Time to First Byte
- Better SEO
- Reduced client-side processing

### Prerendering
```bash
# Generate static HTML for better performance
npm run build
npm run prerender
```

### CDN Configuration
- Cache static assets
- Compress responses
- Use regional endpoints

## Performance Checklist

### Before Launch
- [ ] Bundle size < 500KB (gzipped)
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] No unused dependencies
- [ ] Images optimized and responsive
- [ ] Code splitting implemented
- [ ] Service worker caching configured
- [ ] Database queries optimized
- [ ] Monitoring set up

### Regular Monitoring
- [ ] Weekly performance audits
- [ ] Monthly dependency updates
- [ ] Quarterly bundle size reviews
- [ ] Real user monitoring data

## Tools & Resources

### Monitoring
- Google Lighthouse
- WebPageTest
- Sentry (error tracking)
- New Relic (APM)

### Analysis
- Bundle Analyzer
- Network DevTools
- React DevTools Profiler
- Chrome DevTools

### Optimization
- ImageMagick (image processing)
- TinyPNG (image compression)
- PurgeCSS (unused CSS)
- Terser (JS minification)

## References
- Web.dev Performance Guide: https://web.dev/performance/
- React Performance: https://react.dev/reference/react/useMemo
- Vite Optimization: https://vitejs.dev/guide/ssr.html
- Core Web Vitals: https://web.dev/vitals/
