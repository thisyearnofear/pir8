'use server';

import { AnchorProvider, BN, Program, Idl } from '@project-serum/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { GAME_CONFIG, SOLANA_CONFIG } from '@/utils/constants';
import { PROGRAM_ID, getConfigPDA, getGamePDA } from '../anchor';

class NodeWallet {
  constructor(readonly payer: Keypair) {}
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
  const idlPath = process.env.PIR8_IDL_PATH || path.join(process.cwd(), 'contracts/pir8-game/target/idl/pir8_game.json');
  const json = fs.readFileSync(idlPath, 'utf8');
  return JSON.parse(json);
}

export async function getAnchorClient(): Promise<{ program: Program; provider: AnchorProvider }> {
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

export async function ensureConfig(program: any, provider: AnchorProvider): Promise<void> {
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

export async function createGameOnChain(program: any, provider: AnchorProvider): Promise<number> {
  const [configPDA] = getConfigPDA();
  const configAccount = await program.account.gameConfig.fetch(configPDA);
  const gameId = configAccount.totalGames.toNumber();
  const [gamePDA] = getGamePDA(gameId);
  const entryLamports = new BN(Math.floor(GAME_CONFIG.ENTRY_FEE * 1e9));
  
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

export async function joinGameOnChain(program: any, provider: AnchorProvider, gameId: number): Promise<void> {
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

export async function createNewGameFlow(): Promise<number> {
  const { program, provider } = await getAnchorClient();
  await ensureConfig(program, provider);
  const gameId = await createGameOnChain(program, provider);
  return gameId;
}

export async function joinGameFlow(gameId: number): Promise<void> {
  const { program, provider } = await getAnchorClient();
  await joinGameOnChain(program, provider, gameId);
}

export async function joinGamePrivateViaZcash(memoPayload: {
  gameId: string;
  solanaPubkey: string;
  zcashTxHash?: string;
  blockHeight?: number;
}): Promise<string> {
  try {
    const gameIdNum = parseInt(memoPayload.gameId, 10);
    if (isNaN(gameIdNum)) {
      throw new Error(`Invalid game ID from memo: ${memoPayload.gameId}`);
    }

    const { program, provider } = await getAnchorClient();
    const [gamePDA] = getGamePDA(gameIdNum);
    const [configPDA] = getConfigPDA();
    const configAccount = await program.account.gameConfig.fetch(configPDA);

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

    console.log(`[Zcash Bridge] Player ${memoPayload.solanaPubkey} joined game ${gameIdNum}`);
    console.log(`[Zcash Bridge] Zcash TX: ${memoPayload.zcashTxHash}, Solana TX: ${tx}`);

    return tx;
  } catch (error) {
    console.error('[Zcash Bridge] Failed to process private entry:', error);
    throw error;
  }
}
