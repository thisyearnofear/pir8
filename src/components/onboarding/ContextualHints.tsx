/**
 * Contextual Hints System
 * 
 * Shows helpful tooltips based on game state and user actions.
 * Progressive disclosure - hints fade as player gains experience.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';

export interface Hint {
  id: string;
  text: string;
  targetElement?: string;
  duration?: number; // Auto-hide after ms (0 = manual dismiss)
  priority?: 'low' | 'medium' | 'high';
  once?: boolean; // Show only once per session
}

interface ContextualHintsProps {
  hints: Hint[];
  onDismiss?: (hintId: string) => void;
  isVisible?: boolean;
}

export function ContextualHints({ 
  hints,
  onDismiss,
  isVisible = true 
}: ContextualHintsProps) {
  const [activeHints, setActiveHints] = useState<Hint[]>([]);
  const { play } = useSoundEffects();

  // Must define handleDismiss before useEffect that uses it
  const handleDismiss = useCallback((hintId: string) => {
    play('button_click');
    onDismiss?.(hintId);
    setActiveHints(prev => prev.filter(h => h.id !== hintId));
  }, [onDismiss, play]);

  useEffect(() => {
    if (!isVisible) return;

    // Filter and sort hints by priority
    const sorted = [...hints].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority || 'low'] || 1) - (priorityOrder[a.priority || 'low'] || 1);
    });

    // Take top 3 hints to avoid overwhelming
    setActiveHints(sorted.slice(0, 3));

    // Auto-dismiss hints with duration
    sorted.forEach(hint => {
      if (hint.duration && hint.duration > 0) {
        setTimeout(() => {
          handleDismiss(hint.id);
        }, hint.duration);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hints, isVisible]);

  if (!isVisible || activeHints.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 pointer-events-none">
      {activeHints.map((hint, index) => (
        <div
          key={hint.id}
          className={`pointer-events-auto max-w-sm animate-in slide-in-from-right 
                      duration-300 ease-out`}
          style={{ 
            animationDelay: `${index * 100}ms`,
          }}
        >
          <div className={`
            relative bg-slate-900/95 backdrop-blur border-l-4 rounded-lg shadow-xl p-4
            ${hint.priority === 'high' ? 'border-neon-orange' : 
              hint.priority === 'medium' ? 'border-neon-gold' : 'border-neon-cyan'}
          `}>
            {/* Close button */}
            <button
              onClick={() => handleDismiss(hint.id)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Dismiss hint"
            >
              ✕
            </button>

            {/* Content */}
            <p className="text-sm text-gray-200 pr-6">
              {hint.text}
            </p>

            {/* Progress bar for timed hints */}
            {hint.duration && hint.duration > 0 && (
              <div className="mt-2 h-0.5 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-neon-cyan animate-pulse"
                  style={{ 
                    animation: `shrink ${hint.duration}ms linear forwards`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// Pre-defined hint templates
export const HINT_TEMPLATES = {
  // First game hints
  FIRST_SHIP_SELECT: {
    id: 'first_ship_select',
    text: '👆 Tap a ship to select it and see its options',
    priority: 'high' as const,
    duration: 5000,
  },
  
  FIRST_MOVE: {
    id: 'first_move',
    text: '🎯 With a ship selected, tap an adjacent cell to move',
    priority: 'high' as const,
    duration: 6000,
  },
  
  FIRST_ATTACK: {
    id: 'first_attack',
    text: '⚔️ Tap an enemy ship to attack. Watch for damage numbers!',
    priority: 'high' as const,
    duration: 5000,
  },
  
  FIRST_COLLECT: {
    id: 'first_collect',
    text: '💰 Click "Collect" to gather resources from your territories',
    priority: 'medium' as const,
    duration: 5000,
  },
  
  SPEED_BONUS: {
    id: 'speed_bonus',
    text: '⚡ Fast decisions earn bonus points! <5s = +100 pts',
    priority: 'medium' as const,
    duration: 4000,
  },
  
  TERRITORY_CONTROL: {
    id: 'territory_control',
    text: '🏴‍☠️ Control territories to earn passive income each turn',
    priority: 'medium' as const,
    duration: 5000,
  },
  
  LOW_HEALTH: {
    id: 'low_health',
    text: '❤️ Your ship is low on health! Consider retreating or repairing',
    priority: 'high' as const,
    duration: 4000,
  },
  
  VICTORY_CONDITION: {
    id: 'victory_condition',
    text: '🏆 Destroy all enemy ships OR control 60% of the map to win!',
    priority: 'low' as const,
    duration: 6000,
  },
};

// Hook for managing hints
export function useContextualHints() {
  const [shownHints, setShownHints] = useState<Set<string>>(new Set());
  const [activeHints, setActiveHints] = useState<Hint[]>([]);

  const showHint = useCallback((hint: Hint) => {
    if (hint.once && shownHints.has(hint.id)) {
      return; // Already shown this session
    }

    setActiveHints(prev => [...prev, hint]);
    setShownHints(prev => new Set(prev).add(hint.id));
  }, [shownHints]);

  const showHints = useCallback((hints: Hint[]) => {
    hints.forEach(hint => showHint(hint));
  }, [showHint]);

  const dismissHint = useCallback((hintId: string) => {
    setActiveHints(prev => prev.filter(h => h.id !== hintId));
  }, []);

  const clearHints = useCallback(() => {
    setActiveHints([]);
  }, []);

  const resetHints = useCallback(() => {
    setShownHints(new Set());
    setActiveHints([]);
  }, []);

  return {
    activeHints,
    showHint,
    showHints,
    dismissHint,
    clearHints,
    resetHints,
    shownHints,
  };
}

// Example usage component
export function TutorialHintsOverlay() {
  const hints = useContextualHints();

  // Example: Show hints based on game events
  useEffect(() => {
    // These would be triggered by actual game events
    // This is just an example
    const timer = setTimeout(() => {
      hints.showHints([
        HINT_TEMPLATES.FIRST_SHIP_SELECT,
        HINT_TEMPLATES.SPEED_BONUS,
      ]);
    }, 2000);

    return () => clearTimeout(timer);
  }, [hints]);

  return (
    <ContextualHints
      hints={hints.activeHints}
      onDismiss={hints.dismissHint}
      isVisible={true}
    />
  );
}
