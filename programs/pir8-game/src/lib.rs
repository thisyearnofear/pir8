use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

pub use constants::*;
pub use errors::*;
pub use instructions::*;
pub use state::*;

#[program]
pub mod pir8_game {
    use super::*;

    /// Initialize the global game configuration
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        entry_fee: u64,
        platform_fee_bps: u16,
        max_players: u8,
    ) -> Result<()> {
        instructions::initialize_config(ctx, entry_fee, platform_fee_bps, max_players)
    }

    /// Create a new game instance
    pub fn create_game(
        ctx: Context<CreateGame>,
        entry_fee: u64,
        max_players: u8,
    ) -> Result<()> {
        instructions::create_game(ctx, entry_fee, max_players)
    }

    /// Join an existing game
    pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
        instructions::join_game(ctx)
    }

    /// Make a move by selecting a coordinate
    pub fn make_move(
        ctx: Context<MakeMove>,
        coordinate: String,
    ) -> Result<()> {
        instructions::make_move(ctx, coordinate)
    }

    /// Execute special item effect (steal, swap, etc.)
    pub fn execute_item_effect(
        ctx: Context<ExecuteItemEffect>,
        action: ItemAction,
        target_player: Option<Pubkey>,
        amount: Option<u64>,
    ) -> Result<()> {
        instructions::execute_item_effect(ctx, action, target_player, amount)
    }

    /// Start the game when enough players have joined
    pub fn start_game(ctx: Context<StartGame>) -> Result<()> {
        instructions::start_game(ctx)
    }

    /// Complete the game and distribute winnings
    pub fn complete_game(ctx: Context<CompleteGame>) -> Result<()> {
        instructions::complete_game(ctx)
    }

    /// Claim winnings after game completion
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        instructions::claim_winnings(ctx)
    }

    /// Admin function to pause/unpause games
    pub fn set_game_status(
        ctx: Context<SetGameStatus>,
        is_paused: bool,
    ) -> Result<()> {
        instructions::set_game_status(ctx, is_paused)
    }
}