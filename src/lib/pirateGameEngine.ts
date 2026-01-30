import {
  Player,
  GameState,
  GameMap,
  Ship,
  ShipType,
  Coordinate,
  GameAction,
  Resources,
  GameEvent,
  WeatherEffect,
  TERRITORY_RESOURCE_GENERATION,
  TerritoryCellType,
  TerritoryCell
} from '../types/game';
import { GAME_CONFIG } from '../utils/constants';
import { GameBalance } from './gameBalance';

/**
 * High-level game engine that manages game flow and player actions
 */
export class PirateGameManager {

  // ===== UTILITY FUNCTIONS =====

  /**
   * Convert coordinate object to string representation
   */
  static coordinateToString(coordinate: Coordinate): string {
    return `${coordinate.x},${coordinate.y}`;
  }

  /**
   * Convert string coordinate to coordinate object
   */
  static stringToCoordinate(coordinateStr: string): Coordinate {
    const [xStr, yStr] = coordinateStr.split(',');
    const x = Number(xStr);
    const y = Number(yStr);
    if (isNaN(x) || isNaN(y)) {
      throw new Error('Invalid coordinate format. Expected format: "x,y"');
    }
    return { x, y };
  }

  /**
   * Calculate distance between two coordinates
   */
  static calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
    return Math.sqrt(Math.pow(coord2.x - coord1.x, 2) + Math.pow(coord2.y - coord1.y, 2));
  }

  /**
   * Generate starting resources for a new player
   */
  static generateStartingResources(): Resources {
    return {
      gold: 1000,
      crew: 50,
      cannons: 10,
      supplies: 100,
      wood: 0,
      rum: 0,
    };
  }

  /**
   * Create a basic game map (simplified version for local state)
   */
  static createGameMap(size: number = 10): GameMap {
    const cells: TerritoryCell[][] = Array(size).fill(null).map(() => []);

    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const coordinate = this.coordinateToString({ x, y });
        const cellType = this.generateTerritoryType(x, y, size);

        cells[x]![y] = {
          coordinate,
          type: cellType,
          owner: null,
          resources: TERRITORY_RESOURCE_GENERATION[cellType] || {},
          isContested: false,
        };
      }
    }

    return { cells, size };
  }

  /**
   * Generate territory type based on position
   */
  static generateTerritoryType(x: number, y: number, size: number): TerritoryCellType {
    const centerX = Math.floor(size / 2);
    const centerY = Math.floor(size / 2);
    const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);
    const normalizedDistance = distanceFromCenter / maxDistance;

    if (normalizedDistance < 0.2) {
      return Math.random() < 0.7 ? 'treasure' : 'port';
    } else if (normalizedDistance < 0.5) {
      const rand = Math.random();
      if (rand < 0.4) return 'island';
      if (rand < 0.6) return 'port';
      return 'water';
    } else if (normalizedDistance < 0.8) {
      const rand = Math.random();
      if (rand < 0.1) return 'storm';
      if (rand < 0.15) return 'reef';
      return 'water';
    } else {
      const rand = Math.random();
      if (rand < 0.2) return 'whirlpool';
      if (rand < 0.3) return 'storm';
      return 'water';
    }
  }

  /**
   * Create starting fleet for a player
   */
  static createStartingFleet(playerId: string, startingPosition: Coordinate): Ship[] {
    return [
      {
        id: `${playerId}_sloop_1`,
        type: 'sloop',
        health: 100,
        maxHealth: 100,
        attack: 25,
        defense: 10,
        speed: 3,
        position: startingPosition,
        resources: { gold: 0, crew: 0, cannons: 0, supplies: 0, wood: 0, rum: 0 }
      }
    ];
  }

  /**
   * Initialize a new pirate game
   */
  static createNewGame(players: Player[], gameId: string): GameState {
    const gameMap = this.createGameMap(GAME_CONFIG.MAP_SIZE);

    // Generate starting positions for players
    const startingPositions = this.generateStartingPositions(players.length, gameMap.size);

    // Initialize players with starting fleets and resources
    const initializedPlayers = players.map((player, index) => ({
      ...player,
      resources: this.generateStartingResources(),
      ships: this.createStartingFleet(
        player.publicKey,
        startingPositions[index]?.[0] || { x: 0, y: 0 } // Take the first position from the array, fallback to 0,0
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
      if (corners[i]) {
        positions.push(corners[i]!);
      }
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
    const { type, player } = action;
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
    if (playerIndex === -1) {
      return {
        updatedGameState: gameState,
        success: false,
        message: 'Player not found'
      };
    }
    const currentPlayer = gameState.players[playerIndex];
    if (!currentPlayer) {
      return {
        updatedGameState: gameState,
        success: false,
        message: 'Current player not found'
      };
    }
    const ship = currentPlayer.ships.find(s => s.id === shipId);

    if (!ship) {
      return {
        updatedGameState: gameState,
        success: false,
        message: 'Ship not found'
      };
    }

    const toPosition = this.stringToCoordinate(toCoordinate);
    // NOTE: Game logic moved to smart contract - this is now just for local UI feedback
    // const moveResult = PirateGameEngine.processShipMovement(ship, toPosition, gameState.gameMap);

    // For now, assume move is valid (smart contract will validate)
    const moveResult = { 
      success: true, 
      updatedShip: { ...ship, position: toPosition },
      message: 'Movement processed'
    };

    if (!moveResult.success) {
      return {
        updatedGameState: gameState,
        success: false,
        message: 'Movement failed'
      };
    }

    // Update game state with new ship position
    const updatedPlayers = [...gameState.players];
    if (!currentPlayer) {
      return {
        updatedGameState: gameState,
        success: false,
        message: 'Current player not found'
      };
    }
    const updatedShips = currentPlayer.ships.map(s =>
      s.id === shipId ? moveResult.updatedShip! : s
    );
    updatedPlayers[playerIndex] = {
      ...currentPlayer,
      ships: updatedShips,
      publicKey: currentPlayer.publicKey // Ensure publicKey is preserved
    };

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
    let nextPlayer = gameState.players[nextPlayerIndex];
    while (
      nextPlayer &&
      nextPlayer.ships.every(ship => ship.health === 0)
    ) {
      nextPlayerIndex = (nextPlayerIndex + 1) % gameState.players.length;
      nextPlayer = gameState.players[nextPlayerIndex];
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
    return weatherTypes[randomIndex] || {
      type: 'calm',
      duration: 2,
      effect: { resourceModifier: 1.2, movementModifier: 1.0 }
    };
  }

  /**
   * Check if game should end and determine winner
   */
  static checkGameEnd(gameState: GameState): {
    isGameOver: boolean;
    winner: Player | null;
    updatedGameState: GameState;
  } {
    // NOTE: Game logic moved to smart contract - this is just for local UI feedback
    // const isGameOver = PirateGameEngine.isGameOver(gameState.players, gameState.gameMap);
    const isGameOver = false; // Let smart contract determine game end

    if (isGameOver) {
      // const winner = PirateGameEngine.determineWinner(gameState.players, gameState.gameMap);
      const winner = null; // Smart contract will determine winner
      const updatedGameState: GameState = {
        ...gameState,
        gameStatus: 'completed' as const,
        winner: undefined,
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
    if (playerIndex === -1) {
      return {
        updatedGameState: gameState,
        success: false,
        message: 'Player not found'
      };
    }
    const currentPlayer = gameState.players[playerIndex];
    if (!currentPlayer) {
      return {
        updatedGameState: gameState,
        success: false,
        message: 'Current player not found'
      };
    }
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
      const player = gameState.players[i];
      if (player) {
        const ship = player.ships.find(s => s.id === targetShipId);
        if (ship) {
          targetPlayer = player;
          targetPlayerIndex = i;
          targetShip = ship;
          break;
        }
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
    const distance = this.calculateDistance(attackerShip.position, targetShip.position);
    if (distance > 1.5) {
      return {
        updatedGameState: gameState,
        success: false,
        message: 'Target out of range for attack'
      };
    }

    // NOTE: Combat logic moved to smart contract
    // const combatResult = PirateGameEngine.processShipCombat(attackerShip, targetShip);
    const combatResult = { 
      success: true, 
      updatedAttacker: attackerShip, 
      updatedTarget: targetShip,
      message: 'Attack completed' 
    };

    // Update game state
    const updatedPlayers = [...gameState.players];
    updatedPlayers[targetPlayerIndex] = {
      ...targetPlayer,
      publicKey: targetPlayer.publicKey, // Ensure publicKey is preserved
      ships: targetPlayer.ships.map(s =>
        s.id === targetShipId ? combatResult.updatedTarget! : s
      )
    };

    const updatedGameState = {
      ...gameState,
      players: updatedPlayers,
    };

    return {
      updatedGameState,
      success: true,
      message: 'Attack completed successfully'
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
    if (playerIndex === -1) {
      return {
        updatedGameState: gameState,
        success: false,
        message: 'Player not found'
      };
    }
    const currentPlayer = gameState.players[playerIndex];
    if (!currentPlayer) {
      return {
        updatedGameState: gameState,
        success: false,
        message: 'Current player not found'
      };
    }
    const ship = currentPlayer.ships.find(s => s.id === shipId);

    if (!ship) {
      return {
        updatedGameState: gameState,
        success: false,
        message: 'Ship not found'
      };
    }

    // Check if ship is at the territory location
    const shipCoordinate = this.coordinateToString(ship.position);
    if (shipCoordinate !== toCoordinate) {
      return {
        updatedGameState: gameState,
        success: false,
        message: 'Ship must be at territory to claim it'
      };
    }

    // NOTE: Territory logic moved to smart contract
    // const claimResult = PirateGameEngine.processTerritoryClaim(player, toCoordinate, gameState.gameMap);
    const claimResult = { 
      success: true, 
      message: 'Territory claimed',
      updatedMap: gameState.gameMap // Fallback to current map
    };

    if (!claimResult.success) {
      return {
        updatedGameState: gameState,
        success: false,
        message: (claimResult as any).message || 'Claim failed'
      };
    }

    // Update game state using the updated map from claimResult
    const updatedPlayers = [...gameState.players];
    const targetPlayer = updatedPlayers[playerIndex];
    if (!targetPlayer) {
        return { updatedGameState: gameState, success: false, message: 'Player not found' };
    }

    updatedPlayers[playerIndex] = {
      ...targetPlayer,
      publicKey: targetPlayer.publicKey, // Ensure publicKey is preserved
      controlledTerritories: [...targetPlayer.controlledTerritories, toCoordinate]
    };

    const updatedGameState = {
      ...gameState,
      gameMap: claimResult.updatedMap,
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
    if (playerIndex === -1) {
      return {
        updatedGameState: gameState,
        success: false,
        message: 'Player not found'
      };
    }
    const currentPlayer = gameState.players[playerIndex];
    if (!currentPlayer) {
      return {
        updatedGameState: gameState,
        success: false,
        message: 'Current player not found'
      };
    }
    const ship = currentPlayer.ships.find(s => s.id === shipId);

    if (!ship) {
      return {
        updatedGameState: gameState,
        success: false,
        message: 'Ship not found'
      };
    }

    // Get territory at ship's position
    const shipCoordinate = this.coordinateToString(ship.position);
    const coord = this.stringToCoordinate(shipCoordinate);
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
      if (amount !== undefined) {
        collectedResources[resource as keyof Resources] = Math.floor(amount * collectionMultiplier);
      }
    });

    // Update player resources
    const updatedPlayers = [...gameState.players];
    updatedPlayers[playerIndex] = {
      ...currentPlayer,
      publicKey: currentPlayer.publicKey, // Ensure publicKey is preserved
      resources: {
        gold: currentPlayer.resources.gold + (collectedResources.gold || 0),
        crew: currentPlayer.resources.crew + (collectedResources.crew || 0),
        cannons: currentPlayer.resources.cannons + (collectedResources.cannons || 0),
        supplies: currentPlayer.resources.supplies + (collectedResources.supplies || 0),
        wood: currentPlayer.resources.wood + (collectedResources.wood || 0),
        rum: currentPlayer.resources.rum + (collectedResources.rum || 0),
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

    if (!currentPlayer) {
      return {
        updatedGameState: gameState,
        success: false,
        message: 'Player not found'
      };
    }

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
    const buildCoord = this.stringToCoordinate(toCoordinate);
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
        this.coordinateToString(ship.position) === toCoordinate
      )
    );

    if (occupiedByShip) {
      return {
        updatedGameState: gameState,
        success: false,
        message: 'Position occupied by another ship'
      };
    }

    // NOTE: Ship creation logic moved to smart contract
    // const newShip = PirateGameEngine.createShip(shipType as ShipType, player, buildCoord);
    const newShip = {
      id: `${player}_${shipType}_${Date.now()}`,
      type: shipType as ShipType,
      health: 100,
      maxHealth: 100,
      attack: 25,
      defense: 10,
      speed: 2,
      position: buildCoord,
      resources: { gold: 0, crew: 0, cannons: 0, supplies: 0, wood: 0, rum: 0 }
    };

    // Deduct resources and add ship
    const updatedPlayers = [...gameState.players];
    updatedPlayers[playerIndex] = {
      ...currentPlayer,
      publicKey: currentPlayer.publicKey, // Ensure publicKey is preserved
      resources: {
        gold: currentPlayer.resources.gold - costs.gold,
        crew: currentPlayer.resources.crew - costs.crew,
        cannons: currentPlayer.resources.cannons - costs.cannons,
        supplies: currentPlayer.resources.supplies - costs.supplies,
        wood: currentPlayer.resources.wood - (costs.wood || 0),
        rum: currentPlayer.resources.rum - (costs.rum || 0),
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
   * Get ship building costs - Delegates to GameBalance (single source of truth)
   */
  static getShipBuildingCosts(shipType: ShipType): Resources {
    return GameBalance.getShipBuildingCosts(shipType);
  }

  /**
   * Get resource collection multiplier - Delegates to GameBalance
   */
  static getResourceCollectionMultiplier(shipType: ShipType): number {
    return GameBalance.getResourceCollectionMultiplier(shipType);
  }

  /**
   * Check if position has adjacent controlled port
   */
  static hasAdjacentControlledPort(position: Coordinate, gameState: GameState, player: string): boolean {
    const adjacentOffsets = [
      { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
      { x: -1, y: 0 }, { x: 1, y: 0 },
      { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 }
    ];

    return adjacentOffsets.some(offset => {
      const checkPos = { x: position.x + offset.x, y: position.y + offset.y };
      const territory = gameState.gameMap.cells[checkPos.x]?.[checkPos.y];

      return territory &&
        territory.type === 'port' &&
        territory.owner === player;
    });
  }

  // ===== AI OPPONENT SYSTEM (For Practice Mode) =====

  /**
   * Create an AI player for practice mode
   * ENHANCEMENT: Store difficulty in publicKey for proper AI behavior
   */
  static createAIPlayer(_gameId: string, difficulty: 'novice' | 'pirate' | 'captain' | 'admiral' = 'pirate'): Player {
    const aiNames = ['Blackbeard', 'Calico Jack', 'Anne Bonny', 'Bartholomew', 'Mary Read'];
    const randomName = aiNames[Math.floor(Math.random() * aiNames.length)];
    
    // Store difficulty in publicKey format: AI_{name}_{difficulty}_{timestamp}
    return {
      publicKey: `AI_${randomName}_${difficulty}_${Date.now()}`,
      username: `${randomName} (AI)`,
      resources: this.generateStartingResources(),
      ships: [],
      controlledTerritories: [],
      totalScore: 0,
      isActive: true,
      scanCharges: 3,
      scannedCoordinates: [],
      speedBonusAccumulated: 0,
      averageDecisionTimeMs: 0,
      totalMoves: 0,
    };
  }

  /**
   * Generate AI decision for current turn
   * ENHANCEMENT: Improved priority system with debug logging and smarter decisions
   */
  static generateAIMove(gameState: GameState, aiPlayer: Player): GameAction | null {
    const difficulty = this.getAIDifficulty(aiPlayer);
    const debugMode = typeof window !== 'undefined' && (window as any).PIR8_DEBUG_AI === true;
    
    if (debugMode) {
      console.log(`🤖 AI Turn: ${difficulty.debugName} evaluating options...`);
    }

    // Evaluate game state for strategic decisions
    const gameAnalysis = this.analyzeGameState(gameState, aiPlayer);
    
    // Priority 1: Claim valuable territories (high priority when on claimable tile)
    const claimAction = this.findBestTerritoryClaim(gameState, aiPlayer);
    if (claimAction && Math.random() < difficulty.claimChance) {
      if (debugMode) console.log('  ✅ AI Decision: Claim territory');
      return claimAction;
    }

    // Priority 2: Attack enemy ships (higher priority if losing or enemy is weak)
    const attackAction = this.findBestAttack(gameState, aiPlayer, gameAnalysis);
    const attackPriority = gameAnalysis.isLosing ? difficulty.attackChance * 1.2 : difficulty.attackChance;
    if (attackAction && Math.random() < attackPriority) {
      if (debugMode) console.log('  ⚔️ AI Decision: Attack enemy ship');
      return attackAction;
    }

    // Priority 3: Move toward objectives (always try to move if possible)
    const moveAction = this.findBestMove(gameState, aiPlayer, gameAnalysis);
    if (moveAction && Math.random() < difficulty.moveChance) {
      if (debugMode) console.log('  🚢 AI Decision: Move toward objective');
      return moveAction;
    }

    // Priority 4: Build ships if resources allow (lower priority if already strong)
    const buildAction = this.findBestBuild(gameState, aiPlayer);
    const buildPriority = gameAnalysis.isWinning ? difficulty.buildChance * 0.8 : difficulty.buildChance;
    if (buildAction && Math.random() < buildPriority) {
      if (debugMode) console.log('  🛠️ AI Decision: Build ship');
      return buildAction;
    }

    if (debugMode) console.log('  ⏭️ AI Decision: Pass (no valid actions)');
    return null; // AI passes turn
  }

  /**
   * Analyze game state to inform AI decisions
   * ENHANCEMENT: Strategic evaluation of current position
   */
  private static analyzeGameState(gameState: GameState, aiPlayer: Player): {
    isWinning: boolean;
    isLosing: boolean;
    territoriesControlled: number;
    averageTerritoriesPerPlayer: number;
    totalShips: number;
    averageShipsPerPlayer: number;
    resourceAdvantage: boolean;
  } {
    const activePlayers = gameState.players.filter(p => p.isActive);
    const totalTerritories = activePlayers.reduce((sum, p) => sum + p.controlledTerritories.length, 0);
    const totalShips = activePlayers.reduce((sum, p) => sum + p.ships.filter(s => s.health > 0).length, 0);
    
    const myTerritories = aiPlayer.controlledTerritories.length;
    const myShips = aiPlayer.ships.filter(s => s.health > 0).length;
    const myResources = aiPlayer.resources.gold + aiPlayer.resources.crew + aiPlayer.resources.cannons;
    
    const avgTerritories = totalTerritories / activePlayers.length;
    const avgShips = totalShips / activePlayers.length;
    const avgResources = activePlayers.reduce((sum, p) => 
      sum + p.resources.gold + p.resources.crew + p.resources.cannons, 0
    ) / activePlayers.length;

    return {
      isWinning: myTerritories > avgTerritories * 1.3 && myShips >= avgShips,
      isLosing: myTerritories < avgTerritories * 0.7 || myShips < avgShips * 0.7,
      territoriesControlled: myTerritories,
      averageTerritoriesPerPlayer: avgTerritories,
      totalShips: myShips,
      averageShipsPerPlayer: avgShips,
      resourceAdvantage: myResources > avgResources * 1.2,
    };
  }

  /**
   * Get AI difficulty parameters
   * ENHANCEMENT: Fixed regex pattern and removed excessive randomness
   */
  private static getAIDifficulty(aiPlayer: Player): {
    claimChance: number;
    attackChance: number;
    moveChance: number;
    buildChance: number;
    planningDepth: number;
    aggressiveness: number;
    debugName: string;
  } {
    // Extract difficulty from player ID: AI_{name}_{difficulty}_{timestamp}
    const difficultyMatch = aiPlayer.publicKey.match(/AI_\w+_(novice|pirate|captain|admiral)_\d+/);
    const level = (difficultyMatch?.[1] as 'novice' | 'pirate' | 'captain' | 'admiral') || 'pirate';

    const configs = {
      // Novice: Always acts when action available (100%), defensive
      novice: { 
        claimChance: 1.0, 
        attackChance: 0.4, 
        moveChance: 1.0, 
        buildChance: 0.3, 
        planningDepth: 1,
        aggressiveness: 0.3,
        debugName: '🐣 Novice'
      },
      // Pirate: Always acts (100%), balanced
      pirate: { 
        claimChance: 1.0, 
        attackChance: 0.7, 
        moveChance: 1.0, 
        buildChance: 0.5, 
        planningDepth: 2,
        aggressiveness: 0.6,
        debugName: '⚔️ Pirate'
      },
      // Captain: Always acts, strategic with occasional variation
      captain: { 
        claimChance: 1.0, 
        attackChance: 0.85, 
        moveChance: 1.0, 
        buildChance: 0.7, 
        planningDepth: 3,
        aggressiveness: 0.75,
        debugName: '🏴‍☠️ Captain'
      },
      // Admiral: Uses randomness for unpredictability
      admiral: { 
        claimChance: 0.95, 
        attackChance: 0.9, 
        moveChance: 0.95, 
        buildChance: 0.8, 
        planningDepth: 4,
        aggressiveness: 0.9,
        debugName: '👑 Admiral'
      },
    };

    return configs[level];
  }

  /**
   * Find best territory to claim
   */
  private static findBestTerritoryClaim(gameState: GameState, aiPlayer: Player): GameAction | null {
    const activeShips = aiPlayer.ships.filter(s => s.health > 0);
    
    for (const ship of activeShips) {
      const coord = this.coordinateToString(ship.position);
      const territory = gameState.gameMap.cells[ship.position.x]?.[ship.position.y];
      
      // Check if territory is claimable and valuable
      if (territory && 
          (territory.type === 'treasure' || territory.type === 'port' || territory.type === 'island') &&
          territory.owner !== aiPlayer.publicKey) {
        return {
          id: `ai_action_${Date.now()}`,
          gameId: gameState.gameId,
          player: aiPlayer.publicKey,
          type: 'claim_territory',
          data: { shipId: ship.id, toCoordinate: coord },
          timestamp: Date.now(),
        };
      }
    }
    return null;
  }

  /**
   * Find best attack opportunity
   * ENHANCEMENT: Smarter target selection based on ship health and value
   */
  private static findBestAttack(gameState: GameState, aiPlayer: Player, gameAnalysis: any): GameAction | null {
    const activeShips = aiPlayer.ships.filter(s => s.health > 0);
    let bestAttack: { action: GameAction; score: number } | null = null;
    
    for (const ship of activeShips) {
      // Find enemy ships in range (adjacent cells)
      for (const enemy of gameState.players) {
        if (enemy.publicKey === aiPlayer.publicKey) continue;
        
        for (const enemyShip of enemy.ships.filter(s => s.health > 0)) {
          // Use Manhattan distance for grid-based movement
          const manhattanDist = Math.abs(ship.position.x - enemyShip.position.x) + 
                                Math.abs(ship.position.y - enemyShip.position.y);
          
          if (manhattanDist <= 1) { // Adjacent cells only
            // Score the attack based on multiple factors
            let score = 100;
            
            // Prefer attacking weak ships (easier to destroy)
            score += (100 - enemyShip.health);
            
            // Prefer attacking stronger ship types (bigger threat)
            if (enemyShip.type === 'flagship') score += 50;
            else if (enemyShip.type === 'galleon') score += 30;
            else if (enemyShip.type === 'frigate') score += 20;
            
            // If we're losing, be more aggressive
            if (gameAnalysis.isLosing) score += 25;
            
            const action: GameAction = {
              id: `ai_action_${Date.now()}`,
              gameId: gameState.gameId,
              player: aiPlayer.publicKey,
              type: 'attack',
              data: { shipId: ship.id, targetShipId: enemyShip.id },
              timestamp: Date.now(),
            };
            
            if (!bestAttack || score > bestAttack.score) {
              bestAttack = { action, score };
            }
          }
        }
      }
    }
    
    return bestAttack?.action || null;
  }

  /**
   * Find best move toward objectives
   * ENHANCEMENT: Proper validation, Manhattan distance, and smarter pathfinding
   */
  private static findBestMove(gameState: GameState, aiPlayer: Player, gameAnalysis: any): GameAction | null {
    const activeShips = aiPlayer.ships.filter(s => s.health > 0);
    if (activeShips.length === 0) return null;

    // Select ship strategically (prioritize ships not on valuable tiles)
    let ship = activeShips[0];
    for (const s of activeShips) {
      const currentTile = gameState.gameMap.cells[s.position.x]?.[s.position.y];
      if (currentTile && currentTile.type === 'water') {
        ship = s;
        break; // Prefer ships on water (nothing to claim here)
      }
    }
    if (!ship) return null;
    
    const speed = ship.speed;

    // Find valuable unclaimed territories
    let bestTarget: Coordinate | null = null;
    let bestScore = -Infinity;

    for (let x = 0; x < gameState.gameMap.size; x++) {
      for (let y = 0; y < gameState.gameMap.size; y++) {
        const territory = gameState.gameMap.cells[x]?.[y];
        if (!territory) continue;
        
        // Skip if we already own it
        if (territory.owner === aiPlayer.publicKey) continue;
        
        // Skip if we're already at this position
        if (ship.position.x === x && ship.position.y === y) continue;

        // Use Manhattan distance for grid-based movement
        const manhattanDist = Math.abs(ship.position.x - x) + Math.abs(ship.position.y - y);
        if (manhattanDist > speed) continue;

        // Check if position is navigable
        if (!this.isNavigable(territory.type)) continue;
        
        // Check if position is occupied by another ship
        if (this.isPositionOccupied(gameState, { x, y })) continue;

        let score = 0;
        
        // Score based on territory value
        if (territory.type === 'treasure') score = 100;
        else if (territory.type === 'port') score = 70;
        else if (territory.type === 'island') score = 40;
        else if (territory.type === 'water') score = 15;
        else score = -50; // Avoid hazards (storm, whirlpool, reef)

        // Boost score for unclaimed valuable territories
        if (!territory.owner && territory.type !== 'water') {
          score += 30;
        }
        
        // Prefer closer targets (Manhattan distance penalty)
        score -= manhattanDist * 3;
        
        // If losing, prioritize high-value targets more
        if (gameAnalysis.isLosing && (territory.type === 'treasure' || territory.type === 'port')) {
          score += 25;
        }
        
        // If winning, play safer (avoid hazards more)
        if (gameAnalysis.isWinning && (territory.type === 'storm' || territory.type === 'whirlpool')) {
          score -= 50;
        }

        if (score > bestScore) {
          bestScore = score;
          bestTarget = { x, y };
        }
      }
    }

    if (bestTarget) {
      return {
        id: `ai_action_${Date.now()}`,
        gameId: gameState.gameId,
        player: aiPlayer.publicKey,
        type: 'move_ship',
        data: { shipId: ship.id, toCoordinate: this.coordinateToString(bestTarget) },
        timestamp: Date.now(),
      };
    }

    return null;
  }

  /**
   * Check if a territory type is navigable by ships
   * ENHANCEMENT: Proper movement validation
   */
  private static isNavigable(territoryType: TerritoryCellType): boolean {
    // Ships can move through water and can enter ports, islands, treasure sites
    // But cannot navigate through reefs directly (though could be game rule variant)
    const navigableTypes: TerritoryCellType[] = ['water', 'port', 'island', 'treasure', 'storm', 'whirlpool'];
    return navigableTypes.includes(territoryType);
  }

  /**
   * Check if a position is occupied by any ship
   * ENHANCEMENT: Prevent ships from moving to occupied cells
   */
  private static isPositionOccupied(gameState: GameState, position: Coordinate): boolean {
    for (const player of gameState.players) {
      for (const ship of player.ships) {
        if (ship.health > 0 && 
            ship.position.x === position.x && 
            ship.position.y === position.y) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Find best ship to build
   */
  private static findBestBuild(gameState: GameState, aiPlayer: Player): GameAction | null {
    const activeShips = aiPlayer.ships.filter(s => s.health > 0);
    if (activeShips.length >= GAME_CONFIG.MAX_SHIPS_PER_PLAYER) return null;

    // Determine best ship type based on resources
    const shipTypes: ShipType[] = ['flagship', 'galleon', 'frigate', 'sloop'];
    
    for (const shipType of shipTypes) {
      const costs = this.getShipBuildingCosts(shipType);
      const canAfford = Object.entries(costs).every(([resource, cost]) =>
        aiPlayer.resources[resource as keyof Resources] >= cost
      );

      if (canAfford) {
        // Find valid build location
        for (const territory of aiPlayer.controlledTerritories) {
          const coords = territory.split(',').map(Number);
          const x = coords[0];
          const y = coords[1];
          if (x === undefined || y === undefined) continue;
          
          const port = gameState.gameMap.cells[x]?.[y];
          if (port?.type === 'port') {
            // Find adjacent water
            const adjacent: Coordinate[] = [
              { x: x - 1, y }, { x: x + 1, y },
              { x, y: y - 1 }, { x, y: y + 1 }
            ];
            for (const pos of adjacent) {
              const cell = gameState.gameMap.cells[pos.x]?.[pos.y];
              if (cell?.type === 'water') {
                return {
                  id: `ai_action_${Date.now()}`,
                  gameId: gameState.gameId,
                  player: aiPlayer.publicKey,
                  type: 'build_ship',
                  data: { shipType, toCoordinate: this.coordinateToString(pos) },
                  timestamp: Date.now(),
                };
              }
            }
          }
        }
      }
    }

    return null;
  }

  // ===== PRACTICE MODE =====

  /**
   * Create a practice game (local only, no blockchain)
   */
  static createPracticeGame(humanPlayer: Player, aiDifficulty: 'novice' | 'pirate' | 'captain' | 'admiral' = 'pirate'): GameState {
    const aiPlayer = this.createAIPlayer('practice', aiDifficulty);
    const gameState = this.createNewGame([humanPlayer, aiPlayer], `practice_${Date.now()}`);
    
    // Mark as practice mode
    return {
      ...gameState,
      gameStatus: 'active',
    };
  }

  /**
   * Process AI turn in practice mode
   * ENHANCEMENT: Better error handling and debug logging
   */
  static processAITurn(gameState: GameState): GameState {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer?.publicKey.startsWith('AI_')) {
      return gameState;
    }

    const debugMode = typeof window !== 'undefined' && (window as any).PIR8_DEBUG_AI === true;

    const aiAction = this.generateAIMove(gameState, currentPlayer);
    
    if (aiAction) {
      const result = this.processTurnAction(gameState, aiAction);
      if (result.success) {
        if (debugMode) {
          console.log(`✅ AI action succeeded: ${aiAction.type}`, result.message);
        }
        return this.advanceTurn(result.updatedGameState);
      } else {
        if (debugMode) {
          console.warn(`❌ AI action failed: ${aiAction.type}`, result.message);
        }
        // Try to advance turn anyway to avoid getting stuck
        return this.advanceTurn(gameState);
      }
    }

    // AI passes - just advance turn
    if (debugMode) {
      console.log('⏭️ AI passes turn (no valid actions found)');
    }
    return this.advanceTurn(gameState);
  }
}