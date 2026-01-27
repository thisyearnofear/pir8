'use client';

import { useGameIdRecovery } from '@/hooks/useGameIdRecovery';
import { usePirateGameState } from '@/hooks/usePirateGameState';

/**
 * GameSyncRecovery - Automatically handles game ID mismatches
 * When a memo creates a new game instead of joining, this component
 * detects the mismatch and switches to the correct game
 */
export function GameSyncRecovery() {
  const { gameState } = usePirateGameState();

  const { attemptRecovery: _attemptRecovery, currentPlayerCount: _currentPlayerCount, expectedPlayerCount: _expectedPlayerCount } = useGameIdRecovery({
    currentGameId: gameState?.gameId,
    expectedPlayerCount: 2, // We expect 2 players for a full game
    onGameIdChanged: (newGameId) => {
      console.log(`🎮 Game ID recovered: switched to ${newGameId}`);
    },
  });

  // Don't render anything - this runs silently in background
  return null;
}

/**
 * GameSyncStatus - Shows sync status in debug mode
 */
export function GameSyncStatus() {
  const { gameState } = usePirateGameState();
  const { currentPlayerCount, expectedPlayerCount, attemptRecovery } = useGameIdRecovery({
    currentGameId: gameState?.gameId,
    expectedPlayerCount: 2,
  });

  if (!gameState || process.env.NODE_ENV === 'production') {
    return null;
  }

  const needsRecovery = currentPlayerCount < expectedPlayerCount;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded text-xs font-mono max-w-sm z-50">
      <div className="text-yellow-400 font-bold mb-2">🔧 Sync Status</div>
      <div>Game ID: {gameState.gameId}</div>
      <div>Players: {currentPlayerCount}/{expectedPlayerCount}</div>
      <div>Status: {needsRecovery ? '⚠️ Needs Recovery' : '✅ Synced'}</div>

      {needsRecovery && (
        <button
          onClick={attemptRecovery}
          className="mt-2 px-2 py-1 bg-orange-600 hover:bg-orange-700 rounded text-xs"
        >
          🔄 Recover Game
        </button>
      )}
    </div>
  );
}