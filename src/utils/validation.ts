import { GameState, Player, GameItem } from '../types/game';
import { ERROR_MESSAGES } from './constants';

/**
 * Validation utilities for game logic
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate player move
 */
export function validateMove(
  gameState: GameState,
  playerId: string,
  coordinate: string
): ValidationResult {
  // Check if game is active
  if (gameState.gameStatus !== 'active') {
    return {
      isValid: false,
      error: ERROR_MESSAGES.GAME_NOT_ACTIVE
    };
  }
  
  // Check if it's player's turn
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (currentPlayer.publicKey !== playerId) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.NOT_YOUR_TURN
    };
  }
  
  // Check coordinate format
  if (!/^[A-G][1-7]$/.test(coordinate)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_COORDINATE
    };
  }
  
  // Check if coordinate is already taken
  if (gameState.chosenCoordinates.includes(coordinate)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.COORDINATE_TAKEN
    };
  }
  
  return { isValid: true };
}

/**
 * Validate player action (steal, swap, etc.)
 */
export function validatePlayerAction(
  action: string,
  sourcePlayer: Player,
  targetPlayer?: Player,
  amount?: number
): ValidationResult {
  switch (action) {
    case 'steal':
      if (!targetPlayer) {
        return {
          isValid: false,
          error: 'Target player required for steal action'
        };
      }
      if (!amount || amount <= 0) {
        return {
          isValid: false,
          error: 'Valid amount required for steal'
        };
      }
      if (amount > targetPlayer.totalScore) {
        return {
          isValid: false,
          error: 'Cannot steal more points than target has'
        };
      }
      break;
      
    case 'swap':
      if (!targetPlayer) {
        return {
          isValid: false,
          error: 'Target player required for swap'
        };
      }
      break;
      
    case 'gift':
      if (!targetPlayer) {
        return {
          isValid: false,
          error: 'Target player required for gift'
        };
      }
      if (sourcePlayer.totalScore < 1000) {
        return {
          isValid: false,
          error: 'Insufficient points to gift'
        };
      }
      break;
      
    case 'kill':
      if (!targetPlayer) {
        return {
          isValid: false,
          error: 'Target player required for kill'
        };
      }
      break;
      
    default:
      return {
        isValid: false,
        error: 'Unknown action'
      };
  }
  
  return { isValid: true };
}

/**
 * Validate game state consistency
 */
export function validateGameState(gameState: GameState): ValidationResult {
  // Check players
  if (!gameState.players || gameState.players.length === 0) {
    return {
      isValid: false,
      error: 'Game must have at least one player'
    };
  }
  
  // Check current player index
  if (gameState.currentPlayerIndex < 0 || 
      gameState.currentPlayerIndex >= gameState.players.length) {
    return {
      isValid: false,
      error: 'Invalid current player index'
    };
  }
  
  // Check grid
  if (!gameState.grid || gameState.grid.length !== 7) {
    return {
      isValid: false,
      error: 'Invalid game grid'
    };
  }
  
  for (const row of gameState.grid) {
    if (row.length !== 7) {
      return {
        isValid: false,
        error: 'Invalid game grid row'
      };
    }
  }
  
  // Check chosen coordinates
  for (const coord of gameState.chosenCoordinates) {
    if (!/^[A-G][1-7]$/.test(coord)) {
      return {
        isValid: false,
        error: `Invalid coordinate in chosen list: ${coord}`
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Validate wallet connection
 */
export function validateWalletConnection(publicKey: string | null): ValidationResult {
  if (!publicKey) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.WALLET_NOT_CONNECTED
    };
  }
  
  return { isValid: true };
}

/**
 * Validate SOL balance for entry fee
 */
export function validateBalance(balance: number, entryFee: number): ValidationResult {
  if (balance < entryFee) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INSUFFICIENT_FUNDS
    };
  }
  
  return { isValid: true };
}

/**
 * Validate game item effect application
 */
export function validateItemEffect(item: GameItem, player: Player): ValidationResult {
  switch (item) {
    case 'CRACKER':
      // Can always double score
      return { isValid: true };
      
    case 'BANK':
      if (player.totalScore <= 0) {
        return {
          isValid: false,
          error: 'No points to bank'
        };
      }
      break;
      
    case 'ELF':
      if (player.hasElf) {
        return {
          isValid: false,
          error: 'Player already has elf protection'
        };
      }
      break;
      
    case 'BAUBLE':
      if (player.hasBauble) {
        return {
          isValid: false,
          error: 'Player already has bauble reflection'
        };
      }
      break;
      
    default:
      if (typeof item === 'number' && item > 0) {
        return { isValid: true };
      }
      break;
  }
  
  return { isValid: true };
}