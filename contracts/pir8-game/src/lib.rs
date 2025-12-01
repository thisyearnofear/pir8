use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

// ============================================================================
// CONSTANTS
// ============================================================================

pub const GAME_SEED: &[u8] = b"game";
pub const CONFIG_SEED: &[u8] = b"config";
pub const PLAYER_SEED: &[u8] = b"player";

pub const MAX_PLAYERS: u8 = 4;
pub const MIN_PLAYERS: u8 = 2;
pub const GRID_SIZE: usize = 7;
pub const MAX_COORDINATES: u8 = 49;
pub const DEFAULT_TURN_TIMEOUT: u64 = 30;

pub const DEFAULT_ENTRY_FEE: u64 = 100_000_000;
pub const DEFAULT_PLATFORM_FEE_BPS: u16 = 500;
pub const MAX_PLATFORM_FEE_BPS: u16 = 1000;
pub const BASIS_POINTS: u64 = 10_000;

pub const POINTS_200: u16 = 200;
pub const POINTS_1000: u16 = 1000;
pub const POINTS_3000: u16 = 3000;
pub const POINTS_5000: u16 = 5000;

pub const GIFT_AMOUNT: u64 = 1000;

pub const MAX_COORDINATE_LEN: usize = 2;
pub const MAX_NAME_LEN: usize = 32;
pub const MAX_DESCRIPTION_LEN: usize = 200;
pub const MAX_URI_LEN: usize = 200;

pub const SECONDS_PER_MINUTE: i64 = 60;
pub const MINUTES_PER_HOUR: i64 = 60;
pub const SECONDS_PER_HOUR: i64 = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;

pub const ITEM_DISTRIBUTION: &[(u8, u16)] = &[
    (21, 200), (17, 1000), (2, 3000), (1, 5000),
    (1, 0), (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10),
];

pub const VALID_LETTERS: &[char] = &['A', 'B', 'C', 'D', 'E', 'F', 'G'];
pub const VALID_NUMBERS: &[char] = &['1', '2', '3', '4', '5', '6', '7'];

pub const ERROR_GAME_FULL: &str = "Game is full";
pub const ERROR_GAME_NOT_ACTIVE: &str = "Game is not active";
pub const ERROR_NOT_YOUR_TURN: &str = "Not your turn";
pub const ERROR_INVALID_COORDINATE: &str = "Invalid coordinate";
pub const ERROR_COORDINATE_TAKEN: &str = "Coordinate already taken";
pub const ERROR_INSUFFICIENT_FUNDS: &str = "Insufficient funds";
pub const ERROR_UNAUTHORIZED: &str = "Unauthorized";

// ============================================================================
// EVENTS
// ============================================================================

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

// ============================================================================
// ERROR CODES
// ============================================================================

#[error_code]
pub enum PIR8Error {
    #[msg("Game is full - maximum players reached")]
    GameFull,
    #[msg("Game is not in active state")]
    GameNotActive,
    #[msg("Not your turn to play")]
    NotYourTurn,
    #[msg("Invalid coordinate format - use A1 to G7")]
    InvalidCoordinate,
    #[msg("Coordinate has already been chosen")]
    CoordinateTaken,
    #[msg("Insufficient funds for entry fee")]
    InsufficientFunds,
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
    #[msg("Player is not in this game")]
    PlayerNotInGame,
    #[msg("Game has already started")]
    GameAlreadyStarted,
    #[msg("Game is not ready to start - need more players")]
    GameNotReadyToStart,
    #[msg("Game is already completed")]
    GameAlreadyCompleted,
    #[msg("Invalid player index")]
    InvalidPlayerIndex,
    #[msg("Platform fee is too high")]
    PlatformFeeTooHigh,
    #[msg("Entry fee is too low")]
    EntryFeeTooLow,
    #[msg("Maximum players exceeded")]
    MaxPlayersExceeded,
    #[msg("Target player not found")]
    TargetPlayerNotFound,
    #[msg("Invalid item action for this item type")]
    InvalidItemAction,
    #[msg("Not enough points to perform this action")]
    NotEnoughPoints,
    #[msg("Player already has this defensive item")]
    DefensiveItemAlreadyOwned,
    #[msg("Cannot target yourself with this action")]
    CannotTargetSelf,
    #[msg("Game is paused")]
    GamePaused,
    #[msg("Turn timeout exceeded")]
    TurnTimeout,
    #[msg("Invalid grid generation seed")]
    InvalidGridSeed,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    #[msg("Invalid string length")]
    InvalidStringLength,
    #[msg("Random number generation failed")]
    RandomGenerationFailed,
    #[msg("Game configuration not initialized")]
    ConfigNotInitialized,
    #[msg("Winner already claimed")]
    WinnerAlreadyClaimed,
    #[msg("No winner determined yet")]
    NoWinnerDetermined,
    #[msg("Invalid treasury account")]
    InvalidTreasury,
    #[msg("Token transfer failed")]
    TokenTransferFailed,
}

