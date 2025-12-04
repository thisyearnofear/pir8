import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { createGameOnChain, joinGameOnChain } from '../../lib/server/anchorActions';
import { GAME_CONFIG } from '../../utils/constants';

export interface GameCommandResult {
  success: boolean;
  gameId?: number | string;
  action: 'create' | 'join' | 'status';
  message?: string;
  error?: string;
}

/**
 * Create a new game on-chain
 */
export async function createGame(program: Program, provider: AnchorProvider): Promise<GameCommandResult> {
  try {
    const { gameId } = await createGameOnChain(program, provider);
    return {
      success: true,
      action: 'create',
      gameId,
      message: `Game created with address: ${gameId}`,
    };
  } catch (err) {
    return {
      success: false,
      action: 'create',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Join an existing game on-chain
 */
export async function joinGame(program: Program, provider: AnchorProvider, gameId: string): Promise<GameCommandResult> {
  try {
    await joinGameOnChain(program, provider, gameId);
    return {
      success: true,
      action: 'join',
      gameId,
      message: `Joined game ${gameId}`,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    // If it's a "PlayerNotInGame" error, it likely means the player is already in the game
    // or there's a state inconsistency - treat this as success
    if (errorMessage.includes('PlayerNotInGame')) {
      console.log(`[Join Game] Player already in game ${gameId} or state mismatch, treating as success`);
      return {
        success: true,
        action: 'join',
        gameId,
        message: `Player already in game ${gameId}`,
      };
    }

    return {
      success: false,
      action: 'join',
      gameId,
      error: errorMessage,
    };
  }
}

/**
 * Handle Zcash memo: create new game or join existing
 * Returns onchain_<address> format for consistency with watcher
 */
export async function handleShieldedMemo(
  program: Program,
  provider: AnchorProvider,
  gameId: string | undefined
): Promise<GameCommandResult> {
  // If no gameId, create new game
  if (!gameId) {
    return createGame(program, provider);
  }

  // Parse game address - handle multiple formats
  let gameAddress: string;
  if (gameId.startsWith('onchain_')) {
    gameAddress = gameId.replace('onchain_', '');
  } else if (gameId.startsWith('pirate_')) {
    gameAddress = gameId.replace('pirate_', '');
  } else {
    gameAddress = gameId;
  }

  console.log(`[Memo Handler] Attempting to join game ${gameAddress}`);

  try {
    // Try to join the existing game first
    const result = await joinGame(program, provider, gameAddress);

    if (result.success) {
      console.log(`[Memo Handler] Successfully joined game ${gameAddress}`);
    } else {
      console.log(`[Memo Handler] Failed to join game ${gameAddress}: ${result.error}`);

      // Check if it's a "player already in game" error - this is actually success
      if (result.error && result.error.includes('PlayerNotInGame')) {
        console.log(`[Memo Handler] Player already in game ${gameAddress}, treating as success`);
        return {
          success: true,
          action: 'join',
          gameId: gameAddress,
          message: `Player already in game ${gameAddress}`,
        };
      }

      // For other errors, create new game as fallback
      console.log(`[Memo Handler] Creating new game as fallback`);
      return createGame(program, provider);
    }

    return result;
  } catch (error) {
    console.log(`[Memo Handler] Exception joining game ${gameAddress}:`, error);
    // If join fails (game doesn't exist or other error), create new game
    return createGame(program, provider);
  }
}
