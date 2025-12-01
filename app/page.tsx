"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useGameState } from "@/hooks/useGameState";
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
    if (!publicKey) return;

    setIsCreatingGame(true);
    try {
      const player = {
        publicKey: publicKey.toString(),
        points: 0,
        bankedPoints: 0,
        hasElf: false,
        hasBauble: false,
        username: `Pirate_${publicKey.toString().slice(0, 4)}`,
      };
      await createGame([player], 0.1, anchorProgram);
      setMessage("🏴‍☠️ Arena created!");
    } catch (error) {
      handleGameError(error, "create game");
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleQuickStart = () => {
    if (!gameState) return;
    const ai = {
      publicKey: `AI_${gameState.gameId}`,
      points: 0,
      bankedPoints: 0,
      hasElf: false,
      hasBauble: false,
      username: "AI Pirate",
    };
    joinGame(gameState.gameId, ai);
    setMessage("🧭 AI joined!");
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
        isCreating={isCreatingGame}
        onCoordinateSelect={handleCoordinateSelect}
        isMyTurn={isMyTurn(publicKey?.toString())}
        onPlayerAction={handlePlayerAction}
      />
    </ErrorBoundary>
  );
}
