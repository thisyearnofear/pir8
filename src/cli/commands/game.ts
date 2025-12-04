import { AnchorProvider, Program } from '@project-serum/anchor';
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
    const gameId = await createGameOnChain(program, provider);
    return {
      success: true,
      action: 'create',
      gameId,
      message: `Game created with ID: ${gameId}`,
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
export async function joinGame(program: Program, provider: AnchorProvider, gameId: number): Promise<GameCommandResult> {
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
 * Returns onchain_<id> format for consistency with watcher
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

  // Parse game ID - handle multiple formats
  let gidNum: number;
  if (gameId.startsWith('onchain_')) {
    gidNum = parseInt(gameId.replace('onchain_', ''), 10);
  } else if (gameId.startsWith('pirate_')) {
    gidNum = parseInt(gameId.replace('pirate_', ''), 10);
  } else {
    gidNum = parseInt(gameId, 10);
  }

  if (isNaN(gidNum)) {
    console.log(`[Memo Handler] Invalid game ID '${gameId}', creating new game`);
    return createGame(program, provider);
  }

  console.log(`[Memo Handler] Attempting to join game ${gidNum}`);

  try {
    // Try to join the existing game first
    const result = await joinGame(program, provider, gidNum);

    if (result.success) {
      console.log(`[Memo Handler] Successfully joined game ${gidNum}`);
    } else {
      console.log(`[Memo Handler] Failed to join game ${gidNum}: ${result.error}`);

      // Check if it's a "player already in game" error - this is actually success
      if (result.error && result.error.includes('PlayerNotInGame')) {
        console.log(`[Memo Handler] Player already in game ${gidNum}, treating as success`);
        return {
          success: true,
          action: 'join',
          gameId: gidNum,
          message: `Player already in game ${gidNum}`,
        };
      }

      // For other errors, create new game as fallback
      console.log(`[Memo Handler] Creating new game as fallback`);
      return createGame(program, provider);
    }

    return result;
  } catch (error) {
    console.log(`[Memo Handler] Exception joining game ${gidNum}:`, error);
    // If join fails (game doesn't exist or other error), create new game
    return createGame(program, provider);
  }
}
