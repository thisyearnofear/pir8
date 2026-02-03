// Pirate Game Constants
export const GAME_CONFIG = {
  MAP_SIZE: 8, // ENHANCED: Increased from 5 to provide strategic space for 4 players
  MAX_PLAYERS: 4,
  MIN_PLAYERS: 2,
  TURN_TIMEOUT: 45000, // 45 seconds for strategic decisions
  ENTRY_FEE: 0.1, // SOL
  PLATFORM_FEE: 0.05, // 5%
  STARTING_SHIPS: 2, // Each player starts with 2 ships
  MAX_SHIPS_PER_PLAYER: 6,
  VICTORY_TERRITORY_THRESHOLD: 8, // ENHANCED: Adjusted for larger map
} as const;

// Solana Configuration
export const SOLANA_CONFIG = {
  NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet",
  RPC_URL: process.env.NEXT_PUBLIC_HELIUS_RPC_URL,
  PROGRAM_ID:
    process.env.NEXT_PUBLIC_PROGRAM_ID ||
    "54S7Pw6cDQKWqW4JkdTGb3vEQqtnHsZ3SvB3LB1fST2V",
  TREASURY_ADDRESS: process.env.NEXT_PUBLIC_TREASURY_ADDRESS || "",
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  HELIUS_RPC: process.env.NEXT_PUBLIC_HELIUS_RPC_URL,
  HELIUS_WEBHOOK: "/api/webhooks/helius",
  PUMP_FUN: "/api/pump-fun",
  GAME_STATE: "/api/game",
  ZCASH_BRIDGE: "/api/zcash",
} as const;

// Zcash Configuration
export const ZCASH_CONFIG = {
  LIGHTWALLETD_URL:
    process.env.NEXT_PUBLIC_LIGHTWALLETD_URL || "https://lightwalletd.com:9067",
  SHIELDED_ADDRESS: process.env.NEXT_PUBLIC_ZCASH_SHIELDED_ADDR || "",
  MEMO_SCHEMA_VERSION: "1",
  ENABLED: process.env["NEXT_PUBLIC_ZCASH_ENABLED"] === "true",
} as const;

// Team Colors - Single source of truth for player visual distinction
export const TEAM_COLORS = [
  {
    tailwind: "text-neon-cyan",
    ring: "ring-neon-cyan",
    shadow: "shadow-neon-cyan/50",
    hex: "#00D9FF",
    name: "Cyan",
    bg: "bg-neon-cyan/30",
    border: "border-neon-cyan",
  },
  {
    tailwind: "text-neon-gold",
    ring: "ring-neon-gold",
    shadow: "shadow-neon-gold/50",
    hex: "#FFD700",
    name: "Gold",
    bg: "bg-neon-gold/30",
    border: "border-neon-gold",
  },
  {
    tailwind: "text-neon-magenta",
    ring: "ring-neon-magenta",
    shadow: "shadow-neon-magenta/50",
    hex: "#FF00FF",
    name: "Magenta",
    bg: "bg-neon-magenta/30",
    border: "border-neon-magenta",
  },
  {
    tailwind: "text-neon-purple",
    ring: "ring-neon-purple",
    shadow: "shadow-neon-purple/50",
    hex: "#BC13FE",
    name: "Purple",
    bg: "bg-neon-purple/30",
    border: "border-neon-purple",
  },
] as const;

// Pirate Territory & Ship Mappings
export const TERRITORY_EMOJIS = {
  water: "🌊",
  island: "🏝️",
  port: "⚓",
  treasure: "💰",
  storm: "⛈️",
  reef: "🪨",
  whirlpool: "🌀",
} as const;

export const SHIP_EMOJIS = {
  sloop: "⛵",
  frigate: "🚢",
  galleon: "🛳️",
  flagship: "🚤",
} as const;

export const TERRITORY_DESCRIPTIONS = {
  water: "Safe passage for ships",
  island: "Generates supplies for your fleet",
  port: "Generates gold and crew",
  treasure: "High-value territory with gold",
  storm: "Dangerous area that damages ships",
  reef: "Hidden hazard that can damage ships",
  whirlpool: "Deadly trap that heavily damages ships",
} as const;

export const SHIP_DESCRIPTIONS = {
  sloop: "Fast, light ship - good for scouting",
  frigate: "Balanced ship with decent firepower",
  galleon: "Heavy warship with strong defenses",
  flagship: "Ultimate warship - slow but devastating",
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: "Please connect your wallet first",
  INVALID_COORDINATE: "Invalid coordinate format",
  TERRITORY_OCCUPIED: "Territory already controlled by another player",
  NOT_YOUR_TURN: "Wait for your turn, captain",
  GAME_NOT_ACTIVE: "Battle arena is not currently active",
  INSUFFICIENT_FUNDS: "Insufficient SOL for entry fee",
  INSUFFICIENT_RESOURCES: "Not enough resources for this action",
  SHIP_OUT_OF_RANGE: "Ship cannot reach that distance",
  SHIP_DESTROYED: "Ship has been destroyed and cannot act",
  INVALID_TARGET: "Invalid target for this action",
  TRANSACTION_FAILED: "Transaction failed, please try again",
  NETWORK_ERROR: "Network error, check your connection",
  NO_SHIPS_AVAILABLE: "No ships available for combat",
  TERRITORY_NOT_CLAIMABLE: "This territory cannot be claimed",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: "Wallet connected - ready to set sail!",
  GAME_CREATED: "Battle arena created! Awaiting pirates...",
  SHIP_MOVED: "Ship successfully navigated to new position",
  SHIP_BUILT: "New ship added to your fleet",
  TERRITORY_CLAIMED: "Territory claimed for your fleet!",
  COMBAT_VICTORY: "Enemy ship defeated!",
  RESOURCES_COLLECTED: "Resources gathered from territory",
  GAME_WON: "Victory! You rule the seven seas!",
  TOKEN_CREATED: "Victory token minted successfully",
} as const;
