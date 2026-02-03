use anchor_lang::prelude::*;

// ============================================================================
// PIRATE GAME CONSTANTS
// ============================================================================

pub const GAME_SEED: &[u8] = b"pirate_game";
pub const MAX_PLAYERS: u8 = 4;
pub const MIN_PLAYERS: u8 = 2;
pub const MAP_SIZE: usize = 10;
pub const MAX_SHIPS_PER_PLAYER: usize = 6;
pub const TURN_TIMEOUT_SECONDS: i64 = 45;

// Ship building costs: (gold, crew, cannons, supplies)
pub const SLOOP_COST: (u32, u32, u32, u32) = (500, 10, 5, 20);
pub const FRIGATE_COST: (u32, u32, u32, u32) = (1200, 25, 15, 40);
pub const GALLEON_COST: (u32, u32, u32, u32) = (2500, 50, 30, 80);
pub const FLAGSHIP_COST: (u32, u32, u32, u32) = (5000, 100, 60, 150);
