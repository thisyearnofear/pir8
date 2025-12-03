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
import { getAnchorClient } from '@/lib/anchorClient';
import { joinGamePrivateViaZcash } from '@/lib/anchorClient';
import { ZCASH_CONFIG } from '@/utils/constants';
import { usePirateGameState } from './usePirateGameState';

interface UseZcashBridgeOptions {
  enabled?: boolean;
  onEntrySuccess?: (payload: MemoPayload, solanaTx: string) => void;
  onEntryError?: (error: Error, payload?: MemoPayload) => void;
}

export function useZcashBridge(options: UseZcashBridgeOptions = {}) {
  const { enabled = true, onEntrySuccess, onEntryError } = options;
  const watcherRef = useRef<LightwalletdWatcher | null>(null);
  const { gameState } = usePirateGameState();

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

        // Get Anchor client for transaction
        const { program, provider } = await getAnchorClient();

        // Execute private join_game instruction
        const solanaTx = await joinGamePrivateViaZcash(program, provider, {
          gameId: payload.gameId,
          solanaPubkey: payload.solanaPubkey,
          zcashTxHash: payload.zcashTxHash,
          blockHeight: payload.blockHeight,
        });

        console.log('[Zcash Bridge] Private entry successful:', solanaTx);
        onEntrySuccess?.(payload, solanaTx);
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
    if (!enabled || !ZCASH_CONFIG.SHIELDED_ADDRESS) {
      console.warn('[Zcash Bridge] Disabled or shielded address not configured');
      return;
    }

    try {
      // Create watcher if not exists
      if (!watcherRef.current) {
        watcherRef.current = new LightwalletdWatcher(
          handleMemoEntry,
          ZCASH_CONFIG.SHIELDED_ADDRESS
        );
      }

      // Connect to Lightwalletd
      watcherRef.current.connect();
      console.log('[Zcash Bridge] Connected to Lightwalletd');

      // Cleanup on unmount
      return () => {
        if (watcherRef.current) {
          watcherRef.current.disconnect();
          watcherRef.current = null;
          console.log('[Zcash Bridge] Disconnected');
        }
      };
    } catch (error) {
      console.error('[Zcash Bridge] Initialization failed:', error);
      onEntryError?.(
        error instanceof Error ? error : new Error('Bridge init failed')
      );
    }
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
export function getPrivateEntryInstructions(gameId: string, playerPubkey: string): string {
  const { ZcashMemoBridge } = require('@/lib/integrations');
  return ZcashMemoBridge.getPrivateEntryInstructions(gameId, playerPubkey);
}
