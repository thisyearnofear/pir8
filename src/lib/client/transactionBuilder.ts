/**
 * Client-side transaction builder for PIR8 game
 *
 * Users sign their own transactions and pay their own gas fees.
 * All instruction calls match the actual Rust program in programs/pir8-game/src/lib.rs.
 */

import { AnchorProvider, Program, Idl, BN } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { SOLANA_CONFIG } from "@/utils/constants";
import { getGamePDA, getAgentRegistryPDA } from "../anchor";
import type { WalletAdapter } from "@coral-xyz/anchor";

// ============================================================================
// IDL LOADING
// ============================================================================

let cachedIdl: Idl | null = null;

async function getIdl(): Promise<Idl> {
  if (cachedIdl) return cachedIdl;

  try {
    const response = await fetch("/idl/pir8_game.json");
    if (response.ok) {
      cachedIdl = await response.json();
      return cachedIdl!;
    }
  } catch (error) {
    console.warn("Could not load IDL from public folder:", error);
  }

  throw new Error(
    "Could not load program IDL. Make sure anchor build has been run and public/idl/pir8_game.json exists.",
  );
}

// ============================================================================
// WALLET ADAPTER HELPER
// ============================================================================

/**
 * Create a WalletAdapter-compatible object from useWallet hook output.
 * Handles different wallet object structures (Phantom, Solflare, etc.)
 */
export const createWalletAdapter = (
  wallet: { publicKey?: PublicKey | null; adapter?: { publicKey?: PublicKey | null; signTransaction?: Function; signAllTransactions?: Function }; signTransaction?: Function; signAllTransactions?: Function },
  publicKey?: PublicKey | null,
): WalletAdapter => {
  const actualPublicKey =
    publicKey || wallet?.publicKey || wallet?.adapter?.publicKey;
  const signTransaction =
    wallet?.signTransaction || wallet?.adapter?.signTransaction;
  const signAllTransactions =
    wallet?.signAllTransactions || wallet?.adapter?.signAllTransactions;

  if (!actualPublicKey) {
    throw new Error("Wallet not connected - no public key found");
  }

  if (!signTransaction) {
    throw new Error("Wallet not connected - no signTransaction method found");
  }

  return {
    publicKey: actualPublicKey,
    signTransaction: signTransaction.bind(wallet?.adapter || wallet),
    signAllTransactions: signAllTransactions?.bind(wallet?.adapter || wallet),
  } as WalletAdapter;
};

// ============================================================================
// PROGRAM INITIALIZATION
// ============================================================================

export const getClientProgram = async (
  wallet: WalletAdapter,
): Promise<Program> => {
  if (!wallet || !wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  const rpcUrl =
    SOLANA_CONFIG.RPC_URL && !SOLANA_CONFIG.RPC_URL.includes("YOUR_API_KEY")
      ? SOLANA_CONFIG.RPC_URL
      : "https://api.devnet.solana.com";

  const connection = new Connection(rpcUrl, "confirmed");
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  const idl = await getIdl();

  // Anchor 0.30+ modern IDLs include the address and work best with the 2-argument constructor.
  // We use a type cast to 'any' to avoid the "Expected 3 arguments" TS error during build.
  return new (Program as any)(idl, provider) as Program;
};

// ============================================================================
// GAME LIFECYCLE TRANSACTION BUILDERS
// ============================================================================

/** Create a new game lobby */
export const buildCreateGameTx = async (
  wallet: WalletAdapter,
  gameId: number,
  mode: "Casual" | "Competitive" | "AgentArena" = "Casual",
): Promise<Transaction> => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId);

  return await (program as any).methods
    .createGame(new BN(gameId), { [mode.toLowerCase()]: {} } as never)
    .accounts({
      game: gamePDA,
      authority: wallet.publicKey!,
      systemProgram: SystemProgram.programId,
    })
    .transaction();
};

/** Join an existing game lobby */
export const buildJoinGameTx = async (
  wallet: WalletAdapter,
  gameId: number,
): Promise<Transaction> => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId);

  return await (program as any).methods
    .joinGame()
    .accounts({
      game: gamePDA,
      player: wallet.publicKey!,
      systemProgram: SystemProgram.programId,
    })
    .transaction();
};

/** Start a game (authority only, requires MIN_PLAYERS) */
export const buildStartGameTx = async (
  wallet: WalletAdapter,
  gameId: number,
): Promise<Transaction> => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId);

  return await (program as any).methods
    .startGame()
    .accounts({
      game: gamePDA,
      authority: wallet.publicKey!,
    })
    .transaction();
};

