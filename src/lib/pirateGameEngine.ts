import { 
  Player, 
  GameState, 
  GameMap, 
  Ship, 
  Coordinate,
  GameAction,
  Resources,
  GAME_CONFIG 
} from '../types/game';
import { PirateGameEngine } from './gameLogic';

/**
 * High-level game engine that manages game flow and player actions
 */
export class PirateGameManager {
  
  /**
   * Initialize a new pirate game
   */
  static createNewGame(players: Player[], gameId: string): GameState {
    const gameMap = PirateGameEngine.createGameMap(GAME_CONFIG.MAP_SIZE);
    
    // Generate starting positions for players
    const startingPositions = this.generateStartingPositions(players.length, gameMap.size);
    
    // Initialize players with starting fleets and resources
    const initializedPlayers = players.map((player, index) => ({
      ...player,
      resources: PirateGameEngine.generateStartingResources(),
      ships: PirateGameEngine.createStartingFleet(
        player.publicKey, 
        startingPositions[index]
      ),
      controlledTerritories: [],
      totalScore: 0,
      isActive: true,
    }));
    
    return {
      gameId,
      players: initializedPlayers,
      currentPlayerIndex: 0,
      gameMap,
      gameStatus: 'waiting',
      currentPhase: 'deployment',
      turnNumber: 1,
      turnTimeRemaining: GAME_CONFIG.TURN_TIMEOUT,
      pendingActions: [],
      eventLog: [],
      globalWeather: this.generateRandomWeather(),
    };
  }

  /**
   * Generate starting positions for players around the map edges
   */
  static generateStartingPositions(playerCount: number, mapSize: number): Coordinate[][] {
    const positions: Coordinate[][] = [];
    const corners = [
      [{ x: 1, y: 1 }, { x: 2, y: 1 }], // Top-left
      [{ x: mapSize - 2, y: 1 }, { x: mapSize - 1, y: 1 }], // Top-right
      [{ x: 1, y: mapSize - 2 }, { x: 1, y: mapSize - 1 }], // Bottom-left
      [{ x: mapSize - 2, y: mapSize - 1 }, { x: mapSize - 1, y: mapSize - 2 }], // Bottom-right
    ];
    
    for (let i = 0; i < playerCount && i < corners.length; i++) {
      positions.push(corners[i]);
    }
    
    return positions;
  }

  /**
   * Process a player's turn action
   */
  static processTurnAction(
    gameState: GameState,
    action: GameAction
  ): { 
    updatedGameState: GameState; 
    success: boolean; 
    message: string; 
  } {
    const { type, data, player } = action;
    const currentPlayer = gameState.players.find(p => p.publicKey === player);
    
    if (!currentPlayer) {
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: 'Player not found' 
      };
    }

