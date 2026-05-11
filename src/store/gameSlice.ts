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
    const { gameState } = get();
    if (!gameState || gameState.gameStatus !== "active" || !walletPk) return false;
    const current = gameState.players[gameState.currentPlayerIndex];
    return current?.publicKey === walletPk;
  },

  getAllShips: () => {
    const { gameState } = get();
    if (!gameState) return [];
    return gameState.players.flatMap((p) => p.ships).filter((s) => s.health > 0);
  },
});
