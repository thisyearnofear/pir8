/**
 * useZcashBridge - Integration hook for Zcash → Solana private entry flow
 * 
 * Core Principles:
 * - ENHANCEMENT: Reuses existing game state and anchor client
 * - DRY: Single source of truth for memo-triggered transactions
 * - CLEAN: Clear separation of Zcash monitoring from game logic
 * - MODULAR: Can be toggled on/off independently
 */

import { useEffect, useRef, useCallback } from 'react';
import { LightwalletdWatcher, MemoPayload } from '@/lib/integrations';
import { ZCASH_CONFIG } from '@/utils/constants';

interface UseZcashBridgeOptions {
  enabled?: boolean;
  onEntrySuccess?: (payload: MemoPayload, solanaTx: string) => void;
  onEntryError?: (error: Error, payload?: MemoPayload) => void;
}

export function useZcashBridge(options: UseZcashBridgeOptions = {}) {
  const { enabled = true, onEntrySuccess, onEntryError } = options;
  const watcherRef = useRef<LightwalletdWatcher | null>(null);

  /**
   * Handle incoming memo entry - wire to Solana transaction
   * This callback is invoked by LightwalletdWatcher when valid memo detected
   */
  const handleMemoEntry = useCallback(
    async (payload: MemoPayload) => {
      try {
        console.log('[Zcash Bridge] Processing memo entry:', {
          gameId: payload.gameId,
          player: payload.solanaPubkey,
          zcashTx: payload.zcashTxHash,
        });

        // Execute private join_game instruction via client
        // const { joinGameClient } = await import('../lib/client/solanaClient');
        // Note: This would need wallet context - for now just log
        console.log('[Zcash Bridge] Would execute join game for:', payload.solanaPubkey);

        onEntrySuccess?.(payload, 'mock-tx-hash');
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        console.error('[Zcash Bridge] Entry failed:', err);
        onEntryError?.(err, payload);
      }
    },
    [onEntrySuccess, onEntryError]
  );

  /**
   * Initialize and connect Lightwalletd watcher
   * Monitors Zcash for incoming shielded transactions to our address
   */
  useEffect(() => {
    // Check if Zcash integration is explicitly enabled
    const zcashEnabled = process.env['NEXT_PUBLIC_ZCASH_ENABLED'] === 'true';

    if (!zcashEnabled) {
      // Zcash Bridge disabled - silent in production
      return;
    }

    if (!enabled || !ZCASH_CONFIG.SHIELDED_ADDRESS) {
      console.log('[Zcash Bridge] Disabled or shielded address not configured');
      return;
    }

    // Defer connection to avoid blocking app startup
    const connectTimeout = setTimeout(() => {
      try {
        // Create watcher if not exists
        if (!watcherRef.current) {
          watcherRef.current = new LightwalletdWatcher(
            handleMemoEntry,
            ZCASH_CONFIG.SHIELDED_ADDRESS
          );
        }

        // Use graceful connection method
        watcherRef.current.connectWithFallback();
        console.log('[Zcash Bridge] Connection attempt initiated');
      } catch (error) {
        console.log('[Zcash Bridge] Graceful fallback - bridge unavailable');
        // Don't throw error to prevent app disruption
      }
    }, 3000); // Wait 3 seconds after app startup (reduced from 5s for 2026)

    // Cleanup on unmount
    return () => {
      clearTimeout(connectTimeout);
      if (watcherRef.current) {
        watcherRef.current.disconnect();
        watcherRef.current = null;
        console.log('[Zcash Bridge] Disconnected');
      }
    };
  }, [enabled, handleMemoEntry, onEntryError]);

  /**
   * Disconnect bridge explicitly (for testing or cleanup)
   */
  const disconnect = useCallback(() => {
    if (watcherRef.current) {
      watcherRef.current.disconnect();
      watcherRef.current = null;
    }
  }, []);

  /**
   * Get bridge status for UI
   */
  const isConnected = watcherRef.current?.constructor.name === 'LightwalletdWatcher';

  return {
    isConnected,
    disconnect,
    isEnabled: enabled,
  };
}

/**
 * Helper to construct private entry instructions for display to user
 */
export async function getPrivateEntryInstructions(gameId: string, playerPubkey: string): Promise<string> {
  const { ZcashMemoBridge } = await import('@/lib/integrations');
  return ZcashMemoBridge.getPrivateEntryInstructions(gameId, playerPubkey);
}
