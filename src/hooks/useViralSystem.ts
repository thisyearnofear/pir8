'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameState, Player } from '../types/game';

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
            description: 'Sink your first enemy ship',
            emoji: '⚔️',
            shareText: '⚔️ Just drew first blood in @PIR8Game! Enemy ship sent to Davy Jones\' locker! #PIR8Game #FirstBlood',
            rarity: 'common',
            timestamp: Date.now()
        });
    }

    // Pirate King
    if (gameState.winner === player.publicKey) {
        achievements.push({
            id: 'pirate_king',
            type: 'achievement',
            title: 'Pirate King',
            description: 'Win your first game',
            emoji: '👑',
            shareText: '👑 PIRATE KING CROWNED! Just conquered my first battle in @PIR8Game! The seas have a new ruler! #PIR8Game #PirateKing',
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
            title: 'NAVAL MASSACRE!',
            description: `Destroyed ${shipsDestroyed} enemy ships in one devastating turn!`,
            emoji: '💥',
            shareText: `💥 NAVAL MASSACRE! Just destroyed ${shipsDestroyed} enemy ships in one turn in @PIR8Game! The seas run red! ⚔️ #PIR8Game #EpicBattle`,
            rarity: 'epic',
            data: { shipsDestroyed },
            timestamp: Date.now()
        });
    }

    return moments;
}

// Consolidated share text generation
function generateShareText(type: string, gameState: GameState, player: Player): string {
    const baseUrl = window.location.origin;
    const gameUrl = `${baseUrl}?join=${gameState.gameId}`;

    switch (type) {
        case 'victory':
            return `👑 PIRATE KING CROWNED! Just dominated the seven seas in @PIR8Game!\n` +
                `💰 Plundered ${player.resources.gold.toLocaleString()} gold\n` +
                `🏆 Victory in ${gameState.turnNumber} turns\n\n` +
                `Think you can challenge the new Pirate King? ⚓\n` +
                `🎮 ${gameUrl}\n\n` +
                `#PIR8Game #PirateKing #Web3Gaming #Solana`;

        case 'defeat':
            const winner = gameState.players.find(p => p.publicKey === gameState.winner);
            return `🏴‍☠️ Epic naval battle just ended!\n` +
                `${winner?.username || 'Unknown'} claimed the Pirate King crown in @PIR8Game\n` +
                `⚔️ ${gameState.turnNumber} turns of strategic warfare\n\n` +
                `Ready to challenge for the crown? ⚓\n` +
                `🎮 ${gameUrl}\n\n` +
                `#PIR8Game #NavalWarfare #Web3Gaming`;

        default:
            return `🏴‍☠️ Epic battles await in @PIR8Game! ⚔️\n${gameUrl}\n#PIR8Game #Web3Gaming`;
    }
}