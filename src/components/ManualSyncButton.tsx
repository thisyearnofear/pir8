'use client';

import { usePirateGameState } from '@/hooks/usePirateGameState';
import { useGameSync } from '@/hooks/useGameSync';
import { useState } from 'react';

/**
 * ManualSyncButton - Simple manual sync trigger
 * Use this to test if blockchain sync is working
 */
export function ManualSyncButton() {
  const { gameState } = usePirateGameState();
  const { forceSync } = useGameSync(gameState?.gameId);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    if (!gameState?.gameId) {
      console.log('No game ID to sync');
      return;
    }

    setIsSyncing(true);
    console.log(`🔄 Manual sync triggered for game: ${gameState.gameId}`);

    try {
      await forceSync();
      console.log('✅ Manual sync completed');
    } catch (error) {
      console.error('❌ Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!gameState?.gameId || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded text-xs font-mono max-w-sm z-50">
      <div className="text-yellow-400 font-bold mb-2">🔧 Manual Sync</div>
      <div>Game ID: {gameState.gameId}</div>
      <div>Players: {gameState.players?.length || 0}</div>
      <button
        onClick={handleManualSync}
        disabled={isSyncing}
        className={`mt-2 px-3 py-1 rounded text-xs ${isSyncing
          ? 'bg-gray-600 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700'
          }`}
      >
        {isSyncing ? 'Syncing...' : 'Manual Sync'}
      </button>
    </div>
  );
}