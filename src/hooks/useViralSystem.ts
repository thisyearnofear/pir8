'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameState, Player } from '../types/game';
import { buildAmbushShareText, buildChallengeUrl } from '@/lib/shareLinks';

// Consolidated viral event types
export type ViralEventType =
    | 'achievement'
    | 'viral_moment'
    | 'taunt'
    | 'victory'
    | 'defeat';

export interface ViralEvent {
    id: string;
    type: ViralEventType;
    title: string;
    description: string;
    emoji: string;
    shareText: string;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
    data?: any;
    timestamp: number;
}

interface ViralSystemState {
    currentEvent: ViralEvent | null;
    eventQueue: ViralEvent[];
    achievements: string[];
    viralMoments: ViralEvent[];
    shareCount: number;
}

interface UseViralSystemOptions {
    disableAutoDismiss?: boolean;
}

export function useViralSystem(
    gameState: GameState | null, 
    currentPlayer: Player | null,
    options: UseViralSystemOptions = {}
) {
    const { disableAutoDismiss = false } = options;
    
    const [state, setState] = useState<ViralSystemState>({
        currentEvent: null,
        eventQueue: [],
        achievements: [],
        viralMoments: [],
        shareCount: 0
    });

    // Consolidated event detection
    const detectEvents = useCallback((newGameState: GameState, player: Player, oldGameState?: GameState) => {
        const events: ViralEvent[] = [];
        const timestamp = Date.now();

        // Achievement detection
        const newAchievements = checkAchievements(newGameState, player);
        newAchievements.forEach(achievement => {
            if (!state.achievements.includes(achievement.id)) {
                events.push({
                    ...achievement,
                    type: 'achievement',
                    timestamp
                });
            }
        });

        // Viral moment detection
        if (oldGameState) {
            const moments = detectViralMoments(oldGameState, newGameState, player);
            events.push(...moments.map(moment => ({ ...moment, timestamp })));
        }

        // Victory/defeat detection
        if (newGameState.gameStatus === 'completed' && newGameState.winner) {
            const isWinner = newGameState.winner === player.publicKey;
            events.push({
                id: `game_end_${timestamp}`,
                type: isWinner ? 'victory' : 'defeat',
                title: isWinner ? 'PIRATE KING CROWNED!' : 'HONORABLE DEFEAT',
                description: isWinner ? 'You have conquered the seven seas!' : 'A worthy battle fought!',
                emoji: isWinner ? '👑' : '⚔️',
                shareText: generateShareText(isWinner ? 'victory' : 'defeat', newGameState, player),
                rarity: isWinner ? 'legendary' : 'common',
                timestamp
            });
        }

        return events;
    }, [state.achievements]);

    // Enhanced share handler
    const handleShare = useCallback((event: ViralEvent, platform?: 'twitter' | 'discord' | 'copy') => {
        const shareText = event.shareText;

        switch (platform) {
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
                break;
            case 'discord':
                navigator.clipboard.writeText(shareText);
                break;
            case 'copy':
            default:
                navigator.clipboard.writeText(shareText);
                break;
        }

        setState(prev => ({
            ...prev,
            shareCount: prev.shareCount + 1,
            currentEvent: null
        }));
    }, [setState]);

    // Queue management
    const showNextEvent = useCallback(() => {
        setState(prev => {
            if (prev.eventQueue.length === 0) return prev;

            const [nextEvent, ...remainingQueue] = prev.eventQueue;
            return {
                ...prev,
                currentEvent: nextEvent || null,
                eventQueue: remainingQueue
            };
        });
    }, [setState]);

    const dismissCurrentEvent = useCallback(() => {
        setState(prev => ({ ...prev, currentEvent: null }));
    }, [setState]);

    // Auto-show events from queue
    useEffect(() => {
        if (state.eventQueue.length > 0 && !state.currentEvent) {
            const timer = setTimeout(showNextEvent, 500);
            return () => clearTimeout(timer);
        }
        return undefined; // Explicit return for when condition is false
    }, [state.eventQueue.length, state.currentEvent, showNextEvent]);

    // Auto-dismiss events (disabled in practice mode)
    useEffect(() => {
        if (state.currentEvent && !disableAutoDismiss) {
            const dismissTime = state.currentEvent.rarity === 'legendary' ? 8000 : 5000;
            const timer = setTimeout(dismissCurrentEvent, dismissTime);
            return () => clearTimeout(timer);
        }
        return undefined; // Explicit return for when condition is false
    }, [state.currentEvent, dismissCurrentEvent, disableAutoDismiss]);

    // Main detection effect
    useEffect(() => {
        if (!gameState || !currentPlayer) return;

        const events = detectEvents(gameState, currentPlayer);

        if (events.length > 0) {
            setState(prev => ({
                ...prev,
                eventQueue: [...prev.eventQueue, ...events],
                achievements: [...prev.achievements, ...events.filter(e => e.type === 'achievement').map(e => e.id)],
                viralMoments: [...prev.viralMoments, ...events.filter(e => e.type === 'viral_moment')]
            }));
        }
    }, [gameState, currentPlayer, detectEvents]);

    return {
        currentEvent: state.currentEvent,
        hasEvents: state.eventQueue.length > 0,
        shareCount: state.shareCount,
        achievements: state.achievements,
        viralMoments: state.viralMoments,
        handleShare,
        dismissCurrentEvent,
        showNextEvent
    };
}

