use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct ExecuteItemEffect<'info> {
    #[account(
        mut,
        constraint = game.status == GameStatus::Active @ PIR8Error::GameNotActive,
        constraint = game.get_current_player().unwrap().player_key == player.key() @ PIR8Error::NotYourTurn
    )]
    pub game: Account<'info, Game>,
    
    pub player: Signer<'info>,
}

pub fn execute_item_effect(
    ctx: Context<ExecuteItemEffect>,
    action: ItemAction,
    target_player: Option<Pubkey>,
    amount: Option<u64>,
) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let player = &ctx.accounts.player;
    let clock = Clock::get()?;
    
    let current_player_index = game.current_player_index as usize;
    let mut effect_description = String::new();
    
    // Validate target player if required
    let target_player_index = if let Some(target_key) = target_player {
        require!(
            target_key != player.key(),
            PIR8Error::CannotTargetSelf
        );
        
        game.get_player_index(&target_key)
            .ok_or(PIR8Error::TargetPlayerNotFound)?
    } else {
        0 // Default, will be ignored for actions that don't need target
    };
    
    match action {
        ItemAction::Steal { amount: steal_amount } => {
            require!(target_player.is_some(), PIR8Error::TargetPlayerNotFound);
            
            // Check if target has defense
            if game.players[target_player_index].has_elf {
                game.players[target_player_index].has_elf = false;
                effect_description = "Steal blocked by Elf!".to_string();
            } else if game.players[target_player_index].has_bauble {
                game.players[target_player_index].has_bauble = false;
                // Reflect the steal back
                let current_points = game.players[current_player_index].points;
                let reflected_amount = steal_amount.min(current_points);
                game.players[current_player_index].points = current_points.saturating_sub(reflected_amount);
                game.players[target_player_index].points = game.players[target_player_index].points
                    .saturating_add(reflected_amount);
                effect_description = format!("Steal reflected by Bauble! Lost {} points", reflected_amount);
            } else {
                // Execute steal
                let target_points = game.players[target_player_index].points;
                let actual_steal = steal_amount.min(target_points);
                
                game.players[target_player_index].points = target_points.saturating_sub(actual_steal);
                game.players[current_player_index].points = game.players[current_player_index].points
                    .saturating_add(actual_steal);
                
                effect_description = format!("Stole {} points from target player", actual_steal);
            }
        },
        
        ItemAction::Swap => {
            require!(target_player.is_some(), PIR8Error::TargetPlayerNotFound);
            
            // Check defenses
            if game.players[target_player_index].has_elf {
                game.players[target_player_index].has_elf = false;
                effect_description = "Swap blocked by Elf!".to_string();
            } else if game.players[target_player_index].has_bauble {
                game.players[target_player_index].has_bauble = false;
                effect_description = "Swap reflected by Bauble! (No effect since swap is neutral)".to_string();
            } else {
                // Execute swap
                let current_points = game.players[current_player_index].points;
                let target_points = game.players[target_player_index].points;
                
                game.players[current_player_index].points = target_points;
                game.players[target_player_index].points = current_points;
                
                effect_description = format!("Swapped scores: {} ↔ {}", current_points, target_points);
            }
        },
        
        ItemAction::Gift => {
            require!(target_player.is_some(), PIR8Error::TargetPlayerNotFound);
            require!(
                game.players[current_player_index].points >= GIFT_AMOUNT,
                PIR8Error::NotEnoughPoints
            );
            
            // Gift always works, no defenses
            game.players[current_player_index].points = game.players[current_player_index].points
                .saturating_sub(GIFT_AMOUNT);
            game.players[target_player_index].points = game.players[target_player_index].points
                .saturating_add(GIFT_AMOUNT);
            
            effect_description = format!("Gifted {} points to target player", GIFT_AMOUNT);
        },
        
        ItemAction::Kill => {
            require!(target_player.is_some(), PIR8Error::TargetPlayerNotFound);
            
            // Check defenses
            if game.players[target_player_index].has_elf {
                game.players[target_player_index].has_elf = false;
                effect_description = "Kill blocked by Elf!".to_string();
            } else if game.players[target_player_index].has_bauble {
                game.players[target_player_index].has_bauble = false;
                // Reflect kill back
                game.players[current_player_index].points = 0;
                effect_description = "Kill reflected by Bauble! Your points are reset to 0!".to_string();
            } else {
                // Execute kill
                let killed_points = game.players[target_player_index].points;
                game.players[target_player_index].points = 0;
                effect_description = format!("Reset target player's {} points to 0", killed_points);
            }
        },
        
        ItemAction::Choose { coordinate } => {
            // Validate coordinate
            require!(
                is_valid_coordinate(&coordinate),
                PIR8Error::InvalidCoordinate
            );
            require!(
                game.is_coordinate_available(&coordinate),
                PIR8Error::CoordinateTaken
            );
            
            effect_description = format!("Chose next coordinate: {}", coordinate);
            // The coordinate choice will be handled in a follow-up make_move call
        },
    }
    
    // Advance turn after executing special action
    game.advance_turn();
    
    // Emit events
    emit!(SpecialItemUsed {
        game_id: game.game_id,
        player: player.key(),
        item: format!("{:?}", action),
        target_player,
        effect_description: effect_description.clone(),
        timestamp: clock.unix_timestamp,
    });
    
    emit!(TurnAdvanced {
        game_id: game.game_id,
        current_player: game.get_current_player()?.player_key,
        turn_index: game.current_player_index,
        timestamp: clock.unix_timestamp,
    });
    
    msg!("Item effect executed successfully");
    msg!("Player: {}", player.key());
    msg!("Action: {:?}", action);
    msg!("Effect: {}", effect_description);
    
    Ok(())
}

fn is_valid_coordinate(coordinate: &str) -> bool {
    if coordinate.len() != 2 {
        return false;
    }
    
    let chars: Vec<char> = coordinate.chars().collect();
    crate::constants::VALID_LETTERS.contains(&chars[0]) && 
    crate::constants::VALID_NUMBERS.contains(&chars[1])
}