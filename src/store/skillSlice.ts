import { type StateCreator } from "zustand/vanilla";
import { PirateGameStore, SkillSlice } from "./types";

export const createSkillSlice: StateCreator<
  PirateGameStore,
  [],
  [],
  SkillSlice
> = (set, get) => ({
  turnStartTime: null,
  decisionTime: 0,
  timerInterval: null,
  speedBonusAccumulated: 0,
  averageDecisionTimeMs: 0,
  totalMovesCount: 0,
  scannedCoordinates: new Set(),
  scanChargesRemaining: 3,

  startTurn: () => {
    const { timerInterval } = get();
    if (timerInterval) clearInterval(timerInterval as any);

    const startTime = Date.now();
    set({ turnStartTime: startTime, decisionTime: 0 });

    const interval = setInterval(() => {
      const { turnStartTime: ts } = get();
      if (ts) {
        set({ decisionTime: Date.now() - ts });
      }
    }, 100);

    set({ timerInterval: interval as any });
  },

  stopTurnTimer: () => {
    const { timerInterval } = get();
    if (timerInterval) clearInterval(timerInterval as any);
    set({ timerInterval: null, turnStartTime: null, decisionTime: 0 });
  },

  scanCoordinate: async (gameId, coordinateX, coordinateY, wallet) => {
    try {
      const { scanCoordinate, createWalletAdapter } = await import("../lib/client/transactionBuilder");
      const walletAdapter = createWalletAdapter(wallet);
      await scanCoordinate(walletAdapter, gameId, coordinateX, coordinateY);
      const state = await get().fetchGameState(gameId, wallet);
      if (state) set({ gameState: state });
      return true;
    } catch (e) {
      return false;
    }
  },

  moveShipTimed: async (gameId, shipId, toX, toY, wallet) => {
    return await get().moveShip(gameId, shipId, toX, toY, wallet, 5000);
  },

  getScannedCoordinates: () => Array.from(get().scannedCoordinates),
  isCoordinateScanned: (coordinate) => get().scannedCoordinates.has(coordinate),
});
