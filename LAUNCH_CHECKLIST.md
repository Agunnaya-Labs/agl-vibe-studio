# Launch Checklist - Agunnaya Labs Studio

## Pre-Launch (Complete 24 hours before)

### Code Quality
- [ ] Run `npm run lint` → No TypeScript errors
- [ ] Run `npm test -- --run` → All 25 tests passing
- [ ] Run `npm run build` → Build succeeds (no critical warnings)
- [ ] Review `dist/` output (17MB total, 400KB gzipped)

### PWA Configuration
- [ ] Verify `public/manifest.json` exists and is valid JSON
- [ ] Check manifest icons: `/images/brand/agunnaya-logo.png`
- [ ] Verify `public/sw.js` exists (Service Worker)
- [ ] Confirm Service Worker registered in `index.html`
- [ ] Test locally: `npm run start` → Install prompt appears

### Web App Testing
- [ ] Desktop (1920x1080) - All pages render
- [ ] Tablet (768x1024) - Responsive design works
- [ ] Mobile (375x667) - Touch-friendly, readable
- [ ] Dark mode - Properly displayed
- [ ] Images - All 12 brand assets load correctly
- [ ] Links - All navigation working
- [ ] Forms - Input validation works
- [ ] Error states - Error boundaries trigger correctly

### Security & Performance
- [ ] HTTPS enforced in `vercel.json`
- [ ] Security headers configured (CSP, X-Frame-Options)
- [ ] Environment variables documented
- [ ] API keys not committed to git
- [ ] Sensitive data in `.env` files only
- [ ] Lighthouse score > 90 on desktop
- [ ] No console errors in DevTools

### Browser Compatibility
- [ ] Chrome/Chromium - Full functionality
- [ ] Firefox - All features work
- [ ] Safari - Mobile & desktop
- [ ] Edge - Extension loading works
- [ ] Mobile browsers - Responsive & fast

---

## Deployment Phase (Day of Launch)

### 1. Prepare Environment (1 hour before)

```bash
# Clean build
npm run clean
npm run build

# Verify no errors
npm run lint
npm test -- --run

# Check production bundle
ls -lh dist/
# Should see: dist/, dist/server.cjs, dist/index.html, dist/assets/
```

- [ ] Build successful
- [ ] No TypeScript errors
- [ ] All tests passing
- [ ] Production bundle created

### 2. Set Vercel Environment Variables (30 min before)

1. Go to Vercel Dashboard
2. Project → Settings → Environment Variables
3. Add:

```
GOOGLE_AI_KEY=sk_[your_key]
FIREBASE_CONFIG={"projectId":"..."}
```

- [ ] Environment variables set
- [ ] Variables are secrets (not exposed)
- [ ] Correct values pasted (not dev keys)

### 3. Configure Custom Domain (30 min before)

1. Vercel Dashboard → Domains
2. Add: `aistudio.agunnayalabs.xyz`
3. Verify DNS:

```bash
# Option A: Vercel nameservers (easiest)
# Update DNS provider to use Vercel NS

# Option B: CNAME record
# aistudio.agunnayalabs.xyz CNAME cname.vercel.com

# Verify
nslookup aistudio.agunnayalabs.xyz
```

- [ ] Domain added to Vercel
- [ ] DNS configured
- [ ] SSL certificate provisioned (automatic)

### 4. Deploy Application (Deployment time)

#### Option A: Vercel CLI
```bash
vercel --prod --name aistudio
```

#### Option B: Git Push (if auto-deploy configured)
```bash
git add .
git commit -m "Production deployment"
git push origin main
```

- [ ] Deployment initiated
- [ ] Vercel shows "Ready"
- [ ] No deployment errors in logs

### 5. Verify Deployment (5-10 minutes after)

```bash
# Check if live
curl -I https://aistudio.agunnayalabs.xyz
# Should see HTTP 200

# Check manifest
curl https://aistudio.agunnayalabs.xyz/manifest.json
# Should see valid JSON

# Check service worker
curl -I https://aistudio.agunnayalabs.xyz/sw.js
# Should see "Service-Worker-Allowed: /"
```

- [ ] Website loads
- [ ] Manifest is accessible
- [ ] Service Worker registered
- [ ] No 404 errors
- [ ] HTTPS working

### 6. Test PWA Installation (5 min)

1. Open `https://aistudio.agunnayalabs.xyz` in Chrome
2. Click install icon in address bar
3. Follow prompts
4. Check if app icon appears on home screen

**Desktop:**
- [ ] Install prompt appears
- [ ] App installs successfully
- [ ] App opens in standalone mode
- [ ] Offline mode works

**Mobile (Android Chrome):**
- [ ] Menu → "Install app" option visible
- [ ] App installs to home screen
- [ ] Native app experience works

**Mobile (iOS Safari):**
- [ ] Share → "Add to Home Screen"
- [ ] App name: "Agunnaya Studio"
- [ ] App launches in fullscreen mode

### 7. Test Core Features (10 min)

1. **Navigation**
   - [ ] Click sidebar items
   - [ ] All pages load
   - [ ] Mobile menu works

2. **AI Contract Builder**
   - [ ] Form inputs respond
   - [ ] Validation works
   - [ ] Submit button functional

3. **Explore**
   - [ ] Token data displays
   - [ ] Search/filter works

4. **NFT Studio**
   - [ ] Collection form loads
   - [ ] Upload mock works

5. **Offline**
   - [ ] Open DevTools → Network → Offline
   - [ ] App still accessible
   - [ ] Cached pages load

### 8. Test Extension (5 min)

