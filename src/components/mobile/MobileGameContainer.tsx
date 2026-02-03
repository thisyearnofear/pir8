'use client';

import React, { useState, useCallback } from 'react';
import { useMobileOptimized } from '@/hooks/useMobileOptimized';

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
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent pt-safe">
        {/* Top bar with player info */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isMyTurn ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-xs text-white font-mono">
              {isMyTurn ? 'YOUR TURN' : currentPlayerName}
            </span>
          </div>
          
          {/* Timer */}
          {isMyTurn && (
            <div className="text-xs font-mono text-neon-cyan">
              {Math.floor(decisionTimeMs / 1000)}s
            </div>
          )}
        </div>

        {/* Resources bar - compact on mobile */}
        {resources && (
          <div className="flex items-center justify-center gap-2 px-2 py-1 overflow-x-auto">
            <span className="text-xs text-yellow-400 font-mono">💰{resources.gold}</span>
            <span className="text-xs text-cyan-400 font-mono">👥{resources.crew}</span>
            <span className="text-xs text-red-400 font-mono">💣{resources.cannons}</span>
            <span className="text-xs text-green-400 font-mono">📦{resources.supplies}</span>
          </div>
        )}
      </div>

      {/* Main game area */}
      <div className="pt-16 pb-20">
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
                className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-lg"
              >
                🎯
              </button>
              
              <button
                onClick={handleEndTurn}
                className="flex-1 max-w-[150px] h-12 rounded-xl bg-gradient-to-r from-neon-gold to-neon-orange text-black font-bold text-sm"
              >
                END TURN
              </button>
            </>
          )}
          
          <button
            onClick={() => {
              triggerHaptic('light');
            }}
            className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-lg"
          >
            ⚔️
          </button>
        </div>
      </div>

      {/* Mobile control panel */}
      {showMobileControls && isMyTurn && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowMobileControls(false)}>
          <div className="absolute bottom-20 left-0 right-0 bg-slate-800 rounded-t-2xl p-4 animate-slide-up">
            <div className="grid grid-cols-3 gap-2">
              {['Move', 'Attack', 'Claim'].map((action) => (
                <button
                  key={action}
                  onClick={() => {
                    triggerHaptic('light');
                    setShowMobileControls(false);
                  }}
                  className="h-14 rounded-xl bg-slate-700 text-white font-bold text-sm active:bg-neon-cyan/50"
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
