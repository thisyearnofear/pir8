# PIR8 - Build & Deploy Guide

## Quick Commands

### 🌐 Web (Vercel)
```bash
pnpm install          # First time setup
pnpm run build        # Test build locally
git push              # Auto-deploys to Vercel
```

**Package Manager**: pnpm (required for monorepo)  
**Build Time**: ~2 minutes  
**Deploy**: Automatic on git push

---

### 📱 Mobile APK (Hackathon)

```bash
cd packages/mobile
eas build --profile preview --platform android
```

**Time**: ~20 minutes  
**Output**: Release APK for hackathon submission  
**Requirements**: Expo account (`eas login`)

---

## Setup (First Time Only)

### 1. Install pnpm
```bash
npm install -g pnpm
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Configure EAS (Mobile Only)
```bash
cd packages/mobile
eas login              # Create/login to Expo account
eas build:configure    # First time only
```

---

## Architecture Overview

```
pir8-monorepo/
├── Web App (Next.js)     → Deploys to Vercel
├── Mobile App (Expo)     → Builds to APK via EAS
└── Shared Core           → Game logic (60-70% code sharing)
```

### Key Files
- `package.json` - Root workspace config
- `tsconfig.json` - Excludes mobile from web build
- `next.config.js` - Next.js config with Turbopack
- `packages/mobile/eas.json` - EAS build profiles

---

## Troubleshooting

### Web Build Fails
```bash
# Clean and reinstall
rm -rf node_modules .next
pnpm install
pnpm run build
```

### Mobile Build Fails
```bash
# Clear EAS cache
cd packages/mobile
rm -rf node_modules
pnpm install
eas build --profile preview --platform android
```

### TypeScript Errors
- Web build excludes `packages/mobile` by design
- Mobile-specific types won't affect Vercel deployment
- Run `pnpm run type-check` for web-only validation

---

## Deployment Checklist

### Vercel (Web)
- [ ] Pushed to GitHub main branch
- [ ] Vercel project connected to repo
- [ ] Build command: `pnpm run build`
- [ ] Output directory: `.next` (auto-detected)

### EAS (Mobile APK)
- [ ] Expo account created
- [ ] EAS configured (`eas build:configure`)
- [ ] Build profile: `preview`
- [ ] Platform: Android
- [ ] Download APK from email link

---

## Testing Locally

### Web Development
```bash
pnpm run dev            # Starts Next.js dev server
# Open http://localhost:3000
```

### Mobile Development
```bash
cd packages/mobile
pnpm start             # Starts Expo dev server
# Scan QR code with Expo Go app
```

---

## Hackathon Submission

### What You Need
1. **APK File** - Built via EAS (see mobile commands above)
2. **Demo Video** - 2-3 min gameplay walkthrough
3. **Screenshots** -5+ images from game
4. **Devpost Description** - See HACKATHON_SUBMISSION.md

### Timeline
- **Build APK**: 20 min
- **Test on Device**: 15 min
- **Record Demo**: 30 min
- **Submit**: 15 min

**Total**: ~1.5 hours

---

## Support

### Documentation
- Web: `/docs` folder
- Mobile: `packages/mobile/BUILD_GUIDE.md`
- Hackathon: `HACKATHON_SUBMISSION.md`

### External Resources
- **Vercel**: https://vercel.com/docs
- **Expo/EAS**: https://docs.expo.dev/eas
- **pnpm**: https://pnpm.io/motivation

---

**Last Updated**: March 9, 2026  
**Status**: ✅ Web builds successfully | ✅ Mobile ready for APK build