1. Go to `chrome://extensions/`
2. Enable Developer Mode
3. Load unpacked: `/public/extension/`
4. Click extension icon
5. Test buttons (Open, Create Contract, etc.)

- [ ] Extension loads without errors
- [ ] Popup displays correctly
- [ ] Buttons navigate to correct tabs
- [ ] No console errors

---

## Post-Launch (First 24 hours)

### Monitoring (Check hourly)

- [ ] Check Vercel Analytics
- [ ] Monitor error logs: `vercel logs`
- [ ] Monitor uptime (99.9%+ target)
- [ ] Check API performance
- [ ] Review user feedback

### Bug Fixes

- [ ] Address any critical bugs immediately
- [ ] Document issues found
- [ ] Deploy fixes: `git push origin main`

### Social/Announcement

- [ ] Post launch announcement
- [ ] Share on Twitter/X
- [ ] Share in Discord
- [ ] Email users/newsletter
- [ ] Update website links

---

## Week 1 Post-Launch

### Analytics Review

- [ ] Google Analytics configured
- [ ] Track page views
- [ ] Monitor user flow
- [ ] Review bounce rate
- [ ] Check feature usage

### User Feedback

- [ ] Gather feedback
- [ ] Address top issues
- [ ] Prioritize improvements
- [ ] Plan next release

### Extension Submission

- [ ] Create Chrome Web Store account
- [ ] Package extension as ZIP
- [ ] Prepare store listing with:
     - [ ] Description (100+ characters)
     - [ ] Detailed description (100-4000 characters)
     - [ ] Screenshots (1280x800, minimum 2)
     - [ ] Icon (128x128 PNG)
     - [ ] Category (Productivity)
- [ ] Submit for review
- [ ] Status: "Pending review" (1-3 days)

---

## Month 1 Post-Launch

### Performance Optimization

- [ ] Analyze Core Web Vitals
- [ ] Optimize if LCP > 2.5s
- [ ] Optimize if CLS > 0.1
- [ ] Reduce JavaScript payload if needed

### Mobile App Planning

- [ ] Decide iOS vs Android priority
- [ ] Set up developer accounts
- [ ] Follow `MOBILE_APP_SETUP.md`
- [ ] Create TestFlight beta

### Feature Roadmap

- [ ] Review feature requests
- [ ] Plan next release
- [ ] Document decisions
- [ ] Set sprint schedule

---

## Launch Verification Checklist (Final)

### Critical (Must Pass)
- [ ] Production build compiles
- [ ] All tests passing
- [ ] Website loads at https://aistudio.agunnayalabs.xyz
- [ ] HTTPS/SSL working
- [ ] No console errors
- [ ] Manifest accessible
- [ ] Service Worker registered
- [ ] Images loading

### Important (Should Pass)
- [ ] PWA installable
- [ ] Mobile responsive
- [ ] Extension loads locally
- [ ] All pages accessible
- [ ] Form inputs work
- [ ] Offline mode works

### Nice to Have (Can Pass Later)
- [ ] Lighthouse > 90
- [ ] Analytics configured
- [ ] Chrome Web Store listed
- [ ] Mobile apps submitted
- [ ] All edge cases handled

---

## Rollback Plan (If Issues)

If critical issues found:

```bash
# Revert to previous version
vercel --rollback

# Or redeploy from git
git revert HEAD
git push origin main
```

- [ ] Identify issue
- [ ] Document root cause
- [ ] Implement fix
- [ ] Redeploy
- [ ] Verify fix
- [ ] Post-mortem

---

## Success Criteria

✅ App live at aistudio.agunnayalabs.xyz  
✅ PWA installable on all devices  
✅ Extension loading locally  
✅ All tests passing  
✅ Zero critical bugs  
✅ <2s load time  
✅ Users can create projects  

---

## Quick Reference - Common Issues

### Issue: Website not loading
```bash
vercel logs                  # Check logs
vercel --prod                # Redeploy
```

### Issue: PWA not installing
```
Clear browser cache → Hard refresh (Cmd+Shift+R)
Check manifest.json MIME type
Verify HTTPS is enabled
```

### Issue: Extension not loading
```
Check manifest.json syntax (JSONLint)
Verify file paths in manifest
Reload extension in chrome://extensions/
```

### Issue: Images not loading
```
Check public/images/ folder
Verify image paths in code
Use asset manager helpers
Test locally first
```

---

## Launch Day Timeline

| Time | Task | Duration |
|------|------|----------|
| T-60m | Final build & test | 15 min |
| T-45m | Set environment variables | 10 min |
| T-35m | Configure domain | 15 min |
| T-20m | Deploy to Vercel | 5 min |
| T-15m | Verify deployment | 10 min |
| T-5m | Final checks | 5 min |
| T+0m | LAUNCH 🚀 | - |
| T+5m | Test PWA | 10 min |
| T+15m | Test extension | 5 min |
| T+20m | Announce on social | 10 min |
| T+30m | Monitor systems | Ongoing |

---

## Emergency Contacts

- Vercel Support: https://vercel.com/help
- GitHub: Create issue in repository
- Documentation: See guides in project root

---

## Sign-Off

- [ ] Developer: Code ready & tested
- [ ] QA: All tests passing
- [ ] Devops: Infrastructure configured
- [ ] Manager: Launch approved
- [ ] Marketing: Announcement prepared

---

**Status**: READY FOR LAUNCH ✅  
**Generated**: June 29, 2026  
**Launch Command**: `vercel --prod`

**LET'S GO LIVE! 🚀**
