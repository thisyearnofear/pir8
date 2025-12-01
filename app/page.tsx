"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useGameState } from "@/hooks/useGameState";
import { useHeliusMonitor, GameEvent } from "@/hooks/useHeliusMonitor";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useMobileOptimized } from "@/hooks/useMobileOptimized";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorToast, SuccessToast, LoadingToast } from "@/components/Toast";
import GameGrid from "@/components/GameGrid";
import PlayerStats from "@/components/PlayerStats";
import GameControls from "@/components/GameControls";
import Preloader from "@/components/Preloader";
import Notification from "@/components/Notification";
import dynamic from "next/dynamic";
const MusicPlayer = dynamic(() => import("@/components/MusicPlayer"), {
  ssr: false,
});
import { useState, useEffect } from "react";
import { useAnchorProgram } from "@/lib/anchor";

export default function Home() {
  const { connected, publicKey } = useWallet();
  const {
    gameState,
    createGame,
    makeMove,
    error,
    clearError,
    showMessage,
    setMessage,
    isMyTurn,
  } = useGameState();

  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [showPreloader, setShowPreloader] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    isVisible: boolean;
  }>({
    message: "",
    isVisible: false,
  });
  const { handleWalletError, handleGameError } = useErrorHandler();
  const { isMobile, mobileClasses } = useMobileOptimized();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const anchorProgram = useAnchorProgram();

  useEffect(() => {
    setIsHydrated(true);
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      const handler = () => setPrefersReducedMotion(mq.matches);
      setPrefersReducedMotion(mq.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);

  // ENHANCED: Real-time game monitoring with Helius
  const { isConnected: isMonitorConnected } = useHeliusMonitor({
    gameId: gameState?.gameId,
    onGameEvent: (event: GameEvent) => {
      // Handle real-time game events
      switch (event.type) {
        case "playerJoined":
          setMessage("🏴‍☠️ A new pirate has joined the crew!");
          break;
        case "gameStarted":
          setMessage("⚔️ Battle has begun! May the best pirate win!");
          break;
        case "moveMade":
          setMessage("⚡ A pirate has made their move...");
          break;
        case "gameCompleted":
          setMessage("🏆 The battle is over! A champion has emerged!");
          break;
      }
    },
  });

  const handleCreateGame = async () => {
    try {
      if (!publicKey) {
        handleWalletError(new Error("Wallet not connected"));
        return;
      }

      setIsCreatingGame(true);
      setShowPreloader(true);
      setNotification({
        message: "ESTABLISHING SECURE CONNECTION",
        isVisible: true,
      });
      const player = {
        publicKey: publicKey.toString(),
        points: 0,
        bankedPoints: 0,
        hasElf: false,
        hasBauble: false,
        username: `Pirate_${publicKey.toString().slice(0, 4)}`,
      };
      try {
        setNotification({
          message: "GENERATING TREASURE MAP",
          isVisible: true,
        });
        await createGame([player], 0.1, anchorProgram);
        setNotification({ message: "ARENA READY FOR BATTLE", isVisible: true });
      } catch (error) {
        handleGameError(error, "create game");
        setNotification({ message: "CONNECTION FAILED", isVisible: true });
      } finally {
        setIsCreatingGame(false);
        setShowPreloader(false);
      }
    } catch (error) {
      handleGameError(error, "create game");
      setIsCreatingGame(false);
      setShowPreloader(false);
    }
  };

  const handleCoordinateSelect = async (coordinate: string) => {
    try {
      await makeMove(coordinate);
    } catch (error) {
      handleGameError(error, "make move");
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (showMessage) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showMessage, setMessage]);

  // Clear errors after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  return (
    <ErrorBoundary>
      {isHydrated && !isMobile && !prefersReducedMotion && <MusicPlayer />}
      <main
        suppressHydrationWarning
        className={`min-h-screen flex flex-col ${
          isHydrated ? mobileClasses.container : ""
        }`}
      >
        {/* Centered Header */}
        <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none bg-gradient-to-b from-bg-dark-0 via-bg-dark-0/80 to-transparent pb-4">
          <header className="text-center pt-4 safe-area-inset-top">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-tech mb-1 animate-neon-flicker">
              ⚓ PIR8.SYSTEM ⚓
            </h1>
            <p className="text-xs sm:text-sm text-neon-cyan font-mono">
              &gt; FAST BATTLES | PRIVATE MOVES | CRYPTO WINS
            </p>
          </header>
        </div>

        {/* Wallet Connection - Floating */}
        <div className="fixed top-4 right-4 z-40 pointer-events-auto">
          <WalletMultiButton className="!bg-gradient-to-r !from-neon-cyan !to-neon-orange !text-bg-dark-0 !font-bold !border-2 !border-neon-cyan !font-tech !text-xs !py-2 !px-3" />
        </div>

        {/* Status Indicator - Top left */}
        {connected && publicKey && (
          <div className="fixed top-16 left-4 z-40 pointer-events-none">
            <div className="text-xs text-neon-cyan space-y-1 font-mono">
              <p className="animate-glow-pulse text-opacity-80">
                &gt; {publicKey.toString().slice(0, 4)}...
                {publicKey.toString().slice(-4)}
              </p>
              <div className="flex items-center space-x-1">
                <div
                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    isMonitorConnected ? "bg-neon-cyan" : "bg-neon-magenta"
                  }`}
                ></div>
                <span className="text-xs font-mono">
                  {isMonitorConnected ? "SCANNER ACTIVE" : "CONNECTING..."}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Toast Notifications */}
        <ErrorToast error={error} onClose={clearError} />
        <SuccessToast message={showMessage} onClose={() => setMessage(null)} />
        <LoadingToast
          message={isCreatingGame ? "🚢 Creating your pirate battle..." : null}
          isLoading={isCreatingGame}
        />

        {/* Preloader */}
        <Preloader
          isVisible={showPreloader}
          message="INITIALIZING PIRATE ARENA"
        />

        {/* Notification System */}
        <Notification
          message={notification.message}
          isVisible={notification.isVisible}
          onClose={() =>
            setNotification((prev) => ({ ...prev, isVisible: false }))
          }
        />

        {/* Main Content - With proper spacing */}
        <div className="flex-1 w-full pt-24 pb-16 px-4">
        {!connected ? (
          <div className="flex items-center justify-center min-h-full relative">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-radial from-ocean-blue via-bg-dark-0 to-bg-dark-2 opacity-80"></div>
            <div className="absolute inset-0 bg-grid-overlay opacity-10"></div>
            <div className="floating-particles absolute inset-0"></div>

            {/* Central Scanner Frame */}
            <div className="relative z-10 flex items-center justify-center">
              <div className="scanner-frame-center">
                <div className="corner-tl"></div>
                <div className="corner-tr"></div>
                <div className="corner-bl"></div>
                <div className="corner-br"></div>

                <div className="wallet-card max-w-md mx-auto transform hover:scale-105 transition-all duration-500">
                  <div className="text-center space-y-8">
                    {/* Animated Logo */}
                    <div className="relative mb-8">
                      <div className="text-8xl mb-4 animate-float opacity-90">
                        ⚓
                      </div>
                      <div className="scanner-line"></div>
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-3xl font-bold font-tech text-neon-cyan animate-glow-pulse">
                        &gt; SYSTEM.INIT
                      </h2>
                      <p className="text-neon-orange font-mono text-sm tracking-wider">
                        WALLET CONNECTION REQUIRED
                      </p>
                    </div>

                    <div className="wallet-button-container">
                      <WalletMultiButton className="!bg-gradient-to-r !from-neon-cyan !to-neon-orange !text-bg-dark-0 !font-bold !border-2 !border-neon-cyan !font-tech !text-sm !py-4 !px-8 !rounded-lg transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-neon-cyan/50" />
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs text-neon-cyan font-mono opacity-80">
                        SUPPORTED WALLETS:
                      </p>
                      <div className="flex justify-center space-x-6 text-neon-orange">
                        <span className="text-sm font-mono">PHANTOM</span>
                        <span className="text-sm font-mono">•</span>
                        <span className="text-sm font-mono">SOLFLARE</span>
                        <span className="text-sm font-mono">•</span>
                        <span className="text-sm font-mono">BACKPACK</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="scanner-id-bottom">PIR8.SYSTEM.V1.0</div>
                <div className="scanner-id-bottom-right">
                  BLOCKCHAIN: SOLANA
                </div>
              </div>
            </div>
          </div>
        ) : !gameState ? (
          <div className="flex items-center justify-center min-h-screen relative">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-radial from-ocean-blue via-bg-dark-0 to-bg-dark-2 opacity-80"></div>
            <div className="absolute inset-0 bg-grid-overlay opacity-10"></div>
            <div className="floating-particles absolute inset-0"></div>

            {/* Central Scanner Frame */}
            <div className="relative z-10 flex items-center justify-center min-h-screen">
              <div className="scanner-frame-center">
                <div className="corner-tl"></div>
                <div className="corner-tr"></div>
                <div className="corner-bl"></div>
                <div className="corner-br"></div>

                <div className="game-card max-w-lg mx-auto transform hover:scale-105 transition-all duration-500">
                  <div className="text-center space-y-8">
                    {/* Preloader Canvas */}
                    <div className="preloader-container">
                      <canvas
                        id="preloader-canvas"
                        className="preloader-canvas"
                        width="120"
                        height="120"
                      ></canvas>
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-3xl font-bold font-tech text-neon-orange animate-glow-pulse">
                        &gt; BATTLE.CREATE
                      </h2>
                      <p className="text-neon-cyan font-mono text-sm tracking-wider">
                        INITIALIZE PIRATE ARENA
                      </p>
                    </div>

                    <button
                      onClick={handleCreateGame}
                      disabled={isCreatingGame}
                      className="pirate-button-primary w-full py-4 mb-8 text-lg font-tech transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-neon-orange/50"
                    >
                      {isCreatingGame ? (
                        <div className="flex items-center justify-center space-x-3">
                          <div className="pirate-spinner w-6 h-6"></div>
                          <span>CREATING ARENA...</span>
                        </div>
                      ) : (
                        "▶ LAUNCH BATTLE"
                      )}
                    </button>

                    <div className="game-info-grid">
                      <div className="info-item">
                        <span className="info-label">ENTRY FEE</span>
                        <span className="info-value">0.1 SOL</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">PLATFORM FEE</span>
                        <span className="info-value">5%</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">WINNER PRIZE</span>
                        <span className="info-value">85%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="scanner-id-bottom">
                  STATUS: AWAITING COMMAND
                </div>
                <div className="scanner-id-bottom-right">
                  MODE: SOLANA DEVNET
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              {/* Main Game Grid - Centered */}
              <div className="lg:col-span-2 flex justify-center">
                <div className="w-full max-w-2xl">
                  <GameGrid
                    grid={gameState.grid}
                    chosenCoordinates={gameState.chosenCoordinates}
                    onCoordinateSelect={handleCoordinateSelect}
                    isMyTurn={isMyTurn()}
                    disabled={gameState.gameStatus !== "active"}
                  />
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="lg:col-span-1 space-y-4">
                {/* Player Stats */}
                <div>
                  <PlayerStats
                    players={gameState.players}
                    currentPlayerIndex={gameState.currentPlayerIndex}
                    gameStatus={gameState.gameStatus}
                    winner={gameState.winner}
                  />
                </div>

                {/* Game Controls */}
                {gameState.gameStatus === "active" && (
                  <div>
                    <GameControls
                      gameId={gameState.gameId}
                      isMyTurn={isMyTurn()}
                      disabled={gameState.gameStatus !== "active"}
                    />
                  </div>
                )}

                {/* Game Over Panel */}
                {gameState.gameStatus === "completed" && (
                  <div className="pirate-card text-center transform hover:scale-105 transition-transform">
                    <h3 className="text-2xl font-bold text-pirate-gold mb-4 animate-pulse">
                      🏆 VICTOR CROWNED 🏆
                    </h3>
                    {gameState.winner && (
                      <div className="mb-6">
                        <p className="text-xs text-neon-cyan font-mono mb-2">
                          WINNER
                        </p>
                        <p className="text-lg font-bold text-pirate-gold font-tech">
                          {gameState.players.find(
                            (p) => p.publicKey === gameState.winner
                          )?.username ||
                            `${gameState.winner.slice(
                              0,
                              4
                            )}...${gameState.winner.slice(-4)}`}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => window.location.reload()}
                      className="pirate-button w-full text-sm font-tech"
                    >
                      ▶ NEW.BATTLE
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Footer */}
        <footer className="w-full text-center py-2 border-t border-neon-cyan border-opacity-20 bg-gradient-to-t from-ocean-blue via-ocean-blue/80 to-transparent pointer-events-none">
          <p className="text-neon-cyan text-xs font-mono">
            SOLANA | HELIUS | ⚓ v1.0.ALPHA
          </p>
        </footer>
      </main>
    </ErrorBoundary>
  );
}