// ============================================================================
// GAMEPLAY TRANSACTION BUILDERS
// ============================================================================

/** Move a ship to a new position */
export const buildMoveShipTx = async (
  wallet: WalletAdapter,
  gameId: number,
  shipId: string,
  toX: number,
  toY: number,
  decisionTimeMs?: number,
): Promise<Transaction> => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId);

  return await (program as any).methods
    .moveShip(shipId, toX, toY, decisionTimeMs ? new BN(decisionTimeMs) : null)
    .accounts({
      game: gamePDA,
      player: wallet.publicKey!,
    })
    .transaction();
};

/** Attack an enemy ship */
export const buildAttackShipTx = async (
  wallet: WalletAdapter,
  gameId: number,
  attackerShipId: string,
  targetShipId: string,
): Promise<Transaction> => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId);

  return await (program as any).methods
    .attackShip(attackerShipId, targetShipId)
    .accounts({
      game: gamePDA,
      player: wallet.publicKey!,
    })
    .transaction();
};

/** Claim a territory (ship must be on the tile) */
export const buildClaimTerritoryTx = async (
  wallet: WalletAdapter,
  gameId: number,
  shipId: string,
): Promise<Transaction> => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId);

  return await (program as any).methods
    .claimTerritory(shipId)
    .accounts({
      game: gamePDA,
      player: wallet.publicKey!,
    })
    .transaction();
};

/** Collect resources from all controlled territories */
export const buildCollectResourcesTx = async (
  wallet: WalletAdapter,
  gameId: number,
): Promise<Transaction> => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId);

  return await (program as any).methods
    .collectResources()
    .accounts({
      game: gamePDA,
      player: wallet.publicKey!,
    })
    .transaction();
};

/** Build a new ship at a controlled port */
export const buildBuildShipTx = async (
  wallet: WalletAdapter,
  gameId: number,
  shipType: "sloop" | "frigate" | "galleon" | "flagship",
  portX: number,
  portY: number,
): Promise<Transaction> => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId);

  const shipTypeEnum = { [shipType]: {} } as never;

  return await (program as any).methods
    .buildShip(shipTypeEnum, portX, portY)
    .accounts({
      game: gamePDA,
      player: wallet.publicKey!,
    })
    .transaction();
};

/** Scan a coordinate to reveal its type */
export const buildScanCoordinateTx = async (
  wallet: WalletAdapter,
  gameId: number,
  coordinateX: number,
  coordinateY: number,
): Promise<Transaction> => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId);

  return await (program as any).methods
    .scanCoordinate(coordinateX, coordinateY)
    .accounts({
      game: gamePDA,
      player: wallet.publicKey!,
    })
    .transaction();
};

/** Activate Ghost Fleet stealth mode (costs 200 gold) */
export const buildActivateGhostFleetTx = async (
  wallet: WalletAdapter,
  gameId: number,
): Promise<Transaction> => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId);

  return await (program as any).methods
    .activateGhostFleet()
    .accounts({
      game: gamePDA,
      player: wallet.publicKey!,
    })
    .transaction();
};

/** End the current turn */
export const buildEndTurnTx = async (
  wallet: WalletAdapter,
  gameId: number,
): Promise<Transaction> => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId);

  return await (program as any).methods
    .endTurn()
    .accounts({
      game: gamePDA,
      player: wallet.publicKey!,
    })
    .transaction();
};

/** Check and complete game if victory conditions are met */
export const buildCheckAndCompleteGameTx = async (
  wallet: WalletAdapter,
  gameId: number,
): Promise<Transaction> => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId);

  return await (program as any).methods
    .checkAndCompleteGame()
    .accounts({
      game: gamePDA,
      player: wallet.publicKey!,
    })
    .transaction();
};

/** Claim winnings from a completed game (winner only) */
export const buildClaimWinningsTx = async (
  wallet: WalletAdapter,
  gameId: number,
): Promise<Transaction> => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId);

  return await (program as any).methods
    .claimWinnings()
    .accounts({
      game: gamePDA,
      winner: wallet.publicKey!,
      systemProgram: SystemProgram.programId,
    })
    .transaction();
};

// ============================================================================
// SESSION KEY / DELEGATE TRANSACTION BUILDERS
// ============================================================================

