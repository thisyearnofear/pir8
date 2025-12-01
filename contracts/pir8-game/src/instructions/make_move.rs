use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct MakeMove<'info> {
    #[account(
        mut,
        constraint = game.status == GameStatus::Active @ PIR8Error::GameNotActive,
        constraint = game.get_current_player().unwrap().player_key == player.key() @ PIR8Error::NotYourTurn
    )]
    pub game: Account<'info, Game>,
    
    pub player: Signer<'info>,
}

pub fn make_move(ctx: Context<MakeMove>, coordinate: String) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let player = &ctx.accounts.player;
    let clock = Clock::get()?;
    
    // Validate coordinate format
    require!(
        is_valid_coordinate(&coordinate),
        PIR8Error::InvalidCoordinate
    );
    
    // Check if coordinate is available
    require!(
        game.is_coordinate_available(&coordinate),
        PIR8Error::CoordinateTaken
    );
    
    // Get the item at this coordinate
    let coordinate_index = coordinate_to_grid_index(&coordinate)?;
    let item = &game.grid[coordinate_index];
    
    // Add coordinate to chosen list
    game.add_coordinate(coordinate.clone());
    
    // Apply item effect to current player
    let mut points_gained = 0;
    let mut item_description = String::new();
    let mut requires_action = false;
    
    {
        let current_player = game.get_current_player_mut()?;
        current_player.last_move_at = clock.unix_timestamp;
        
        match item {
            GameItem::Points(points) => {
                points_gained = *points as u64;
                current_player.points = current_player.points
                    .checked_add(points_gained)
                    .ok_or(PIR8Error::ArithmeticOverflow)?;
                item_description = format!("Gained {} points", points_gained);
            },
            GameItem::Grinch => {
                item_description = "Found Grinch - can steal points from another player".to_string();
                requires_action = true;
            },
            GameItem::Pudding => {
                item_description = "Found Pudding - can reset another player's points to 0".to_string();
                requires_action = true;
            },
            GameItem::Present => {
                item_description = "Found Present - can gift 1000 points to another player".to_string();
                requires_action = true;
            },
            GameItem::Snowball => {
                item_description = "Found Snowball - area attack in multiplayer".to_string();
                // For now, no effect in basic implementation
            },
            GameItem::Mistletoe => {
                item_description = "Found Mistletoe - can swap scores with another player".to_string();
                requires_action = true;
            },
            GameItem::Tree => {
                item_description = "Found Christmas Tree - can choose the next coordinate".to_string();
                requires_action = true;
            },
            GameItem::Elf => {
                if current_player.has_elf {
                    item_description = "Already have Elf protection".to_string();
                } else {
                    current_player.has_elf = true;
                    item_description = "Gained Elf - can block one attack".to_string();
                }
            },
            GameItem::Bauble => {
                if current_player.has_bauble {
                    item_description = "Already have Bauble reflection".to_string();
                } else {
                    current_player.has_bauble = true;
                    item_description = "Gained Bauble - can reflect one attack".to_string();
                }
            },
            GameItem::Turkey => {
                current_player.points = 0;
                item_description = "Found Turkey - your points are reset to 0!".to_string();
            },
            GameItem::Cracker => {
                let old_points = current_player.points;
                current_player.points = current_player.points
                    .checked_mul(2)
                    .ok_or(PIR8Error::ArithmeticOverflow)?;
                item_description = format!("Found Cracker - doubled your score from {} to {}!", old_points, current_player.points);
            },
            GameItem::Bank => {
                if current_player.points > 0 {
                    current_player.banked_points = current_player.banked_points
                        .checked_add(current_player.points)
                        .ok_or(PIR8Error::ArithmeticOverflow)?;
                    let banked_amount = current_player.points;
                    current_player.points = 0;
                    item_description = format!("Banked {} points - they are now safe!", banked_amount);
                } else {
                    item_description = "Found Bank but no points to bank".to_string();
                }
            },
        }
    }
    
    // Check if game is complete
    let is_complete = game.is_game_complete();
    if is_complete {
        game.status = GameStatus::Completed;
        game.completed_at = Some(clock.unix_timestamp);
        game.final_scores = game.calculate_final_scores();
        
        // Determine winner
        if let Some(winner_index) = game.determine_winner() {
            game.winner = Some(game.players[winner_index].player_key);
        }
    } else if !requires_action {
        // Advance turn if no action required
        game.advance_turn();
    }
    
    // Emit event
    emit!(MoveMade {
        game_id: game.game_id,
        player: player.key(),
        coordinate: coordinate.clone(),
        item_found: format!("{:?}", item),
        points_gained,
        timestamp: clock.unix_timestamp,
    });
    
    if is_complete {
        emit!(GameCompleted {
            game_id: game.game_id,
            winner: game.winner.unwrap_or_default(),
            final_scores: game.final_scores.clone(),
            total_pot: game.total_pot,
            winner_payout: calculate_winner_payout(game.total_pot),
            timestamp: clock.unix_timestamp,
        });
    } else if !requires_action {
        emit!(TurnAdvanced {
            game_id: game.game_id,
            current_player: game.get_current_player()?.player_key,
            turn_index: game.current_player_index,
            timestamp: clock.unix_timestamp,
        });
    }
    
    msg!("Move made successfully");
    msg!("Player: {}", player.key());
    msg!("Coordinate: {}", coordinate);
    msg!("Item found: {:?}", item);
    msg!("Effect: {}", item_description);
    
    if requires_action {
        msg!("Special item requires additional action");
    }
    
    if is_complete {
        msg!("Game completed!");
        if let Some(winner) = game.winner {
            msg!("Winner: {}", winner);
        }
    }
    
    Ok(())
}

fn is_valid_coordinate(coordinate: &str) -> bool {
    if coordinate.len() != 2 {
        return false;
    }
    
    let chars: Vec<char> = coordinate.chars().collect();
    VALID_LETTERS.contains(&chars[0]) && VALID_NUMBERS.contains(&chars[1])
}

fn coordinate_to_grid_index(coordinate: &str) -> Result<usize> {
    let chars: Vec<char> = coordinate.chars().collect();
    let letter = chars[0];
    let number = chars[1];
    
    let col = match letter {
        'A' => 0, 'B' => 1, 'C' => 2, 'D' => 3, 'E' => 4, 'F' => 5, 'G' => 6,
        _ => return Err(PIR8Error::InvalidCoordinate.into()),
    };
    
    let row = match number {
        '1' => 0, '2' => 1, '3' => 2, '4' => 3, '5' => 4, '6' => 5, '7' => 6,
        _ => return Err(PIR8Error::InvalidCoordinate.into()),
    };
    
    Ok(row * GRID_SIZE + col)
}

fn calculate_winner_payout(total_pot: u64) -> u64 {
    // Winner gets 85% of the pot (15% kept for platform/development)
    total_pot.saturating_mul(85).saturating_div(100)
}