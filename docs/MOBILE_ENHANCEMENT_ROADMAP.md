# 🏴‍☠️ PIR8 - Mobile Enhancement Roadmap

**Strategic Plan for Scalable, Maintainable Mobile Excellence**

Following Core Principles:
- **ENHANCEMENT FIRST**: Enhance existing components over creating new ones
- **CONSOLIDATION**: Delete unnecessary code rather than deprecating
- **PREVENT BLOAT**: Systematic audit before adding features
- **DRY**: Single source of truth for shared logic
- **CLEAN**: Clear separation of concerns
- **MODULAR**: Composable, testable, independent modules
- **PERFORMANT**: Adaptive loading, caching, resource optimization
- **ORGANIZED**: Predictable file structure with domain-driven design

---

## 📊 Current State Assessment

### ✅ What's Working Well

1. **Mobile Infrastructure** (70% Complete)
   - `useMobileOptimized` hook with touch gestures
   - `MobileGameContainer` component
   - Responsive design in `GameContainer`
   - Touch handlers in `PirateMap`

2. **Code Quality** (Good Foundation)
   - TypeScript throughout
   - Component modularity
   - Separation of concerns mostly clean

### ⚠️ Issues Identified (Bloat & Duplication)

#### 1. **DUPLICATED Haptic Feedback** ❌ VIOLATES DRY
```typescript
// Found in GameContainer.tsx:18-33
const haptic = {
  light: () => navigator.vibrate(10),
  medium: () => navigator.vibrate(25),
  heavy: () => navigator.vibrate([50, 30, 50])
};

// Found in useMobileOptimized.ts:50-55
const triggerHaptic = useCallback((intensity) => {
  const patterns = { light: [10], medium: [25], heavy: [50] };
  navigator.vibrate(patterns[intensity]);
}, [hapticFeedback]);

// Found in MobileGameContainer.tsx:40,95,104,112,116,132
triggerHaptic('medium'), triggerHaptic('light'), etc.
```

**Problem**: Three different haptic implementations  
**Solution**: Single source of truth in utility module

#### 2. **DUPLICATED FormatTime Function** ❌ VIOLATES DRY
```typescript
// GameContainer.tsx:244-247
const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  return `${seconds}s`;
};

// Likely duplicated in other components
```

**Problem**: Basic utility scattered across components  
**Solution**: Centralized utils/time.ts

#### 3. **MONOLITHIC GameContainer** ⚠️ 1044 lines ❌ VIOLATES CLEAN/MODULAR
```typescript
src/components/GameContainer.tsx - 1044 lines
- Handles mobile detection
- Handles keyboard shortcuts
- Handles menu state
- Renders mobile layout
- Renders desktop layout
- Contains 4 sub-components (Tooltip, PracticeTutorial, etc.)
```

**Problem**: Too many responsibilities, hard to test  
**Solution**: Extract into composable hooks and sub-components

#### 4. **INCONSISTENT Mobile Detection** ⚠️
```typescript
// useMobileOptimized.ts:30-47
const checkDevice = () => {
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isSmallScreen = window.innerWidth <= 768;
  setIsMobile(isMobileDevice || isSmallScreen);
};

// Used inconsistently across components
```

**Problem**: User-agent detection unreliable, should use feature detection  
**Solution**: Use CSS media queries + React context

#### 5. **MISSING Type Safety** ⚠️
```typescript
// MobileGameContainer.tsx:15-22
interface MobileGameContainerProps {
  isMyTurn: boolean;
  currentPlayerName: string;
  decisionTimeMs: number;
  onEndTurn: () => void;
  resources?: Resources;
  children: React.ReactNode;
}

// But GameContainer passes additional props that aren't typed
```

**Problem**: Props mismatch between mobile wrapper and desktop  
**Solution**: Unified interface with proper extension

---

## 🎯 Strategic Enhancements (Phase 1: Foundation)

### ENHANCEMENT 1: Consolidate Haptic Feedback ✅ HIGH PRIORITY

