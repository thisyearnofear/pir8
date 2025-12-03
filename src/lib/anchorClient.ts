import { AnchorProvider, BN, Program, Idl } from '@project-serum/anchor';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { GAME_CONFIG, SOLANA_CONFIG } from '../utils/constants';
import { PROGRAM_ID, getConfigPDA, getGamePDA } from './anchor';

class NodeWallet {
  constructor(readonly payer: Keypair) {}
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
  const idlPath = process.env.PIR8_IDL_PATH || path.join(process.cwd(), 'contracts/pir8-game/target/idl/pir8_game.json');
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
  const program = new (Program as any)(idl, programId, provider) as Program;
  return { program, provider };
}

export async function ensureConfig(program: any, provider: AnchorProvider) {
  const [configPDA] = getConfigPDA();
  try {
    await program.account.gameConfig.fetch(configPDA);
  } catch {
    const entryLamports = new BN(Math.floor(GAME_CONFIG.ENTRY_FEE * 1e9));
    const treasury = new PublicKey(SOLANA_CONFIG.TREASURY_ADDRESS || provider.wallet.publicKey);
    await program.methods
      .initializeConfig(entryLamports, Math.floor(GAME_CONFIG.PLATFORM_FEE * 100), GAME_CONFIG.MAX_PLAYERS)
      .accounts({
        config: configPDA,
        authority: provider.wallet.publicKey,
        treasury,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }
}

export async function createGameOnChain(program: any, provider: AnchorProvider) {
  const [configPDA] = getConfigPDA();
  const configAccount = await program.account.gameConfig.fetch(configPDA);
  const gameId = configAccount.totalGames.toNumber();
  const [gamePDA] = getGamePDA(gameId);
  const entryLamports = new BN(Math.floor(GAME_CONFIG.ENTRY_FEE * 1e9));
  
  // Use a dummy randomness account (program will use timestamp-based seed as fallback)
  const dummyRandomness = new PublicKey('7PmpDAJe7mZj8BEZEYDd1jkDEEW4WZXzMjHCdU4PrzrL');
  
  await program.methods
    .createGame(entryLamports, GAME_CONFIG.MAX_PLAYERS)
    .accounts({
      game: gamePDA,
      config: configPDA,
      creator: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
      randomnessAccountData: dummyRandomness,
    })
    .rpc();
  return gameId;
}

export async function joinGameOnChain(program: any, provider: AnchorProvider, gameId: number) {
  const [gamePDA] = getGamePDA(gameId);
  const [configPDA] = getConfigPDA();
  const configAccount = await program.account.gameConfig.fetch(configPDA);
  await program.methods
    .joinGame()
    .accounts({
      game: gamePDA,
      config: configPDA,
      player: provider.wallet.publicKey,
      treasury: configAccount.treasury,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function scanCoordinateOnChain(
  program: any,
  provider: AnchorProvider,
  gameId: number,
  coordinateX: number,
  coordinateY: number
) {
  const [gamePDA] = getGamePDA(gameId);
  await program.methods
    .scanCoordinate(coordinateX, coordinateY)
    .accounts({
      game: gamePDA,
      player: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function makeMoveTimed(
  program: any,
  provider: AnchorProvider,
  gameId: number,
  shipId: number,
  targetX: number,
  targetY: number,
  decisionTimeMs: number
) {
  const [gamePDA] = getGamePDA(gameId);
  const decisionTimeSecs = Math.floor(decisionTimeMs / 1000);
  
  await program.methods
    .makeMoveTimed(shipId, targetX, targetY, decisionTimeSecs)
    .accounts({
      game: gamePDA,
      player: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

/**
 * Handle private tournament entry via Zcash memo
 * Wired from LightwalletdWatcher → ZcashMemoBridge → this function
 * DRY: Single source of truth for memo-triggered join_game transaction
 */
export async function joinGamePrivateViaZcash(
  program: any,
  provider: AnchorProvider,
  memoPayload: {
    gameId: string;
    solanaPubkey: string;
    zcashTxHash?: string;
    blockHeight?: number;
  }
) {
  try {
    // Convert gameId string to number
    const gameIdNum = parseInt(memoPayload.gameId, 10);
    if (isNaN(gameIdNum)) {
      throw new Error(`Invalid game ID from memo: ${memoPayload.gameId}`);
    }

    // Construct accounts using PDAs
    const [gamePDA] = getGamePDA(gameIdNum);
    const [configPDA] = getConfigPDA();
    const configAccount = await program.account.gameConfig.fetch(configPDA);

    // Execute join_game instruction with player derived from memo
    const playerPubkey = new PublicKey(memoPayload.solanaPubkey);
    
    const tx = await program.methods
      .joinGame()
      .accounts({
        game: gamePDA,
        config: configPDA,
        player: playerPubkey,
        treasury: configAccount.treasury,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log(`[Zcash Bridge] Player ${memoPayload.solanaPubkey} joined game ${gameIdNum} via Zcash memo`);
    console.log(`[Zcash Bridge] Zcash TX: ${memoPayload.zcashTxHash}, Solana TX: ${tx}`);

    return tx;
  } catch (error) {
    console.error('[Zcash Bridge] Failed to process private entry:', error);
    throw error;
  }
}
