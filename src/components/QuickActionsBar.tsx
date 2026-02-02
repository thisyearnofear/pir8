/**
 * QuickActionsBar - Fast access to common actions
 * 
 * Core Principles:
 * - ENHANCEMENT: Speeds up gameplay, doesn't replace existing UI
 * - CLEAN: Self-contained component
 * - PERFORMANT: Minimal re-renders
 */

'use client';

import { useState } from 'react';

interface QuickActionsBarProps {
  onCollectAll?: () => Promise<boolean>;
  onEndTurn?: () => Promise<void>;
  onUndo?: () => void;
  canUndo?: boolean;
  isMyTurn: boolean;
  isProcessing?: boolean;
}

export default function QuickActionsBar({
  onCollectAll,
  onEndTurn,
  onUndo,
  canUndo = false,
  isMyTurn,
  isProcessing = false,
}: QuickActionsBarProps) {
  const [isCollecting, setIsCollecting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const handleCollectAll = async () => {
    if (!onCollectAll || isCollecting || isProcessing) return;
    
    setIsCollecting(true);
    try {
      const success = await onCollectAll();
      if (!success) {
        // Show error feedback
        console.log('Collection failed');
      }
    } finally {
      setIsCollecting(false);
    }
  };

  const handleEndTurn = async () => {
    if (!onEndTurn || isEnding || isProcessing) return;
    
    setIsEnding(true);
    try {
      await onEndTurn();
    } finally {
      setIsEnding(false);
    }
  };

  const handleUndo = () => {
    if (!onUndo || !canUndo || isProcessing) return;
    onUndo();
  };

  if (!isMyTurn) return null;

  return (
    <div className="quick-actions-bar fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-slate-900/95 border-2 border-neon-cyan/50 rounded-full px-4 py-2 shadow-2xl backdrop-blur-md flex items-center gap-3">
        {/* Collect All Resources */}
        {onCollectAll && (
          <button
            onClick={handleCollectAll}
            disabled={isCollecting || isProcessing}
            className="quick-action-btn group relative"
            title="Collect all resources from controlled territories"
          >
            <div className="absolute inset-0 bg-neon-gold/20 rounded-lg blur-md group-hover:blur-lg transition-all" />
            <div className="relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neon-gold/80 to-yellow-500/80 
                          hover:from-neon-gold hover:to-yellow-500 rounded-lg transition-all
                          disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-sm">
              {isCollecting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Collecting...</span>
                </>
              ) : (
                <>
                  <span>💰</span>
                  <span>Collect All</span>
                </>
              )}
            </div>
          </button>
        )}

        {/* Undo Last Action */}
        {onUndo && (
          <button
            onClick={handleUndo}
            disabled={!canUndo || isProcessing}
            className="quick-action-btn group relative"
            title="Undo last action"
          >
            <div className="absolute inset-0 bg-slate-600/20 rounded-lg blur-md group-hover:blur-lg transition-all" />
            <div className="relative flex items-center gap-2 px-4 py-2 bg-slate-700/80 hover:bg-slate-700
                          rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                          text-white font-bold text-sm">
              <span>↩️</span>
              <span>Undo</span>
            </div>
          </button>
        )}

        {/* End Turn */}
        {onEndTurn && (
          <button
            onClick={handleEndTurn}
            disabled={isEnding || isProcessing}
            className="quick-action-btn group relative"
            title="End your turn"
          >
            <div className="absolute inset-0 bg-neon-cyan/20 rounded-lg blur-md group-hover:blur-lg transition-all" />
            <div className="relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neon-cyan/80 to-blue-500/80
                          hover:from-neon-cyan hover:to-blue-500 rounded-lg transition-all
                          disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-sm">
              {isEnding ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Ending...</span>
                </>
              ) : (
                <>
                  <span>⏭️</span>
                  <span>End Turn</span>
                </>
              )}
            </div>
          </button>
        )}
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="text-center mt-2">
        <p className="text-xs text-gray-500">
          <kbd className="px-1 py-0.5 bg-slate-700 rounded text-gray-300">C</kbd> Collect • 
          <kbd className="px-1 py-0.5 bg-slate-700 rounded text-gray-300 ml-1">U</kbd> Undo • 
          <kbd className="px-1 py-0.5 bg-slate-700 rounded text-gray-300 ml-1">E</kbd> End Turn
        </p>
      </div>
    </div>
  );
}
