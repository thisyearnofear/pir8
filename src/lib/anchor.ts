/**
 * Anchor program integration for PIR8 game
 * ENHANCEMENT: Integrates existing game logic with on-chain program
 * NOTE: This file exports only server-safe utilities (PDA derivation, types)
 * React hooks are in useAnchorProgram.ts
 */

import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

// Program ID - Deployed to devnet
export const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || 'EeHyY2FQ3A4GLieZbGbmZtz1iLKzLytXkRcXyzGfmePt');

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
  grid: any[]; // GameItem enum from Anchor IDL
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
  // Skill mechanics
  scanCharges: number;
  scannedCoordinates: number[];
  speedBonusAccumulated: BN;
  averageDecisionTimeMs: BN;
  totalMoves: number;
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



// Helper to convert BN to number safely
export const bnToNumber = (bn: BN): number => {
  return bn.toNumber();
};

// Helper to convert number to BN
export const numberToBN = (num: number): BN => {
  return new BN(num);
};

// Event parsing helpers
export const parseGameEvents = (logs: string[]): any[] => {
  // Parse program events from transaction logs
  const events: any[] = [];

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
