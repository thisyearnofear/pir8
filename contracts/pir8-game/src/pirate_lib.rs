use anchor_lang::prelude::*;

declare_id!("5etQW394NUCprU1ikrbDysFeCGGRYY9usChGpaox9oiK");

// ============================================================================
// PIRATE GAME CONSTANTS
// ============================================================================

pub const GAME_SEED: &[u8] = b"pirate_game";
pub const MAX_PLAYERS: u8 = 4;
pub const MIN_PLAYERS: u8 = 2;
pub const MAP_SIZE: usize = 10;
pub const MAX_SHIPS_PER_PLAYER: usize = 6;
pub const TURN_TIMEOUT_SECONDS: i64 = 45;

// Ship building costs
pub const SLOOP_COST: (u32, u32, u32, u32) = (500, 10, 5, 20);      // gold, crew, cannons, supplies
pub const FRIGATE_COST: (u32, u32, u32, u32) = (1200, 25, 15, 40);
pub const GALLEON_COST: (u32, u32, u32, u32) = (2500, 50, 30, 80);
pub const FLAGSHIP_COST: (u32, u32, u32, u32) = (5000, 100, 60, 150);

// ============================================================================
// DATA STRUCTURES
// ============================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum TerritoryCellType {
    Water,
    Island,
    Port,
    Treasure,
    Storm,
    Reef,
    Whirlpool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum ShipType {
    Sloop,
    Frigate,
    Galleon,
    Flagship,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum WeatherType {
    Calm,
    TradeWinds,
    Storm,
    Fog,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum GameStatus {
    WaitingForPlayers,
    Active,
    Completed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Default)]
pub struct Resources {
    pub gold: u32,
    pub crew: u32,
    pub cannons: u32,
    pub supplies: u32,
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
pub struct TerritoryCell {
    pub cell_type: TerritoryCellType,
    pub owner: Option<Pubkey>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct PlayerData {
    pub pubkey: Pubkey,
    pub resources: Resources,
    pub ships: Vec<ShipData>,
    pub controlled_territories: Vec<String>, // coordinate strings like "5,7"
    pub total_score: u32,
    pub is_active: bool,
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
        }
    }
}

// ============================================================================
// GAME ACCOUNT
// ============================================================================

#[account]
pub struct PirateGame {
    pub game_id: u64,
    pub authority: Pubkey,
    pub status: GameStatus,
    pub players: [PlayerData; 4],
    pub player_count: u8,
    pub current_player_index: u8,
    pub territory_map: [[TerritoryCell; MAP_SIZE]; MAP_SIZE],
    pub entry_fee: u64,
    pub total_pot: u64,
    pub max_players: u8,
    pub turn_number: u32,
    pub created_at: i64,
    pub started_at: Option<i64>,
    pub completed_at: Option<i64>,
    pub winner: Option<Pubkey>,
    pub weather_type: WeatherType,
    pub weather_duration: u8,
    pub bump: u8,
}

impl PirateGame {
    pub const SPACE: usize = 8 + // discriminator
        8 + // game_id
        32 + // authority
        1 + // status enum
        (32 + 16 + 4 + 4*32 + 4 + 1) * 4 + // players array (simplified calc)
        1 + // player_count
        1 + // current_player_index
        (1 + 32) * MAP_SIZE * MAP_SIZE + // territory_map
        8 + // entry_fee
        8 + // total_pot
        1 + // max_players
        4 + // turn_number
        8 + // created_at
        9 + // started_at
        9 + // completed_at
        33 + // winner
        1 + // weather_type
        1 + // weather_duration
        1 + // bump
        256; // buffer for safety

    pub fn get_current_player(&self) -> Option<&PlayerData> {
        if self.current_player_index as usize >= self.player_count as usize {
            return None;
        }
        Some(&self.players[self.current_player_index as usize])
    }

    pub fn get_player_mut(&mut self, player_key: &Pubkey) -> Option<&mut PlayerData> {
        self.players.iter_mut().find(|p| p.pubkey == *player_key && p.is_active)
    }

    pub fn advance_turn(&mut self) {
        let mut next_index = (self.current_player_index + 1) % self.player_count;
        
        // Skip inactive players
        let mut attempts = 0;
        while !self.players[next_index as usize].is_active && attempts < self.player_count {
            next_index = (next_index + 1) % self.player_count;
            attempts += 1;
        }
        
        self.current_player_index = next_index;
        
        // If we've cycled back to player 0, increment turn and update weather
        if next_index == 0 {
            self.turn_number += 1;
            self.update_weather();
        }
    }

    pub fn update_weather(&mut self) {
        if self.weather_duration > 0 {
            self.weather_duration -= 1;
        }
        
        // Generate new weather if expired or random chance
        if self.weather_duration == 0 {
            self.weather_type = self.generate_random_weather();
            self.weather_duration = match self.weather_type {
                WeatherType::Calm => 2,
                WeatherType::TradeWinds => 3,
                WeatherType::Storm => 2,
                WeatherType::Fog => 3,
            };
        }
    }

    fn generate_random_weather(&self) -> WeatherType {
        let seed = (self.turn_number + Clock::get().unwrap().unix_timestamp as u32) % 4;
        match seed {
            0 => WeatherType::Calm,
            1 => WeatherType::TradeWinds,
            2 => WeatherType::Storm,
            _ => WeatherType::Fog,
        }
    }
}

// ============================================================================
// EVENTS
// ============================================================================

#[event]
pub struct GameCreated {
    pub game_id: u64,
    pub authority: Pubkey,
    pub entry_fee: u64,
    pub max_players: u8,
}

#[event]
pub struct PlayerJoined {
    pub game_id: u64,
    pub player: Pubkey,
    pub player_count: u8,
}

#[event]
pub struct GameStarted {
    pub game_id: u64,
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

// ============================================================================
// ERROR CODES
// ============================================================================

#[error_code]
pub enum GameError {
    #[msg("Game is not active")]
    GameNotActive,
    #[msg("Game is full")]
    GameFull,
    #[msg("Not enough players to start")]
    NotEnoughPlayers,
    #[msg("Game already started")]
    GameAlreadyStarted,
    #[msg("Not your turn")]
    NotPlayerTurn,
    #[msg("Ship not found")]
    ShipNotFound,
    #[msg("Ship not at specified location")]
    ShipNotAtLocation,
    #[msg("Territory not controlled by player")]
    TerritoryNotControlled,
    #[msg("Insufficient resources")]
    InsufficientResources,
    #[msg("Fleet size limit reached")]
    FleetSizeLimit,
    #[msg("No adjacent controlled port")]
    NoAdjacentPort,
    #[msg("Position occupied")]
    PositionOccupied,
    #[msg("Game not joinable")]
    GameNotJoinable,
    #[msg("Invalid coordinate")]
    InvalidCoordinate,
    #[msg("Ships not in range")]
    ShipsNotInRange,
    #[msg("Unauthorized")]
    Unauthorized,
}

// ============================================================================
// INSTRUCTION CONTEXTS
// ============================================================================

#[derive(Accounts)]
pub struct CreateGame<'info> {
    #[account(
        init,
        payer = authority,
        space = PirateGame::SPACE,
        seeds = [GAME_SEED, authority.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub game: Account<'info, PirateGame>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(
        mut,
        constraint = game.status == GameStatus::WaitingForPlayers @ GameError::GameNotJoinable,
        constraint = game.player_count < game.max_players @ GameError::GameFull
    )]
    pub game: Account<'info, PirateGame>,
    
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct MakeMove<'info> {
    #[account(
        mut,
        constraint = game.status == GameStatus::Active @ GameError::GameNotActive
    )]
    pub game: Account<'info, PirateGame>,
    
    pub player: Signer<'info>,
}

