# PIR8 Mobile - Build & Submission Guide

## Quick Start

### Prerequisites

1. **Node.js** >= 18.x
2. **Expo CLI**: `npm install -g expo-cli`
3. **EAS CLI**: `npm install -g eas-cli`
4. **Expo Account**: Sign up at https://expo.dev

### Initial Setup

```bash
# Navigate to mobile package
cd packages/mobile

# Install dependencies
npm install

# Login to Expo (create account if needed)
eas login

# Configure EAS project (first time only)
eas build:configure
```

## Building for Hackathon

### Option 1: Development APK (Recommended for Testing)

Build a debug APK for testing on physical devices:

```bash
cd packages/mobile
eas build --profile development --platform android
```

**What this does:**
- Creates a debug APK with development client
- Includes all debugging tools
- Can be installed directly on Android devices
- Build time: ~15-20 minutes

### Option 2: Preview APK (Submission Ready)

Build a release APK optimized for distribution:

```bash
cd packages/mobile
eas build --profile preview --platform android
```

**What this does:**
- Creates a release-signed APK
- Optimized for performance
- No development client included
- Smaller file size
- Build time: ~20-25 minutes

### Option 3: Local Build (Advanced)

Build locally using your own machine (requires Android Studio):

```bash
cd packages/mobile
eas build --profile preview --platform android --local
```

**Requirements:**
- Android Studio installed
- Android SDK 34+
- Java JDK 17
- At least 10GB free disk space

## Installing the APK

### On Physical Device

1. **Download APK** from Expo build URL (sent via email)
2. **Enable Unknown Sources** on Android device:
   - Settings → Security → Unknown Sources (enable)
3. **Install APK**:
   - Downloaded files → Tap APK → Install
4. **Launch PIR8 Battle Arena**

### On Emulator

```bash
# Download the APK
curl -o pir8.apk <BUILD_URL>

# Install on running emulator
adb install pir8.apk

# Launch app
adb shell am start -n com.pir8.battlearena/.MainActivity
```

## Testing Checklist

Before submission, test the following:

### Core Gameplay
- [ ] Ships can be selected
- [ ] Ships can move to adjacent cells
- [ ] Combat system works correctly
- [ ] Territory control displays properly
- [ ] Resource collection functions
- [ ] Turn system operates smoothly

### UX Features
- [ ] Tutorial shows on first launch
- [ ] Contextual hints appear appropriately
- [ ] Victory celebration triggers on win
- [ ] Haptic feedback feels responsive
- [ ] Sound effects play correctly (if assets added)

### Solana Integration
- [ ] Wallet adapter connects properly
- [ ] Transactions sign correctly
- [ ] Devnet interactions work

### Performance
- [ ] App runs at 60fps
- [ ] No memory leaks after extended play
- [ ] Animations are smooth
- [ ] No crashes during gameplay

## Hackathon Submission

### Required Materials

1. **APK File**: Download from EAS build
2. **Demo Video** (2-3 minutes):
   - Show gameplay mechanics
   - Highlight territory control
   - Demonstrate tutorial flow
   - Show victory celebration
   - Mention Solana integration

3. **Written Description**:
```
PIR8 Battle Arena - Strategic Turn-Based Tactics

A pirate-themed strategy game where players command fleets, 
control territories, and battle for dominance on the high seas.

Features:
- 🏴‍☠️ Territory Control System
- ⚔️ Turn-Based Naval Combat  
- 🎓 Interactive First-Time Tutorial
- 💡 Contextual In-Game Hints
- 🏆 Victory Celebrations
- 📱 Native Android Experience
- ⚡ Speed Bonus Mechanics
- 💰 Resource Management

Built with:
- React Native + Expo SDK 51
- Solana Mobile Stack (SKR)
- React Native Reanimated
- Turbo-repo Monorepo Architecture

Controls:
- Tap ships to select
- Tap adjacent cells to move
- Tap enemies to attack
- Collect resources from controlled territories
- End turn when ready

Optimized for Android devices with native 60fps performance.
```

4. **Screenshots** (Optional but recommended):
   - Main game board with territory overlay
   - Tutorial screen
   - Victory celebration
   - Ship selection UI

### Submission Links

- **Monolith Hackathon**: [Submit Here](https://devpost.com/software/[your-project])
- **Build Date**: $(date)
- **Version**: 1.0.0
- **Package**: com.pir8.battlearena

## Troubleshooting

### Build Fails with "Credentials Error"

```bash
# Clear credentials cache
rm -rf ~/.expo/credentials.json

# Re-login
eas login

# Rebuild
eas build --profile preview --platform android
```

### APK Won't Install

1. Check Android version (requires Android 7.0+)
2. Enable"Unknown Sources" in settings
3. Try development profile instead of preview

### App Crashes on Launch

```bash
# Check logs
adb logcat | grep -i "pir8\|expo\|react"

# Common fixes:
# 1. Clear app data
adb shell pm clear com.pir8.battlearena

# 2. Reinstall
adb uninstall com.pir8.battlearena
eas build --profile development --platform android
```

### Wallet Adapter Not Working

1. Ensure Phantom/Solflare is installed on device
2. Check cluster setting (devnet vs mainnet)
3. Verify app.json has correct Solana plugin config

## Next Steps After Hackathon

### Production Deployment

For Google Play Store deployment:

```bash
# Build AAB (Android App Bundle)
eas build --profile production --platform android

# Submit to Play Store
eas submit --platform android --latest
```

### Future Enhancements

1. Add actual sound effect assets to `/assets/sounds/`
2. Implement multiplayer with Solana programs
3. Add leaderboards and achievements
4. Create additional ship types and abilities
5. Design more maps and game modes

## Support

- **Expo Docs**: https://docs.expo.dev
- **EAS Build**: https://docs.expo.dev/eas
- **Solana Mobile**: https://solanamobile.com/developers
- **React Native**: https://reactnative.dev

---

**Build Command Summary:**

```bash
# Development (Testing)
eas build --profile development --platform android

# Preview (Hackathon Submission)
eas build --profile preview --platform android

# Production (Play Store)
eas build --profile production --platform android

# Local Build (Requires Android Studio)
eas build --profile preview --platform android --local
```

Good luck with the hackathon! 🏴‍☠️⚓
