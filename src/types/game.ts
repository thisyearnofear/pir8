// Core Pirate Strategy Game Types
export type TerritoryCellType =
  | "water"
  | "island"
  | "port"
  | "treasure"
  | "storm"
  | "reef"
  | "whirlpool";
export type ShipType = "sloop" | "frigate" | "galleon" | "flagship";
export type ResourceType = "gold" | "crew" | "cannons" | "supplies";

// Ship represents a player's fleet unit
// ENHANCEMENT: Ship abilities system (MODULAR, DRY)
export interface ShipAbility {
  name: string;
  description: string;
  cooldown: number;
  currentCooldown: number;
  isReady: boolean;
  cost?: Partial<Resources>;
  type: 'offensive' | 'defensive' | 'utility';
}

export interface ShipEffect {
  type: 'defense_buff' | 'attack_buff' | 'immobile' | 'invisible' | 'burning';
  duration: number;
  magnitude: number;
  source: string; // ID of ship that caused effect
}

export interface Ship {
  id: string;
  type: ShipType;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  position: Coordinate;
  resources: Resources;
  ability: ShipAbility; // ENHANCEMENT: Each ship has unique ability
  activeEffects: ShipEffect[]; // ENHANCEMENT: Buffs/debuffs tracking
}

// Territory cell on the game map
export interface TerritoryCell {
  coordinate: string;
  type: TerritoryCellType;
  owner: string | null;
  resources: Partial<Resources>;
  isContested: boolean;
  weatherEffect?: WeatherEffect;
}

// Weather effects that can affect territories
export interface WeatherEffect {
  type: "storm" | "fog" | "calm" | "trade_winds";
  duration: number; // turns remaining
  effect: {
    movementModifier?: number;
    damageModifier?: number;
    resourceModifier?: number;
    visibilityReduced?: boolean;
  };
}

// Game map represents the battle arena
export interface GameMap {
  cells: TerritoryCell[][];
  size: number;
}

// Resources that players collect and manage
export interface Resources {
  gold: number;
  crew: number;
  cannons: number;
  supplies: number;
  wood: number;
  rum: number;
}

// Coordinate system for the game map
export interface Coordinate {
  x: number;
  y: number;
}

// Player in the pirate strategy game
export interface Player {
  publicKey: string;
  username?: string;
  resources: Resources;
  ships: Ship[];
  controlledTerritories: string[]; // coordinate strings
  totalScore: number;
  isActive: boolean;

  // ===== SKILL MECHANICS =====
  // Scanning system
  scanCharges: number;
  scannedCoordinates: string[]; // Coordinates revealed via scans

  // Timing bonuses
  speedBonusAccumulated: number;
  averageDecisionTimeMs: number;
  totalMoves: number;

  // Momentum system: consecutive attacks build bonus
  consecutiveAttacks: number;
  lastActionWasAttack: boolean;
}

export interface GameState {
  gameId: string;
  players: Player[];
  currentPlayerIndex: number;
  gameMap: GameMap;
  gameStatus: "waiting" | "active" | "completed";
  winner?: string;
  currentPhase: "deployment" | "movement" | "combat" | "resource_collection";
  turnNumber: number;
  turnTimeRemaining?: number;
  pendingActions: GameAction[];
  globalWeather?: WeatherEffect;
  eventLog: GameEvent[];
}

// Game events for history/replay
export interface GameEvent {
  id: string;
  type:
    | "ship_moved"
    | "ship_attacked"
    | "territory_claimed"
    | "resources_collected"
    | "ship_built"
    | "weather_change"
    | "coordinate_scanned"
    | "move_executed";
  playerId: string;
  turnNumber: number;
  timestamp: number;
  description: string;
  data: any;
}

export interface GameAction {
  id: string;
  gameId: string;
  player: string;
  type:
    | "move_ship"
    | "attack"
    | "collect_resources"
    | "build_ship"
    | "claim_territory"
    | "scan_coordinate";
  data: ActionData;
  timestamp: number;
  signature?: string;
  decisionTimeMs?: number; // For timing bonuses
}

export interface ActionData {
  shipId?: string;
  fromCoordinate?: string;
  toCoordinate?: string;
  targetShipId?: string;
  shipType?: ShipType;
  resourceAmount?: Partial<Resources>;
  coordinate?: string; // For scanning
}

export interface GameConfig {
  maxPlayers: number;
  entryFee: number; // in SOL
  platformFee: number; // percentage
  turnTimeout: number; // in seconds
  gridSize: number;
}

// Ship configurations for different types
// Note: abilities and activeEffects should be initialized at runtime via initializeShipAbility
export const SHIP_CONFIGS: Record<
  ShipType,
  Omit<Ship, "id" | "position" | "resources" | "ability" | "activeEffects">
> = {
  sloop: {
    type: "sloop",
    maxHealth: 100,
    health: 100,
    attack: 20,
    defense: 10,
    speed: 3,
  },
  frigate: {
    type: "frigate",
    maxHealth: 200,
    health: 200,
    attack: 40,
    defense: 25,
    speed: 2,
  },
  galleon: {
    type: "galleon",
    maxHealth: 350,
    health: 350,
    attack: 60,
    defense: 40,
    speed: 1,
  },
  flagship: {
    type: "flagship",
    maxHealth: 500,
    health: 500,
    attack: 80,
    defense: 60,
    speed: 1,
  },
};

// Territory cell resource generation rates
export const TERRITORY_RESOURCE_GENERATION: Record<
  TerritoryCellType,
  Partial<Resources>
> = {
  water: {},
  island: { supplies: 2 },
  port: { gold: 3, crew: 1 },
  treasure: { gold: 5 },
  storm: {},
  reef: {},
  whirlpool: {},
};

export const COORDINATE_LETTERS = ["A", "B", "C", "D", "E", "F", "G"];
export const COORDINATE_NUMBERS = ["1", "2", "3", "4", "5", "6", "7"];

export const LETTERS_TO_INDEX: { [key: string]: number } = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
  F: 5,
  G: 6,
};
