'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePirateGameState } from './usePirateGameState';
import { useHeliusMonitor, GameEvent } from './useHeliusMonitor';
import { Player, GameState } from '@/types/game';
import { getAnchorClient } from '@/lib/server/anchorActions';

/**
 * Hook to synchronize local game state with on-chain data
 * Handles real-time updates via Helius WebSocket and periodic polling
 */
export const useOnChainSync = (gameId?: string) => {
    const { gameState, setMessage, setError, setGameState } = usePirateGameState();
    const lastSyncRef = useRef<number>(0);
    const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isSyncingRef = useRef<boolean>(false);

    // Parse game ID number from various formats
    const parseGameId = useCallback((id: string): number | null => {
        if (!id) return null;

        // Handle formats: "pirate_5", "onchain_5", "5"
        const match = id.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : null;
    }, []);

    // Fetch current game state from on-chain
    const fetchOnChainGameState = useCallback(async (gameIdNumber: number): Promise<{
        players: Player[];
        gameStatus: string;
        currentPlayerIndex: number;
    } | null> => {
        try {
            const { program } = await getAnchorClient();

            // Get game PDA and fetch account data
            const { getGamePDA } = await import('@/lib/anchor');
            const [gamePDA] = getGamePDA(gameIdNumber);

            const gameAccount = await program.account.game.fetch(gamePDA);

            // Transform on-chain data to local format
            const players: Player[] = gameAccount.players
                .filter((player: any) => player.key.toString() !== '11111111111111111111111111111111') // Filter out zero key
                .map((player: any) => ({
                    publicKey: player.key.toString(),
                    username: `Player_${player.key.toString().slice(0, 6)}`,
                    resources: {
                        gold: player.resources?.gold?.toNumber() || 0,
                        crew: player.resources?.crew?.toNumber() || 0,
                        cannons: player.resources?.cannons?.toNumber() || 0,
                        supplies: player.resources?.supplies?.toNumber() || 0,
                    },
                    ships: [], // Ships are managed locally for now
                    controlledTerritories: [], // Territories are managed locally for now
                    totalScore: player.score?.toNumber() || 0,
                    isActive: player.isActive,
                }));

            const gameStatus = players.length >= 2 ? 'active' : 'waiting';
            const currentPlayerIndex = 0; // For now, always start with first player

            return { players, gameStatus, currentPlayerIndex };
        } catch (error) {
            console.error('Failed to fetch on-chain game state:', error);
            return null;
        }
    }, []);

    // Sync local state with on-chain data
    const syncWithOnChain = useCallback(async () => {
        // Prevent concurrent sync operations
        if (isSyncingRef.current) {
            console.log('Sync already in progress, skipping');
            return;
        }

        if (!gameId) return;

        try {
            isSyncingRef.current = true;
            const gameIdNumber = parseGameId(gameId);
            if (!gameIdNumber) return;

            const onChainData = await fetchOnChainGameState(gameIdNumber);
            if (!onChainData) return;

            // Get current game state safely
            const currentState = gameState;
            if (!currentState) return;

            // Compare player counts to detect changes
            const localPlayerCount = currentState.players.length;
            const onChainPlayerCount = onChainData.players.length;

            // Only update if there are changes or it's been a while
            const now = Date.now();
            const shouldSync = onChainPlayerCount !== localPlayerCount ||
                (now - lastSyncRef.current) > 30000; // Sync every 30 seconds

            if (shouldSync) {
                console.log(`🔄 Syncing game ${gameId}: ${localPlayerCount} -> ${onChainPlayerCount} players`);

                // Update local game state directly
                const updatedGameState: GameState = {
                    ...currentState,
                    players: onChainData.players,
                    gameStatus: onChainData.gameStatus as any,
                    currentPlayerIndex: onChainData.currentPlayerIndex,
                    turnNumber: currentState.turnNumber || 1,
                    currentPhase: currentState.currentPhase || 'deployment',
                    gameMap: currentState.gameMap,
                    pendingActions: currentState.pendingActions || [],
                    eventLog: currentState.eventLog || [],
                };

                // Update state safely and trigger React re-render
                setGameState(updatedGameState);
                lastSyncRef.current = now;

                // Force a small delay to ensure state update is processed
                setTimeout(() => {
                    console.log('✅ Sync completed:', {
                        gameId,
                        playerCount: updatedGameState.players.length,
                        status: updatedGameState.gameStatus
                    });
                }, 100);

                // Show sync message if players were added
                if (onChainPlayerCount > localPlayerCount) {
                    const newPlayers = onChainData.players.slice(localPlayerCount);
                    setMessage(`👥 ${newPlayers.length} new player(s) joined via blockchain!`);
                    setTimeout(() => setMessage(null), 4000);
                }
            }
        } catch (error) {
            console.error('Sync error:', error);
            setError(error instanceof Error ? error.message : 'Sync failed');
        } finally {
            isSyncingRef.current = false;
        }
    }, [gameId, gameState, parseGameId, fetchOnChainGameState, setMessage, setError, setGameState]);

    // Handle real-time game events from Helius
    const handleGameEvent = useCallback((event: GameEvent) => {
        console.log('🎮 Game event received:', event);

        switch (event.type) {
            case 'playerJoined':
                setMessage('⚡ Player joined via blockchain!');
                // Trigger sync to get latest player data
                setTimeout(() => {
                    if (!isSyncingRef.current) {
                        syncWithOnChain();
                    }
                }, 1000);
                break;
            case 'gameCreated':
                setMessage('🎯 New game detected on-chain');
                break;
            case 'gameStarted':
                setMessage('🚀 Battle commenced on-chain!');
                break;
            case 'moveMade':
                setMessage('⚔️ Move executed on-chain');
                break;
            case 'gameCompleted':
                setMessage('🏆 Game completed on-chain!');
                break;
        }
    }, [syncWithOnChain, setMessage]);

    // Set up Helius monitor for real-time events
    const { isConnected: heliusConnected } = useHeliusMonitor({
        gameId: gameId ? parseGameId(gameId)?.toString() : undefined,
        onGameEvent: handleGameEvent
    });

    // Set up periodic sync as backup
    useEffect(() => {
        if (gameId) {
            // Sync immediately
            const doInitialSync = () => {
                if (!isSyncingRef.current) {
                    syncWithOnChain();
                }
            };
            doInitialSync();

            // Set up periodic sync every 30 seconds
            syncIntervalRef.current = setInterval(() => {
                if (!isSyncingRef.current) {
                    syncWithOnChain();
                }
            }, 30000);

            return () => {
                if (syncIntervalRef.current) {
                    clearInterval(syncIntervalRef.current);
                    syncIntervalRef.current = null;
                }
            };
        }
    }, [gameId]); // Remove syncWithOnChain from dependencies to prevent infinite loops

    return {
        isSyncing: false, // Could be enhanced with loading state
        heliusConnected,
        lastSync: lastSyncRef.current,
        forceSync: syncWithOnChain,
    };
};