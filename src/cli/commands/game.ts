import { AnchorProvider, Program } from '@project-serum/anchor';
import { ensureConfig, createGameOnChain, joinGameOnChain } from '../../lib/anchorClient';
import { GAME_CONFIG } from '../../utils/constants';

export interface GameCommandResult {
  success: boolean;
  gameId?: number | string;
  action: 'create' | 'join' | 'status';
  message?: string;
  error?: string;
}

/**
 * Initialize game config if not already done
 */
export async function initConfig(program: Program, provider: AnchorProvider): Promise<GameCommandResult> {
  try {
    await ensureConfig(program, provider);
    return {
      success: true,
      action: 'status',
      message: 'Game config initialized or already exists',
    };
  } catch (err) {
    return {
      success: false,
      action: 'status',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Create a new game on-chain
 */
export async function createGame(program: Program, provider: AnchorProvider): Promise<GameCommandResult> {
  try {
    await ensureConfig(program, provider);
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
    return {
      success: false,
      action: 'join',
      gameId,
      error: err instanceof Error ? err.message : String(err),
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
  // If no gameId or doesn't start with 'onchain_', create new game
  if (!gameId || !gameId.startsWith('onchain_')) {
    return createGame(program, provider);
  }

  // Parse game ID and join
  const gidNum = parseInt(gameId.replace('onchain_', ''), 10);
  if (isNaN(gidNum)) {
    return {
      success: false,
      action: 'join',
      gameId,
      error: 'Invalid game ID format',
    };
  }

  return joinGame(program, provider, gidNum);
}
