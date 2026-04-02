use crate::constants::*;
use crate::errors::GameError;
use crate::events::*;
use crate::state::game::{GameStatus, PirateGame};
use crate::state::map::{
    get_territory_resources, is_coordinate_scanned, mark_coordinate_scanned, TerritoryCellType,
};
use crate::state::player::{
    calculate_speed_bonus, get_ship_costs, get_ship_stats, update_average_decision_time,
    AgentRegistry, ShipType,
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct RegisterAgent<'info> {
    #[account(
        init,
        payer = owner,
        space = AgentRegistry::SPACE,
        seeds = [b"agent", owner.key().as_ref()],
        bump
    )]
    pub agent: Account<'info, AgentRegistry>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DelegateAgentControl<'info> {
    #[account(
        mut,
        seeds = [b"agent", owner.key().as_ref()],
        bump,
        has_one = owner
    )]
    pub agent: Account<'info, AgentRegistry>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct MakeMove<'info> {
    #[account(
        mut,
        seeds = [GAME_SEED, game.game_id.to_le_bytes().as_ref()],
        bump = game.bump
    )]
    pub game: Account<'info, PirateGame>,
    pub player: Signer<'info>,
}

// ============================================================================
// SESSION KEY / DELEGATE INSTRUCTIONS
// ============================================================================

/// Join a game via a delegated session key
/// The session key must be registered as a delegate in the player's AgentRegistry account
#[derive(Accounts)]
#[instruction(game_id: u64)]
pub struct JoinGameViaDelegate<'info> {
    #[account(
        mut,
        seeds = [GAME_SEED, game_id.to_le_bytes().as_ref()],
        bump = game.bump
    )]
    pub game: Account<'info, PirateGame>,
    /// Session key acting as signer - must be delegate of the owner
    pub session_key: Signer<'info>,
    /// The original owner who set the delegate - used to derive AgentRegistry PDA
    #[account(
        seeds = [b"agent", owner.key().as_ref()],
        bump,
        has_one = owner
    )]
    pub agent: Account<'info, AgentRegistry>,
    /// CHECK: owner is validated via has_one constraint on the agent account
    pub owner: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

/// Make a move via a delegated session key
/// The session key must be registered as a delegate in the player's AgentRegistry account
#[derive(Accounts)]
pub struct MakeMoveViaDelegate<'info> {
    #[account(
        mut,
        seeds = [GAME_SEED, game.game_id.to_le_bytes().as_ref()],
        bump = game.bump
    )]
    pub game: Account<'info, PirateGame>,
    /// Session key acting as signer - must be delegate of the owner
    pub session_key: Signer<'info>,
    /// The original owner who set the delegate - used to derive AgentRegistry PDA
    #[account(
        seeds = [b"agent", owner.key().as_ref()],
        bump,
        has_one = owner
    )]
    pub agent: Account<'info, AgentRegistry>,
    /// CHECK: owner is validated via has_one constraint on the agent account
    pub owner: UncheckedAccount<'info>,
}

pub fn register_agent(
    ctx: Context<RegisterAgent>,
    name: String,
    version: String,
    twitter: Option<String>,
    website: Option<String>,
) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    let clock = Clock::get()?;

    agent.owner = ctx.accounts.owner.key();
    agent.name = name;
    agent.version = version;
    agent.twitter = twitter;
    agent.website = website;
    agent.last_active = clock.unix_timestamp;

    msg!("Agent {} registered with metadata", agent.name);
    Ok(())
}

pub fn delegate_agent_control(
    ctx: Context<DelegateAgentControl>,
    delegate: Option<Pubkey>,
) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    agent.delegate = delegate;

    if let Some(key) = delegate {
        msg!("Agent control delegated to {}", key);
    } else {
        msg!("Agent control revoked");
    }

    Ok(())
}