**Current**: 3 implementations, inconsistent usage  
**Target**: Single utility, type-safe, tested

#### Step 1: Create Utility Module
```typescript
// src/utils/haptics.ts
/**
 * Haptic feedback patterns for different intensities
 * Uses Navigator.vibrate API with graceful degradation
 */

export type HapticIntensity = 'light' | 'medium' | 'heavy' | 'success' | 'error';

export const HAPTIC_PATTERNS: Record<HapticIntensity, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: [50, 30, 50],
  success: [100, 50, 100],
  error: [200, 50, 200]
} as const;

/**
 * Trigger haptic feedback with intensity
 * @param intensity - Level of haptic feedback
 * @returns boolean - Whether haptic was triggered (false if unsupported)
 */
export function triggerHaptic(intensity: HapticIntensity = 'light'): boolean {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) {
    return false;
  }
  
  navigator.vibrate(HAPTIC_PATTERNS[intensity]);
  return true;
}

/**
 * Haptic feedback class for convenience
 * Can be imported and used directly in components
 */
export const Haptic = {
  light: () => triggerHaptic('light'),
  medium: () => triggerHaptic('medium'),
  heavy: () => triggerHaptic('heavy'),
  success: () => triggerHaptic('success'),
  error: () => triggerHaptic('error'),
} as const;
```

#### Step 2: Update useMobileOptimized Hook
```typescript
// src/hooks/useMobileOptimized.ts
import { triggerHaptic, HapticIntensity } from '@/utils/haptics';

export const useMobileOptimized = ({
  hapticFeedback = true,
  // ... other options
}: UseMobileOptimizedProps = {}) => {
  // CONSOLIDATED haptic feedback - uses single source of truth
  const triggerHapticFeedback = useCallback((intensity: HapticIntensity = 'light') => {
    if (!hapticFeedback) return false;
    return triggerHaptic(intensity);
  }, [hapticFeedback]);

  return {
    // ... existing returns
    triggerHaptic: triggerHapticFeedback,
  };
};
```

#### Step 3: Update GameContainer
```typescript
// src/components/GameContainer.tsx
import { Haptic } from '@/utils/haptics';

// DELETE lines 18-33 (duplicated haptic const)

// Replace all haptic.light() calls with Haptic.light()
// Replace all haptic.medium() calls with Haptic.medium()
// Replace all haptic.heavy() calls with Haptic.heavy()
```

**Benefits**:
- ✅ Single source of truth (DRY)
- ✅ Type-safe (TypeScript)
- ✅ Testable (unit tests for haptics.ts)
- ✅ Extensible (add new patterns easily)
- ✅ -40 lines of duplicated code

---

### ENHANCEMENT 2: Extract Time Utilities ✅ HIGH PRIORITY

**Current**: Duplicated formatTime functions  
**Target**: Centralized time utilities

#### Create Time Utils
```typescript
// src/utils/time.ts
/**
 * Format milliseconds to human-readable time string
 * @param ms - Milliseconds to format
 * @returns Formatted string (e.g., "5s", "1m 30s")
 */
export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return remainingSeconds > 0 
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes}m`;
}

/**
 * Format time with millisecond precision
 * @param ms - Milliseconds to format
 * @returns Formatted string (e.g., "5.234s")
 */
export function formatTimePrecise(ms: number): string {
  const seconds = ms / 1000;
  return `${seconds.toFixed(3)}s`;
}

/**
 * Check if time is within threshold
 * @param ms - Time in milliseconds
 * @param threshold - Threshold in milliseconds
 * @returns boolean
 */
export function isWithinTime(ms: number, threshold: number): boolean {
  return ms <= threshold;
}

/**
 * Speed bonus calculator based on decision time
 * @param decisionTimeMs - Time taken to make decision
 * @returns Bonus points (0-100)
 */