// ============================================================================
// HELPER FUNCTIONS
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
    
    Resources { gold, crew, cannons, supplies }
}

pub fn get_territory_resources(x: u8, y: u8, territory_map: &[[TerritoryCell; MAP_SIZE]; MAP_SIZE]) -> Resources {
    if x as usize >= MAP_SIZE || y as usize >= MAP_SIZE {
        return Resources::default();
    }
    
    match territory_map[x as usize][y as usize].cell_type {
        TerritoryCellType::Island => Resources { gold: 0, crew: 0, cannons: 0, supplies: 3 },
        TerritoryCellType::Port => Resources { gold: 5, crew: 2, cannons: 0, supplies: 0 },
        TerritoryCellType::Treasure => Resources { gold: 10, crew: 0, cannons: 0, supplies: 0 },
        _ => Resources::default(),
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

pub fn has_adjacent_controlled_port(player: &PlayerData, x: u8, y: u8) -> bool {
    let offsets = [
        (-1, -1), (0, -1), (1, -1),
        (-1, 0),           (1, 0),
        (-1, 1),  (0, 1),  (1, 1)
    ];
    
    for (dx, dy) in offsets.iter() {
        let check_x = x as i8 + dx;
        let check_y = y as i8 + dy;
        
        if check_x >= 0 && check_y >= 0 && 
           check_x < MAP_SIZE as i8 && check_y < MAP_SIZE as i8 {
            let coord = format!("{},{}", check_x, check_y);
            if player.controlled_territories.contains(&coord) {
                return true;
            }
        }
    }
    
    false
}

pub fn generate_strategic_map(seed: u64) -> Result<[[TerritoryCell; MAP_SIZE]; MAP_SIZE]> {
    let mut map = [[TerritoryCell {
        cell_type: TerritoryCellType::Water,
        owner: None,
    }; MAP_SIZE]; MAP_SIZE];
    
    // Generate strategic layout
    for x in 0..MAP_SIZE {
        for y in 0..MAP_SIZE {
            let distance_from_center = ((x as f32 - 4.5).powi(2) + (y as f32 - 4.5).powi(2)).sqrt();
            let cell_seed = seed.wrapping_add((x * MAP_SIZE + y) as u64);
            let rand_val = (cell_seed * 1103515245 + 12345) % 100;
            
            map[x][y].cell_type = if distance_from_center < 2.0 {
                // Center - valuable territories
                if rand_val < 40 { TerritoryCellType::Treasure }
                else if rand_val < 70 { TerritoryCellType::Port }
                else { TerritoryCellType::Water }
            } else if distance_from_center < 4.0 {
                // Mid area - mixed
                if rand_val < 20 { TerritoryCellType::Island }
                else if rand_val < 35 { TerritoryCellType::Port }
                else { TerritoryCellType::Water }
            } else if distance_from_center < 6.0 {
                // Outer area - mostly water with hazards
                if rand_val < 10 { TerritoryCellType::Storm }
                else if rand_val < 15 { TerritoryCellType::Reef }
                else { TerritoryCellType::Water }
            } else {
                // Edge - hazardous
                if rand_val < 20 { TerritoryCellType::Whirlpool }
                else if rand_val < 35 { TerritoryCellType::Storm }
                else { TerritoryCellType::Water }
            };
        }
    }
    
    Ok(map)
}

pub fn deploy_starting_fleets(game: &mut PirateGame) -> Result<()> {
    let starting_positions = [
        (1, 1), (2, 1),     // Player 0: top-left
        (8, 1), (9, 1),     // Player 1: top-right  
        (1, 8), (1, 9),     // Player 2: bottom-left
        (8, 8), (9, 8),     // Player 3: bottom-right
    ];
    
    for i in 0..game.player_count as usize {
        let player = &mut game.players[i];
        if !player.is_active { continue; }
        
        let base_idx = i * 2;
        let pos1 = starting_positions[base_idx];
        let pos2 = starting_positions[base_idx + 1];
        
        // Create starting ships
        let sloop = ShipData {
            id: format!("{}_{}", player.pubkey, Clock::get()?.unix_timestamp),
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
            id: format!("{}_{}_{}", player.pubkey, Clock::get()?.unix_timestamp, "frigate"),
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
        
        player.ships.push(sloop);
        player.ships.push(frigate);
    }
    
    Ok(())
}