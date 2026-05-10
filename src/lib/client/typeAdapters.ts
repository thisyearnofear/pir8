/**
 * Type adapters for converting between on-chain and client types.
 *
 * On-chain types mirror Rust structs exactly.
 * Client types (GameState, Player, Ship) include extra UI-only fields.
 *
 * This file provides bidirectional conversion functions.
 */

import type {
  OnChainGameState,
  OnChainPlayerData,
  OnChainShipData,
  OnChainResources,
  OnChainTerritoryCell,
  OnChainGameStatus,
  OnChainShipType,
  OnChainTerritoryCellType,
} from "@/types/onChain";
import type {
  GameState,
  Player,
  Ship,
  Resources,
  Coordinate,
  TerritoryCell,
  TerritoryCellType,
  ShipType,
  GameMap,
} from "@/types/game";

// ============================================================================
// ENUM ADAPTERS
// ============================================================================

function adaptGameStatus(
  status: OnChainGameStatus,
): "waiting" | "active" | "completed" {
  return status;
}

function adaptShipType(shipType: OnChainShipType): ShipType {
  return shipType as ShipType;
}

function adaptTerritoryCellType(
  cellType: OnChainTerritoryCellType,
): TerritoryCellType {
  return cellType as TerritoryCellType;
}

// ============================================================================
// RESOURCE ADAPTERS
// ============================================================================

function adaptResources(onChain: OnChainResources): Resources {
  return {
    gold: onChain.gold,
    crew: onChain.crew,
    cannons: onChain.cannons,
    supplies: onChain.supplies,
    // CLIENT-ONLY: wood and rum are not on-chain
    wood: 0,
    rum: 0,
  };
}

// ============================================================================
// COORDINATE ADAPTERS
// ============================================================================

/** Convert on-chain position_x/position_y to client Coordinate */
function adaptPosition(x: number, y: number): Coordinate {
  return { x, y };
}

/** Convert bit-packed scanned_coordinates (Vec<u8>) to string array */
function adaptScannedCoordinates(packed: number[]): string[] {
  const result: string[] = [];
  const MAP_SIZE = 10;
  for (let byteIdx = 0; byteIdx < packed.length; byteIdx++) {
    const byte = packed[byteIdx];
    for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
      if (byte & (1 << bitIdx)) {
        const index = byteIdx * 8 + bitIdx;
        const x = Math.floor(index / MAP_SIZE);
        const y = index % MAP_SIZE;
        result.push(`${x},${y}`);
      }
    }
  }
  return result;
}

// ============================================================================
// SHIP ADAPTER
// ============================================================================

/** Convert on-chain ShipData to client Ship */
export function onChainToShip(data: OnChainShipData): Ship {
  return {
    id: data.id,
    type: adaptShipType(data.shipType),
    health: data.health,
    maxHealth: data.maxHealth,
    attack: data.attack,
    defense: data.defense,
    speed: data.speed,
    position: adaptPosition(data.positionX, data.positionY),
    // CLIENT-ONLY: resources, ability, activeEffects are not on-chain
    resources: { gold: 0, crew: 0, cannons: 0, supplies: 0, wood: 0, rum: 0 },
    ability: {
      name: "Basic Attack",
      description: "Standard attack",
      cooldown: 0,
      currentCooldown: 0,
      isReady: true,
      type: "offensive" as const,
    },
    activeEffects: [],
  };
}

// ============================================================================
// PLAYER ADAPTER
// ============================================================================

/** Convert on-chain PlayerData to client Player */
export function onChainToPlayer(data: OnChainPlayerData): Player {
  return {
    publicKey: data.pubkey.toString(),
    resources: adaptResources(data.resources),
    ships: data.ships.map(onChainToShip),
    controlledTerritories: data.controlledTerritories,
    totalScore: data.totalScore,
    isActive: data.isActive,
    scanCharges: data.scanCharges,
    scannedCoordinates: adaptScannedCoordinates(data.scannedCoordinates),
    speedBonusAccumulated: data.speedBonusAccumulated.toNumber(),
    averageDecisionTimeMs: data.averageDecisionTimeMs.toNumber(),
    totalMoves: data.totalMoves,
    // CLIENT-ONLY: consecutiveAttacks, lastActionWasAttack, revealedCoordinates
    consecutiveAttacks: 0,
    lastActionWasAttack: false,
    revealedCoordinates: [],
  };
}

// ============================================================================
// TERRITORY CELL ADAPTER
// ============================================================================

/** Convert on-chain TerritoryCell to client TerritoryCell */
export function onChainToTerritoryCell(
  data: OnChainTerritoryCell,
  x: number,
  y: number,
): TerritoryCell {
  return {
    coordinate: `${x},${y}`,
    type: adaptTerritoryCellType(data.cellType),
    owner: data.owner?.toString() ?? null,
    // CLIENT-ONLY: resources, isContested, weatherEffect
    resources: {},
    isContested: false,
  };
}

// ============================================================================
// GAME STATE ADAPTER
// ============================================================================

/** Convert on-chain GameState (PirateGame account) to client GameState */
export function onChainToGameState(chain: OnChainGameState): GameState {
  const MAP_SIZE = 10;

  // Convert flat territory map to 2D grid
  const cells: TerritoryCell[][] = [];
  for (let x = 0; x < MAP_SIZE; x++) {
    const row: TerritoryCell[] = [];
    for (let y = 0; y < MAP_SIZE; y++) {
      const index = x * MAP_SIZE + y;
      const chainCell = chain.territoryMap[index];
      if (chainCell) {
        row.push(onChainToTerritoryCell(chainCell, x, y));
      } else {
        row.push({
          coordinate: `${x},${y}`,
          type: "water" as TerritoryCellType,
          owner: null,
          resources: {},
          isContested: false,
        });
      }
    }
    cells.push(row);
  }

  const gameMap: GameMap = { cells, size: MAP_SIZE };

  return {
    gameId: chain.gameId.toString(),
    gameMode:
      chain.mode === "casual"
        ? "Casual"
        : chain.mode === "competitive"
          ? "Competitive"
          : "AgentArena",
    players: chain.players.map(onChainToPlayer),
    currentPlayerIndex: chain.currentPlayerIndex,
    gameMap,
    gameStatus: adaptGameStatus(chain.status),
    winner: chain.winner?.toString(),
    turnNumber: chain.turnNumber,
    // CLIENT-ONLY: currentPhase, pendingActions, globalWeather, eventLog
    currentPhase: "movement",
    pendingActions: [],
    eventLog: [],
  };
}

// ============================================================================
// REVERSE ADAPTERS (client → on-chain, for building transactions)
// ============================================================================

/** Convert client Resources to on-chain Resources (drops wood/rum) */
export function resourcesToOnChain(client: Resources): OnChainResources {
  return {
    gold: client.gold,
    crew: client.crew,
    cannons: client.cannons,
    supplies: client.supplies,
  };
}

/** Convert client ShipType to on-chain ShipType */
export function shipTypeToOnChain(shipType: ShipType): OnChainShipType {
  return shipType as OnChainShipType;
}
