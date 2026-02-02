use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;

declare_id!("54S7Pw6cDQKWqW4JkdTGb3vEQqtnHsZ3SvB3LB1fST2V");

pub mod pirate_lib;
pub use pirate_lib::*;

#[program]
pub mod pir8_game {
    use super::*;

    /// Register an autonomous agent
    pub fn register_agent(ctx: Context<RegisterAgent>, name: String, version: String) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        let clock = Clock::get()?;

        agent.owner = ctx.accounts.owner.key();
        agent.name = name;
        agent.version = version;
        agent.last_active = clock.unix_timestamp;
        
        msg!("Agent {} registered", agent.name);
        Ok(())
    }

    /// Create a new game instance
    pub fn create_game(ctx: Context<CreateGame>, game_id: u64) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let clock = Clock::get()?;

        game.game_id = game_id;
        game.authority = ctx.accounts.authority.key();
        game.status = GameStatus::Waiting;
        game.player_count = 0;
        game.current_player_index = 0;
        game.turn_number = 0;
        game.created_at = clock.unix_timestamp;
        game.started_at = None;
        game.completed_at = None;
        game.winner = None;
        game.weather_type = WeatherType::Calm;
        game.weather_duration = 2;
        game.bump = ctx.bumps.game;
        game.players = Vec::new();
        game.territory_map = Vec::new();

        msg!("Game {} created", game_id);
        Ok(())
    }

    /// Join the global game
    pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player = &ctx.accounts.player;
        let system_program = &ctx.accounts.system_program;
        let player_pubkey = player.key();

        require!(game.status == GameStatus::Waiting, GameError::GameNotJoinable);
        require!(game.player_count < MAX_PLAYERS, GameError::GameFull);

        // Check if player already joined
        if game.players.iter().any(|p| p.pubkey == player_pubkey) {
            return Err(GameError::GameNotJoinable.into());
        }

        // Transfer Entry Fee (0.1 SOL)
        let entry_fee = 100_000_000; // 0.1 SOL in lamports
        
        let transfer_instruction = system_instruction::transfer(
            &player.key(),
            &game.key(),
            entry_fee,
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                player.to_account_info(),
                game.to_account_info(),
                system_program.to_account_info(),
            ],
        )?;

        // Add player
        game.players.push(PlayerData {
            pubkey: player_pubkey,
            resources: Resources { gold: 1000, crew: 50, cannons: 10, supplies: 100 },
            ships: Vec::new(),
            controlled_territories: Vec::new(),
            total_score: 0,
            is_active: true,
            scan_charges: 3,
            scanned_coordinates: Vec::new(),
            speed_bonus_accumulated: 0,
            average_decision_time_ms: 0,
            total_moves: 0,
        });

        game.player_count += 1;

        emit!(PlayerJoined {
            player: player_pubkey,
            player_count: game.player_count,
        });

        Ok(())
    }

    /// Start the game (when 2+ players)
    pub fn start_game(ctx: Context<StartGame>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let clock = Clock::get()?;

        require!(game.status == GameStatus::Waiting, GameError::GameAlreadyStarted);
        require!(game.player_count >= MIN_PLAYERS, GameError::NotEnoughPlayers);

        // Generate map
        let seed = clock.unix_timestamp as u64;
        game.territory_map = generate_strategic_map(seed);

        // Deploy starting fleets
        deploy_starting_fleets(game)?;

        game.status = GameStatus::Active;
        game.started_at = Some(clock.unix_timestamp);
        game.turn_number = 1;

        emit!(GameStarted {
            player_count: game.player_count,
        });

        Ok(())
    }

    /// Reset the game (dev/testing only)
    pub fn reset_game(ctx: Context<ResetGame>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let clock = Clock::get()?;

        // Only authority can reset
        require!(ctx.accounts.authority.key() == game.authority, GameError::Unauthorized);

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

    /// Move a ship to a new position
    pub fn move_ship(
        ctx: Context<MakeMove>,
        ship_id: String,
        to_x: u8,
        to_y: u8,
        decision_time_ms: Option<u64>,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player_pubkey = ctx.accounts.player.key();

        // Validate game state
        require!(game.status == GameStatus::Active, GameError::GameNotActive);
        
        // Validate it's the player's turn
        let current_player = game.get_current_player()
            .ok_or(GameError::NotPlayerTurn)?;
        require!(current_player.pubkey == player_pubkey, GameError::NotPlayerTurn);

        // Validate coordinates
        require!(to_x < MAP_SIZE as u8 && to_y < MAP_SIZE as u8, GameError::InvalidCoordinate);

        // First, find the ship and validate move distance (immutable borrow)
        let (from_x, from_y, ship_speed) = {
            let player = game.players.iter()
                .find(|p| p.pubkey == player_pubkey)
                .ok_or(GameError::NotPlayerTurn)?;
            
            let ship = player.ships.iter()
                .find(|s| s.id == ship_id)
                .ok_or(GameError::ShipNotFound)?;

            (ship.position_x, ship.position_y, ship.speed)
        };

        // Validate move distance (Manhattan distance <= ship speed)
        let distance = ((to_x as i16 - from_x as i16).abs() + (to_y as i16 - from_y as i16).abs()) as u32;
        require!(distance <= ship_speed, GameError::InvalidCoordinate);

        // Check if position is occupied by another ship
        for p in game.players.iter() {
            for s in p.ships.iter() {
                if s.position_x == to_x && s.position_y == to_y && s.id != ship_id {
                    return Err(GameError::PositionOccupied.into());
                }
            }
        }

        // Store turn number before mutable borrow
        let current_turn = game.turn_number;

        // Now get mutable reference and update ship
        let player = game.get_player_mut(&player_pubkey)
            .ok_or(GameError::NotPlayerTurn)?;
        
        let ship = player.ships.iter_mut()
            .find(|s| s.id == ship_id)
            .ok_or(GameError::ShipNotFound)?;

        // Move the ship
        ship.position_x = to_x;
        ship.position_y = to_y;
        ship.last_action_turn = current_turn;

        // Apply timing bonus if provided
        if let Some(time_ms) = decision_time_ms {
            let bonus = calculate_speed_bonus(time_ms);
            player.speed_bonus_accumulated += bonus;
            update_average_decision_time(player, time_ms);

            emit!(MoveExecuted {
                game_id: 0, // Global game
                player: player_pubkey,
                decision_time_ms: time_ms,
                speed_bonus_awarded: bonus,
                new_total_score: player.total_score as u64 + player.speed_bonus_accumulated,
            });
        }

        emit!(ShipMoved {
            game_id: 0, // Global game
            player: player_pubkey,
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

    /// Attack an enemy ship
    pub fn attack_ship(
        ctx: Context<MakeMove>,
        attacker_ship_id: String,
        target_ship_id: String,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player_pubkey = ctx.accounts.player.key();

        // Validate game state
        require!(game.status == GameStatus::Active, GameError::GameNotActive);
        
        // Validate it's the player's turn
        let current_player = game.get_current_player()
            .ok_or(GameError::NotPlayerTurn)?;
        require!(current_player.pubkey == player_pubkey, GameError::NotPlayerTurn);

        // Find attacker ship
        let mut attacker_pos = (0u8, 0u8);
        let mut attacker_attack = 0u32;
        
        for player in game.players.iter() {
            if player.pubkey == player_pubkey {
                for ship in player.ships.iter() {
                    if ship.id == attacker_ship_id {
                        attacker_pos = (ship.position_x, ship.position_y);
                        attacker_attack = ship.attack;
                        break;
                    }
                }
            }
        }

        require!(attacker_attack > 0, GameError::ShipNotFound);

        // Find and damage target ship
        let mut target_found = false;
        let mut target_destroyed = false;
        let mut damage_dealt = 0u32;

        for player in game.players.iter_mut() {
            if player.pubkey == player_pubkey {
                continue; // Can't attack own ships
            }

            for ship in player.ships.iter_mut() {
                if ship.id == target_ship_id {
                    target_found = true;
                    
                    // Check if ships are adjacent (Manhattan distance <= 1)
                    let distance = ((ship.position_x as i16 - attacker_pos.0 as i16).abs() 
                                  + (ship.position_y as i16 - attacker_pos.1 as i16).abs()) as u32;
                    require!(distance <= 1, GameError::ShipsNotInRange);

                    // Calculate damage (attack - defense, minimum 1)
                    damage_dealt = attacker_attack.saturating_sub(ship.defense).max(1);
                    
                    // Apply damage
                    if ship.health <= damage_dealt {
                        ship.health = 0;
                        target_destroyed = true;
                    } else {
                        ship.health -= damage_dealt;
                    }
                    
                    break;
                }
            }
        }

        require!(target_found, GameError::ShipNotFound);

        // Remove destroyed ships
        if target_destroyed {
            for player in game.players.iter_mut() {
                player.ships.retain(|s| s.id != target_ship_id);
            }
        }

        emit!(ShipAttacked {
            game_id: 0, // Global game
            attacker: player_pubkey,
            attacker_ship_id,
            target_ship_id,
            damage: damage_dealt,
            ship_destroyed: target_destroyed,
        });

        // Advance turn
        game.advance_turn();

        Ok(())
    }

    /// Claim a territory at ship's current position
    pub fn claim_territory(
        ctx: Context<MakeMove>,
        ship_id: String,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player_pubkey = ctx.accounts.player.key();

        // Validate game state
        require!(game.status == GameStatus::Active, GameError::GameNotActive);
        
        // Validate it's the player's turn
        let current_player = game.get_current_player()
            .ok_or(GameError::NotPlayerTurn)?;
        require!(current_player.pubkey == player_pubkey, GameError::NotPlayerTurn);

        // Find ship and get its position
        let mut ship_pos = None;
        
        for player in game.players.iter() {
            if player.pubkey == player_pubkey {
                for ship in player.ships.iter() {
                    if ship.id == ship_id {
                        ship_pos = Some((ship.position_x, ship.position_y));
                        break;
                    }
                }
            }
        }

        let (x, y) = ship_pos.ok_or(GameError::ShipNotFound)?;

        // Get territory cell
        let index = (x as usize * MAP_SIZE) + y as usize;
        let cell = game.territory_map.get_mut(index)
            .ok_or(GameError::InvalidCoordinate)?;

        // Check if territory is claimable (not water, storm, reef, or whirlpool)
        match cell.cell_type {
            TerritoryCellType::Island | TerritoryCellType::Port | TerritoryCellType::Treasure => {
                // Claimable
            }
            _ => {
                return Err(GameError::InvalidCoordinate.into());
            }
        }

        // Claim territory
        cell.owner = Some(player_pubkey);

        // Add to player's controlled territories
        let coord = format!("{},{}", x, y);
        let player = game.get_player_mut(&player_pubkey)
            .ok_or(GameError::NotPlayerTurn)?;
        
        if !player.controlled_territories.contains(&coord) {
            player.controlled_territories.push(coord);
        }

        emit!(TerritoryClaimed {
            game_id: 0, // Global game
            player: player_pubkey,
            territory_x: x,
            territory_y: y,
        });

        // Advance turn
        game.advance_turn();

        Ok(())
    }

    /// Collect resources from controlled territories
    pub fn collect_resources(
        ctx: Context<MakeMove>,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player_pubkey = ctx.accounts.player.key();

        // Validate game state
        require!(game.status == GameStatus::Active, GameError::GameNotActive);
        
        // Validate it's the player's turn
        let current_player = game.get_current_player()
            .ok_or(GameError::NotPlayerTurn)?;
        require!(current_player.pubkey == player_pubkey, GameError::NotPlayerTurn);

        // Calculate resources from controlled territories (immutable borrow)
        let mut total_gold = 0u32;
        let mut total_crew = 0u32;
        let mut total_supplies = 0u32;

        // Clone territory list to avoid borrow issues
        let controlled_territories: Vec<String> = {
            let player = game.players.iter()
                .find(|p| p.pubkey == player_pubkey)
                .ok_or(GameError::NotPlayerTurn)?;
            player.controlled_territories.clone()
        };

        for coord_str in controlled_territories.iter() {
            // Parse coordinate string "x,y"
            let parts: Vec<&str> = coord_str.split(',').collect();
            if parts.len() == 2 {
                if let (Ok(x), Ok(y)) = (parts[0].parse::<u8>(), parts[1].parse::<u8>()) {
                    let resources = get_territory_resources(x, y, &game.territory_map);
                    total_gold += resources.gold;
                    total_crew += resources.crew;
                    total_supplies += resources.supplies;
                }
            }
        }

        // Now get mutable reference and add resources
        let player = game.get_player_mut(&player_pubkey)
            .ok_or(GameError::NotPlayerTurn)?;

        player.resources.gold = player.resources.gold.saturating_add(total_gold);
        player.resources.crew = player.resources.crew.saturating_add(total_crew);
        player.resources.supplies = player.resources.supplies.saturating_add(total_supplies);

        emit!(ResourcesCollected {
            game_id: 0,
            player: player_pubkey,
            gold_collected: total_gold,
            crew_collected: total_crew,
            supplies_collected: total_supplies,
        });

        // Advance turn
        game.advance_turn();

        Ok(())
    }

    /// Build a new ship at a controlled port
    pub fn build_ship(
        ctx: Context<MakeMove>,
        ship_type: ShipType,
        port_x: u8,
        port_y: u8,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player_pubkey = ctx.accounts.player.key();
        let clock = Clock::get()?;

        // Validate game state
        require!(game.status == GameStatus::Active, GameError::GameNotActive);
        
        // Validate it's the player's turn
        let current_player = game.get_current_player()
            .ok_or(GameError::NotPlayerTurn)?;
        require!(current_player.pubkey == player_pubkey, GameError::NotPlayerTurn);

        // Check if location is a port
        let index = (port_x as usize * MAP_SIZE) + port_y as usize;
        let cell = game.territory_map.get(index)
            .ok_or(GameError::InvalidCoordinate)?;
        
        require!(cell.cell_type == TerritoryCellType::Port, GameError::NoAdjacentPort);
        require!(cell.owner == Some(player_pubkey), GameError::TerritoryNotControlled);

        // Check if position is occupied
        for p in game.players.iter() {
            for s in p.ships.iter() {
                if s.position_x == port_x && s.position_y == port_y {
                    return Err(GameError::PositionOccupied.into());
                }
            }
        }

        // Get ship costs and stats
        let costs = get_ship_costs(&ship_type);
        let (health, attack, defense, speed) = get_ship_stats(&ship_type);

        // Store turn number before mutable borrow
        let current_turn = game.turn_number;

        let player = game.get_player_mut(&player_pubkey)
            .ok_or(GameError::NotPlayerTurn)?;

        // Check fleet size limit
        require!(player.ships.len() < MAX_SHIPS_PER_PLAYER, GameError::FleetSizeLimit);

        // Check resources
        require!(
            player.resources.gold >= costs.gold &&
            player.resources.crew >= costs.crew &&
            player.resources.cannons >= costs.cannons &&
            player.resources.supplies >= costs.supplies,
            GameError::InsufficientResources
        );

        // Deduct resources
        player.resources.gold -= costs.gold;
        player.resources.crew -= costs.crew;
        player.resources.cannons -= costs.cannons;
        player.resources.supplies -= costs.supplies;

        // Create new ship
        let ship = ShipData {
            id: format!("{}_{}", player_pubkey, clock.unix_timestamp),
            ship_type: ship_type.clone(),
            health,
            max_health: health,
            attack,
            defense,
            speed,
            position_x: port_x,
            position_y: port_y,
            last_action_turn: current_turn,
        };

        player.ships.push(ship);

        emit!(ShipBuilt {
            game_id: 0,
            player: player_pubkey,
            ship_type,
            position_x: port_x,
            position_y: port_y,
        });

        // Advance turn
        game.advance_turn();

        Ok(())
    }

    /// Check victory conditions and complete game if met
    pub fn check_and_complete_game(
        ctx: Context<MakeMove>,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let clock = Clock::get()?;

        // Only check if game is active
        require!(game.status == GameStatus::Active, GameError::GameNotActive);

        // Check victory conditions for each player
        let mut winner: Option<(Pubkey, String)> = None;

        for player in game.players.iter() {
            if !player.is_active {
                continue;
            }

            // Victory Condition 1: Fleet Dominance (80% of total naval power)
            let total_fleet_power: u32 = game.players.iter()
                .flat_map(|p| p.ships.iter())
                .map(|s| s.health)
                .sum();
            
            let player_fleet_power: u32 = player.ships.iter()
                .map(|s| s.health)
                .sum();

            if total_fleet_power > 0 && player_fleet_power * 100 >= total_fleet_power * 80 {
                winner = Some((player.pubkey, "Fleet Dominance".to_string()));
                break;
            }

            // Victory Condition 2: Territory Control (60% of valuable territories)
            let valuable_territories: usize = game.territory_map.iter()
                .filter(|cell| matches!(
                    cell.cell_type,
                    TerritoryCellType::Port | TerritoryCellType::Island | TerritoryCellType::Treasure
                ))
                .count();

            let player_territories = player.controlled_territories.len();

            if valuable_territories > 0 && player_territories * 100 >= valuable_territories * 60 {
                winner = Some((player.pubkey, "Territory Control".to_string()));
                break;
            }

            // Victory Condition 3: Economic Victory (15,000+ resource value)
            let resource_value = 
                player.resources.gold +
                player.resources.crew * 10 +
                player.resources.cannons * 20 +
                player.resources.supplies * 5;

            if resource_value >= 15000 {
                winner = Some((player.pubkey, "Economic Victory".to_string()));
                break;
            }
        }

        // If winner found, complete the game
        if let Some((winner_pubkey, victory_type)) = winner {
            game.status = GameStatus::Completed;
            game.winner = Some(winner_pubkey);
            game.completed_at = Some(clock.unix_timestamp);

            emit!(GameCompleted {
                game_id: 0,
                winner: winner_pubkey,
                victory_type,
            });

            msg!("Game completed! Winner: {}", winner_pubkey);
        }

        Ok(())
    }

    /// Scan a coordinate to reveal tile type (skill mechanic)
    pub fn scan_coordinate(
        ctx: Context<MakeMove>,
        coordinate_x: u8,
        coordinate_y: u8,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player_pubkey = ctx.accounts.player.key();

        // Validate game state
        require!(game.status == GameStatus::Active, GameError::GameNotActive);
        
        // Validate it's the player's turn
        let current_player = game.get_current_player()
            .ok_or(GameError::NotPlayerTurn)?;
        require!(current_player.pubkey == player_pubkey, GameError::NotPlayerTurn);

        // Get tile type first (before mutable borrow)
        let index = (coordinate_x as usize * MAP_SIZE) + coordinate_y as usize;
        let tile_type = game.territory_map.get(index)
            .map(|cell| format!("{:?}", cell.cell_type))
            .unwrap_or_else(|| "Unknown".to_string());

        // Get player and check scan charges
        let player = game.get_player_mut(&player_pubkey)
            .ok_or(GameError::NotPlayerTurn)?;
        require!(player.scan_charges > 0, GameError::NoScansRemaining);

        // Check if already scanned
        require!(
            !is_coordinate_scanned(&player.scanned_coordinates, coordinate_x, coordinate_y),
            GameError::CoordinateAlreadyScanned
        );

        // Mark as scanned
        mark_coordinate_scanned(&mut player.scanned_coordinates, coordinate_x, coordinate_y)?;
        player.scan_charges -= 1;

        emit!(CoordinateScanned {
            game_id: 0,
            player: player_pubkey,
            coordinate_x,
            coordinate_y,
            tile_type,
            scan_charges_remaining: player.scan_charges,
        });

        // Advance turn
        game.advance_turn();

        Ok(())
    }

    /// End current player's turn without taking an action
    pub fn end_turn(
        ctx: Context<MakeMove>,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        let player_pubkey = ctx.accounts.player.key();

        // Validate game state
        require!(game.status == GameStatus::Active, GameError::GameNotActive);
        
        // Validate it's the player's turn
        let current_player = game.get_current_player()
            .ok_or(GameError::NotPlayerTurn)?;
        require!(current_player.pubkey == player_pubkey, GameError::NotPlayerTurn);

        // Advance turn
        game.advance_turn();

        Ok(())
    }
}
