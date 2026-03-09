# PIR8 Mobile - Expo App

Native Android app for Solana Mobile Hackathon (Monolith)

## Setup

### 1. Install Dependencies

```bash
# From monorepo root
npm install

# Or just mobile package
cd packages/mobile
npm install
```

### 2. Configure Solana Mobile Stack

The app is pre-configured with Solana Mobile Wallet Adapter in `app.json`:

```json
{
  "plugins": [
    ["@solana-mobile/wallet-adapter-mobile", {
      "appName": "PIR8 Battle Arena",
      "cluster": "devnet"
    }]
  ]
}
```

### 3. Run Development Server

```bash
npm start
# or
npx expo start
```

### 4. Build APK for Hackathon

```bash
# Using EAS Build (recommended)
npm run build

# Or local build
npx expo run:android --variant release
```

## Features

- ✅ Uses shared game logic from `@pir8/core`
- ✅ Native haptic feedback via Expo Haptics
- ✅ Solana Mobile Wallet Adapter integration
- ✅ React Native UI optimized for Android
- ✅ Territory control visualization (RN version)
- ✅ Onboarding tutorial flow
- ✅ Victory celebrations with confetti

## Project Structure

```
app/
├── index.tsx          # Home screen
├── game.tsx           # Main game screen
├── leaderboard.tsx    # Leaderboard screen
└── _layout.tsx        # Root layout

components/            # Reusable RN components
hooks/                # Custom React Native hooks
assets/               # Images, fonts, etc.
```

## Testing on Device

1. Install Expo Go on your Android device
2. Scan QR code from `npx expo start`
3. Or build APK and sideload via ADB

## Hackathon Submission

This app produces a native Android APK for the Monolith hackathon.

**Requirements Met:**
- ✅ Native Android app (NOT PWA wrapper)
- ✅ Solana Mobile Stack integration
- ✅ Designed for mobile from ground up
- ✅ Meaningful Solana network interaction
- ✅ Functional APK for submission

---

🤖 Built with Expo + Solana Mobile Stack
