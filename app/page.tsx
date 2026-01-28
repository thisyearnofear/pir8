/**
 * Main Page Component - PIR8 Battle Arena
 * 
 * Following Core Principles:
 * - CLEAN: Thin page shell, logic extracted to GameContainer
 * - MODULAR: Composable components with single responsibilities
 * - DRY: Uses consolidated hooks and shared logic
 */

"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { usePirateGameState } from "@/hooks/usePirateGameState";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useShowOnboarding } from "@/hooks/useShowOnboarding";
import { useViralSystem } from "@/hooks/useViralSystem";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorToast, SuccessToast } from "@/components/Toast";
import GameContainer from "@/components/GameContainer";
import SpectatorView from "@/components/SpectatorView";
import OnboardingModal from "@/components/OnboardingModal";
import { ManualSyncButton } from "@/components/ManualSyncButton";
import { GameSyncStatus } from "@/components/GameSyncRecovery";
import PrivacyStatusIndicator from "@/components/PrivacyStatusIndicator";
import ViralEventModal from "@/components/ViralEventModal";
import SocialModal from "@/components/SocialModal";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { createPlayerFromWallet, createAIPlayer } from "@/lib/playerHelper";
import { Ship, Player } from "@/types/game";

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
    getScannedCoordinates,
    // Practice mode actions
    startPracticeGame,
    makePracticeMove,
    makePracticeAttack,
    makePracticeClaim,
    exitPracticeMode,
    isPracticeMode
  } = usePirateGameState();

  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | undefined>();
  const [shipActionModalShip, setShipActionModalShip] = useState<Ship | null>(null);
  const [socialModal, setSocialModal] = useState<{ type: 'leaderboard' | 'referral'; isOpen: boolean }>({
    type: 'leaderboard',
    isOpen: false
  });
  // Practice mode state
  const [showPracticeMenu, setShowPracticeMenu] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'novice' | 'pirate' | 'captain' | 'admiral'>('pirate');
  
  // Spectator mode state
  const [showSpectatorMode, setShowSpectatorMode] = useState(false);

  const { handleGameError } = useErrorHandler();
  const { shown: showOnboarding, dismiss: dismissOnboarding } = useShowOnboarding();

  // Get current player - moved up before viral system
  const getCurrentPlayer = () => {
    if (!gameState) return null;
    // In practice mode, find human player (not AI)
    if (isPracticeMode()) {
      return gameState.players.find((p: any) => !p.publicKey.startsWith('AI_')) || null;
    }
    if (!publicKey) return null;
    return gameState.players.find((p: any) => p.publicKey === publicKey.toString()) || null;
  };

  // Get current player key for turn checking
  const getCurrentPlayerKey = () => {
    if (isPracticeMode()) {
      const humanPlayer = gameState?.players.find((p: any) => !p.publicKey.startsWith('AI_'));
      return humanPlayer?.publicKey;
    }
    return publicKey?.toString();
  };

  // Consolidated viral system
  const viralSystem = useViralSystem(gameState, getCurrentPlayer());

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
    const playerKey = getCurrentPlayerKey();
    if (isMyTurn(playerKey) && gameState?.gameStatus === 'active') {
      startTurn();
    }
  }, [isMyTurn(getCurrentPlayerKey()), gameState?.currentPlayerIndex, gameState?.gameStatus]);

  // Practice mode handlers
  const handleStartPractice = (difficulty: 'novice' | 'pirate' | 'captain' | 'admiral') => {
    // Create a temporary player for practice mode
    const practicePlayer: Player = {
      publicKey: publicKey?.toString() || `guest_${Date.now()}`,
      username: publicKey ? undefined : 'Guest Pirate',
      resources: { gold: 1000, crew: 50, cannons: 10, supplies: 100, wood: 0, rum: 0 },
      ships: [],
      controlledTerritories: [],
      totalScore: 0,
      isActive: true,
      scanCharges: 3,
      scannedCoordinates: [],
      speedBonusAccumulated: 0,
      averageDecisionTimeMs: 0,
      totalMoves: 0,
    };
    
    const success = startPracticeGame(practicePlayer, difficulty);
    if (success) {
      setShowPracticeMenu(false);
      handleGameEvent(`⚔️ Practice mode: ${difficulty} AI opponent!`);
    }
  };

  const handlePracticeMove = async (shipId: string, coordinate: string) => {
    const [x, y] = coordinate.split(',').map(Number);
    const success = makePracticeMove(shipId, x, y);
    if (success) {
      handleGameEvent('Ship moved!');
    }
    return success;
  };

  const handlePracticeAttack = async (shipId: string, targetShipId: string) => {
    const success = makePracticeAttack(shipId, targetShipId);
    if (success) {
      handleGameEvent('⚔️ Attack launched!');
    }
    return success;
  };

  const handlePracticeClaim = async (shipId: string) => {
    const success = makePracticeClaim(shipId);
    if (success) {
      handleGameEvent('🏴‍☠️ Territory claimed!');
    }
    return success;
  };

  // Simplified game event handling with viral moments
  const handleGameEvent = (message: string) => {
    setMessage(message);
    setTimeout(() => setMessage(null), 3000);
  };

  // Handle viral sharing - now consolidated
  const handleViralShare = (event: any, platform?: 'twitter' | 'discord' | 'copy') => {
    viralSystem.handleShare(event, platform);
    handleGameEvent('🚀 Epic moment shared! Spread the world!');
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
    const playerKey = getCurrentPlayerKey();
    if (!playerKey || !gameState || !isMyTurn(playerKey)) return;

    // Practice mode handling
    if (isPracticeMode()) {
      if (selectedShipId) {
        const success = await handlePracticeMove(selectedShipId, coordinate);
        if (success) {
          handleGameEvent('Ship moved successfully!');
        }
      } else {
        // Try to select a ship at this coordinate
        const humanPlayer = gameState.players.find((p: any) => !p.publicKey.startsWith('AI_'));
        const myShips = humanPlayer?.ships.filter((ship: any) =>
          ship.position.x + ',' + ship.position.y === coordinate
        ) || [];

        if (myShips.length > 0) {
          selectShip(myShips[0].id);
          handleGameEvent(`${myShips[0].type} selected`);
        }
      }
      return;
    }

    // On-chain mode handling
    if (!publicKey || !wallet) return;

    if (selectedShipId) {
      // Move selected ship to coordinate
      const success = await moveShip(selectedShipId, coordinate, wallet);
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

  const handleShipAction = async (shipId: string, action: 'move' | 'attack' | 'claim' | 'collect' | 'build') => {
    const playerKey = getCurrentPlayerKey();
    if (!playerKey || !gameState || !isMyTurn(playerKey)) return;

    // Practice mode handling
    if (isPracticeMode()) {
      switch (action) {
        case 'move':
          handleGameEvent('Select a destination for your ship on the map');
          setShipActionModalShip(null);
          break;
        case 'attack':
          const humanPlayer = gameState.players.find((p: any) => !p.publicKey.startsWith('AI_'));
          const myShips = humanPlayer?.ships || [];
          const selectedShip = myShips.find((s: any) => s.id === shipId);
          if (selectedShip) {
            const nearbyEnemies = getAllShips().filter((ship: any) =>
              ship.id.startsWith('AI_') &&
              ship.health > 0 &&
              Math.sqrt(
                Math.pow(ship.position.x - selectedShip.position.x, 2) +
                Math.pow(ship.position.y - selectedShip.position.y, 2)
              ) <= 1.5
            );

            if (nearbyEnemies.length > 0) {
              const success = await handlePracticeAttack(shipId, nearbyEnemies[0].id);
              if (success) {
                handleGameEvent('⚔️ Attack launched!');
              }
            } else {
              handleGameEvent('No enemy ships in range. Move closer to attack.');
            }
          }
          break;
        case 'claim':
          const success = await handlePracticeClaim(shipId);
          if (success) {
            handleGameEvent('🏴‍☠️ Territory claimed!');
          }
          break;
        case 'collect':
          handleGameEvent('💎 Resources auto-collected at turn end in practice mode');
          break;
        case 'build':
          handleGameEvent('🛠️ Ship building: Select water near controlled port');
          break;
      }
      setShipActionModalShip(null);
      return;
    }

    // On-chain mode handling
    if (!wallet) return;

    switch (action) {
      case 'move':
        handleGameEvent('Select a destination for your ship on the map');
        setShipActionModalShip(null); // Close modal, wait for map click
        break;
      case 'attack':
        // Find nearby enemy ships and attack
        const myShipsOnChain = getAllShips().filter((s: any) => s.id.startsWith(publicKey!.toString()));
        const selectedShipOnChain = myShipsOnChain.find((s: any) => s.id === shipId);
        if (selectedShipOnChain) {
          const nearbyEnemies = getAllShips().filter((ship: any) =>
            !ship.id.startsWith(publicKey!.toString()) &&
            ship.health > 0 &&
            Math.sqrt(
              Math.pow(ship.position.x - selectedShipOnChain.position.x, 2) +
              Math.pow(ship.position.y - selectedShipOnChain.position.y, 2)
            ) <= 1.5
          );

          if (nearbyEnemies.length > 0) {
            const success = await attackWithShip(shipId, nearbyEnemies[0].id, wallet);
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
          const success = await claimTerritory(shipId, coordinate, wallet);
          if (success) {
            handleGameEvent('🏴‍☠️ Territory claimed!');
          }
        }
        break;
      case 'collect':
        const collectSuccess = await handleCollectResources();
        if (collectSuccess) {
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
    const playerKey = getCurrentPlayerKey();
    if (!playerKey || !isMyTurn(playerKey)) return;

    // Practice mode: only allow selecting human ships
    if (isPracticeMode()) {
      if (ship.id.startsWith('AI_')) return;
      selectShip(ship.id);
      setShipActionModalShip(ship);
      return;
    }

    // On-chain mode
    if (!publicKey) return;
    if (!ship.id.startsWith(publicKey.toString())) return;

    selectShip(ship.id);
    setShipActionModalShip(ship);
  };

  const clearJoinError = () => setJoinError(undefined);

  return (
    <ErrorBoundary>
      {/* Modals - rendered outside main content for proper overlay */}
      <OnboardingModal isOpen={showOnboarding} onDismiss={dismissOnboarding} />

      {/* Consolidated Viral System */}
      <ViralEventModal
        event={viralSystem.currentEvent}
        onShare={handleViralShare}
        onDismiss={viralSystem.dismissCurrentEvent}
      />
      <SocialModal
        type={socialModal.type}
        gameId={gameState?.gameId}
        isOpen={socialModal.isOpen}
        onClose={() => setSocialModal(prev => ({ ...prev, isOpen: false }))}
      />

      <ErrorToast error={error} onClose={clearError} />
      <SuccessToast message={showMessage} onClose={() => setMessage(null)} />

      {/* Spectator Mode Modal */}
      {showSpectatorMode && (
        <div className="fixed inset-0 z-50 bg-slate-900">
          <SpectatorView
            onClose={() => setShowSpectatorMode(false)}
            onJoinGame={(id) => {
              setShowSpectatorMode(false);
              handleJoinGame(id);
            }}
          />
        </div>
      )}

      {/* Practice Mode Menu Modal */}
      {showPracticeMenu && !gameState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-neon-cyan/50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-neon-cyan/20">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-gold mb-4">
              ⚔️ Practice Mode
            </h2>
            <p className="text-gray-300 mb-6">
              Hone your skills against AI opponents before entering real battles. 
              No wallet required - just pure strategy!
            </p>
            
            <div className="space-y-3 mb-6">
              {(['novice', 'pirate', 'captain', 'admiral'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    selectedDifficulty === diff
                      ? 'border-neon-cyan bg-neon-cyan/20'
                      : 'border-slate-600 hover:border-neon-cyan/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold capitalize">{diff}</span>
                    <span className="text-2xl">
                      {diff === 'novice' && '🐣'}
                      {diff === 'pirate' && '⚔️'}
                      {diff === 'captain' && '🏴‍☠️'}
                      {diff === 'admiral' && '👑'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {diff === 'novice' && 'Perfect for learning the basics'}
                    {diff === 'pirate' && 'Balanced challenge for new players'}
                    {diff === 'captain' && 'Experienced AI with smart tactics'}
                    {diff === 'admiral' && 'Master-level strategic opponent'}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPracticeMenu(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-600 text-gray-300 hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStartPractice(selectedDifficulty)}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-gold text-black font-bold hover:shadow-lg hover:shadow-neon-cyan/50 transition-all"
              >
                Start Practice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Practice Mode Indicator */}
      {isPracticeMode() && (
        <div className="fixed top-4 left-4 z-40">
          <div className="bg-gradient-to-r from-neon-magenta/80 to-neon-purple/80 text-white px-4 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2">
            <span>🎯</span>
            <span>PRACTICE MODE</span>
            <button
              onClick={exitPracticeMode}
              className="ml-2 text-xs bg-black/30 px-2 py-1 rounded hover:bg-black/50 transition-all"
            >
              Exit
            </button>
          </div>
        </div>
      )}

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
          <header className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1" />
              <div className="text-center flex-1">
                <div className="relative">
                  {/* Animated background glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/20 via-neon-gold/20 to-neon-cyan/20 
                                  rounded-2xl blur-xl animate-pulse"></div>

                  {/* Main title */}
                  <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 
                                  border-2 border-neon-cyan/50 rounded-2xl p-6 backdrop-blur-sm
                                  shadow-2xl shadow-neon-cyan/20">
                    <h1 className="text-5xl font-black text-transparent bg-clip-text 
                                   bg-gradient-to-r from-neon-cyan via-neon-gold to-neon-cyan mb-3
                                   animate-subtle-glow drop-shadow-2xl">
                      🏴‍☠️ PIR8 BATTLE ARENA
                    </h1>
                    <p className="text-lg text-gray-300 font-semibold tracking-wide">
                      Strategic naval warfare on the blockchain
                    </p>

                    {/* Dynamic status indicators */}
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <div className="flex items-center gap-2 bg-slate-700/60 rounded-full px-4 py-2 border border-neon-cyan/30">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm font-mono text-green-400">LIVE</span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-700/60 rounded-full px-4 py-2 border border-neon-gold/30">
                        <span className="text-sm font-mono text-neon-gold">DEVNET</span>
                      </div>
                      {gameState?.players && gameState.players.length > 0 && (
                        <div className="flex items-center gap-2 bg-slate-700/60 rounded-full px-4 py-2 border border-neon-magenta/30">
                          <span className="text-sm font-mono text-neon-magenta">
                            {gameState.players.length} PIRATES
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex justify-end items-center gap-4">
                {/* Spectator Mode Button */}
                <button
                  onClick={() => setShowSpectatorMode(true)}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-neon-purple/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                  <div className="relative bg-gradient-to-r from-neon-purple/80 to-neon-cyan/80 
                                  hover:from-neon-purple hover:to-neon-cyan
                                  text-black font-bold py-2 px-4 rounded-xl
                                  hover:shadow-lg hover:shadow-neon-purple/50 hover:scale-105 
                                  active:scale-95 transition-all duration-300 flex items-center gap-2">
                    <span className="text-lg">👁️</span>
                    <span className="hidden sm:inline">Watch</span>
                  </div>
                </button>
                <button
                  onClick={() => setSocialModal({ type: 'referral', isOpen: true })}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-neon-gold/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                  <div className="relative bg-gradient-to-r from-neon-gold/80 to-neon-orange/80 
                                  hover:from-neon-gold hover:to-neon-orange
                                  text-black font-bold py-2 px-4 rounded-xl
                                  hover:shadow-lg hover:shadow-neon-gold/50 hover:scale-105 
                                  active:scale-95 transition-all duration-300 flex items-center gap-2">
                    <span className="text-lg">🚀</span>
                    <span className="hidden sm:inline">Invite</span>
                  </div>
                </button>
                <button
                  onClick={() => setSocialModal({ type: 'leaderboard', isOpen: true })}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-neon-magenta/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                  <div className="relative bg-gradient-to-r from-neon-magenta/80 to-neon-orange/80 
                                  hover:from-neon-magenta hover:to-neon-orange
                                  text-black font-bold py-2 px-4 rounded-xl
                                  hover:shadow-lg hover:shadow-neon-magenta/50 hover:scale-105 
                                  active:scale-95 transition-all duration-300 flex items-center gap-2">
                    <span className="text-lg">🏆</span>
                    <span className="hidden sm:inline">Leaderboard</span>
                  </div>
                </button>
                <PrivacyStatusIndicator />
                <div className="relative">
                  <div className="absolute inset-0 bg-neon-cyan/20 rounded-xl blur-md"></div>
                  <div className="relative">
                    <WalletButtonWrapper />
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Game Container - Extracted for cleaner architecture */}
          {gameState ? (
            <GameContainer
              gameState={gameState}
              currentPlayerPK={isPracticeMode() 
                ? gameState.players.find((p: any) => !p.publicKey.startsWith('AI_'))?.publicKey 
                : publicKey?.toString()
              }
              isPracticeMode={isPracticeMode()}
              isMyTurn={isMyTurn(getCurrentPlayerKey())}
              decisionTimeMs={decisionTime}
              currentPlayerName={getCurrentPlayerName()}
              scanChargesRemaining={scanChargesRemaining}
              speedBonusAccumulated={speedBonusAccumulated}
              averageDecisionTimeMs={averageDecisionTimeMs}
              scannedCoordinates={getScannedCoordinates()}
              selectedShipId={selectedShipId}
              shipActionModalShip={shipActionModalShip}
              onCellSelect={handleCellSelect}
              onShipClick={handleShipClick}
              onShipSelect={selectShip}
              onShipAction={handleShipAction}
              onCloseShipActionModal={() => setShipActionModalShip(null)}
              onCreateGame={handleCreateGame}
              onQuickStart={handleQuickStart}
              onStartGame={async () => {
                if (!wallet) return;
                setIsCreatingGame(true);
                try {
                  const success = await startGame(wallet);
                  if (success) handleGameEvent("🏴‍☠️ Battle Started! Hoist the colors!");
                } catch (error) {
                  handleGameError(error, "start game");
                } finally {
                  setIsCreatingGame(false);
                }
              }}
              onJoinGame={handleJoinGame}
              onEndTurn={endTurn}
              onPracticeMode={() => setShowPracticeMenu(true)}
              onCollectResources={handleCollectResources}
              onBuildShip={handleBuildShip}
              onNewGame={handleNewGame}
              onReturnToLobby={handleReturnToLobby}
              isCreatingGame={isCreatingGame}
              isJoining={isJoining}
              joinError={joinError}
              onClearJoinError={clearJoinError}
              onOpenLeaderboard={() => setSocialModal({ type: 'leaderboard', isOpen: true })}
              onOpenReferral={() => setSocialModal({ type: 'referral', isOpen: true })}
            />
          ) : (
            /* Game Placeholder when no game active */
            <div className="flex-1 flex items-center justify-center min-h-[600px]">
              <div className="text-center p-12 max-w-2xl">
                <div className="mb-8">
                  <div className="text-9xl animate-bounce filter drop-shadow-2xl">🗺️</div>
                </div>
                <h3 className="text-4xl font-black text-transparent bg-clip-text 
                               bg-gradient-to-r from-neon-cyan via-neon-gold to-neon-cyan mb-4">
                  Prepare for Battle!
                </h3>
                <p className="text-xl text-gray-300 mb-8">
                  Use the controls panel to start a practice match or connect your wallet for real battles!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
