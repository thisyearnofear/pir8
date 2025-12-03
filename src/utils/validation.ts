import { GameState, Player, Ship, Coordinate } from '../types/game';
import { ERROR_MESSAGES } from './constants';
import { PirateGameEngine } from '../lib/gameLogic';

/**
 * Validation utilities for game logic
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate ship movement
 */
export function validateShipMove(
  gameState: GameState,
  playerId: string,
  shipId: string,
  toCoordinate: string
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
  
  // Find the ship
  const ship = currentPlayer.ships.find(s => s.id === shipId);
  if (!ship) {
    return {
      isValid: false,
      error: 'Ship not found'
    };
  }
  
  // Check if ship is alive
  if (ship.health <= 0) {
    return {
      isValid: false,
      error: 'Ship has been destroyed'
    };
  }
  
  // Check coordinate validity
  try {
    const targetCoord = PirateGameEngine.stringToCoordinate(toCoordinate);
    const distance = PirateGameEngine.calculateDistance(ship.position, targetCoord);
    
    if (distance > ship.speed) {
      return {
        isValid: false,
        error: `Ship can only move ${ship.speed} cells per turn`
      };
    }
  } catch {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_COORDINATE
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
  
  // Check game map
  if (!gameState.gameMap || !gameState.gameMap.cells) {
    return {
      isValid: false,
      error: 'Invalid game map'
    };
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
 * Validate attack action
 */
export function validateAttack(
  gameState: GameState,
  playerId: string,
  attackerShipId: string,
  targetShipId: string
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
  
  // Find attacker ship
  const attackerShip = currentPlayer.ships.find(s => s.id === attackerShipId);
  if (!attackerShip || attackerShip.health <= 0) {
    return {
      isValid: false,
      error: 'Attacker ship not found or destroyed'
    };
  }
  
  // Find target ship
  let targetShip: Ship | undefined;
  for (const player of gameState.players) {
    if (player.publicKey !== playerId) {
      targetShip = player.ships.find(s => s.id === targetShipId);
      if (targetShip) break;
    }
  }
  
  if (!targetShip || targetShip.health <= 0) {
    return {
      isValid: false,
      error: 'Target ship not found or already destroyed'
    };
  }
  
  // Check range
  const distance = PirateGameEngine.calculateDistance(attackerShip.position, targetShip.position);
  if (distance > 1.5) {
    return {
      isValid: false,
      error: 'Target out of attack range'
    };
  }
  
  return { isValid: true };
}
