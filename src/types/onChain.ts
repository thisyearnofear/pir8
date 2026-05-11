/**
 * On-chain type definitions that exactly mirror Rust structs.
 * These types are used for deserializing account data from the Solana program.
 *
 * IMPORTANT: Keep these in sync with programs/pir8-game/src/state/
 * Note: Anchor JS client usually converts snake_case IDL fields to camelCase in objects.
 */

import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

// ============================================================================
// ENUMS (mirror Rust enums exactly)
// ============================================================================

export type OnChainGameStatus = "waiting" | "active" | "completed";
export type OnChainGameMode = "casual" | "competitive" | "agentArena";
export type OnChainShipType = "sloop" | "frigate" | "galleon" | "flagship";
export type OnChainTerritoryCellType =
  | "water"
  | "island"
  | "port"
  | "treasure"
  | "storm"
  | "reef"
  | "whirlpool";
export type OnChainWeatherType = "calm" | "tradeWinds" | "storm" | "fog";

// ============================================================================
// RESOURCE (mirror Rust Resources struct - 4 fields only)
// ============================================================================

export interface OnChainResources {
  gold: number;
  crew: number;
  cannons: number;
  supplies: number;
}

// ============================================================================
// SHIP DATA (mirror Rust ShipData struct)
// ============================================================================

export interface OnChainShipData {
  id: string;
  shipType: OnChainShipType;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  positionX: number;
  positionY: number;
  lastActionTurn: number;
}

// ============================================================================
// PLAYER DATA (mirror Rust PlayerData struct)
// ============================================================================

export interface OnChainPlayerData {
  pubkey: PublicKey;
  resources: OnChainResources;
  ships: OnChainShipData[];
  controlledTerritories: string[];
  totalScore: number;
  isActive: boolean;
  scanCharges: number;
  scannedCoordinates: number[] | Buffer; // Bit-packed Vec<u8> from Rust
  isGhostFleet: boolean;
  ghostFleetTurnsRemaining: number;
  totalGhostsActivated: number;
  speedBonusAccumulated: BN;
  averageDecisionTimeMs: BN;
  totalMoves: number;
}

// ============================================================================
// TERRITORY CELL (mirror Rust TerritoryCell struct)
// ============================================================================

export interface OnChainTerritoryCell {
  cellType: OnChainTerritoryCellType;
  owner: PublicKey | null;
}

// ============================================================================
// GAME STATE (mirror Rust PirateGame account struct)
// ============================================================================

export interface OnChainGameState {
  gameId: BN;
  authority: PublicKey;
  status: OnChainGameStatus;
  mode: OnChainGameMode;
  playerCount: number;
  currentPlayerIndex: number;
  turnNumber: number;
  createdAt: BN;
  startedAt: BN | null;
  completedAt: BN | null;
  winner: PublicKey | null;
  weatherType: OnChainWeatherType;
  weatherDuration: number;
  bump: number;
  players: OnChainPlayerData[];
  territoryMap: OnChainTerritoryCell[];
}

// ============================================================================
// AGENT REGISTRY (mirror Rust AgentRegistry account struct)
// ============================================================================

export interface OnChainAgentRegistry {
  owner: PublicKey;
  delegate: PublicKey | null;
  name: string;
  version: string;
  twitter: string | null;
  website: string | null;
  gamesPlayed: BN;
  wins: BN;
  lastActive: BN;
}

// ============================================================================
// CONSTANTS (mirror Rust constants)
// ============================================================================

export const ON_CHAIN_CONSTANTS = {
  MAP_SIZE: 10,
  MAX_PLAYERS: 4,
  MIN_PLAYERS: 2,
  MAX_SHIPS_PER_PLAYER: 6,
  TURN_TIMEOUT_SECONDS: 45,
  GHOST_FLEET_COST_GOLD: 200,
  GHOST_FLEET_DURATION: 3,
  BASE_SCAN_RANGE: 3,
  GHOST_FLEET_SCAN_RANGE: 1,
} as const;
