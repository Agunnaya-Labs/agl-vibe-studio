# Production Build Guide

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.production
# Edit .env.production with your Firebase credentials

# 3. Run pre-deployment checks
bash scripts/pre-deploy.sh

# 4. Build for production
npm run build

# 5. Start production server
npm start
```

## What's New (Production-Ready Features)

### ✅ Removed All Mock Data
- All `SEED_*` constants removed from codebase
- Data now loads exclusively from Firebase
- Zero hardcoded test data in production build

### ✅ Environment Configuration
- **`src/lib/env.ts`**: Environment manager with validation
- Production/development mode detection
- Feature flags and security settings
- Automatic configuration based on NODE_ENV

### ✅ Error Handling & Observability
- **`src/lib/errorHandler.ts`**: Global error handling
- **`src/lib/logger.ts`**: Structured logging system
- **`src/components/ErrorBoundary.tsx`**: React error boundary
- **`src/lib/performance.ts`**: Web Vitals monitoring

### ✅ Firebase Integration
- **`src/lib/firestoreUtils.ts`**: Type-safe Firestore operations
- User-scoped data access (automatic userId filtering)
- Batch operations support
- Connection validation

### ✅ API Handlers
- **`src/api/handlers.ts`**: Transaction and deployment handlers
- Token purchase/sale logic
- Deployment validation
- Referral processing

### ✅ Performance Optimization
- **Vite Configuration**: Code splitting, minification, source map control
- **Bundle Analysis**: Track and optimize bundle size
- **Lazy Loading**: Components and routes can be code-split
- **Caching**: Smart cache strategies per environment

### ✅ Build Optimization
- Tree-shaking enabled
- Console logs removed in production
- Source maps disabled for security
- Vendor chunks separated for better caching

## Environment Variables

Create `.env.production`:

```env
# Environment
VITE_ENV=production

# Firebase (Required)
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google AI
GEMINI_API_KEY=your_gemini_key

# Security
VITE_CORS_ORIGINS=https://yourdomain.com

# Optional: Monitoring
# VITE_SENTRY_DSN=your_sentry_dsn
# VITE_LOG_ROCKET_ID=your_logrocket_id

# Server
NODE_ENV=production
PORT=3000
APP_URL=https://yourdomain.com
```

## Build Process

### 1. Development Build
```bash
npm run dev
```
- Fast rebuild with HMR
- Source maps enabled
- Console logs preserved
- Mock data NOT included (already removed)

### 2. Production Build
```bash
npm run build
```

**Output:**
```
dist/
├── index.html              # Entry point
├── assets/
│   ├── index.*.js          # Main bundle (~150-250KB gzipped)
│   ├── vendor.*.js         # React/vendor deps (~100KB gzipped)
│   ├── firebase-vendor.*.js # Firebase libs (~50KB gzipped)
│   └── index.*.css         # Styles
└── server.cjs              # Node.js server bundle
```

### 3. Start Production Server
```bash
npm start
```
- Runs on port 3000
- Loads `.env.production`
- Serves static assets
- Handles API requests

## Key Files & Features

| File | Purpose |
|------|---------|
| `src/lib/env.ts` | Environment configuration & validation |
| `src/lib/errorHandler.ts` | Global error handling |
| `src/lib/logger.ts` | Structured logging |
| `src/lib/firestoreUtils.ts` | Type-safe Firestore operations |
| `src/lib/performance.ts` | Performance monitoring |
| `src/api/handlers.ts` | Transaction handlers |
| `src/components/ErrorBoundary.tsx` | Error boundary |
| `src/hooks/useDataInitialization.ts` | Firebase data loading |
| `vite.config.ts` | Build optimization |
| `.env.example` | Environment template |
| `PRODUCTION.md` | Deployment guide |

## Deployment Options

### Option 1: Vercel (Recommended)
```bash
npm install -g vercel
vercel deploy --prod
```

### Option 2: Docker
```bash
docker build -t agunnaya-studio .
docker run -p 3000:3000 -e NODE_ENV=production agunnaya-studio
```

### Option 3: Traditional Server
```bash
# Build
npm run build

# Transfer dist/ to server
scp -r dist/ user@server:/app/

# Install and start
ssh user@server
cd /app
npm install --production
npm start
```

## Verification Checklist

Before deploying, verify:

- [ ] `npm run build` completes without errors
- [ ] No TypeScript errors: `npm run lint`
- [ ] Pre-deploy checks pass: `bash scripts/pre-deploy.sh`
- [ ] Firebase credentials configured in `.env.production`
- [ ] Firebase security rules applied to Firestore
- [ ] Test locally: `npm start` then visit `http://localhost:3000`
- [ ] No console errors in browser developer tools
- [ ] Performance metrics look good (check browser DevTools)
- [ ] All pages load without mock data

## Troubleshooting

### Empty App on Startup
**Problem**: App loads but shows no tokens/NFTs/DAOs
- [ ] Check Firestore has data in correct collections
- [ ] Verify Firestore security rules allow reads
- [ ] Check Firebase credentials in `.env.production`
- [ ] Review browser console for Firebase errors

### Build Fails
**Problem**: `npm run build` fails
- [ ] Run `npm install` to ensure dependencies are installed
- [ ] Check TypeScript: `npm run lint`
- [ ] Verify Node.js version >= 18: `node --version`
- [ ] Clear cache: `rm -rf node_modules/.vite`

### Server Won't Start
**Problem**: `npm start` fails
- [ ] Check port 3000 not in use: `lsof -i :3000`
- [ ] Verify environment variables: `env | grep VITE_`
- [ ] Check Firebase connection in console logs
- [ ] Review `.env.production` for typos

### High Bundle Size
**Problem**: Bundle larger than expected
- [ ] Check for unused dependencies: `npm ls`
- [ ] Analyze bundle: `npm run build -- --analyze`
- [ ] Look for duplicate packages in node_modules
- [ ] Consider removing unused Firebase services

## Performance Targets

Aim for these metrics in production:

| Metric | Target | Good | Poor |
|--------|--------|------|------|
| LCP (Largest Contentful Paint) | < 2.5s | < 2.5s | > 4s |
| FID (First Input Delay) | < 100ms | < 100ms | > 300ms |
| CLS (Cumulative Layout Shift) | < 0.1 | < 0.1 | > 0.25 |
| TTFB (Time to First Byte) | < 600ms | < 600ms | > 1800ms |

Monitor using:
- Chrome DevTools Lighthouse
- Firebase Performance Monitoring
- Web Vitals Library (built-in)

## Support & Monitoring

After deployment:

1. **Monitor Errors**
   - Check browser console for errors
   - Review error logs (if Sentry/LogRocket configured)
   - Check Firebase error logs in Console

2. **Monitor Performance**
   - Use Lighthouse for Core Web Vitals
   - Monitor Firebase Realtime Database usage
   - Track API response times

3. **Monitor Logs**
   - Check application logs
   - Review Firebase Firestore logs
   - Monitor server logs (if self-hosted)

## Next Steps

1. Deploy to production using chosen option
2. Monitor first 24 hours for errors
3. Set up alerts for critical errors
4. Plan regular security updates
5. Implement backup strategy for Firestore
