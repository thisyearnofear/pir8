'use server';

import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { SOLANA_CONFIG } from '@/utils/constants';
import { PROGRAM_ID } from '../anchor';
import { getGamePDA } from '../anchorUtils';

// ============================================================================
// READ-ONLY BLOCKCHAIN QUERIES (No wallet required)
// ============================================================================

function loadIdl(): Idl {
  // Try custom path from env first
  if (process.env.PIR8_IDL_PATH) {
    try {
      if (fs.existsSync(process.env.PIR8_IDL_PATH)) {
        const json = fs.readFileSync(process.env.PIR8_IDL_PATH, 'utf8');
        return JSON.parse(json);
      }
    } catch (e) {
      console.warn('[Anchor Client] Failed to load IDL from PIR8_IDL_PATH');
    }
  }

  // Try public/idl (production path) first
  const publicIdlPath = path.join(process.cwd(), 'public/idl/pir8_game.json');
  try {
    if (fs.existsSync(publicIdlPath)) {
      const json = fs.readFileSync(publicIdlPath, 'utf8');
      return JSON.parse(json);
    }
  } catch (e) {
    console.warn('[Anchor Client] Failed to load IDL from public/idl');
  }

  // Fallback: try target/idl (development path)
  const devIdlPath = path.join(process.cwd(), 'target/idl/pir8_game.json');
  try {
    if (fs.existsSync(devIdlPath)) {
      const json = fs.readFileSync(devIdlPath, 'utf8');
      return JSON.parse(json);
    }
  } catch (e) {
    console.warn('[Anchor Client] Failed to load IDL from target/idl');
  }

  throw new Error(`IDL not found at ${publicIdlPath} or ${devIdlPath}`);
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

export async function fetchGlobalGameState(gameId: number = 0): Promise<any> {
  console.log(`[Anchor Client] Fetching game state for gameId: ${gameId}`);
  try {
    const { program } = await getAnchorClient();
    const programId = program.programId;
    const [gamePDA] = getGamePDA(gameId, programId);
    console.log(`[Anchor Client] Derived gamePDA: ${gamePDA.toBase58()} for gameId: ${gameId}`);

    try {
      const rawState = await (program as any).account.pirateGame.fetch(gamePDA);
      console.log(`[Anchor Client] Successfully fetched state for game ${gameId}`);
      return sanitizeSolanaData(rawState);
    } catch (error: any) {
      if (error.message && (error.message.includes('Account does not exist') || error.message.includes('could not find account'))) {
        console.log(`[Anchor Client] Game ${gameId} account not found (PDA: ${gamePDA.toBase58()})`);
        return null;
      }
      console.error(`[Anchor Client] Error fetching game state for ${gameId} (PDA: ${gamePDA.toBase58()}):`, error);
      throw error;
    }
  } catch (outerError: any) {
    console.error(`[Anchor Client] Critical error in fetchGlobalGameState for ${gameId}:`, outerError);
    throw outerError;
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
  _shipId: string,
  _toX: number,
  _toY: number
): Promise<string> {
  throw new Error('DEPRECATED: Server should not execute user transactions. Use client-side wallet signing.');
}

// DEPRECATED: Use client-side transaction building instead
export async function attackShip(
  _attackerShipId: string,
  _targetShipId: string
): Promise<string> {
  throw new Error('DEPRECATED: Server should not execute user transactions. Use client-side wallet signing.');
}

// DEPRECATED: Use client-side transaction building instead
export async function claimTerritory(_x: number, _y: number): Promise<string> {
  throw new Error('DEPRECATED: Server should not execute user transactions. Use client-side wallet signing.');
}

// DEPRECATED: Use client-side transaction building instead
export async function collectResources(_x: number, _y: number): Promise<string> {
  throw new Error('DEPRECATED: Server should not execute user transactions. Use client-side wallet signing.');
}

// DEPRECATED: Use client-side transaction building instead
export async function buildShip(
  _shipType: 'sloop' | 'frigate' | 'galleon' | 'flagship'
): Promise<string> {
  throw new Error('DEPRECATED: Server should not execute user transactions. Use client-side wallet signing.');
}

