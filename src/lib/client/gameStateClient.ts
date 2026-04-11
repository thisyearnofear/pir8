/**
 * Client-side game state fetching
 * Works in browser environment (not Cloudflare Workers)
 */

import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { SOLANA_CONFIG } from "@/utils/constants";
import { PROGRAM_ID, getGamePDA } from "../anchor";
import idlJson from "@/../public/idl/pir8_game.json";

/**
 * Fetch game state directly from Solana blockchain (client-side only)
 */
export async function fetchGameStateClient(gameId: number = 0): Promise<any> {
  try {
    const rpcUrl = SOLANA_CONFIG.RPC_URL || "https://api.devnet.solana.com";
    const connection = new Connection(rpcUrl, "confirmed");

    // Create a read-only provider (no wallet needed for queries)
    const provider = new AnchorProvider(
      connection,
      {} as any,
      { commitment: "confirmed" }
    );

    const programId = SOLANA_CONFIG.PROGRAM_ID
      ? new PublicKey(SOLANA_CONFIG.PROGRAM_ID)
      : PROGRAM_ID;

    const program = new Program(idlJson as Idl, programId, provider);
    const [gamePDA] = getGamePDA(gameId, programId);

    try {
      const rawState = await (program as any).account.pirateGame.fetch(gamePDA);
      return sanitizeSolanaData(rawState);
    } catch (error: any) {
      if (
        error.message &&
        (error.message.includes("Account does not exist") ||
          error.message.includes("could not find account"))
      ) {
        console.log(`Game ${gameId} not found on-chain`);
        return null;
      }
      throw error;
    }
  } catch (error) {
    console.error(`Error fetching game state for ${gameId}:`, error);
    throw error;
  }
}

// Helper to convert Solana types to JSON-friendly types
function sanitizeSolanaData(data: any): any {
  if (data === null || data === undefined) return data;

  // Handle PublicKey
  if (data.toBase58 && typeof data.toBase58 === "function") {
    return data.toBase58();
  }

  // Handle BN (BigNumber)
  if (data.toNumber && typeof data.toNumber === "function") {
    try {
      return data.toNumber();
    } catch (e) {
      return data.toString();
    }
  }

  // Handle Array
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeSolanaData(item));
  }

  // Handle Object
  if (typeof data === "object") {
    const result: any = {};
    for (const key in data) {
      result[key] = sanitizeSolanaData(data[key]);
    }
    return result;
  }

  return data;
}
