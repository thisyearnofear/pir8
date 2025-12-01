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
    <main className={`min-h-screen p-4 ${mobileClasses.container}`}>
      {/* Header */}
      <header className="text-center mb-6 safe-area-inset-top">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold font-tech mb-2 sm:mb-4 animate-neon-flicker">
          ⚓ PIR8.SYSTEM ⚓
        </h1>
        <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-neon-cyan font-mono mb-4 sm:mb-6">
          &gt; FAST BATTLES | PRIVATE MOVES | CRYPTO WINS
        </p>
        
        {/* Wallet Connection */}
        <div className="flex justify-center mb-6">
          <WalletMultiButton className="!bg-gradient-to-r !from-neon-cyan !to-neon-orange !text-bg-dark-0 !font-bold !border-2 !border-neon-cyan !font-tech" />
        </div>

        {connected && publicKey && (
          <div className="text-sm text-neon-cyan space-y-1 font-mono">
            <p className="animate-glow-pulse">&gt; PILOT {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)} ONLINE</p>
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${isMonitorConnected ? 'bg-neon-cyan' : 'bg-neon-magenta'}`}></div>
              <span className="text-xs font-mono">
                {isMonitorConnected ? '◆ HELIUS.SCANNER ACTIVE' : '▲ HELIUS.SCANNER CONNECTING...'}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Enhanced Toast Notifications */}
      <ErrorToast error={error} onClose={clearError} />
      <SuccessToast message={showMessage} onClose={() => setMessage(null)} />
      <LoadingToast 
        message={isCreatingGame ? "🚢 Creating your pirate battle..." : null} 
        isLoading={isCreatingGame} 
      />

      {/* Main Content */}
      {!connected ? (
        <div className="text-center py-20">
          <div className="pirate-card max-w-md mx-auto">
            <h2 className="text-2xl font-bold font-tech mb-4">
              &gt; INITIALIZE.WALLET
            </h2>
            <p className="text-neon-cyan mb-6 font-mono">
              &gt; Connect Solana wallet to access PIR8.SYSTEM
            </p>
            <div className="text-6xl mb-6 animate-float">⚓</div>
            <p className="text-sm text-neon-cyan font-mono">
              &gt; COMPATIBLE: PHANTOM | SOLFLARE
            </p>
          </div>
        </div>
      ) : !gameState ? (
        <div className="text-center py-20">
          <div className="pirate-card max-w-md mx-auto">
            <h2 className="text-2xl font-bold font-tech mb-4">
              &gt; BATTLE.INITIALIZE
            </h2>
            <p className="text-neon-cyan mb-6 font-mono">
              &gt; Create new instance or join active battle
            </p>
            <button
              onClick={handleCreateGame}
              disabled={isCreatingGame}
              className="pirate-button w-full text-xl py-4 mb-4"
            >
              {isCreatingGame ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="pirate-spinner w-5 h-5"></div>
                  <span className="font-mono">INITIALIZING...</span>
                </div>
              ) : (
                '▶ BATTLE.CREATE'
              )}
            </button>
            <div className="text-sm text-neon-orange font-mono space-y-1">
              <p>&gt; ENTRY FEE: 0.1 SOL</p>
              <p>&gt; PLATFORM FEE: 5%</p>
              <p>&gt; WINNER PRIZE: 85%</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 max-w-7xl mx-auto">
          {/* Mobile Priority: Controls first */}
          <div className="lg:hidden order-1 space-y-4">
            {gameState.gameStatus === 'active' && (
              <GameControls
                gameId={gameState.gameId}
                isMyTurn={isMyTurn()}
                disabled={gameState.gameStatus !== 'active'}
              />
            )}
          </div>

          {/* Game Grid - Main area */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <GameGrid
              grid={gameState.grid}
              chosenCoordinates={gameState.chosenCoordinates}
              onCoordinateSelect={handleCoordinateSelect}
              isMyTurn={isMyTurn()}
              disabled={gameState.gameStatus !== 'active'}
            />
          </div>

          {/* Side Panel */}
          <div className="order-3 lg:order-2 space-y-4 lg:space-y-6">
            {/* Player Stats */}
            <PlayerStats
              players={gameState.players}
              currentPlayerIndex={gameState.currentPlayerIndex}
              gameStatus={gameState.gameStatus}
              winner={gameState.winner}
            />

            {/* Game Controls - Desktop only */}
            <div className="hidden lg:block">
              {gameState.gameStatus === 'active' && (
                <GameControls
                  gameId={gameState.gameId}
                  isMyTurn={isMyTurn()}
                  disabled={gameState.gameStatus !== 'active'}
                />
              )}
            </div>

            {/* Game Over Panel */}
            {gameState.gameStatus === 'completed' && (
              <div className="pirate-card text-center">
                <h3 className="text-lg sm:text-2xl font-bold text-pirate-gold mb-4">
                  🏆 Battle Complete! 🏆
                </h3>
                {gameState.winner && (
                  <div className="mb-4">
                    <p className="text-sm sm:text-base text-gray-300">Winner:</p>
                    <p className="text-base sm:text-xl font-bold text-pirate-gold">
                      {gameState.players.find(p => p.publicKey === gameState.winner)?.username ||
                       `${gameState.winner.slice(0, 4)}...${gameState.winner.slice(-4)}`}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="pirate-button w-full text-sm sm:text-base"
                >
                  🚢 Start New Battle
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center mt-12 py-8 border-t border-neon-cyan border-opacity-20">
        <p className="text-neon-cyan text-sm font-mono">
          &gt; RUNTIME: SOLANA | HELIUS | CYBER.PIRATE
        </p>
        <p className="text-xs text-neon-magenta mt-2 font-mono">
          ID: {gameState?.gameId || 'STANDBY'} | V1.0.ALPHA | ⚓
        </p>
      </footer>
    </main>
    </ErrorBoundary>
  );
}