// ============================================================================
// STATE TYPES
// ============================================================================

#[account]
pub struct GameConfig {
    pub authority: Pubkey,
    pub default_entry_fee: u64,
    pub platform_fee_bps: u16,
    pub max_players_per_game: u8,
    pub turn_timeout: u64,
    pub treasury: Pubkey,
    pub is_paused: bool,
    pub total_games: u64,
    pub total_volume: u64,
    pub reserved: [u8; 128],
}

impl GameConfig {
    pub const SPACE: usize = 8 + 32 + 8 + 2 + 1 + 8 + 32 + 1 + 8 + 8 + 128;
}

#[account]
pub struct Game {
    pub game_id: u64,
    pub creator: Pubkey,
    pub status: GameStatus,
    pub players: Vec<PlayerState>,
    pub current_player_index: u8,
    pub grid: Vec<GameItem>,
    pub chosen_coordinates: Vec<String>,
    pub entry_fee: u64,
    pub total_pot: u64,
    pub max_players: u8,
    pub turn_timeout: i64,
    pub created_at: i64,
    pub started_at: Option<i64>,
    pub completed_at: Option<i64>,
    pub winner: Option<Pubkey>,
    pub final_scores: Vec<u64>,
    pub random_seed: u64,
    pub metadata: GameMetadata,
    pub reserved: [u8; 64],
}

impl Game {
    pub const SPACE: usize = 8 + 8 + 32 + 1 + 4 + (4 * 120) + 1 + 4 + (49 * 16) + 4 + (49 * 16) + 8 + 8 + 1 + 8 + 8 + 9 + 9 + 33 + 4 + (4 * 8) + 8 + 32 + 64;

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
        self.chosen_coordinates.len() >= MAX_COORDINATES as usize || self.status == GameStatus::Completed
    }

    pub fn calculate_final_scores(&self) -> Vec<u64> {
        self.players.iter().map(|p| p.points + p.banked_points).collect()
    }

    pub fn determine_winner(&self) -> Option<usize> {
        let scores = self.calculate_final_scores();
        scores.iter().enumerate().max_by_key(|(_, &score)| score).map(|(index, _)| index)
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
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

// ============================================================================
// INSTRUCTION CONTEXT & HANDLERS
// ============================================================================

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(init, payer = authority, space = GameConfig::SPACE, seeds = [CONFIG_SEED], bump)]
    pub config: Account<'info, GameConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub treasury: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(entry_fee: u64, max_players: u8)]
