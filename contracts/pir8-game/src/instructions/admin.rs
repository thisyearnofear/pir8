use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct SetGameStatus<'info> {
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump,
        constraint = config.authority == authority.key() @ PIR8Error::Unauthorized
    )]
    pub config: Account<'info, GameConfig>,
    
    pub authority: Signer<'info>,
}

pub fn set_game_status(ctx: Context<SetGameStatus>, is_paused: bool) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.is_paused = is_paused;
    
    msg!("Game status updated: paused = {}", is_paused);
    Ok(())
}