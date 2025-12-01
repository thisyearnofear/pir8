use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct StartGame<'info> {
    #[account(
        mut,
        constraint = game.status == GameStatus::Waiting @ PIR8Error::GameNotActive,
        constraint = game.players.len() >= MIN_PLAYERS as usize @ PIR8Error::GameNotReadyToStart,
        constraint = game.creator == creator.key() || game.players.len() >= game.max_players as usize @ PIR8Error::Unauthorized
    )]
    pub game: Account<'info, Game>,
    
    #[account(
        seeds = [CONFIG_SEED],
        bump,
        constraint = !config.is_paused @ PIR8Error::GamePaused
    )]
    pub config: Account<'info, GameConfig>,
    
    pub creator: Signer<'info>,
}

pub fn start_game(ctx: Context<StartGame>) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let clock = Clock::get()?;
    
    // Update game status
    game.status = GameStatus::Active;
    game.started_at = Some(clock.unix_timestamp);
    
    // Set first player (randomize based on grid seed)
    let first_player_index = (game.random_seed as usize) % game.players.len();
    game.current_player_index = first_player_index as u8;
    
    // Collect player keys for event
    let player_keys: Vec<Pubkey> = game.players.iter().map(|p| p.player_key).collect();
    
    // Emit event
    emit!(GameStarted {
        game_id: game.game_id,
        players: player_keys.clone(),
        grid_seed: game.random_seed,
        timestamp: clock.unix_timestamp,
    });
    
    msg!("Game started successfully!");
    msg!("Game ID: {}", game.game_id);
    msg!("Players: {:?}", player_keys);
    msg!("First player: {}", game.players[first_player_index].player_key);
    msg!("Total pot: {} lamports", game.total_pot);
    
    Ok(())
}