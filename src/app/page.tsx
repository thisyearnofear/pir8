'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useGameState } from '../src/hooks/useGameState';
import { useHeliusMonitor, GameEvent } from '../src/hooks/useHeliusMonitor';
import { useErrorHandler } from '../src/hooks/useErrorHandler';
import { useMobileOptimized } from '../src/hooks/useMobileOptimized';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { ErrorToast, SuccessToast, LoadingToast } from '../src/components/Toast';
import GameGrid from '../src/components/GameGrid';
import PlayerStats from '../src/components/PlayerStats';
import GameControls from '../src/components/GameControls';
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
      <header className="text-center mb-8">
        <h1 className="text-5xl md:text-7xl font-bold text-pirate-gold font-pirate mb-4 animate-treasure-glow">
          🏴‍☠️ PIR8 🏴‍☠️
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 font-maritime mb-6">
          Fast battles, private moves, viral wins
        </p>
        
        {/* Wallet Connection */}
        <div className="flex justify-center mb-6">
          <WalletMultiButton className="!bg-gradient-to-r !from-pirate-gold !to-treasure-gold !text-pirate-brown !font-bold !border-2 !border-pirate-brown" />
        </div>

        {connected && publicKey && (
          <div className="text-sm text-gray-400 space-y-1">
            <p>Welcome aboard, {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}!</p>
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isMonitorConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
              <span className="text-xs">
                {isMonitorConnected ? '🔥 Helius Monitor Active' : '⏳ Connecting to Helius...'}
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
            <h2 className="text-2xl font-bold text-pirate-gold mb-4">
              Connect Your Wallet to Start
            </h2>
            <p className="text-gray-300 mb-6">
              Connect your Solana wallet to join the pirate battles and hunt for treasure!
            </p>
            <div className="text-6xl mb-6">🏴‍☠️</div>
            <p className="text-sm text-gray-400">
              Supported wallets: Phantom, Solflare, Backpack
            </p>
          </div>
        </div>
      ) : !gameState ? (
        <div className="text-center py-20">
          <div className="pirate-card max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-pirate-gold mb-4">
              Ready to Sail?
            </h2>
            <p className="text-gray-300 mb-6">
              Create a new game or join an existing battle!
            </p>
            <button
              onClick={handleCreateGame}
              disabled={isCreatingGame}
              className="pirate-button w-full text-xl py-4 mb-4"
            >
              {isCreatingGame ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="pirate-spinner w-5 h-5"></div>
                  <span>Creating Game...</span>
                </div>
              ) : (
                '🚢 Create New Battle'
              )}
            </button>
            <div className="text-sm text-gray-400">
              <p>Entry Fee: 0.1 SOL</p>
              <p>Platform Fee: 5%</p>
              <p>Winner Takes: 85%</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
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
          <div className="order-1 lg:order-2 space-y-6">
            {/* Player Stats */}
            <PlayerStats
              players={gameState.players}
              currentPlayerIndex={gameState.currentPlayerIndex}
              gameStatus={gameState.gameStatus}
              winner={gameState.winner}
            />

            {/* Game Controls */}
            {gameState.gameStatus === 'active' && (
              <GameControls
                gameId={gameState.gameId}
                isMyTurn={isMyTurn()}
                disabled={gameState.gameStatus !== 'active'}
              />
            )}

            {/* Game Over Panel */}
            {gameState.gameStatus === 'completed' && (
              <div className="pirate-card text-center">
                <h3 className="text-2xl font-bold text-pirate-gold mb-4">
                  🏆 Battle Complete! 🏆
                </h3>
                {gameState.winner && (
                  <div className="mb-4">
                    <p className="text-lg text-gray-300">Winner:</p>
                    <p className="text-xl font-bold text-pirate-gold">
                      {gameState.players.find(p => p.publicKey === gameState.winner)?.username ||
                       `${gameState.winner.slice(0, 4)}...${gameState.winner.slice(-4)}`}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="pirate-button w-full"
                >
                  🚢 Start New Battle
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center mt-12 py-8 border-t border-gray-700">
        <p className="text-gray-400 text-sm">
          Built with ⚡ Solana, 🔥 Helius, and 🏴‍☠️ Pirate Spirit
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Game ID: {gameState?.gameId || 'No active game'} • PIR8 v1.0
        </p>
      </footer>
    </main>
    </ErrorBoundary>
  );
}