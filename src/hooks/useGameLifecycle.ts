/**
 * Consolidated Game Lifecycle Hook
 * Merges: useGameJoin + useGameSync + useGameIdRecovery
 * Following: ENHANCEMENT FIRST, AGGRESSIVE CONSOLIDATION, DRY principles
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePirateGameState, pirateGameStore } from './usePirateGameState';
import { useHeliusMonitor, GameEvent } from './useHeliusMonitor';
import { Player, GameState } from '@/types/game';
import { getAnchorClient } from '@/lib/server/anchorActions';
import { getGamePDA, getConfigPDA } from '@/lib/anchor';

// =============================================================================
// TYPES
// =============================================================================

export interface GameLifecycleOptions {
  gameId?: string;
  expectedPlayerCount?: number;
  onGameIdChanged?: (newGameId: string) => void;
  enableSync?: boolean;
}

export interface GameLifecycleState {
  // Join state
  isJoining: boolean;
  joinError: string | null;

  // Sync state
  isSyncing: boolean;
  heliusConnected: boolean;
  lastSync: number;

  // Recovery state
  isRecovering: boolean;
  currentPlayerCount: number;
}

export interface GameLifecycleActions {
  joinGame: (gameId: string, player: Player) => Promise<boolean>;
  clearJoinError: () => void;
  forceSync: () => Promise<void>;
  attemptRecovery: () => Promise<void>;
}

// =============================================================================
// HELPER FUNCTIONS (extracted for testability)
// =============================================================================

async function checkGamePlayerCount(gameId: string, expectedCount: number): Promise<boolean> {
  try {
    const { program } = await getAnchorClient();
    const gameIdNum = parseInt(gameId.replace(/[^\d]/g, ''), 10);
    if (isNaN(gameIdNum)) return false;

    const [gamePDA] = getGamePDA(gameIdNum);
    const gameAccount = await (program as any).account.game.fetch(gamePDA);

    const activePlayers = gameAccount.players.filter(
      (player: any) => player.key.toString() !== '11111111111111111111111111111111',
    ).length;

    return activePlayers === expectedCount;
  } catch (error) {
    return false;
  }
}

async function findCorrectGameId(expectedCount: number): Promise<string | null> {
  try {
    const { program } = await getAnchorClient();
    const [configPDA] = getConfigPDA();
    const configAccount = await (program as any).account.gameConfig.fetch(configPDA);
    const totalGames = configAccount.totalGames.toNumber();

    // Check last 5 games
    const gamesToCheck = Math.max(0, totalGames - 5);

    for (let gameId = gamesToCheck; gameId < totalGames; gameId++) {
      const hasCorrectPlayers = await checkGamePlayerCount(`onchain_${gameId}`, expectedCount);
      if (hasCorrectPlayers) {
        return `onchain_${gameId}`;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

// =============================================================================
// CONSOLIDATED HOOK
// =============================================================================

export function useGameLifecycle(options: GameLifecycleOptions = {}): GameLifecycleState & GameLifecycleActions {
  const { gameId, expectedPlayerCount = 2, onGameIdChanged, enableSync = true } = options;

  // Get store actions
  const { joinGame: joinGameStore, setGameState, setMessage, gameState } = usePirateGameState();

  // Join state
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(0);
  const lastVersionRef = useRef<number>(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Recovery state
  const [isRecovering, setIsRecovering] = useState(false);

  // ===========================================================================
  // JOIN FUNCTIONALITY (from useGameJoin)
  // ===========================================================================

  const joinGame = useCallback(async (targetGameId: string, player: Player): Promise<boolean> => {
    if (!targetGameId || !targetGameId.trim()) {
      setJoinError('Game ID is required');
      return false;
    }

    try {
      setIsJoining(true);
      setJoinError(null);

      // Call the store's joinGame (local state join)
      await joinGameStore(targetGameId, player, null);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join game';
      setJoinError(message);
      return false;
    } finally {
      setIsJoining(false);
    }
  }, [joinGameStore]);

  const clearJoinError = useCallback(() => setJoinError(null), [setJoinError]);

  // ===========================================================================
  // SYNC FUNCTIONALITY (from useGameSync)
  // ===========================================================================

  const performSync = useCallback(async () => {
    if (!gameId || isSyncing) return;

    try {
      setIsSyncing(true);

      const { fetchGlobalGameState } = await import('../lib/server/anchorActions');
      const onChainState = await fetchGlobalGameState();

      if (!onChainState) return;

      // Check if state actually changed
      const newVersion = onChainState.turnNumber * 1000 + onChainState.currentPlayerIndex;
      if (newVersion === lastVersionRef.current) {
        return; // No changes, skip update
      }

      lastVersionRef.current = newVersion;

      // Transform and update state
      const mappedPlayers: Player[] = onChainState.players.map((p: any) => ({
        id: p.pubkey.toString(),
        name: `Pirate ${p.pubkey.toString().slice(0, 4)}`,
        publicKey: p.pubkey.toString(),
        avatar: '/avatars/pirate1.png',
        resources: {
          gold: p.resources.gold,
          crew: p.resources.crew,
          cannons: p.resources.cannons,
          supplies: p.resources.supplies,
          rum: 0
        },
        ships: p.ships.map((s: any) => ({
          id: s.id,
          name: `${Object.keys(s.shipType)[0]}`,
          type: Object.keys(s.shipType)[0],
          stats: {
            health: s.health,
            maxHealth: s.maxHealth,
            attack: s.attack,
            defense: s.defense,
            speed: s.speed,
            range: 1,
            cargoCapacity: 100
          },
          position: { x: s.positionX, y: s.positionY },
          ownerId: p.pubkey.toString()
        })),
        controlledTerritories: p.controlledTerritories,
        totalScore: p.totalScore,
        isActive: p.isActive,
        scanCharges: p.scanCharges || 3,
        scannedCoordinates: p.scannedCoordinates || [],
        speedBonusAccumulated: p.speedBonusAccumulated || 0,
        averageDecisionTimeMs: p.averageDecisionTimeMs || 0,
        totalMoves: p.totalMoves || 0
      }));

      const rawStatus = onChainState.status ? Object.keys(onChainState.status)[0] : 'waiting';
      const statusKey = (rawStatus || 'waiting').toLowerCase();

      const updatedGameState: GameState = {
        ...gameState,
        players: mappedPlayers,
        gameStatus: statusKey as 'waiting' | 'active' | 'completed',
        currentPlayerIndex: onChainState.currentPlayerIndex,
        turnNumber: onChainState.turnNumber,
      };

      setGameState(updatedGameState);
      setLastSync(Date.now());
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [gameId, gameState, setGameState, isSyncing]);

  // Debounced sync (500ms)
  const debouncedSync = useCallback(() => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(performSync, 500);
  }, [performSync]);

  const forceSync = useCallback(async () => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    await performSync();
  }, [performSync]);

  // Handle Helius events
  const handleHeliusEvent = useCallback((event: GameEvent) => {
    setMessage(`⚡ ${event.type}`);
    debouncedSync();
  }, [debouncedSync, setMessage]);

  // Set up Helius monitor
  const { isConnected: heliusConnected } = useHeliusMonitor({
    gameId,
    onGameEvent: handleHeliusEvent
  });

  // Set up polling fallback and initial sync
  useEffect(() => {
    if (!enableSync || !gameId) return;

    // Initial sync
    debouncedSync();

    // Polling fallback (30 seconds)
    pollIntervalRef.current = setInterval(debouncedSync, 30000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [gameId, enableSync, debouncedSync]);

  // ===========================================================================
  // RECOVERY FUNCTIONALITY (from useGameIdRecovery)
  // ===========================================================================

  const attemptRecovery = useCallback(async () => {
    if (!gameId || expectedPlayerCount <= 1 || isRecovering) return;

    setIsRecovering(true);

    try {
      const currentState = pirateGameStore.getState().gameState;
      if (!currentState) return;

      const currentPlayerCount = currentState.players.length;

      // Only attempt recovery if we're missing players
      if (currentPlayerCount >= expectedPlayerCount) {
        return;
      }

      // Try to find the correct game
      const correctGameId = await findCorrectGameId(expectedPlayerCount);

      if (correctGameId && correctGameId !== gameId) {
        // Update the game state with new game ID
        const updatedGameState = {
          ...currentState,
          gameId: correctGameId,
        };

        pirateGameStore.getState().setGameState(updatedGameState);
        onGameIdChanged?.(correctGameId);

        // Trigger a page reload to fully reset the game state
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('[Game Recovery] Error during recovery:', error);
    } finally {
      setIsRecovering(false);
    }
  }, [gameId, expectedPlayerCount, onGameIdChanged, isRecovering]);

  // ===========================================================================
  // RETURN CONSOLIDATED INTERFACE
  // ===========================================================================

  return {
    // State
    isJoining,
    joinError,
    isSyncing,
    heliusConnected,
    lastSync,
    isRecovering,
    currentPlayerCount: gameState?.players.length || 0,

    // Actions
    joinGame,
    clearJoinError,
    forceSync,
    attemptRecovery,
  };
}

export default useGameLifecycle;
