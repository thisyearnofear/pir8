import { StateCreator } from "zustand";
import { PirateGameStore, OnChainSlice } from "./types";
import { GameState, OnChainGameMode, Player } from "../types/game";

export const createOnChainSlice: StateCreator<
  PirateGameStore,
  [],
  [],
  OnChainSlice
> = (set, get) => ({
  lobbies: [],

  fetchLobbies: async (wallet?: any) => {
    try {
      set({ isLoading: true });

      const { SOLANA_CONFIG } = await import("../utils/constants");
      if (!SOLANA_CONFIG.PROGRAM_ID) {
        console.warn("SOLANA_CONFIG.PROGRAM_ID is not set");
        set({ lobbies: [], isLoading: false });
        return;
      }

      const { fetchLobbies: fetchLobbiesFromChain, createWalletAdapter } = await import(
        "../lib/client/transactionBuilder"
      );

      let walletAdapter;
      if (wallet) {
        walletAdapter = createWalletAdapter(wallet);
      } else {
        const { Connection } = await import("@solana/web3.js");
        const connection = new Connection(
          SOLANA_CONFIG.RPC_URL || "https://api.devnet.solana.com",
          "confirmed"
        );
        walletAdapter = { connection, publicKey: null } as any;
      }

      const games = await fetchLobbiesFromChain(walletAdapter);

      const lobbies = games.map((g: any) => ({
        address: g.publicKey.toBase58(),
        gameId: g.account?.gameId?.toNumber?.() || null,
        authority: g.account?.authority?.toBase58?.() || null,
        status: g.account?.status,
        playerCount: g.account?.playerCount || 0,
        maxPlayers: g.account?.maxPlayers || 2,
        mode: g.account?.mode,
        players: g.account?.players?.map((p: any) => p.pubkey?.toBase58?.()) || [],
      }));

      set({ lobbies, isLoading: false });
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
      const { fetchGameState, createWalletAdapter } = await import(
        "../lib/client/transactionBuilder"
      );
      const walletAdapter = createWalletAdapter(wallet);
      const onChainState = await fetchGameState(walletAdapter);
      if (!onChainState) return null;

      const { mapOnChainToLocal } = await import("../utils/helpers");
      return mapOnChainToLocal(onChainState, gameId.toString());
    } catch (e) {
      return null;
    }
  },

  startGame: async (gameId: number, wallet: any): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });
      const { startGame } = await import("../lib/client/transactionBuilder");
      await startGame(wallet);

      const state = await get().fetchGameState(gameId, wallet);
      if (state) set({ gameState: state });

      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: "Failed to start game", isLoading: false });
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
      set({ isLoading: true, error: null });
      const { initializeGame } = await import("../lib/client/transactionBuilder");
      await initializeGame(wallet);

      const state = await get().fetchGameState(gameId, wallet);
      if (state) set({ gameState: state });

      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: "Failed to create game", isLoading: false });
      return false;
    }
  },

  joinGame: async (
    gameId: string | number,
    _player: Player,
    wallet: any,
  ): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });
      const gId =
        typeof gameId === "string"
          ? parseInt(gameId.replace("onchain_", ""), 10)
          : gameId;

      const { joinGame } = await import("../lib/client/transactionBuilder");
      await joinGame(wallet);

      const state = await get().fetchGameState(gId, wallet);
      if (state) set({ gameState: state });

      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: "Failed to join game", isLoading: false });
      return false;
    }
  },

  findOrCreateGame: async (
    mode: OnChainGameMode,
    _player: Player,
    wallet: any,
  ): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });
      const {
        initializeGame,
        fetchGameState,
        fetchLobbies,
        joinGame,
      } = await import("../lib/client/transactionBuilder");
      const { mapOnChainToLocal } = await import("../utils/helpers");

      const allGames = await fetchLobbies(wallet);

      const matches = allGames.filter((g: any) => {
        const acc = g.account;
        if (!acc) return false;

        const isWaiting =
          (acc.status && acc.status.waiting !== undefined) ||
          (acc.status && Object.keys(acc.status)[0] === "waiting");

        const modeKeys = acc.mode ? Object.keys(acc.mode) : [];
        const firstKey = modeKeys[0];
        const accModeKey = firstKey ? firstKey.toLowerCase() : "casual";
        const desiredModeKey =
          mode.toLowerCase() === "agentarena"
            ? "agentarena"
            : mode.toLowerCase();

        const modeMatch =
          accModeKey === desiredModeKey ||
          (accModeKey === "agent_arena" && desiredModeKey === "agentarena");

        const hasSpace = (acc.playerCount || 0) < 4;

        return isWaiting && modeMatch && hasSpace;
      });

      if (matches.length > 0) {
        matches.sort(
          (a: any, b: any) =>
            (b.account?.playerCount || 0) - (a.account?.playerCount || 0),
        );

        const bestMatch = matches[0];
        const matchId = bestMatch.account.gameId.toNumber();

        console.log(`Found matching game ${matchId}, joining...`);
        await joinGame(wallet, matchId);

        const onChainState = await fetchGameState(wallet, matchId);
        if (onChainState) {
          const mappedState = mapOnChainToLocal(
            onChainState,
            matchId.toString(),
          );
          set({ gameState: mappedState });
        }
      } else {
        const newGameId = Math.floor(Date.now() / 1000);
        console.log(
          `No match found, creating game ${newGameId} in mode ${mode}...`,
        );
        await initializeGame(wallet);

        const onChainState = await fetchGameState(wallet, newGameId);
        if (onChainState) {
          const mappedState = mapOnChainToLocal(
            onChainState,
            newGameId.toString(),
          );
          set({ gameState: mappedState });
        }
      }

      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error(error);
      set({ error: "Failed to find or create game", isLoading: false });
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
      set({ isLoading: true, error: null });
      const { moveShip } = await import("../lib/client/transactionBuilder");
      await moveShip(wallet, shipId, toX, toY);

      const state = await get().fetchGameState(gameId, wallet);
      if (state) set({ gameState: state });
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: "Move failed", isLoading: false });
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
      set({ isLoading: true, error: null });
      const { attackShip } = await import("../lib/client/transactionBuilder");
      await attackShip(wallet, shipId, targetShipId);

      const state = await get().fetchGameState(gameId, wallet);
      if (state) set({ gameState: state });
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: "Attack failed", isLoading: false });
      return false;
    }
  },

  claimTerritory: async (
    gameId: number,
    shipId: string,
    wallet: any,
  ): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });
      
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
      
      const { claimTerritory, createWalletAdapter } = await import(
        "../lib/client/transactionBuilder"
      );
      const walletAdapter = createWalletAdapter(wallet);
      await claimTerritory(walletAdapter, shipId, ship.position.x, ship.position.y);

      const newState = await get().fetchGameState(gameId, wallet);
      if (newState) set({ gameState: newState });
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: "Claim failed", isLoading: false });
      return false;
    }
  },

  collectResources: async (gameId: number, wallet: any): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });
      const { collectResources, createWalletAdapter } = await import(
        "../lib/client/transactionBuilder"
      );
      const walletAdapter = createWalletAdapter(wallet);
      await collectResources(walletAdapter, 0, 0);

      const state = await get().fetchGameState(gameId, wallet);
      if (state) set({ gameState: state });
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: "Collection failed", isLoading: false });
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
      set({ isLoading: true, error: null });
      const { buildShip, createWalletAdapter } = await import("../lib/client/transactionBuilder");
      const walletAdapter = createWalletAdapter(wallet);
      await buildShip(walletAdapter, shipType as any, portX, portY);

      const state = await get().fetchGameState(gameId, wallet);
      if (state) set({ gameState: state });
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: "Build failed", isLoading: false });
      return false;
    }
  },

  endTurn: async (gameId: number, wallet: any) => {
    try {
      const { endTurn } = await import("../lib/client/transactionBuilder");
      await endTurn(wallet);
      const state = await get().fetchGameState(gameId, wallet);
      if (state) set({ gameState: state });
    } catch (e) { }
  },
});
