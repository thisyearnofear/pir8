import { 
  Player, 
  GameState, 
  GameMap, 
  TerritoryCell, 
  Ship, 
  ShipType, 
  TerritoryCellType, 
  Resources, 
  Coordinate, 
  GameAction, 
  ActionData,
  SHIP_CONFIGS,
  TERRITORY_RESOURCE_GENERATION,
  COORDINATE_LETTERS, 
  LETTERS_TO_INDEX 
} from '../types/game';

export class PirateGameEngine {
  
  /**
   * Creates a new game map with strategic territory layout
   */
  static createGameMap(size: number = 10): GameMap {
    const cells: TerritoryCell[][] = Array(size).fill(null).map(() => Array(size).fill(null));
    
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const coordinate = this.coordinateToString({ x, y });
        const cellType = this.generateTerritoryType(x, y, size);
        
        cells[x][y] = {
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
   * Generate territory type based on position and strategy
   */
  static generateTerritoryType(x: number, y: number, size: number): TerritoryCellType {
    const centerX = Math.floor(size / 2);
    const centerY = Math.floor(size / 2);
    const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);
    const normalizedDistance = distanceFromCenter / maxDistance;
    
    // Strategic placement based on distance from center
    if (normalizedDistance < 0.2) {
      // Center area - contested valuable territories
      return Math.random() < 0.7 ? 'treasure' : 'port';
    } else if (normalizedDistance < 0.5) {
      // Mid area - islands and ports
      const rand = Math.random();
      if (rand < 0.4) return 'island';
      if (rand < 0.6) return 'port';
      return 'water';
    } else if (normalizedDistance < 0.8) {
      // Outer area - mostly water with some hazards
      const rand = Math.random();
      if (rand < 0.1) return 'storm';
      if (rand < 0.15) return 'reef';
      return 'water';
    } else {
      // Edge area - hazardous waters
      const rand = Math.random();
      if (rand < 0.2) return 'whirlpool';
      if (rand < 0.3) return 'storm';
      return 'water';
    }
  }

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
    const [x, y] = coordinateStr.split(',').map(Number);
    if (isNaN(x) || isNaN(y)) {
      throw new Error('Invalid coordinate format. Expected format: "x,y"');
    }
    return { x, y };
  }

