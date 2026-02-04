use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;
use state::game::GameMode;
use state::player::ShipType;

declare_id!("EeHyY2FQ3A4GLieZbGbmZtz1iLKzLytXkRcXyzGfmePt");

#[program]
pub mod pir8_game {
    use super::*;

    // ============================================================================
    // AGENT MANAGEMENT
    // ============================================================================

    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        name: String,
        version: String,
        twitter: Option<String>,
        website: Option<String>,
    ) -> Result<()> {
        instructions::register_agent(ctx, name, version, twitter, website)
    }

    pub fn delegate_agent_control(
        ctx: Context<DelegateAgentControl>,
        delegate: Option<Pubkey>,
    ) -> Result<()> {
        instructions::delegate_agent_control(ctx, delegate)
    }

    // ============================================================================
    // GAME LIFECYCLE (MATCHMAKING)
    // ============================================================================

    pub fn create_game(ctx: Context<CreateGame>, game_id: u64, mode: GameMode) -> Result<()> {
        instructions::create_game(ctx, game_id, mode)
    }

    pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
        instructions::join_game(ctx)
    }

    pub fn start_game(ctx: Context<StartGame>) -> Result<()> {
        instructions::start_game(ctx)
    }

    // ============================================================================
    // GAMEPLAY (MOVES)
    // ============================================================================

    pub fn move_ship(
        ctx: Context<MakeMove>,
        ship_id: String,
        to_x: u8,
        to_y: u8,
        decision_time_ms: Option<u64>,
    ) -> Result<()> {
        instructions::move_ship(ctx, ship_id, to_x, to_y, decision_time_ms)
    }

    pub fn attack_ship(
        ctx: Context<MakeMove>,
        attacker_ship_id: String,
        target_ship_id: String,
    ) -> Result<()> {
        instructions::attack_ship(ctx, attacker_ship_id, target_ship_id)
    }

    pub fn claim_territory(ctx: Context<MakeMove>, ship_id: String) -> Result<()> {
        instructions::claim_territory(ctx, ship_id)
    }

    pub fn collect_resources(ctx: Context<MakeMove>) -> Result<()> {
        instructions::collect_resources(ctx)
    }

    pub fn build_ship(
        ctx: Context<MakeMove>,
        ship_type: ShipType,
        port_x: u8,
        port_y: u8,
    ) -> Result<()> {
        instructions::build_ship(ctx, ship_type, port_x, port_y)
    }

    pub fn scan_coordinate(
        ctx: Context<MakeMove>,
        coordinate_x: u8,
        coordinate_y: u8,
    ) -> Result<()> {
        instructions::scan_coordinate(ctx, coordinate_x, coordinate_y)
    }

    pub fn end_turn(ctx: Context<MakeMove>) -> Result<()> {
        instructions::end_turn(ctx)
    }

    pub fn check_and_complete_game(ctx: Context<MakeMove>) -> Result<()> {
        instructions::check_and_complete_game(ctx)
    }

    // ============================================================================
    // ADMIN
    // ============================================================================

    pub fn reset_game(ctx: Context<ResetGame>) -> Result<()> {
        instructions::reset_game(ctx)
    }
}
