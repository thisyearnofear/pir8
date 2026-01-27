'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePirateGameState } from './usePirateGameState';
import { useHeliusMonitor, GameEvent } from './useHeliusMonitor';
import { Player, GameState } from '@/types/game';

/**
 * Consolidated game synchronization hook
 * Combines Helius WebSocket (real-time) with polling (fallback)
 * Uses debouncing to prevent race conditions
 */
export const useGameSync = (gameId?: string) => {
    const { gameState, setMessage, setError, setGameState } = usePirateGameState();
    const lastSyncRef = useRef<number>(0);
    const lastVersionRef = useRef<number>(0);
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isSyncingRef = useRef<boolean>(false);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced sync function (500ms debounce)
    const debouncedSync = useCallback(async () => {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

        syncTimeoutRef.current = setTimeout(async () => {
            if (isSyncingRef.current || !gameId) return;

            try {
                isSyncingRef.current = true;

                // Import dynamically to avoid circular dependencies
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

                const statusKey = Object.keys(onChainState.status)[0].toLowerCase();

                const updatedGameState: GameState = {
                    ...gameState,
                    players: mappedPlayers,
                    gameStatus: statusKey as 'waiting' | 'active' | 'completed',
                    currentPlayerIndex: onChainState.currentPlayerIndex,
                    turnNumber: onChainState.turnNumber,
                };

                setGameState(updatedGameState);
                lastSyncRef.current = Date.now();

                console.log('✅ Game state synced via consolidated hook');
            } catch (error) {
                console.error('Sync error:', error);
                // Don't show error to user for sync failures, just log
            } finally {
                isSyncingRef.current = false;
            }
        }, 500); // 500ms debounce
    }, [gameId, gameState, setGameState]);

    // Handle Helius events
    const handleHeliusEvent = useCallback((event: GameEvent) => {
        console.log('🎮 Game event:', event.type);
        setMessage(`⚡ ${event.type}`);
        debouncedSync(); // Trigger sync on event
    }, [debouncedSync, setMessage]);

    // Set up Helius monitor
    const { isConnected: heliusConnected } = useHeliusMonitor({
        gameId,
        onGameEvent: handleHeliusEvent
    });

    // Set up polling fallback (30 seconds)
    useEffect(() => {
        if (gameId) {
            // Initial sync
            debouncedSync();

            // Polling fallback
            pollIntervalRef.current = setInterval(() => {
                debouncedSync();
            }, 30000);

            return () => {
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            };
        }
    }, [gameId, debouncedSync]);

    return {
        isSyncing: isSyncingRef.current,
        heliusConnected,
        lastSync: lastSyncRef.current,
        forceSync: debouncedSync,
    };
};