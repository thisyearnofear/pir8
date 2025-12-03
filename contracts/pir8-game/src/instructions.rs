use anchor_lang::prelude::*;
use crate::pirate_lib::*;

#[program]
pub mod pir8_game {
    use super::*;

    /// Create a new pirate battle arena
    pub fn create_game(
        ctx: Context<CreateGame>,
        entry_fee: u64,
        max_players: u8,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let clock = Clock::get()?;

        require!(max_players >= MIN_PLAYERS, GameError::NotEnoughPlayers);
        require!(max_players <= MAX_PLAYERS, GameError::GameFull);

        game.game_id = clock.unix_timestamp as u64;
        game.authority = ctx.accounts.authority.key();
        game.status = GameStatus::WaitingForPlayers;
        game.entry_fee = entry_fee;
        game.total_pot = entry_fee;
        game.max_players = max_players;
        game.player_count = 1;
        game.current_player_index = 0;
        game.turn_number = 1;
        game.created_at = clock.unix_timestamp;
        game.weather_type = WeatherType::Calm;
        game.weather_duration = 2;
        game.bump = ctx.bumps.game;

        // Initialize first player
        game.players[0] = PlayerData {
            pubkey: ctx.accounts.authority.key(),
            resources: Resources {
                gold: 1000,
                crew: 50,
                cannons: 20,
                supplies: 100,
            },
            ships: Vec::new(),
            controlled_territories: Vec::new(),
            total_score: 0,
            is_active: true,
        };

        // Initialize remaining player slots as empty
        for i in 1..4 {
            game.players[i] = PlayerData::default();
        }

        // Generate strategic map
        game.territory_map = generate_strategic_map(clock.unix_timestamp as u64)?;

        emit!(GameCreated {
            game_id: game.game_id,
            authority: ctx.accounts.authority.key(),
            entry_fee,
            max_players,
        });

        Ok(())
    }

    /// Join an existing pirate game
    pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
        let game = &mut ctx.accounts.game;

        // Add player to game
        let player_index = game.player_count as usize;
        game.players[player_index] = PlayerData {
            pubkey: ctx.accounts.player.key(),
            resources: Resources {
                gold: 1000,
                crew: 50,
                cannons: 20,
                supplies: 100,
            },
            ships: Vec::new(),
            controlled_territories: Vec::new(),
            total_score: 0,
            is_active: true,
        };

        game.player_count += 1;
        game.total_pot += game.entry_fee;

        // Start game if enough players
        if game.player_count >= 2 {
            game.status = GameStatus::Active;
            game.started_at = Some(Clock::get()?.unix_timestamp);
            
            // Deploy starting fleets
            deploy_starting_fleets(game)?;

            emit!(GameStarted {
                game_id: game.game_id,
                player_count: game.player_count,
            });
        }

        emit!(PlayerJoined {
            game_id: game.game_id,
            player: ctx.accounts.player.key(),
            player_count: game.player_count,
        });

