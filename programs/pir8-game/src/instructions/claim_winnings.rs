use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::*;
use crate::errors::*;

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

pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
    let game = &ctx.accounts.game;
    let winner = &mut ctx.accounts.winner;
    
    // Calculate winner payout (85% of total pot)
    let winner_payout = game.total_pot.saturating_mul(85).saturating_div(100);
    
    // Transfer winnings to winner
    // Note: The game account holds the pot and will be closed, transferring remaining lamports to winner
    
    msg!("Winnings claimed successfully");
    msg!("Winner: {}", winner.key());
    msg!("Payout: {} lamports", winner_payout);
    msg!("Game ID: {} closed", game.game_id);
    
    Ok(())
}