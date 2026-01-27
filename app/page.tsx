"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { usePirateGameState } from "@/hooks/usePirateGameState";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useShowOnboarding } from "@/hooks/useShowOnboarding";
import { useGameSync } from "@/hooks/useGameSync";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorToast, SuccessToast } from "@/components/Toast";
import PirateMap from "@/components/PirateMap";
import PirateControls from "@/components/PirateControls";
import PlayerStats from "@/components/PlayerStats";
import BattleInfoPanel from "@/components/BattleInfoPanel";
import TurnBanner from "@/components/TurnBanner";
import OnboardingModal from "@/components/OnboardingModal";
import ShipActionModal from "@/components/ShipActionModal";
import ResourceCollectionPanel from "@/components/ResourceCollectionPanel";
import ShipBuildingPanel from "@/components/ShipBuildingPanel";
import VictoryScreen from "@/components/VictoryScreen";
import { ManualSyncButton } from "@/components/ManualSyncButton";
import { GameSyncStatus } from "@/components/GameSyncRecovery";
import PrivacyStatusIndicator from "@/components/PrivacyStatusIndicator";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { createPlayerFromWallet, createAIPlayer } from "@/lib/playerHelper";
import { Ship } from "@/types/game";

const WalletButtonWrapper = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then(mod => ({
    default: () => <mod.WalletMultiButton />
  })),
  { ssr: false, loading: () => <div className="px-4 py-2 text-gray-400">Loading...</div> }
);

