# Agunnaya Labs Studio - Production Deployment Guide

## Overview
This guide walks through deploying the Agunnaya Labs Studio to production with Firebase as the backend.

## Prerequisites
1. Firebase project created and configured
2. Firestore database initialized
3. Firebase Authentication enabled
4. All environment variables configured

## Phase 1: Environment Setup

### 1.1 Firebase Configuration

Copy `.env.example` to `.env.production`:
```bash
cp .env.example .env.production
```

Update with your Firebase credentials from Firebase Console > Project Settings:

```env
VITE_ENV=production
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_CORS_ORIGINS=https://yourdomain.com
```

### 1.2 Firestore Security Rules

Apply these security rules to your Firestore database:

```json
{
  "rules": {
    "tokens": {
      ".read": true,
      ".write": "request.auth.uid != null && request.auth.token.isAdmin == true"
    },
    "nfts": {
      ".read": true,
      ".write": "request.auth.uid != null && request.auth.token.isAdmin == true"
    },
    "daos": {
      ".read": true,
      ".write": "request.auth.uid != null"
    },
    "gamefi": {
      ".read": true,
      ".write": "request.auth.uid != null"
    },
    "agents": {
      ".read": true,
      ".write": "request.auth.uid != null"
    },
    "activities": {
      ".read": "request.auth.uid != null",
      ".write": "request.auth.uid != null && resource == null"
    },
    "staking": {
      ".read": true,
      ".write": "request.auth.uid != null && request.auth.token.isAdmin == true"
    },
    "referrals": {
      ".read": "request.auth.uid != null",
      ".write": "request.auth.uid != null"
    }
  }
}
```

## Phase 2: Mock Data Removal

All seed data has been removed from the codebase. Data is now sourced exclusively from Firestore.

**Key Changes:**
- ✅ Removed `SEED_TOKENS`, `SEED_NFTS`, `SEED_DAOS`, `SEED_GAMEFI`, `SEED_AGENTS`, `SEED_STAKING`, `SEED_ACTIVITIES`
- ✅ Updated `AgunnayaDatabase` class to use empty defaults
- ✅ Added async methods: `fetchTokensAsync()`, `fetchNFTsAsync()`, etc.
- ✅ App now hydrates from Firestore on startup

## Phase 3: Build & Optimization

### 3.1 Build Production Bundle

```bash
npm run build
```

This will:
- Compile React components with Vite
- Bundle server with esbuild
- Generate optimized assets in `dist/` folder
- Create source maps (disabled in production for security)
- Code-split vendor dependencies

### 3.2 Verify Build Output

```bash
ls -lh dist/
```

Expected structure:
```
dist/
├── index.html          # Entry point
├── assets/
│   ├── index.*.js      # Main bundle (gzipped ~150KB)
│   ├── vendor.*.js     # React/vendor deps
│   ├── firebase-vendor.*.js  # Firebase
│   └── index.*.css     # Styles
├── server.cjs          # Node server
└── server.cjs.map      # Source map (dev only)
```

## Phase 4: Deployment

### 4.1 Docker Deployment

Create a `Dockerfile` if deploying to Docker:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist dist/
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

### 4.2 Vercel Deployment

Deploy to Vercel for serverless hosting:

```bash
vercel deploy --prod
```

### 4.3 Manual Server Deployment

Start the production server:

```bash
npm start
```

Server listens on port `3000` by default (configurable via `PORT` env var).

## Phase 5: Monitoring & Health Checks

### 5.1 Health Endpoint

Check server health:
```bash
curl http://localhost:3000/health
```

### 5.2 Error Tracking

Errors are automatically logged to console. For production monitoring, integrate:
- **Sentry**: Set `VITE_SENTRY_DSN` environment variable
- **LogRocket**: Set `VITE_LOG_ROCKET_ID` environment variable
- **Firebase Performance Monitoring**: Already integrated via Firebase SDK

### 5.3 Performance Monitoring

Monitor these metrics:
- **Largest Contentful Paint (LCP)**: Target < 2.5s
- **First Input Delay (FID)**: Target < 100ms
- **Cumulative Layout Shift (CLS)**: Target < 0.1

## Checklist

- [ ] Firebase project created and configured
- [ ] Firestore security rules applied
- [ ] All environment variables set in `.env.production`
- [ ] `npm run build` completes without errors
- [ ] Production bundle tested locally: `npm start`
- [ ] Firebase data manually seeded (optional initial data)
- [ ] SSL certificate configured (HTTPS required)
- [ ] Error reporting service connected (Sentry/LogRocket)
- [ ] Analytics configured (Google Analytics/Firebase Analytics)
- [ ] Database backups configured in Firebase Console
- [ ] Deployed to production environment
- [ ] Health check endpoint verified
- [ ] User authentication tested
- [ ] Monitored first 24 hours for errors

## Troubleshooting

### Empty Data on Startup
If the app loads but shows no tokens/NFTs/DAOs:
1. Verify Firestore contains data in the expected collections
2. Check Firestore security rules allow reads
3. Verify Firebase credentials in environment variables
4. Check browser console for Firebase authentication errors

### Build Fails
1. Ensure all dependencies installed: `npm ci`
2. Verify TypeScript compiles: `npm run lint`
3. Check Node version >= 18: `node --version`

### Server Won't Start
1. Check port not in use: `lsof -i :3000`
2. Verify environment variables loaded: `env | grep VITE_`
3. Check Firebase connection: Review Firebase SDK debug logs

## Security Checklist

- [ ] Firestore rules restrict unauthorized writes
- [ ] Firebase Auth enables only Google/Email providers
- [ ] Environment variables do not contain secrets in git
- [ ] CORS properly restricted to your domain
- [ ] HTTPS enforced (not HTTP)
- [ ] Rate limiting enabled on API routes
- [ ] User data encrypted at rest (Firebase default)
- [ ] Regular security audits scheduled
