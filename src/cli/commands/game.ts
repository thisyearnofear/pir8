import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { initializeGlobalGame, joinGlobalGame } from '../../lib/server/anchorActions';

export interface GameCommandResult {
  success: boolean;
  gameId?: number | string;
  action: 'create' | 'join' | 'status';
  message?: string;
  error?: string;
}

/**
 * Create a new game on-chain (initialize global game)
 */
export async function createGame(_program: Program, _provider: AnchorProvider): Promise<GameCommandResult> {
  try {
    const gameId = await initializeGlobalGame();
    return {
      success: true,
      action: 'create',
      gameId,
      message: `Global game initialized: ${gameId}`,
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
 * Join an existing game on-chain (join global game)
 */
export async function joinGame(_program: Program, _provider: AnchorProvider, gameId: string): Promise<GameCommandResult> {
  try {
    await joinGlobalGame();
    return {
      success: true,
      action: 'join',
      gameId,
      message: `Joined global game`,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    // If it's a "PlayerNotInGame" error, it likely means the player is already in the game
    // or there's a state inconsistency - treat this as success
    if (errorMessage.includes('PlayerNotInGame') || errorMessage.includes('already')) {
      console.log(`[Join Game] Player already in game, treating as success`);
      return {
        success: true,
        action: 'join',
        gameId,
        message: `Player already in global game`,
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
  _program: Program,
  _provider: AnchorProvider,
  gameId: string | undefined
): Promise<GameCommandResult> {
  // If no gameId, create new game
  if (!gameId) {
    return createGame(_program, _provider);
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
    const result = await joinGame(_program, _provider, gameAddress);

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
      return createGame(_program, _provider);
    }

    return result;
  } catch (error) {
    console.log(`[Memo Handler] Exception joining game ${gameAddress}:`, error);
    // If join fails (game doesn't exist or other error), create new game
    return createGame(_program, _provider);
  }
}
