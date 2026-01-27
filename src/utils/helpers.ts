import { COORDINATE_LETTERS, LETTERS_TO_INDEX } from '../types/game';

/**
 * Format wallet address for display
 */
export function formatWalletAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format SOL amounts with proper decimals
 */
export function formatSOL(amount: number, decimals: number = 4): string {
  return `${amount.toFixed(decimals)} SOL`;
}

/**
 * Generate a random coordinate string (A1-G7)
 */
export function generateRandomCoordinate(excludeList: string[] = []): string {
  const allCoords: string[] = [];
  
  for (let row = 1; row <= 7; row++) {
    for (const letter of COORDINATE_LETTERS) {
      const coord = `${letter}${row}`;
      if (!excludeList.includes(coord)) {
        allCoords.push(coord);
      }
    }
  }
  
  if (allCoords.length === 0) {
    throw new Error('No coordinates available');
  }
  
  return allCoords[Math.floor(Math.random() * allCoords.length)]!;
}

/**
 * Validate coordinate format and availability
 */
export function validateCoordinate(
  coordinate: string, 
  takenCoords: string[] = []
): { isValid: boolean; error?: string } {
  // Check format
  if (!/^[A-G][1-7]$/.test(coordinate)) {
    return { 
      isValid: false, 
      error: 'Invalid format. Use A1-G7' 
    };
  }
  
  // Check availability
  if (takenCoords.includes(coordinate)) {
    return { 
      isValid: false, 
      error: 'Coordinate already taken' 
    };
  }
  
  return { isValid: true };
}

/**
 * Convert coordinate string to grid indices
 */
export function coordToIndices(coordinate: string): [number, number] {
  if (coordinate.length < 2) {
    throw new Error('Invalid coordinate format');
  }

  const letter = coordinate[0].toUpperCase();
  const number = coordinate[1];

  const col = LETTERS_TO_INDEX[letter];
  const row = parseInt(number) - 1;

  if (col === undefined || isNaN(row) || row < 0 || row > 6) {
    throw new Error('Invalid coordinate');
  }

  return [row, col];
}

/**
 * Convert grid indices to coordinate string
 */
export function indicesToCoord(row: number, col: number): string {
  if (row < 0 || row > 6 || col < 0 || col > 6) {
    throw new Error('Invalid grid indices');
  }
  
  return `${COORDINATE_LETTERS[col]}${row + 1}`;
}

/**
 * Calculate game progress percentage
 */
export function calculateProgress(chosenCoords: string[], totalCoords: number = 49): number {
  return Math.round((chosenCoords.length / totalCoords) * 100);
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate unique game ID
 */
export function generateGameId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `game_${timestamp}_${random}`;
}

/**
 * Check if coordinate is adjacent to another
 */
export function areAdjacent(coord1: string, coord2: string): boolean {
  const [row1, col1] = coordToIndices(coord1);
  const [row2, col2] = coordToIndices(coord2);
  
  const rowDiff = Math.abs(row1 - row2);
  const colDiff = Math.abs(col1 - col2);
  
  return (rowDiff <= 1 && colDiff <= 1) && !(rowDiff === 0 && colDiff === 0);
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}