    switch (type) {
      case 'move_ship':
        return this.processShipMovementAction(gameState, action);
      case 'attack':
        return this.processAttackAction(gameState, action);
      case 'claim_territory':
        return this.processTerritoryClaimAction(gameState, action);
      case 'collect_resources':
        return this.processResourceCollectionAction(gameState, action);
      case 'build_ship':
        return this.processShipBuildAction(gameState, action);
      default:
        return { 
          updatedGameState: gameState, 
          success: false, 
          message: 'Unknown action type' 
        };
    }
  }

  /**
   * Process ship movement
   */
  static processShipMovementAction(
    gameState: GameState,
    action: GameAction
  ): { updatedGameState: GameState; success: boolean; message: string } {
    const { data, player } = action;
    const { shipId, toCoordinate } = data;
    
    if (!shipId || !toCoordinate) {
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: 'Missing ship ID or destination' 
      };
    }

    const playerIndex = gameState.players.findIndex(p => p.publicKey === player);
    const currentPlayer = gameState.players[playerIndex];
    const ship = currentPlayer.ships.find(s => s.id === shipId);
    
    if (!ship) {
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: 'Ship not found' 
      };
    }

    const toPosition = PirateGameEngine.stringToCoordinate(toCoordinate);
    const moveResult = PirateGameEngine.processShipMovement(ship, toPosition, gameState.gameMap);
    
    if (!moveResult.success) {
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: moveResult.message 
      };
    }

    // Update game state with new ship position
    const updatedPlayers = [...gameState.players];
    const updatedShips = currentPlayer.ships.map(s => 
      s.id === shipId ? moveResult.updatedShip! : s
    );
    updatedPlayers[playerIndex] = { ...currentPlayer, ships: updatedShips };

    // Add event to log
    const moveEvent: GameEvent = {
      id: `event_${Date.now()}`,
      type: 'ship_moved',
      playerId: player,
      turnNumber: gameState.turnNumber,
      timestamp: Date.now(),
      description: `${moveResult.updatedShip!.type} moved to ${toCoordinate}`,
      data: { shipId, from: this.coordinateToString(ship.position), to: toCoordinate }
    };

    const updatedGameState = {
      ...gameState,
      players: updatedPlayers,
      eventLog: [...gameState.eventLog, moveEvent].slice(-10), // Keep last 10 events
    };

    return { 
      updatedGameState, 
      success: true, 
      message: moveResult.message 
    };
  }

  /**
   * Advance to next player's turn
   */
  static advanceTurn(gameState: GameState): GameState {
    let nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    let turnNumber = gameState.turnNumber;
    let updatedWeather = gameState.globalWeather;
    
    // If we've cycled through all players, increment turn number and update weather
    if (nextPlayerIndex === 0) {
      turnNumber++;
      
      // Update weather duration and potentially change weather
      if (updatedWeather && updatedWeather.duration > 0) {
        updatedWeather = { ...updatedWeather, duration: updatedWeather.duration - 1 };
        
        // If weather expires or random chance, generate new weather
        if (updatedWeather.duration === 0 || Math.random() < 0.15) {
          updatedWeather = this.generateRandomWeather();
        }
      } else {
        // Generate new weather if none exists
        updatedWeather = this.generateRandomWeather();
      }
    }
    
    // Skip players with no active ships
    while (gameState.players[nextPlayerIndex].ships.every(ship => ship.health === 0)) {
      nextPlayerIndex = (nextPlayerIndex + 1) % gameState.players.length;
      if (nextPlayerIndex === gameState.currentPlayerIndex) {
        // Only one player left with ships - game should end
        break;
      }
    }
    
    return {
      ...gameState,
      currentPlayerIndex: nextPlayerIndex,
      turnNumber,
      turnTimeRemaining: GAME_CONFIG.TURN_TIMEOUT,
      globalWeather: updatedWeather,
    };
  }

  /**
   * Generate random weather effect
   */
  static generateRandomWeather(): WeatherEffect {
    const weatherTypes = [
      {
        type: 'calm' as const,
        duration: 2,
        effect: { resourceModifier: 1.2, movementModifier: 1.0 }
      },
      {
        type: 'trade_winds' as const,
        duration: 3,
        effect: { movementModifier: 1.5, resourceModifier: 1.1 }
      },
      {
        type: 'storm' as const,
        duration: 2,
        effect: { movementModifier: 0.5, damageModifier: 1.3, resourceModifier: 0.8 }
      },
      {
        type: 'fog' as const,
        duration: 3,
        effect: { visibilityReduced: true, movementModifier: 0.7, damageModifier: 0.8 }
      }
    ];

    const randomIndex = Math.floor(Math.random() * weatherTypes.length);
    return weatherTypes[randomIndex];
  }

  /**
   * Check if game should end and determine winner
   */
  static checkGameEnd(gameState: GameState): { 
    isGameOver: boolean; 
    winner: Player | null; 
    updatedGameState: GameState; 
  } {
    const isGameOver = PirateGameEngine.isGameOver(gameState.players, gameState.gameMap);
    
    if (isGameOver) {
      const winner = PirateGameEngine.determineWinner(gameState.players, gameState.gameMap);
      const updatedGameState = {
        ...gameState,
        gameStatus: 'completed' as const,
        winner: winner?.publicKey,
      };
      
      return { isGameOver: true, winner, updatedGameState };
    }
    
    return { isGameOver: false, winner: null, updatedGameState: gameState };
  }

  /**
   * Process ship attack action
   */
  static processAttackAction(gameState: GameState, action: GameAction) {
    const { data, player } = action;
    const { shipId, targetShipId } = data;
    
    if (!shipId || !targetShipId) {
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: 'Missing ship IDs for attack' 
      };
    }

    const playerIndex = gameState.players.findIndex(p => p.publicKey === player);
    const currentPlayer = gameState.players[playerIndex];
    const attackerShip = currentPlayer.ships.find(s => s.id === shipId);
    
    if (!attackerShip) {
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: 'Attacker ship not found' 
      };
    }

    // Find target ship across all players
    let targetPlayer: Player | null = null;
    let targetPlayerIndex = -1;
    let targetShip: Ship | null = null;

    for (let i = 0; i < gameState.players.length; i++) {
      const ship = gameState.players[i].ships.find(s => s.id === targetShipId);
      if (ship) {
        targetPlayer = gameState.players[i];
        targetPlayerIndex = i;
        targetShip = ship;
        break;
      }
    }

    if (!targetShip || !targetPlayer) {
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: 'Target ship not found' 
      };
    }

    // Check if ships are in range (adjacent cells)
    const distance = PirateGameEngine.calculateDistance(attackerShip.position, targetShip.position);
    if (distance > 1.5) {
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: 'Target out of range for attack' 
      };
    }

    // Process combat
    const combatResult = PirateGameEngine.processShipCombat(attackerShip, targetShip);
    
    // Update game state
    const updatedPlayers = [...gameState.players];
    updatedPlayers[targetPlayerIndex] = {
      ...targetPlayer,
      ships: targetPlayer.ships.map(s => 
        s.id === targetShipId ? combatResult.defenderShip : s
      )
    };

    const updatedGameState = {
      ...gameState,
      players: updatedPlayers,
    };

    return { 
      updatedGameState, 
      success: true, 
      message: combatResult.message 
    };
  }

  /**
   * Process territory claiming action
   */
  static processTerritoryClaimAction(gameState: GameState, action: GameAction) {
    const { data, player } = action;
    const { shipId, toCoordinate } = data;
    
    if (!shipId || !toCoordinate) {
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: 'Missing ship ID or coordinate for claiming' 
      };
    }

    const playerIndex = gameState.players.findIndex(p => p.publicKey === player);
    const currentPlayer = gameState.players[playerIndex];
    const ship = currentPlayer.ships.find(s => s.id === shipId);
    
    if (!ship) {
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: 'Ship not found' 
      };
    }

    // Check if ship is at the territory location
    const shipCoordinate = PirateGameEngine.coordinateToString(ship.position);
    if (shipCoordinate !== toCoordinate) {
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: 'Ship must be at territory to claim it' 
      };
    }

    // Process territory claim
    const claimResult = PirateGameEngine.processTerritoryClaim(player, toCoordinate, gameState.gameMap);
    
    if (!claimResult.success) {
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: claimResult.message 
      };
    }

    // Update game state
    const coord = PirateGameEngine.stringToCoordinate(toCoordinate);
    const updatedGameMap = { ...gameState.gameMap };
    updatedGameMap.cells[coord.x][coord.y] = claimResult.updatedCell!;

    const updatedPlayers = [...gameState.players];
    updatedPlayers[playerIndex] = {
      ...currentPlayer,
      controlledTerritories: [...currentPlayer.controlledTerritories, toCoordinate]
    };

    const updatedGameState = {
      ...gameState,
      gameMap: updatedGameMap,
      players: updatedPlayers,
    };

    return { 
      updatedGameState, 
      success: true, 
      message: claimResult.message 
    };
  }

  /**
   * Process resource collection action
   */
  static processResourceCollectionAction(gameState: GameState, action: GameAction) {
    const { data, player } = action;
    const { shipId } = data;
    
    if (!shipId) {
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: 'Missing ship ID for resource collection' 
      };
    }

    const playerIndex = gameState.players.findIndex(p => p.publicKey === player);
    const currentPlayer = gameState.players[playerIndex];
    const ship = currentPlayer.ships.find(s => s.id === shipId);
    
    if (!ship) {
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: 'Ship not found' 
      };
    }

    // Get territory at ship's position
    const shipCoordinate = PirateGameEngine.coordinateToString(ship.position);
    const coord = PirateGameEngine.stringToCoordinate(shipCoordinate);
    const territory = gameState.gameMap.cells[coord.x]?.[coord.y];
    
    if (!territory) {
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: 'No territory at ship position' 
      };
    }

    // Check if player controls this territory
    if (territory.owner !== player) {
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: 'You must control this territory to collect resources' 
      };
    }

    // Calculate resources to collect
    const baseResources = TERRITORY_RESOURCE_GENERATION[territory.type];
    if (!baseResources || Object.keys(baseResources).length === 0) {
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: 'This territory produces no resources' 
      };
    }

    // Apply collection multiplier based on ship type
    const collectionMultiplier = this.getResourceCollectionMultiplier(ship.type);
    const collectedResources: Partial<Resources> = {};
    
    Object.entries(baseResources).forEach(([resource, amount]) => {
      collectedResources[resource as keyof Resources] = Math.floor(amount * collectionMultiplier);
    });

    // Update player resources
    const updatedPlayers = [...gameState.players];
    updatedPlayers[playerIndex] = {
      ...currentPlayer,
      resources: {
        gold: currentPlayer.resources.gold + (collectedResources.gold || 0),
        crew: currentPlayer.resources.crew + (collectedResources.crew || 0),
        cannons: currentPlayer.resources.cannons + (collectedResources.cannons || 0),
        supplies: currentPlayer.resources.supplies + (collectedResources.supplies || 0),
      }
    };

    const resourcesList = Object.entries(collectedResources)
      .filter(([_, amount]) => amount && amount > 0)
      .map(([resource, amount]) => `${amount} ${resource}`)
      .join(', ');

    return { 
      updatedGameState: { ...gameState, players: updatedPlayers }, 
      success: true, 
      message: `Collected: ${resourcesList}` 
    };
  }

  /**
   * Get resource collection multiplier based on ship type
   */
  static getResourceCollectionMultiplier(shipType: ShipType): number {
    const multipliers = {
      sloop: 1.0,     // Fast but standard collection
      frigate: 1.2,   // Balanced with slight bonus
      galleon: 1.5,   // Heavy cargo capacity
      flagship: 1.3,  // Command bonus
    };
    return multipliers[shipType] || 1.0;
  }

  /**
   * Process ship building action
   */
  static processShipBuildAction(gameState: GameState, action: GameAction) {
    const { data, player } = action;
    const { shipType, toCoordinate } = data;
    
    if (!shipType || !toCoordinate) {
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: 'Missing ship type or build location' 
      };
    }

    const playerIndex = gameState.players.findIndex(p => p.publicKey === player);
    const currentPlayer = gameState.players[playerIndex];
    
    // Check if player has reached ship limit
    const activeShips = currentPlayer.ships.filter(ship => ship.health > 0);
    if (activeShips.length >= GAME_CONFIG.MAX_SHIPS_PER_PLAYER) {
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: `Maximum fleet size reached (${GAME_CONFIG.MAX_SHIPS_PER_PLAYER} ships)` 
      };
    }

    // Get ship building costs
    const costs = this.getShipBuildingCosts(shipType as ShipType);
    
    // Check if player has enough resources
    const canAfford = Object.entries(costs).every(([resource, cost]) => 
      currentPlayer.resources[resource as keyof Resources] >= cost
    );
    
    if (!canAfford) {
      const costList = Object.entries(costs)
        .map(([resource, cost]) => `${cost} ${resource}`)
        .join(', ');
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: `Insufficient resources. Need: ${costList}` 
      };
    }

    // Check if build location is valid (water adjacent to controlled port)
    const buildCoord = PirateGameEngine.stringToCoordinate(toCoordinate);
    const territory = gameState.gameMap.cells[buildCoord.x]?.[buildCoord.y];
    
    if (!territory || territory.type !== 'water') {
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: 'Ships can only be built in water' 
      };
    }

    // Check for adjacent controlled port
    const hasAdjacentPort = this.hasAdjacentControlledPort(buildCoord, gameState, player);
    if (!hasAdjacentPort) {
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: 'Must build ships adjacent to a controlled port' 
      };
    }

    // Check if position is occupied
    const occupiedByShip = gameState.players.some(p => 
      p.ships.some(ship => 
        ship.health > 0 && 
        PirateGameEngine.coordinateToString(ship.position) === toCoordinate
      )
    );
    
    if (occupiedByShip) {
      return { 
        updatedGameState: gameState, 
        success: false, 
        message: 'Position occupied by another ship' 
      };
    }

    // Create new ship
    const newShip = PirateGameEngine.createShip(shipType as ShipType, player, buildCoord);
    
    // Deduct resources and add ship
    const updatedPlayers = [...gameState.players];
    updatedPlayers[playerIndex] = {
      ...currentPlayer,
      resources: {
        gold: currentPlayer.resources.gold - costs.gold,
        crew: currentPlayer.resources.crew - costs.crew,
        cannons: currentPlayer.resources.cannons - costs.cannons,
        supplies: currentPlayer.resources.supplies - costs.supplies,
      },
      ships: [...currentPlayer.ships, newShip]
    };

    return { 
      updatedGameState: { ...gameState, players: updatedPlayers }, 
      success: true, 
      message: `${shipType.toUpperCase()} built successfully!` 
    };
  }

  /**
   * Get ship building costs
   */
  static getShipBuildingCosts(shipType: ShipType): Resources {
    const costs = {
      sloop: { gold: 500, crew: 10, cannons: 5, supplies: 20 },
      frigate: { gold: 1200, crew: 25, cannons: 15, supplies: 40 },
      galleon: { gold: 2500, crew: 50, cannons: 30, supplies: 80 },
      flagship: { gold: 5000, crew: 100, cannons: 60, supplies: 150 },
    };
    return costs[shipType];
  }

  /**
   * Check if position has adjacent controlled port
   */
  static hasAdjacentControlledPort(position: Coordinate, gameState: GameState, player: string): boolean {
    const adjacentOffsets = [
      { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
      { x: -1, y: 0 },                   { x: 1, y: 0 },
      { x: -1, y: 1 },  { x: 0, y: 1 },  { x: 1, y: 1 }
    ];

    return adjacentOffsets.some(offset => {
      const checkPos = { x: position.x + offset.x, y: position.y + offset.y };
      const territory = gameState.gameMap.cells[checkPos.x]?.[checkPos.y];
      
      return territory && 
             territory.type === 'port' && 
             territory.owner === player;
    });
  }
}