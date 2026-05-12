import { create } from "zustand/react";
import { useShallow } from "zustand/react/shallow";
import { PirateGameStore } from "./types";
import { createGameSlice } from "./gameSlice";
import { createOnChainSlice } from "./onChainSlice";
import { createPracticeSlice } from "./practiceSlice";
import { createSkillSlice } from "./skillSlice";

export const usePirateGameStore = create<PirateGameStore>((...a) => ({
  ...createGameSlice(...a),
  ...createOnChainSlice(...a),
  ...createPracticeSlice(...a),
  ...createSkillSlice(...a),
}));

export const usePirateGame = () => usePirateGameStore((state) => state);
export const usePirateGameState = usePirateGameStore;

// Focused Selectors
export const useMatchState = () =>
  usePirateGameStore(
    useShallow((state) => ({
      gameState: state.gameState,
      gameMode: state.gameMode,
      isLoading: state.isLoading,
    })),
  );

export const usePlayerState = () =>
  usePirateGameStore(
    useShallow((state) => ({
      isMyTurn: state.isMyTurn,
      getAllShips: state.getAllShips,
      getCurrentPlayer: state.getCurrentPlayer,
      getMyShips: state.getMyShips,
    })),
  );

export const useActionState = () =>
  usePirateGameStore(
    useShallow((state) => ({
      selectedShipId: state.selectedShipId,
      selectShip: state.selectShip,
      moveShip: state.moveShip,
      attackWithShip: state.attackWithShip,
      claimTerritory: state.claimTerritory,
      collectResources: state.collectResources,
      buildShip: state.buildShip,
      scanCoordinate: state.scanCoordinate,
      isCoordinateScanned: state.isCoordinateScanned,
    })),
  );

export const useNotificationState = () =>
  usePirateGameStore(
    useShallow((state) => ({
      error: state.error,
      showMessage: state.showMessage,
      setError: state.setError,
      setMessage: state.setMessage,
      clearError: state.clearError,
    })),
  );

export const usePracticeState = () =>
  usePirateGameStore(
    useShallow((state) => ({
      startPracticeGame: state.startPracticeGame,
      makePracticeMove: state.makePracticeMove,
      makePracticeAttack: state.makePracticeAttack,
      makePracticeClaim: state.makePracticeClaim,
      exitPracticeMode: state.exitPracticeMode,
      processAITurn: state.processAITurn,
    })),
  );

export const useGameShellState = () =>
  usePirateGameStore(
    useShallow((state) => ({
      gameState: state.gameState,
      gameMode: state.gameMode,
      isLoading: state.isLoading,
      error: state.error,
      showMessage: state.showMessage,
      selectedShipId: state.selectedShipId,
      joinGame: state.joinGame,
      findOrCreateGame: state.findOrCreateGame,
      moveShip: state.moveShip,
      attackWithShip: state.attackWithShip,
      claimTerritory: state.claimTerritory,
      collectResources: state.collectResources,
      selectShip: state.selectShip,
      setMessage: state.setMessage,
      clearError: state.clearError,
      isMyTurn: state.isMyTurn,
      getAllShips: state.getAllShips,
      startTurn: state.startTurn,
      startPracticeGame: state.startPracticeGame,
      makePracticeMove: state.makePracticeMove,
      makePracticeAttack: state.makePracticeAttack,
      makePracticeClaim: state.makePracticeClaim,
      exitPracticeMode: state.exitPracticeMode,
    })),
  );

export const useAIBattleState = () =>
  usePirateGameStore(
    useShallow((state) => ({
      startAIvsAIGame: state.startAIvsAIGame,
      isAIvsAIMode: state.isAIvsAIMode,
      setPlaybackSpeed: state.setPlaybackSpeed,
      getPlaybackSpeed: state.getPlaybackSpeed,
      setAIDecisionCallback: state.setAIDecisionCallback,
      aiReasoningHistory: state.aiReasoningHistory,
    })),
  );

export const useOnChainActions = () =>
  usePirateGameStore(
    useShallow((state) => ({
      fetchLobbies: state.fetchLobbies,
      createGame: state.createGame,
      joinGame: state.joinGame,
      startGame: state.startGame,
      fetchGameState: state.fetchGameState,
      findOrCreateGame: state.findOrCreateGame,
    })),
  );
