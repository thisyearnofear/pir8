import { StateCreator } from "zustand";
import { PirateGameStore, PracticeSlice } from "./types";
import { GameAction, Player } from "../types/game";
import { PirateGameManager } from "../lib/pirateGameEngine";
import { getVisibleCoordinates } from "../utils/helpers";

const PRACTICE_GAME_STORAGE_KEY = "pir8_practice_game";

const loadSavedPracticeGame = () => {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(PRACTICE_GAME_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (error) {
    console.error("Failed to load saved practice game:", error);
  }
  return null;
};

const savePracticeGame = (gameState: any) => {
  if (typeof window === "undefined") return;
  try {
    if (gameState) {
      localStorage.setItem(PRACTICE_GAME_STORAGE_KEY, JSON.stringify(gameState));
    } else {
      localStorage.removeItem(PRACTICE_GAME_STORAGE_KEY);
    }
  } catch (error) {
    console.error("Failed to save practice game:", error);
  }
};

export const createPracticeSlice: StateCreator<
  PirateGameStore,
  [],
  [],
  PracticeSlice
> = (set, get) => ({
  playbackSpeed: 1,
  isAIvsAIMode: false,
  currentAIReasoning: null,
  aiDecisionCallback: null,
  aiReasoningHistory: [],

  startPracticeGame: (humanPlayer, difficulty = "pirate") => {
    try {
      const savedGame = loadSavedPracticeGame();
      if (savedGame && savedGame.gameStatus !== "completed") {
        set({
          gameState: savedGame,
          gameMode: "practice",
          selectedShipId: null,
          scannedCoordinates: new Set(),
          scanChargesRemaining: 3,
          showMessage: "⚔️ Resumed your practice battle!",
        });
        setTimeout(() => set({ showMessage: null }), 3000);
        return true;
      }

      const practiceGame = PirateGameManager.createPracticeGame(humanPlayer, difficulty);
      savePracticeGame(practiceGame);

      const initialScanned = new Set<string>();
      const playerInGame = practiceGame.players.find((p) => p.publicKey === humanPlayer.publicKey);
      if (playerInGame) {
        playerInGame.ships.forEach((ship) => {
          getVisibleCoordinates(ship.position.x, ship.position.y).forEach((coord) =>
            initialScanned.add(coord)
          );
        });
      }

      set({
        gameState: practiceGame,
        gameMode: "practice",
        selectedShipId: null,
        scannedCoordinates: initialScanned,
        scanChargesRemaining: 3,
        showMessage: `⚔️ Practice mode started! Defeat ${difficulty} AI opponent!`,
      });
      setTimeout(() => set({ showMessage: null }), 3000);
      return true;
    } catch (error) {
      console.error("Failed to start practice game:", error);
      set({ error: "Failed to start practice game" });
      return false;
    }
  },

  makePracticeMove: (shipId, toX, toY) => {
    const { gameState } = get();
    if (!gameState) return false;

    const action: GameAction = {
      id: `practice_${Date.now()}`,
      gameId: gameState.gameId,
      player: gameState.players[gameState.currentPlayerIndex]?.publicKey || "",
      type: "move_ship",
      data: { shipId, toCoordinate: `${toX},${toY}` },
      timestamp: Date.now(),
    };

    const result = PirateGameManager.processTurnAction(gameState, action);
    if (result.success) {
      const advancedState = PirateGameManager.advanceTurn(result.updatedGameState);
      savePracticeGame(advancedState);

      const currentScanned = new Set(get().scannedCoordinates);
      getVisibleCoordinates(toX, toY).forEach((coord) => currentScanned.add(coord));

      set({
        gameState: advancedState,
        selectedShipId: null,
        scannedCoordinates: currentScanned,
      });

      setTimeout(() => get().processAITurn(), 1000);
      return true;
    }
    return false;
  },

  makePracticeAttack: (shipId, targetShipId) => {
    const { gameState } = get();
    if (!gameState) return false;

    const action: GameAction = {
      id: `practice_${Date.now()}`,
      gameId: gameState.gameId,
      player: gameState.players[gameState.currentPlayerIndex]?.publicKey || "",
      type: "attack",
      data: { shipId, targetShipId },
      timestamp: Date.now(),
    };

    const result = PirateGameManager.processTurnAction(gameState, action);
    if (result.success) {
      const advancedState = PirateGameManager.advanceTurn(result.updatedGameState);
      savePracticeGame(advancedState);
      set({ gameState: advancedState });

      setTimeout(() => get().processAITurn(), 1000);
      return true;
    }
    return false;
  },

  makePracticeClaim: (shipId) => {
    const { gameState } = get();
    if (!gameState) return false;

    const action: GameAction = {
      id: `practice_${Date.now()}`,
      gameId: gameState.gameId,
      player: gameState.players[gameState.currentPlayerIndex]?.publicKey || "",
      type: "claim_territory",
      data: { shipId },
      timestamp: Date.now(),
    };

    const result = PirateGameManager.processTurnAction(gameState, action);
    if (result.success) {
      const advancedState = PirateGameManager.advanceTurn(result.updatedGameState);
      savePracticeGame(advancedState);
      set({ gameState: advancedState });

      setTimeout(() => get().processAITurn(), 1000);
      return true;
    }
    return false;
  },

  processAITurn: () => {
    const {
      gameState,
      gameMode,
      isAIvsAIMode,
      playbackSpeed,
      aiDecisionCallback,
    } = get();
    if (!gameState || gameMode !== "practice") return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer?.publicKey.startsWith("AI_")) return;

    if (isAIvsAIMode && aiDecisionCallback) {
      const decision = PirateGameManager.generateAIDecision(gameState, currentPlayer);
      aiDecisionCallback(decision.reasoning);

      if (decision.action) {
        const result = PirateGameManager.processTurnAction(gameState, decision.action);
        if (result.success) {
          const advancedState = PirateGameManager.advanceTurn(result.updatedGameState);
          const newState = {
            ...advancedState,
            players: advancedState.players.map((p) => ({
              ...p,
              ships: [...p.ships],
            })),
          };

          const prevHistory = get().aiReasoningHistory || [];
          const newHistory = [decision.reasoning, ...prevHistory].slice(0, 20);
          set({
            gameState: newState,
            currentAIReasoning: decision.reasoning,
            aiReasoningHistory: newHistory,
          });

          if (newState.gameStatus === "completed") {
            const winner = newState.players.find((p) => p.publicKey === newState.winner);
            set({
              showMessage: winner
                ? `🏆 ${winner.username || "AI"} wins the battle!`
                : "🏴‍☠️ Battle concluded!",
            });
            return;
          }

          const nextPlayer = newState.players[newState.currentPlayerIndex];
          if (nextPlayer?.publicKey.startsWith("AI_")) {
            const adjustedDelay = 2000 / playbackSpeed;
            setTimeout(() => get().processAITurn(), adjustedDelay);
          }
        } else {
          const advancedState = PirateGameManager.advanceTurn(gameState);
          set({ gameState: advancedState });
          setTimeout(() => get().processAITurn(), 1000 / playbackSpeed);
        }
      } else {
        const advancedState = PirateGameManager.advanceTurn(gameState);
        set({ gameState: advancedState });
        setTimeout(() => get().processAITurn(), 1000 / playbackSpeed);
      }
    } else {
      const updatedState = PirateGameManager.processAITurn(gameState);
      if (!isAIvsAIMode) savePracticeGame(updatedState);

      const newState = {
        ...updatedState,
        players: updatedState.players.map((p) => ({
          ...p,
          ships: [...p.ships],
        })),
      };

      set({ gameState: newState });

      if (newState.gameStatus === "completed") {
        const winner = newState.players.find((p) => p.publicKey === newState.winner);
        set({
          showMessage: winner
            ? `🏆 ${winner.username || "AI"} wins the battle!`
            : "🏴‍☠️ Battle concluded!",
        });
        return;
      }

      const nextPlayer = newState.players[newState.currentPlayerIndex];
      if (nextPlayer?.publicKey.startsWith("AI_")) {
        const baseDelay = isAIvsAIMode ? 800 : 1500;
        const adjustedDelay = baseDelay / playbackSpeed;
        setTimeout(() => get().processAITurn(), adjustedDelay);
      }
    }
  },

  exitPracticeMode: () => {
    savePracticeGame(null);
    set({
      gameState: null,
      gameMode: "on-chain",
      selectedShipId: null,
      scannedCoordinates: new Set(),
      scanChargesRemaining: 3,
      isAIvsAIMode: false,
      playbackSpeed: 1,
      showMessage: "Practice session ended. Ready for real battles!",
    });
    setTimeout(() => set({ showMessage: null }), 3000);
  },

  startAIvsAIGame: (difficulty1, difficulty2, speed = 1) => {
    try {
      const aiPlayer1 = PirateGameManager.createAIPlayer("demo", difficulty1);
      const aiPlayer2 = PirateGameManager.createAIPlayer("demo", difficulty2);

      [aiPlayer1, aiPlayer2].forEach((player) => {
        player.ships = player.ships || [];
        player.controlledTerritories = player.controlledTerritories || [];
        player.scannedCoordinates = player.scannedCoordinates || [];
      });

      const demoGame = PirateGameManager.createNewGame([aiPlayer1, aiPlayer2], `ai_demo_${Date.now()}`);

      const activeGame: any = {
        ...demoGame,
        gameStatus: "active",
        players: demoGame.players.map((player) => ({
          ...player,
          ships: player.ships || [],
          controlledTerritories: player.controlledTerritories || [],
          scannedCoordinates: player.scannedCoordinates || [],
        })),
        pendingActions: demoGame.pendingActions || [],
        eventLog: demoGame.eventLog || [],
      };

      set({
        gameState: activeGame,
        gameMode: "practice",
        isAIvsAIMode: true,
        playbackSpeed: speed,
        selectedShipId: null,
        scannedCoordinates: new Set(),
        scanChargesRemaining: 3,
        showMessage: `⚔️ AI Battle: ${difficulty1} vs ${difficulty2}!`,
        aiReasoningHistory: [],
      });

      setTimeout(() => set({ showMessage: null }), 3000);
      setTimeout(() => {
        const currentState = get().gameState;
        if (currentState && get().isAIvsAIMode) {
          get().processAITurn();
        }
      }, 1000);

      return true;
    } catch (error) {
      console.error("Failed to start AI vs AI game:", error);
      set({ error: "Failed to start AI vs AI game" });
      return false;
    }
  },

  setPlaybackSpeed: (speed) => set({ playbackSpeed: Math.max(0.5, Math.min(8, speed)) }),
  getPlaybackSpeed: () => get().playbackSpeed,
  setAIDecisionCallback: (callback) => set({ aiDecisionCallback: callback }),
});
