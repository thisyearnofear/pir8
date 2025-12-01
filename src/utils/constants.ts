// Game Constants
export const GAME_CONFIG = {
  GRID_SIZE: 7,
  MAX_PLAYERS: 4,
  MIN_PLAYERS: 2,
  TURN_TIMEOUT: 30000, // 30 seconds
  ENTRY_FEE: 0.1, // SOL
  PLATFORM_FEE: 0.05, // 5%
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
} as const;

// Game Item Mappings
export const ITEM_EMOJIS = {
  'GRINCH': '👹',
  'PUDDING': '🍮', 
  'PRESENT': '🎁',
  'SNOWBALL': '❄️',
  'MISTLETOE': '🌿',
  'TREE': '🎄',
  'ELF': '🧝',
  'BAUBLE': '🔮',
  'TURKEY': '🦃',
  'CRACKER': '🎊',
  'BANK': '🏦',
} as const;

export const ITEM_DESCRIPTIONS = {
  'GRINCH': 'Steal points from another player',
  'PUDDING': 'Reset another player to 0 points', 
  'PRESENT': 'Gift 1000 points to another player',
  'SNOWBALL': 'Wipe out a row of scores',
  'MISTLETOE': 'Swap scores with another player',
  'TREE': 'Choose the next coordinate',
  'ELF': 'Block the next attack against you',
  'BAUBLE': 'Reflect the next attack back',
  'TURKEY': 'Your score is reset to 0',
  'CRACKER': 'Double your current score',
  'BANK': 'Move points to protected bank',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  INVALID_COORDINATE: 'Invalid coordinate format (use A1-G7)',
  COORDINATE_TAKEN: 'Coordinate already chosen',
  NOT_YOUR_TURN: 'Wait for your turn',
  GAME_NOT_ACTIVE: 'Game is not currently active',
  INSUFFICIENT_FUNDS: 'Insufficient SOL balance',
  TRANSACTION_FAILED: 'Transaction failed, please try again',
  NETWORK_ERROR: 'Network error, check your connection',
} as const;

// Success Messages  
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully',
  GAME_CREATED: 'Game created! Waiting for players...',
  MOVE_MADE: 'Move made successfully',
  GAME_WON: 'Congratulations! You won!',
  TOKEN_CREATED: 'Victory token created successfully',
} as const;