/// Join a game using a delegated session key
/// The session key must be authorized in the player's AgentRegistry
pub fn join_game_via_delegate(ctx: Context<JoinGameViaDelegate>) -> Result<()> {
    // ============================================================================
    // Get all keys and account infos FIRST, before any mutable borrows
    // ============================================================================
    let game_key = ctx.accounts.game.key();
    let session_key = ctx.accounts.session_key.key();
    let owner_key = ctx.accounts.owner.key();
    
    // Get account infos before mutable borrow of game
    let session_key_info = ctx.accounts.session_key.to_account_info();
    let game_info = ctx.accounts.game.to_account_info();
    let system_program_info = ctx.accounts.system_program.to_account_info();
    
    // ============================================================================
    // Now we can safely get mutable reference to game
    // ============================================================================
    let game = &mut ctx.accounts.game;

    // Validate game state
    require!(
        game.status == GameStatus::Waiting,
        GameError::GameNotJoinable
    );
    require!(game.player_count < MAX_PLAYERS, GameError::GameFull);

    // Validate the session key is the delegate in the AgentRegistry
    let agent = &ctx.accounts.agent;
    require!(
        agent.delegate == Some(session_key),
        GameError::UnauthorizedDelegate
    );

    // Check if player already joined (by owner key)
    if game.players.iter().any(|p| p.pubkey == owner_key) {
        return Err(GameError::GameNotJoinable.into());
    }

    // Transfer Entry Fee (0.1 SOL) using pre-fetched account infos
    let entry_fee = 100_000_000; // 0.1 SOL in lamports

    let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
        &session_key,
        &game_key,
        entry_fee,
    );

    anchor_lang::solana_program::program::invoke(
        &transfer_instruction,
        &[
            session_key_info,
            game_info,
            system_program_info,
        ],
    )?;

    // Add player using the owner's pubkey (session key is just for signing)
    game.players.push(crate::state::player::PlayerData {
        pubkey: owner_key, // The actual player is the owner, not session key
        resources: crate::state::player::Resources {
            gold: 1000,
            crew: 50,
            cannons: 10,
            supplies: 100,
        },
        ships: Vec::new(),
        controlled_territories: Vec::new(),
        total_score: 0,
        is_active: true,
        scan_charges: 3,
        scanned_coordinates: Vec::new(),
        // Ghost Fleet fields
        is_ghost_fleet: false,
        ghost_fleet_turns_remaining: 0,
        total_ghosts_activated: 0,
        speed_bonus_accumulated: 0,
        average_decision_time_ms: 0,
        total_moves: 0,
    });

    game.player_count += 1;

    emit!(crate::events::PlayerJoined {
        player: owner_key,
        player_count: game.player_count,
    });

    // AUTO-START LOGIC
    if game.player_count >= MAX_PLAYERS {
        msg!("Auto-starting game {} via delegate...", game.game_id);

        let clock = Clock::get()?;
        let seed = clock.unix_timestamp as u64;

        game.territory_map = crate::state::map::generate_strategic_map(seed);
        crate::state::game::deploy_starting_fleets(game)?;

        game.status = GameStatus::Active;
        game.started_at = Some(clock.unix_timestamp);
        game.turn_number = 1;

        emit!(crate::events::GameStarted {
            player_count: game.player_count,
        });
    }

    msg!("Player {} joined game {} via session key {}", owner_key, game.game_id, session_key);
    Ok(())
}

