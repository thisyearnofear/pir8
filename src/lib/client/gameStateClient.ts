/**
 * Client-side game state fetching
 * Works in browser environment (not Cloudflare Workers)
 */

import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { SOLANA_CONFIG } from "@/utils/constants";
import { PROGRAM_ID, getGamePDA } from "../anchor";
import idlJson from "@/../public/idl/pir8_game.json";

function getResolvedProgramId(): PublicKey {
  const idlAddress = typeof idlJson.address === "string" ? idlJson.address : null;
  const configuredAddress = SOLANA_CONFIG.PROGRAM_ID || PROGRAM_ID.toBase58();

  if (idlAddress && configuredAddress && idlAddress !== configuredAddress) {
    throw new Error(
      `Program ID mismatch: NEXT_PUBLIC_PROGRAM_ID=${configuredAddress} but IDL address=${idlAddress}. Regenerate or replace the stale configuration so both point to the deployed PIR8 program.`,
    );
  }

  return new PublicKey(idlAddress || configuredAddress);
}

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

    const programId = getResolvedProgramId();

    // Modern Anchor IDLs (0.30+) include an "address" field. Try the 2-arg
    // constructor first; fall back to explicit 3-arg if it fails.
    let program: Program;
    try {
      program = new (Program as any)(idlJson, provider) as Program;
    } catch {
      console.warn("[pir8] 2-arg Program constructor failed in gameStateClient, trying 3-arg");
      program = new (Program as any)(idlJson, programId, provider) as Program;
    }
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
