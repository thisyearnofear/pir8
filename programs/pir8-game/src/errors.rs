use anchor_lang::prelude::*;

#[error_code]
pub enum GameError {
    #[msg("Game is not active")]
    GameNotActive,
    #[msg("Game is full")]
    GameFull,
    #[msg("Not enough players to start")]
    NotEnoughPlayers,
    #[msg("Game already started")]
    GameAlreadyStarted,
    #[msg("Not your turn")]
    NotPlayerTurn,
    #[msg("Ship not found")]
    ShipNotFound,
    #[msg("Ship not at specified location")]
    ShipNotAtLocation,
    #[msg("Territory not controlled by player")]
    TerritoryNotControlled,
    #[msg("Insufficient resources")]
    InsufficientResources,
    #[msg("Fleet size limit reached")]
    FleetSizeLimit,
    #[msg("No adjacent controlled port")]
    NoAdjacentPort,
    #[msg("Position occupied")]
    PositionOccupied,
    #[msg("Game not joinable")]
    GameNotJoinable,
    #[msg("Invalid coordinate")]
    InvalidCoordinate,
    #[msg("Ships not in range")]
    ShipsNotInRange,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("No scan charges remaining")]
    NoScansRemaining,
    #[msg("Coordinate already scanned")]
    CoordinateAlreadyScanned,
}
