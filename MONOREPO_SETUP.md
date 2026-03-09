# PIR8 Monorepo Setup Guide 🏗️

## Overview

PIR8 now uses a **monorepo architecture** to support both web (Next.js) and mobile (Expo) platforms while sharing core game logic.

```
pir8/
├── packages/
│   ├── core/           # Shared game logic (TypeScript)
│   ├── web/            # Next.js app (existing, will be moved)
│   └── mobile/         # Expo app (NEW for hackathon)
├── turbo.json          # Turborepo config
└── package.json        # Workspace root
```

## Quick Start

### 1. Install Dependencies

```bash
# From repository root
npm install
```

This installs all dependencies for all packages via npm workspaces.

### 2. Development Commands

```bash
# Run everything in dev mode
npm run dev

# Build everything
npm run build

# Type check everything
npm run type-check

# Run tests
npm run test
```

### 3. Package-Specific Commands

```bash
# Core package
cd packages/core
npm run build      # TypeScript compilation
npm run test       # Run unit tests

# Mobile package (Expo)
cd packages/mobile
npm start          # Start Expo dev server
npm run android    # Run on Android device/emulator
npm run build      # Build APK via EAS
```

## Architecture

### @pir8/core

**Purpose**: Framework-agnostic game logic shared across platforms.

**Exports**:
- Game engine (`PirateGameManager`)
- Types & interfaces (`GameState`, `Ship`, etc.)
- Utilities (haptics, time formatting, constants)
- Territory bonus calculations

**Usage**:
```typescript
import { 
  PirateGameManager, 
  calculateSpeedBonus,
  GameState 
} from '@pir8/core';

// Works in BOTH React (web) and React Native (mobile)
const bonus = calculateSpeedBonus(5000); // Returns 50
```

### @pir8/web (TODO: Migrate existing app)

**Purpose**: Next.js PWA for web browsers.

**Current Status**: Lives in root `src/` directory, will be moved to `packages/web/`.

### @pir8/mobile

**Purpose**: Native Android app for Solana Mobile Hackathon.

**Tech Stack**:
- Expo SDK 51
- React Native 0.74
- Solana Mobile Wallet Adapter
- Expo Haptics (native feedback)
- Expo Router (file-based routing)

**Key Features**:
- Native haptic feedback
- Territory conquest visualization (RN version)
- Onboarding tutorial flow
- Victory celebrations
- APK generation for hackathon submission

## Migration Plan

### Phase 1: Core Extraction ✅ COMPLETE

- [x] Create `packages/core/` structure
- [x] Move game logic, types,utilities
- [x] Set up Turborepo
- [x] Create exports index

### Phase 2: Expo App Creation ✅ COMPLETE

- [x] Initialize Expo project
- [x] Configure Solana Mobile Stack
- [x] Create basic screens (home, game)
- [x] Integrate with `@pir8/core`

### Phase 3: Feature Parity (IN PROGRESS)

- [ ] Port Tier 2 features to mobile:
  - Tutorial component(RN version)
  - Contextual hints system
  - Confetti celebration (RN Reanimated)
  
- [ ] Port Tier 3 features to mobile:
  - Territory conquest overlay (RN View styling)
  - Income indicators
  - Contested territory animations

### Phase 4: Web App Migration (TODO)

- [ ] Move current `src/` to `packages/web/src/`
- [ ] Update imports to use `@pir8/core`
- [ ] Configure Turborepo for web package
- [ ] Test that web app still builds

### Phase 5: APK Build & Submission (TODO)

- [ ] Configure EAS Build
- [ ] Generate signing keys
- [ ] Build production APK
- [ ] Test on Saga/Seeker device
- [ ] Submit to Monolith hackathon

## Benefits of This Approach

✅ **Code Sharing**: 60-70% of code shared between platforms
✅ **Single Source of Truth**: Game logic in one place
✅ **Platform Optimization**: Each UI layer optimized for its platform
✅ **Hackathon Ready**: Native APK meets all requirements
✅ **Future-Proof**: Easy to add more platforms (iOS, desktop)

## Troubleshooting

### Import Errors

If you see "Cannot find module '@pir8/core'":

```bash
# From monorepo root
npm install
npm run build
```

### TypeScript Errors

Make sure all packages are type-checked:

```bash
npm run type-check
```

### Expo Not Starting

```bash
cd packages/mobile
npx expo start -c  # Clear cache
```

## Next Steps

1. **Install dependencies**: `npm install`
2. **Test core package**: `cd packages/core && npm run build`
3. **Start Expo**: `cd packages/mobile && npm start`
4. **Port remaining features** from web to mobile
5. **Build APK** for hackathon submission

---

🤖 Generated with [Qoder][https://qoder.com]