export default function Home() {
  const { publicKey, wallet } = useWallet();
  const {
    gameState,
    error,
    showMessage,
    selectedShipId,
    decisionTime,
    scanChargesRemaining,
    speedBonusAccumulated,
    averageDecisionTimeMs,
    createGame,
    joinGame,
    startGame,
    moveShip,
    attackWithShip,
    claimTerritory,
    collectResources,
    buildShip,
    selectShip,
    endTurn,
    setMessage,
    clearError,
    isMyTurn,
    getAllShips,
    startTurn,
    scanCoordinate,
    getScannedCoordinates
  } = usePirateGameState();

  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | undefined>();
  const [shipActionModalShip, setShipActionModalShip] = useState<Ship | null>(null);
  const { handleGameError } = useErrorHandler();
  const { shown: showOnboarding, dismiss: dismissOnboarding } = useShowOnboarding();

  // Set up consolidated game synchronization
  const { heliusConnected, lastSync } = useGameSync(gameState?.gameId || '');

  // Get current player
  const getCurrentPlayer = () => {
    if (!gameState || !publicKey) return null;
    return gameState.players.find((p: any) => p.publicKey === publicKey.toString()) || null;
  };

  // Get current player name for TurnBanner
  const getCurrentPlayerName = () => {
    if (!gameState) return 'opponent';
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    return currentPlayer?.username || currentPlayer?.publicKey?.slice(0, 8) || 'opponent';
  };

  // Handle resource collection
  const handleCollectResources = async () => {
    if (!wallet) return false;
    try {
      const success = await collectResources(wallet);
      if (success) {
        handleGameEvent('💰 Resources collected from territories!');
      }
      return success;
    } catch (error) {
      console.error('Resource collection failed:', error);
      return false;
    }
  };

  // Handle ship building
  const handleBuildShip = async (shipType: string, portX: number, portY: number) => {
    if (!wallet) return false;
    try {
      const success = await buildShip(shipType, portX, portY, wallet);
      if (success) {
        handleGameEvent(`🛠️ ${shipType.charAt(0).toUpperCase() + shipType.slice(1)} built successfully!`);
      }
      return success;
    } catch (error) {
      console.error('Ship building failed:', error);
      return false;
    }
  };

  // Handle victory screen actions
  const handleNewGame = async () => {
    if (!publicKey || !wallet) return;
    try {
      const player = createPlayerFromWallet(publicKey);
      await createGame([player], 0.1, wallet);
      handleGameEvent('🏴‍☠️ New battle begins!');
    } catch (error) {
      handleGameError(error, "create new game");
    }
  };

  const handleReturnToLobby = () => {
    // Reset game state - this would typically navigate to a lobby
    handleGameEvent('Returning to lobby...');
  };

  // Start turn timer when it becomes player's turn
  useEffect(() => {
    if (isMyTurn(publicKey?.toString()) && gameState?.gameStatus === 'active') {
      startTurn();
    }
  }, [isMyTurn(publicKey?.toString()), gameState?.currentPlayerIndex, gameState?.gameStatus]);

  // Simplified game event handling
  const handleGameEvent = (message: string) => {
    setMessage(message);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreateGame = async () => {
    if (!publicKey || !wallet) {
      setJoinError("Please connect your wallet first");
      return;
    }

    setIsCreatingGame(true);
    setJoinError(undefined);

    try {
      const player = createPlayerFromWallet(publicKey);
      const success = await createGame([player], 0.1, wallet);

      if (success) {
        handleGameEvent("🏴‍☠️ Battle arena created! Awaiting pirates...");
      }
    } catch (error) {
      console.error("Failed to create game:", error);
      handleGameError(error, "create game");
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleQuickStart = async () => {
    if (!gameState || !publicKey) return;

    try {
      setIsCreatingGame(true);
      const ai = createAIPlayer(gameState.gameId);
      const success = await joinGame(gameState.gameId, ai, null); // Pass null wallet for AI

      if (success) {
        handleGameEvent("🧭 AI pirate joined the battle!");
      }
    } catch (error) {
      handleGameError(error, "add AI player");
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleJoinGame = async (gameIdInput: string): Promise<boolean> => {
    if (!publicKey || !wallet) {
      setJoinError("Please connect your wallet first");
      return false;
    }

    setIsJoining(true);
    setJoinError(undefined);

    try {
      const player = createPlayerFromWallet(publicKey);
      const success = await joinGame(gameIdInput, player, wallet); // Pass wallet

      if (success) {
        handleGameEvent(`🏴‍☠️ Joined battle ${gameIdInput}!`);
      } else {
        setJoinError("Failed to join battle - invalid game ID or game full");
      }

      return success;
    } catch (error) {
      console.error("Failed to join game:", error);
      setJoinError(error instanceof Error ? error.message : "Failed to join battle");
      return false;
    } finally {
      setIsJoining(false);
    }
  };

  const handleCellSelect = async (coordinate: string) => {
    if (!publicKey || !gameState || !isMyTurn(publicKey.toString()) || !wallet) return;

    if (selectedShipId) {
      // Move selected ship to coordinate
      const success = await moveShip(selectedShipId, coordinate, wallet); // Pass wallet
      if (success) {
        handleGameEvent('Ship moved successfully!');
      }
    } else {
      // Try to select a ship at this coordinate
      const myShips = getAllShips().filter((ship: any) =>
        ship.id.startsWith(publicKey.toString()) &&
        ship.position.x + ',' + ship.position.y === coordinate
      );

      if (myShips.length > 0) {
        selectShip(myShips[0].id);
        handleGameEvent(`${myShips[0].type} selected`);
      }
    }
  };

  const handleScanCoordinate = async (x: number, y: number) => {
    if (!publicKey || !gameState || !isMyTurn(publicKey.toString())) return;

    try {
      await scanCoordinate(x, y);
    } catch (error) {
      console.error('Scan failed:', error);
      handleGameError(error, 'scan coordinate');
    }
  };

  const handleShipAction = async (shipId: string, action: 'move' | 'attack' | 'claim' | 'collect' | 'build') => {
    if (!publicKey || !gameState || !isMyTurn(publicKey.toString()) || !wallet) return;

    switch (action) {
      case 'move':
        handleGameEvent('Select a destination for your ship on the map');
        setShipActionModalShip(null); // Close modal, wait for map click
        break;
      case 'attack':
        // Find nearby enemy ships and attack
        const myShips = getAllShips().filter(s => s.id.startsWith(publicKey.toString()));
        const selectedShip = myShips.find(s => s.id === shipId);
        if (selectedShip) {
          const nearbyEnemies = getAllShips().filter((ship: any) =>
            !ship.id.startsWith(publicKey.toString()) &&
            ship.health > 0 &&
            Math.sqrt(
              Math.pow(ship.position.x - selectedShip.position.x, 2) +
              Math.pow(ship.position.y - selectedShip.position.y, 2)
            ) <= 1.5
          );

          if (nearbyEnemies.length > 0) {
            const success = await attackWithShip(shipId, nearbyEnemies[0].id, wallet); // Pass wallet
            if (success) {
              handleGameEvent('⚔️ Attack launched!');
            }
          } else {
            handleGameEvent('No enemy ships in range. Move closer to attack.');
          }
        }
        break;
      case 'claim':
        const ship = getAllShips().find((s: any) => s.id === shipId);
        if (ship) {
          const coordinate = `${ship.position.x},${ship.position.y}`;
          const success = await claimTerritory(shipId, coordinate, wallet); // Pass wallet
          if (success) {
            handleGameEvent('🏴‍☠️ Territory claimed!');
          }
        }
        break;
      case 'collect':
        const success = await handleCollectResources();
        if (success) {
          handleGameEvent('💎 Resources collected!');
        }
        break;
      case 'build':
        handleGameEvent('🛠️ Ship building: Select water near controlled port');
        break;
    }
    setShipActionModalShip(null); // Close modal after action
  };

  // Handle ship click to open action modal
  const handleShipClick = (ship: Ship) => {
    if (!publicKey || !isMyTurn(publicKey.toString())) return;
    if (!ship.id.startsWith(publicKey.toString())) return; // Only my ships

    selectShip(ship.id);
    setShipActionModalShip(ship);
  };

  const clearJoinError = () => setJoinError(undefined);

  return (
    <ErrorBoundary>
      {/* Modals - rendered outside main content for proper overlay */}
      <OnboardingModal isOpen={showOnboarding} onDismiss={dismissOnboarding} />
      {shipActionModalShip && (
        <ShipActionModal
          ship={shipActionModalShip}
          isOpen={true}
          onClose={() => setShipActionModalShip(null)}
          onAction={(action) => handleShipAction(shipActionModalShip.id, action)}
        />
      )}
      {gameState?.gameStatus === 'completed' && (
        <VictoryScreen
          gameState={gameState}
          currentPlayerPK={publicKey?.toString()}
          onNewGame={handleNewGame}
          onReturnToLobby={handleReturnToLobby}
        />
      )}

      <ErrorToast error={error} onClose={clearError} />
      <SuccessToast message={showMessage} onClose={() => setMessage(null)} />

      {/* Manual sync button for testing blockchain synchronization */}
      <ManualSyncButton />

      {/* Additional debug components in development mode */}
      {process.env.NODE_ENV !== 'production' && (
        <>
          <GameSyncStatus />
        </>
      )}

      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4 py-6">
          <header className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1" />
              <div className="text-center flex-1">
                <h1 className="text-4xl font-bold text-neon-cyan mb-2">
                  🏴‍☠️ PIR8 BATTLE ARENA
                </h1>
                <p className="text-gray-300">
                  Strategic naval warfare on the blockchain
                </p>
              </div>
              <div className="flex-1 flex justify-end items-center gap-4">
                <PrivacyStatusIndicator />
                <WalletButtonWrapper />
              </div>
            </div>
          </header>

          {/* Turn Banner - shown when game is active */}
          {gameState?.gameStatus === 'active' && (
            <div className="mb-4">
              <TurnBanner
                isMyTurn={isMyTurn(publicKey?.toString())}
                decisionTimeMs={decisionTime}
                currentPlayerName={getCurrentPlayerName()}
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-screen max-h-[800px]">
            {/* Left Panel: Player Stats Only */}
            <div className="lg:col-span-1">
              <PlayerStats
                players={gameState?.players || []}
                currentPlayerIndex={gameState?.currentPlayerIndex || 0}
                gameStatus={gameState?.gameStatus || 'waiting'}
                decisionTimeMs={decisionTime}
                scanChargesRemaining={scanChargesRemaining}
                speedBonusAccumulated={speedBonusAccumulated}
                averageDecisionTimeMs={averageDecisionTimeMs}
                scannedCoordinates={getScannedCoordinates()}
              />
            </div>

            {/* Main Game Area */}
            <div className="lg:col-span-2 flex flex-col">
              {gameState?.gameStatus === 'active' && gameState.gameMap ? (
                <PirateMap
                  gameMap={gameState.gameMap}
                  ships={getAllShips()}
                  onCellSelect={handleCellSelect}
                  onShipClick={handleShipClick}
                  isMyTurn={isMyTurn(publicKey?.toString())}
                  selectedShipId={selectedShipId || undefined}
                  currentPlayerPK={publicKey?.toString()}
                  scannedCoordinates={getScannedCoordinates()}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-slate-800 rounded-lg border border-neon-cyan border-opacity-30">
                  <div className="text-center p-8">
                    <div className="text-6xl mb-4">🗺️</div>
                    <h3 className="text-xl text-neon-cyan mb-2">
                      Battle Map Loading...
                    </h3>
                    <p className="text-gray-400">
                      {!gameState ? 'Create or join a game to begin' : 'Preparing battle arena...'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls Panel with Battle Info */}
            <div className="lg:col-span-1 space-y-4">
              <BattleInfoPanel gameState={gameState} />

              {/* Resource Collection Panel */}
              <ResourceCollectionPanel
                gameState={gameState}
                currentPlayer={getCurrentPlayer()}
                onCollectResources={handleCollectResources}
                isMyTurn={isMyTurn(publicKey?.toString())}
              />

              {/* Ship Building Panel */}
              <ShipBuildingPanel
                gameState={gameState}
                currentPlayer={getCurrentPlayer()}
                onBuildShip={handleBuildShip}
                isMyTurn={isMyTurn(publicKey?.toString())}
              />

              <PirateControls
                gameState={gameState}
                onCreateGame={handleCreateGame}
                onQuickStart={handleQuickStart}
                onStartGame={async () => {
                  if (!wallet) return;
                  setIsCreatingGame(true);
                  try {
                    const success = await startGame(wallet); // Pass wallet
                    if (success) {
                      handleGameEvent("🏴‍☠️ Battle Started! Hoist the colors!");
                    }
                  } catch (error) {
                    handleGameError(error, "start game");
                  } finally {
                    setIsCreatingGame(false);
                  }
                }}
                onJoinGame={handleJoinGame}
                onShipAction={handleShipAction}
                onEndTurn={endTurn}
                isCreating={isCreatingGame}
                isJoining={isJoining}
                joinError={joinError}
                onClearJoinError={clearJoinError}
                selectedShipId={selectedShipId || undefined}
                onShipSelect={selectShip}
                onScanCoordinate={handleScanCoordinate}
                decisionTimeMs={decisionTime}
                scanChargesRemaining={scanChargesRemaining}
              />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