export function calculateSpeedBonus(decisionTimeMs: number): number {
  if (decisionTimeMs < 5000) return 100;
  if (decisionTimeMs < 10000) return 50;
  if (decisionTimeMs < 15000) return 25;
  return 0;
}
```

#### Update GameContainer
```typescript
// src/components/GameContainer.tsx
import { formatTime, calculateSpeedBonus } from '@/utils/time';

// DELETE local formatTime function (lines 244-247)

// Use imported formatTime throughout
// Use calculateSpeedBonus instead of inline logic
```

**Benefits**:
- ✅ Reusable across entire app
- ✅ Tested once, works everywhere
- ✅ Consistent formatting
- ✅ Performance bonuses in one place

---

### ENHANCEMENT 3: Split GameContainer ✅ MEDIUM PRIORITY

**Current**: 1044 lines monolithic component  
**Target**: Composable, focused components

#### Extract Mobile Layout
```typescript
// src/components/GameLayout/MobileGameLayout.tsx
import { Haptic } from '@/utils/haptics';
import { formatTime } from '@/utils/time';

interface MobileGameLayoutProps {
  // Specific props for mobile layout
  gameState: GameState;
  isMyTurn: boolean;
  currentPlayer: Player | null;
  // ... other necessary props
}

export function MobileGameLayout({
  gameState,
  isMyTurn,
  currentPlayer,
  // ... destructured props
}: MobileGameLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { classes } = useMobileOptimized();
  
  // Mobile-specific logic only
  // Render mobile HUD
  // Render mobile controls
  
  return (
    <div className={`h-screen flex flex-col ${classes.container}`}>
      {/* Mobile HUD */}
      {/* Map area */}
      {/* Bottom bar */}
      {/* Menu overlay */}
    </div>
  );
}
```

#### Extract Desktop Layout
```typescript
// src/components/GameLayout/DesktopGameLayout.tsx
interface DesktopGameLayoutProps {
  // Specific props for desktop layout
}

export function DesktopGameLayout({
  // ... props
}: DesktopGameLayoutProps) {
  // Desktop-specific logic only
  // Keyboard shortcuts
  // Multi-panel layout
  
  return (
    <div className="h-screen flex flex-col">
      {/* Top HUD */}
      {/* Main content */}
      {/* Side panels */}
      {/* Bottom bar */}
    </div>
  );
}
```

#### Refactor GameContainer
```typescript
// src/components/GameContainer.tsx
import { MobileGameLayout } from './GameLayout/MobileGameLayout';
import { DesktopGameLayout } from './GameLayout/DesktopGameLayout';
import { useMobileOptimized } from '@/hooks/useMobileOptimized';

export default function GameContainer(props: GameContainerProps) {
  const { isMobile } = useMobileOptimized();
  
  // Only orchestration logic here
  // No rendering logic
  
  if (gameState.gameStatus === 'completed') {
    return <VictoryScreen {...props} />;
  }
  
  if (gameState.gameStatus === 'active') {
    return isMobile 
      ? <MobileGameLayout {...props} />
      : <DesktopGameLayout {...props} />;
  }
  
  return <GamePlaceholder {...props} />;
}
```

**Benefits**:
- ✅ Each file <300 lines (testable)
- ✅ Single responsibility per component
- ✅ Easier to add new layouts (tablet?)
- ✅ Parallel development possible

---

### ENHANCEMENT 4: Improve Mobile Detection ✅ MEDIUM PRIORITY

**Current**: User-agent sniffing + screen size  
**Target**: Feature detection + CSS media queries

#### Create Responsive Context
```typescript
// src/contexts/ResponsiveContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ResponsiveContextValue {
  screenSize: ScreenSize;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
}

const ResponsiveContext = createContext<ResponsiveContextValue | undefined>(undefined);

