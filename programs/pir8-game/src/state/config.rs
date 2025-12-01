use anchor_lang::prelude::*;

#[account]
pub struct GameConfig {
    /// Program authority (admin)
    pub authority: Pubkey,
    
    /// Default entry fee in lamports (0.1 SOL = 100_000_000)
    pub default_entry_fee: u64,
    
    /// Platform fee in basis points (500 = 5%)
    pub platform_fee_bps: u16,
    
    /// Maximum number of players per game
    pub max_players_per_game: u8,
    
    /// Turn timeout in seconds
    pub turn_timeout: u64,
    
    /// Treasury account for collecting fees
    pub treasury: Pubkey,
    
    /// Game paused status
    pub is_paused: bool,
    
    /// Total games created
    pub total_games: u64,
    
    /// Total volume in lamports
    pub total_volume: u64,
    
    /// Reserved space for future upgrades
    pub reserved: [u8; 128],
}

impl GameConfig {
    pub const SPACE: usize = 8 + // discriminator
        32 + // authority
        8 + // default_entry_fee
        2 + // platform_fee_bps
        1 + // max_players_per_game
        8 + // turn_timeout
        32 + // treasury
        1 + // is_paused
        8 + // total_games
        8 + // total_volume
        128; // reserved
}