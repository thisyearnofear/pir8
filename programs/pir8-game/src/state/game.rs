use crate::constants::*;
use crate::errors::GameError;
use crate::state::map::TerritoryCell;
use crate::state::player::{PlayerData, ShipData, ShipType};
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum GameStatus {
    Waiting,
    Active,
    Completed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum WeatherType {
    Calm,
    TradeWinds,
    Storm,
    Fog,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum GameMode {
    Casual,
    Competitive,
    AgentArena,
}

#[account]
pub struct PirateGame {
    pub game_id: u64,
    pub authority: Pubkey,
    pub status: GameStatus,
    pub mode: GameMode,
    pub player_count: u8,
    pub current_player_index: u8,
    pub turn_number: u32,
    pub created_at: i64,
    pub started_at: Option<i64>,
    pub completed_at: Option<i64>,
    pub winner: Option<Pubkey>,
    pub weather_type: WeatherType,
    pub weather_duration: u8,
    pub bump: u8,
    pub players: Vec<PlayerData>,
    pub territory_map: Vec<TerritoryCell>, // Flattened MAP_SIZE x MAP_SIZE
}

impl PirateGame {
    // Base space for fixed fields + buffer for dynamic Vecs
    // Solana has a 10KB limit for account reallocation in inner instructions
    pub const SPACE: usize = 10240; // 10KB - maximum allowed

    pub fn advance_turn(&mut self) {
        if self.player_count > 0 {
            self.current_player_index = (self.current_player_index + 1) % self.player_count;
            if self.current_player_index == 0 {
                self.turn_number += 1;
            }
        }
    }

    pub fn get_current_player(&self) -> Option<&PlayerData> {
        self.players.get(self.current_player_index as usize)
    }

    pub fn get_player_mut(&mut self, pubkey: &Pubkey) -> Option<&mut PlayerData> {
        self.players
            .iter_mut()
            .find(|p| p.pubkey == *pubkey && p.is_active)
    }
}

pub fn deploy_starting_fleets(game: &mut PirateGame) -> Result<()> {
    let starting_positions = [
        (1, 1),
        (2, 1), // Player 0: top-left
        (8, 1),
        (9, 1), // Player 1: top-right
        (1, 8),
        (1, 9), // Player 2: bottom-left
        (8, 8),
        (9, 8), // Player 3: bottom-right
    ];

    for i in 0..game.player_count as usize {
        if i >= game.players.len() {
            break;
        }

        if !game.players[i].is_active {
            continue;
        }

        // Copy player pubkey first to avoid borrow issues when creating ID string
        let player_pubkey = game.players[i].pubkey;

        // Ensure we don't exceed starting positions array
        let base_idx = i.saturating_mul(2);
        require!(base_idx + 1 < starting_positions.len(), GameError::GameFull);

        let pos1 = starting_positions[base_idx];
        let pos2 = starting_positions[base_idx + 1];

        // Create starting ships
        let timestamp = Clock::get()?.unix_timestamp;

        let sloop = ShipData {
            id: format!("{}_{}", player_pubkey, timestamp),
            ship_type: ShipType::Sloop,
            health: 100,
            max_health: 100,
            attack: 20,
            defense: 10,
            speed: 3,
            position_x: pos1.0,
            position_y: pos1.1,
            last_action_turn: 0,
        };

        let frigate = ShipData {
            id: format!("{}_{}_{}", player_pubkey, timestamp, "frigate"),
            ship_type: ShipType::Frigate,
            health: 200,
            max_health: 200,
            attack: 40,
            defense: 25,
            speed: 2,
            position_x: pos2.0,
            position_y: pos2.1,
            last_action_turn: 0,
        };

        game.players[i].ships.push(sloop);
        game.players[i].ships.push(frigate);
    }

    Ok(())
}