// Consolidated achievement checking
function checkAchievements(gameState: GameState, player: Player): ViralEvent[] {
    const achievements: ViralEvent[] = [];

    // First Blood
    const enemyShips = gameState.players
        .filter(p => p.publicKey !== player.publicKey)
        .flatMap(p => p.ships);
    if (enemyShips.some(ship => ship.health === 0)) {
        achievements.push({
            id: 'first_blood',
            type: 'achievement',
            title: 'First Blood',
            description: 'You revealed the first weakness in the enemy fleet.',
            emoji: '⚔️',
            shareText: `First blood in PIR8 Shadow Seas.\nScout hidden waters. Mask your fleet. Spring the ambush.\n${buildChallengeUrl()}\n#PIR8 #ShadowSeas`,
            rarity: 'common',
            timestamp: Date.now()
        });
    }

    // Pirate King
    if (gameState.winner === player.publicKey) {
        achievements.push({
            id: 'pirate_king',
            type: 'achievement',
            title: 'Shadow Admiral',
            description: 'Win your first game',
            emoji: '👑',
            shareText: `I won my first PIR8 Shadow Seas duel.\nThink you can beat my fleet?\n${buildChallengeUrl({ gameId: gameState.gameId })}\n#PIR8 #ShadowSeas`,
            rarity: 'legendary',
            timestamp: Date.now()
        });
    }

    // Add more achievements as needed...

    return achievements;
}

// Consolidated viral moment detection
function detectViralMoments(oldState: GameState, newState: GameState, player: Player): ViralEvent[] {
    const moments: ViralEvent[] = [];

    // Epic Battle detection
    const oldEnemyShips = oldState.players
        .filter(p => p.publicKey !== player.publicKey)
        .flatMap(p => p.ships)
        .filter(s => s.health > 0).length;

    const newEnemyShips = newState.players
        .filter(p => p.publicKey !== player.publicKey)
        .flatMap(p => p.ships)
        .filter(s => s.health > 0).length;

    const shipsDestroyed = oldEnemyShips - newEnemyShips;

    if (shipsDestroyed >= 3) {
        moments.push({
            id: `epic_battle_${Date.now()}`,
            type: 'viral_moment',
            title: 'AMBUSH REVEALED!',
            description: `Destroyed ${shipsDestroyed} enemy ships in one decisive turn.`,
            emoji: '💥',
            shareText: `Ambush revealed in PIR8 Shadow Seas.\n${shipsDestroyed} ships sunk in one turn.\nCan you survive the same board?\n${buildChallengeUrl({ gameId: newState.gameId })}\n#PIR8 #ShadowSeas`,
            rarity: 'epic',
            data: { shipsDestroyed },
            timestamp: Date.now()
        });
    }

    return moments;
}

// Consolidated share text generation
function generateShareText(type: string, gameState: GameState, player: Player): string {
    const gameUrl = buildChallengeUrl({ gameId: gameState.gameId });
    const winner = gameState.players.find(p => p.publicKey === gameState.winner);
    const winnerName = winner?.username || winner?.publicKey?.slice(0, 8) || 'Unknown captain';
    const shipsDestroyed = gameState.players.reduce((total, p) =>
        total + p.ships.filter(s => s.health === 0).length, 0
    );
    const territoriesControlled = winner?.controlledTerritories.length || 0;
    const gold = winner?.resources.gold || player.resources.gold;

    switch (type) {
        case 'victory':
            return buildAmbushShareText({
                url: gameUrl,
                winnerName,
                turnNumber: gameState.turnNumber,
                shipsDestroyed,
                territoriesControlled,
                gold,
                isWinner: true,
            });

        case 'defeat':
            return buildAmbushShareText({
                url: gameUrl,
                winnerName,
                turnNumber: gameState.turnNumber,
                shipsDestroyed,
                territoriesControlled,
                gold,
                isWinner: false,
            });

        default:
            return `PIR8 Shadow Seas is private naval tactics: scout, mask, reveal, ambush.\n${buildChallengeUrl()}\n#PIR8 #ShadowSeas`;
    }
}
