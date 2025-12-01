# Tournament Smart Contract Architecture

## Overview

The tournament system requires new smart contracts to manage multi-stage competitions, player registration, bracket progression, and token distribution.

## Core Contracts

### 1. TournamentManager
Manages the overall tournament lifecycle and registration.

```rust
#[account]
pub struct TournamentManager {
    pub authority: Pubkey,
    pub tournament_count: u64,
    pub active_tournaments: u32,
    pub total_participants: u64,
    pub treasury: Pubkey,
    pub platform_fee_bps: u16,
    pub reserved: [u8; 128],
}

impl TournamentManager {
    pub const SPACE: usize = 8 + 32 + 8 + 4 + 8 + 32 + 2 + 128;
}

#[derive(Accounts)]
pub struct InitializeTournamentManager<'info> {
    #[account(
        init,
        payer = authority,
        space = TournamentManager::SPACE,
        seeds = [b"tournament_manager"],
        bump
    )]
    pub manager: Account<'info, TournamentManager>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateTournament<'info> {
    #[account(
        init,
        payer = creator,
        space = Tournament::SPACE,
        seeds = [b"tournament", manager.key().as_ref(), &(manager.tournament_count as u32).to_le_bytes()],
        bump
    )]
    pub tournament: Account<'info, Tournament>,
    #[account(
        mut,
        seeds = [b"tournament_manager"],
        bump = manager_bump
    )]
    pub manager: Account<'info, TournamentManager>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

### 2. Tournament
Manages individual tournament state and progression.

```rust
#[account]
pub struct Tournament {
    pub tournament_id: u64,
    pub creator: Pubkey,
    pub status: TournamentStatus,
    pub participants: Vec<Participant>,
    pub brackets: Vec<Bracket>,
    pub entry_fee: u64,
    pub total_pool: u64,
    pub seed_capital: u64,
    pub seed_provider: Option<Pubkey>,
    pub registration_deadline: i64,
    pub max_participants: u32,
    pub current_round: u8,
    pub total_rounds: u8,
    pub winner: Option<Pubkey>,
    pub token_mint: Option<Pubkey>,
    pub created_at: i64,
    pub started_at: Option<i64>,
    pub completed_at: Option<i64>,
    pub reserved: [u8; 64],
}

