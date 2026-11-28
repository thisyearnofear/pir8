/**
 * AIBattleControls - Speed controls and commentary for AI vs AI mode
 * Following: MODULAR, CLEAN architecture
 */

'use client';

import { useState, useEffect } from 'react';
import { Icon } from './ui/Icon';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.turnNumber, gameState?.currentPlayerIndex, isAIvsAIMode]);

  if (!isAIvsAIMode) return null;

  const speedOptions = [0.5, 1, 2, 4];

  return (
    <div className="fixed left-4 top-20 z-40 space-y-3">
      {/* Speed Controls */}
      <div className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-4 shadow-[var(--p8-shadow-instrument)]">
        <h3 className="mb-3 flex items-center gap-2 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.14em] text-[var(--p8-signal)]">
          <Icon name="gauge" size={14} />
          <span>Playback Speed</span>
        </h3>
        <div className="flex gap-2">
          {speedOptions.map((speed) => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed)}
              aria-pressed={playbackSpeed === speed}
              className={`rounded-[var(--p8-radius)] px-3 py-2 font-[var(--font-instrument)] text-sm font-bold transition-colors ${playbackSpeed === speed
                  ? 'border border-[var(--p8-signal)] bg-[var(--p8-signal)] text-[var(--p8-ink)]'
                  : 'border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] text-[var(--p8-vellum-dim)] hover:border-[var(--p8-brass)] hover:text-[var(--p8-vellum)]'
                }`}
              title={`${speed}x speed`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Live Commentary */}
      <div className="max-w-xs rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-4 shadow-[var(--p8-shadow-instrument)]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.14em] text-[var(--p8-lamp)]">
            <Icon name="message" size={14} />
            <span>Live Commentary</span>
          </h3>
          {onToggleReasoning && (
            <button
              onClick={onToggleReasoning}
              className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-2 py-1 text-xs text-[var(--p8-signal)] transition-colors hover:border-[var(--p8-signal)]"
            >
              View Logic
            </button>
          )}
        </div>

        {/* Current commentary */}
        <div className="mb-3 rounded-[var(--p8-radius)] border-l-2 border-l-[var(--p8-lamp)] bg-[var(--p8-ink)] p-3">
          <p className="text-sm font-semibold text-[var(--p8-vellum)]">{commentary || 'Waiting for action...'}</p>
        </div>

        {/* Commentary history */}
        <div className="max-h-40 space-y-2 overflow-y-auto">
          {commentaryHistory.slice(1).map((msg, idx) => (
            <div
              key={idx}
              className="rounded bg-[var(--p8-ink)] p-2 text-xs text-[var(--p8-vellum-mute)]"
            >
              {msg}
            </div>
          ))}
        </div>
      </div>

      {/* AI Battle Info */}
      {gameState && (
        <div className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-4 shadow-[var(--p8-shadow-instrument)]">
          <h3 className="mb-3 flex items-center gap-2 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.14em] text-[var(--p8-vellum-dim)]">
            <Icon name="brain" size={14} />
            <span>Battle Status</span>
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--p8-vellum-mute)]">Turn:</span>
              <span className="font-bold text-[var(--p8-vellum)]">{gameState.turnNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--p8-vellum-mute)]">Status:</span>
              <span className="font-bold capitalize text-[var(--p8-vellum)]">{gameState.gameStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--p8-vellum-mute)]">Speed:</span>
              <span className="font-bold text-[var(--p8-signal)]">{playbackSpeed}x</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