        Ok(())
    }

    /// Move a ship to a new position
    pub fn move_ship(
        ctx: Context<MakeMove>,
        ship_id: String,
        to_x: u8,
        to_y: u8,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        
        let current_player = game.get_current_player().ok_or(GameError::NotPlayerTurn)?;
        require!(
            current_player.pubkey == ctx.accounts.player.key(),
            GameError::NotPlayerTurn
        );

        // Validate coordinates
        require!(
            to_x < MAP_SIZE as u8 && to_y < MAP_SIZE as u8,
            GameError::InvalidCoordinate
        );

        let player = game.get_player_mut(&ctx.accounts.player.key())
            .ok_or(GameError::NotPlayerTurn)?;
        
        let ship = player.ships.iter_mut()
            .find(|s| s.id == ship_id && s.health > 0)
            .ok_or(GameError::ShipNotFound)?;

        // Check movement range
        let distance = ((ship.position_x as i32 - to_x as i32).pow(2) + 
                       (ship.position_y as i32 - to_y as i32).pow(2)) as f32;
        let distance = distance.sqrt();
        
        require!(
            distance <= ship.speed as f32,
            GameError::ShipsNotInRange
        );

        let from_x = ship.position_x;
        let from_y = ship.position_y;

        // Update ship position
        ship.position_x = to_x;
        ship.position_y = to_y;
        ship.last_action_turn = game.turn_number;

        emit!(ShipMoved {
            game_id: game.game_id,
            player: ctx.accounts.player.key(),
            ship_id: ship_id.clone(),
            from_x,
            from_y,
            to_x,
            to_y,
        });

        // Advance turn
        game.advance_turn();

        Ok(())
    }

    /// Attack another ship
    pub fn attack_ship(
        ctx: Context<MakeMove>,
        attacker_ship_id: String,
        target_ship_id: String,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        
        let current_player = game.get_current_player().ok_or(GameError::NotPlayerTurn)?;
        require!(
            current_player.pubkey == ctx.accounts.player.key(),
            GameError::NotPlayerTurn
        );

        // Find attacker ship
        let mut attacker_stats = None;
        let mut attacker_pos = (0u8, 0u8);
        
        for player in game.players.iter() {
            if let Some(ship) = player.ships.iter().find(|s| s.id == attacker_ship_id && s.health > 0) {
                attacker_stats = Some((ship.attack, ship.position_x, ship.position_y));
                attacker_pos = (ship.position_x, ship.position_y);
                break;
            }
        }

        let (attacker_attack, _, _) = attacker_stats.ok_or(GameError::ShipNotFound)?;

        // Find and damage target ship
        let mut target_destroyed = false;
        let mut damage_dealt = 0u32;

        for player in game.players.iter_mut() {
            if let Some(target_ship) = player.ships.iter_mut()
                .find(|s| s.id == target_ship_id && s.health > 0) {
                
                // Check range (adjacent cells only)
                let distance = ((attacker_pos.0 as i32 - target_ship.position_x as i32).pow(2) + 
                              (attacker_pos.1 as i32 - target_ship.position_y as i32).pow(2)) as f32;
                
                require!(distance.sqrt() <= 1.5, GameError::ShipsNotInRange);

                // Calculate damage
                damage_dealt = attacker_attack.saturating_sub(target_ship.defense);
                damage_dealt = damage_dealt.max(1); // Minimum 1 damage
                
                target_ship.health = target_ship.health.saturating_sub(damage_dealt);
                target_destroyed = target_ship.health == 0;
                
                break;
            }
        }

        require!(damage_dealt > 0, GameError::ShipNotFound);

        emit!(ShipAttacked {
            game_id: game.game_id,
            attacker: ctx.accounts.player.key(),
            attacker_ship_id,
            target_ship_id,
            damage: damage_dealt,
            ship_destroyed: target_destroyed,
        });

        // Advance turn
        game.advance_turn();

        Ok(())
    }

    /// Claim territory with a ship
    pub fn claim_territory(
        ctx: Context<MakeMove>,
        ship_id: String,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        
        let current_player = game.get_current_player().ok_or(GameError::NotPlayerTurn)?;
        require!(
            current_player.pubkey == ctx.accounts.player.key(),
            GameError::NotPlayerTurn
        );

        let player = game.get_player_mut(&ctx.accounts.player.key())
            .ok_or(GameError::NotPlayerTurn)?;
        
        let ship = player.ships.iter()
            .find(|s| s.id == ship_id && s.health > 0)
            .ok_or(GameError::ShipNotFound)?;

        let territory_x = ship.position_x;
        let territory_y = ship.position_y;

        // Check if territory is claimable
        let territory = &game.territory_map[territory_x as usize][territory_y as usize];
        match territory.cell_type {
            TerritoryCellType::Water | TerritoryCellType::Storm | TerritoryCellType::Whirlpool => {
                return Err(GameError::InvalidCoordinate.into());
            }
            _ => {}
        }

        // Check if already owned
        if let Some(_) = territory.owner {
            return Err(GameError::PositionOccupied.into());
        }

        // Claim territory
        let territory_coord = format!("{},{}", territory_x, territory_y);
        if !player.controlled_territories.contains(&territory_coord) {
            player.controlled_territories.push(territory_coord);
        }

        game.territory_map[territory_x as usize][territory_y as usize].owner = 
            Some(ctx.accounts.player.key());

        emit!(TerritoryClaimed {
            game_id: game.game_id,
            player: ctx.accounts.player.key(),
            territory_x,
            territory_y,
        });

        // Advance turn
        game.advance_turn();

        Ok(())
    }
}