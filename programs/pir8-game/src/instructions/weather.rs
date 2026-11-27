use crate::constants::*;
use crate::errors::GameError;
use crate::state::game::{GameStatus, PirateGame, WeatherType};
use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::{
    anchor::{vrf, vrf_callback},
    vrf::{
        self,
        consts::program_identity_pubkey,
        instructions::{
            create_request_high_priority_scoped_randomness_ix_const,
            create_request_randomness_ix_const, RequestRandomnessParams,
        },
        types::SerializableAccountMeta,
    },
};

const PROGRAM_IDENTITY: Pubkey = program_identity_pubkey(&crate::ID);

/// Per-game VRF weather tracker. Separate PDA so `PirateGame` layout is untouched.
#[account]
pub struct WeatherState {
    pub game: Pubkey,
    pub pending_seed: u8,
    pub request_count: u32,
    pub fulfilled_count: u32,
}

impl WeatherState {
    pub const SPACE: usize = 8 + 32 + 1 + 4 + 4;
}

#[vrf]
#[derive(Accounts)]
pub struct RequestWeatherRandomness<'info> {
    #[account(
        mut,
        seeds = [GAME_SEED, game.game_id.to_le_bytes().as_ref()],
        bump = game.bump,
        has_one = authority,
        constraint = game.status != GameStatus::Completed @ GameError::GameNotActive,
    )]
    pub game: Account<'info, PirateGame>,
    #[account(
        init_if_needed,
        payer = authority,
        space = WeatherState::SPACE,
        seeds = [b"weather", game.key().as_ref()],
        bump
    )]
    pub weather: Account<'info, WeatherState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: oracle queue, constrained to known VRF queues
    #[account(
        mut,
        constraint =
            oracle_queue.key() == vrf::consts::DEFAULT_QUEUE ||
            oracle_queue.key() == vrf::consts::DEFAULT_EPHEMERAL_QUEUE
    )]
    pub oracle_queue: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[vrf_callback]
#[derive(Accounts)]
pub struct CallbackWeatherRandomness<'info> {
    #[account(mut, has_one = game)]
    pub weather: Account<'info, WeatherState>,
    #[account(mut)]
    pub game: Account<'info, PirateGame>,
}

pub fn request_weather_randomness(
    ctx: Context<RequestWeatherRandomness>,
    client_seed: u8,
    high_priority: bool,
) -> Result<()> {
    require!(client_seed != 0, GameError::InvalidWeatherSeed);
    let params = RequestRandomnessParams {
        payer: ctx.accounts.authority.key(),
        oracle_queue: ctx.accounts.oracle_queue.key(),
        callback_program_id: crate::ID,
        callback_discriminator:
            crate::instruction::CallbackWeatherRandomness::DISCRIMINATOR.to_vec(),
        caller_seed: [client_seed; 32],
        accounts_metas: Some(vec![
            SerializableAccountMeta {
                pubkey: ctx.accounts.weather.key(),
                is_signer: false,
                is_writable: true,
            },
            SerializableAccountMeta {
                pubkey: ctx.accounts.game.key(),
                is_signer: false,
                is_writable: true,
            },
        ]),
        callback_args: Some(vec![client_seed]),
        ..Default::default()
    };
    let ix = if high_priority {
        create_request_high_priority_scoped_randomness_ix_const(params, PROGRAM_IDENTITY)
    } else {
        create_request_randomness_ix_const(params, PROGRAM_IDENTITY)
    };
    ctx.accounts
        .invoke_signed_vrf(&ctx.accounts.authority.to_account_info(), &ix)?;
    // Record attempt as pending: supersedes any prior unfulfilled request
    // so late callbacks for old seeds are ignored.
    let weather = &mut ctx.accounts.weather;
    weather.game = ctx.accounts.game.key();
    weather.pending_seed = client_seed;
    weather.request_count = weather.request_count.saturating_add(1);
    msg!("Weather randomness requested (seed={})", client_seed);
    Ok(())
}

pub fn callback_weather_randomness(
    ctx: Context<CallbackWeatherRandomness>,
    randomness: [u8; 32],
    client_seed: u8,
) -> Result<()> {
    let weather = &mut ctx.accounts.weather;
    // Bind callback to the latest request: ignore late/stale fulfillments
    // from superseded retries. Idempotent: same seed applied once.
    if client_seed != weather.pending_seed {
        msg!(
            "stale weather callback seed={} pending={}: ignored",
            client_seed,
            weather.pending_seed
        );
        return Ok(());
    }
    apply_weather_settlement(weather, &mut ctx.accounts.game, &randomness);
    Ok(())
}

/// DEV-ONLY demo helper: lets the game authority settle pending weather with
/// explicit randomness so the client loop can be exercised without the live
/// VRF oracle. Has no VRF signer gate — remove before any competitive use.
#[derive(Accounts)]
pub struct DebugSettleWeather<'info> {
    #[account(
        mut,
        seeds = [GAME_SEED, game.game_id.to_le_bytes().as_ref()],
        bump = game.bump,
        has_one = authority,
    )]
    pub game: Account<'info, PirateGame>,
    #[account(mut, has_one = game)]
    pub weather: Account<'info, WeatherState>,
    pub authority: Signer<'info>,
}

pub fn debug_settle_weather(
    ctx: Context<DebugSettleWeather>,
    randomness: [u8; 32],
) -> Result<()> {
    require!(
        ctx.accounts.weather.pending_seed != 0,
        GameError::NoWeatherRequestPending
    );
    apply_weather_settlement(
        &mut ctx.accounts.weather,
        &mut ctx.accounts.game,
        &randomness,
    );
    Ok(())
}

fn apply_weather_settlement(
    weather: &mut WeatherState,
    game: &mut PirateGame,
    randomness: &[u8; 32],
) {
    let roll = vrf::rnd::random_u8_with_range(randomness, 1, 100);
    game.weather_type = if roll <= 40 {
        WeatherType::Calm
    } else if roll <= 70 {
        WeatherType::TradeWinds
    } else if roll <= 90 {
        WeatherType::Storm
    } else {
        WeatherType::Fog
    };
    game.weather_duration = 2 + randomness[0] % 4;
    weather.pending_seed = 0;
    weather.fulfilled_count = weather.fulfilled_count.saturating_add(1);
    msg!("Weather settled: {:?} for {} turns", game.weather_type, game.weather_duration);
}
