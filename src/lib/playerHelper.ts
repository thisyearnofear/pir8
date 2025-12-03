import { Player, Resources } from '@/types/game';
import { PublicKey } from '@solana/web3.js';
import { PirateGameEngine } from './gameLogic';

const DEFAULT_RESOURCES: Resources = {
  gold: 1000,
  crew: 50,
  cannons: 20,
  supplies: 100,
};

/**
 * Create a player object from a wallet public key
 */
export const createPlayerFromWallet = (publicKey: PublicKey): Player => {
  const address = publicKey.toString();
  return {
    publicKey: address,
    username: `Pirate_${address.slice(0, 4)}`,
    resources: { ...DEFAULT_RESOURCES },
    ships: [],
    controlledTerritories: [],
    totalScore: 0,
    isActive: true,
    scanCharges: 3,
    scannedCoordinates: [],
    speedBonusAccumulated: 0,
    averageDecisionTimeMs: 0,
    totalMoves: 0,
  };
};

/**
 * Create an AI player with a unique ID
 */
export const createAIPlayer = (gameId: string): Player => {
  return {
    publicKey: `AI_${gameId}_${Date.now()}`,
    username: 'AI Pirate',
    resources: { ...DEFAULT_RESOURCES },
    ships: [],
    controlledTerritories: [],
    totalScore: 0,
    isActive: true,
    scanCharges: 3,
    scannedCoordinates: [],
    speedBonusAccumulated: 0,
    averageDecisionTimeMs: 0,
    totalMoves: 0,
  };
};
