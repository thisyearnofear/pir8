use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct CompleteGame<'info> {
    #[account(
        mut,
        constraint = game.status == GameStatus::Active @ PIR8Error::GameNotActive,
        constraint = game.is_game_complete() @ PIR8Error::GameNotReadyToStart
    )]
    pub game: Account<'info, Game>,
    
    /// Any player can trigger game completion when it's finished
    pub player: Signer<'info>,
}

pub fn complete_game(ctx: Context<CompleteGame>) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let clock = Clock::get()?;
    
    // Mark game as completed
    game.status = GameStatus::Completed;
    game.completed_at = Some(clock.unix_timestamp);
    
    // Calculate final scores
    game.final_scores = game.calculate_final_scores();
    
    // Determine winner
    if let Some(winner_index) = game.determine_winner() {
        game.winner = Some(game.players[winner_index].player_key);
    }
    
    let winner_payout = calculate_winner_payout(game.total_pot);
    
    // Emit completion event
    emit!(crate::constants::GameCompleted {
        game_id: game.game_id,
        winner: game.winner.unwrap_or_default(),
        final_scores: game.final_scores.clone(),
        total_pot: game.total_pot,
        winner_payout,
        timestamp: clock.unix_timestamp,
    });
    
    msg!("Game completed successfully");
    msg!("Game ID: {}", game.game_id);
    msg!("Final scores: {:?}", game.final_scores);
    if let Some(winner) = game.winner {
        msg!("Winner: {}", winner);
        msg!("Winner payout: {} lamports", winner_payout);
    }
    
    Ok(())
}

fn calculate_winner_payout(total_pot: u64) -> u64 {
    // Winner gets 85% of the pot
    total_pot.saturating_mul(85).saturating_div(100)
}