// Pirate Game Constants
export const GAME_CONFIG = {
  MAP_SIZE: 5, // Reduced from 10 to fit in Solana stack
  MAX_PLAYERS: 4,
  MIN_PLAYERS: 2,
  TURN_TIMEOUT: 45000, // 45 seconds for strategic decisions
  ENTRY_FEE: 0.1, // SOL
  PLATFORM_FEE: 0.05, // 5%
  STARTING_SHIPS: 2, // Each player starts with 2 ships
  MAX_SHIPS_PER_PLAYER: 6,
  VICTORY_TERRITORY_THRESHOLD: 5, // Number of valuable territories to win
} as const;

// Solana Configuration
export const SOLANA_CONFIG = {
  NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
  RPC_URL: process.env.NEXT_PUBLIC_HELIUS_RPC_URL,
  PROGRAM_ID: process.env.NEXT_PUBLIC_PROGRAM_ID,
  TREASURY_ADDRESS: process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  HELIUS_RPC: process.env.NEXT_PUBLIC_HELIUS_RPC_URL,
  HELIUS_WEBHOOK: '/api/webhooks/helius',
  PUMP_FUN: '/api/pump-fun',
  GAME_STATE: '/api/game',
  ZCASH_BRIDGE: '/api/zcash',
} as const;

// Zcash Configuration
export const ZCASH_CONFIG = {
  LIGHTWALLETD_URL: process.env.NEXT_PUBLIC_LIGHTWALLETD_URL || 'https://lightwalletd.com:9067',
  SHIELDED_ADDRESS: process.env.NEXT_PUBLIC_ZCASH_SHIELDED_ADDR || '',
  MEMO_SCHEMA_VERSION: '1',
  ENABLED: process.env['NEXT_PUBLIC_ZCASH_ENABLED'] === 'true',
} as const;

// Pirate Territory & Ship Mappings
export const TERRITORY_EMOJIS = {
  'water': '🌊',
  'island': '🏝️',
  'port': '⚓',
  'treasure': '💰',
  'storm': '⛈️',
  'reef': '🪨',
  'whirlpool': '🌀',
} as const;

export const SHIP_EMOJIS = {
  'sloop': '⛵',
  'frigate': '🚢',
  'galleon': '🛳️',
  'flagship': '🚤',
} as const;

export const TERRITORY_DESCRIPTIONS = {
  'water': 'Safe passage for ships',
  'island': 'Generates supplies for your fleet',
  'port': 'Generates gold and crew',
  'treasure': 'High-value territory with gold',
  'storm': 'Dangerous area that damages ships',
  'reef': 'Hidden hazard that can damage ships',
  'whirlpool': 'Deadly trap that heavily damages ships',
} as const;

export const SHIP_DESCRIPTIONS = {
  'sloop': 'Fast, light ship - good for scouting',
  'frigate': 'Balanced ship with decent firepower',
  'galleon': 'Heavy warship with strong defenses',
  'flagship': 'Ultimate warship - slow but devastating',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  INVALID_COORDINATE: 'Invalid coordinate format',
  TERRITORY_OCCUPIED: 'Territory already controlled by another player',
  NOT_YOUR_TURN: 'Wait for your turn, captain',
  GAME_NOT_ACTIVE: 'Battle arena is not currently active',
  INSUFFICIENT_FUNDS: 'Insufficient SOL for entry fee',
  INSUFFICIENT_RESOURCES: 'Not enough resources for this action',
  SHIP_OUT_OF_RANGE: 'Ship cannot reach that distance',
  SHIP_DESTROYED: 'Ship has been destroyed and cannot act',
  INVALID_TARGET: 'Invalid target for this action',
  TRANSACTION_FAILED: 'Transaction failed, please try again',
  NETWORK_ERROR: 'Network error, check your connection',
  NO_SHIPS_AVAILABLE: 'No ships available for combat',
  TERRITORY_NOT_CLAIMABLE: 'This territory cannot be claimed',
} as const;

// Success Messages  
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected - ready to set sail!',
  GAME_CREATED: 'Battle arena created! Awaiting pirates...',
  SHIP_MOVED: 'Ship successfully navigated to new position',
  SHIP_BUILT: 'New ship added to your fleet',
  TERRITORY_CLAIMED: 'Territory claimed for your fleet!',
  COMBAT_VICTORY: 'Enemy ship defeated!',
  RESOURCES_COLLECTED: 'Resources gathered from territory',
  GAME_WON: 'Victory! You rule the seven seas!',
  TOKEN_CREATED: 'Victory token minted successfully',
} as const;
