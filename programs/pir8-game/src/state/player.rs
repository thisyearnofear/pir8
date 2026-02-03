use crate::constants::*;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Default)]
pub struct Resources {
    pub gold: u32,
    pub crew: u32,
    pub cannons: u32,
    pub supplies: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum ShipType {
    Sloop,
    Frigate,
    Galleon,
    Flagship,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct ShipData {
    pub id: String,
    pub ship_type: ShipType,
    pub health: u32,
    pub max_health: u32,
    pub attack: u32,
    pub defense: u32,
    pub speed: u32,
    pub position_x: u8,
    pub position_y: u8,
    pub last_action_turn: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct PlayerData {
    pub pubkey: Pubkey,
    pub resources: Resources,
    pub ships: Vec<ShipData>,
    pub controlled_territories: Vec<String>, // coordinate strings like "5,7"
    pub total_score: u32,
    pub is_active: bool,

    // ===== SKILL MECHANICS =====
    // Scanning system
    pub scan_charges: u8,             // Remaining scans (starts with 3)
    pub scanned_coordinates: Vec<u8>, // Bit-packed indices of 10x10 grid (max 13 bytes)

    // Timing bonuses
    pub speed_bonus_accumulated: u64,  // Total timing bonus points
    pub average_decision_time_ms: u64, // Running average decision time
    pub total_moves: u8,               // Move counter for average calculation
}

impl Default for PlayerData {
    fn default() -> Self {
        Self {
            pubkey: Pubkey::default(),
            resources: Resources::default(),
            ships: Vec::new(),
            controlled_territories: Vec::new(),
            total_score: 0,
            is_active: false,
            scan_charges: 3,                 // Start with 3 scans
            scanned_coordinates: Vec::new(), // No scanned tiles initially
            speed_bonus_accumulated: 0,      // No bonuses yet
            average_decision_time_ms: 0,     // No moves yet
            total_moves: 0,                  // No moves yet
        }
    }
}

#[account]
pub struct AgentRegistry {
    pub owner: Pubkey,
    pub delegate: Option<Pubkey>, // Authorized key for moves (Session Key pattern)
    pub name: String,
    pub version: String,
    pub twitter: Option<String>,
    pub website: Option<String>,
    pub games_played: u64,
    pub wins: u64,
    pub last_active: i64,
}

impl AgentRegistry {
    // Base space calculation:
    // Discriminator: 8
    // Owner: 32
    // Delegate (Option<Pubkey>): 1 + 32 = 33
    // Name (String): 4 + len (assume max 32) = 36
    // Version (String): 4 + len (assume max 16) = 20
    // Twitter (Option<String>): 1 + 4 + len (assume max 32) = 37
    // Website (Option<String>): 1 + 4 + len (assume max 64) = 69
    // u64 fields x 3: 24
    // last_active i64: 8
    // Total approx: ~300 bytes.
    pub const SPACE: usize =
        8 + 32 + 33 + (4 + 32) + (4 + 16) + (1 + 4 + 32) + (1 + 4 + 64) + 24 + 8;
}

// ============================================================================
// HELPERS
// ============================================================================

pub fn get_ship_stats(ship_type: &ShipType) -> (u32, u32, u32, u32) {
    // Returns (health, attack, defense, speed)
    match ship_type {
        ShipType::Sloop => (100, 20, 10, 3),
        ShipType::Frigate => (200, 40, 25, 2),
        ShipType::Galleon => (350, 60, 40, 1),
        ShipType::Flagship => (500, 80, 60, 1),
    }
}

pub fn get_ship_costs(ship_type: &ShipType) -> Resources {
    let (gold, crew, cannons, supplies) = match ship_type {
        ShipType::Sloop => SLOOP_COST,
        ShipType::Frigate => FRIGATE_COST,
        ShipType::Galleon => GALLEON_COST,
        ShipType::Flagship => FLAGSHIP_COST,
    };

    Resources {
        gold,
        crew,
        cannons,
        supplies,
    }
}

pub fn get_ship_resource_multiplier(ship_type: &ShipType) -> f32 {
    match ship_type {
        ShipType::Sloop => 1.0,
        ShipType::Frigate => 1.2,
        ShipType::Galleon => 1.5,
        ShipType::Flagship => 1.3,
    }
}

pub fn calculate_speed_bonus(decision_time_ms: u64) -> u64 {
    match decision_time_ms {
        0..=5000 => 100,     // <5s: +100 points
        5001..=10000 => 50,  // <10s: +50 points
        10001..=15000 => 25, // <15s: +25 points
        _ => 0,              // >15s: no bonus
    }
}

pub fn update_average_decision_time(player: &mut PlayerData, new_decision_time_ms: u64) {
    if player.total_moves == 0 {
        player.average_decision_time_ms = new_decision_time_ms;
    } else {
        // Safe multiplication: avg_time * count is bounded by u64
        let total_time = player
            .average_decision_time_ms
            .saturating_mul(player.total_moves as u64);

        // Safe addition: total_time + new_time, saturate on overflow
        let combined = total_time.saturating_add(new_decision_time_ms);

        // Compute new average: combined / (moves + 1)
        let move_count = (player.total_moves as u64).saturating_add(1);
        player.average_decision_time_ms = combined / move_count;
    }
    player.total_moves = player.total_moves.saturating_add(1);
}
