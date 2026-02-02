/**
 * useSpectatorMode - Read-only game viewing without wallet connection
 * Allows users to watch live games as a teaser before joining
 * Following: ENHANCEMENT FIRST, CLEAN separation of concerns
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '@/types/game';

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
// MOCK DATA FOR DEMO (replace with real API calls)
// =============================================================================

const generateMockGameState = (gameId: string): GameState => {
  const now = Date.now();
  return {
    gameId,
    players: [
      {
        publicKey: 'Player1...xyz',
        username: 'Blackbeard',
        resources: { gold: 1500, crew: 75, cannons: 20, supplies: 150, wood: 0, rum: 0 },
        ships: [
          { id: 's1', type: 'sloop', health: 80, maxHealth: 100, attack: 25, defense: 10, speed: 3, position: { x: 2, y: 3 }, resources: { gold: 0, crew: 0, cannons: 0, supplies: 0, wood: 0, rum: 0 }, ability: { name: 'Spy Glass', description: 'Reveal fog of war', cooldown: 2, currentCooldown: 0, isReady: true, type: 'utility' }, activeEffects: [] },
          { id: 's2', type: 'frigate', health: 150, maxHealth: 200, attack: 40, defense: 25, speed: 2, position: { x: 3, y: 4 }, resources: { gold: 0, crew: 0, cannons: 0, supplies: 0, wood: 0, rum: 0 }, ability: { name: 'Broadside', description: 'Attack 2 targets', cooldown: 3, currentCooldown: 0, isReady: true, type: 'offensive' }, activeEffects: [] },
        ],
        controlledTerritories: ['2,3', '3,3'],
        totalScore: 2500,
        isActive: true,
        scanCharges: 2,
        scannedCoordinates: [],
        speedBonusAccumulated: 150,
        averageDecisionTimeMs: 8500,
        totalMoves: 12,
        consecutiveAttacks: 1,
        lastActionWasAttack: true,
      },
      {
        publicKey: 'Player2...abc',
        username: 'Calico Jack',
        resources: { gold: 1200, crew: 60, cannons: 15, supplies: 120, wood: 0, rum: 0 },
        ships: [
          { id: 's3', type: 'galleon', health: 280, maxHealth: 350, attack: 60, defense: 40, speed: 1, position: { x: 6, y: 6 }, resources: { gold: 0, crew: 0, cannons: 0, supplies: 0, wood: 0, rum: 0 }, ability: { name: 'Fortress Mode', description: '+50% defense', cooldown: 3, currentCooldown: 0, isReady: true, type: 'defensive' }, activeEffects: [] },
        ],
        controlledTerritories: ['6,6', '6,7'],
        totalScore: 1800,
        isActive: true,
        scanCharges: 1,
        scannedCoordinates: [],
        speedBonusAccumulated: 75,
        averageDecisionTimeMs: 12000,
        totalMoves: 8,
        consecutiveAttacks: 0,
        lastActionWasAttack: false,
      },
    ],
    currentPlayerIndex: 0,
    gameMap: {
      size: 10,
      cells: Array(10).fill(null).map((_, x) =>
        Array(10).fill(null).map((_, y) => ({
          coordinate: `${x},${y}`,
          type: (() => {
            const rand = Math.random();
            if (rand < 0.6) return 'water';
            if (rand < 0.75) return 'island';
            if (rand < 0.85) return 'port';
            if (rand < 0.92) return 'treasure';
            if (rand < 0.97) return 'storm';
            return 'reef';
          })() as any,
          owner: null,
          resources: {},
          isContested: false,
        }))
      ),
    },
    gameStatus: 'active',
    currentPhase: 'movement',
    turnNumber: 15,
    turnTimeRemaining: 35000,
    pendingActions: [],
    eventLog: [
      { id: 'e1', type: 'ship_moved', playerId: 'Player1...xyz', turnNumber: 15, timestamp: now - 5000, description: 'Blackbeard moved Sloop Alpha to B3', data: {} },
      { id: 'e2', type: 'territory_claimed', playerId: 'Player2...abc', turnNumber: 14, timestamp: now - 45000, description: 'Calico Jack claimed port at G7', data: {} },
      { id: 'e3', type: 'ship_attacked', playerId: 'Player1...xyz', turnNumber: 13, timestamp: now - 95000, description: 'Blackbeard attacked Calico Jack for 35 damage', data: {} },
    ],
    globalWeather: { type: 'calm', duration: 2, effect: { resourceModifier: 1.2, movementModifier: 1.0 } },
  };
};

// =============================================================================
// HOOK
// =============================================================================

export function useSpectatorMode(options: SpectatorOptions = {}): SpectatorState & SpectatorActions {
  const {
    gameId: initialGameId,
    autoRefresh = true,
    refreshInterval = 10000 // 10 seconds
  } = options;

  const [gameId, setGameId] = useState<string | undefined>(initialGameId);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(0);
  const [isLive, setIsLive] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch game state (mock implementation - replace with real API)
  const fetchGameState = useCallback(async (targetGameId: string): Promise<GameState | null> => {
    // TODO: Replace with actual API call
    // const response = await fetch(`/api/game/${targetGameId}/state`);
    // return response.json();

    // Mock: Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateMockGameState(targetGameId);
  }, []);

  // Refresh game state
  const refresh = useCallback(async () => {
    if (!gameId) {
      setError('No game ID specified');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const state = await fetchGameState(gameId);
      if (state) {
        setGameState(state);
        setLastUpdate(Date.now());
        setIsLive(state.gameStatus === 'active');
      } else {
        setError('Game not found');
        setIsLive(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch game state');
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
