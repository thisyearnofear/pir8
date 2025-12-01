"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useGameState } from "@/hooks/useGameState";
import { useHeliusMonitor, GameEvent } from "@/hooks/useHeliusMonitor";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorToast, SuccessToast } from "@/components/Toast";
import GameGrid from "@/components/GameGrid";
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
      />

      {gameState?.gameStatus === "active" && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 100,
            background: "rgba(18, 16, 15, 0.95)",
            backdropFilter: "blur(10px)",
            padding: "2rem",
            borderRadius: "8px",
            border: "1px solid rgba(255, 78, 66, 0.3)",
            maxWidth: "90vw",
            maxHeight: "90vh",
            overflow: "auto",
          }}
        >
          <div style={{ marginBottom: "1rem" }}>
            <GameGrid
              grid={gameState.grid}
              chosenCoordinates={gameState.chosenCoordinates}
              onCoordinateSelect={handleCoordinateSelect}
              isMyTurn={isMyTurn()}
              disabled={false}
            />
          </div>
          <PlayerStats
            players={gameState.players}
            currentPlayerIndex={gameState.currentPlayerIndex}
            gameStatus={gameState.gameStatus}
            winner={gameState.winner}
          />
        </div>
      )}
    </ErrorBoundary>
  );
}
