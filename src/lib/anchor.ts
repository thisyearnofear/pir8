/**
 * Anchor program integration for PIR8 game
 * ENHANCEMENT: Integrates existing game logic with on-chain program
 */

import { Program, AnchorProvider, BN } from '@project-serum/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';

// Program ID - Update this when you deploy
export const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || '5etQW394NUCprU1ikrbDysFeCGGRYY9usChGpaox9oiK');

// Program IDL type definitions
export interface PIR8Program {
  programId: PublicKey;
  // Add full IDL type here after program compilation
}

// Game state types matching our Rust structs
export interface GameAccount {
  gameId: BN;
  creator: PublicKey;
  status: GameStatus;
  players: PlayerState[];
  currentPlayerIndex: number;
  grid: GameItem[];
  chosenCoordinates: string[];
  entryFee: BN;
  totalPot: BN;
  maxPlayers: number;
  turnTimeout: BN;
  createdAt: BN;
  startedAt: BN | null;
  completedAt: BN | null;
  winner: PublicKey | null;
  finalScores: BN[];
  randomSeed: BN;
  metadata: GameMetadata;
}

export interface PlayerState {
  playerKey: PublicKey;
  points: BN;
  bankedPoints: BN;
  hasElf: boolean;
  hasBauble: boolean;
  isActive: boolean;
  joinedAt: BN;
  lastMoveAt: BN;
}

export enum GameStatus {
  Waiting = 'Waiting',
  Active = 'Active', 
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export interface GameMetadata {
  name: string;
  description: string;
  imageUri: string | null;
  externalUrl: string | null;
}

// PDA derivation helpers
export const getConfigPDA = (): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    PROGRAM_ID
  );
};

export const getGamePDA = (gameId: number): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('game'),
      new BN(gameId).toArrayLike(Buffer, 'le', 8)
    ],
    PROGRAM_ID
  );
};

// Custom hook for Anchor program
export const useAnchorProgram = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  return useMemo(() => {
    if (!wallet) return null;

    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });

    // Load program (IDL will be generated after compilation)
    // const program = new Program(IDL, PROGRAM_ID, provider) as Program<PIR8Program>;
    // return program;
    
    // For now, return provider until IDL is generated
    return { provider, programId: PROGRAM_ID };
  }, [connection, wallet]);
};

// Game instruction helpers
export class PIR8Instructions {
  constructor(private program: any, private provider: AnchorProvider) {}

  async initializeConfig(
    entryFee: number,
    platformFeeBps: number,
    maxPlayers: number,
    treasury: PublicKey
  ) {
    const [configPDA] = getConfigPDA();
    
    return this.program.methods
      .initializeConfig(
        new BN(entryFee),
        platformFeeBps,
        maxPlayers
      )
      .accounts({
        config: configPDA,
        authority: this.provider.wallet.publicKey,
        treasury,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async createGame(entryFee: number, maxPlayers: number) {
    const [configPDA] = getConfigPDA();
    
    // Get current game count to derive game PDA
    const configAccount = await this.program.account.gameConfig.fetch(configPDA);
    const gameId = configAccount.totalGames.toNumber();
    const [gamePDA] = getGamePDA(gameId);

    return this.program.methods
      .createGame(new BN(entryFee), maxPlayers)
      .accounts({
        game: gamePDA,
        config: configPDA,
        creator: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        // randomnessAccountData: randomnessAccount, // Add Switchboard VRF
      })
      .rpc();
  }

  async joinGame(gameId: number) {
    const [gamePDA] = getGamePDA(gameId);
    const [configPDA] = getConfigPDA();
    
    // Get treasury from config
    const configAccount = await this.program.account.gameConfig.fetch(configPDA);
    
    return this.program.methods
      .joinGame()
      .accounts({
        game: gamePDA,
        config: configPDA,
        player: this.provider.wallet.publicKey,
        treasury: configAccount.treasury,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async startGame(gameId: number) {
    const [gamePDA] = getGamePDA(gameId);
    const [configPDA] = getConfigPDA();

    return this.program.methods
      .startGame()
      .accounts({
        game: gamePDA,
        config: configPDA,
        creator: this.provider.wallet.publicKey,
      })
      .rpc();
  }

  async makeMove(gameId: number, coordinate: string) {
    const [gamePDA] = getGamePDA(gameId);

    return this.program.methods
      .makeMove(coordinate)
      .accounts({
        game: gamePDA,
        player: this.provider.wallet.publicKey,
      })
      .rpc();
  }

  async executeItemEffect(
    gameId: number,
    action: any,
    targetPlayer?: PublicKey,
    amount?: number
  ) {
    const [gamePDA] = getGamePDA(gameId);

    return this.program.methods
      .executeItemEffect(
        action,
        targetPlayer || null,
        amount ? new BN(amount) : null
      )
      .accounts({
        game: gamePDA,
        player: this.provider.wallet.publicKey,
      })
      .rpc();
  }

  async completeGame(gameId: number) {
    const [gamePDA] = getGamePDA(gameId);

    return this.program.methods
      .completeGame()
      .accounts({
        game: gamePDA,
        player: this.provider.wallet.publicKey,
      })
      .rpc();
  }

  async claimWinnings(gameId: number) {
    const [gamePDA] = getGamePDA(gameId);

    return this.program.methods
      .claimWinnings()
      .accounts({
        game: gamePDA,
        winner: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  // Fetch game state
  async getGame(gameId: number): Promise<GameAccount> {
    const [gamePDA] = getGamePDA(gameId);
    return this.program.account.game.fetch(gamePDA);
  }

  // Fetch config
  async getConfig() {
    const [configPDA] = getConfigPDA();
    return this.program.account.gameConfig.fetch(configPDA);
  }
}

// Helper to convert BN to number safely
export const bnToNumber = (bn: BN): number => {
  return bn.toNumber();
};

// Helper to convert number to BN
export const numberToBN = (num: number): BN => {
  return new BN(num);
};

// Event parsing helpers
export const parseGameEvents = (logs: string[]) => {
  // Parse program events from transaction logs
  const events = [];
  
  for (const log of logs) {
    if (log.includes('GameCreated')) {
      // Parse GameCreated event
    } else if (log.includes('PlayerJoined')) {
      // Parse PlayerJoined event
    } else if (log.includes('MoveMade')) {
      // Parse MoveMade event
    } else if (log.includes('GameCompleted')) {
      // Parse GameCompleted event
    }
  }
  
  return events;
};