/** Join a game via a delegated session key */
export const buildJoinGameViaDelegateTx = async (
  wallet: WalletAdapter,
  gameId: number,
  sessionKeyPubkey: PublicKey,
  ownerPubkey: PublicKey,
): Promise<Transaction> => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId);
  const [agentPDA] = getAgentRegistryPDA(ownerPubkey);

  return await (program as any).methods
    .joinGameViaDelegate()
    .accounts({
      game: gamePDA,
      sessionKey: sessionKeyPubkey,
      agent: agentPDA,
      owner: ownerPubkey,
      systemProgram: SystemProgram.programId,
    })
    .transaction();
};

/** Move a ship via a delegated session key */
export const buildMoveShipViaDelegateTx = async (
  wallet: WalletAdapter,
  gameId: number,
  shipId: string,
  toX: number,
  toY: number,
  sessionKeyPubkey: PublicKey,
  ownerPubkey: PublicKey,
  decisionTimeMs?: number,
): Promise<Transaction> => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId);
  const [agentPDA] = getAgentRegistryPDA(ownerPubkey);

  return await (program as any).methods
    .moveShipViaDelegate(
      shipId,
      toX,
      toY,
      decisionTimeMs ? new BN(decisionTimeMs) : null,
    )
    .accounts({
      game: gamePDA,
      sessionKey: sessionKeyPubkey,
      agent: agentPDA,
      owner: ownerPubkey,
      systemProgram: SystemProgram.programId,
    })
    .transaction();
};

// ============================================================================
// AGENT REGISTRATION
// ============================================================================

/** Register an agent (creates AgentRegistry PDA) */
export const buildRegisterAgentTx = async (
  wallet: WalletAdapter,
  name: string,
  version: string,
  twitter?: string,
  website?: string,
): Promise<Transaction> => {
  const program = await getClientProgram(wallet);
  const [agentPDA] = getAgentRegistryPDA(wallet.publicKey!);

  return await (program as any).methods
    .registerAgent(name, version, twitter ?? null, website ?? null)
    .accounts({
      agent: agentPDA,
      owner: wallet.publicKey!,
      systemProgram: SystemProgram.programId,
    })
    .transaction();
};

/** Set or clear delegate for an agent */
export const buildDelegateAgentControlTx = async (
  wallet: WalletAdapter,
  delegatePubkey: PublicKey | null,
): Promise<Transaction> => {
  const program = await getClientProgram(wallet);
  const [agentPDA] = getAgentRegistryPDA(wallet.publicKey!);

  return await (program as any).methods
    .delegateAgentControl(delegatePubkey)
    .accounts({
      agent: agentPDA,
      owner: wallet.publicKey!,
    })
    .transaction();
};

// ============================================================================
// TRANSACTION EXECUTION
// ============================================================================

export const executeTransaction = async (
  wallet: WalletAdapter,
  transaction: Transaction,
): Promise<string> => {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  const rpcUrl =
    SOLANA_CONFIG.RPC_URL && !SOLANA_CONFIG.RPC_URL.includes("YOUR_API_KEY")
      ? SOLANA_CONFIG.RPC_URL
      : "https://api.devnet.solana.com";

  const connection = new Connection(rpcUrl, "confirmed");

  const { blockhash } = await connection.getLatestBlockhash();
  (transaction as any).recentBlockhash = blockhash;
  (transaction as any).feePayer = wallet.publicKey;

  const signedTx = await wallet.signTransaction!(transaction);
  const rawTransaction = signedTx.serialize();
  const signature = await (connection as any).sendRawTransaction(rawTransaction);

  await connection.confirmTransaction(signature, "confirmed");

  return signature;
};

// ============================================================================
// CONVENIENCE FUNCTIONS (wrap build + execute)
// ============================================================================

export const createGame = async (
  wallet: WalletAdapter,
  gameId: number,
  mode: "Casual" | "Competitive" | "AgentArena" = "Casual",
): Promise<string> => {
  const tx = await buildCreateGameTx(wallet, gameId, mode);
  return await executeTransaction(wallet, tx);
};

// Alias for backwards compatibility
export const initializeGame = createGame;

// Alias for backwards compatibility
export const joinGameViaDelegate = async (
  wallet: WalletAdapter,
  gameId: number,
  sessionKeyPubkey: PublicKey,
  ownerPubkey: PublicKey,
): Promise<string> => {
  const tx = await buildJoinGameViaDelegateTx(wallet, gameId, sessionKeyPubkey, ownerPubkey);
  return await executeTransaction(wallet, tx);
};

