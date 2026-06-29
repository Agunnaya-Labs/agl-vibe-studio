# Agunnaya Labs Studio - Deployment & Distribution Guide

## Overview

This guide covers deploying Agunnaya Labs Studio to `https://aistudio.agunnayalabs.xyz` and distributing it as a PWA, Chrome Extension, and mobile apps.

---

## Part 1: Production Build

### Build the Application

```bash
npm run build
```

This creates:
- `dist/` - Client-side React application (optimized)
- `dist/server.cjs` - Server-side Express app

### Test Production Build Locally

```bash
npm run build
npm run start
# App runs on http://localhost:3000
```

---

## Part 2: Deploy to Vercel (aistudio.agunnayalabs.xyz)

### Prerequisites

1. Vercel account (vercel.com)
2. Domain `aistudio.agunnayalabs.xyz` configured
3. Environment variables set

### Setup Environment Variables in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these variables:

```
GOOGLE_AI_KEY=your_api_key_here
FIREBASE_CONFIG={"projectId":"...","apiKey":"..."}
```

### Deploy Command

```bash
# If using Vercel CLI
vercel --prod --name aistudio

# Or push to Git (auto-deploy with GitHub integration)
git push origin main
```

### Verify Deployment

```bash
curl -I https://aistudio.agunnayalabs.xyz
# Should see Service-Worker-Allowed header
```

---

## Part 3: PWA Distribution

### Current PWA Setup

Your app includes:
- ✅ `public/manifest.json` - PWA metadata
- ✅ `public/sw.js` - Service Worker for offline support
- ✅ Service Worker registration in `index.html`

### iOS Installation (iPhone/iPad)

1. Open `https://aistudio.agunnayalabs.xyz` in Safari
2. Tap Share button → "Add to Home Screen"
3. Choose a name and tap "Add"

### Android Installation

1. Open `https://aistudio.agunnayalabs.xyz` in Chrome
2. Tap menu (⋯) → "Install app" or "Add to Home screen"
3. Accept and tap "Install"

### Desktop Installation (Windows/Mac)

1. Open app in Chrome/Edge
2. Click install icon in address bar (looks like ⬇️ in circle)
3. Or click menu → "Install Agunnaya Labs Studio"

### PWA Features Enabled

- ✅ Offline support via Service Worker
- ✅ Installable on all devices
- ✅ Native app-like experience
- ✅ App shortcuts (Create Contract, Explore, NFTs, DAOs)
- ✅ Push notifications ready
- ✅ Share target API ready

---

## Part 4: Chrome Extension Distribution

### Location
```
/public/extension/
├── manifest.json
├── popup.html
├── popup.js
└── background.js (create next)
```

### Step 1: Create background.js

```javascript
// /public/extension/background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log('Agunnaya Labs Studio extension installed');
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-studio') {
    chrome.tabs.create({ url: 'https://aistudio.agunnayalabs.xyz' });
  }
});

chrome.tabs.onActivated.addListener((tab) => {
  console.log('Tab activated:', tab.tabId);
});
```

### Step 2: Build Extension

```bash
# Extension files are in public/extension/
# Copy dist folder if needed: cp -r dist/* public/extension/
```

### Step 3: Install Locally (Chrome DevMode)

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `/public/extension/` folder
5. Extension should appear with blue icon

### Step 4: Test Extension

- Click extension icon in toolbar
- Click "Launch" button → Opens studio
- Try keyboard shortcut: `Ctrl+Shift+A` (Windows/Linux) or `Cmd+Shift+A` (Mac)

### Step 5: Publish to Chrome Web Store

1. Create a Google Developer account ($5 one-time fee)
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Click "New item"
4. Upload extension ZIP (zip `/public/extension/`)
5. Fill out:
   - Detailed description
   - Screenshots (1280x800)
   - Icon (128x128)
   - Category (Productivity)
6. Set pricing (Free)
7. Submit for review (1-3 days)

**Store URL**: `https://chrome.google.com/webstore/detail/agunnaya-labs-studio/...`

---

## Part 5: Mobile App Distribution

### iOS App Store

#### Prerequisites
- Apple Developer Account ($99/year)
- Mac with Xcode
- iOS app signing certificate

#### Build iOS App

Use Capacitor or React Native:

```bash
# Option 1: Capacitor (recommended for web apps)
npm install @capacitor/core @capacitor/cli
npx cap init "Agunnaya Studio" com.agunnayalabs.studio
npx cap add ios
npx cap sync

# Build for iOS
npx cap open ios
# In Xcode: Product → Build and Archive
```

#### Submit to App Store

1. In Xcode: Product → Archive
2. Click Distribute App
3. Select "App Store Connect"
4. Sign in with Apple Developer account
5. Fill out app info, screenshots, privacy policy
6. Submit for review (1-3 days)

**TestFlight URL**: Share beta with testers first

---

### Google Play Store

#### Prerequisites
- Google Play Developer Account ($25 one-time)
- Android keystore for signing

#### Build Android App

