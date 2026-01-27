import { useState, useEffect, useCallback, useRef } from 'react';

interface TouchPosition {
  x: number;
  y: number;
}

interface UseMobileOptimizedProps {
  onTap?: (element: HTMLElement) => void;
  onLongPress?: (element: HTMLElement) => void;
  hapticFeedback?: boolean;
  preventZoom?: boolean;
}

export const useMobileOptimized = ({
  onTap,
  onLongPress,
  hapticFeedback = true,
  preventZoom = true
}: UseMobileOptimizedProps = {}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const touchStartPos = useRef<TouchPosition | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Detect mobile and touch capability
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setIsMobile(isMobileDevice || isSmallScreen);
      setIsTouch(hasTouchScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Haptic feedback function
  const triggerHaptic = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!hapticFeedback || !navigator.vibrate) return;
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [50]
    };
    
    navigator.vibrate(patterns[intensity]);
  }, [hapticFeedback]);

  // Enhanced touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLElement>) => {
    if (!isTouch) return;

    const touch = e.touches[0];
    if (!touch) return;
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    
    // Start long press timer
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        triggerHaptic('medium');
        onLongPress(e.currentTarget);
      }, 500);
    }

    // Prevent zoom on double tap if requested
    if (preventZoom) {
      e.preventDefault();
    }
  }, [isTouch, onLongPress, triggerHaptic, preventZoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLElement>) => {
    if (!isTouch || !touchStartPos.current) return;

    const touch = e.touches[0];
    if (!touch) return;
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
    
    // Cancel long press if moved too much
    if ((deltaX > 10 || deltaY > 10) && longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, [isTouch]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLElement>) => {
    if (!isTouch || !touchStartPos.current) return;

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const touch = e.changedTouches[0];
    if (!touch) return;
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
    
    // Consider it a tap if minimal movement
    if (deltaX < 10 && deltaY < 10) {
      triggerHaptic('light');
      onTap?.(e.currentTarget);
    }

    touchStartPos.current = null;
  }, [isTouch, onTap, triggerHaptic]);

  // Touch-optimized click handler
  const handleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    // Only handle mouse clicks on non-touch devices
    if (!isTouch) {
      onTap?.(e.currentTarget);
    }
  }, [isTouch, onTap]);

  // Prevent zoom on specific elements
  const preventZoomProps = preventZoom ? {
    onTouchStart: (e: React.TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }
  } : {};

  return {
    isMobile,
    isTouch,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onClick: handleClick,
      ...preventZoomProps
    },
    triggerHaptic,
    
    // CSS classes for mobile optimization
    mobileClasses: {
      container: isMobile ? 'touch-manipulation select-none' : '',
      button: isMobile ? 'active:scale-95 transition-transform' : 'hover:scale-105',
      grid: isMobile ? 'gap-1' : 'gap-2',
      text: isMobile ? 'text-lg leading-relaxed' : 'text-base',
    }
  };
};