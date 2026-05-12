import { useCallback, useState, useMemo } from "react";
import type { PublicKey } from "@solana/web3.js";
import { createPlayerFromWallet } from "@/lib/playerHelper";

interface UseMatchFlowControllerOptions {
  publicKey?: PublicKey | null;
  wallet?: unknown;
  gameId?: string | number;
  collectResources: (gameId: number, wallet: unknown) => Promise<boolean>;
  findOrCreateGame: (
    mode: "Casual" | "Competitive" | "AgentArena",
    player: ReturnType<typeof createPlayerFromWallet>,
    wallet: unknown,
  ) => Promise<boolean>;
  joinGame: (
    gameId: string | number,
    player: ReturnType<typeof createPlayerFromWallet>,
    wallet: unknown,
  ) => Promise<boolean>;
  handleGameEvent: (message: string) => void;
  handleGameError: (error: unknown, context: string) => void;
  setShowModeSelect: (value: boolean) => void;
}

export function useMatchFlowController({
  publicKey,
  wallet,
  gameId,
  collectResources,
  findOrCreateGame,
  joinGame,
  handleGameEvent,
  handleGameError,
  setShowModeSelect,
}: UseMatchFlowControllerOptions) {
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | undefined>();

  const handleCollectResources = useCallback(async () => {
    if (!wallet || gameId === undefined || gameId === null) return false;
    try {
      const success = await collectResources(Number(gameId), wallet);
      if (success) {
        handleGameEvent("💰 Resources collected from territories!");
      }
      return success;
    } catch (error) {
      console.error("Resource collection failed:", error);
      return false;
    }
  }, [collectResources, gameId, handleGameEvent, wallet]);

  const handleNewGame = useCallback(async () => {
    if (!publicKey || !wallet) return;
    try {
      const player = createPlayerFromWallet(publicKey);
      await findOrCreateGame("Casual", player, wallet);
      handleGameEvent("🏴‍☠️ New battle begins!");
    } catch (error) {
      handleGameError(error, "create new game");
    }
  }, [findOrCreateGame, handleGameError, handleGameEvent, publicKey, wallet]);

  const handleReturnToLobby = useCallback(() => {
    handleGameEvent("Returning to lobby...");
  }, [handleGameEvent]);

  const handleCreateGame = useCallback(async () => {
    if (!publicKey || !wallet) {
      setJoinError("Please connect your wallet first");
      return;
    }
    setShowModeSelect(true);
  }, [publicKey, setShowModeSelect, wallet]);

  const handleModeSelected = useCallback(
    async (mode: "Casual" | "Competitive" | "AgentArena") => {
      if (!publicKey || !wallet) return;

      setShowModeSelect(false);
      setIsCreatingGame(true);
      setJoinError(undefined);

      try {
        const player = createPlayerFromWallet(publicKey);
        const success = await findOrCreateGame(mode, player, wallet);

        if (!success) {
          throw new Error("Failed to create battle arena");
        }

        handleGameEvent(`🏴‍☠️ ${mode} Arena created! Waiting for opponents...`);
      } catch (error) {
        console.error("Failed to create arena:", error);
        setJoinError(
          error instanceof Error
            ? error.message
            : "Failed to create battle arena",
        );
      } finally {
        setIsCreatingGame(false);
      }
    },
    [findOrCreateGame, handleGameEvent, publicKey, setShowModeSelect, wallet],
  );

  const handleJoinGame = useCallback(
    async (gameIdInput: string): Promise<boolean> => {
      if (!publicKey || !wallet) {
        setJoinError("Please connect your wallet first");
        return false;
      }

      setIsJoining(true);
      setJoinError(undefined);

      try {
        const gameIdNum = parseInt(gameIdInput, 10);
        if (isNaN(gameIdNum)) {
          setJoinError("Invalid game ID");
          return false;
        }

        const player = createPlayerFromWallet(publicKey);
        const success = await joinGame(gameIdNum, player, wallet);
        if (!success) {
          throw new Error("Failed to join battle");
        }

        handleGameEvent(`🏴‍☠️ Joined battle ${gameIdInput}!`);
        return true;
      } catch (error) {
        console.error("Failed to join game:", error);
        setJoinError(
          error instanceof Error ? error.message : "Failed to join battle",
        );
        return false;
      } finally {
        setIsJoining(false);
      }
    },
    [handleGameEvent, joinGame, publicKey, wallet],
  );

  return useMemo(() => ({
    isCreatingGame,
    isJoining,
    joinError,
    setJoinError,
    handleCollectResources,
    handleNewGame,
    handleReturnToLobby,
    handleCreateGame,
    handleModeSelected,
    handleJoinGame,
  }), [
    isCreatingGame,
    isJoining,
    joinError,
    handleCollectResources,
    handleNewGame,
    handleReturnToLobby,
    handleCreateGame,
    handleModeSelected,
    handleJoinGame,
  ]);
}
