use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::{
    anchor::{vrf, vrf_callback},
    vrf::{
        self,
        consts::program_identity_pubkey,
        instructions::{
        create_request_high_priority_scoped_randomness_ix_const,
        create_request_randomness_ix_const, RequestRandomnessParams,
    },
        types::SerializableAccountMeta,
    },
};

declare_id!("88YCejHKiTb1psuXt7nWjvf3L36GgQ14sWNWHqNtk2Qd");

const PROGRAM_IDENTITY: Pubkey = program_identity_pubkey(&crate::ID);

#[program]
pub mod vrf_compat_check {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.last_result = 0;
        state.pending_seed = 0;
        state.request_count = 0;
        state.fulfilled_count = 0;
        Ok(())
    }

    pub fn request_randomness(
        ctx: Context<DoRollDiceCtx>,
        client_seed: u8,
        high_priority: bool,
    ) -> Result<()> {
        let params = RequestRandomnessParams {
            payer: ctx.accounts.payer.key(),
            oracle_queue: ctx.accounts.oracle_queue.key(),
            callback_program_id: ID,
            callback_discriminator: instruction::CallbackRollDice::DISCRIMINATOR.to_vec(),
            caller_seed: [client_seed; 32],
            accounts_metas: Some(vec![SerializableAccountMeta {
                pubkey: ctx.accounts.player.key(),
                is_signer: false,
                is_writable: true,
            }]),
            callback_args: Some(vec![client_seed]),
            ..Default::default()
        };
        let ix = if high_priority {
            create_request_high_priority_scoped_randomness_ix_const(params, PROGRAM_IDENTITY)
        } else {
            create_request_randomness_ix_const(params, PROGRAM_IDENTITY)
        };
        ctx.accounts
            .invoke_signed_vrf(&ctx.accounts.payer.to_account_info(), &ix)?;
        // Record attempt as pending: supersedes any prior unfulfilled request
        // so late callbacks for old seeds are ignored.
        let player = &mut ctx.accounts.player;
        player.pending_seed = client_seed;
        player.request_count = player.request_count.saturating_add(1);
        Ok(())
    }

    /// Devnet CU probe: mirrors the callback body 1:1 without the VRF signer
    /// gate, so `.simulate()` measures what a fulfillment would cost.
    pub fn debug_settle_demo(
        ctx: Context<DebugSettleCtx>,
        randomness: [u8; 32],
        client_seed: u8,
    ) -> Result<()> {
        let player = &mut ctx.accounts.player;
        if client_seed != player.pending_seed {
            msg!("stale callback seed={} pending={}: ignored", client_seed, player.pending_seed);
            return Ok(());
        }
        let rnd = vrf::rnd::random_u8_with_range(&randomness, 1, 6);
        player.last_result = rnd;
        player.pending_seed = 0;
        player.fulfilled_count = player.fulfilled_count.saturating_add(1);
        Ok(())
    }

    pub fn callback_roll_dice(
        ctx: Context<CallbackRollDiceCtx>,
        randomness: [u8; 32],
        client_seed: u8,
    ) -> Result<()> {
        let player = &mut ctx.accounts.player;
        // Bind callback to the latest request: ignore late/stale fulfillments
        // from superseded retries. Idempotent: same seed applied once.
        if client_seed != player.pending_seed {
            msg!("stale callback seed={} pending={}: ignored", client_seed, player.pending_seed);
            return Ok(());
        }
        let rnd = vrf::rnd::random_u8_with_range(&randomness, 1, 6);
        player.last_result = rnd;
        player.pending_seed = 0;
        player.fulfilled_count = player.fulfilled_count.saturating_add(1);
        Ok(())
    }
}

#[account]
pub struct Player {
    pub last_result: u8,
    /// Seed of the latest live request (0 = none outstanding).
    pub pending_seed: u8,
    pub request_count: u32,
    pub fulfilled_count: u32,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + 1 + 1 + 4 + 4,
        seeds = [b"player", payer.key().as_ref()],
        bump
    )]
    pub state: Account<'info, Player>,
    pub system_program: Program<'info, System>,
}

#[vrf]
#[derive(Accounts)]
pub struct DoRollDiceCtx<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, seeds = [b"player", payer.key().as_ref()], bump)]
    pub player: Account<'info, Player>,
    /// CHECK: oracle queue, constrained to known VRF queues
    #[account(
        mut,
        constraint =
            oracle_queue.key() == vrf::consts::DEFAULT_QUEUE ||
            oracle_queue.key() == vrf::consts::DEFAULT_EPHEMERAL_QUEUE
    )]
    pub oracle_queue: UncheckedAccount<'info>,
}

#[vrf_callback]
#[derive(Accounts)]
pub struct CallbackRollDiceCtx<'info> {
    #[account(mut)]
    pub player: Account<'info, Player>,
}

#[derive(Accounts)]
pub struct DebugSettleCtx<'info> {
    #[account(mut)]
    pub player: Account<'info, Player>,
}