  /**
   * Calculate distance between two coordinates
   */
  static calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
    return Math.sqrt((coord1.x - coord2.x) ** 2 + (coord1.y - coord2.y) ** 2);
  }

  /**
   * Check if coordinates are adjacent (within 1 cell)
   */
  static areAdjacent(coord1: Coordinate, coord2: Coordinate): boolean {
    const distance = this.calculateDistance(coord1, coord2);
    return distance <= 1.5; // Allows diagonal movement
  }

  /**
   * Process a ship movement action
   */
  static processShipMovement(
    ship: Ship,
    toPosition: Coordinate,
    gameMap: GameMap
  ): { success: boolean; message: string; updatedShip?: Ship } {
    const distance = this.calculateDistance(ship.position, toPosition);
    
    if (distance > ship.speed) {
      return { 
        success: false, 
        message: `Ship can only move ${ship.speed} cells per turn. Distance: ${Math.ceil(distance)}` 
      };
    }
    
    const targetCell = gameMap.cells[toPosition.x]?.[toPosition.y];
    if (!targetCell) {
      return { success: false, message: 'Invalid destination' };
    }
    
    // Check for hazards
    if (targetCell.type === 'reef' || targetCell.type === 'whirlpool') {
      const damage = targetCell.type === 'whirlpool' ? 50 : 25;
      const updatedShip = { 
        ...ship, 
        position: toPosition,
        health: Math.max(0, ship.health - damage)
      };
      return { 
        success: true, 
        message: `Ship moved but took ${damage} damage from ${targetCell.type}!`,
        updatedShip 
      };
    }
    
    const updatedShip = { ...ship, position: toPosition };
    return { success: true, message: 'Ship moved successfully', updatedShip };
  }

  /**
   * Create a new ship for a player
   */
  static createShip(
    shipType: ShipType, 
    playerId: string, 
    position: Coordinate
  ): Ship {
    const config = SHIP_CONFIGS[shipType];
    const shipId = `${playerId}_${shipType}_${Date.now()}`;
    
    return {
      id: shipId,
      ...config,
      position,
      resources: { gold: 0, crew: 0, cannons: 0, supplies: 0 },
    };
  }

  /**
   * Create initial starting fleet for a player
   */
  static createStartingFleet(playerId: string, startingPositions: Coordinate[]): Ship[] {
    const fleet: Ship[] = [];
    
    // Each player starts with a sloop and frigate
    if (startingPositions.length >= 2) {
      fleet.push(this.createShip('sloop', playerId, startingPositions[0]));
      fleet.push(this.createShip('frigate', playerId, startingPositions[1]));
    }
    
    return fleet;
  }

  /**
   * Generate starting resources for a new player
   */
  static generateStartingResources(): Resources {
    return {
      gold: 1000,
      crew: 50,
      cannons: 20,
      supplies: 100,
    };
  }

  /**
   * Calculate territory control score for a player
   */
  static calculateTerritoryScore(player: Player, gameMap: GameMap): number {
    let score = 0;
    
    for (const territoryCoord of player.controlledTerritories) {
      const coord = this.stringToCoordinate(territoryCoord);
      const cell = gameMap.cells[coord.x]?.[coord.y];
      
      if (cell?.owner === player.publicKey) {
        switch (cell.type) {
          case 'treasure':
            score += 100;
            break;
          case 'port':
            score += 50;
            break;
          case 'island':
            score += 25;
            break;
          default:
            score += 10;
        }
      }
    }
    
    return score;
  }

  /**
   * Handles player actions (steal, swap, gift, etc.)
   */
  static handlePlayerAction(
    action: string,
    player: Player,
    targetPlayer: Player,
    amount?: number
  ): { updatedPlayer: Player; updatedTargetPlayer: Player; message: string } {
    const updatedPlayer = { ...player };
    const updatedTargetPlayer = { ...targetPlayer };
    let message = '';

    switch (action) {
      case 'steal':
        if (amount && amount <= targetPlayer.totalScore) {
          updatedPlayer.totalScore += amount;
          updatedTargetPlayer.totalScore -= amount;
          message = `Stole ${amount} points from opponent!`;
        } else {
          message = 'Invalid steal amount!';
        }
        break;
      
      case 'swap':
        const tempPoints = updatedPlayer.totalScore;
        updatedPlayer.totalScore = updatedTargetPlayer.totalScore;
        updatedTargetPlayer.totalScore = tempPoints;
        message = 'Scores swapped!';
        break;
      
      case 'gift':
        if (updatedPlayer.totalScore >= 1000) {
          updatedPlayer.totalScore -= 1000;
          updatedTargetPlayer.totalScore += 1000;
          message = 'Gifted 1000 points!';
        } else {
          message = 'Not enough points to gift!';
        }
        break;
      
      case 'kill':
        updatedTargetPlayer.totalScore = 0;
        message = 'Opponent\'s points reset to 0!';
        break;
      
      default:
        message = 'Unknown action';
    }

    return {
      updatedPlayer,
      updatedTargetPlayer,
      message
    };
  }

  /**
   * Generates all possible coordinates for the game
   */
  static generateAllCoordinates(): string[] {
    const coordinates: string[] = [];
    for (let row = 1; row <= 7; row++) {
      for (const letter of COORDINATE_LETTERS) {
        coordinates.push(`${letter}${row}`);
      }
    }
    return coordinates;
  }

  /**
   * Validates if a coordinate is available (not already chosen)
   */
  static isCoordinateAvailable(coordinate: string, chosenCoordinates: string[]): boolean {
    return !chosenCoordinates.includes(coordinate);
  }

  /**
   * Check if game is over based on pirate victory conditions
   */
  static isGameOver(players: Player[], gameMap: GameMap): boolean {
    // Game ends if only one player has ships remaining
    const playersWithShips = players.filter(player => 
      player.ships.some(ship => ship.health > 0)
    );
    
    if (playersWithShips.length <= 1) return true;
    
    // Game ends if one player controls majority of valuable territories
    const valuableTerritories = gameMap.cells.flat().filter(cell => 
      cell.type === 'treasure' || cell.type === 'port'
    );
    const majority = Math.ceil(valuableTerritories.length / 2);
    
    for (const player of players) {
      const controlledValuable = player.controlledTerritories.filter(coord => {
        const cell = valuableTerritories.find(t => t.coordinate === coord);
        return cell?.owner === player.publicKey;
      });
      
      if (controlledValuable.length >= majority) return true;
    }
    
    return false;
  }

  /**
   * Determine winner based on pirate strategy metrics
   */
  static determineWinner(players: Player[], gameMap: GameMap): Player | null {
    const activePlayers = players.filter(player => 
      player.ships.some(ship => ship.health > 0) && player.isActive
    );
    
    if (activePlayers.length === 0) return null;
    if (activePlayers.length === 1) return activePlayers[0];
    
    // Calculate comprehensive score for each player
    return activePlayers.reduce((winner, current) => {
      const winnerScore = this.calculatePlayerScore(winner, gameMap);
      const currentScore = this.calculatePlayerScore(current, gameMap);
      return currentScore > winnerScore ? current : winner;
    });
  }

  /**
   * Calculate comprehensive player score
   */
  static calculatePlayerScore(player: Player, gameMap: GameMap): number {
    let score = 0;
    
    // Resource value
    score += player.resources.gold;
    score += player.resources.crew * 2;
    score += player.resources.cannons * 5;
    score += player.resources.supplies;
    
    // Fleet value
    for (const ship of player.ships) {
      if (ship.health > 0) {
        score += ship.maxHealth;
        score += ship.attack * 5;
      }
    }
    
    // Territory control value
    score += this.calculateTerritoryScore(player, gameMap);
    
    return score;
  }

  /**
   * Generates a random coordinate from available coordinates
   */
  static generateRandomCoordinate(chosenCoordinates: string[]): string {
    const allCoordinates = this.generateAllCoordinates();
    const availableCoordinates = allCoordinates.filter(coord => 
      !chosenCoordinates.includes(coord)
    );
    
    if (availableCoordinates.length === 0) {
      throw new Error('No coordinates available');
    }
    
    const randomIndex = Math.floor(Math.random() * availableCoordinates.length);
    return availableCoordinates[randomIndex];
  }

  /**
   * Validates a coordinate format and availability
   */
  static validateCoordinate(coordinate: string, chosenCoordinates: string[]): {
    isValid: boolean;
    error?: string;
  } {
    try {
      // Check format
      if (!/^[A-G][1-7]$/.test(coordinate)) {
        return { isValid: false, error: 'Invalid coordinate format. Use A1-G7' };
      }
      
      // Check if already chosen
      if (chosenCoordinates.includes(coordinate)) {
        return { isValid: false, error: 'Coordinate already chosen' };
      }
      
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid coordinate' };
    }
  }

  /**
   * Process territory claim
   */
  static processTerritoryClaim(
    playerPublicKey: string,
    coordinate: string,
    gameMap: GameMap
  ): { success: boolean; message: string; updatedMap: GameMap } {
    const coord = this.stringToCoordinate(coordinate);
    const cell = gameMap.cells[coord.x]?.[coord.y];
    
    if (!cell) {
      return { success: false, message: 'Invalid coordinate', updatedMap: gameMap };
    }
    
    if (cell.type === 'water') {
      return { success: false, message: 'Cannot claim water territories', updatedMap: gameMap };
    }
    
    if (cell.owner === playerPublicKey) {
      return { success: false, message: 'You already control this territory', updatedMap: gameMap };
    }
    
    // Create updated map
    const updatedCells = gameMap.cells.map((row, x) =>
      row.map((c, y) => {
        if (x === coord.x && y === coord.y) {
          return { ...c, owner: playerPublicKey };
        }
        return c;
      })
    );
    
    return {
      success: true,
      message: `Territory claimed: ${cell.type}`,
      updatedMap: { ...gameMap, cells: updatedCells }
    };
  }

  /**
   * Process ship-to-ship combat
   */
  static processShipCombat(
    attacker: Ship,
    defender: Ship
  ): { attackerShip: Ship; defenderShip: Ship; message: string; defenderDestroyed: boolean } {
    // Calculate damage: attacker's attack minus defender's defense, minimum 10
    const rawDamage = Math.max(10, attacker.attack - defender.defense);
    
    // Add some randomness (±20%)
    const variance = rawDamage * 0.2;
    const actualDamage = Math.floor(rawDamage + (Math.random() * variance * 2 - variance));
    
    const newDefenderHealth = Math.max(0, defender.health - actualDamage);
    const defenderDestroyed = newDefenderHealth <= 0;
    
    const defenderShip = {
      ...defender,
      health: newDefenderHealth
    };
    
    const message = defenderDestroyed
      ? `${attacker.type} destroyed ${defender.type}!`
      : `${attacker.type} dealt ${actualDamage} damage to ${defender.type} (${newDefenderHealth} HP remaining)`;
    
    return {
      attackerShip: attacker,
      defenderShip,
      message,
      defenderDestroyed
    };
  }
}
