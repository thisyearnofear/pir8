/**
 * Responsive Context
 * 
 * Provides consistent responsive breakpoints and device detection across the application.
 * Uses CSS media queries (via matchMedia) aligned with Tailwind CSS breakpoints.
 * 
 * @module contexts/ResponsiveContext
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

/**
 * Screen size breakpoints aligned with Tailwind CSS
 * 
 * @see https://tailwindcss.com/docs/responsive-design
 */
export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Responsive context value interface
 */
interface ResponsiveContextValue {
  /** Current screen size category */
  screenSize: ScreenSize;
  
  /** True if screen is mobile (xs or sm) */
  isMobile: boolean;
  
  /** True if screen is tablet (md) */
  isTablet: boolean;
  
  /** True if screen is desktop (lg or xl) */
  isDesktop: boolean;
  
  /** True if device has touch capability */
  isTouch: boolean;
  
  /** True if user prefers reduced motion */
  prefersReducedMotion: boolean;
}

/**
 * Create React context for responsive values
 */
const ResponsiveContext = createContext<ResponsiveContextValue | undefined>(undefined);

/**
 * Responsive Provider Props
 */
interface ResponsiveProviderProps {
  children: React.ReactNode;
}

/**
 * Responsive Provider Component
 * 
 * Wraps the application and provides responsive context to all descendants.
 * Automatically updates when screen size or device capabilities change.
 * 
 * @example
 * // In root layout
 * <ResponsiveProvider>
 *   <App />
 * </ResponsiveProvider>
 * 
 * @example
 * // In components
 * const { isMobile, screenSize } = useResponsive();
 */
export function ResponsiveProvider({ children }: ResponsiveProviderProps) {
  const [screenSize, setScreenSize] = useState<ScreenSize>('lg');
  const [isTouch, setIsTouch] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  /**
   * Update screen size based on current window width
   * Matches Tailwind CSS breakpoints:
   * - xs: < 640px
   * - sm: >= 640px
   * - md: >= 768px
   * - lg: >= 1024px
   * - xl: >= 1280px
   */
  const updateScreenSize = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    if (window.matchMedia('(min-width: 1280px)').matches) {
      setScreenSize('xl');
    } else if (window.matchMedia('(min-width: 1024px)').matches) {
      setScreenSize('lg');
    } else if (window.matchMedia('(min-width: 768px)').matches) {
      setScreenSize('md');
    } else if (window.matchMedia('(min-width: 640px)').matches) {
      setScreenSize('sm');
    } else {
      setScreenSize('xs');
    }
  }, []);
  
  /**
   * Detect touch capability
   */
  const detectTouch = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const hasTouch = 
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0;
    
    setIsTouch(hasTouch);
  }, []);
  
  /**
   * Check for reduced motion preference
   */
  const checkReducedMotion = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPrefersReducedMotion(prefersReduced);
  }, []);
  
  /**
   * Setup listeners and initial state
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Initial checks
    updateScreenSize();
    detectTouch();
    checkReducedMotion();
    
    // Setup resize listener
    window.addEventListener('resize', updateScreenSize);
    
    // Setup reduced motion listener
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener('change', checkReducedMotion);
    
    return () => {
      window.removeEventListener('resize', updateScreenSize);
      motionQuery.removeEventListener('change', checkReducedMotion);
    };
  }, [updateScreenSize, detectTouch, checkReducedMotion]);
  
  /**
   * Memoized context value
   */
  const value: ResponsiveContextValue = useMemo(() => ({
    screenSize,
    isMobile: screenSize === 'xs' || screenSize === 'sm',
    isTablet: screenSize === 'md',
    isDesktop: screenSize === 'lg' || screenSize === 'xl',
    isTouch,
    prefersReducedMotion,
  }), [screenSize, isTouch, prefersReducedMotion]);
  
  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
}

/**
 * Use Responsive Hook
 * 
 * Access responsive context values in any component.
 * Must be used within a ResponsiveProvider.
 * 
 * @returns Responsive context value
 * @throws Error if used outside ResponsiveProvider
 * 
 * @example
 * ```tsx
 * import { useResponsive } from '@/contexts/ResponsiveContext';
 * 
 * export default function MyComponent() {
 *   const { isMobile, screenSize, isTouch } = useResponsive();
 *   
 *   return (
 *     <div>
 *       {isMobile ? <MobileLayout /> : <DesktopLayout />}
 *       {isTouch && <TouchControls />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useResponsive(): ResponsiveContextValue {
  const context = useContext(ResponsiveContext);
  
  if (!context) {
    throw new Error(
      'useResponsive must be used within a ResponsiveProvider. ' +
      'Wrap your component tree with <ResponsiveProvider>.'
    );
  }
  
  return context;
}

/**
 * Safe useResponsive Hook
 * 
 * Like useResponsive but returns default values instead of throwing.
 * Useful for components that might render outside provider (SSR, tests).
 * 
 * @returns Responsive context value or safe defaults
 * 
 * @example
 * ```tsx
 * const { isMobile = false } = useResponsiveSafe();
 * ```
 */
export function useResponsiveSafe(): ResponsiveContextValue {
  try {
    return useResponsive();
  } catch {
    // Return safe defaults for SSR/testing
    return {
      screenSize: 'lg',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouch: false,
      prefersReducedMotion: false,
    };
  }
}

/**
 * Higher-Order Component for responsive props
 * 
 * @deprecated Prefer using useResponsive hook directly
 * Will be removed in next major version
 */
export function withResponsive<P extends object>(
  WrappedComponent: React.ComponentType<P & ResponsiveContextValue>
) {
  return function ResponsiveComponent(props: P) {
    const responsive = useResponsiveSafe();
    return <WrappedComponent {...props} {...responsive} />;
  };
}
