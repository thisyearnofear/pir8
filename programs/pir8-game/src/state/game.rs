use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::*;

#[account]
pub struct Game {
    /// Game identifier
    pub game_id: u64,
    
    /// Game creator
    pub creator: Pubkey,
    
    /// Current game status
    pub status: GameStatus,
    
    /// Players in the game (up to 4)
    pub players: Vec<PlayerState>,
    
    /// Current player turn index
    pub current_player_index: u8,
    
    /// Game grid (7x7 = 49 items)
    pub grid: Vec<GameItem>,
    
    /// Coordinates that have been chosen
    pub chosen_coordinates: Vec<String>,
    
    /// Entry fee in lamports
    pub entry_fee: u64,
    
    /// Total pot accumulated
    pub total_pot: u64,
    
    /// Game configuration
    pub max_players: u8,
    pub turn_timeout: i64,
    
    /// Timestamps
    pub created_at: i64,
    pub started_at: Option<i64>,
    pub completed_at: Option<i64>,
    
    /// Winner information
    pub winner: Option<Pubkey>,
    pub final_scores: Vec<u64>,
    
    /// Random seed for grid generation
    pub random_seed: u64,
    
    /// Game metadata
    pub metadata: GameMetadata,
    
    /// Reserved space for future upgrades
    pub reserved: [u8; 64],
}

impl Game {
    pub const SPACE: usize = 8 + // discriminator
        8 + // game_id
        32 + // creator
        1 + // status
        4 + (4 * 120) + // players (max 4 players * ~120 bytes each)
        1 + // current_player_index
        4 + (49 * 16) + // grid (49 items * ~16 bytes each)
        4 + (49 * 16) + // chosen_coordinates (max 49 * ~16 bytes each)
        8 + // entry_fee
        8 + // total_pot
        1 + // max_players
        8 + // turn_timeout
        8 + // created_at
        9 + // started_at (Option<i64>)
        9 + // completed_at (Option<i64>)
        33 + // winner (Option<Pubkey>)
        4 + (4 * 8) + // final_scores (max 4 * u64)
        8 + // random_seed
        32 + // metadata
        64; // reserved

    pub fn is_player_in_game(&self, player: &Pubkey) -> bool {
        self.players.iter().any(|p| p.player_key == *player)
    }

    pub fn get_player_index(&self, player: &Pubkey) -> Option<usize> {
        self.players.iter().position(|p| p.player_key == *player)
    }

    pub fn get_current_player(&self) -> Result<&PlayerState> {
        self.players
            .get(self.current_player_index as usize)
            .ok_or(PIR8Error::InvalidPlayerIndex.into())
    }

    pub fn get_current_player_mut(&mut self) -> Result<&mut PlayerState> {
        self.players
            .get_mut(self.current_player_index as usize)
            .ok_or(PIR8Error::InvalidPlayerIndex.into())
    }

    pub fn advance_turn(&mut self) {
        self.current_player_index = (self.current_player_index + 1) % (self.players.len() as u8);
    }

    pub fn is_coordinate_available(&self, coordinate: &str) -> bool {
        !self.chosen_coordinates.iter().any(|c| c == coordinate)
    }

    pub fn add_coordinate(&mut self, coordinate: String) {
        self.chosen_coordinates.push(coordinate);
    }

    pub fn is_game_complete(&self) -> bool {
        self.chosen_coordinates.len() >= MAX_COORDINATES as usize ||
        self.status == GameStatus::Completed
    }

    pub fn calculate_final_scores(&self) -> Vec<u64> {
        self.players
            .iter()
            .map(|p| p.points + p.banked_points)
            .collect()
    }

    pub fn determine_winner(&self) -> Option<usize> {
        let scores = self.calculate_final_scores();
        scores
            .iter()
            .enumerate()
            .max_by_key(|(_, &score)| score)
            .map(|(index, _)| index)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum GameStatus {
    Waiting,
    Active,
    Completed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PlayerState {
    pub player_key: Pubkey,
    pub points: u64,
    pub banked_points: u64,
    pub has_elf: bool,
    pub has_bauble: bool,
    pub is_active: bool,
    pub joined_at: i64,
    pub last_move_at: i64,
}

impl PlayerState {
    pub fn new(player_key: Pubkey, timestamp: i64) -> Self {
        Self {
            player_key,
            points: 0,
            banked_points: 0,
            has_elf: false,
            has_bauble: false,
            is_active: true,
            joined_at: timestamp,
            last_move_at: timestamp,
        }
    }

    pub fn total_score(&self) -> u64 {
        self.points + self.banked_points
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum GameItem {
    Points(u16),
    Grinch,
    Pudding,
    Present,
    Snowball,
    Mistletoe,
    Tree,
    Elf,
    Bauble,
    Turkey,
    Cracker,
    Bank,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum ItemAction {
    Steal { amount: u64 },
    Swap,
    Gift,
    Kill,
    Choose { coordinate: String },
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct GameMetadata {
    pub name: String,
    pub description: String,
    pub image_uri: Option<String>,
    pub external_url: Option<String>,
}

impl Default for GameMetadata {
    fn default() -> Self {
        Self {
            name: "PIR8 Battle".to_string(),
            description: "Fast battles, private moves, viral wins".to_string(),
            image_uri: None,
            external_url: Some("https://github.com/thisyearnofear/pir8".to_string()),
        }
    }
}