pub struct CreateGame<'info> {
    #[account(init, payer = creator, space = Game::SPACE, seeds = [GAME_SEED, &config.total_games.to_le_bytes()], bump)]
    pub game: Account<'info, Game>,
    #[account(mut, seeds = [CONFIG_SEED], bump, constraint = !config.is_paused @ PIR8Error::GamePaused)]
    pub config: Account<'info, GameConfig>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub randomness_account_data: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(
        mut,
        constraint = game.status == GameStatus::Waiting @ PIR8Error::GameNotActive,
        constraint = game.players.len() < game.max_players as usize @ PIR8Error::GameFull,
        constraint = !game.is_player_in_game(&player.key()) @ PIR8Error::PlayerNotInGame
    )]
    pub game: Account<'info, Game>,
    #[account(seeds = [CONFIG_SEED], bump, constraint = !config.is_paused @ PIR8Error::GamePaused)]
    pub config: Account<'info, GameConfig>,
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut, constraint = treasury.key() == config.treasury @ PIR8Error::InvalidTreasury)]
    pub treasury: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MakeMove<'info> {
    #[account(
        mut,
        constraint = game.status == GameStatus::Active @ PIR8Error::GameNotActive,
        constraint = game.get_current_player().unwrap().player_key == player.key() @ PIR8Error::NotYourTurn
    )]
    pub game: Account<'info, Game>,
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExecuteItemEffect<'info> {
    #[account(
        mut,
        constraint = game.status == GameStatus::Active @ PIR8Error::GameNotActive,
        constraint = game.get_current_player().unwrap().player_key == player.key() @ PIR8Error::NotYourTurn
    )]
    pub game: Account<'info, Game>,
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct StartGame<'info> {
    #[account(
        mut,
        constraint = game.status == GameStatus::Waiting @ PIR8Error::GameNotActive,
        constraint = game.players.len() >= MIN_PLAYERS as usize @ PIR8Error::GameNotReadyToStart,
        constraint = game.creator == creator.key() || game.players.len() >= game.max_players as usize @ PIR8Error::Unauthorized
    )]
    pub game: Account<'info, Game>,
    #[account(seeds = [CONFIG_SEED], bump, constraint = !config.is_paused @ PIR8Error::GamePaused)]
    pub config: Account<'info, GameConfig>,
    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct CompleteGame<'info> {
    #[account(
        mut,
        constraint = game.status == GameStatus::Active @ PIR8Error::GameNotActive,
        constraint = game.is_game_complete() @ PIR8Error::GameNotReadyToStart
    )]
    pub game: Account<'info, Game>,
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        mut,
        constraint = game.status == GameStatus::Completed @ PIR8Error::GameNotActive,
        constraint = game.winner.is_some() @ PIR8Error::NoWinnerDetermined,
        constraint = game.winner.unwrap() == winner.key() @ PIR8Error::Unauthorized,
        close = winner
    )]
    pub game: Account<'info, Game>,
    #[account(mut)]
    pub winner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetGameStatus<'info> {
    #[account(mut, seeds = [CONFIG_SEED], bump, constraint = config.authority == authority.key() @ PIR8Error::Unauthorized)]
    pub config: Account<'info, GameConfig>,
    pub authority: Signer<'info>,
}

// ============================================================================
// PROGRAM
// ============================================================================

