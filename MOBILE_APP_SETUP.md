# Mobile App Setup Guide - iOS & Android

## Overview

Convert your Agunnaya Labs Studio web app into native iOS and Android apps using Capacitor.

---

## Prerequisites

### For iOS
- Mac with macOS 12+
- Xcode 14+
- Apple Developer Account ($99/year)
- iOS device or simulator

### For Android
- Android Studio
- JDK 11+
- Google Play Developer Account ($25 one-time)
- Android device or emulator

### Both
- Node.js 16+
- npm or yarn

---

## Step 1: Install Capacitor

```bash
cd /vercel/share/v0-project

# Install Capacitor
npm install --save @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android

# Initialize Capacitor project
npx cap init

# When prompted:
# App name: Agunnaya Labs Studio
# App Package ID: com.agunnayalabs.studio
# Web assets folder: dist
# Api endpoint: https://aistudio.agunnayalabs.xyz
```

### Update package.json scripts

```json
{
  "scripts": {
    "build": "vite build && esbuild server.ts ...",
    "build:mobile": "npm run build && npx cap sync",
    "ios": "npm run build:mobile && npx cap open ios",
    "android": "npm run build:mobile && npx cap open android",
    "cap:sync": "npx cap sync",
    "cap:copy": "npx cap copy"
  }
}
```

---

## Step 2: Add iOS Platform

```bash
# Add iOS platform
npx cap add ios

# This creates ios/ folder with native Xcode project
```

### iOS Configuration (capacitor.config.json)

```json
{
  "appId": "com.agunnayalabs.studio",
  "appName": "Agunnaya Labs Studio",
  "webDir": "dist",
  "plugins": {
    "SplashScreen": {
      "launchAutoHide": false,
      "launchShowDuration": 2000,
      "backgroundColor": "#050505",
      "showSpinner": false,
      "spinnerColor": "#0052FF"
    },
    "StatusBar": {
      "style": "dark",
      "backgroundColor": "#050505"
    },
    "PushNotifications": {},
    "LocalNotifications": {}
  },
  "server": {
    "url": "https://aistudio.agunnayalabs.xyz",
    "cleartext": false
  }
}
```

### Build iOS App

```bash
# Sync and open Xcode
npm run ios

# In Xcode:
# 1. Select target: "Agunnaya Labs Studio"
# 2. Build for iOS: Cmd + B
# 3. Test on simulator: Cmd + R
```

### Submit to App Store

1. **Generate Certificates**
   ```bash
   # In Xcode: Signing & Capabilities
   # Select team and let Xcode auto-generate
   ```

2. **Archive App**
   - Xcode → Product → Build For → iOS Device
   - Xcode → Product → Archive

3. **Upload to App Store Connect**
   - Click "Distribute App"
   - Select "App Store Connect"
   - Choose "Upload"
   - Follow steps

4. **App Store Review**
   - Fill out app metadata (1-2 hours)
   - Screenshots (required)
   - Privacy policy
   - Submit for review (1-3 days)

---

## Step 3: Add Android Platform

```bash
# Add Android platform
npx cap add android

# This creates android/ folder with gradle project
```

### Android Configuration

```json
{
  "plugins": {
    "PushNotifications": {
      "senderId": "YOUR_FCM_SENDER_ID"
    }
  }
}
```

### Build Android App

```bash
# Sync and open Android Studio
npm run android

# In Android Studio:
# 1. Build → Build Bundle(s) / APK(s) → Build APK(s)
# 2. Test on emulator or device
```

### Generate Signing Key

```bash
# Create keystore for app signing
keytool -genkey -v -keystore agunnaya-studio.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias agunnaya-studio

# This creates agunnaya-studio.keystore file
# Store safely - you'll need it for updates!
```

### Build Release APK

```bash
cd android

# Update gradle.properties with keystore info
# Or use Android Studio GUI:
# Build → Generate Signed Bundle / APK

# Creates: app/release/app-release.aab (recommended)
```

### Submit to Google Play

1. **Create Google Play Account**
   - Go to Google Play Console
   - Create new app
   - Fill out store listing

2. **Upload App Bundle**
   - Upload AAB file to Google Play
   - Add screenshots (2-8 required)
   - Add app description
   - Set content rating
   - Add privacy policy

3. **Review and Release**
   - Google reviews (typically 1-2 hours)
   - Click "Release to Production"
   - App goes live in 24-48 hours

---

## Step 4: Native Plugins

### Install Useful Plugins

```bash
# Camera for NFT creation
npm install @capacitor/camera
npx cap sync

# File system for uploads
npm install @capacitor/filesystem
npx cap sync

# Web browser (for wallet connection)
npm install @capacitor/browser
npx cap sync

# Share functionality
npm install @capacitor/share
npx cap sync

# Biometric authentication
npm install @capacitor/biometric
npx cap sync
```

### Use Plugins in React

```tsx
import { Camera, CameraResultType } from '@capacitor/camera';
import { Browser } from '@capacitor/browser';
import { Share } from '@capacitor/share';

// Take photo
const takePhoto = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri
  });
  // Use image.webPath
};

// Open browser for wallet
const connectWallet = async () => {
  await Browser.open({ url: 'https://wallet.metaMask.io' });
};

// Share content
const shareProject = async () => {
  await Share.share({
    title: 'Check out my NFT collection',
    text: 'Created with Agunnaya Labs Studio',
    url: 'https://aistudio.agunnayalabs.xyz'
  });
};
```

