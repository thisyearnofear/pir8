use anchor_lang::prelude::*;

#[error_code]
pub enum PIR8Error {
    #[msg("Game is full - maximum players reached")]
    GameFull,
    
    #[msg("Game is not in active state")]
    GameNotActive,
    
    #[msg("Not your turn to play")]
    NotYourTurn,
    
    #[msg("Invalid coordinate format - use A1 to G7")]
    InvalidCoordinate,
    
    #[msg("Coordinate has already been chosen")]
    CoordinateTaken,
    
    #[msg("Insufficient funds for entry fee")]
    InsufficientFunds,
    
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
    
    #[msg("Player is not in this game")]
    PlayerNotInGame,
    
    #[msg("Game has already started")]
    GameAlreadyStarted,
    
    #[msg("Game is not ready to start - need more players")]
    GameNotReadyToStart,
    
    #[msg("Game is already completed")]
    GameAlreadyCompleted,
    
    #[msg("Invalid player index")]
    InvalidPlayerIndex,
    
    #[msg("Platform fee is too high")]
    PlatformFeeTooHigh,
    
    #[msg("Entry fee is too low")]
    EntryFeeTooLow,
    
    #[msg("Maximum players exceeded")]
    MaxPlayersExceeded,
    
    #[msg("Target player not found")]
    TargetPlayerNotFound,
    
    #[msg("Invalid item action for this item type")]
    InvalidItemAction,
    
    #[msg("Not enough points to perform this action")]
    NotEnoughPoints,
    
    #[msg("Player already has this defensive item")]
    DefensiveItemAlreadyOwned,
    
    #[msg("Cannot target yourself with this action")]
    CannotTargetSelf,
    
    #[msg("Game is paused")]
    GamePaused,
    
    #[msg("Turn timeout exceeded")]
    TurnTimeout,
    
    #[msg("Invalid grid generation seed")]
    InvalidGridSeed,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Invalid string length")]
    InvalidStringLength,
    
    #[msg("Random number generation failed")]
    RandomGenerationFailed,
    
    #[msg("Game configuration not initialized")]
    ConfigNotInitialized,
    
    #[msg("Winner already claimed")]
    WinnerAlreadyClaimed,
    
    #[msg("No winner determined yet")]
    NoWinnerDetermined,
    
    #[msg("Invalid treasury account")]
    InvalidTreasury,
    
    #[msg("Token transfer failed")]
    TokenTransferFailed,
}