/// Make a move using a delegated session key
/// The session key must be authorized in the player's AgentRegistry
pub fn move_ship_via_delegate(
    ctx: Context<MakeMoveViaDelegate>,
    ship_id: String,
    to_x: u8,
    to_y: u8,
    decision_time_ms: Option<u64>,
) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let session_key = ctx.accounts.session_key.key();
    let owner_key = ctx.accounts.owner.key();

    // Validate game state
    require!(game.status == GameStatus::Active, GameError::GameNotActive);

    // Validate the session key is the delegate in the AgentRegistry
    let agent = &ctx.accounts.agent;
    require!(
        agent.delegate == Some(session_key),
        GameError::UnauthorizedDelegate
    );

    // Validate it's the owner's turn (not the session key's turn)
    let current_player = game.get_current_player().ok_or(GameError::NotPlayerTurn)?;
    require!(
        current_player.pubkey == owner_key,
        GameError::NotPlayerTurn
    );

    // Validate coordinates
    require!(
        to_x < MAP_SIZE as u8 && to_y < MAP_SIZE as u8,
        GameError::InvalidCoordinate
    );

    // First, find the ship and validate move distance (immutable borrow)
    let (from_x, from_y, ship_speed) = {
        let player = game
            .players
            .iter()
            .find(|p| p.pubkey == owner_key)
            .ok_or(GameError::NotPlayerTurn)?;

        let ship = player
            .ships
            .iter()
            .find(|s| s.id == ship_id)
            .ok_or(GameError::ShipNotFound)?;

        (ship.position_x, ship.position_y, ship.speed)
    };

    // Validate move distance
    let distance =
        ((to_x as i16 - from_x as i16).abs() + (to_y as i16 - from_y as i16).abs()) as u32;
    require!(distance <= ship_speed, GameError::InvalidCoordinate);

    // Check if position is occupied
    for p in game.players.iter() {
        for s in p.ships.iter() {
            if s.position_x == to_x && s.position_y == to_y && s.id != ship_id {
                return Err(GameError::PositionOccupied.into());
            }
        }
    }

    let current_turn = game.turn_number;
    let game_id = game.game_id;

    // Now get mutable reference and update ship
    let player = game
        .get_player_mut(&owner_key)
        .ok_or(GameError::NotPlayerTurn)?;

    let ship = player
        .ships
        .iter_mut()
        .find(|s| s.id == ship_id)
        .ok_or(GameError::ShipNotFound)?;

    // Move the ship
    ship.position_x = to_x;
    ship.position_y = to_y;
    ship.last_action_turn = current_turn;

    // Apply timing bonus if provided
    if let Some(time_ms) = decision_time_ms {
        let bonus = crate::state::player::calculate_speed_bonus(time_ms);
        player.speed_bonus_accumulated += bonus;
        crate::state::player::update_average_decision_time(player, time_ms);

        emit!(crate::events::MoveExecuted {
            game_id,
            player: owner_key,
            decision_time_ms: time_ms,
            speed_bonus_awarded: bonus,
            new_total_score: player.total_score as u64 + player.speed_bonus_accumulated,
        });
    }

    emit!(crate::events::ShipMoved {
        game_id,
        player: owner_key,
        ship_id: ship_id.clone(),
        from_x,
        from_y,
        to_x,
        to_y,
    });

    msg!("Session key {} moved ship {} for player {} via delegate", 
         session_key, ship_id, owner_key);

    // Advance turn
    game.advance_turn();

    Ok(())
}

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
    let current_player = game.get_current_player().ok_or(GameError::NotPlayerTurn)?;
    require!(
        current_player.pubkey == player_pubkey,
        GameError::NotPlayerTurn
    );

    // Validate coordinates
    require!(
        to_x < MAP_SIZE as u8 && to_y < MAP_SIZE as u8,
        GameError::InvalidCoordinate
    );

    // First, find the ship and validate move distance (immutable borrow)
    let (from_x, from_y, ship_speed) = {
        let player = game
            .players
            .iter()
            .find(|p| p.pubkey == player_pubkey)
            .ok_or(GameError::NotPlayerTurn)?;

        let ship = player
            .ships
            .iter()
            .find(|s| s.id == ship_id)
            .ok_or(GameError::ShipNotFound)?;

        (ship.position_x, ship.position_y, ship.speed)
    };

    // Validate move distance (Manhattan distance <= ship speed)
    let distance =
        ((to_x as i16 - from_x as i16).abs() + (to_y as i16 - from_y as i16).abs()) as u32;
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
    let game_id = game.game_id;

    // Now get mutable reference and update ship
    let player = game
        .get_player_mut(&player_pubkey)
        .ok_or(GameError::NotPlayerTurn)?;

    let ship = player
        .ships
        .iter_mut()
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
            game_id,
            player: player_pubkey,
            decision_time_ms: time_ms,
            speed_bonus_awarded: bonus,
            new_total_score: player.total_score as u64 + player.speed_bonus_accumulated,
        });
    }

    emit!(ShipMoved {
        game_id,
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
    let current_player = game.get_current_player().ok_or(GameError::NotPlayerTurn)?;
    require!(
        current_player.pubkey == player_pubkey,
        GameError::NotPlayerTurn
    );

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

    // ============================================================================
    // GHOST FLEET MECHANICS: Get ambush bonus BEFORE mutable borrow
    // ============================================================================
    // Get the attacker's Ghost Fleet bonus (if attacking from stealth)
    // Must do this before any mutable borrows
    let attacker_player = game
        .get_player(&player_pubkey)
        .ok_or(GameError::NotPlayerTurn)?;
    let ambush_bonus = crate::state::player::get_ambush_damage_bonus(attacker_player);

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
                    + (ship.position_y as i16 - attacker_pos.1 as i16).abs())
                    as u32;
                require!(distance <= 1, GameError::ShipsNotInRange);

                // Calculate base damage (attack - defense, minimum 1)
                let base_damage = attacker_attack.saturating_sub(ship.defense).max(1);
                
                // Apply ambush bonus
                damage_dealt = (base_damage as f32 * ambush_bonus) as u32;

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
        game_id: game.game_id,
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

pub fn claim_territory(ctx: Context<MakeMove>, ship_id: String) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let player_pubkey = ctx.accounts.player.key();

    // Validate game state
    require!(game.status == GameStatus::Active, GameError::GameNotActive);

    // Validate it's the player's turn
    let current_player = game.get_current_player().ok_or(GameError::NotPlayerTurn)?;
    require!(
        current_player.pubkey == player_pubkey,
        GameError::NotPlayerTurn
    );

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
    let cell = game
        .territory_map
        .get_mut(index)
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
    let player = game
        .get_player_mut(&player_pubkey)
        .ok_or(GameError::NotPlayerTurn)?;

    if !player.controlled_territories.contains(&coord) {
        player.controlled_territories.push(coord);
    }

    emit!(TerritoryClaimed {
        game_id: game.game_id,
        player: player_pubkey,
        territory_x: x,
        territory_y: y,
    });

    // Advance turn
    game.advance_turn();

    Ok(())
}

