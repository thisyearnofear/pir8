/**
 * On-chain type definitions that exactly mirror Rust structs.
 * These types are used for deserializing account data from the Solana program.
 *
 * IMPORTANT: Keep these in sync with programs/pir8-game/src/state/
 * AND the generated IDL (which uses snake_case for fields in Anchor 0.30+).
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
  ship_type: OnChainShipType;
  health: number;
  max_health: number;
  attack: number;
  defense: number;
  speed: number;
  position_x: number;
  position_y: number;
  last_action_turn: number;
}

// ============================================================================
// PLAYER DATA (mirror Rust PlayerData struct)
// ============================================================================

export interface OnChainPlayerData {
  pubkey: PublicKey;
  resources: OnChainResources;
  ships: OnChainShipData[];
  controlled_territories: string[];
  total_score: number;
  is_active: boolean;
  scan_charges: number;
  scanned_coordinates: number[] | Buffer; // Bit-packed Vec<u8> from Rust
  is_ghost_fleet: boolean;
  ghost_fleet_turns_remaining: number;
  total_ghosts_activated: number;
  speed_bonus_accumulated: BN;
  average_decision_time_ms: BN;
  total_moves: number;
}

// ============================================================================
// TERRITORY CELL (mirror Rust TerritoryCell struct)
// ============================================================================

export interface OnChainTerritoryCell {
  cell_type: OnChainTerritoryCellType;
  owner: PublicKey | null;
}

// ============================================================================
// GAME STATE (mirror Rust PirateGame account struct)
// ============================================================================

export interface OnChainGameState {
  game_id: BN;
  authority: PublicKey;
  status: OnChainGameStatus;
  mode: OnChainGameMode;
  player_count: number;
  current_player_index: number;
  turn_number: number;
  created_at: BN;
  started_at: BN | null;
  completed_at: BN | null;
  winner: PublicKey | null;
  weather_type: OnChainWeatherType;
  weather_duration: number;
  bump: number;
  players: OnChainPlayerData[];
  territory_map: OnChainTerritoryCell[];
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
  games_played: BN;
  wins: BN;
  last_active: BN;
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
