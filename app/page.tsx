"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useGameState } from "@/hooks/useGameState";
import { useGameJoin } from "@/hooks/useGameJoin";
import { useHeliusMonitor, GameEvent } from "@/hooks/useHeliusMonitor";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorToast, SuccessToast } from "@/components/Toast";
import GameGrid from "@/components/GameGrid";
import GameControls from "@/components/GameControls";
import PlayerStats from "@/components/PlayerStats";
import dynamic from "next/dynamic";
const GameCockpit = dynamic(() => import("@/components/GameCockpit"), {
  ssr: false,
});
import { useState } from "react";
import { useAnchorProgram } from "@/lib/anchor";
import { createPlayerFromWallet, createAIPlayer } from "@/lib/playerHelper";

export default function Home() {
  const { publicKey } = useWallet();
  const {
    gameState,
    createGame,
    joinGame,
    makeMove,
    handlePlayerAction,
    error,
    clearError,
    showMessage,
    setMessage,
    isMyTurn,
  } = useGameState();

  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const { handleGameError } = useErrorHandler();
  const anchorProgram = useAnchorProgram();
  const { isJoining, error: joinError, joinGame: joinGameStore, clearError: clearJoinError } = useGameJoin();

  useHeliusMonitor({
    gameId: gameState?.gameId,
    onGameEvent: (event: GameEvent) => {
      switch (event.type) {
        case "playerJoined":
          setMessage("🏴☠️ A new pirate has joined!");
          break;
        case "gameStarted":
          setMessage("⚔️ Battle has begun!");
          break;
        case "moveMade":
          setMessage("⚡ Move made...");
          break;
        case "gameCompleted":
          setMessage("🏆 Battle over!");
          break;
      }
    },
  });

  const handleCreateGame = async () => {
    console.log("[handleCreateGame] Starting game creation...");
    console.log("[handleCreateGame] publicKey:", publicKey?.toString());
    console.log("[handleCreateGame] anchorProgram:", anchorProgram);
    
    if (!publicKey) {
      console.error("[handleCreateGame] No public key available");
      return;
    }

    setIsCreatingGame(true);
    try {
      const player = createPlayerFromWallet(publicKey);
      console.log("[handleCreateGame] Created player:", player);
      
      await createGame([player], 0.1, anchorProgram);
      console.log("[handleCreateGame] Game created successfully");
      
      setMessage("🏴‍☠️ Arena created!");
    } catch (error) {
      console.error("[handleCreateGame] Error creating game:", error);
      handleGameError(error, "create game");
    } finally {
      console.log("[handleCreateGame] Setting isCreatingGame to false");
      setIsCreatingGame(false);
    }
  };

  const handleQuickStart = async () => {
    if (!gameState || !anchorProgram?.program) return;

    try {
      setIsCreatingGame(true);
      const ai = createAIPlayer(gameState.gameId);
      // Add AI player locally
      joinGame(gameState.gameId, ai);
      setMessage("🧭 AI joined!");

      // Call start_game on-chain
      const { PIR8Instructions } = await import("@/lib/anchor");
      const instructions = new PIR8Instructions(
        anchorProgram.program,
        anchorProgram.provider
      );
      const gameId = parseInt(gameState.gameId.split("_")[1]);
      const signature = await instructions.startGame(gameId);
      await anchorProgram.provider.connection.confirmTransaction(signature);
      setMessage("⚔️ Battle started on-chain!");
    } catch (error) {
      handleGameError(error, "start game");
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleJoinGame = async (gameIdInput: string): Promise<boolean> => {
    if (!publicKey) return false;

    try {
      const player = createPlayerFromWallet(publicKey);
      const success = await joinGameStore(gameIdInput, player);
      if (success) {
        setMessage(`🏴‍☠️ Joined game ${gameIdInput}!`);
      }
      return success;
    } catch (error) {
      handleGameError(error, "join game");
      return false;
    }
  };

  const handleCoordinateSelect = async (coordinate: string) => {
    try {
      await makeMove(coordinate);
    } catch (error) {
      handleGameError(error, "make move");
    }
  };

  return (
    <ErrorBoundary>
      <ErrorToast error={error} onClose={clearError} />
      <SuccessToast message={showMessage} onClose={() => setMessage(null)} />

      <GameCockpit
        gameState={gameState}
        onCreateGame={handleCreateGame}
        onQuickStart={handleQuickStart}
        onJoinGame={handleJoinGame}
        isCreating={isCreatingGame}
        isJoining={isJoining}
        joinError={joinError}
        onClearJoinError={clearJoinError}
        onCoordinateSelect={handleCoordinateSelect}
        isMyTurn={isMyTurn(publicKey?.toString())}
        onPlayerAction={handlePlayerAction}
      />
    </ErrorBoundary>
  );
}