---

## Step 5: PWA vs Native

| Feature | PWA | Native App |
|---------|-----|-----------|
| Installation | Easy (add to home) | App store submission |
| Offline | Yes (Service Worker) | Yes (native) |
| Performance | Fast | Very fast |
| Push notifications | Limited | Full support |
| Camera | Yes (limited) | Full access |
| Storage | 50MB+ | Unlimited |
| App store presence | No | Yes |
| Update frequency | Instant | Daily to weekly |

**Recommendation**: Start with PWA (already setup), launch native apps later.

---

## Step 6: Mobile App Marketing

### App Store Optimization (ASO)

**iOS App Store:**
- Title: "Agunnaya Labs Studio - Web3 Creator"
- Subtitle: "Create smart contracts & tokens"
- Keywords: "web3, blockchain, smart contracts, base, dao, gamefi"
- Category: Productivity or Finance

**Google Play Store:**
- Title: "Agunnaya Labs Studio: Web3 Creator"
- Subtitle: "Build contracts, DAOs & tokens"
- Short description (80 chars): "AI-powered Web3 creation on Base mainnet"

### Screenshots

Create screenshots showing:
1. Dashboard overview
2. AI Contract Builder
3. NFT creation
4. Token launch
5. DAO creation

### Ratings & Reviews

- Target 4.5+ stars
- Respond to all reviews
- Fix reported issues quickly

---

## Step 7: Continuous Integration

### GitHub Actions for Mobile Builds

```yaml
# .github/workflows/mobile-build.yml
name: Mobile Build

on: [push]

jobs:
  build:
    runs-on: macos-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm install
      
      - name: Build web
        run: npm run build
      
      - name: Sync Capacitor
        run: npx cap sync
      
      - name: Build iOS
        run: |
          cd ios
          xcodebuild -scheme "Agunnaya Labs Studio" -configuration Debug
      
      - name: Build Android
        run: |
          cd android
          ./gradlew build
```

---

## Step 8: Testing Checklist

### Before iOS Release

- [ ] Test on iPhone 12, 13, 14 (multiple sizes)
- [ ] Test on iOS 15, 16, 17
- [ ] Test WiFi and cellular network
- [ ] Test offline mode
- [ ] Test wallet connection
- [ ] Test push notifications
- [ ] Check app permissions
- [ ] Run with Instruments for memory leaks

### Before Android Release

- [ ] Test on Android 10, 11, 12, 13
- [ ] Test on phones and tablets
- [ ] Test WiFi and mobile data
- [ ] Test offline mode
- [ ] Test permissions (camera, files)
- [ ] Test on small, medium, large screens
- [ ] Check battery usage
- [ ] Run with Android Profiler

---

## Step 9: App Updates

### Automatic Updates

Capacitor can auto-update your app's web content:

```json
{
  "plugins": {
    "CapacitorUpdater": {
      "autoUpdate": true,
      "reset": false
    }
  }
}
```

Or implement manual updates:

```tsx
import { CapacitorUpdater } from '@capacitor-updater/capacitor-updater';

const checkForUpdates = async () => {
  const result = await CapacitorUpdater.download({
    url: 'https://aistudio.agunnayalabs.xyz/app-update.zip'
  });
  
  if (result.success) {
    await CapacitorUpdater.set(result.id);
    window.location.reload();
  }
};
```

---

## Step 10: Distribution Timeline

### Week 1
- [ ] iOS TestFlight beta (internal testers)
- [ ] Android beta on Google Play Console

### Week 2-3
- [ ] Gather feedback
- [ ] Fix issues
- [ ] Expand beta to 10k testers

### Week 4
- [ ] Final testing
- [ ] Submit iOS for App Store review
- [ ] Release Android beta publicly

### Week 5-6
- [ ] iOS app review (1-3 days)
- [ ] iOS launch
- [ ] Android production release

---

## Quick Commands Reference

```bash
# Setup
npx cap init
npx cap add ios
npx cap add android

# Development
npm run build:mobile
npm run ios              # Open iOS in Xcode
npm run android          # Open Android in Android Studio

# Sync changes
npx cap sync            # Sync web content
npx cap copy            # Copy only web assets

# Build for release
# iOS: Xcode → Product → Archive
# Android: Android Studio → Build → Generate Signed Bundle

# Clean
npx cap sync --fresh
rm -rf ios android node_modules
npm install
```

---

## Support & Resources

- Capacitor Docs: https://capacitorjs.com
- iOS Dev: https://developer.apple.com
- Android Dev: https://developer.android.com
- App Store Connect: https://appstoreconnect.apple.com
- Google Play Console: https://play.google.com/console

---

## Success Criteria

✅ PWA installed on home screen  
✅ iOS app in TestFlight  
✅ Android app in Google Play beta  
✅ Both apps work offline  
✅ Wallet integration works  
✅ Push notifications received  
✅ App store listing complete  

---

**Next Step**: Run `npm install @capacitor/core @capacitor/cli` to begin
