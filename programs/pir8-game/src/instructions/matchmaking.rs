use crate::constants::*;
use crate::errors::GameError;
use crate::events::{GameStarted, PlayerJoined};
use crate::state::game::{deploy_starting_fleets, GameMode, GameStatus, PirateGame};
use crate::state::map::generate_strategic_map;
use crate::state::player::{PlayerData, Resources};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, system_instruction};

#[derive(Accounts)]
#[instruction(game_id: u64)]
pub struct CreateGame<'info> {
    #[account(
        init,
        seeds = [GAME_SEED, game_id.to_le_bytes().as_ref()],
        bump,
        payer = authority,
        space = PirateGame::SPACE
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
        seeds = [GAME_SEED, game.game_id.to_le_bytes().as_ref()],
        bump = game.bump
    )]
    pub game: Account<'info, PirateGame>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StartGame<'info> {
    #[account(
        mut,
        seeds = [GAME_SEED, game.game_id.to_le_bytes().as_ref()],
        bump = game.bump,
        has_one = authority
    )]
    pub game: Account<'info, PirateGame>,
    pub authority: Signer<'info>,
}

pub fn create_game(ctx: Context<CreateGame>, game_id: u64, mode: GameMode) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let clock = Clock::get()?;

    game.game_id = game_id;
    game.authority = ctx.accounts.authority.key();
    game.status = GameStatus::Waiting;
    game.mode = mode;
    game.player_count = 0;
    game.current_player_index = 0;
    game.turn_number = 0;
    game.created_at = clock.unix_timestamp;
    game.started_at = None;
    game.completed_at = None;
    game.winner = None;
    game.weather_type = crate::state::game::WeatherType::Calm;
    game.weather_duration = 2;
    game.bump = ctx.bumps.game;
    game.players = Vec::new();
    game.territory_map = Vec::new();

    msg!("Game {} created", game_id);
    Ok(())
}

pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let player = &ctx.accounts.player;
    let system_program = &ctx.accounts.system_program;
    let player_pubkey = player.key();

    require!(
        game.status == GameStatus::Waiting,
        GameError::GameNotJoinable
    );
    require!(game.player_count < MAX_PLAYERS, GameError::GameFull);

    // Check if player already joined
    if game.players.iter().any(|p| p.pubkey == player_pubkey) {
        return Err(GameError::GameNotJoinable.into());
    }

    // Transfer Entry Fee (0.1 SOL)
    // TODO: Make this configurable or dynamic based on game stakes
    let entry_fee = 100_000_000; // 0.1 SOL in lamports

    let transfer_instruction = system_instruction::transfer(&player.key(), &game.key(), entry_fee);

    invoke(
        &transfer_instruction,
        &[
            player.to_account_info(),
            game.to_account_info(),
            system_program.to_account_info(),
        ],
    )?;

    // Add player
    game.players.push(PlayerData {
        pubkey: player_pubkey,
        resources: Resources {
            gold: 1000,
            crew: 50,
            cannons: 10,
            supplies: 100,
        },
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

    // AUTO-START LOGIC
    // If the lobby is full, automatically start the game
    if game.player_count >= MAX_PLAYERS {
        msg!("Auto-starting game {}...", game.game_id);

        let clock = Clock::get()?;
        let seed = clock.unix_timestamp as u64;

        // Generate map
        game.territory_map = generate_strategic_map(seed);

        // Deploy starting fleets
        deploy_starting_fleets(game)?;

        game.status = GameStatus::Active;
        game.started_at = Some(clock.unix_timestamp);
        game.turn_number = 1;

        emit!(GameStarted {
            player_count: game.player_count,
        });
    }

    Ok(())
}

pub fn start_game(ctx: Context<StartGame>) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let clock = Clock::get()?;

    require!(
        game.status == GameStatus::Waiting,
        GameError::GameAlreadyStarted
    );
    require!(
        game.player_count >= MIN_PLAYERS,
        GameError::NotEnoughPlayers
    );

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
