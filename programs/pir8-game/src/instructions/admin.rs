use crate::constants::GAME_SEED;
use crate::errors::GameError;
use crate::state::game::{GameStatus, PirateGame};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ResetGame<'info> {
    #[account(
        mut,
        seeds = [GAME_SEED, game.game_id.to_le_bytes().as_ref()],
        bump = game.bump,
        has_one = authority
    )]
    pub game: Account<'info, PirateGame>,
    pub authority: Signer<'info>,
}

pub fn reset_game(ctx: Context<ResetGame>) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let clock = Clock::get()?;

    // Only authority can reset (enforced by has_one, but explicit check for error clarity)
    require!(
        ctx.accounts.authority.key() == game.authority,
        GameError::Unauthorized
    );

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
