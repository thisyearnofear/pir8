import { AnchorProvider, BN, Program, Idl } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { SOLANA_CONFIG } from '../utils/constants';
import { PROGRAM_ID } from './anchor';
import { getGlobalGamePDA } from './anchorUtils';

class NodeWallet {
  constructor(readonly payer: Keypair) { }
  get publicKey() { return this.payer.publicKey; }
  async signTransaction(tx: Transaction) { tx.sign(this.payer); return tx; }
  async signAllTransactions(txs: Transaction[]) { txs.forEach(t => t.sign(this.payer)); return txs; }
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

export async function getAnchorClient(): Promise<{ program: Program, provider: AnchorProvider }> {
  const rpcUrl = SOLANA_CONFIG.RPC_URL || 'https://api.devnet.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');
  const payer = loadKeypairFromEnv();
  const wallet = new NodeWallet(payer) as any;
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  const idl = loadIdl();
  const programId = new PublicKey(SOLANA_CONFIG.PROGRAM_ID || PROGRAM_ID);

  // Anchor 0.29: Program(idl, programId, provider)
  const program = new Program(idl as Idl, programId, provider);
  return { program, provider };
}

// Initialize the single global game (one-time)
export async function initializeGlobalGame(program: any, provider: AnchorProvider) {
  const authority = provider.wallet.publicKey;
  const [gamePDA] = getGlobalGamePDA(program.programId);

  const tx = await program.methods
    .initializeGame()
    .accounts({
      game: gamePDA,
      authority: authority,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log('Global game initialized, tx:', tx);
  console.log('Game PDA:', gamePDA.toString());

  return gamePDA.toString();
}

// Join the global game
export async function joinGlobalGame(program: any, provider: AnchorProvider) {
  const [gamePDA] = getGlobalGamePDA(program.programId);

  const tx = await program.methods
    .joinGame()
    .accounts({
      game: gamePDA,
      player: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log('Joined global game, tx:', tx);
  return tx;
}

// Start the global game
export async function startGlobalGame(program: any, provider: AnchorProvider) {
  const [gamePDA] = getGlobalGamePDA(program.programId);

  const tx = await program.methods
    .startGame()
    .accounts({
      game: gamePDA,
      authority: provider.wallet.publicKey,
    })
    .rpc();

  console.log('Game started, tx:', tx);
  return tx;
}

// Reset the global game (dev/testing)
export async function resetGlobalGame(program: any, provider: AnchorProvider) {
  const [gamePDA] = getGlobalGamePDA(program.programId);

  const tx = await program.methods
    .resetGame()
    .accounts({
      game: gamePDA,
      authority: provider.wallet.publicKey,
    })
    .rpc();

  console.log('Game reset, tx:', tx);
  return tx;
}

// Fetch global game state
export async function fetchGlobalGame(program: any) {
  const [gamePDA] = getGlobalGamePDA(program.programId);
  // Account name is camelCase in Anchor
  return await (program.account as any).pirateGame.fetch(gamePDA);
}
