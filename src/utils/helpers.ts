/**
 * Shared utility helpers for PIR8
 * Following: DRY, AGGRESSIVE CONSOLIDATION
 */

import { GameState, Player } from '../types/game';
import { PirateGameManager } from '../lib/pirateGameEngine';

/**
 * Maps raw Anchor on-chain game state to the local UI-compatible GameState
 */
export function mapOnChainToLocal(onChain: any, gameId: string): GameState {
  const mappedPlayers: Player[] = onChain.players.map((p: any) => ({
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
      name: `${Object.keys(s.shipType || {})[0]}`,
      type: Object.keys(s.shipType || {})[0]?.toLowerCase() || 'sloop',
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

  const rawStatus = onChain.status ? Object.keys(onChain.status)[0] : 'waiting';
  const statusKey = (rawStatus || 'waiting').toLowerCase();

  return {
    gameId,
    players: mappedPlayers,
    gameStatus: statusKey as 'waiting' | 'active' | 'completed',
    currentPlayerIndex: onChain.currentPlayerIndex,
    turnNumber: onChain.turnNumber,
    gameMap: PirateGameManager.createGameMap(5), // Placeholder for map sync
    currentPhase: 'combat', // Standardized phase
    eventLog: [],
    pendingActions: [],
  };
}

/**
 * Calculates visible coordinates around a center point (Fog of War)
 * Returns array of "x,y" strings
 */
export function getVisibleCoordinates(x: number, y: number, range: number = 1): string[] {
  const coords: string[] = [];
  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {
      coords.push(`${x + dx},${y + dy}`);
    }
  }
  return coords;
}
