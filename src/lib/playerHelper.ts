import { Player } from '@/types/game';
import { PublicKey } from '@solana/web3.js';

/**
 * Create a player object from a wallet public key
 */
export const createPlayerFromWallet = (publicKey: PublicKey): Player => {
  const address = publicKey.toString();
  return {
    publicKey: address,
    points: 0,
    bankedPoints: 0,
    hasElf: false,
    hasBauble: false,
    username: `Pirate_${address.slice(0, 4)}`,
  };
};

/**
 * Create an AI player with a unique ID
 */
export const createAIPlayer = (gameId: string): Player => {
  return {
    publicKey: `AI_${gameId}`,
    points: 0,
    bankedPoints: 0,
    hasElf: false,
    hasBauble: false,
    username: 'AI Pirate',
  };
};
