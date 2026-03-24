/**
 * Shared utility helpers for PIR8
 * Following: DRY, AGGRESSIVE CONSOLIDATION
 */

import { GameState, Player } from "../types/game";
import { PirateGameManager } from "../lib/pirateGameEngine";
import { GAME_CONFIG } from "./constants";

const DEFAULT_MAP_SIZE = GAME_CONFIG.MAP_SIZE;

const getEnumKey = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>);
    return keys[0] || "";
  }
  return "";
};

const normalizeTerritoryType = (rawType: unknown) => {
  const normalized = getEnumKey(rawType).toLowerCase();
  if (
    normalized === "water" ||
    normalized === "island" ||
    normalized === "port" ||
    normalized === "treasure" ||
    normalized === "storm" ||
    normalized === "reef" ||
    normalized === "whirlpool"
  ) {
    return normalized;
  }
  return "water";
};

const getCellResources = (type: string) => {
  if (type === "island") return { supplies: 3 };
  if (type === "port") return { gold: 5, crew: 2 };
  if (type === "treasure") return { gold: 10 };
  return {};
};

const mapTerritoryMap = (onChain: any) => {
  const baseMap = PirateGameManager.createGameMap(DEFAULT_MAP_SIZE);
  const flatMap = onChain?.territoryMap;

  if (!Array.isArray(flatMap) || flatMap.length === 0) {
    return baseMap;
  }

  const inferredSize = Math.sqrt(flatMap.length);
  const size = Number.isInteger(inferredSize) ? inferredSize : DEFAULT_MAP_SIZE;

  const cells = Array.from({ length: size }, (_, x) =>
    Array.from({ length: size }, (_, y) => {
      const index = x * size + y;
      const cell = flatMap[index];
      const type = normalizeTerritoryType(cell?.cellType);
      const owner = cell?.owner ? cell.owner.toString() : null;

      return {
        coordinate: `${x},${y}`,
        type,
        owner,
        resources: getCellResources(type),
        isContested: false,
      };
    }),
  );

  return { size, cells };
};

/**
 * Maps raw Anchor on-chain game state to the local UI-compatible GameState
 */
export function mapOnChainToLocal(onChain: any, gameId: string): GameState {
  const players = Array.isArray(onChain?.players) ? onChain.players : [];

  const mappedPlayers: Player[] = players.map((p: any) => ({
    publicKey: p.pubkey?.toString() || "unknown",
    username: `Pirate ${(p.pubkey?.toString() || "unknown").slice(0, 4)}`,
    resources: {
      gold: p.resources?.gold || 0,
      crew: p.resources?.crew || 0,
      cannons: p.resources?.cannons || 0,
      supplies: p.resources?.supplies || 0,
      wood: 0,
      rum: 0,
    },
    ships: (p.ships || []).map((s: any) => ({
      id: s.id,
      type: (getEnumKey(s.shipType).toLowerCase() as any) || "sloop",
      health: s.health,
      maxHealth: s.maxHealth,
      attack: s.attack,
      defense: s.defense,
      speed: s.speed,
      position: { x: s.positionX, y: s.positionY },
      resources: {
        gold: 0,
        crew: 0,
        cannons: 0,
        supplies: 0,
        wood: 0,
        rum: 0,
      },
      ability: {
        name: "Attack",
        description: "Basic attack",
        cooldown: 0,
        currentCooldown: 0,
        isReady: true,
        type: "offensive" as const,
      },
      activeEffects: [],
    })),
    controlledTerritories: p.controlledTerritories || [],
    totalScore: p.totalScore || 0,
    isActive: p.isActive ?? true,
    scanCharges: p.scanCharges || 3,
    scannedCoordinates: p.scannedCoordinates || [],
    speedBonusAccumulated: p.speedBonusAccumulated || 0,
    averageDecisionTimeMs: p.averageDecisionTimeMs || 0,
    totalMoves: p.totalMoves || 0,
    consecutiveAttacks: 0,
    lastActionWasAttack: false,
    eloRating: p.eloRating || 1200,
    gamesPlayed: p.gamesPlayed || 0,
    wins: p.wins || 0,
    losses: p.losses || 0,
  }));

  const rawStatus = onChain.status ? Object.keys(onChain.status)[0] : "waiting";
  const statusKey = (rawStatus || "waiting").toLowerCase();

  const rawMode = getEnumKey(onChain?.mode);
  let gameMode = "Casual";
  if (rawMode.toLowerCase() === "competitive") gameMode = "Competitive";
  if (
    rawMode.toLowerCase() === "agentarena" ||
    rawMode.toLowerCase() === "agent_arena"
  )
    gameMode = "AgentArena";

  return {
    gameId,
    gameMode: gameMode as any,
    players: mappedPlayers,
    gameStatus: statusKey as "waiting" | "active" | "completed",
    currentPlayerIndex: onChain.currentPlayerIndex || 0,
    turnNumber: onChain.turnNumber || 0,
    gameMap: mapTerritoryMap(onChain),
    currentPhase: "combat", // Standardized phase
    eventLog: [],
    pendingActions: [],
  };
}

/**
 * Calculates visible coordinates around a center point (Fog of War)
 * Returns array of "x,y" strings
 */
export function getVisibleCoordinates(
  x: number,
  y: number,
  range: number = 1,
): string[] {
  const coords: string[] = [];
  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {
      coords.push(`${x + dx},${y + dy}`);
    }
  }
  return coords;
}
