/**
 * Damage Number Effect
 * 
 * Animated floating damage text that appears when ships are hit.
 * Features critical hit styling, color coding, and smooth animations.
 */

'use client';

import { useEffect, useState } from 'react';

interface DamageNumberProps {
  amount: number;
  x: number;
  y: number;
  isCrit?: boolean;
  onComplete?: () => void;
}

export function DamageNumber({ 
  amount, 
  x, 
  y, 
  isCrit = false,
  onComplete 
}: DamageNumberProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    // Fade out after 1.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onComplete?.(), 300); // Wait for fade out
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    // Float upward animation
    const floatInterval = setInterval(() => {
      setPosition(prev => ({
        ...prev,
        y: prev.y - 2, // Float up 2px per frame
      }));
    }, 16);

    return () => clearInterval(floatInterval);
  }, []);

  const color = amount >= 5 ? '#ff0000' : amount >= 3 ? '#ff6b00' : '#ffd700';
  const fontSize = isCrit ? '2.5rem' : amount >= 5 ? '2rem' : '1.5rem';
  const fontWeight = isCrit ? '900' : '700';

  return (
    <div
      className="fixed pointer-events-none z-50 select-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-out',
      }}
    >
      {/* Critical hit star burst */}
      {isCrit && (
        <div
          className="absolute inset-0 animate-ping"
          style={{
            width: '100px',
            height: '100px',
            background: 'radial-gradient(circle, rgba(255,0,0,0.3) 0%, transparent 70%)',
            borderRadius: '50%',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}

      {/* Damage number */}
      <div
        className="relative"
        style={{
          fontSize,
          fontWeight,
          color,
          fontFamily: 'Orbitron, sans-serif',
          textShadow: `
            0 0 10px ${color},
            0 0 20px ${color},
            2px 2px 4px rgba(0,0,0,0.8)
          `,
          animation: 'damage-pop 0.3s ease-out',
        }}
      >
        -{amount}
        
        {/* Critical hit label */}
        {isCrit && (
          <div
            className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
            style={{
              fontSize: '1rem',
              color: '#ff0000',
              fontWeight: '900',
              textShadow: '0 0 10px #ff0000',
              animation: 'crit-shake 0.5s ease-in-out infinite',
            }}
          >
            CRITICAL!
          </div>
        )}
      </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes damage-pop {
          0% {
            transform: scale(0) rotate(-10deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(5deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes crit-shake {
          0%, 100% {
            transform: translateX(-50%) rotate(-5deg);
          }
          50% {
            transform: translateX(-50%) rotate(5deg);
          }
        }
      `}</style>
    </div>
  );
}

// Helper to spawn damage numbers
export interface DamageInstance {
  id: string;
  amount: number;
  x: number;
  y: number;
  isCrit?: boolean;
  timestamp: number;
}

export function useDamageNumbers() {
  const [damageInstances, setDamageInstances] = useState<DamageInstance[]>([]);

  const addDamage = useCallback((damage: Omit<DamageInstance, 'id' | 'timestamp'>) => {
    const instance: DamageInstance = {
      ...damage,
      id: `${damage.x}-${damage.y}-${Date.now()}`,
      timestamp: Date.now(),
    };
    
    setDamageInstances(prev => [...prev, instance]);
    
    // Auto-remove after animation completes
    setTimeout(() => {
      setDamageInstances(prev => prev.filter(d => d.id !== instance.id));
    }, 2000);
  }, []);

  const clearDamage = useCallback(() => {
    setDamageInstances([]);
  }, []);

  return {
    damageInstances,
    addDamage,
    clearDamage,
  };
}
