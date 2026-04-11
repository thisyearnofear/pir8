/**
 * useSpectatorMode - Read-only game viewing without wallet connection
 * Allows users to watch live games as a teaser before joining
 * Following: ENHANCEMENT FIRST, CLEAN separation of concerns
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { GameState } from "@/types/game";

// =============================================================================
// TYPES
// =============================================================================

export interface SpectatorOptions {
  gameId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface SpectatorState {
  gameState: GameState | null;
  isLoading: boolean;
  error: string | null;
  lastUpdate: number;
  isLive: boolean;
}

export interface SpectatorActions {
  refresh: () => Promise<void>;
  clearError: () => void;
  setGameId: (gameId: string) => void;
}

// =============================================================================
// HOOK
// =============================================================================

export function useSpectatorMode(
  options: SpectatorOptions = {},
): SpectatorState & SpectatorActions {
  const {
    gameId: initialGameId,
    autoRefresh = true,
    refreshInterval = 10000, // 10 seconds
  } = options;

  const [gameId, setGameId] = useState<string | undefined>(initialGameId);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(0);
  const [isLive, setIsLive] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch game state from blockchain (client-side)
  const fetchGameState = useCallback(
    async (targetGameId: string): Promise<GameState | null> => {
      // Use client-side fetching instead of API route (Cloudflare Workers compatible)
      const { fetchGameStateClient } = await import('@/lib/client/gameStateClient');
      const gameState = await fetchGameStateClient(parseInt(targetGameId, 10));
      return gameState;
    },
    [],
  );

  // Refresh game state
  const refresh = useCallback(async () => {
    if (!gameId) {
      setError("No game ID specified");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const state = await fetchGameState(gameId);
      if (state) {
        setGameState(state);
        setLastUpdate(Date.now());
        setIsLive(state.gameStatus === "active");
      } else {
        setError("Game not found");
        setIsLive(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch game state",
      );
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, [gameId, fetchGameState]);

  // Clear error
  const clearError = useCallback(() => setError(null), [setError]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !gameId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    refresh();

    // Set up interval
    intervalRef.current = setInterval(refresh, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, gameId, refreshInterval, refresh]);

  return {
    // State
    gameState,
    isLoading,
    error,
    lastUpdate,
    isLive,

    // Actions
    refresh,
    clearError,
    setGameId,
  };
}

export default useSpectatorMode;