pub fn collect_resources(ctx: Context<MakeMove>) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let player_pubkey = ctx.accounts.player.key();

    // Validate game state
    require!(game.status == GameStatus::Active, GameError::GameNotActive);

    // Validate it's the player's turn
    let current_player = game.get_current_player().ok_or(GameError::NotPlayerTurn)?;
    require!(
        current_player.pubkey == player_pubkey,
        GameError::NotPlayerTurn
    );

    // Calculate resources from controlled territories (immutable borrow)
    let mut total_gold = 0u32;
    let mut total_crew = 0u32;
    let mut total_supplies = 0u32;

    // Clone territory list to avoid borrow issues
    let controlled_territories: Vec<String> = {
        let player = game
            .players
            .iter()
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
    let player = game
        .get_player_mut(&player_pubkey)
        .ok_or(GameError::NotPlayerTurn)?;

    player.resources.gold = player.resources.gold.saturating_add(total_gold);
    player.resources.crew = player.resources.crew.saturating_add(total_crew);
    player.resources.supplies = player.resources.supplies.saturating_add(total_supplies);

    emit!(ResourcesCollected {
        game_id: game.game_id,
        player: player_pubkey,
        gold_collected: total_gold,
        crew_collected: total_crew,
        supplies_collected: total_supplies,
    });

    // Advance turn
    game.advance_turn();

    Ok(())
}

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
    let current_player = game.get_current_player().ok_or(GameError::NotPlayerTurn)?;
    require!(
        current_player.pubkey == player_pubkey,
        GameError::NotPlayerTurn
    );

    // Check if location is a port
    let index = (port_x as usize * MAP_SIZE) + port_y as usize;
    let cell = game
        .territory_map
        .get(index)
        .ok_or(GameError::InvalidCoordinate)?;

    require!(
        cell.cell_type == TerritoryCellType::Port,
        GameError::NoAdjacentPort
    );
    require!(
        cell.owner == Some(player_pubkey),
        GameError::TerritoryNotControlled
    );

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

    let player = game
        .get_player_mut(&player_pubkey)
        .ok_or(GameError::NotPlayerTurn)?;

    // Check fleet size limit
    require!(
        player.ships.len() < MAX_SHIPS_PER_PLAYER,
        GameError::FleetSizeLimit
    );

    // Check resources
    require!(
        player.resources.gold >= costs.gold
            && player.resources.crew >= costs.crew
            && player.resources.cannons >= costs.cannons
            && player.resources.supplies >= costs.supplies,
        GameError::InsufficientResources
    );

    // Deduct resources
    player.resources.gold -= costs.gold;
    player.resources.crew -= costs.crew;
    player.resources.cannons -= costs.cannons;
    player.resources.supplies -= costs.supplies;

    // Create new ship
    let ship = crate::state::player::ShipData {
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
        game_id: game.game_id,
        player: player_pubkey,
        ship_type,
        position_x: port_x,
        position_y: port_y,
    });

    // Advance turn
    game.advance_turn();

    Ok(())
}