impl Tournament {
    pub const SPACE: usize = 8 + 8 + 32 + 1 + 4 + (4 * 120) + 4 + (4 * 32) + 8 + 8 + 8 + 33 + 8 + 33 + 8 + 1 + 1 + 33 + 33 + 8 + 9 + 9 + 64;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum TournamentStatus {
    Pending,      // Waiting for participants
    Active,       // Tournament in progress
    Completed,    // Tournament finished
    Cancelled,    // Tournament cancelled
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Participant {
    pub player: Pubkey,
    pub entry_fee_paid: u64,
    pub joined_at: i64,
    pub current_bracket: Option<u32>,
    pub eliminated_at: Option<i64>,
    pub final_position: Option<u32>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Bracket {
    pub bracket_id: u32,
    pub round: u8,
    pub participants: Vec<Pubkey>,
    pub winners: Vec<Pubkey>,
    pub status: BracketStatus,
    pub created_at: i64,
    pub completed_at: Option<i64>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum BracketStatus {
    Pending,
    Active,
    Completed,
}
```

### 3. Tournament Instructions

```rust
// Initialize the tournament manager
pub fn initialize_tournament_manager(ctx: Context<InitializeTournamentManager>, platform_fee_bps: u16) -> Result<()> {
    let manager = &mut ctx.accounts.manager;
    manager.authority = ctx.accounts.authority.key();
    manager.tournament_count = 0;
    manager.active_tournaments = 0;
    manager.total_participants = 0;
    manager.platform_fee_bps = platform_fee_bps;
    Ok(())
}

// Create a new tournament
pub fn create_tournament(
    ctx: Context<CreateTournament>,
    entry_fee: u64,
    max_participants: u32,
    seed_capital: u64,
    registration_duration: i64, // in seconds
) -> Result<()> {
    let tournament = &mut ctx.accounts.tournament;
    let manager = &mut ctx.accounts.manager;
    
    tournament.tournament_id = manager.tournament_count;
    tournament.creator = ctx.accounts.creator.key();
    tournament.status = TournamentStatus::Pending;
    tournament.entry_fee = entry_fee;
    tournament.seed_capital = seed_capital;
    tournament.seed_provider = if seed_capital > 0 {
        Some(ctx.accounts.creator.key())
    } else {
        None
    };
    tournament.max_participants = max_participants;
    tournament.registration_deadline = Clock::get()?.unix_timestamp + registration_duration;
    tournament.created_at = Clock::get()?.unix_timestamp;
    
    manager.tournament_count += 1;
    manager.active_tournaments += 1;
    
    Ok(())
}

// Register for a tournament
pub fn register_for_tournament(ctx: Context<RegisterForTournament>) -> Result<()> {
    let tournament = &mut ctx.accounts.tournament;
    let participant = &ctx.accounts.participant;
    
    // Check if tournament is accepting registrations
    require!(
        tournament.status == TournamentStatus::Pending,
        ErrorCode::TournamentNotAcceptingRegistrations
    );
    
    // Check if registration deadline has passed
    require!(
        Clock::get()?.unix_timestamp < tournament.registration_deadline,
        ErrorCode::RegistrationDeadlinePassed
    );
    
    // Check if tournament is full
    require!(
        tournament.participants.len() < tournament.max_participants as usize,
        ErrorCode::TournamentFull
    );
    
    // Transfer entry fee
    if tournament.entry_fee > 0 {
        // Transfer logic here
    }
    
    // Add participant
    tournament.participants.push(Participant {
        player: participant.key(),
        entry_fee_paid: tournament.entry_fee,
        joined_at: Clock::get()?.unix_timestamp,
        current_bracket: None,
        eliminated_at: None,
        final_position: None,
    });
    
    // If we've reached the threshold, start countdown
    if tournament.participants.len() >= (tournament.max_participants / 2) as usize {
        // Start countdown logic
    }
    
    Ok(())
}

// Start tournament
pub fn start_tournament(ctx: Context<StartTournament>) -> Result<()> {
    let tournament = &mut ctx.accounts.tournament;
    
    // Check authorization
    require!(
        ctx.accounts.authority.key() == tournament.creator ||
        ctx.accounts.authority.key() == tournament.manager.authority,
        ErrorCode::Unauthorized
    );
    
    // Check if we have enough participants
    require!(
        tournament.participants.len() >= 2,
        ErrorCode::NotEnoughParticipants
    );
    
    // Generate brackets
    generate_initial_brackets(tournament)?;
    
    tournament.status = TournamentStatus::Active;
    tournament.started_at = Some(Clock::get()?.unix_timestamp);
    tournament.current_round = 1;
    
    Ok(())
}

// Report bracket results
pub fn report_bracket_results(ctx: Context<ReportBracketResults>, winners: Vec<Pubkey>) -> Result<()> {
    let tournament = &mut ctx.accounts.tournament;
    
    // Authorization check - only tournament creator or manager
    require!(
        ctx.accounts.authority.key() == tournament.creator ||
        ctx.accounts.authority.key() == tournament.manager.authority,
        ErrorCode::Unauthorized
    );
    
    // Update bracket with winners
    // Progress tournament logic
    
    Ok(())
}

// Complete tournament
pub fn complete_tournament(ctx: Context<CompleteTournament>) -> Result<()> {
    let tournament = &mut ctx.accounts.tournament;
    
    // Set winner and final positions
    // Distribute rewards
    
    tournament.status = TournamentStatus::Completed;
    tournament.completed_at = Some(Clock::get()?.unix_timestamp);
    
    Ok(())
}
```

## Key Features

### 1. Leader Seeding
- Leaders can deposit seed capital to start tournaments
- If successful (reach participant threshold), they get rewards
- If unsuccessful, seed capital goes to platform treasury

### 2. Dynamic Registration
- Flexible participant limits
- Countdown mechanism when threshold is reached
- Progressive fee structure based on registration timing

### 3. Bracket Management
- Automated bracket generation
- Multi-round tournament progression
- Flexible bracket sizes (2-player, 4-player, etc.)

### 4. Reward Distribution
- Performance-based token allocation
- Automated reward distribution
- Integration with existing token creation mechanisms

## Error Codes

```rust
#[error_code]
pub enum ErrorCode {
    #[msg("Tournament is not accepting registrations")]
    TournamentNotAcceptingRegistrations,
    #[msg("Registration deadline has passed")]
    RegistrationDeadlinePassed,
    #[msg("Tournament is full")]
    TournamentFull,
    #[msg("Not enough participants to start tournament")]
    NotEnoughParticipants,
    #[msg("Unauthorized action")]
    Unauthorized,
    #[msg("Tournament is not active")]
    TournamentNotActive,
    #[msg("Invalid bracket results")]
    InvalidBracketResults,
}
```