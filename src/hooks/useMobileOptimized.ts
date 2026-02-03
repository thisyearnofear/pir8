import { useState, useEffect, useCallback, useRef } from 'react';

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
  const [isMobile, setIsMobile] = useState(false);
  const [screenSize, setScreenSize] = useState<'xs' | 'sm' | 'md' | 'lg'>('lg');
  
  const touchStartPos = useRef<TouchPosition | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // CONSOLIDATED device detection
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = width <= 768;
      
      setIsMobile(isMobileDevice || isSmallScreen);
      
      if (width < 480) setScreenSize('xs');
      else if (width < 640) setScreenSize('sm');
      else if (width < 1024) setScreenSize('md');
      else setScreenSize('lg');
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // CONSOLIDATED haptic feedback
  const triggerHaptic = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!hapticFeedback || !navigator.vibrate) return;
    
    const patterns = { light: [10], medium: [25], heavy: [50] };
    navigator.vibrate(patterns[intensity]);
  }, [hapticFeedback]);

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
    touchHandlers,
    triggerHaptic,
    
    // CONSOLIDATED responsive utilities
    getGridSize: () => screenSize === 'xs' ? 7 : screenSize === 'sm' ? 8 : 10,
    shouldReduceAnimations: () => isMobile && screenSize === 'xs',
    
    // CONSOLIDATED CSS classes
    classes: {
      container: isMobile ? 'touch-manipulation select-none' : '',
      button: isMobile ? 'active:scale-95 min-h-[44px] min-w-[44px]' : 'hover:scale-105',
      grid: screenSize === 'xs' ? 'gap-0.5' : screenSize === 'sm' ? 'gap-1' : 'gap-2',
      text: screenSize === 'xs' ? 'text-sm' : 'text-base'
    }
  };
};