// Connection test helper
export const testProgramConnection = async (
  wallet: WalletAdapter,
): Promise<boolean> => {
  try {
    const program = await getClientProgram(wallet);
    const idl = await program.idl;
    return !!idl;
  } catch {
    return false;
  }
};

export const joinGame = async (
  wallet: WalletAdapter,
  gameId: number,
): Promise<string> => {
  const tx = await buildJoinGameTx(wallet, gameId);
  return await executeTransaction(wallet, tx);
};

export const startGame = async (
  wallet: WalletAdapter,
  gameId: number,
): Promise<string> => {
  const tx = await buildStartGameTx(wallet, gameId);
  return await executeTransaction(wallet, tx);
};

export const moveShip = async (
  wallet: WalletAdapter,
  gameId: number,
  shipId: string,
  toX: number,
  toY: number,
  decisionTimeMs?: number,
): Promise<string> => {
  const tx = await buildMoveShipTx(wallet, gameId, shipId, toX, toY, decisionTimeMs);
  return await executeTransaction(wallet, tx);
};

export const attackShip = async (
  wallet: WalletAdapter,
  gameId: number,
  attackerShipId: string,
  targetShipId: string,
): Promise<string> => {
  const tx = await buildAttackShipTx(wallet, gameId, attackerShipId, targetShipId);
  return await executeTransaction(wallet, tx);
};

export const claimTerritory = async (
  wallet: WalletAdapter,
  gameId: number,
  shipId: string,
): Promise<string> => {
  const tx = await buildClaimTerritoryTx(wallet, gameId, shipId);
  return await executeTransaction(wallet, tx);
};

export const collectResources = async (
  wallet: WalletAdapter,
  gameId: number,
): Promise<string> => {
  const tx = await buildCollectResourcesTx(wallet, gameId);
  return await executeTransaction(wallet, tx);
};

export const buildShip = async (
  wallet: WalletAdapter,
  gameId: number,
  shipType: "sloop" | "frigate" | "galleon" | "flagship",
  portX: number,
  portY: number,
): Promise<string> => {
  const tx = await buildBuildShipTx(wallet, gameId, shipType, portX, portY);
  return await executeTransaction(wallet, tx);
};

export const endTurn = async (
  wallet: WalletAdapter,
  gameId: number,
): Promise<string> => {
  const tx = await buildEndTurnTx(wallet, gameId);
  return await executeTransaction(wallet, tx);
};

export const scanCoordinate = async (
  wallet: WalletAdapter,
  gameId: number,
  x: number,
  y: number,
): Promise<string> => {
  const tx = await buildScanCoordinateTx(wallet, gameId, x, y);
  return await executeTransaction(wallet, tx);
};

export const claimWinnings = async (
  wallet: WalletAdapter,
  gameId: number,
): Promise<string> => {
  const tx = await buildClaimWinningsTx(wallet, gameId);
  return await executeTransaction(wallet, tx);
};

// ============================================================================
// READ-ONLY FUNCTIONS
// ============================================================================

import type { OnChainGameState } from "@/types/onChain";
import { onChainToGameState } from "./typeAdapters";

/** Fetch game state from chain and convert to client format */
export const fetchGameState = async (
  wallet: WalletAdapter,
  gameId: number,
): Promise<ReturnType<typeof onChainToGameState> | null> => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId);

  try {
    const account = (program as any).account as Record<string, { fetch: (pk: PublicKey) => Promise<unknown> }> | undefined;
    if (!account) return null;
    const raw = await account['pirateGame']?.fetch(gamePDA);
    if (!raw) return null;
    return onChainToGameState(raw as OnChainGameState);
  } catch {
    return null;
  }
};

/** Fetch all game lobbies */
export const fetchLobbies = async (
  wallet: WalletAdapter,
): Promise<Array<{ publicKey: PublicKey; account: OnChainGameState }>> => {
  const program = await getClientProgram(wallet);

  try {
    const account = (program as any).account as Record<string, { all: () => Promise<Array<{ publicKey: PublicKey; account: unknown }>> }> | undefined;
    if (!account) return [];
    const games = await account['pirateGame']?.all();
    return games as Array<{ publicKey: PublicKey; account: OnChainGameState }>;
  } catch (e) {
    console.warn("Error fetching lobbies:", e);
    return [];
  }
};