export function ResponsiveProvider({ children }: { children: React.ReactNode }) {
  const [screenSize, setScreenSize] = useState<ScreenSize>('lg');
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    // Use matchMedia for responsive breakpoints (matches Tailwind)
    const updateScreenSize = () => {
      if (window.matchMedia('(min-width: 1280px)').matches) setScreenSize('xl');
      else if (window.matchMedia('(min-width: 1024px)').matches) setScreenSize('lg');
      else if (window.matchMedia('(min-width: 768px)').matches) setScreenSize('md');
      else if (window.matchMedia('(min-width: 640px)').matches) setScreenSize('sm');
      else setScreenSize('xs');
    };
    
    // Detect touch capability
    const detectTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    updateScreenSize();
    detectTouch();
    
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);
  
  const value: ResponsiveContextValue = {
    screenSize,
    isMobile: screenSize === 'xs' || screenSize === 'sm',
    isTablet: screenSize === 'md',
    isDesktop: screenSize === 'lg' || screenSize === 'xl',
    isTouch,
  };
  
  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
}

export function useResponsive() {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsive must be used within ResponsiveProvider');
  }
  return context;
}
```

#### Wrap App with Provider
```typescript
// app/layout.tsx
import { ResponsiveProvider } from '@/contexts/ResponsiveContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ResponsiveProvider>
          {children}
        </ResponsiveProvider>
      </body>
    </html>
  );
}
```

#### Update Components to Use Context
```typescript
// Any component needing responsive info
import { useResponsive } from '@/contexts/ResponsiveContext';

export default function MyComponent() {
  const { isMobile, screenSize, isTouch } = useResponsive();
  
  // Use in render logic
}
```

**Benefits**:
- ✅ Consistent breakpoints (Tailwind-aligned)
- ✅ Feature detection over UA sniffing
- ✅ Context available everywhere
- ✅ Easy to test with mock provider

---

## 🚀 Phase 2: SKR Integration (Proper Architecture)

### ENHANCEMENT 5: Add Solana Mobile Wallet Adapter

**Approach**: Clean integration without polluting existing wallet code

#### Create Mobile Wallet Module
```typescript
// src/lib/mobile/walletAdapter.ts
/**
 * Solana Mobile Wallet Adapter
 * Wraps @solana-mobile/wallet-adapter-mobile with our app identity
 */

import { createSolanaMobileWalletAdapter } from '@solana-mobile/wallet-adapter-mobile';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

const APP_IDENTITY = {
  name: 'PIR8 Battle Arena',
  uri: process.env.NEXT_PUBLIC_APP_URL || 'https://pir8.vercel.app',
  icon: '/icon-192x192.png',
};

export function createMobileWalletAdapter(network: WalletAdapterNetwork = WalletAdapterNetwork.Devnet) {
  return createSolanaMobileWalletAdapter({
    appIdentity: APP_IDENTITY,
    network,
  });
}

export { APP_IDENTITY };
```

#### Update Wallet Provider
```typescript
// src/components/SafeWalletProvider.tsx
import { createMobileWalletAdapter } from '@/lib/mobile/walletAdapter';

export function SafeWalletProvider({ children }: { children: React.ReactNode }) {
  // Detect if running in Solana dApp Store (Android)
  const isSolanaDappStore = typeof window !== 'undefined' && 
    // Detection logic for Solana dApp Store
    
  const adapter = isSolanaDappStore
    ? createMobileWalletAdapter()
    : standardWalletAdapter; // Existing adapter
    
  return (
    <WalletAdapterProvider adapter={adapter}>
      {children}
    </WalletAdapterProvider>
  );
}
```

**Benefits**:
- ✅ Clean separation of mobile vs standard
- ✅ App identity centralized
- ✅ Easy to test both paths
- ✅ No pollution of existing wallet code

---

## 📁 Proposed File Structure (After Refactoring)

```
src/
├── components/
│   ├── GameContainer.tsx (orchestrator only, ~100 lines)
│   ├── GameLayout/
│   │   ├── MobileGameLayout.tsx (~250 lines)
│   │   ├── DesktopGameLayout.tsx (~300 lines)
│   │   └── index.ts
│   ├── mobile/
│   │   ├── MobileGameContainer.tsx (deprecated, remove)
│   │   └── README.md (migration notes)
│   └── ... other components
├── hooks/
│   ├── useMobileOptimized.ts (enhanced, uses context)
│   └── ... other hooks
├── contexts/
│   ├── ResponsiveContext.tsx (NEW)
│   └── ... other contexts
├── utils/
│   ├── haptics.ts (NEW - single source of truth)
│   ├── time.ts (NEW - time utilities)
│   └── ... other utils
├── lib/
│   └── mobile/
│       ├── walletAdapter.ts (NEW)
│       └── index.ts
└── types/
    └── mobile.ts (NEW - mobile-specific types)
