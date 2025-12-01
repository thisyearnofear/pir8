// Game Types for Solana Pirates
export type GameItem = number | 'GRINCH' | 'PUDDING' | 'PRESENT' | 'SNOWBALL' | 'MISTLETOE' | 'TREE' | 'ELF' | 'BAUBLE' | 'TURKEY' | 'CRACKER' | 'BANK';

export interface GameGrid {
  grid: GameItem[][];
  chosenCoordinates: string[];
  currentCombination: string;
}

export interface Player {
  publicKey: string;
  points: number;
  bankedPoints: number;
  hasElf: boolean;
  hasBauble: boolean;
  username?: string;
}

export interface GameState {
  gameId: string;
  players: Player[];
  currentPlayerIndex: number;
  grid: GameItem[][];
  chosenCoordinates: string[];
  gameStatus: 'waiting' | 'active' | 'completed';
  winner?: string;
  currentCombination?: string;
  turnTimeRemaining?: number;
  pendingActionType?: string;
}

export interface GameMove {
  gameId: string;
  player: string;
  coordinate: string;
  timestamp: number;
  signature?: string;
}

export interface GameConfig {
  maxPlayers: number;
  entryFee: number; // in SOL
  platformFee: number; // percentage
  turnTimeout: number; // in seconds
  gridSize: number;
}

export const GAME_ITEMS: GameItem[] = [
  200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200,
  200, 200, 200, 200, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 3000, 3000, 5000,
  'GRINCH', 'PUDDING', 'PRESENT', 'SNOWBALL', 'MISTLETOE', 'TREE', 'ELF', 'BAUBLE', 'TURKEY', 'CRACKER', 'BANK'
];

export const COORDINATE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
export const COORDINATE_NUMBERS = ['1', '2', '3', '4', '5', '6', '7'];

export const LETTERS_TO_INDEX: { [key: string]: number } = {
  'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6
};