pub fn scan_coordinate(ctx: Context<MakeMove>, coordinate_x: u8, coordinate_y: u8) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let player_pubkey = ctx.accounts.player.key();

    // Validate game state
    require!(game.status == GameStatus::Active, GameError::GameNotActive);

    // Validate it's the player's turn
    let current_player = game.get_current_player().ok_or(GameError::NotPlayerTurn)?;
    require!(
        current_player.pubkey == player_pubkey,
        GameError::NotPlayerTurn
    );

    // Get tile type first (before mutable borrow)
    let index = (coordinate_x as usize * MAP_SIZE) + coordinate_y as usize;
    let tile_type = game
        .territory_map
        .get(index)
        .map(|cell| format!("{:?}", cell.cell_type))
        .unwrap_or_else(|| "Unknown".to_string());

    let game_id = game.game_id;

    // Get player and check scan charges
    let player = game
        .get_player_mut(&player_pubkey)
        .ok_or(GameError::NotPlayerTurn)?;
    require!(player.scan_charges > 0, GameError::NoScansRemaining);

    // Check if already scanned
    require!(
        !is_coordinate_scanned(&player.scanned_coordinates, coordinate_x, coordinate_y),
        GameError::CoordinateAlreadyScanned
    );

    // ============================================================================
    // GHOST FLEET MECHANICS: Check effective scan range
    // ============================================================================
    let effective_scan_range = crate::state::player::get_effective_scan_range(player);
    
    // Find the player's primary ship position for range calculation
    let player_ship_x = player.ships.first().map(|s| s.position_x).unwrap_or(0);
    let player_ship_y = player.ships.first().map(|s| s.position_y).unwrap_or(0);
    
    // Calculate distance from player to scanned coordinate
    let dx = if coordinate_x >= player_ship_x {
        coordinate_x - player_ship_x
    } else {
        player_ship_x - coordinate_x
    };
    let dy = if coordinate_y >= player_ship_y {
        coordinate_y - player_ship_y
    } else {
        player_ship_y - coordinate_y
    };
    
    // Check if coordinate is within effective scan range
    // Use Chebyshev distance (max of dx, dy) for grid movement
    let distance = dx.max(dy) as u8;
    require!(
        distance <= effective_scan_range,
        GameError::ShipsNotInRange
    );

    // Mark as scanned
    mark_coordinate_scanned(&mut player.scanned_coordinates, coordinate_x, coordinate_y)?;
    player.scan_charges -= 1;

    emit!(CoordinateScanned {
        game_id,
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

pub fn end_turn(ctx: Context<MakeMove>) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let player_pubkey = ctx.accounts.player.key();

    // Validate game state
    require!(game.status == GameStatus::Active, GameError::GameNotActive);

    // Validate it's the player's turn
    let current_player = game.get_current_player().ok_or(GameError::NotPlayerTurn)?;
    require!(
        current_player.pubkey == player_pubkey,
        GameError::NotPlayerTurn
    );

    // ============================================================================
    // GHOST FLEET MECHANICS: Decrement turn counter for all Ghost Fleet players
    // ============================================================================
    for player in game.players.iter_mut() {
        if player.is_active {
            crate::state::player::tick_ghost_fleet(player);
        }
    }

    // Advance turn
    game.advance_turn();

    Ok(())
}

pub fn check_and_complete_game(ctx: Context<MakeMove>) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let clock = Clock::get()?;

    // Only check if game is active
    require!(game.status == GameStatus::Active, GameError::GameNotActive);

    // Max turns check - game ends at 50 turns
    const MAX_TURNS: u32 = 50;
    if game.turn_number >= MAX_TURNS {
        // Determine winner by score when max turns reached
        let mut scored_players: Vec<(Pubkey, u32, u32, usize, u32)> = Vec::new();

        for player in game.players.iter() {
            if !player.is_active {
                continue;
            }
            let active_ships = player.ships.iter().filter(|s| s.health > 0).count();
            let total_health: u32 = player.ships.iter().map(|s| s.health).sum();
            let territories = player.controlled_territories.len();
            let resource_value = player.resources.gold
                + player.resources.crew * 10
                + player.resources.cannons * 20
                + player.resources.supplies * 5;

            // Weighted score: ships * 100 + health * 2 + territories * 150 + resources
            let score = (active_ships as u32 * 100)
                + (total_health * 2)
                + ((territories * 150) as u32)
                + resource_value;
            scored_players.push((
                player.pubkey,
                active_ships as u32,
                total_health,
                territories,
                score,
            ));
        }

        // Sort by score descending
        scored_players.sort_by(|a, b| b.4.cmp(&a.4));

        if let Some((winner_pubkey, _, _, _, _)) = scored_players.first() {
            game.status = GameStatus::Completed;
            game.winner = Some(*winner_pubkey);
            game.completed_at = Some(clock.unix_timestamp);

            emit!(GameCompleted {
                game_id: game.game_id,
                winner: *winner_pubkey,
                victory_type: "Time Limit".to_string(),
            });

            msg!("Game completed by time limit! Winner: {}", winner_pubkey);
        }
        return Ok(());
    }

    // Check victory conditions for each player
    let mut winner: Option<(Pubkey, String)> = None;

    for player in game.players.iter() {
        if !player.is_active {
            continue;
        }

        // Victory Condition 1: Fleet Dominance (65% of total naval power)
        let total_fleet_power: u32 = game
            .players
            .iter()
            .flat_map(|p| p.ships.iter())
            .map(|s| s.health)
            .sum();

        let player_fleet_power: u32 = player.ships.iter().map(|s| s.health).sum();

        if total_fleet_power > 0 && player_fleet_power * 100 >= total_fleet_power * 65 {
            winner = Some((player.pubkey, "Fleet Dominance".to_string()));
            break;
        }

        // Victory Condition 2: Territory Control (50% of valuable territories)
        let valuable_territories: usize = game
            .territory_map
            .iter()
            .filter(|cell| {
                matches!(
                    cell.cell_type,
                    TerritoryCellType::Port
                        | TerritoryCellType::Island
                        | TerritoryCellType::Treasure
                )
            })
            .count();

        let player_territories = player.controlled_territories.len();

        if valuable_territories > 0 && player_territories * 100 >= valuable_territories * 50 {
            winner = Some((player.pubkey, "Territory Control".to_string()));
            break;
        }

        // Victory Condition 3: Economic Victory (10,000+ resource value)
        let resource_value = player.resources.gold
            + player.resources.crew * 10
            + player.resources.cannons * 20
            + player.resources.supplies * 5;

        if resource_value >= 10000 {
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
            game_id: game.game_id,
            winner: winner_pubkey,
            victory_type,
        });

        msg!("Game completed! Winner: {}", winner_pubkey);
    }

    Ok(())
}

