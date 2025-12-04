'use server';

import { AnchorProvider, BN, Program, Idl } from '@project-serum/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { GAME_CONFIG, SOLANA_CONFIG } from '@/utils/constants';
import { PROGRAM_ID, getConfigPDA, getGamePDA } from '../anchor';

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
  const idl = loadIdl();
  const programId = new PublicKey(SOLANA_CONFIG.PROGRAM_ID || PROGRAM_ID);
  const program = new (Program as any)(idl, programId, provider) as Program;
  return { program, provider };
}

export async function createGameOnChain(program: any, provider: AnchorProvider): Promise<number> {
  const entryLamports = new BN(Math.floor(GAME_CONFIG.ENTRY_FEE * 1e9));

  const tx = await program.methods
    .createGame(entryLamports, GAME_CONFIG.MAX_PLAYERS)
    .accounts({
      authority: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
    
  console.log('Game created, tx:', tx);
  
  // TODO: Parse game address from transaction logs/events
  return 0;
}

export async function joinGameOnChain(program: any, provider: AnchorProvider, gameId: number): Promise<void> {
  // gameId should actually be the game's public key
  const gamePubkey = new PublicKey(gameId);

  // Check if player is already in the game
  try {
    const gameAccount = await program.account.pirateGame.fetch(gamePubkey);
    const isAlreadyInGame = gameAccount.players.some(
      (player: any) => player.pubkey.toString() === provider.wallet.publicKey.toString()
    );

    if (isAlreadyInGame) {
      console.log(`[Join Game] Player already in game, skipping join`);
      return;
    }
  } catch (error) {
    console.log(`[Join Game] Could not check existing players:`, error);
  }

  await program.methods
    .joinGame()
    .accounts({
      game: gamePubkey,
      player: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function createNewGameFlow(): Promise<number> {
  const { program, provider } = await getAnchorClient();
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
    // gameId should be a public key string
    const gamePubkey = new PublicKey(memoPayload.gameId);
    const playerPubkey = new PublicKey(memoPayload.solanaPubkey);

    console.log(`[Zcash Bridge] Attempting to join game ${memoPayload.gameId} for player ${memoPayload.solanaPubkey}`);

    const { program, provider } = await getAnchorClient();

    const tx = await program.methods
      .joinGame()
      .accounts({
        game: gamePubkey,
        player: playerPubkey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log(`[Zcash Bridge] Player ${memoPayload.solanaPubkey} joined game ${memoPayload.gameId}`);
    console.log(`[Zcash Bridge] Zcash TX: ${memoPayload.zcashTxHash}, Solana TX: ${tx}`);

    return tx;
  } catch (error) {
    console.log(`[Zcash Bridge] Failed to join game ${memoPayload.gameId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log(`[Zcash Bridge] Creating new game as fallback for private entry`);

    // If join fails, create new game
    const newGameId = await createNewGameFlow();
    console.log(`[Zcash Bridge] Created new game ${newGameId} as fallback`);
    return `created_${newGameId}`;
  }
}
