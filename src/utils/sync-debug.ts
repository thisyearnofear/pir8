/**
 * Sync Debug Utilities
 * Helps troubleshoot blockchain synchronization issues
 */

import { usePirateGameState } from '@/hooks/usePirateGameState';
import { useOnChainSync } from '@/hooks/useOnChainSync';

export class SyncDebugger {
    static logGameState(label: string) {
        const { gameState } = usePirateGameState.getState();
        console.log(`[Sync Debug] ${label}:`, {
            hasGameState: !!gameState,
            gameId: gameState?.gameId,
            playerCount: gameState?.players?.length || 0,
            gameStatus: gameState?.gameStatus,
            currentPlayerIndex: gameState?.currentPlayerIndex,
            timestamp: new Date().toISOString(),
        });
        return gameState;
    }

    static async triggerManualSync(gameId: string) {
        console.log('[Sync Debug] Manual sync triggered for game:', gameId);

        // Get current state
        const beforeState = this.logGameState('Before sync');

        try {
            // Force sync via on-chain
            const { forceSync } = useOnChainSync(gameId);
            await forceSync();

            // Log state after sync
            setTimeout(() => {
                const afterState = this.logGameState('After sync');
                const playerCountChange = (afterState?.players?.length || 0) - (beforeState?.players?.length || 0);

                if (playerCountChange > 0) {
                    console.log(`[Sync Debug] ✅ Added ${playerCountChange} players via sync!`);
                } else {
                    console.log('[Sync Debug] ℹ️ No player changes detected');
                }
            }, 500);

        } catch (error) {
            console.error('[Sync Debug] Sync failed:', error);
        }
    }

    static watchGameStateChanges(gameId: string) {
        let lastPlayerCount = 0;

        const checkInterval = setInterval(() => {
            const { gameState } = usePirateGameState.getState();

            if (gameState?.gameId === gameId) {
                const currentPlayerCount = gameState.players?.length || 0;

                if (currentPlayerCount !== lastPlayerCount) {
                    console.log(`[Sync Debug] Player count changed: ${lastPlayerCount} → ${currentPlayerCount}`);
                    lastPlayerCount = currentPlayerCount;
                }
            }
        }, 2000);

        // Stop watching after 30 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            console.log('[Sync Debug] Stopped watching for changes');
        }, 30000);

        return () => clearInterval(checkInterval);
    }

    static async testZcashEntry(gameId: string, solanaPubkey: string) {
        console.log('[Sync Debug] Testing Zcash entry simulation...');

        // Simulate what happens when a player joins via Zcash memo
        const memoPayload = {
            gameId,
            action: 'join' as const,
            solanaPubkey,
            timestamp: Date.now(),
            v: 1,
        };

        console.log('[Sync Debug] Simulated memo payload:', memoPayload);

        // This would trigger the on-chain join and then sync
        // For now just log - the actual implementation is in the Zcash bridge
        return memoPayload;
    }
}

// Hook for easy debugging in components
export function useSyncDebugger(gameId?: string) {
    const syncOnChain = useOnChainSync(gameId);

    return {
        logState: () => SyncDebugger.logGameState('Manual log'),
        triggerSync: () => gameId ? SyncDebugger.triggerManualSync(gameId) : null,
        watchChanges: () => gameId ? SyncDebugger.watchGameStateChanges(gameId) : null,
        syncOnChain,
    };
}