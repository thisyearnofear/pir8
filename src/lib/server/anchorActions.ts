'use server';

import { AnchorProvider, BN, Program, Idl } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { SOLANA_CONFIG } from '@/utils/constants';
import { PROGRAM_ID } from '../anchor';
import { getGlobalGamePDA } from '../anchorUtils';

class NodeWallet {
  constructor(readonly payer: Keypair) { }
  get publicKey() { return this.payer.publicKey; }
  async signTransaction(tx: any) { tx.sign(this.payer); return tx; }
  async signAllTransactions(txs: any[]) { txs.forEach(t => t.sign(this.payer)); return txs; }
}

function loadKeypairFromEnv(): Keypair {
  const raw = process.env.PAYER_SECRET_KEY || '';
  if (!raw) throw new Error('PAYER_SECRET_KEY missing');
  const arr = raw.trim().startsWith('[') ? JSON.parse(raw) : raw.split(',').map(n => parseInt(n, 10));
  if (!Array.isArray(arr) || !arr.length) throw new Error('Invalid PAYER_SECRET_KEY');
  return Keypair.fromSecretKey(Uint8Array.from(arr));
}

function loadIdl(): Idl {
  const idlPath = process.env.PIR8_IDL_PATH || path.join(process.cwd(), 'programs/pir8-game/target/idl/pir8_game.json');
  const json = fs.readFileSync(idlPath, 'utf8');
  return JSON.parse(json);
}

export async function getAnchorClient(): Promise<{ program: Program; provider: AnchorProvider }> {
  const rpcUrl = SOLANA_CONFIG.RPC_URL || 'https://api.devnet.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');
  const payer = loadKeypairFromEnv();
  const wallet = new NodeWallet(payer) as any;
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });

  try {
    const idl = loadIdl();
    const programId = new PublicKey(SOLANA_CONFIG.PROGRAM_ID || PROGRAM_ID);
    console.log('[Anchor Client] Loading program:', programId.toString());

    // Anchor 0.29: Program(idl, programId, provider)
    const program = new Program(idl as Idl, programId, provider);
    console.log('[Anchor Client] Program loaded successfully');
    return { program, provider };
  } catch (error) {
    console.error('[Anchor Client] Error loading program:', error);
    throw error;
  }
}

export async function initializeGlobalGame(): Promise<string> {
  const { program, provider } = await getAnchorClient();
  const [gamePDA] = getGlobalGamePDA(program.programId);

  const tx = await program.methods
    .initializeGame()
    .accounts({
      game: gamePDA,
      authority: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log('Global game initialized:', gamePDA.toString());
  return gamePDA.toString();
}

export async function joinGlobalGame(): Promise<void> {
  const { program, provider } = await getAnchorClient();
  const [gamePDA] = getGlobalGamePDA(program.programId);

  // Check if player is already in the game to avoid 500 errors
  try {
    const gameState = await (program.account as any).pirateGame.fetch(gamePDA);
    const playerPubkey = provider.wallet.publicKey.toString();

    const isAlreadyJoined = gameState.players.some(
      (p: any) => p.pubkey.toString() === playerPubkey
    );

    if (isAlreadyJoined) {
      console.log('Player already in global game, skipping transaction');
      return;
    }
  } catch (e) {
    // Game might not exist yet, proceed to try joining (which will fail with specific error if so)
    console.log('Could not fetch game state, proceeding with join...');
  }

  await program.methods
    .joinGame()
    .accounts({
      game: gamePDA,
      player: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log('Joined global game');
}

export async function startGlobalGame(): Promise<void> {
  const { program, provider } = await getAnchorClient();
  const [gamePDA] = getGlobalGamePDA(program.programId);

  await program.methods
    .startGame()
    .accounts({
      game: gamePDA,
      authority: provider.wallet.publicKey,
    })
    .rpc();

  console.log('Game started');
}

export async function resetGlobalGame(): Promise<void> {
  const { program, provider } = await getAnchorClient();
  const [gamePDA] = getGlobalGamePDA(program.programId);

  await program.methods
    .resetGame()
    .accounts({
      game: gamePDA,
      authority: provider.wallet.publicKey,
    })
    .rpc();

  console.log('Game reset');
}

export async function fetchGlobalGameState(): Promise<any> {
  const { program } = await getAnchorClient();
  const [gamePDA] = getGlobalGamePDA(program.programId);

  try {
    // Account name is camelCase in Anchor
    const rawState = await (program.account as any).pirateGame.fetch(gamePDA);

    // Sanitize the data for Client Components
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
// GAMEPLAY INSTRUCTIONS
// ============================================================================

export async function moveShip(
  shipId: string,
  toX: number,
  toY: number,
  decisionTimeMs?: number
): Promise<string> {
  const { program, provider } = await getAnchorClient();
  const [gamePDA] = getGlobalGamePDA(program.programId);

  const tx = await program.methods
    .moveShip(shipId, toX, toY, decisionTimeMs ? new BN(decisionTimeMs) : null)
    .accounts({
      game: gamePDA,
      player: provider.wallet.publicKey,
    })
    .rpc();

  console.log('Ship moved:', tx);
  return tx;
}

export async function attackShip(
  attackerShipId: string,
  targetShipId: string
): Promise<string> {
  const { program, provider } = await getAnchorClient();
  const [gamePDA] = getGlobalGamePDA(program.programId);

  const tx = await program.methods
    .attackShip(attackerShipId, targetShipId)
    .accounts({
      game: gamePDA,
      player: provider.wallet.publicKey,
    })
    .rpc();

  console.log('Ship attacked:', tx);
  return tx;
}

export async function claimTerritory(shipId: string): Promise<string> {
  const { program, provider } = await getAnchorClient();
  const [gamePDA] = getGlobalGamePDA(program.programId);

  const tx = await program.methods
    .claimTerritory(shipId)
    .accounts({
      game: gamePDA,
      player: provider.wallet.publicKey,
    })
    .rpc();

  console.log('Territory claimed:', tx);
  return tx;
}

export async function collectResources(): Promise<string> {
  const { program, provider } = await getAnchorClient();
  const [gamePDA] = getGlobalGamePDA(program.programId);

  const tx = await program.methods
    .collectResources()
    .accounts({
      game: gamePDA,
      player: provider.wallet.publicKey,
    })
    .rpc();

  console.log('Resources collected:', tx);
  return tx;
}

export async function buildShip(
  shipType: 'sloop' | 'frigate' | 'galleon' | 'flagship',
  portX: number,
  portY: number
): Promise<string> {
  const { program, provider } = await getAnchorClient();
  const [gamePDA] = getGlobalGamePDA(program.programId);

  // Convert ship type to Anchor enum format
  const shipTypeEnum = { [shipType]: {} };

  const tx = await program.methods
    .buildShip(shipTypeEnum, portX, portY)
    .accounts({
      game: gamePDA,
      player: provider.wallet.publicKey,
    })
    .rpc();

  console.log('Ship built:', tx);
  return tx;
}

export async function checkAndCompleteGame(): Promise<string> {
  const { program, provider } = await getAnchorClient();
  const [gamePDA] = getGlobalGamePDA(program.programId);

  const tx = await program.methods
    .checkAndCompleteGame()
    .accounts({
      game: gamePDA,
      player: provider.wallet.publicKey,
    })
    .rpc();

  console.log('Victory check completed:', tx);
  return tx;
}
