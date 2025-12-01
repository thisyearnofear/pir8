import { GameItem, GameGrid, Player, GAME_ITEMS, COORDINATE_LETTERS, LETTERS_TO_INDEX } from '../types/game';

export class PirateGameEngine {
  
  /**
   * Creates a new 7x7 game grid with randomized items
   */
  static createGrid(): GameItem[][] {
    const grid: GameItem[][] = Array(7).fill(null).map(() => Array(7).fill(null));
    const availableItems = [...GAME_ITEMS];
    
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        const randomIndex = Math.floor(Math.random() * availableItems.length);
        grid[row][col] = availableItems[randomIndex];
        availableItems.splice(randomIndex, 1);
      }
    }
    
    return grid;
  }

  /**
   * Converts coordinate string (e.g., "A1") to grid indices [row, col]
   */
  static coordinateToIndices(coordinate: string): [number, number] {
    if (coordinate.length !== 2) {
      throw new Error('Invalid coordinate format. Expected format: A1-G7');
    }
    
    const letter = coordinate[0].toUpperCase();
    const number = coordinate[1];
    
    const col = LETTERS_TO_INDEX[letter];
    const row = parseInt(number) - 1;
    
    if (col === undefined || row < 0 || row > 6) {
      throw new Error('Invalid coordinate. Must be A1-G7');
    }
    
    return [row, col];
  }

  /**
   * Converts grid indices to coordinate string
   */
  static indicesToCoordinate(row: number, col: number): string {
    return `${COORDINATE_LETTERS[col]}${row + 1}`;
  }

  /**
   * Gets the item at a specific coordinate
   */
  static getItemAtCoordinate(grid: GameItem[][], coordinate: string): GameItem {
    const [row, col] = this.coordinateToIndices(coordinate);
    return grid[row][col];
  }

  /**
   * Applies the effect of an item to a player's state
   */
  static applyItemEffect(item: GameItem, player: Player, targetPlayer?: Player): {
    updatedPlayer: Player;
    updatedTargetPlayer?: Player;
    message: string;
    requiresInput?: boolean;
  } {
    const updatedPlayer = { ...player };
    let updatedTargetPlayer = targetPlayer ? { ...targetPlayer } : undefined;
    let message = '';
    let requiresInput = false;

    if (typeof item === 'number') {
      updatedPlayer.points += item;
      message = `Gained ${item} points!`;
    } else {
      switch (item) {
        case 'GRINCH':
          message = 'You can ROB someone\'s points!';
          requiresInput = true;
          break;
        case 'PUDDING':
          message = 'You can KILL someone (reset their points to 0)!';
          requiresInput = true;
          break;
        case 'PRESENT':
          message = 'You can GIFT someone 1000 points!';
          requiresInput = true;
          break;
        case 'SNOWBALL':
          message = 'Wipe out a row\'s scores (multiplayer feature)!';
          break;
        case 'MISTLETOE':
          message = 'You can SWAP scores with someone!';
          requiresInput = true;
          break;
        case 'TREE':
          message = 'You can CHOOSE the next square!';
          requiresInput = true;
          break;
        case 'ELF':
          updatedPlayer.hasElf = true;
          message = 'You can now BLOCK an attack!';
          break;
        case 'BAUBLE':
          updatedPlayer.hasBauble = true;
          message = 'You can now REFLECT an attack!';
          break;
        case 'TURKEY':
          updatedPlayer.points = 0;
          message = 'Oh no! Your points are reset to 0!';
          break;
        case 'CRACKER':
          updatedPlayer.points *= 2;
          message = `Your score is doubled! Now at ${updatedPlayer.points} points!`;
          break;
        case 'BANK':
          updatedPlayer.bankedPoints = updatedPlayer.points;
          updatedPlayer.points = 0;
          message = `Banked ${updatedPlayer.bankedPoints} points! They're now safe!`;
          break;
        default:
          message = 'Unknown item effect';
      }
    }

    return {
      updatedPlayer,
      updatedTargetPlayer,
      message,
      requiresInput
    };
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
        if (amount && amount <= targetPlayer.points) {
          updatedPlayer.points += amount;
          updatedTargetPlayer.points -= amount;
          message = `Stole ${amount} points from opponent!`;
        } else {
          message = 'Invalid steal amount!';
        }
        break;
      
      case 'swap':
        const tempPoints = updatedPlayer.points;
        updatedPlayer.points = updatedTargetPlayer.points;
        updatedTargetPlayer.points = tempPoints;
        message = 'Scores swapped!';
        break;
      
      case 'gift':
        if (updatedPlayer.points >= 1000) {
          updatedPlayer.points -= 1000;
          updatedTargetPlayer.points += 1000;
          message = 'Gifted 1000 points!';
        } else {
          message = 'Not enough points to gift!';
        }
        break;
      
      case 'kill':
        updatedTargetPlayer.points = 0;
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
   * Determines if the game is over (all coordinates chosen or specific win condition met)
   */
  static isGameOver(chosenCoordinates: string[]): boolean {
    return chosenCoordinates.length >= 49; // All squares chosen
  }

  /**
   * Calculates the winner based on total points (including banked points)
   */
  static determineWinner(players: Player[]): Player {
    return players.reduce((winner, current) => {
      const winnerTotal = winner.points + winner.bankedPoints;
      const currentTotal = current.points + current.bankedPoints;
      return currentTotal > winnerTotal ? current : winner;
    });
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
}
