/**
 * AIBattleControls - Speed controls and commentary for AI vs AI mode
 * Following: MODULAR, CLEAN architecture
 */

'use client';

import { useState, useEffect } from 'react';

interface AIBattleControlsProps {
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  gameState: any;
  isAIvsAIMode: boolean;
  onToggleReasoning?: () => void;
}

export default function AIBattleControls({
  playbackSpeed,
  onSpeedChange,
  gameState,
  isAIvsAIMode,
  onToggleReasoning,
}: AIBattleControlsProps) {
  const [commentary, setCommentary] = useState<string>('');
  const [commentaryHistory, setCommentaryHistory] = useState<string[]>([]);

  // Generate commentary based on game events
  useEffect(() => {
    if (!isAIvsAIMode || !gameState) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer) return;

    const turnText = `Turn ${gameState.turnNumber}`;
    const playerName = currentPlayer.username || currentPlayer.publicKey.slice(0, 8);

    // Simple commentary based on turn
    const newCommentary = `${turnText}: ${playerName}'s turn...`;
    setCommentary(newCommentary);

    // Add to history (keep last 5)
    setCommentaryHistory(prev => {
      // Avoid duplicate entries
      if (prev.length > 0 && prev[0] === newCommentary) return prev;
      return [newCommentary, ...prev].slice(0, 5);
    });
  }, [gameState?.turnNumber, gameState?.currentPlayerIndex, isAIvsAIMode]);

  if (!isAIvsAIMode) return null;

  const speedOptions = [
    { value: 0.5, label: '0.5x', emoji: '🐌' },
    { value: 1, label: '1x', emoji: '▶️' },
    { value: 2, label: '2x', emoji: '⚡' },
    { value: 4, label: '4x', emoji: '🚀' },
  ];

  return (
    <div className="fixed top-20 left-4 z-40 space-y-3">
      {/* Speed Controls */}
      <div className="bg-slate-900/95 border-2 border-neon-cyan/50 rounded-xl p-4 shadow-xl backdrop-blur-sm">
        <h3 className="text-sm font-bold text-neon-cyan uppercase mb-3 flex items-center gap-2">
          <span>⚡</span>
          <span>Playback Speed</span>
        </h3>
        <div className="flex gap-2">
          {speedOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onSpeedChange(option.value)}
              className={`px-3 py-2 rounded-lg font-bold text-sm transition-all ${playbackSpeed === option.value
                  ? 'bg-neon-cyan text-black scale-110'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                }`}
              title={option.label}
            >
              <div className="text-center">
                <div className="text-lg">{option.emoji}</div>
                <div className="text-xs">{option.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Live Commentary */}
      <div className="bg-slate-900/95 border-2 border-neon-gold/50 rounded-xl p-4 shadow-xl backdrop-blur-sm max-w-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-neon-gold uppercase flex items-center gap-2">
            <span>📢</span>
            <span>Live Commentary</span>
          </h3>
          {onToggleReasoning && (
            <button
              onClick={onToggleReasoning}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-neon-cyan px-2 py-1 rounded border border-neon-cyan/30 transition-colors"
            >
              View Logic
            </button>
          )}
        </div>

        {/* Current commentary */}
        <div className="bg-slate-800/80 rounded-lg p-3 mb-3 border-l-4 border-neon-gold">
          <p className="text-sm text-white font-semibold">{commentary || 'Waiting for action...'}</p>
        </div>

        {/* Commentary history */}
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {commentaryHistory.slice(1).map((msg, idx) => (
            <div
              key={idx}
              className="bg-slate-800/50 rounded p-2 text-xs text-gray-400"
            >
              {msg}
            </div>
          ))}
        </div>
      </div>

      {/* AI Battle Info */}
      {gameState && (
        <div className="bg-slate-900/95 border-2 border-neon-magenta/50 rounded-xl p-4 shadow-xl backdrop-blur-sm">
          <h3 className="text-sm font-bold text-neon-magenta uppercase mb-3 flex items-center gap-2">
            <span>🤖</span>
            <span>Battle Status</span>
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Turn:</span>
              <span className="text-white font-bold">{gameState.turnNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="text-white font-bold capitalize">{gameState.gameStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Speed:</span>
              <span className="text-neon-cyan font-bold">{playbackSpeed}x</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
