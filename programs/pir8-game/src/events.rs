use crate::state::player::ShipType;
use anchor_lang::prelude::*;

#[event]
pub struct PlayerJoined {
    pub player: Pubkey,
    pub player_count: u8,
}

#[event]
pub struct GameStarted {
    pub player_count: u8,
}

#[event]
pub struct ShipMoved {
    pub game_id: u64,
    pub player: Pubkey,
    pub ship_id: String,
    pub from_x: u8,
    pub from_y: u8,
    pub to_x: u8,
    pub to_y: u8,
}

#[event]
pub struct ShipAttacked {
    pub game_id: u64,
    pub attacker: Pubkey,
    pub attacker_ship_id: String,
    pub target_ship_id: String,
    pub damage: u32,
    pub ship_destroyed: bool,
}

#[event]
pub struct TerritoryClaimed {
    pub game_id: u64,
    pub player: Pubkey,
    pub territory_x: u8,
    pub territory_y: u8,
}

#[event]
pub struct ResourcesCollected {
    pub game_id: u64,
    pub player: Pubkey,
    pub gold_collected: u32,
    pub crew_collected: u32,
    pub supplies_collected: u32,
}

#[event]
pub struct ShipBuilt {
    pub game_id: u64,
    pub player: Pubkey,
    pub ship_type: ShipType,
    pub position_x: u8,
    pub position_y: u8,
}

#[event]
pub struct GameCompleted {
    pub game_id: u64,
    pub winner: Pubkey,
    pub victory_type: String,
}

#[event]
pub struct CoordinateScanned {
    pub game_id: u64,
    pub player: Pubkey,
    pub coordinate_x: u8,
    pub coordinate_y: u8,
    pub tile_type: String, // Don't reveal exact item
    pub scan_charges_remaining: u8,
}

#[event]
pub struct MoveExecuted {
    pub game_id: u64,
    pub player: Pubkey,
    pub decision_time_ms: u64,
    pub speed_bonus_awarded: u64,
    pub new_total_score: u64,
}
