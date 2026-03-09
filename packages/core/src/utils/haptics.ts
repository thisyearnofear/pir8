/**
 * Haptic Feedback Utilities
 * 
 * Single source of truth for all haptic feedback in the application.
 * Uses Navigator.vibrate API with graceful degradation for unsupported browsers.
 * 
 * @module utils/haptics
 */

/**
 * Supported haptic intensity levels
 */
export type HapticIntensity = 'light' | 'medium' | 'heavy' | 'success' | 'error';

/**
 * Haptic feedback patterns mapped to intensity levels
 * Patterns follow Vibration API specification:
 * - number: single vibration duration in ms
 * - number[]: pattern of vibrations and pauses
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
 */
export const HAPTIC_PATTERNS: Record<HapticIntensity, number | number[]> = {
  /** Light tap - minimal feedback for selections */
  light: 10,
  
  /** Medium thump - standard feedback for actions */
  medium: 25,
  
  /** Heavy impact - critical actions or errors */
  heavy: [50, 30, 50],
  
  /** Success confirmation - positive feedback */
  success: [100, 50, 100],
  
  /** Error alert - negative feedback */
  error: [200, 50, 200]
} as const;

/**
 * Check if device supports haptic feedback
 * 
 * @returns boolean - true if vibrate API is available
 */
export function hasHapticSupport(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback with specified intensity
 * 
 * Gracefully degrades on unsupported devices/browsers.
 * Automatically respects user's reduced motion preferences.
 * 
 * @param intensity - Level of haptic feedback (default: 'light')
 * @returns boolean - Whether haptic was triggered (false if unsupported)
 * 
 * @example
 * // Basic usage
 * triggerHaptic('medium');
 * 
 * @example
 * // In event handler
 * const handleClick = () => {
 *   triggerHaptic('success');
 *   // ... perform action
 * };
 */
export function triggerHaptic(intensity: HapticIntensity = 'light'): boolean {
  // Check if running in browser
  if (typeof navigator === 'undefined') {
    return false;
  }
  
  // Check if vibrate API is supported
  if (!('vibrate' in navigator)) {
    return false;
  }
  
  // Respect reduced motion preferences
  if (typeof window !== 'undefined') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return false;
    }
  }
  
  try {
    navigator.vibrate(HAPTIC_PATTERNS[intensity]);
    return true;
  } catch (error) {
    // Vibration failed (possibly due to permissions or policy)
    console.warn('[Haptics] Vibration failed:', error);
    return false;
  }
}

/**
 * Haptic feedback convenience class
 * 
 * Provides pre-bound methods for common haptic intensities.
 * Useful for direct import and use in components.
 * 
 * @example
 * // In component
 * import { Haptic } from '@/utils/haptics';
 * 
 * const handleAction = () => {
 *   Haptic.light();
 *   // ... do something
 * };
 */
export const Haptic = {
  /** Light tap - for selections, hover states */
  light: () => triggerHaptic('light'),
  
  /** Medium thump - for button clicks, confirmations */
  medium: () => triggerHaptic('medium'),
  
  /** Heavy impact - for destructive actions, errors */
  heavy: () => triggerHaptic('heavy'),
  
  /** Success pattern - for successful completions */
  success: () => triggerHaptic('success'),
  
  /** Error pattern - for failures, validations */
  error: () => triggerHaptic('error'),
} as const;

/**
 * Hook-style haptic feedback for React components
 * Returns bound trigger function with consistent settings
 * 
 * @deprecated Use direct imports from Haptic object instead
 * Will be removed in next major version
 */
export function useHaptic() {
  return {
    trigger: triggerHaptic,
    hasSupport: hasHapticSupport(),
    Haptic,
  };
}
