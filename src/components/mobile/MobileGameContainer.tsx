'use client';

import React, { useState, useCallback } from 'react';
import { useMobileOptimized } from '@/hooks/useMobileOptimized';
import { Icon } from '@/components/ui/Icon';

interface Resources {
  gold: number;
  crew: number;
  cannons: number;
  supplies: number;
  wood: number;
  rum: number;
}

interface MobileGameContainerProps {
  isMyTurn: boolean;
  currentPlayerName: string;
  decisionTimeMs: number;
  onEndTurn: () => void;
  resources?: Resources;
  children: React.ReactNode;
}

export function MobileGameContainer({
  isMyTurn,
  currentPlayerName,
  decisionTimeMs,
  onEndTurn,
  resources,
  children,
}: MobileGameContainerProps) {
  const [showMobileControls, setShowMobileControls] = useState(false);

  const { isMobile, triggerHaptic, touchHandlers } = useMobileOptimized({
    hapticFeedback: true,
    preventZoom: true,
  });

  const handleEndTurn = useCallback(() => {
    triggerHaptic('medium');
    onEndTurn();
  }, [onEndTurn, triggerHaptic]);

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div
      className="mobile-game-container relative"
      {...touchHandlers}
    >
      {/* Mobile-optimized HUD */}
      <div className="fixed left-0 right-0 top-0 z-50 bg-gradient-to-b from-black/80 to-transparent pt-safe">
        {/* Top bar with player info */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isMyTurn ? 'animate-pulse bg-[var(--p8-signal)]' : 'bg-[var(--p8-threat)]'}`} />
            <span className="font-[var(--font-instrument)] text-xs text-[var(--p8-vellum)]">
              {isMyTurn ? 'YOUR TURN' : currentPlayerName}
            </span>
          </div>

          {/* Timer */}
          {isMyTurn && (
            <div className="flex items-center gap-1 font-[var(--font-instrument)] text-xs text-[var(--p8-signal)]">
              <Icon name="clock" size={12} />
              {Math.floor(decisionTimeMs / 1000)}s
            </div>
          )}
        </div>

        {/* Resources bar - compact on mobile */}
        {resources && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto px-2 py-1 font-[var(--font-instrument)] text-xs text-[var(--p8-vellum-dim)]">
            <span className="flex items-center gap-1"><Icon name="gold" size={12} className="text-[var(--p8-lamp)]" />{resources.gold}</span>
            <span className="flex items-center gap-1"><Icon name="crew" size={12} className="text-[var(--p8-lamp)]" />{resources.crew}</span>
            <span className="flex items-center gap-1"><Icon name="cannons" size={12} className="text-[var(--p8-lamp)]" />{resources.cannons}</span>
            <span className="flex items-center gap-1"><Icon name="supplies" size={12} className="text-[var(--p8-lamp)]" />{resources.supplies}</span>
          </div>
        )}
      </div>

      {/* Main game area */}
      <div className="pb-20 pt-16">
        {children}
      </div>

      {/* Bottom controls */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/90 to-transparent pb-safe">
        <div className="flex items-center justify-center gap-3 px-4 py-3">
          {isMyTurn && (
            <>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowMobileControls(!showMobileControls);
                }}
                aria-label="Show actions"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] text-[var(--p8-vellum)]"
              >
                <Icon name="target" size={18} />
              </button>

              <button
                onClick={handleEndTurn}
                className="flex h-12 max-w-[150px] flex-1 items-center justify-center gap-2 rounded-[var(--p8-radius)] border border-[var(--p8-lamp)] bg-[var(--p8-lamp)] text-sm font-bold text-[var(--p8-ink)]"
              >
                <Icon name="end-turn" size={15} />
                END TURN
              </button>
            </>
          )}

          <button
            onClick={() => {
              triggerHaptic('light');
            }}
            aria-label="Attack"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] text-[var(--p8-vellum)]"
          >
            <Icon name="attack" size={18} />
          </button>
        </div>
      </div>

      {/* Mobile control panel */}
      {showMobileControls && isMyTurn && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowMobileControls(false)}>
          <div className="absolute bottom-20 left-0 right-0 rounded-t-2xl border-t border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-4">
            <div className="grid grid-cols-3 gap-2">
              {(['Move', 'Attack', 'Claim'] as const).map((action) => (
                <button
                  key={action}
                  onClick={() => {
                    triggerHaptic('light');
                    setShowMobileControls(false);
                  }}
                  className="h-14 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] text-sm font-bold text-[var(--p8-vellum)] active:border-[var(--p8-signal)]"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileGameContainer;
