use anchor_lang::prelude::*;

// Program constants
pub const GAME_SEED: &[u8] = b"game";
pub const CONFIG_SEED: &[u8] = b"config";
pub const PLAYER_SEED: &[u8] = b"player";

// Game configuration
pub const MAX_PLAYERS: u8 = 4;
pub const MIN_PLAYERS: u8 = 2;
pub const GRID_SIZE: usize = 7;
pub const MAX_COORDINATES: u8 = 49;
pub const DEFAULT_TURN_TIMEOUT: u64 = 30; // seconds

// Economic constants
pub const DEFAULT_ENTRY_FEE: u64 = 100_000_000; // 0.1 SOL in lamports
pub const DEFAULT_PLATFORM_FEE_BPS: u16 = 500; // 5%
pub const MAX_PLATFORM_FEE_BPS: u16 = 1000; // 10%
pub const BASIS_POINTS: u64 = 10_000;

// Game items point values
pub const POINTS_200: u16 = 200;
pub const POINTS_1000: u16 = 1000;
pub const POINTS_3000: u16 = 3000;
pub const POINTS_5000: u16 = 5000;

// Gift amount
pub const GIFT_AMOUNT: u64 = 1000;

// String length limits
pub const MAX_COORDINATE_LEN: usize = 2; // "A1" to "G7"
pub const MAX_NAME_LEN: usize = 32;
pub const MAX_DESCRIPTION_LEN: usize = 200;
pub const MAX_URI_LEN: usize = 200;

// Time constants
pub const SECONDS_PER_MINUTE: i64 = 60;
pub const MINUTES_PER_HOUR: i64 = 60;
pub const SECONDS_PER_HOUR: i64 = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;

// Game item distribution for grid generation
pub const ITEM_DISTRIBUTION: &[(u8, u16)] = &[
    (21, 200),    // 21 tiles with 200 points
    (17, 1000),   // 17 tiles with 1000 points  
    (2, 3000),    // 2 tiles with 3000 points
    (1, 5000),    // 1 tile with 5000 points
    (1, 0),       // Grinch
    (1, 1),       // Pudding
    (1, 2),       // Present
    (1, 3),       // Snowball
    (1, 4),       // Mistletoe
    (1, 5),       // Tree
    (1, 6),       // Elf
    (1, 7),       // Bauble
    (1, 8),       // Turkey
    (1, 9),       // Cracker
    (1, 10),      // Bank
];

// Coordinate validation
pub const VALID_LETTERS: &[char] = &['A', 'B', 'C', 'D', 'E', 'F', 'G'];
pub const VALID_NUMBERS: &[char] = &['1', '2', '3', '4', '5', '6', '7'];

// Error messages
pub const ERROR_GAME_FULL: &str = "Game is full";
pub const ERROR_GAME_NOT_ACTIVE: &str = "Game is not active";
pub const ERROR_NOT_YOUR_TURN: &str = "Not your turn";
pub const ERROR_INVALID_COORDINATE: &str = "Invalid coordinate";
pub const ERROR_COORDINATE_TAKEN: &str = "Coordinate already taken";
pub const ERROR_INSUFFICIENT_FUNDS: &str = "Insufficient funds";
pub const ERROR_UNAUTHORIZED: &str = "Unauthorized";

// Events
#[event]
pub struct GameCreated {
    pub game_id: u64,
    pub creator: Pubkey,
    pub entry_fee: u64,
    pub max_players: u8,
    pub timestamp: i64,
}

#[event] 
pub struct PlayerJoined {
    pub game_id: u64,
    pub player: Pubkey,
    pub player_count: u8,
    pub timestamp: i64,
}

#[event]
pub struct GameStarted {
    pub game_id: u64,
    pub players: Vec<Pubkey>,
    pub grid_seed: u64,
    pub timestamp: i64,
}

#[event]
pub struct MoveMade {
    pub game_id: u64,
    pub player: Pubkey,
    pub coordinate: String,
    pub item_found: String,
    pub points_gained: u64,
    pub timestamp: i64,
}

#[event]
pub struct SpecialItemUsed {
    pub game_id: u64,
    pub player: Pubkey,
    pub item: String,
    pub target_player: Option<Pubkey>,
    pub effect_description: String,
    pub timestamp: i64,
}

#[event]
pub struct GameCompleted {
    pub game_id: u64,
    pub winner: Pubkey,
    pub final_scores: Vec<u64>,
    pub total_pot: u64,
    pub winner_payout: u64,
    pub timestamp: i64,
}

#[event]
pub struct TurnAdvanced {
    pub game_id: u64,
    pub current_player: Pubkey,
    pub turn_index: u8,
    pub timestamp: i64,
}