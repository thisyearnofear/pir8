/**
 * Screen Shake Effect
 * 
 * Provides haptic visual feedback for impacts, explosions, and significant events.
 * Uses CSS transforms with configurable intensity and duration.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';

export type ShakeIntensity = 'light' | 'medium' | 'heavy' | 'massive';

interface ScreenShakeProps {
  intensity?: ShakeIntensity;
  duration?: number;
  children: React.ReactNode;
}

const SHAKE_CONFIG: Record<ShakeIntensity, { x: number; y: number; duration: number }> = {
  light: { x: 2, y: 2, duration: 200 },
  medium: { x: 5, y: 5, duration: 400 },
  heavy: { x: 10, y: 10, duration: 600 },
  massive: { x: 20, y: 20, duration: 1000 },
};

export function ScreenShake({ 
  children, 
  intensity = 'medium',
  duration: customDuration 
}: ScreenShakeProps) {
  const [isShaking, setIsShaking] = useState(false);
  const config = SHAKE_CONFIG[intensity];
  const duration = customDuration ?? config.duration;

  const trigger = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), duration);
  }, [duration]);

  return (
    <div
      className={isShaking ? 'shake-active' : ''}
      style={{
        display: 'contents',
        animation: isShaking ? `shake-${intensity} ${duration}ms ease-in-out` : undefined,
      }}
    >
      {children}
      
      <style jsx global>{`
        @keyframes shake-light {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-${config.x}px) translateY(-${config.y}px); }
          50% { transform: translateX(${config.x}px) translateY(${config.y}px); }
          75% { transform: translateX(-${config.x}px) translateY(${config.y}px); }
        }

        @keyframes shake-medium {
          0%, 100% { transform: translateX(0) translateY(0); }
          10% { transform: translateX(-${config.x}px) translateY(-${config.y}px) rotate(-1deg); }
          20% { transform: translateX(${config.x}px) translateY(${config.y}px) rotate(1deg); }
          30% { transform: translateX(-${config.x}px) translateY(${config.y}px) rotate(-1deg); }
          40% { transform: translateX(${config.x}px) translateY(-${config.y}px) rotate(1deg); }
          50% { transform: translateX(-${config.x}px) translateY(${config.y}px) rotate(-1deg); }
          60% { transform: translateX(${config.x}px) translateY(-${config.y}px) rotate(1deg); }
          70% { transform: translateX(-${config.x}px) translateY(-${config.y}px) rotate(-1deg); }
          80% { transform: translateX(${config.x}px) translateY(${config.y}px) rotate(1deg); }
          90% { transform: translateX(-${config.x}px) translateY(${config.y}px) rotate(-1deg); }
        }

        @keyframes shake-heavy {
          0%, 100% { transform: translateX(0) translateY(0) rotate(0); }
          10% { transform: translateX(-${config.x}px) translateY(-${config.y}px) rotate(-2deg); }
          20% { transform: translateX(${config.x}px) translateY(${config.y}px) rotate(2deg); }
          30% { transform: translateX(-${config.x}px) translateY(${config.y}px) rotate(-2deg); }
          40% { transform: translateX(${config.x}px) translateY(-${config.y}px) rotate(2deg); }
          50% { transform: translateX(-${config.x}px) translateY(${config.y}px) rotate(-2deg); }
          60% { transform: translateX(${config.x}px) translateY(-${config.y}px) rotate(2deg); }
          70% { transform: translateX(-${config.x}px) translateY(-${config.y}px) rotate(-2deg); }
          80% { transform: translateX(${config.x}px) translateY(${config.y}px) rotate(2deg); }
          90% { transform: translateX(-${config.x}px) translateY(${config.y}px) rotate(-2deg); }
        }

        @keyframes shake-massive {
          0%, 100% { transform: translateX(0) translateY(0) rotate(0) scale(1); }
          10% { transform: translateX(-${config.x}px) translateY(-${config.y}px) rotate(-3deg) scale(1.02); }
          20% { transform: translateX(${config.x}px) translateY(${config.y}px) rotate(3deg) scale(0.98); }
          30% { transform: translateX(-${config.x}px) translateY(${config.y}px) rotate(-3deg) scale(1.02); }
          40% { transform: translateX(${config.x}px) translateY(-${config.y}px) rotate(3deg) scale(0.98); }
          50% { transform: translateX(-${config.x}px) translateY(${config.y}px) rotate(-3deg) scale(1.01); }
          60% { transform: translateX(${config.x}px) translateY(-${config.y}px) rotate(3deg) scale(0.99); }
          70% { transform: translateX(-${config.x}px) translateY(${config.y}px) rotate(-3deg) scale(1.01); }
          80% { transform: translateX(${config.x}px) translateY(${config.y}px) rotate(3deg) scale(0.99); }
          90% { transform: translateX(-${config.x}px) translateY(${config.y}px) rotate(-3deg) scale(1.005); }
        }

        .shake-active {
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

// Hook version for programmatic control
export function useScreenShake() {
  const [shakeTrigger, setShakeTrigger] = useState<{ intensity: ShakeIntensity; key: number } | null>(null);

  const shake = useCallback((intensity: ShakeIntensity = 'medium') => {
    setShakeTrigger({ intensity, key: Date.now() });
  }, []);

  const ShakeComponent = useCallback(({ children }: { children: React.ReactNode }) => (
    <ScreenShake 
      intensity={shakeTrigger?.intensity || 'medium'}
      key={shakeTrigger?.key}
    >
      {children}
    </ScreenShake>
  ), [shakeTrigger]);

  return { shake, ShakeComponent };
}
