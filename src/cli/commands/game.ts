import { AnchorProvider, Program } from '@coral-xyz/anchor';

export interface GameCommandResult {
  success: boolean;
  gameId?: number | string;
  action: 'create' | 'join' | 'status';
  message?: string;
  error?: string;
}

/**
 * Create a new game on-chain (CLI version)
 * NOTE: CLI commands are deprecated in favor of web interface
 */
export async function createGame(_program: Program, _provider: AnchorProvider): Promise<GameCommandResult> {
  return {
    success: false,
    action: 'create',
    error: 'CLI game creation deprecated - use web interface with connected wallet for proper Web3 architecture'
  };
}

/**
 * Join an existing game on-chain (CLI version)
 * NOTE: CLI commands are deprecated in favor of web interface
 */
export async function joinGame(_program: Program, _provider: AnchorProvider, _gameId: string): Promise<GameCommandResult> {
  return {
    success: false,
    action: 'join',
    error: 'CLI game joining deprecated - use web interface with connected wallet for proper Web3 architecture'
  };
}

/**
 * Handle Zcash memo: create new game or join existing
 * Returns onchain_<address> format for consistency with watcher
 */
export async function handleShieldedMemo(
  _program: Program,
  _provider: AnchorProvider,
  _gameId: string | undefined
): Promise<GameCommandResult> {
  // CLI commands are deprecated - direct users to web interface
  return {
    success: false,
    action: 'status',
    error: 'Zcash memo handling deprecated - use web interface with connected wallet for proper Web3 architecture'
  };
}