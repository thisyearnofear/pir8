import { StateCreator } from "zustand/vanilla";
import { PirateGameStore, GameSlice } from "./types";

export const createGameSlice: StateCreator<PirateGameStore, [], [], GameSlice> = (set, get) => ({
  gameState: null,
  gameMode: "on-chain",
  isLoading: false,
  error: null,
  showMessage: null,
  selectedShipId: null,

  setGameState: (gameState) => set({ gameState }),
  setGameMode: (mode) => set({ gameMode: mode }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setMessage: (message) => set({ showMessage: message }),
  clearError: () => set({ error: null }),
  selectShip: (shipId) => set({ selectedShipId: shipId }),

  getCurrentPlayer: () => {
    const { gameState } = get();
    if (!gameState || gameState.players.length === 0) return null;
    return gameState.players[gameState.currentPlayerIndex] || null;
  },

  getMyShips: (playerPK) => {
    const { gameState } = get();
    if (!gameState) return [];
    return gameState.players.find((p) => p.publicKey === playerPK)?.ships.filter((s) => s.health > 0) || [];
  },

  isMyTurn: (walletPk) => {
    const { gameState, gameMode } = get();
    if (!gameState || gameState.gameStatus !== "active") return false;
    const current = gameState.players[gameState.currentPlayerIndex];
    if (!current) return false;
    // Practice turn ownership is game-state-derived: the helm is yours whenever
    // a non-AI player holds it. Guest practice has no wallet at all.
    if (gameMode === "practice") return !current.publicKey.startsWith("AI_");
    if (!walletPk) return false;
    return current.publicKey === walletPk;
  },

  // The player the UI is operated by — stable across turns. Not to be confused
  // with getCurrentPlayer(), which answers *whose turn it is* and flips to the
  // opponent during their watch.
  getMyPlayer: (walletPk) => {
    const { gameState, gameMode } = get();
    if (!gameState) return null;
    if (gameMode === "practice") {
      return gameState.players.find((p) => !p.publicKey.startsWith("AI_")) || null;
    }
    if (!walletPk) return null;
    return gameState.players.find((p) => p.publicKey === walletPk) || null;
  },

  getAllShips: () => {
    const { gameState } = get();
    if (!gameState) return [];
    return gameState.players.flatMap((p) => p.ships).filter((s) => s.health > 0);
  },
});
