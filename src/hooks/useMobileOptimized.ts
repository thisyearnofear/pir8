import { useCallback, useRef } from 'react';
import { triggerHaptic as triggerHapticUtil, type HapticIntensity } from '@/utils/haptics';
import { useResponsiveSafe } from '@/contexts/ResponsiveContext';

interface TouchPosition {
  x: number;
  y: number;
}

interface UseMobileOptimizedProps {
  onTap?: (element: HTMLElement) => void;
  onLongPress?: (element: HTMLElement) => void;
  onSwipe?: (direction: 'up' | 'down' | 'left' | 'right', distance: number) => void;
  hapticFeedback?: boolean;
  preventZoom?: boolean;
}

export const useMobileOptimized = ({
  onTap,
  onLongPress,
  onSwipe,
  hapticFeedback = true,
  preventZoom = true
}: UseMobileOptimizedProps = {}) => {
  // ENHANCED: Use ResponsiveContext instead of custom detection
  const { isMobile, screenSize, isTouch, prefersReducedMotion } = useResponsiveSafe();
  
  const touchStartPos = useRef<TouchPosition | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // ENHANCED: Respect reduced motion preference
  const triggerHaptic = useCallback((intensity: HapticIntensity = 'light') => {
    if (!hapticFeedback || prefersReducedMotion) return false;
    return triggerHapticUtil(intensity);
  }, [hapticFeedback, prefersReducedMotion]);

  // CONSOLIDATED touch handlers
  const touchHandlers = {
    onTouchStart: useCallback((e: React.TouchEvent<HTMLElement>) => {
      const touch = e.touches[0];
      if (!touch) return;
      
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      
      if (onLongPress) {
        longPressTimer.current = setTimeout(() => {
          triggerHaptic('medium');
          onLongPress(e.currentTarget);
        }, 500);
      }

      if (preventZoom && e.touches.length > 1) {
        e.preventDefault();
      }
    }, [onLongPress, triggerHaptic, preventZoom]),

    onTouchMove: useCallback((e: React.TouchEvent<HTMLElement>) => {
      if (!touchStartPos.current) return;
      
      const touch = e.touches[0];
      if (!touch) return;
      
      const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
      
      if ((deltaX > 15 || deltaY > 15) && longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }, []),

    onTouchEnd: useCallback((e: React.TouchEvent<HTMLElement>) => {
      if (!touchStartPos.current) return;

      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      const touch = e.changedTouches[0];
      if (!touch) return;
      
      const deltaX = touch.clientX - touchStartPos.current.x;
      const deltaY = touch.clientY - touchStartPos.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance > 50 && onSwipe) {
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        let direction: 'up' | 'down' | 'left' | 'right';
        
        if (angle >= -45 && angle <= 45) direction = 'right';
        else if (angle >= 45 && angle <= 135) direction = 'down';
        else if (angle >= -135 && angle <= -45) direction = 'up';
        else direction = 'left';
        
        triggerHaptic('light');
        onSwipe(direction, distance);
      } else if (distance < 15) {
        triggerHaptic('light');
        onTap?.(e.currentTarget);
      }

      touchStartPos.current = null;
    }, [onTap, onSwipe, triggerHaptic]),

    onClick: useCallback((e: React.MouseEvent<HTMLElement>) => {
      if (!isMobile) onTap?.(e.currentTarget);
    }, [isMobile, onTap])
  };

  return {
    isMobile,
    screenSize,
    isTouch,
    touchHandlers,
    triggerHaptic,
    
    // CONSOLIDATED responsive utilities
    getGridSize: () => {
      if (screenSize === 'xs') return 7;
      if (screenSize === 'sm') return 8;
      return 10;
    },
    shouldReduceAnimations: () => isMobile && screenSize === 'xs',
    
    // ENHANCED CSS classes - consistent minimum touch targets
    classes: {
      container: isMobile ? 'touch-manipulation select-none' : '',
      button: isMobile 
        ? 'active:scale-95 min-h-[44px] min-w-[44px] touch-target' 
        : 'hover:scale-105',
      grid: screenSize === 'xs' ? 'gap-0.5' : screenSize === 'sm' ? 'gap-1' : 'gap-2',
      text: screenSize === 'xs' ? 'text-sm' : 'text-base'
    }
  };
};