```bash
# Using Capacitor
npx cap add android
npx cap sync

# Build Android release
cd android
./gradlew build --release
# APK: android/app/build/outputs/apk/release/

# Or create AAB (recommended)
./gradlew bundleRelease
# AAB: android/app/build/outputs/bundle/release/
```

#### Submit to Google Play

1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app "Agunnaya Labs Studio"
3. Fill out app details
4. Upload AAB (Android App Bundle)
5. Add screenshots, icon, privacy policy
6. Submit for review (1-2 hours to 1 day)

**Play Store URL**: `https://play.google.com/store/apps/details?id=com.agunnayalabs.studio`

---

## Part 6: Edge, Firefox, Safari Availability

### Microsoft Edge Extension

1. Build extension same as Chrome
2. Go to [Edge Add-ons Console](https://partner.microsoft.com/dashboard)
3. Create developer account
4. Submit same extension (compatible)
5. **URL**: `https://microsoftedge.microsoft.com/addons/detail/...`

### Firefox Add-on

Requires slightly different manifest:

```json
{
  "manifest_version": 3,
  "browser_specific_settings": {
    "gecko": {
      "id": "studio@agunnayalabs.xyz",
      "strict_min_version": "109.0"
    }
  }
}
```

1. Go to [Firefox Developer Hub](https://addons.mozilla.org/en-US/developers/)
2. Upload XPI file (packaged extension)
3. **URL**: `https://addons.mozilla.org/en-US/firefox/addon/agunnaya-studio/`

### Safari App Extension

- Requires macOS app wrapping (complex process)
- Alternative: Use web version directly (already supports Safari)

---

## Part 7: Complete Deployment Checklist

### Pre-Launch (1 week before)

- [ ] Build production: `npm run build`
- [ ] Test locally: `npm run start`
- [ ] Verify all images load
- [ ] Test PWA installation on all devices
- [ ] Test extension locally
- [ ] Run full test suite: `npm test`
- [ ] Type check: `npm run lint`

### Launch Day

- [ ] Deploy to Vercel: `vercel --prod`
- [ ] Verify `https://aistudio.agunnayalabs.xyz` works
- [ ] Test PWA install on deployed version
- [ ] Upload extension to Chrome Web Store
- [ ] Announce on social media
- [ ] Monitor errors via console/logs

### Post-Launch (After 1 week)

- [ ] Gather PWA installation metrics
- [ ] Monitor extension store ratings
- [ ] Plan mobile app submission
- [ ] Optimize based on user feedback
- [ ] Set up analytics tracking

---

## Part 8: Environment Variables

### Vercel Environment Variables

```bash
# .env.production
GOOGLE_AI_KEY=sk-...
FIREBASE_CONFIG={"projectId":"agunnaya-...",...}
VITE_API_URL=https://api.agunnayalabs.xyz
```

### Local Development

```bash
# .env.development.local (not committed)
GOOGLE_AI_KEY=dev_key
FIREBASE_CONFIG={"projectId":"dev-...",...}
```

---

## Part 9: Monitoring & Analytics

### Track PWA Metrics

Add to `index.html`:

```javascript
if ('web-vital' in window) {
  window.addEventListener('web-vital', (e) => {
    console.log('Web Vital:', e.detail);
    // Send to analytics
  });
}
```

### Monitor Extension Performance

```javascript
// In popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Extension message:', request);
});
```

---

## Part 10: Domain Configuration

### DNS Setup for aistudio.agunnayalabs.xyz

If using Vercel:

1. Add custom domain in Vercel Dashboard
2. Update DNS records to Vercel nameservers
3. Or add CNAME: `aistudio.agunnayalabs.xyz CNAME cname.vercel.com`

### SSL/TLS Certificate

- Vercel auto-provisions Let's Encrypt certificate ✅
- Valid for all subdomains

---

## Part 11: Quick Reference Commands

```bash
# Development
npm run dev              # Start dev server

# Production Build
npm run build            # Create optimized build
npm run start            # Run production build locally
npm run lint             # Type checking
npm test -- --run        # Run tests

# Deployment
vercel --prod            # Deploy to Vercel
git push origin main     # Auto-deploy (if configured)

# PWA Testing
# Open https://aistudio.agunnayalabs.xyz in browser
# Lighthouse audit: Chrome DevTools → Lighthouse

# Extension Testing
# Open chrome://extensions/
# Load unpacked: select /public/extension/
```

---

## Support Links

- Vercel Docs: https://vercel.com/docs
- PWA Guide: https://web.dev/progressive-web-apps/
- Chrome Extension: https://developer.chrome.com/docs/extensions/
- iOS App: https://developer.apple.com/app-store/
- Android App: https://developer.android.com/distribute

---

## Success Criteria

✅ Web: https://aistudio.agunnayalabs.xyz loads instantly  
✅ PWA: Installable on iOS, Android, Windows, Mac  
✅ Chrome Extension: Available in Chrome Web Store  
✅ Offline: Works offline with Service Worker  
✅ Performance: Lighthouse score > 90  
✅ Security: SSL/TLS, CSP headers, secure auth  

---

**Generated**: June 29, 2026  
**Next Step**: Run `npm run build` to create production build