#[program]
pub mod pir8_game {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        entry_fee: u64,
        platform_fee_bps: u16,
        max_players: u8,
    ) -> Result<()> {
        require!(platform_fee_bps <= MAX_PLATFORM_FEE_BPS, PIR8Error::PlatformFeeTooHigh);
        require!(entry_fee > 0, PIR8Error::EntryFeeTooLow);
        require!(max_players >= MIN_PLAYERS && max_players <= MAX_PLAYERS, PIR8Error::MaxPlayersExceeded);

        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.default_entry_fee = entry_fee;
        config.platform_fee_bps = platform_fee_bps;
        config.max_players_per_game = max_players;
        config.turn_timeout = DEFAULT_TURN_TIMEOUT;
        config.treasury = ctx.accounts.treasury.key();
        config.is_paused = false;
        config.total_games = 0;
        config.total_volume = 0;

        msg!("PIR8 game configuration initialized");
        Ok(())
    }

    pub fn create_game(ctx: Context<CreateGame>, entry_fee: u64, max_players: u8) -> Result<()> {
        let config = &mut ctx.accounts.config;
        let game = &mut ctx.accounts.game;
        let creator = &ctx.accounts.creator;
        let clock = Clock::get()?;

        require!(entry_fee >= config.default_entry_fee, PIR8Error::EntryFeeTooLow);
        require!(max_players >= MIN_PLAYERS && max_players <= config.max_players_per_game, PIR8Error::MaxPlayersExceeded);

        let random_seed = generate_random_seed(&ctx.accounts.randomness_account_data, clock.unix_timestamp)?;

        game.game_id = config.total_games;
        game.creator = creator.key();
        game.status = GameStatus::Waiting;
        game.players = Vec::new();
        game.current_player_index = 0;
        game.grid = generate_game_grid(random_seed)?;
        game.chosen_coordinates = Vec::new();
        game.entry_fee = entry_fee;
        game.total_pot = 0;
        game.max_players = max_players;
        game.turn_timeout = config.turn_timeout as i64;
        game.created_at = clock.unix_timestamp;
        game.started_at = None;
        game.completed_at = None;
        game.winner = None;
        game.final_scores = Vec::new();
        game.random_seed = random_seed;
        game.metadata = GameMetadata::default();

        config.total_games = config.total_games.checked_add(1).ok_or(PIR8Error::ArithmeticOverflow)?;

        emit!(GameCreated {
            game_id: game.game_id,
            creator: creator.key(),
            entry_fee,
            max_players,
            timestamp: clock.unix_timestamp,
        });

        msg!("Game created: ID {}", game.game_id);
        Ok(())
    }

    pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = &ctx.accounts.player;
        let clock = Clock::get()?;

        let entry_fee = game.entry_fee;
        let platform_fee = entry_fee
            .checked_mul(ctx.accounts.config.platform_fee_bps as u64)
            .ok_or(PIR8Error::ArithmeticOverflow)?
            .checked_div(BASIS_POINTS)
            .ok_or(PIR8Error::ArithmeticOverflow)?;

        let game_pot = entry_fee.checked_sub(platform_fee).ok_or(PIR8Error::ArithmeticOverflow)?;

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: player.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
            ),
            entry_fee,
        )?;

        let new_player = PlayerState::new(player.key(), clock.unix_timestamp);
        game.players.push(new_player);
        game.total_pot = game.total_pot.checked_add(game_pot).ok_or(PIR8Error::ArithmeticOverflow)?;

        emit!(PlayerJoined {
            game_id: game.game_id,
            player: player.key(),
            player_count: game.players.len() as u8,
            timestamp: clock.unix_timestamp,
        });

        msg!("Player joined game {}", game.game_id);
        Ok(())
    }

    pub fn make_move(ctx: Context<MakeMove>, coordinate: String) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = &ctx.accounts.player;
        let clock = Clock::get()?;

        require!(is_valid_coordinate(&coordinate), PIR8Error::InvalidCoordinate);
        require!(game.is_coordinate_available(&coordinate), PIR8Error::CoordinateTaken);

        let coordinate_index = coordinate_to_grid_index(&coordinate)?;
        let item = &game.grid[coordinate_index];

        game.add_coordinate(coordinate.clone());

        let mut points_gained = 0;
        let mut item_description = String::new();
        let mut requires_action = false;

        {
            let current_player = game.get_current_player_mut()?;
            current_player.last_move_at = clock.unix_timestamp;

            match item {
                GameItem::Points(points) => {
                    points_gained = *points as u64;
                    current_player.points = current_player.points.checked_add(points_gained).ok_or(PIR8Error::ArithmeticOverflow)?;
                    item_description = format!("Gained {} points", points_gained);
                },
                GameItem::Grinch => {
                    item_description = "Found Grinch - can steal points".to_string();
                    requires_action = true;
                },
                GameItem::Pudding => {
                    item_description = "Found Pudding - can reset player points".to_string();
                    requires_action = true;
                },
                GameItem::Present => {
                    item_description = "Found Present - can gift 1000 points".to_string();
                    requires_action = true;
                },
                GameItem::Snowball => {
                    item_description = "Found Snowball - area attack".to_string();
                },
                GameItem::Mistletoe => {
                    item_description = "Found Mistletoe - can swap scores".to_string();
                    requires_action = true;
                },
                GameItem::Tree => {
                    item_description = "Found Tree - choose next coordinate".to_string();
                    requires_action = true;
                },
                GameItem::Elf => {
                    if !current_player.has_elf {
                        current_player.has_elf = true;
                        item_description = "Gained Elf - block one attack".to_string();
                    }
                },
                GameItem::Bauble => {
                    if !current_player.has_bauble {
                        current_player.has_bauble = true;
                        item_description = "Gained Bauble - reflect one attack".to_string();
                    }
                },
                GameItem::Turkey => {
                    current_player.points = 0;
                    item_description = "Found Turkey - points reset to 0!".to_string();
                },
                GameItem::Cracker => {
                    let old_points = current_player.points;
                    current_player.points = current_player.points.checked_mul(2).ok_or(PIR8Error::ArithmeticOverflow)?;
                    item_description = format!("Cracker - doubled score!");
                },
                GameItem::Bank => {
                    if current_player.points > 0 {
                        current_player.banked_points = current_player.banked_points.checked_add(current_player.points).ok_or(PIR8Error::ArithmeticOverflow)?;
                        current_player.points = 0;
                        item_description = "Banked points - now safe!".to_string();
                    }
                },
            }
        }

        let is_complete = game.is_game_complete();
        if is_complete {
            game.status = GameStatus::Completed;
            game.completed_at = Some(clock.unix_timestamp);
            game.final_scores = game.calculate_final_scores();
            if let Some(winner_index) = game.determine_winner() {
                game.winner = Some(game.players[winner_index].player_key);
            }
        } else if !requires_action {
            game.advance_turn();
        }

        emit!(MoveMade {
            game_id: game.game_id,
            player: player.key(),
            coordinate: coordinate.clone(),
            item_found: format!("{:?}", item),
            points_gained,
            timestamp: clock.unix_timestamp,
        });

        msg!("Move made: {}", coordinate);
        Ok(())
    }

    pub fn execute_item_effect(
        ctx: Context<ExecuteItemEffect>,
        action: ItemAction,
        target_player: Option<Pubkey>,
        amount: Option<u64>,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = &ctx.accounts.player;
        let clock = Clock::get()?;

        let current_player_index = game.current_player_index as usize;
        let mut effect_description = String::new();

        let target_player_index = if let Some(target_key) = target_player {
            require!(target_key != player.key(), PIR8Error::CannotTargetSelf);
            game.get_player_index(&target_key).ok_or(PIR8Error::TargetPlayerNotFound)?
        } else {
            0
        };

        match action {
            ItemAction::Steal { amount: steal_amount } => {
                if game.players[target_player_index].has_elf {
                    game.players[target_player_index].has_elf = false;
                    effect_description = "Steal blocked by Elf!".to_string();
                } else if game.players[target_player_index].has_bauble {
                    game.players[target_player_index].has_bauble = false;
                    let current_points = game.players[current_player_index].points;
                    let reflected_amount = steal_amount.min(current_points);
                    game.players[current_player_index].points = current_points.saturating_sub(reflected_amount);
                    game.players[target_player_index].points = game.players[target_player_index].points.saturating_add(reflected_amount);
                    effect_description = "Steal reflected by Bauble!".to_string();
                } else {
                    let target_points = game.players[target_player_index].points;
                    let actual_steal = steal_amount.min(target_points);
                    game.players[target_player_index].points = target_points.saturating_sub(actual_steal);
                    game.players[current_player_index].points = game.players[current_player_index].points.saturating_add(actual_steal);
                    effect_description = "Stole points!".to_string();
                }
            },
            ItemAction::Swap => {
                if game.players[target_player_index].has_elf {
                    game.players[target_player_index].has_elf = false;
                    effect_description = "Swap blocked by Elf!".to_string();
                } else {
                    let current_points = game.players[current_player_index].points;
                    let target_points = game.players[target_player_index].points;
                    game.players[current_player_index].points = target_points;
                    game.players[target_player_index].points = current_points;
                    effect_description = "Scores swapped!".to_string();
                }
            },
            ItemAction::Gift => {
                if game.players[current_player_index].points >= GIFT_AMOUNT {
                    game.players[current_player_index].points = game.players[current_player_index].points.saturating_sub(GIFT_AMOUNT);
                    game.players[target_player_index].points = game.players[target_player_index].points.saturating_add(GIFT_AMOUNT);
                    effect_description = "Gifted points!".to_string();
                }
            },
            ItemAction::Kill => {
                if game.players[target_player_index].has_elf {
                    game.players[target_player_index].has_elf = false;
                    effect_description = "Kill blocked by Elf!".to_string();
                } else {
                    game.players[target_player_index].points = 0;
                    effect_description = "Reset target points!".to_string();
                }
            },
            ItemAction::Choose { coordinate } => {
                require!(is_valid_coordinate(&coordinate), PIR8Error::InvalidCoordinate);
                effect_description = format!("Chose: {}", coordinate);
            },
        }

        game.advance_turn();

        emit!(SpecialItemUsed {
            game_id: game.game_id,
            player: player.key(),
            item: format!("{:?}", action),
            target_player,
            effect_description,
            timestamp: clock.unix_timestamp,
        });

        msg!("Item effect executed");
        Ok(())
    }

    pub fn start_game(ctx: Context<StartGame>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let clock = Clock::get()?;

        game.status = GameStatus::Active;
        game.started_at = Some(clock.unix_timestamp);

        let first_player_index = (game.random_seed as usize) % game.players.len();
        game.current_player_index = first_player_index as u8;

        let player_keys: Vec<Pubkey> = game.players.iter().map(|p| p.player_key).collect();

        emit!(GameStarted {
            game_id: game.game_id,
            players: player_keys,
            grid_seed: game.random_seed,
            timestamp: clock.unix_timestamp,
        });

        msg!("Game started!");
        Ok(())
    }

    pub fn complete_game(ctx: Context<CompleteGame>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let clock = Clock::get()?;

        game.status = GameStatus::Completed;
        game.completed_at = Some(clock.unix_timestamp);
        game.final_scores = game.calculate_final_scores();

        if let Some(winner_index) = game.determine_winner() {
            game.winner = Some(game.players[winner_index].player_key);
        }

        let winner_payout = calculate_winner_payout(game.total_pot);

        emit!(GameCompleted {
            game_id: game.game_id,
            winner: game.winner.unwrap_or_default(),
            final_scores: game.final_scores.clone(),
            total_pot: game.total_pot,
            winner_payout,
            timestamp: clock.unix_timestamp,
        });

        msg!("Game completed!");
        Ok(())
    }

    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let game = &ctx.accounts.game;
        let winner_payout = calculate_winner_payout(game.total_pot);

        msg!("Winnings claimed: {} lamports", winner_payout);
        Ok(())
    }

    pub fn set_game_status(ctx: Context<SetGameStatus>, is_paused: bool) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.is_paused = is_paused;

        msg!("Game status: paused = {}", is_paused);
        Ok(())
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

