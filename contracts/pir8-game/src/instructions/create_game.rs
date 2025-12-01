use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;
use crate::constants::*;

#[derive(Accounts)]
#[instruction(entry_fee: u64, max_players: u8)]
pub struct CreateGame<'info> {
    #[account(
        init,
        payer = creator,
        space = Game::SPACE,
        seeds = [
            GAME_SEED,
            &config.total_games.to_le_bytes()
        ],
        bump
    )]
    pub game: Account<'info, Game>,
    
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump,
        constraint = !config.is_paused @ PIR8Error::GamePaused
    )]
    pub config: Account<'info, GameConfig>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    
    /// Switchboard randomness account for grid generation
    /// CHECK: This will be validated by Switchboard
    pub randomness_account_data: AccountInfo<'info>,
}

pub fn create_game(
    ctx: Context<CreateGame>,
    entry_fee: u64,
    max_players: u8,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let game = &mut ctx.accounts.game;
    let creator = &ctx.accounts.creator;
    let clock = Clock::get()?;
    
    // Validate parameters
    require!(
        entry_fee >= config.default_entry_fee,
        PIR8Error::EntryFeeTooLow
    );
    
    require!(
        max_players >= MIN_PLAYERS && max_players <= config.max_players_per_game,
        PIR8Error::MaxPlayersExceeded
    );

    // Generate random seed for grid
    let random_seed = generate_random_seed(&ctx.accounts.randomness_account_data, clock.unix_timestamp)?;

    // Initialize game state
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

    // Update global stats
    config.total_games = config.total_games.checked_add(1)
        .ok_or(PIR8Error::ArithmeticOverflow)?;

    // Emit event
    emit!(GameCreated {
        game_id: game.game_id,
        creator: creator.key(),
        entry_fee,
        max_players,
        timestamp: clock.unix_timestamp,
    });

    msg!("Game created successfully");
    msg!("Game ID: {}", game.game_id);
    msg!("Creator: {}", creator.key());
    msg!("Entry fee: {} lamports", entry_fee);

    Ok(())
}

fn generate_random_seed(
    _randomness_account: &AccountInfo,
    timestamp: i64,
) -> Result<u64> {
    // For now, use timestamp + slot as seed
    // In production, this should use Switchboard VRF
    let clock = Clock::get()?;
    let seed = (timestamp as u64)
        .wrapping_mul(clock.slot)
        .wrapping_add(clock.epoch);
    
    Ok(seed)
}

fn generate_game_grid(seed: u64) -> Result<Vec<GameItem>> {
    let mut grid = Vec::with_capacity(MAX_COORDINATES as usize);
    let mut rng_state = seed;
    
    // Use the item distribution to create the grid
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

    // Shuffle the grid using the seed
    for i in (1..grid.len()).rev() {
        rng_state = rng_state.wrapping_mul(1103515245).wrapping_add(12345);
        let j = (rng_state as usize) % (i + 1);
        grid.swap(i, j);
    }

    Ok(grid)
}