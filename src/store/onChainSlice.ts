import { type StateCreator } from "zustand/vanilla";
import { PirateGameStore, OnChainSlice } from "./types";
import { GameState, OnChainGameMode, Player } from "../types/game";

export const createOnChainSlice: StateCreator<
  PirateGameStore,
  [],
  [],
  OnChainSlice
> = (set, get) => {
  const createWalletAdapterOrNull = async (wallet?: any) => {
    if (!wallet) return null;
    const { createWalletAdapter } = await import("../lib/client/transactionBuilder");
    return createWalletAdapter(wallet);
  };

  const refreshLobbiesState = async (wallet?: any) => {
    const { SOLANA_CONFIG } = await import("../utils/constants");
    if (!SOLANA_CONFIG.PROGRAM_ID) {
      console.warn("SOLANA_CONFIG.PROGRAM_ID is not set");
      set({ lobbies: [] });
      return [];
    }

    const { fetchLobbies: fetchLobbiesFromChain } = await import(
      "../lib/client/transactionBuilder"
    );

    let walletAdapter;
    if (wallet) {
      walletAdapter = await createWalletAdapterOrNull(wallet);
    } else {
      const { Connection } = await import("@solana/web3.js");
      const connection = new Connection(
        SOLANA_CONFIG.RPC_URL || "https://api.devnet.solana.com",
        "confirmed"
      );
      walletAdapter = { connection, publicKey: null } as any;
    }

    const games = await fetchLobbiesFromChain(walletAdapter as any);
    const lobbies = games.map((g: any) => ({
      address: g.publicKey.toBase58(),
      gameId: g.account?.gameId?.toNumber?.() || null,
      authority: g.account?.authority?.toBase58?.() || null,
      status: g.account?.status,
      playerCount: g.account?.playerCount || 0,
      maxPlayers: 4,
      mode: g.account?.mode,
      players: g.account?.players?.map((p: any) => p.pubkey?.toBase58?.()) || [],
    }));

    set({ lobbies });
    return lobbies;
  };

  const refreshGameState = async (
    gameId: number,
    wallet: any,
  ): Promise<GameState | null> => {
    const walletAdapter = await createWalletAdapterOrNull(wallet);
    if (!walletAdapter) {
      throw new Error("Wallet is required to refresh game state");
    }

    const { fetchGameState } = await import("../lib/client/transactionBuilder");
    const onChainState = await fetchGameState(walletAdapter, Number(gameId));
    if (!onChainState) return null;

    const { mapOnChainToLocal } = await import("../utils/helpers");
    const localState = mapOnChainToLocal(onChainState, gameId.toString());
    set({ gameState: localState });
    return localState;
  };

  const withOnChainAction = async <T>(
    action: () => Promise<T>,
    options?: {
      gameId?: number;
      wallet?: any;
      refreshLobbies?: boolean;
      errorMessage?: string;
    },
  ): Promise<T> => {
    set({ isLoading: true, error: null });

    try {
      const result = await action();

      if (options?.gameId !== undefined && options.wallet) {
        await refreshGameState(options.gameId, options.wallet);
      }

      if (options?.refreshLobbies) {
        await refreshLobbiesState(options.wallet);
      }

      set({ isLoading: false });
      return result;
    } catch (error) {
      set({
        error: options?.errorMessage || "On-chain action failed",
        isLoading: false,
      });
      throw error;
    }
  };

  return {
    lobbies: [],

    fetchLobbies: async (wallet?: any) => {
      try {
        set({ isLoading: true });
        await refreshLobbiesState(wallet);
        set({ isLoading: false });
      } catch (error) {
        console.warn("Failed to fetch lobbies:", error);
        set({ lobbies: [], isLoading: false });
      }
    },

    fetchGameState: async (
      gameId: number,
      wallet: any,
    ): Promise<GameState | null> => {
      try {
        return await refreshGameState(gameId, wallet);
      } catch {
        return null;
      }
    },

    startGame: async (gameId: number, wallet: any): Promise<boolean> => {
      try {
        const walletAdapter = await createWalletAdapterOrNull(wallet);
        if (!walletAdapter) throw new Error("Wallet not connected");

        const { startGame } = await import("../lib/client/transactionBuilder");
        await withOnChainAction(
          () => startGame(walletAdapter, gameId),
          {
            gameId,
            wallet,
            refreshLobbies: true,
            errorMessage: "Failed to start game",
          },
        );
        return true;
      } catch (error) {
        console.error("[pir8] startGame failed:", error);
        return false;
      }
    },

    createGame: async (
      gameId: number,
      _players: Player[],
      _entryFee: number,
      wallet: any,
    ): Promise<boolean> => {
      try {
        const walletAdapter = await createWalletAdapterOrNull(wallet);
        if (!walletAdapter) throw new Error("Wallet not connected");

        const { createGame } = await import("../lib/client/transactionBuilder");
        await withOnChainAction(
          () => createGame(walletAdapter, gameId, "Casual"),
          {
            gameId,
            wallet,
            refreshLobbies: true,
            errorMessage: "Failed to create game",
          },
        );
        return true;
      } catch (error) {
        console.error("[pir8] createGame failed:", error);
        return false;
      }
    },

    joinGame: async (
      gameId: string | number,
      _player: Player,
      wallet: any,
    ): Promise<boolean> => {
      try {
        const gId =
          typeof gameId === "string"
            ? parseInt(gameId.replace("onchain_", ""), 10)
            : gameId;
        const walletAdapter = await createWalletAdapterOrNull(wallet);
        if (!walletAdapter) throw new Error("Wallet not connected");

        const { joinGame } = await import("../lib/client/transactionBuilder");
        await withOnChainAction(
          () => joinGame(walletAdapter, Number(gId)),
          {
            gameId: Number(gId),
            wallet,
            refreshLobbies: true,
            errorMessage: "Failed to join game",
          },
        );
        return true;
      } catch (error) {
        console.error("[pir8] joinGame failed:", error);
        return false;
      }
    },

    findOrCreateGame: async (
      mode: OnChainGameMode,
      _player: Player,
      wallet: any,
    ): Promise<boolean> => {
      try {
        if (mode === "AgentArena") {
          const { getAgentMatchmaker } = await import("../lib/agent-matchmaker");
          const matchmaker = getAgentMatchmaker();
          const agentLobbies = matchmaker
            .getActiveLobbies()
            .filter((l) => l.gameType === "ranked");

          const targetLobby = agentLobbies[0];
          if (targetLobby) {
            return await get().joinGame(targetLobby.gameId, _player, wallet);
          }
        }

        const newGameId = Math.floor(Date.now() / 1000);
        console.log(
          `No match found, creating game ${newGameId} in mode ${mode}...`,
        );

        const walletAdapter = await createWalletAdapterOrNull(wallet);
        if (!walletAdapter) throw new Error("Wallet not connected");
        const { createGame } = await import("../lib/client/transactionBuilder");

        await withOnChainAction(
          () => createGame(walletAdapter, newGameId, mode),
          {
            gameId: newGameId,
            wallet,
            refreshLobbies: true,
            errorMessage: "Failed to find or create game",
          },
        );

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },

    moveShip: async (
      gameId: number,
      shipId: string,
      toX: number,
      toY: number,
      wallet: any,
      _decisionTimeMs?: number,
    ): Promise<boolean> => {
      try {
        const walletAdapter = await createWalletAdapterOrNull(wallet);
        if (!walletAdapter) throw new Error("Wallet not connected");
        const { moveShip } = await import("../lib/client/transactionBuilder");
        await withOnChainAction(
          () => moveShip(walletAdapter, gameId, shipId, toX, toY),
          { gameId, wallet, errorMessage: "Move failed" },
        );
        return true;
      } catch {
        return false;
      }
    },

    attackWithShip: async (
      gameId: number,
      shipId: string,
      targetShipId: string,
      wallet: any,
    ): Promise<boolean> => {
      try {
        const walletAdapter = await createWalletAdapterOrNull(wallet);
        if (!walletAdapter) throw new Error("Wallet not connected");
        const { attackShip } = await import("../lib/client/transactionBuilder");
        await withOnChainAction(
          () => attackShip(walletAdapter, gameId, shipId, targetShipId),
          { gameId, wallet, errorMessage: "Attack failed" },
        );
        return true;
      } catch {
        return false;
      }
    },

    claimTerritory: async (
      gameId: number,
      shipId: string,
      wallet: any,
    ): Promise<boolean> => {
      try {
        const state = get().gameState;
        if (!state) {
          throw new Error("No game state");
        }

        const ship = state.players
          .flatMap((p: any) => p.ships)
          .find((s: any) => s.id === shipId);

        if (!ship) {
          throw new Error("Ship not found");
        }

        const walletAdapter = await createWalletAdapterOrNull(wallet);
        if (!walletAdapter) throw new Error("Wallet not connected");
        const { claimTerritory } = await import(
          "../lib/client/transactionBuilder"
        );
        await withOnChainAction(
          () => claimTerritory(walletAdapter, gameId, shipId),
          { gameId, wallet, errorMessage: "Claim failed" },
        );
        return true;
      } catch {
        return false;
      }
    },

    collectResources: async (gameId: number, wallet: any): Promise<boolean> => {
      try {
        const walletAdapter = await createWalletAdapterOrNull(wallet);
        if (!walletAdapter) throw new Error("Wallet not connected");
        const { collectResources } = await import(
          "../lib/client/transactionBuilder"
        );
        await withOnChainAction(
          () => collectResources(walletAdapter, gameId),
          { gameId, wallet, errorMessage: "Collection failed" },
        );
        return true;
      } catch {
        return false;
      }
    },

    buildShip: async (
      gameId: number,
      shipType: string,
      portX: number,
      portY: number,
      wallet: any,
    ): Promise<boolean> => {
      try {
        const walletAdapter = await createWalletAdapterOrNull(wallet);
        if (!walletAdapter) throw new Error("Wallet not connected");
        const { buildShip } = await import("../lib/client/transactionBuilder");
        await withOnChainAction(
          () => buildShip(walletAdapter, gameId, shipType as any, portX, portY),
          { gameId, wallet, errorMessage: "Build failed" },
        );
        return true;
      } catch {
        return false;
      }
    },

    endTurn: async (gameId: number, wallet: any) => {
      try {
        const walletAdapter = await createWalletAdapterOrNull(wallet);
        if (!walletAdapter) throw new Error("Wallet not connected");
        const { endTurn } = await import("../lib/client/transactionBuilder");
        await withOnChainAction(
          () => endTurn(walletAdapter, gameId),
          { gameId, wallet, errorMessage: "Failed to end turn" },
        );
      } catch {
        // Keep silent behavior consistent with previous implementation.
      }
    },
  };
};