fn generate_random_seed(_randomness_account: &AccountInfo, timestamp: i64) -> Result<u64> {
    let clock = Clock::get()?;
    let seed = (timestamp as u64)
        .wrapping_mul(clock.slot)
        .wrapping_add(clock.epoch);
    Ok(seed)
}

fn generate_game_grid(seed: u64) -> Result<Vec<GameItem>> {
    let mut grid = Vec::with_capacity(MAX_COORDINATES as usize);
    let mut rng_state = seed;

    for &(count, item_type) in ITEM_DISTRIBUTION {
        for _ in 0..count {
            let item = match item_type {
                200 => GameItem::Points(POINTS_200),
                1000 => GameItem::Points(POINTS_1000),
                3000 => GameItem::Points(POINTS_3000),
                5000 => GameItem::Points(POINTS_5000),
                0 => GameItem::Grinch,
                1 => GameItem::Pudding,
                2 => GameItem::Present,
                3 => GameItem::Snowball,
                4 => GameItem::Mistletoe,
                5 => GameItem::Tree,
                6 => GameItem::Elf,
                7 => GameItem::Bauble,
                8 => GameItem::Turkey,
                9 => GameItem::Cracker,
                10 => GameItem::Bank,
                _ => return Err(PIR8Error::InvalidGridSeed.into()),
            };
            grid.push(item);
        }
    }

    for i in (1..grid.len()).rev() {
        rng_state = rng_state.wrapping_mul(1103515245).wrapping_add(12345);
        let j = (rng_state as usize) % (i + 1);
        grid.swap(i, j);
    }

    Ok(grid)
}

fn is_valid_coordinate(coordinate: &str) -> bool {
    if coordinate.len() != 2 {
        return false;
    }
    let chars: Vec<char> = coordinate.chars().collect();
    VALID_LETTERS.contains(&chars[0]) && VALID_NUMBERS.contains(&chars[1])
}

fn coordinate_to_grid_index(coordinate: &str) -> Result<usize> {
    let chars: Vec<char> = coordinate.chars().collect();
    let letter = chars[0];
    let number = chars[1];

    let col = match letter {
        'A' => 0, 'B' => 1, 'C' => 2, 'D' => 3, 'E' => 4, 'F' => 5, 'G' => 6,
        _ => return Err(PIR8Error::InvalidCoordinate.into()),
    };

    let row = match number {
        '1' => 0, '2' => 1, '3' => 2, '4' => 3, '5' => 4, '6' => 5, '7' => 6,
        _ => return Err(PIR8Error::InvalidCoordinate.into()),
    };

    Ok(row * GRID_SIZE + col)
}

fn calculate_winner_payout(total_pot: u64) -> u64 {
    total_pot.saturating_mul(85).saturating_div(100)
}
