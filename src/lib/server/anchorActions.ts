'use server';

import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { SOLANA_CONFIG } from '@/utils/constants';
import { PROGRAM_ID } from '../anchor';
import { getGlobalGamePDA } from '../anchorUtils';

// ============================================================================
// READ-ONLY BLOCKCHAIN QUERIES (No wallet required)
// ============================================================================

function loadIdl(): Idl {
  const idlPath = process.env.PIR8_IDL_PATH || path.join(process.cwd(), 'programs/pir8-game/target/idl/pir8_game.json');
  try {
    if (fs.existsSync(idlPath)) {
      const json = fs.readFileSync(idlPath, 'utf8');
      return JSON.parse(json);
    }
  } catch (e) {
    console.warn('[Anchor Client] Failed to load IDL from file, using fallback/empty IDL');
  }

  // Fallback: try public/idl
  const publicIdlPath = path.join(process.cwd(), 'public/idl/pir8_game.json');
  try {
    if (fs.existsSync(publicIdlPath)) {
      const json = fs.readFileSync(publicIdlPath, 'utf8');
      return JSON.parse(json);
    }
  } catch (e) {
    console.warn('[Anchor Client] Failed to load IDL from public/idl');
  }

  throw new Error(`IDL not found at ${idlPath} or ${publicIdlPath}`);
}

export async function getAnchorClient(): Promise<{ program: Program; provider: AnchorProvider }> {
  const rpcUrl = SOLANA_CONFIG.RPC_URL || 'https://api.devnet.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');

  // Read-only provider - no wallet needed for queries
  const provider = new AnchorProvider(connection, {} as any, { commitment: 'confirmed' });

  try {
    const idl = loadIdl();
    const programId = SOLANA_CONFIG.PROGRAM_ID ? new PublicKey(SOLANA_CONFIG.PROGRAM_ID) : PROGRAM_ID;
    console.log('[Anchor Client] Loading program for read-only access:', programId.toString());

    const program = new Program(idl as Idl, programId, provider);
    console.log('[Anchor Client] Program loaded successfully (read-only)');
    return { program, provider };
  } catch (error) {
    console.error('[Anchor Client] Error loading program:', error);
    throw error;
  }
}

export async function fetchGlobalGameState(): Promise<any> {
  const { program } = await getAnchorClient();
  const [gamePDA] = getGlobalGamePDA(PROGRAM_ID);

  try {
    const rawState = await (program as any).account.pirateGame.fetch(gamePDA);
    return sanitizeSolanaData(rawState);
  } catch (error) {
    console.log('Game not initialized yet');
    return null;
  }
}

// Helper to convert Solana types to JSON-friendly types
function sanitizeSolanaData(data: any): any {
  if (data === null || data === undefined) return data;

  // Handle PublicKey
  if (data.toBase58 && typeof data.toBase58 === 'function') {
    return data.toBase58();
  }

  // Handle BN (BigNumber)
  if (data.toNumber && typeof data.toNumber === 'function') {
    try {
      return data.toNumber();
    } catch (e) {
      return data.toString(); // Fallback for very large numbers
    }
  }

  // Handle Array
  if (Array.isArray(data)) {
    return data.map(item => sanitizeSolanaData(item));
  }

  // Handle Object
  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      result[key] = sanitizeSolanaData(data[key]);
    }
    return result;
  }

  return data;
}

// ============================================================================
// DEPRECATED: Server-side transactions are anti-pattern in Web3
// These functions should be moved to client-side with user wallet signing
// ============================================================================

// DEPRECATED: Use client-side transaction building instead
export async function initializeGlobalGame(): Promise<string> {
  throw new Error('DEPRECATED: Server should not execute user transactions. Use client-side wallet signing.');
}

// DEPRECATED: Use client-side transaction building instead
export async function joinGlobalGame(): Promise<void> {
  throw new Error('DEPRECATED: Server should not execute user transactions. Use client-side wallet signing.');
}

// DEPRECATED: Use client-side transaction building instead
export async function startGlobalGame(): Promise<void> {
  throw new Error('DEPRECATED: Server should not execute user transactions. Use client-side wallet signing.');
}

// DEPRECATED: Use client-side transaction building instead
export async function moveShip(
  shipId: string,
  toX: number,
  toY: number
): Promise<string> {
  throw new Error('DEPRECATED: Server should not execute user transactions. Use client-side wallet signing.');
}

// DEPRECATED: Use client-side transaction building instead
export async function attackShip(
  attackerShipId: string,
  targetShipId: string
): Promise<string> {
  throw new Error('DEPRECATED: Server should not execute user transactions. Use client-side wallet signing.');
}

// DEPRECATED: Use client-side transaction building instead
export async function claimTerritory(x: number, y: number): Promise<string> {
  throw new Error('DEPRECATED: Server should not execute user transactions. Use client-side wallet signing.');
}

// DEPRECATED: Use client-side transaction building instead
export async function collectResources(x: number, y: number): Promise<string> {
  throw new Error('DEPRECATED: Server should not execute user transactions. Use client-side wallet signing.');
}

// DEPRECATED: Use client-side transaction building instead
export async function buildShip(
  shipType: 'sloop' | 'frigate' | 'galleon' | 'flagship'
): Promise<string> {
  throw new Error('DEPRECATED: Server should not execute user transactions. Use client-side wallet signing.');
}

// ============================================================================
// ZCASH BRIDGE INTEGRATION (Special case - privacy requires server processing)
// ============================================================================

export async function joinGamePrivateViaZcash(params: {
  gameId: string;
  solanaPubkey: string;
  zcashTxHash?: string;
  blockHeight?: number;
}): Promise<string> {
  // NOTE: This is a special case where server processing is required for privacy
  // The Zcash memo contains the user's intent, but server executes to maintain privacy
  console.log('[Zcash Bridge] Privacy-preserving join requested:', {
    gameId: params.gameId,
    player: params.solanaPubkey,
    zcashTx: params.zcashTxHash,
  });

  // TODO: Implement proper Zcash bridge with privacy-preserving server execution
  // This is the ONLY legitimate use case for server-side transactions
  throw new Error('Zcash bridge not yet implemented - requires privacy-preserving server execution');
}