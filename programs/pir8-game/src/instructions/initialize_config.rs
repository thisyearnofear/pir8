use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = authority,
        space = GameConfig::SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, GameConfig>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// Treasury account where platform fees are sent
    /// CHECK: This account will be validated as a valid system account
    pub treasury: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn initialize_config(
    ctx: Context<InitializeConfig>,
    entry_fee: u64,
    platform_fee_bps: u16,
    max_players: u8,
) -> Result<()> {
    // Validate parameters
    require!(
        platform_fee_bps <= MAX_PLATFORM_FEE_BPS,
        PIR8Error::PlatformFeeTooHigh
    );
    
    require!(
        entry_fee > 0,
        PIR8Error::EntryFeeTooLow
    );
    
    require!(
        max_players >= MIN_PLAYERS && max_players <= MAX_PLAYERS,
        PIR8Error::MaxPlayersExceeded
    );

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

    msg!("PIR8 game configuration initialized successfully");
    msg!("Authority: {}", config.authority);
    msg!("Entry fee: {} lamports", config.default_entry_fee);
    msg!("Platform fee: {} bps", config.platform_fee_bps);
    msg!("Max players: {}", config.max_players_per_game);

    Ok(())
}