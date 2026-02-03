import { AnchorProvider, Program, Idl, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { SOLANA_CONFIG } from "@/utils/constants";
import { getGamePDA } from "../anchorUtils";
import type { WalletAdapter } from "@coral-xyz/anchor";

// Import IDL - we'll need to generate this after building the contract
let cachedIdl: Idl | null = null;

async function getIdl(): Promise<Idl> {
  if (cachedIdl) return cachedIdl;

  try {
    // Try to load from public folder first
    const response = await fetch("/idl/pir8_game.json");
    if (response.ok) {
      cachedIdl = await response.json();
      return cachedIdl!;
    }
  } catch (error) {
    console.warn("Could not load IDL from public folder");
  }

  // Fallback: try to import directly (this will work in development)
  try {
    const idlModule = await import("../../../target/idl/pir8_game.json");
    cachedIdl = idlModule.default || idlModule;
    return cachedIdl!;
  } catch (error) {
    throw new Error(
      "Could not load program IDL. Make sure to build the Anchor program first.",
    );
  }
}

export const getClientProgram = async (
  wallet: WalletAdapter,
): Promise<Program> => {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  const connection = new Connection(
    SOLANA_CONFIG.RPC_URL || "https://api.devnet.solana.com",
    "confirmed",
  );
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const idl = await getIdl();
  const programId = new PublicKey(SOLANA_CONFIG.PROGRAM_ID!);

  return new Program(idl, programId, provider);
};

export const createGameClient = async (
  wallet: WalletAdapter,
  gameId: number,
  mode: "Casual" | "Competitive" | "AgentArena" = "Casual",
) => {
  if (!wallet.publicKey) throw new Error("Wallet not connected");

  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId, program.programId);

  let modeEnum: any = { casual: {} };
  if (mode === "Competitive") modeEnum = { competitive: {} };
  if (mode === "AgentArena") modeEnum = { agentArena: {} };

  const tx = await (program.methods as any)
    .createGame(new BN(gameId), modeEnum)
    .accounts({
      game: gamePDA,
      authority: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log(`✅ Game ${gameId} created:`, tx);
  return tx;
};

export const joinGameClient = async (wallet: WalletAdapter, gameId: number) => {
  if (!wallet.publicKey) throw new Error("Wallet not connected");

  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId, program.programId);

  const tx = await (program.methods as any)
    .joinGame()
    .accounts({
      game: gamePDA,
      player: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log(`✅ Joined game ${gameId}:`, tx);
  return tx;
};

export const startGameClient = async (
  wallet: WalletAdapter,
  gameId: number,
) => {
  if (!wallet.publicKey) throw new Error("Wallet not connected");

  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId, program.programId);

  const tx = await (program.methods as any)
    .startGame()
    .accounts({
      game: gamePDA,
      authority: wallet.publicKey,
    })
    .rpc();

  console.log(`✅ Game ${gameId} started:`, tx);
  return tx;
};

export const moveShipClient = async (
  wallet: any,
  gameId: number,
  shipId: string,
  x: number,
  y: number,
  decisionTimeMs?: number,
) => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId, (program as any).programId);

  const tx = await (program as any).methods
    .moveShip(shipId, x, y, decisionTimeMs ? new BN(decisionTimeMs) : null)
    .accounts({
      game: gamePDA,
      player: wallet.publicKey,
    })
    .rpc();

  console.log("✅ Ship moved:", tx);
  return tx;
};

export const attackShipClient = async (
  wallet: any,
  gameId: number,
  attackerShipId: string,
  targetShipId: string,
) => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId, (program as any).programId);

  const tx = await (program as any).methods
    .attackShip(attackerShipId, targetShipId)
    .accounts({
      game: gamePDA,
      player: wallet.publicKey,
    })
    .rpc();

  console.log("✅ Ship attacked:", tx);
  return tx;
};

export const claimTerritoryClient = async (
  wallet: any,
  gameId: number,
  shipId: string,
) => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId, (program as any).programId);

  const tx = await (program as any).methods
    .claimTerritory(shipId)
    .accounts({
      game: gamePDA,
      player: wallet.publicKey,
    })
    .rpc();

  console.log("✅ Territory claimed:", tx);
  return tx;
};

export const collectResourcesClient = async (wallet: any, gameId: number) => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId, (program as any).programId);

  const tx = await (program as any).methods
    .collectResources()
    .accounts({
      game: gamePDA,
      player: wallet.publicKey,
    })
    .rpc();

  console.log("✅ Resources collected:", tx);
  return tx;
};

export const buildShipClient = async (
  wallet: any,
  gameId: number,
  shipType: string,
  portX: number,
  portY: number,
) => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId, (program as any).programId);

  const shipTypeEnum = { [shipType]: {} };

  const tx = await (program as any).methods
    .buildShip(shipTypeEnum, portX, portY)
    .accounts({
      game: gamePDA,
      player: wallet.publicKey,
    })
    .rpc();

  console.log("✅ Ship built:", tx);
  return tx;
};

export const scanCoordinateClient = async (
  wallet: any,
  gameId: number,
  x: number,
  y: number,
) => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId, (program as any).programId);

  const tx = await (program as any).methods
    .scanCoordinate(x, y)
    .accounts({
      game: gamePDA,
      player: wallet.publicKey,
    })
    .rpc();

  console.log("✅ Coordinate scanned:", tx);
  return tx;
};

export const endTurnClient = async (wallet: any, gameId: number) => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId, (program as any).programId);

  const tx = await (program as any).methods
    .endTurn()
    .accounts({
      game: gamePDA,
      player: wallet.publicKey,
    })
    .rpc();

  console.log("✅ Turn ended:", tx);
  return tx;
};

export const fetchLobbiesClient = async (wallet: any) => {
  try {
    const program = await getClientProgram(wallet);
    // fetch all accounts (requires IDL to be loaded)
    const games = await (program as any).account.pirateGame.all();
    return games;
  } catch (e) {
    console.warn("Error fetching lobbies:", e);
    return [];
  }
};

export const fetchGameStateClient = async (wallet: any, gameId: number) => {
  const program = await getClientProgram(wallet);
  const [gamePDA] = getGamePDA(gameId, (program as any).programId);

  try {
    const gameState = await (program as any).account.pirateGame.fetch(gamePDA);
    return gameState;
  } catch (error) {
    console.log(`Game ${gameId} not initialized yet`);
    return null;
  }
};
