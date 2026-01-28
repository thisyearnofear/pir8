'use client';

import { useGameLifecycle } from '@/hooks/useGameLifecycle';
import { usePirateGameState } from '@/hooks/usePirateGameState';

/**
 * GameSyncRecovery - Automatically handles game ID mismatches
 * When a memo creates a new game instead of joining, this component
 * detects the mismatch and switches to the correct game
 * 
 * Updated to use consolidated useGameLifecycle hook
 */
export function GameSyncRecovery() {
  const { gameState } = usePirateGameState();

  // Use consolidated hook - recovery runs silently in background
  useGameLifecycle({
    gameId: gameState?.gameId,
    expectedPlayerCount: 2,
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
  const { currentPlayerCount, attemptRecovery, isRecovering } = useGameLifecycle({
    gameId: gameState?.gameId,
    expectedPlayerCount: 2,
  });

  if (!gameState || process.env.NODE_ENV === 'production') {
    return null;
  }



  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded text-xs font-mono max-w-sm z-50">
      <div className="text-yellow-400 font-bold mb-2">🔧 Sync Status</div>
      <div>Game ID: {gameState.gameId}</div>
      <div>Players: {currentPlayerCount}</div>
      <div>Status: {isRecovering ? '🔄 Recovering...' : '✅ Synced'}</div>

      {!isRecovering && (
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
