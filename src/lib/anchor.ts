/**
 * Anchor program integration for PIR8 game
 *
 * Exports PDA derivation helpers and re-exports on-chain types.
 * The fictional GameAccount/PlayerState types (from a different game) have been removed.
 * Use OnChainGameState/OnChainPlayerData from @/types/onChain instead.
 */

import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

// Re-export on-chain types for convenience
export type {
  OnChainGameState,
  OnChainPlayerData,
  OnChainShipData,
  OnChainResources,
  OnChainTerritoryCell,
  OnChainAgentRegistry,
  OnChainGameStatus,
  OnChainGameMode,
  OnChainShipType,
  OnChainTerritoryCellType,
} from "@/types/onChain";

// Program ID - Deployed to devnet
export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ||
    "DkkuBQySAxKTADdxQVyx8rjxudZVSwA7ZjRCqRquH5FU",
);

// PDA derivation helpers

/** Game PDA - derives from ["pirate_game", game_id_le_bytes] */
export const getGamePDA = (
  gameId: number | BN,
  programId: PublicKey = PROGRAM_ID,
): [PublicKey, number] => {
  const idBuffer =
    typeof gameId === "number"
      ? new BN(gameId).toArrayLike(Buffer, "le", 8)
      : gameId.toArrayLike(Buffer, "le", 8);

  return PublicKey.findProgramAddressSync(
    [Buffer.from("pirate_game"), idBuffer],
    programId,
  );
};

/** Agent Registry PDA - derives from ["agent", owner_pubkey] */
export const getAgentRegistryPDA = (
  ownerPubkey: PublicKey,
  programId: PublicKey = PROGRAM_ID,
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("agent"), ownerPubkey.toBytes()],
    programId,
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

// Generate a unique game ID based on timestamp + random component
export const generateGameId = (): number => {
  const timestamp = Math.floor(Date.now() / 1000);
  const random = Math.floor(Math.random() * 10000);
  return timestamp * 10000 + random;
};

// Event parsing helpers
export interface ParsedEvent {
  type: string;
  data: Record<string, unknown> | null;
  rawLog: string;
}

export const parseGameEvents = (logs: string[]): ParsedEvent[] => {
  const events: ParsedEvent[] = [];
  const eventNames = [
    "PlayerJoined",
    "GameStarted",
    "ShipMoved",
    "ShipAttacked",
    "TerritoryClaimed",
    "ResourcesCollected",
    "ShipBuilt",
    "GameCompleted",
    "CoordinateScanned",
    "MoveExecuted",
    "GhostFleetActivated",
    "WinningsClaimed",
  ];

  const extractJsonPayload = (log: string): Record<string, unknown> | null => {
    const start = log.indexOf("{");
    const end = log.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    const payload = log.slice(start, end + 1);
    try {
      return JSON.parse(payload);
    } catch {
      return null;
    }
  };

  for (const log of logs) {
    const matchedName = eventNames.find((name) => log.includes(name));
    if (!matchedName) continue;

    const data = extractJsonPayload(log);
    events.push({
      type: matchedName,
      data,
      rawLog: log,
    });
  }

  return events;
};
