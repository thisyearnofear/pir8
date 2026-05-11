import { type StateCreator } from "zustand/vanilla";
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
      const onChainState = await fetchGameState(walletAdapter, Number(get().gameState?.gameId || 0));
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
      const { startGame, createWalletAdapter } = await import("../lib/client/transactionBuilder");
      const walletAdapter = createWalletAdapter(wallet);
      await startGame(walletAdapter, gameId);

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
      const { createGame, createWalletAdapter } = await import("../lib/client/transactionBuilder");
      const walletAdapter = createWalletAdapter(wallet);
      await createGame(walletAdapter, gameId, "Casual");

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

      const { joinGame, createWalletAdapter } = await import("../lib/client/transactionBuilder");
      const walletAdapter = createWalletAdapter(wallet);
      await joinGame(walletAdapter, Number(gameId));

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
      
      // Check for Agent Arena match if mode is AgentArena
      if (mode === "AgentArena") {
        const { getAgentMatchmaker } = await import("../lib/agent-matchmaker");
        const matchmaker = getAgentMatchmaker();
        
        // Find existing lobbies for Agent Arena
        const agentLobbies = matchmaker.getActiveLobbies().filter(l => l.gameType === "ranked");
        if (agentLobbies.length > 0) {
          const targetLobby = agentLobbies[0];
          if (targetLobby) {
            const { joinGame } = await import("../lib/client/transactionBuilder");
            await joinGame(wallet, targetLobby.gameId);
            // ... load state
            return true;
          }
        }
      }

      const {
        fetchGameState: _fetchGameState,
        fetchLobbies,
        joinGame: _joinGame,
      } = await import("../lib/client/transactionBuilder");
      const { mapOnChainToLocal: _mapOnChainToLocal } = await import("../utils/helpers");

      const _allGames = await fetchLobbies(wallet);
      // ... existing match logic
      
      const newGameId = Math.floor(Date.now() / 1000);
      console.log(
        `No match found, creating game ${newGameId} in mode ${mode}...`,
      );
      const { createGame, createWalletAdapter } = await import("../lib/client/transactionBuilder");
      const walletAdapter = createWalletAdapter(wallet);
      await createGame(walletAdapter, newGameId, mode);
      // ... load state
      
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
      const { moveShip, createWalletAdapter } = await import("../lib/client/transactionBuilder");
      const walletAdapter = createWalletAdapter(wallet);
      await moveShip(walletAdapter, gameId, shipId, toX, toY);

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
      const { attackShip, createWalletAdapter } = await import("../lib/client/transactionBuilder");
      const walletAdapter = createWalletAdapter(wallet);
      await attackShip(walletAdapter, gameId, shipId, targetShipId);

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
      await claimTerritory(walletAdapter, gameId, shipId);

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
      await collectResources(walletAdapter, gameId);

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
      await buildShip(walletAdapter, gameId, shipType as any, portX, portY);

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
      const { endTurn, createWalletAdapter } = await import("../lib/client/transactionBuilder");
      const walletAdapter = createWalletAdapter(wallet);
      await endTurn(walletAdapter, gameId);
      const state = await get().fetchGameState(gameId, wallet);
      if (state) set({ gameState: state });
    } catch (e) { }
  },
});
