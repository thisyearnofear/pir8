use anchor_lang::prelude::*;

declare_id!("54S7Pw6cDQKWqW4JkdTGb3vEQqtnHsZ3SvB3LB1fST2V");

pub mod pirate_lib;
pub use pirate_lib::*;

#[program]
pub mod pir8_game {
    use super::*;

    /// Initialize the single global game (one-time setup)
    pub fn initialize_game(ctx: Context<InitializeGame>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let clock = Clock::get()?;

        game.authority = ctx.accounts.authority.key();
        game.status = GameStatus::Waiting;
        game.player_count = 0;
        game.current_player_index = 0;
        game.turn_number = 0;
        game.created_at = clock.unix_timestamp;
        game.started_at = None;
        game.completed_at = None;
        game.winner = None;
        game.weather_type = WeatherType::Calm;
        game.weather_duration = 2;
        game.bump = ctx.bumps.game;
        game.players = Vec::new();
        game.territory_map = Vec::new();

        msg!("Global game initialized");
        Ok(())
    }

    /// Join the global game
    pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player_pubkey = ctx.accounts.player.key();

        require!(game.status == GameStatus::Waiting, GameError::GameNotJoinable);
        require!(game.player_count < MAX_PLAYERS, GameError::GameFull);

        // Check if player already joined
        if game.players.iter().any(|p| p.pubkey == player_pubkey) {
            return Err(GameError::GameNotJoinable.into());
        }

        // Add player
        game.players.push(PlayerData {
            pubkey: player_pubkey,
            resources: Resources { gold: 1000, crew: 50, cannons: 10, supplies: 100 },
            ships: Vec::new(),
            controlled_territories: Vec::new(),
            total_score: 0,
            is_active: true,
            scan_charges: 3,
            scanned_coordinates: Vec::new(),
            speed_bonus_accumulated: 0,
            average_decision_time_ms: 0,
            total_moves: 0,
        });

        game.player_count += 1;

        emit!(PlayerJoined {
            player: player_pubkey,
            player_count: game.player_count,
        });

        Ok(())
    }

    /// Start the game (when 2+ players)
    pub fn start_game(ctx: Context<StartGame>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let clock = Clock::get()?;

        require!(game.status == GameStatus::Waiting, GameError::GameAlreadyStarted);
        require!(game.player_count >= MIN_PLAYERS, GameError::NotEnoughPlayers);

        // Generate map
        let seed = clock.unix_timestamp as u64;
        game.territory_map = generate_strategic_map(seed);

        // Deploy starting fleets
        deploy_starting_fleets(game)?;

        game.status = GameStatus::Active;
        game.started_at = Some(clock.unix_timestamp);
        game.turn_number = 1;

        emit!(GameStarted {
            player_count: game.player_count,
        });

        Ok(())
    }

    /// Reset the game (dev/testing only)
    pub fn reset_game(ctx: Context<ResetGame>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let clock = Clock::get()?;

        // Only authority can reset
        require!(ctx.accounts.authority.key() == game.authority, GameError::Unauthorized);

        game.status = GameStatus::Waiting;
        game.player_count = 0;
        game.current_player_index = 0;
        game.turn_number = 0;
        game.started_at = None;
        game.completed_at = None;
        game.winner = None;
        game.players.clear();
        game.territory_map.clear();

        msg!("Game reset at {}", clock.unix_timestamp);
        Ok(())
    }
}