```

---

## 📋 Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Create `src/utils/haptics.ts`
- [ ] Update all haptic usage to import from utils
- [ ] Create `src/utils/time.ts`
- [ ] Replace all formatTime with imported utility
- [ ] Create `src/contexts/ResponsiveContext.tsx`
- [ ] Wrap app with ResponsiveProvider
- [ ] Update useMobileOptimized to use context

### Phase 2: Refactoring (Week 2)
- [ ] Extract MobileGameLayout component
- [ ] Extract DesktopGameLayout component
- [ ] Refactor GameContainer to orchestrator
- [ ] Write unit tests for extracted components
- [ ] Delete MobileGameContainer.tsx (consolidated)

### Phase 3: SKR Integration (Week 3)
- [ ] Install @solana-mobile packages
- [ ] Create mobile wallet adapter module
- [ ] Update SafeWalletProvider
- [ ] Test on Android device
- [ ] Document setup in GETTING_STARTED.md

### Phase 4: Polish (Week 4)
- [ ] Add touch gesture improvements (drag-to-move)
- [ ] Implement pinch-to-zoom on map
- [ ] Add landscape mode optimization
- [ ] Performance testing on low-end devices
- [ ] Accessibility audit (WCAG 2.1 AA)

---

## 🎯 Success Metrics

### Code Quality
- [ ] Reduce GameContainer from 1044 → <100 lines (orchestrator only)
- [ ] Delete 3+ duplicated utilities
- [ ] All utilities have unit tests (>90% coverage)
- [ ] Type safety: no `any` types in mobile code

### Performance
- [ ] Mobile Lighthouse score >90
- [ ] First Contentful Paint <1.5s on 3G
- [ ] Time to Interactive <3s on mid-range Android
- [ ] No layout shift (CLS <0.1)

### User Experience
- [ ] Touch targets ≥44px (WCAG compliant)
- [ ] 60fps animations on mobile
- [ ] Haptic feedback on all actions
- [ ] Offline support for practice mode

### Hackathon Readiness
- [ ] SKR integration working
- [ ] Tested on Saga/Seeker devices
- [ ] Demo video recorded on mobile
- [ ] Submission docs updated

---

## 💡 Design Decisions

### Why Context Over Hook for Responsive?
**Decision**: Use React Context + custom hook  
**Rationale**: 
- Avoids re-running detection logic in every component
- Consistent values across component tree
- Easier to test with mock provider
- Follows React best practices

### Why Separate Layout Components?
**Decision**: MobileGameLayout + DesktopGameLayout  
**Rationale**:
- Clear separation of concerns
- Each can evolve independently
- Easier to add tablet layout later
- Parallel development possible

### Why Utility Modules Over Class?
**Decision**: Functional utilities (haptics.ts, time.ts)  
**Rationale**:
- Tree-shakeable (unused code eliminated)
- Easier to test (pure functions)
- No instantiation overhead
- Follows modern TypeScript patterns

---

## 🔗 Related Documentation

- [GETTING_STARTED.md](./GETTING_STARTED.md) - Setup guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow
- [MOBILE_HACKATHON_READINESS.md](./MOBILE_HACKATHON_READINESS.md) - Initial assessment

---

**Last Updated**: March 9, 2026  
**Status**: Ready for Implementation  
**Priority**: High (Hackathon Preparation)
