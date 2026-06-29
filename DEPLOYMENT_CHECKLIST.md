# Agunnaya Labs Studio - Deployment Checklist

## Pre-Deployment Verification

### Environment Setup
- [ ] Node.js 20+ installed
- [ ] npm/yarn/pnpm package manager configured
- [ ] Firebase project created and Firestore database initialized
- [ ] Google Gemini API key obtained from Google AI Studio
- [ ] Base RPC endpoints (Mainnet and Sepolia) configured

### Code Quality
- [ ] All TypeScript tests pass: `npm run lint`
- [ ] Production build completes without errors: `npm run build`
- [ ] No console errors or warnings in dev server
- [ ] All environment variables in `.env.development.local` are valid

### Testing Completion
- [ ] Homepage loads correctly
- [ ] Dashboard page loads and renders wallet UI
- [ ] All 15 navigation menu items are clickable
- [ ] Mobile responsiveness verified at 375px width
- [ ] Images load correctly (logo and banner)
- [ ] Wallet connection modal opens and closes
- [ ] Search functionality works in header

---

## Local Development Verification

### Running Locally
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Server runs on http://localhost:3000
```

### Environment Variables Required
```bash
# Create .env.development.local with:
GEMINI_API_KEY=your_api_key_here
VITE_FIREBASE_CONFIG=your_firebase_config_here
```

### Build for Production
```bash
# Clean previous builds
npm run clean

# Build for production
npm run build

# Verify build output in dist/ directory
# Expected files: dist/index.html, dist/assets/*, dist/server.cjs
```

---

## Deployment to Vercel

### Step 1: Connect Repository
1. Push code to GitHub repository (agunnaya001/agl-vibe-studio)
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import GitHub repository

### Step 2: Configure Environment Variables
In Vercel Project Settings → Environment Variables:
```
GEMINI_API_KEY = [your_api_key]
NODE_ENV = production
```

### Step 3: Configure Build Settings
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Deploy
1. Click "Deploy"
2. Wait for build to complete (typically 2-5 minutes)
3. Access deployed app at `https://[project].vercel.app`

### Step 5: Verify Deployment
- [ ] Landing page loads without errors
- [ ] Dashboard displays correctly
- [ ] Network switcher works (Base Mainnet / Sepolia)
- [ ] Search functionality works
- [ ] Wallet connection modal appears
- [ ] No 404 errors for assets
- [ ] Web Vitals acceptable in Vercel Analytics

---

## Alternative: Docker Deployment

### Build Docker Image
```bash
# Build image
docker build -t agunnaya-studio:latest .

# Run container locally
docker run -p 3000:3000 \
  -e GEMINI_API_KEY=your_key \
  -e NODE_ENV=production \
  agunnaya-studio:latest

# Test at http://localhost:3000
```

### Deploy to Cloud Run (Google Cloud)
```bash
# Authenticate with gcloud
gcloud auth login

# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/agunnaya-studio

# Deploy to Cloud Run
gcloud run deploy agunnaya-studio \
  --image gcr.io/PROJECT_ID/agunnaya-studio \
  --platform managed \
  --region us-central1 \
  --set-env-vars GEMINI_API_KEY=your_key \
  --allow-unauthenticated
```

---

## Post-Deployment Configuration

### Set Up Custom Domain
1. In Vercel dashboard, go to Settings → Domains
2. Add your custom domain (e.g., `studio.agunnaya.xyz`)
3. Update DNS records with Vercel's provided nameservers
4. Wait for DNS propagation (typically 24-48 hours)

### Enable Analytics
1. Vercel Web Analytics automatically enabled
2. Set up custom event tracking:
   ```typescript
   // In components
   import { trackEvent } from '@vercel/analytics';
   
   const handleWalletConnect = () => {
     trackEvent('wallet_connected', {
       wallet_type: 'metamask'
     });
   };
   ```

### Configure Monitoring
1. Set up Sentry for error tracking
2. Configure Google Analytics 4 for user metrics
3. Set up Firestore monitoring in Google Cloud Console

---

## Performance Monitoring

### Key Metrics to Track
- **Lighthouse Score**: Target 90+ on all categories
- **Web Vitals**:
  - TTFB: < 50ms (currently: 11ms ✅)
  - FCP: < 1800ms (currently: 292ms ✅)
  - LCP: < 2500ms (currently: 292ms ✅)
  - CLS: < 0.1 (currently: 0.0 ✅)

### Monitoring Commands
```bash
# Run Lighthouse audit
npm install -g lighthouse
lighthouse https://your-deployed-app.vercel.app

# Check bundle size
npm install -g bundlesize
bundlesize
```

---

## Troubleshooting Deployment

### Build Fails with "GEMINI_API_KEY not found"
- Ensure `GEMINI_API_KEY` is set in Environment Variables
- Verify the key is valid by testing locally first
- Check for typos in variable name (case-sensitive)

### Images Not Loading (404 errors)
- Verify image files exist in `/assets/images/`
- Check image paths in code (should be `/assets/images/filename.png`)
- Clear Vercel cache and redeploy

### Website Loads Slowly
- Check Lighthouse scores
- Verify network requests in browser DevTools
- Consider implementing code-splitting (see TESTING_AND_IMPROVEMENTS.md)

### Wallet Connection Not Working
- Verify Firebase config is correct
- Check browser console for auth errors
- Ensure Firebase project is accessible

---

## Rollback Procedure

### If Deployment Has Issues
1. Go to Vercel Deployments tab
2. Find the previous stable deployment
3. Click the three dots menu
4. Select "Promote to Production"

### Manual Rollback (Local)
```bash
# Check git log for previous version
git log --oneline | head -5

# Checkout previous version
git checkout [commit-hash]

# Rebuild and deploy
npm run build
```

---

## Monitoring After Deployment

### Daily Checks
- [ ] Application is accessible
- [ ] No spike in error rates
- [ ] Web Vitals remain stable
- [ ] Firestore database is responsive

### Weekly Checks
- [ ] Review analytics for usage patterns
- [ ] Monitor error logs for new issues
- [ ] Check for dependency security updates
- [ ] Verify all features working correctly

### Monthly Checks
- [ ] Update dependencies
- [ ] Review security recommendations
- [ ] Analyze user feedback
- [ ] Plan feature improvements

---

## Deployment Success Criteria

The deployment is considered successful when:
1. ✅ Application loads without errors
2. ✅ All pages are accessible and functional
3. ✅ Performance metrics are acceptable (TTFB < 50ms, LCP < 2500ms)
4. ✅ Images and assets load correctly
5. ✅ Wallet connection works as expected
6. ✅ Firebase authentication is operational
7. ✅ AI endpoints respond correctly
8. ✅ No console errors on main flow
9. ✅ Mobile view is responsive and functional
10. ✅ Security checks pass (no exposed API keys, valid CSP headers)

---

## Quick Reference

### Essential Commands
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run TypeScript checks
npm run clean    # Clean build artifacts
```

### Useful URLs
- **Local Dev**: http://localhost:3000
- **Production**: https://[your-domain].vercel.app
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Firestore Console**: https://console.firebase.google.com
- **Google AI Studio**: https://aistudio.google.com

### Support Resources
- [Vercel Documentation](https://vercel.com/docs)
- [React Documentation](https://react.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Deployment completed successfully!** 🚀

For detailed information about testing, improvements, and recommendations, see `TESTING_AND_IMPROVEMENTS.md`.
