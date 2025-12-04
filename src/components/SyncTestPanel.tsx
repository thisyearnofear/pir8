'use client';

import { useSyncDebugger } from '@/utils/sync-debug';
import { usePirateGameState } from '@/hooks/usePirateGameState';
import { useState } from 'react';

/**
 * SyncTestPanel - Debug component to test blockchain synchronization
 * Helps verify that player joins are properly reflected in the UI
 */
export function SyncTestPanel() {
  const { gameState } = usePirateGameState();
  const { logState, triggerSync, watchChanges } = useSyncDebugger(gameState?.gameId);
  const [isWatching, setIsWatching] = useState(false);
  const [unwatch, setUnwatch] = useState<(() => void) | null>(null);

  const handleWatchChanges = () => {
    if (isWatching && unwatch) {
      unwatch();
      setUnwatch(null);
      setIsWatching(false);
    } else if (gameState?.gameId) {
      const unwatchFunc = watchChanges();
      setUnwatch(() => unwatchFunc);
      setIsWatching(true);
    }
  };

  if (!gameState?.gameId) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-sm font-mono max-w-sm z-50">
      <h3 className="font-bold text-yellow-400 mb-2">🔧 Sync Debug Panel</h3>
      
      <div className="space-y-2">
        <div>
          <span className="text-gray-400">Game ID:</span> {gameState.gameId}
        </div>
        <div>
          <span className="text-gray-400">Players:</span> {gameState.players?.length || 0}
        </div>
        <div>
          <span className="text-gray-400">Status:</span> {gameState.gameStatus}
        </div>
        
        <div className="flex gap-2 mt-3">
          <button
            onClick={logState}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
          >
            Log State
          </button>
          
          <button
            onClick={triggerSync}
            className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
          >
            Manual Sync
          </button>
          
          <button
            onClick={handleWatchChanges}
            className={`px-2 py-1 rounded text-xs ${
              isWatching 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isWatching ? 'Stop Watching' : 'Watch Changes'}
          </button>
        </div>
        
        {isWatching && (
          <div className="text-yellow-400 text-xs mt-2">
            👁️ Watching for player changes...
          </div>
        )}
      </div>
    </div>
  );
}