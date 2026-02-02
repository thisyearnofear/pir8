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
 * AI Decision-Making Types
 * ENHANCEMENT: Add reasoning transparency for educational purposes
 */
export interface AIOption {
  type: 'claim_territory' | 'attack' | 'move_ship' | 'build_ship' | 'pass';
  target?: string;
  shipId?: string;
  score: number;
  reason: string;
  details?: any;
}

export interface AIReasoning {
  optionsConsidered: AIOption[];
  chosenOption: AIOption | null;
  gameAnalysis: {
    isWinning: boolean;
    isLosing: boolean;
    territoriesControlled: number;
    totalShips: number;
    resourceAdvantage: boolean;
  };
  difficulty: {
    level: 'novice' | 'pirate' | 'captain' | 'admiral';
    name: string;
    aggressiveness: number;
  };
  thinkingTime: number; // ms
}

export interface AIDecision {
  action: GameAction | null;
  reasoning: AIReasoning;
}

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
   * ENHANCED: Organic Map Generation using "Seeds" and Clusters
   */
  static createGameMap(size: number = 10): GameMap {
    // 1. Initialize empty water map
    const cells: TerritoryCell[][] = Array(size).fill(null).map(() => []);
    
    // Initialize all cells as water first
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        cells[x]![y] = {
          coordinate: this.coordinateToString({ x, y }),
          type: 'water',
          owner: null,
          resources: {},
          isContested: false,
        };
      }
    }

    // 2. Place Feature Seeds (Organic Generation)
    // We'll place a few "centers" for islands and ports
    const numIslands = Math.floor(size / 3) + 1; // 3-5 islands for 10x10
    const islandCenters: Coordinate[] = [];

    // Helper to find valid spot (away from edges and other centers)
    const findValidSeed = (minDist: number): Coordinate | null => {
      let attempts = 0;
      while (attempts < 20) {
        const x = Math.floor(Math.random() * (size - 4)) + 2; // Keep away from strict edge
        const y = Math.floor(Math.random() * (size - 4)) + 2;
        
        let valid = true;
        for (const center of islandCenters) {
          if (this.calculateDistance({x, y}, center) < minDist) {
            valid = false;
            break;
          }
        }
        if (valid) return {x, y};
        attempts++;
      }
      return null;
    };

    // Place Island Centers
    for (let i = 0; i < numIslands; i++) {
      const seed = findValidSeed(3);
      if (seed) islandCenters.push(seed);
    }

    // 3. Grow Terrain from Seeds
    for (const center of islandCenters) {
      // The center is an island
      cells[center.x]![center.y]!.type = 'island';
      
      // Neighbors might be islands or ports
      const neighbors = [
        {x: center.x+1, y: center.y}, {x: center.x-1, y: center.y},
        {x: center.x, y: center.y+1}, {x: center.x, y: center.y-1},
        {x: center.x+1, y: center.y+1}, {x: center.x-1, y: center.y-1},
        {x: center.x+1, y: center.y-1}, {x: center.x-1, y: center.y+1}
      ];

      for (const n of neighbors) {
        if (n.x >= 0 && n.x < size && n.y >= 0 && n.y < size) {
          const rand = Math.random();
          if (rand < 0.4) {
             cells[n.x]![n.y]!.type = 'island';
          } else if (rand < 0.7) {
             cells[n.x]![n.y]!.type = 'port';
          }
          // Else remains water
        }
      }
    }

    // 4. Place Treasures (Remote locations)
    let treasuresPlaced = 0;
    let attempts = 0;
    while (treasuresPlaced < 3 && attempts < 50) {
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
      
      // Must be water currently
      if (cells[x]![y]!.type === 'water') {
        // Check distance from all island centers (should be somewhat far)
        let minDistanceToLand = 999;
        for (const center of islandCenters) {
          const d = this.calculateDistance({x, y}, center);
          if (d < minDistanceToLand) minDistanceToLand = d;
        }

        if (minDistanceToLand > 2.5) {
           cells[x]![y]!.type = 'treasure';
           treasuresPlaced++;
        }
      }
      attempts++;
    }

    // 5. Place Hazards (Storms, Reefs, Whirlpools)
    const hazardCount = Math.floor(size * size * 0.15); // 15% hazards
    for (let i = 0; i < hazardCount; i++) {
       const x = Math.floor(Math.random() * size);
       const y = Math.floor(Math.random() * size);
       
       if (cells[x]![y]!.type === 'water') {
          const rand = Math.random();
          if (rand < 0.4) cells[x]![y]!.type = 'storm';
          else if (rand < 0.7) cells[x]![y]!.type = 'reef';
          else cells[x]![y]!.type = 'whirlpool';
       }
    }

    // 6. Assign Resources to all cells
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const cell = cells[x]![y]!;
        cell.resources = TERRITORY_RESOURCE_GENERATION[cell.type] || {};
      }
    }

    return { cells, size };
  }

  /**
   * Check for random events when entering a territory
   * ENHANCEMENT: Adds variety to location visits
   */
  static checkLocationEvent(
    territoryType: TerritoryCellType
  ): {
    message: string;
    resourceChange?: Partial<Resources>;
    healthChange?: number;
  } | null {
    const rand = Math.random();

    // Event probabilities
    if (territoryType === 'water' && rand < 0.05) {
      return {
        message: '📦 Found floating supply crate! (+10 Supplies)',
        resourceChange: { supplies: 10 }
      };
    }

    if (territoryType === 'island' && rand < 0.25) {
      if (rand < 0.10) {
        return {
           message: '🗿 Natives offered tribute! (+50 Gold)',
           resourceChange: { gold: 50 }
        };
      } else {
        return {
           message: '🌴 Explored jungle ruins! (+15 Supplies)',
           resourceChange: { supplies: 15 }
        };
      }
    }

    if (territoryType === 'port' && rand < 0.15) {
       return {
          message: '🍻 Local sailors joined your crew! (+5 Crew)',
          resourceChange: { crew: 5 }
       };
    }

    if (territoryType === 'treasure' && rand < 0.40) {
       return {
          message: '💎 Discovered hidden loot! (+100 Gold)',
          resourceChange: { gold: 100 }
       };
    }
    
    // Hazards always have high chance of bad things
    if (territoryType === 'storm') {
        if (rand < 0.6) {
             return {
                 message: '⚡ Storm battered the hull! (-15 HP)',
                 healthChange: -15
             };
        } else {
             return {
                 message: '💨 Strong winds damaged rigging! (-10 Supplies)',
                 resourceChange: { supplies: -10 }
             };
        }
    }

    if (territoryType === 'reef') {
         if (rand < 0.5) {
             return {
                 message: '🪨 Scraped hull on hidden reef! (-20 HP)',
                 healthChange: -20
             };
         }
    }

    if (territoryType === 'whirlpool') {
         if (rand < 0.8) {
             return {
                 message: '🌀 Caught in maelstrom! (-30 HP)',
                 healthChange: -30
             };
         }
    }

    return null;
  }

  /**
   * Create starting fleet for a player
   * ENHANCEMENT: Now creates 2 ships (matching GAME_CONFIG.STARTING_SHIPS)
   * Ships have abilities initialized
   */
  static createStartingFleet(playerId: string, startingPosition: Coordinate): Ship[] {
    const { initializeShipAbility } = require('./shipAbilities');

    // Create starting fleet: 1 sloop (scout) + 1 frigate (combat)
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
        resources: { gold: 0, crew: 0, cannons: 0, supplies: 0, wood: 0, rum: 0 },
        ability: initializeShipAbility('sloop'),
        activeEffects: [],
      },
      {
        id: `${playerId}_frigate_1`,
        type: 'frigate',
        health: 200,
        maxHealth: 200,
        attack: 40,
        defense: 25,
        speed: 2,
        position: { x: startingPosition.x + 1, y: startingPosition.y },
        resources: { gold: 0, crew: 0, cannons: 0, supplies: 0, wood: 0, rum: 0 },
        ability: initializeShipAbility('frigate'),
        activeEffects: [],
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
        startingPositions[index]?.[0] || { x: 0, y: 0 }
      ),
      controlledTerritories: player.controlledTerritories || [],
      totalScore: player.totalScore || 0,
      isActive: true,
      consecutiveAttacks: player.consecutiveAttacks || 0,
      lastActionWasAttack: player.lastActionWasAttack || false,
      scannedCoordinates: player.scannedCoordinates || [],
      scanCharges: player.scanCharges || 3,
      speedBonusAccumulated: player.speedBonusAccumulated || 0,
      averageDecisionTimeMs: player.averageDecisionTimeMs || 0,
      totalMoves: player.totalMoves || 0,
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
    // CRITICAL: Create new position object with new reference for React to detect change
    const moveResult = {
      success: true,
      updatedShip: { ...ship, position: { x: toPosition.x, y: toPosition.y } },
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
    // CRITICAL: Create completely new ship objects with new position references for React
    const updatedPlayers = [...gameState.players];
    if (!currentPlayer) {
      return {
        updatedGameState: gameState,
        success: false,
        message: 'Current player not found'
      };
    }

    // ENHANCEMENT: Check for location events
    let eventMessage = '';
    let healthChange = 0;
    let resourceChange: Partial<Resources> = {};
    
    // Get territory type at new position
    const territory = gameState.gameMap.cells[toPosition.x]?.[toPosition.y];
    if (territory) {
        const event = this.checkLocationEvent(territory.type);
        if (event) {
            eventMessage = ` ${event.message}`;
            healthChange = event.healthChange || 0;
            resourceChange = event.resourceChange || {};
        }
    }

    // Apply updates to ship and player resources
    const updatedShips = currentPlayer.ships.map(s => {
      if (s.id === shipId) {
          const newHealth = Math.max(0, s.health + healthChange);
          return { 
              ...moveResult.updatedShip!, 
              position: { ...moveResult.updatedShip!.position },
              health: newHealth
          };
      }
      return { ...s, position: { ...s.position } };
    });

    const updatedResources = { ...currentPlayer.resources };
    if (resourceChange) {
        for (const [key, val] of Object.entries(resourceChange)) {
            // @ts-ignore
            updatedResources[key] = (updatedResources[key] || 0) + val;
        }
    }

    updatedPlayers[playerIndex] = {
      ...currentPlayer,
      ships: updatedShips,
      resources: updatedResources,
      publicKey: currentPlayer.publicKey,
      // Reset momentum on non-attack actions
      consecutiveAttacks: 0,
      lastActionWasAttack: false,
    };

    // Add event to log
    const moveEvent: GameEvent = {
      id: `event_${Date.now()}`,
      type: 'ship_moved',
      playerId: player,
      turnNumber: gameState.turnNumber,
      timestamp: Date.now(),
      description: `${moveResult.updatedShip!.type} moved to ${toCoordinate}.${eventMessage}`,
      data: { shipId, from: this.coordinateToString(ship.position), to: toCoordinate }
    };

    const updatedGameState = {
      ...gameState,
      players: updatedPlayers,
      eventLog: [...gameState.eventLog, moveEvent].slice(-10),
    };

    return {
      updatedGameState,
      success: true,
      message: moveResult.message + eventMessage
    };
  }

  /**
    * Advance to next player's turn
    * ENHANCEMENT: Tick ability cooldowns, effects, and regenerate scan charges
    */
  static advanceTurn(gameState: GameState): GameState {
    const { tickAbilityCooldown, tickShipEffects } = require('./shipAbilities');

    const MAX_SCAN_CHARGES = 5; // Max scan charges per player

    // ENHANCEMENT: Update all ships' abilities and effects, regenerate scan charges
    const updatedPlayers = gameState.players.map(player => ({
      ...player,
      // Regenerate 1 scan charge per turn (up to max)
      scanCharges: Math.min((player.scanCharges || 0) + 1, MAX_SCAN_CHARGES),
      // Reset momentum when turn changes to new player
      consecutiveAttacks: 0,
      lastActionWasAttack: false,
      ships: player.ships.map(ship => {
        let updated = tickAbilityCooldown(ship);
        updated = tickShipEffects(updated);
        return updated;
      })
    }));

    let nextPlayerIndex = (gameState.currentPlayerIndex + 1) % updatedPlayers.length;
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
      players: updatedPlayers,
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
   * ENHANCEMENT: Proper victory conditions for practice/AI mode
   */
  static checkGameEnd(gameState: GameState): {
    isGameOver: boolean;
    winner: Player | null;
    updatedGameState: GameState;
  } {
    const MAX_TURNS = 35; // Prevent infinite games - target 25-40 turns
    const activePlayers = gameState.players.filter(p =>
      p.isActive && p.ships.some(s => s.health > 0)
    );

    // Victory Condition 1: Only one player left with ships
    if (activePlayers.length === 1) {
      const winner = activePlayers[0] || null;
      const updatedGameState: GameState = {
        ...gameState,
        gameStatus: 'completed' as const,
        winner: winner?.publicKey,
      };
      return { isGameOver: true, winner, updatedGameState };
    }

    // Victory Condition 2: All other players eliminated (no ships)
    if (activePlayers.length === 0) {
      const updatedGameState: GameState = {
        ...gameState,
        gameStatus: 'completed' as const,
        winner: undefined,
      };
      return { isGameOver: true, winner: null, updatedGameState };
    }

    // Victory Condition 3: Max turns reached - determine winner by score
    if (gameState.turnNumber >= MAX_TURNS) {
      const winner = this.determineWinnerByScore(gameState.players, gameState);
      const updatedGameState: GameState = {
        ...gameState,
        gameStatus: 'completed' as const,
        winner: winner?.publicKey,
      };
      return { isGameOver: true, winner, updatedGameState };
    }

    // Victory Condition 4: Dominant victory (75%+ territories)
    const totalTerritories = gameState.players.reduce(
      (sum, p) => sum + p.controlledTerritories.length,
      0
    );

    if (totalTerritories > 0) {
      for (const player of gameState.players) {
        const territoryPercent = player.controlledTerritories.length / totalTerritories;
        if (territoryPercent >= 0.75 && player.ships.some(s => s.health > 0)) {
          const updatedGameState: GameState = {
            ...gameState,
            gameStatus: 'completed' as const,
            winner: player.publicKey,
          };
          return { isGameOver: true, winner: player, updatedGameState };
        }
      }
    }

    return { isGameOver: false, winner: null, updatedGameState: gameState };
  }

  /**
   * Determine winner by scoring multiple factors
   */
  private static determineWinnerByScore(players: Player[], gameState?: GameState): Player | null {
    if (players.length === 0) return null;

    const turnNumber = gameState?.turnNumber || 0;
    const isSuddenDeath = turnNumber >= 40;
    const avgTerritories = players.reduce((sum, p) => sum + p.controlledTerritories.length, 0) / players.length;
    const avgShips = players.reduce((sum, p) => sum + p.ships.filter(s => s.health > 0).length, 0) / players.length;

    const scoredPlayers = players.map(player => {
      const activeShips = player.ships.filter(s => s.health > 0).length;
      const totalShipHealth = player.ships.reduce((sum, s) => sum + s.health, 0);
      const territories = player.controlledTerritories.length;
      const resources = player.resources.gold +
        player.resources.crew * 2 +
        player.resources.cannons * 5;

      // Weighted scoring system
      let score =
        activeShips * 100 +
        totalShipHealth * 2 +
        territories * 150 +
        resources * 0.5 +
        player.totalScore;

      // Catch-up bonus: losing players get compensation
      const territoryGap = avgTerritories - territories;
      const shipGap = avgShips - activeShips;
      if (territoryGap > 0 || shipGap > 0) {
        score += (territoryGap * 50) + (shipGap * 100);
      }

      // Sudden death modifier (turn 40+): weighted toward ships over territories
      if (isSuddenDeath) {
        score = (activeShips * 150) + (totalShipHealth * 3) + (territories * 100) + resources;
      }

      return { player, score };
    });

    // Sort by score descending
    scoredPlayers.sort((a, b) => b.score - a.score);

    return scoredPlayers[0]?.player || null;
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

    // Check if ships are in range
    const maxRange = GameBalance.SHIP_BALANCE[attackerShip.type].range;
    const distance = this.calculateDistance(attackerShip.position, targetShip.position);
    
    // Allow diagonals: Multiplier of 1.5 allows full diagonals at each range step
    // Range 1: 1.5 (covers 1.41)
    // Range 2: 3.0 (covers 2.82)
    // Range 3: 4.5 (covers 4.24)
    if (distance > maxRange * 1.5) {
      return {
        updatedGameState: gameState,
        success: false,
        message: `Target out of range (Max: ${maxRange}, Dist: ${distance.toFixed(1)})`
      };
    }

    // Calculate combat damage with momentum and critical strike
    const isMomentumHit = GameBalance.checkMomentum(currentPlayer.consecutiveAttacks);
    const { damage, isCritical } = GameBalance.calculateCombatDamage(
      attackerShip.type,
      targetShip.type,
      attackerShip.health,
      targetShip.defense,
      gameState.turnNumber,
      isMomentumHit,
      distance
    );

    // Apply damage to target ship
    const newTargetHealth = Math.max(0, targetShip.health - damage);
    const targetDestroyed = newTargetHealth === 0;

    // Update momentum: increment if attacking, reset if not
    const newConsecutiveAttacks = currentPlayer.lastActionWasAttack
      ? currentPlayer.consecutiveAttacks + 1
      : 1;

    // Update game state
    const updatedPlayers = [...gameState.players];
    updatedPlayers[playerIndex] = {
      ...currentPlayer,
      consecutiveAttacks: newConsecutiveAttacks,
      lastActionWasAttack: true,
    };
    updatedPlayers[targetPlayerIndex] = {
      ...targetPlayer,
      publicKey: targetPlayer.publicKey,
      ships: targetPlayer.ships.map(s =>
        s.id === targetShipId
          ? { ...s, health: newTargetHealth }
          : s
      ),
      // Reset target's momentum if they were attacking
      consecutiveAttacks: targetDestroyed ? 0 : targetPlayer.consecutiveAttacks,
    };

    // Build result message
    let message = `⚔️ ${isCritical ? '💥 CRITICAL! ' : ''}${damage} damage!`;
    if (targetDestroyed) message += ' Enemy ship destroyed!';
    if (isMomentumHit) message += ' (Momentum +25%)';

    const updatedGameState = {
      ...gameState,
      players: updatedPlayers,
    };

    return {
      updatedGameState,
      success: true,
      message
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

    // Update the map to mark territory as owned
    const coord = this.stringToCoordinate(toCoordinate);
    const territory = gameState.gameMap.cells[coord.x]?.[coord.y];
    
    if (!territory) {
      return {
        updatedGameState: gameState,
        success: false,
        message: 'Territory not found'
      };
    }
    
    // Check if territory is already owned by this player
    if (territory.owner === player) {
      return {
        updatedGameState: gameState,
        success: false,
        message: 'Territory already owned by you'
      };
    }
    
    // Create updated map with new ownership
    const updatedCells = gameState.gameMap.cells.map((row, x) =>
      row.map((cell, y) => {
        if (x === coord.x && y === coord.y) {
          return { ...cell, owner: player };
        }
        return cell;
      })
    );
    
    const claimResult = {
      success: true,
      message: `Territory ${toCoordinate} claimed!`,
      updatedMap: { ...gameState.gameMap, cells: updatedCells }
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
      publicKey: targetPlayer.publicKey,
      controlledTerritories: [...targetPlayer.controlledTerritories, toCoordinate],
      // Reset momentum on non-attack actions
      consecutiveAttacks: 0,
      lastActionWasAttack: false,
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
   * Resign from the game - for when position is hopeless
   */
  static resign(gameState: GameState, player: string): GameState {
    const playerIndex = gameState.players.findIndex(p => p.publicKey === player);
    if (playerIndex === -1) return gameState;

    const updatedPlayers = [...gameState.players];
    const resigningPlayer = updatedPlayers[playerIndex];
    if (!resigningPlayer) return gameState;

    updatedPlayers[playerIndex] = {
      ...resigningPlayer,
      isActive: false,
    };

    // Check if game should end
    const activePlayers = updatedPlayers.filter(p => p.isActive);

    // If only one player left, they win
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      if (winner) {
        return {
          ...gameState,
          gameStatus: 'completed',
          winner: winner.publicKey,
          players: updatedPlayers,
        };
      }
    }

    return {
      ...gameState,
      players: updatedPlayers,
    };
  }

  /**
   * Check if a player should consider resigning (hopeless position)
   */
  static shouldResign(player: Player, gameState: GameState): boolean {
    const activePlayers = gameState.players.filter(p => p.isActive && p.ships.some(s => s.health > 0));
    if (activePlayers.length < 2) return false;

    const playerShips = player.ships.filter(s => s.health > 0).length;
    const avgShips = activePlayers.reduce((sum, p) => sum + p.ships.filter(s => s.health > 0).length, 0) / activePlayers.length;
    const playerTerritories = player.controlledTerritories.length;
    const avgTerritories = activePlayers.reduce((sum, p) => sum + p.controlledTerritories.length, 0) / activePlayers.length;

    // Resign if: less than 25% of average ships AND less than 25% of average territories
    return playerShips < avgShips * 0.25 && playerTerritories < avgTerritories * 0.25;
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

    // Comeback bonus: losing players get extra resources
    const gameAnalysis = this.analyzeGameState(gameState, currentPlayer);
    const comebackBonus = GameBalance.calculateComebackBonus(
      gameAnalysis.territoriesControlled,
      gameAnalysis.averageTerritoriesPerPlayer,
      gameAnalysis.totalShips,
      gameAnalysis.averageShipsPerPlayer
    );

    // Apply comeback bonus to gold
    if (comebackBonus > 0) {
      collectedResources.gold = (collectedResources.gold || 0) + comebackBonus;
    }

    // Update player resources (no port healing - combat is permanent)
    const updatedPlayers = [...gameState.players];
    updatedPlayers[playerIndex] = {
      ...currentPlayer,
      publicKey: currentPlayer.publicKey,
      ships: currentPlayer.ships,
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

    const comebackMessage = comebackBonus > 0 ? ` (+${comebackBonus} comeback bonus)` : '';

    return {
      updatedGameState: { ...gameState, players: updatedPlayers },
      success: true,
      message: `Collected: ${resourcesList}${comebackMessage}`
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
    const { initializeShipAbility } = require('./shipAbilities');
    const newShip = {
      id: `${player}_${shipType}_${Date.now()}`,
      type: shipType as ShipType,
      health: 100,
      maxHealth: 100,
      attack: 25,
      defense: 10,
      speed: 2,
      position: buildCoord,
      resources: { gold: 0, crew: 0, cannons: 0, supplies: 0, wood: 0, rum: 0 },
      ability: initializeShipAbility(shipType as ShipType),
      activeEffects: [],
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
      consecutiveAttacks: 0,
      lastActionWasAttack: false,
    };
  }

  /**
   * Generate AI decision for current turn with reasoning transparency
   * ENHANCEMENT: Returns structured reasoning for educational purposes
   */
  static generateAIMove(gameState: GameState, aiPlayer: Player): GameAction | null {
    const decision = this.generateAIDecision(gameState, aiPlayer);
    return decision.action;
  }

  /**
   * Generate AI decision WITH reasoning (new method for transparency)
   * ENHANCEMENT: Educational AI that shows its thought process
   */
  static generateAIDecision(gameState: GameState, aiPlayer: Player): AIDecision {
    const startTime = Date.now();
    const difficulty = this.getAIDifficulty(aiPlayer);
    const debugMode = typeof window !== 'undefined' && (window as any).PIR8_DEBUG_AI === true;

    if (debugMode) {
      console.log(`🤖 AI Turn: ${difficulty.debugName} evaluating options...`);
    }

    // Evaluate game state for strategic decisions
    const gameAnalysis = this.analyzeGameState(gameState, aiPlayer);

    // Collect all options with scores and reasoning
    const optionsConsidered: AIOption[] = [];

    // Priority 1: Evaluate claiming territories
    const claimResult = this.evaluateTerritoryClaim(gameState, aiPlayer);
    if (claimResult) {
      optionsConsidered.push(claimResult);
    }

    // Priority 2: Evaluate attacks
    const attackResult = this.evaluateAttack(gameState, aiPlayer, gameAnalysis);
    if (attackResult) {
      optionsConsidered.push(attackResult);
    }

    // Priority 3: Evaluate movements
    const moveResult = this.evaluateMove(gameState, aiPlayer, gameAnalysis);
    if (moveResult) {
      optionsConsidered.push(moveResult);
    }

    // Priority 4: Evaluate building
    const buildResult = this.evaluateBuild(gameState, aiPlayer, gameAnalysis);
    if (buildResult) {
      optionsConsidered.push(buildResult);
    }

    // Choose best option based on score and difficulty-adjusted randomness
    let chosenOption: AIOption | null = null;
    let chosenAction: GameAction | null = null;

    if (optionsConsidered.length > 0) {
      // Sort by score
      optionsConsidered.sort((a, b) => b.score - a.score);

      // Apply difficulty-based selection
      for (const option of optionsConsidered) {
        const selectionChance = this.getSelectionChance(option.type, difficulty, gameAnalysis);
        if (Math.random() < selectionChance) {
          chosenOption = option;
          chosenAction = this.optionToAction(option, gameState, aiPlayer);
          break;
        }
      }

      // Fallback to best option if nothing selected
      if (!chosenOption && optionsConsidered.length > 0) {
        chosenOption = optionsConsidered[0] || null;
        if (chosenOption) {
          chosenAction = this.optionToAction(chosenOption, gameState, aiPlayer);
        }
      }
    }

    if (debugMode && chosenOption) {
      console.log(`  ✅ AI Decision: ${chosenOption.type} (score: ${chosenOption.score})`);
    } else if (debugMode) {
      console.log('  ⏭️ AI Decision: Pass (no valid actions)');
    }

    // Build reasoning object
    const difficultyName = difficulty.debugName || 'Pirate';
    const reasoning: AIReasoning = {
      optionsConsidered,
      chosenOption,
      gameAnalysis,
      difficulty: {
        level: difficultyName.includes('Novice') ? 'novice' :
          difficultyName.includes('Admiral') ? 'admiral' :
            difficultyName.includes('Captain') ? 'captain' : 'pirate',
        name: difficultyName,
        aggressiveness: difficulty.aggressiveness,
      },
      thinkingTime: Date.now() - startTime,
    };

    return {
      action: chosenAction,
      reasoning,
    };
  }

  /**
   * Get selection chance based on option type and difficulty
   */
  private static getSelectionChance(
    optionType: string,
    difficulty: any,
    gameAnalysis: any
  ): number {
    switch (optionType) {
      case 'claim_territory':
        return difficulty.claimChance;
      case 'attack':
        return gameAnalysis.isLosing ? difficulty.attackChance * 1.2 : difficulty.attackChance;
      case 'move_ship':
        return difficulty.moveChance;
      case 'build_ship':
        return gameAnalysis.isWinning ? difficulty.buildChance * 0.8 : difficulty.buildChance;
      default:
        return 0.5;
    }
  }

  /**
   * Convert AIOption to GameAction
   */
  private static optionToAction(option: AIOption, gameState: GameState, aiPlayer: Player): GameAction {
    return {
      id: `ai_action_${Date.now()}`,
      gameId: gameState.gameId,
      player: aiPlayer.publicKey,
      type: option.type as any,
      data: option.details || {},
      timestamp: Date.now(),
    };
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
   * Evaluate territory claiming option with reasoning
   * ENHANCEMENT: Returns scored option for transparency
   */
  private static evaluateTerritoryClaim(gameState: GameState, aiPlayer: Player): AIOption | null {
    const result = this.findBestTerritoryClaim(gameState, aiPlayer);
    if (!result) return null;

    // Extract details from the action
    const { shipId, toCoordinate } = result.data;
    if (!toCoordinate) return null;

    const ship = aiPlayer.ships.find(s => s.id === shipId);
    if (!ship) return null;

    const coord = this.stringToCoordinate(toCoordinate);
    const territory = gameState.gameMap.cells[coord.x]?.[coord.y];

    let score = 70;
    let reason = 'Claiming territory';

    if (territory) {
      if (territory.type === 'treasure') {
        score = 100;
        reason = 'High-value treasure - must claim!';
      } else if (territory.type === 'port') {
        score = 90;
        reason = 'Strategic port for ship building';
      } else if (territory.type === 'island') {
        score = 75;
        reason = 'Island provides resources';
      }
    }

    return {
      type: 'claim_territory',
      target: toCoordinate,
      shipId,
      score,
      reason,
      details: result.data,
    };
  }

  /**
   * Find best territory to claim (original method)
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
   * Evaluate attack option with reasoning
   * ENHANCEMENT: Returns scored option for transparency
   */
  private static evaluateAttack(gameState: GameState, aiPlayer: Player, gameAnalysis: any): AIOption | null {
    const result = this.findBestAttackWithScore(gameState, aiPlayer, gameAnalysis);
    if (!result) return null;

    return {
      type: 'attack',
      target: result.targetShipId,
      shipId: result.shipId,
      score: result.score,
      reason: result.reason,
      details: { shipId: result.shipId, targetShipId: result.targetShipId },
    };
  }

  /**
   * Find best attack with score and reasoning
   */
  private static findBestAttackWithScore(gameState: GameState, aiPlayer: Player, gameAnalysis: any): { shipId: string; targetShipId: string; score: number; reason: string } | null {
    const activeShips = aiPlayer.ships.filter(s => s.health > 0);
    let bestAttack: { shipId: string; targetShipId: string; score: number; reason: string } | null = null;

    const isLateGame = gameState.turnNumber > 25;

    for (const ship of activeShips) {
      for (const enemy of gameState.players) {
        if (enemy.publicKey === aiPlayer.publicKey) continue;

        for (const enemyShip of enemy.ships.filter(s => s.health > 0)) {
          const manhattanDist = Math.abs(ship.position.x - enemyShip.position.x) +
            Math.abs(ship.position.y - enemyShip.position.y);

          if (manhattanDist <= 1) {
            let score = 100;
            let reason = 'Enemy in range';

            // Prefer attacking weak ships
            score += (100 - enemyShip.health);
            if (enemyShip.health < 30) {
              reason = 'Finish off weakened enemy';
            }

            // Prefer attacking stronger ship types
            if (enemyShip.type === 'flagship') {
              score += 50;
              reason = 'Eliminate flagship threat';
            } else if (enemyShip.type === 'galleon') {
              score += 30;
              reason = 'Take down galleon';
            } else if (enemyShip.type === 'frigate') {
              score += 20;
            }

            // If losing, be more aggressive
            if (gameAnalysis.isLosing) {
              score += 25;
              reason = 'Aggressive strike - must turn tide';
            }

            // Late game: prioritize combat over expansion
            if (isLateGame) {
              score *= 1.5;
              reason += ' (late game)';
            }

            if (!bestAttack || score > bestAttack.score) {
              bestAttack = {
                shipId: ship.id,
                targetShipId: enemyShip.id,
                score,
                reason
              };
            }
          }
        }
      }
    }

    return bestAttack;
  }


  /**
   * Evaluate movement option with reasoning
   * ENHANCEMENT: Returns scored option for transparency
   */
  private static evaluateMove(gameState: GameState, aiPlayer: Player, gameAnalysis: any): AIOption | null {
    const result = this.findBestMoveWithScore(gameState, aiPlayer, gameAnalysis);
    if (!result) return null;

    return {
      type: 'move_ship',
      target: result.toCoordinate,
      shipId: result.shipId,
      score: result.score,
      reason: result.reason,
      details: { shipId: result.shipId, toCoordinate: result.toCoordinate },
    };
  }

  /**
   * Find best move with score and reasoning
   */
  private static findBestMoveWithScore(gameState: GameState, aiPlayer: Player, gameAnalysis: any): { shipId: string; toCoordinate: string; score: number; reason: string } | null {
    const activeShips = aiPlayer.ships.filter(s => s.health > 0);
    if (activeShips.length === 0) return null;

    let ship = activeShips[0];
    for (const s of activeShips) {
      const currentTile = gameState.gameMap.cells[s.position.x]?.[s.position.y];
      if (currentTile && currentTile.type === 'water') {
        ship = s;
        break;
      }
    }
    if (!ship) return null;

    const speed = ship.speed;
    let bestTarget: { x: number; y: number } | null = null;
    let bestScore = -Infinity;
    let bestReason = '';

    for (let x = 0; x < gameState.gameMap.size; x++) {
      for (let y = 0; y < gameState.gameMap.size; y++) {
        const territory = gameState.gameMap.cells[x]?.[y];
        if (!territory) continue;
        if (territory.owner === aiPlayer.publicKey) continue;
        if (ship.position.x === x && ship.position.y === y) continue;

        const manhattanDist = Math.abs(ship.position.x - x) + Math.abs(ship.position.y - y);
        if (manhattanDist > speed) continue;
        if (!this.isNavigable(territory.type)) continue;
        if (this.isPositionOccupied(gameState, { x, y })) continue;

        let score = 0;
        let reason = '';

        if (territory.type === 'treasure') {
          score = 100;
          reason = 'Move toward treasure';
        } else if (territory.type === 'port') {
          score = 70;
          reason = 'Advance to strategic port';
        } else if (territory.type === 'island') {
          score = 40;
          reason = 'Head to resource island';
        } else if (territory.type === 'water') {
          score = 15;
          reason = 'Navigate toward objective';
        } else {
          score = -50;
          reason = 'Avoid hazard';
        }

        if (!territory.owner && territory.type !== 'water') {
          score += 30;
          reason = 'Claim unclaimed territory';
        }

        score -= manhattanDist * 3;

        if (gameAnalysis.isLosing && (territory.type === 'treasure' || territory.type === 'port')) {
          score += 25;
          reason = 'Desperate push for valuable tile';
        }

        if (gameAnalysis.isWinning && (territory.type === 'storm' || territory.type === 'whirlpool')) {
          score -= 50;
        }

        if (score > bestScore) {
          bestScore = score;
          bestTarget = { x, y };
          bestReason = reason;
        }
      }
    }

    if (bestTarget) {
      return {
        shipId: ship.id,
        toCoordinate: this.coordinateToString(bestTarget),
        score: bestScore,
        reason: bestReason,
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
   * Evaluate ship building option with reasoning
   * ENHANCEMENT: Returns scored option for transparency
   */
  private static evaluateBuild(gameState: GameState, aiPlayer: Player, _gameAnalysis: any): AIOption | null {
    const result = this.findBestBuildWithScore(gameState, aiPlayer);
    if (!result) return null;

    return {
      type: 'build_ship',
      target: result.toCoordinate,
      score: result.score,
      reason: result.reason,
      details: { shipType: result.shipType, toCoordinate: result.toCoordinate },
    };
  }

  /**
   * Find best ship to build with score and reasoning
   */
  private static findBestBuildWithScore(gameState: GameState, aiPlayer: Player): { shipType: ShipType; toCoordinate: string; score: number; reason: string } | null {
    const activeShips = aiPlayer.ships.filter(s => s.health > 0);
    if (activeShips.length >= GAME_CONFIG.MAX_SHIPS_PER_PLAYER) return null;

    const shipTypes: ShipType[] = ['flagship', 'galleon', 'frigate', 'sloop'];

    for (const shipType of shipTypes) {
      const costs = this.getShipBuildingCosts(shipType);
      const canAfford = Object.entries(costs).every(([resource, cost]) =>
        aiPlayer.resources[resource as keyof Resources] >= cost
      );

      if (canAfford) {
        for (const territory of aiPlayer.controlledTerritories) {
          const coords = territory.split(',').map(Number);
          const x = coords[0];
          const y = coords[1];
          if (x === undefined || y === undefined) continue;

          const port = gameState.gameMap.cells[x]?.[y];
          if (port?.type === 'port') {
            const adjacent: Coordinate[] = [
              { x: x - 1, y }, { x: x + 1, y },
              { x, y: y - 1 }, { x, y: y + 1 }
            ];
            for (const pos of adjacent) {
              const cell = gameState.gameMap.cells[pos.x]?.[pos.y];
              if (cell?.type === 'water') {
                let score = 60;
                let reason = `Build ${shipType}`;

                if (shipType === 'flagship') {
                  score = 90;
                  reason = 'Build powerful flagship';
                } else if (shipType === 'galleon') {
                  score = 80;
                  reason = 'Build strong galleon';
                } else if (shipType === 'frigate') {
                  score = 70;
                  reason = 'Build versatile frigate';
                } else {
                  score = 60;
                  reason = 'Build fast sloop';
                }

                return {
                  shipType,
                  toCoordinate: this.coordinateToString(pos),
                  score,
                  reason,
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