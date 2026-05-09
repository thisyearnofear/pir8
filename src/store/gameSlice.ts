import { StateCreator } from "zustand";
import { PirateGameStore, GameSlice } from "./types";
import { GameMode, GameState, Player, Ship } from "../types/game";

export const createGameSlice: StateCreator<
  PirateGameStore,
  [],
  [],
  GameSlice
> = (set, get) => ({
  gameState: null,
  gameMode: "on-chain" as GameMode,
  isLoading: false,
  error: null,
  showMessage: null,
  selectedShipId: null,

  setGameState: (gameState: GameState | null) => set({ gameState }),
  setGameMode: (mode: GameMode) => set({ gameMode: mode }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  setMessage: (message: string | null) => set({ showMessage: message }),
  clearError: () => set({ error: null }),
  selectShip: (shipId: string | null) => set({ selectedShipId: shipId }),

  getCurrentPlayer: () => {
    const { gameState } = get();
    if (!gameState || gameState.players.length === 0) return null;
    return gameState.players[gameState.currentPlayerIndex] || null;
  },

  getMyShips: (playerPK: string) => {
    const { gameState } = get();
    if (!gameState) return [];

    const player = gameState.players.find((p) => p.publicKey === playerPK);
    return player?.ships.filter((ship) => ship.health > 0) || [];
  },

  isMyTurn: (walletPk?: string) => {
    const { gameState } = get();
    if (!gameState || gameState.gameStatus !== "active") return false;
    if (!walletPk) return false;
    const current = gameState.players[gameState.currentPlayerIndex];
    return current?.publicKey === walletPk;
  },

  getAllShips: () => {
    const { gameState } = get();
    if (!gameState) return [];

    return gameState.players
      .flatMap((player) => player.ships)
      .filter((ship) => ship.health > 0);
  },
});
