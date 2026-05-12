import { useCallback, useEffect } from "react";
import type { Player } from "@/types/game";

export type PracticeDifficulty = "novice" | "pirate" | "captain" | "admiral";

interface UsePracticeModeControllerOptions {
  publicKey?: { toString(): string } | null;
  startPracticeGame: (player: Player, difficulty: PracticeDifficulty) => boolean;
  startAIvsAIGame: (
    difficulty1: PracticeDifficulty,
    difficulty2: PracticeDifficulty,
    speed: number,
  ) => boolean;
  makePracticeMove: (shipId: string, x: number, y: number) => boolean;
  makePracticeAttack: (shipId: string, targetShipId: string) => boolean;
  makePracticeClaim: (shipId: string) => boolean;
  isAIvsAIMode: boolean;
  setAIDecisionCallback: (callback: (() => void) | null) => void;
  setShowPracticeMenu: (value: boolean) => void;
  handleGameEvent: (message: string) => void;
}

export function usePracticeModeController({
  publicKey,
  startPracticeGame,
  startAIvsAIGame,
  makePracticeMove,
  makePracticeAttack,
  makePracticeClaim,
  isAIvsAIMode,
  setAIDecisionCallback,
  setShowPracticeMenu,
  handleGameEvent,
}: UsePracticeModeControllerOptions) {
  const handleStartPractice = useCallback(
    (difficulty: PracticeDifficulty) => {
      const practicePlayer: Player = {
        publicKey: publicKey?.toString() || `guest_${Date.now()}`,
        username: publicKey ? undefined : "Guest Pirate",
        resources: {
          gold: 1000,
          crew: 50,
          cannons: 10,
          supplies: 100,
          wood: 0,
          rum: 0,
        },
        ships: [],
        controlledTerritories: [],
        totalScore: 0,
        isActive: true,
        scanCharges: 3,
        scannedCoordinates: [],
        speedBonusAccumulated: 0,
        averageDecisionTimeMs: 0,
        totalMoves: 0,
        consecutiveAttacks: 0,
        lastActionWasAttack: false,
      };

      const success = startPracticeGame(practicePlayer, difficulty);
      if (success) {
        setShowPracticeMenu(false);
        handleGameEvent(`⚔️ Practice mode: ${difficulty} AI opponent!`);
      }
    },
    [publicKey, startPracticeGame, setShowPracticeMenu, handleGameEvent],
  );

  const handleStartAIBattle = useCallback(
    (difficulty1: string, difficulty2: string, speed: number) => {
      const success = startAIvsAIGame(
        difficulty1 as PracticeDifficulty,
        difficulty2 as PracticeDifficulty,
        speed,
      );
      if (success) {
        handleGameEvent(`⚔️ AI Battle: ${difficulty1} vs ${difficulty2}!`);
      }
    },
    [startAIvsAIGame, handleGameEvent],
  );

  useEffect(() => {
    if (isAIvsAIMode) {
      setAIDecisionCallback(() => {});
    } else {
      setAIDecisionCallback(null);
    }
    return () => {
      setAIDecisionCallback(null);
    };
  }, [isAIvsAIMode, setAIDecisionCallback]);

  const handlePracticeMove = useCallback(
    async (shipId: string, coordinate: string) => {
      const [x, y] = coordinate.split(",").map(Number);
      const success = makePracticeMove(shipId, x ?? 0, y ?? 0);
      if (success) {
        setTimeout(() => handleGameEvent("Ship moved!"), 50);
      }
      return success;
    },
    [makePracticeMove, handleGameEvent],
  );

  const handlePracticeAttack = useCallback(
    async (shipId: string, targetShipId: string) => {
      const success = makePracticeAttack(shipId, targetShipId);
      if (success) {
        handleGameEvent("⚔️ Attack launched!");
      }
      return success;
    },
    [makePracticeAttack, handleGameEvent],
  );

  const handlePracticeClaim = useCallback(
    async (shipId: string) => {
      const success = makePracticeClaim(shipId);
      if (success) {
        handleGameEvent("🏴‍☠️ Territory claimed!");
      }
      return success;
    },
    [makePracticeClaim, handleGameEvent],
  );

  return {
    handleStartPractice,
    handleStartAIBattle,
    handlePracticeMove,
    handlePracticeAttack,
    handlePracticeClaim,
  };
}
