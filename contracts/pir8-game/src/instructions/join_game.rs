use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::*;
use crate::errors::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(
        mut,
        constraint = game.status == GameStatus::Waiting @ PIR8Error::GameNotActive,
        constraint = game.players.len() < game.max_players as usize @ PIR8Error::GameFull,
        constraint = !game.is_player_in_game(&player.key()) @ PIR8Error::PlayerNotInGame
    )]
    pub game: Account<'info, Game>,
    
    #[account(
        seeds = [CONFIG_SEED],
        bump,
        constraint = !config.is_paused @ PIR8Error::GamePaused
    )]
    pub config: Account<'info, GameConfig>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    /// Treasury account to receive entry fee
    #[account(
        mut,
        constraint = treasury.key() == config.treasury @ PIR8Error::InvalidTreasury
    )]
    pub treasury: SystemAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let player = &ctx.accounts.player;
    let treasury = &mut ctx.accounts.treasury;
    let clock = Clock::get()?;
    
    // Transfer entry fee to treasury
    let entry_fee = game.entry_fee;
    let platform_fee = entry_fee
        .checked_mul(ctx.accounts.config.platform_fee_bps as u64)
        .ok_or(PIR8Error::ArithmeticOverflow)?
        .checked_div(BASIS_POINTS)
        .ok_or(PIR8Error::ArithmeticOverflow)?;
    
    let game_pot = entry_fee
        .checked_sub(platform_fee)
        .ok_or(PIR8Error::ArithmeticOverflow)?;
    
    // Transfer entry fee from player
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: player.to_account_info(),
                to: treasury.to_account_info(),
            },
        ),
        entry_fee,
    )?;
    
    // Add player to game
    let new_player = PlayerState::new(player.key(), clock.unix_timestamp);
    game.players.push(new_player);
    
    // Update game pot
    game.total_pot = game.total_pot
        .checked_add(game_pot)
        .ok_or(PIR8Error::ArithmeticOverflow)?;
    
    // If game is full, auto-start
    let should_start = game.players.len() >= game.max_players as usize;
    
    // Emit event
    emit!(PlayerJoined {
        game_id: game.game_id,
        player: player.key(),
        player_count: game.players.len() as u8,
        timestamp: clock.unix_timestamp,
    });
    
    msg!("Player joined game successfully");
    msg!("Player: {}", player.key());
    msg!("Game ID: {}", game.game_id);
    msg!("Players: {}/{}", game.players.len(), game.max_players);
    msg!("Entry fee paid: {} lamports", entry_fee);
    msg!("Platform fee: {} lamports", platform_fee);
    msg!("Added to pot: {} lamports", game_pot);
    
    if should_start {
        msg!("Game is full - ready to start!");
    }
    
    Ok(())
}