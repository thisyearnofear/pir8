import { useEffect, useState, useCallback } from 'react';

interface AccessibilityState {
  reducedMotion: boolean;
  highContrast: boolean;
  screenReader: boolean;
  fontSize: 'normal' | 'large' | 'x-large';
}

/**
 * Hook for detecting user accessibility preferences
 * Supports reduced motion, high contrast, and screen reader modes
 */
export function useAccessibility() {
  const [accessibilityState, setAccessibilityState] = useState<AccessibilityState>({
    reducedMotion: false,
    highContrast: false,
    screenReader: false,
    fontSize: 'normal',
  });

  useEffect(() => {
    // Check for reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: more)');
    
    const updatePreferences = () => {
      setAccessibilityState({
        reducedMotion: reducedMotionQuery.matches,
        highContrast: highContrastQuery.matches,
        screenReader: false, // Would need additional detection
        fontSize: 'normal',
      });
    };

    updatePreferences();

    // Listen for changes
    reducedMotionQuery.addEventListener('change', updatePreferences);
    highContrastQuery.addEventListener('change', updatePreferences);

    return () => {
      reducedMotionQuery.removeEventListener('change', updatePreferences);
      highContrastQuery.removeEventListener('change', updatePreferences);
    };
  }, []);

  return accessibilityState;
}

/**
 * Hook for managing focus within a container
 * Provides keyboard navigation support
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, isActive]);
}

/**
 * Generate ARIA attributes for interactive game elements
 */
export function getGameElementAriaProps({
  role,
  label,
  description,
  disabled,
  expanded,
  selected,
}: {
  role?: 'button' | 'gridcell' | 'option' | 'slider' | 'tab';
  label: string;
  description?: string;
  disabled?: boolean;
  expanded?: boolean;
  selected?: boolean;
}) {
  return {
    role,
    'aria-label': label,
    'aria-description': description,
    'aria-disabled': disabled,
    'aria-expanded': expanded,
    'aria-selected': selected,
    tabIndex: disabled ? -1 : 0,
  };
}

/**
 * Hook for announcing screen reader messages
 */
export function useAnnouncer() {
  const [announcement, setAnnouncement] = useState('');

  const announce = useCallback((message: string, _priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement('');
    setTimeout(() => setAnnouncement(message), 50);
  }, []);

  return {
    announcement,
    announce,
    announcerProps: {
      'aria-live': 'polite',
      'aria-atomic': true,
      className: 'sr-only',
    },
  };
}