// ============================================================================
// GHOST FLEET INSTRUCTION
// ============================================================================

/// Activate Ghost Fleet mode - strategic stealth ability
/// Cost: 200 gold, Duration: 3 turns
/// Effect: Reduced scan range (harder to be scanned), ambush damage bonus
#[derive(Accounts)]
pub struct ActivateGhostFleet<'info> {
    #[account(
        mut,
        seeds = [GAME_SEED, game.game_id.to_le_bytes().as_ref()],
        bump = game.bump
    )]
    pub game: Account<'info, PirateGame>,
    pub player: Signer<'info>,
}

pub fn activate_ghost_fleet_instruction(ctx: Context<ActivateGhostFleet>) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let player_pubkey = ctx.accounts.player.key();

    // Validate game state
    require!(game.status == GameStatus::Active, GameError::GameNotActive);

    // Validate it's the player's turn
    let current_player = game.get_current_player().ok_or(GameError::NotPlayerTurn)?;
    require!(
        current_player.pubkey == player_pubkey,
        GameError::NotPlayerTurn
    );

    // Activate Ghost Fleet using the helper
    let player = game.get_player_mut(&player_pubkey).ok_or(GameError::NotPlayerTurn)?;
    crate::state::player::activate_ghost_fleet(player)?;

    emit!(crate::events::GhostFleetActivated {
        game_id: game.game_id,
        player: player_pubkey,
        turns_remaining: crate::state::player::GHOST_FLEET_DURATION,
    });

    msg!("Ghost Fleet activated by {} for {} turns", player_pubkey, crate::state::player::GHOST_FLEET_DURATION);

    // Advance turn
    game.advance_turn();

    Ok(())
}
