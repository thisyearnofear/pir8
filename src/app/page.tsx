'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useGameState } from '@/hooks/useGameState';
import { useHeliusMonitor, GameEvent } from '@/hooks/useHeliusMonitor';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useMobileOptimized } from '@/hooks/useMobileOptimized';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorToast, SuccessToast, LoadingToast } from '@/components/Toast';
import GameGrid from '@/components/GameGrid';
import PlayerStats from '@/components/PlayerStats';
import GameControls from '@/components/GameControls';
import { useState, useEffect } from 'react';

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
    isMyTurn 
  } = useGameState();

  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const { handleWalletError, handleGameError } = useErrorHandler();
  const { isMobile, mobileClasses } = useMobileOptimized();

  // ENHANCED: Real-time game monitoring with Helius
  const { isConnected: isMonitorConnected } = useHeliusMonitor({
    gameId: gameState?.gameId,
    onGameEvent: (event: GameEvent) => {
      // Handle real-time game events
      switch (event.type) {
        case 'playerJoined':
          setMessage('🏴‍☠️ A new pirate has joined the crew!');
          break;
        case 'gameStarted':
          setMessage('⚔️ Battle has begun! May the best pirate win!');
          break;
        case 'moveMade':
          setMessage('⚡ A pirate has made their move...');
          break;
        case 'gameCompleted':
          setMessage('🏆 The battle is over! A champion has emerged!');
          break;
      }
    }
  });

  const handleCreateGame = async () => {
    try {
      if (!publicKey) {
        handleWalletError(new Error('Wallet not connected'));
        return;
      }

      setIsCreatingGame(true);
      
      const player = {
        publicKey: publicKey.toString(),
        points: 0,
        bankedPoints: 0,
        hasElf: false,
        hasBauble: false,
        username: `Pirate_${publicKey.toString().slice(0, 4)}`
      };

      await createGame([player], 0.1); // 0.1 SOL entry fee
    } catch (error) {
      handleGameError(error, 'create game');
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleCoordinateSelect = async (coordinate: string) => {
    try {
      await makeMove(coordinate);
    } catch (error) {
      handleGameError(error, 'make move');
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
    <main className={`min-h-screen flex flex-col items-center justify-center p-4 ${mobileClasses.container}`}>
      {/* Centered Header */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <header className="text-center pt-6 safe-area-inset-top">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-tech mb-1 sm:mb-2 animate-neon-flicker">
            ⚓ PIR8.SYSTEM ⚓
          </h1>
          <p className="text-xs sm:text-sm md:text-lg text-neon-cyan font-mono">
            &gt; FAST BATTLES | PRIVATE MOVES | CRYPTO WINS
          </p>
        </header>
      </div>

      {/* Wallet Connection - Floating */}
      <div className="fixed top-20 right-4 z-40 pointer-events-auto">
        <WalletMultiButton className="!bg-gradient-to-r !from-neon-cyan !to-neon-orange !text-bg-dark-0 !font-bold !border-2 !border-neon-cyan !font-tech !text-xs !py-2 !px-3" />
      </div>

      {/* Status Indicator - Top left */}
      {connected && publicKey && (
        <div className="fixed top-20 left-4 z-40 pointer-events-none">
          <div className="text-xs text-neon-cyan space-y-1 font-mono">
            <p className="animate-glow-pulse text-opacity-80">&gt; {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}</p>
            <div className="flex items-center space-x-1">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isMonitorConnected ? 'bg-neon-cyan' : 'bg-neon-magenta'}`}></div>
              <span className="text-xs font-mono">
                {isMonitorConnected ? 'SCANNER ACTIVE' : 'CONNECTING...'}
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

      {/* Main Content - Centered */}
      {!connected ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="pirate-card max-w-sm mx-auto transform hover:scale-105 transition-transform duration-300">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-tech mb-4">
                &gt; INITIALIZE.WALLET
              </h2>
              <p className="text-neon-cyan mb-6 font-mono text-sm">
                Connect Solana wallet to join the battle
              </p>
              <div className="text-7xl mb-6 animate-float">⚓</div>
              <p className="text-xs text-neon-cyan font-mono">
                PHANTOM | SOLFLARE | BACKPACK
              </p>
            </div>
          </div>
        </div>
      ) : !gameState ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="pirate-card max-w-sm mx-auto transform hover:scale-105 transition-transform duration-300">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-tech mb-4">
                &gt; BATTLE.INITIALIZE
              </h2>
              <p className="text-neon-cyan mb-8 font-mono text-sm">
                Start your pirate adventure
              </p>
              <button
                onClick={handleCreateGame}
                disabled={isCreatingGame}
                className="pirate-button w-full py-3 mb-6 text-lg font-tech"
              >
                {isCreatingGame ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="pirate-spinner w-5 h-5"></div>
                    <span>INITIALIZING...</span>
                  </div>
                ) : (
                  '▶ BATTLE.CREATE'
                )}
              </button>
              <div className="text-xs text-neon-orange font-mono space-y-1 bg-neon-orange bg-opacity-10 p-3 rounded border border-neon-orange border-opacity-30">
                <p>ENTRY: 0.1 SOL</p>
                <p>PLATFORM FEE: 5%</p>
                <p>WINNER: 85%</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Game Grid - Centered */}
          <div className="lg:col-span-2 flex justify-center">
            <div className="w-full max-w-2xl">
              <GameGrid
                grid={gameState.grid}
                chosenCoordinates={gameState.chosenCoordinates}
                onCoordinateSelect={handleCoordinateSelect}
                isMyTurn={isMyTurn()}
                disabled={gameState.gameStatus !== 'active'}
              />
            </div>
          </div>

          {/* Right Sidebar - Sticky */}
          <div className="lg:col-span-1 space-y-6">
            {/* Player Stats */}
            <div className="sticky top-32">
              <PlayerStats
                players={gameState.players}
                currentPlayerIndex={gameState.currentPlayerIndex}
                gameStatus={gameState.gameStatus}
                winner={gameState.winner}
              />
            </div>

            {/* Game Controls */}
            {gameState.gameStatus === 'active' && (
              <div className="sticky top-80">
                <GameControls
                  gameId={gameState.gameId}
                  isMyTurn={isMyTurn()}
                  disabled={gameState.gameStatus !== 'active'}
                />
              </div>
            )}

            {/* Game Over Panel */}
            {gameState.gameStatus === 'completed' && (
              <div className="pirate-card text-center sticky top-80 transform hover:scale-105 transition-transform">
                <h3 className="text-2xl font-bold text-pirate-gold mb-4 animate-pulse">
                  🏆 VICTOR CROWNED 🏆
                </h3>
                {gameState.winner && (
                  <div className="mb-6">
                    <p className="text-xs text-neon-cyan font-mono mb-2">WINNER</p>
                    <p className="text-lg font-bold text-pirate-gold font-tech">
                      {gameState.players.find(p => p.publicKey === gameState.winner)?.username ||
                       `${gameState.winner.slice(0, 4)}...${gameState.winner.slice(-4)}`}
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
        )}

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 text-center py-3 border-t border-neon-cyan border-opacity-20 bg-gradient-to-t from-ocean-blue via-ocean-blue to-transparent pointer-events-none">
        <p className="text-neon-cyan text-xs font-mono">
          SOLANA | HELIUS | ⚓ v1.0.ALPHA
        </p>
      </footer>
    </main>
    </ErrorBoundary>
  );
}