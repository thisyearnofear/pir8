/**
 * Main Page Component - PIR8 Battle Arena
 *
 * Following Core Principles:
 * - CLEAN: Thin page shell, logic extracted to GameContainer
 * - MODULAR: Composable components with single responsibilities
 * - DRY: Uses consolidated hooks and shared logic
 */

"use client";

import { useSafeWallet } from "@/components/SafeWalletProvider";
import { usePirateGameState } from "@/hooks/usePirateGameState";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useShowOnboarding } from "@/hooks/useShowOnboarding";
import { useViralSystem } from "@/hooks/useViralSystem";
import { usePrivacySimulation } from "@/hooks/usePrivacySimulation";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorToast, SuccessToast } from "@/components/Toast";
import GameContainer from "@/components/GameContainer";
import SpectatorView from "@/components/SpectatorView";
import OnboardingModal from "@/components/OnboardingModal";
import { ManualSyncButton } from "@/components/ManualSyncButton";
import { GameSyncStatus } from "@/components/GameSyncRecovery";
import ViralEventModal from "@/components/ViralEventModal";
import SocialModal from "@/components/SocialModal";
import AIStreamPanel from "@/components/AIStreamPanel";
import {
  LeakageMeter,
  BountyBoard,
  PrivacyLessonModal,
} from "@/components/privacy";
import AIBattleModal from "@/components/AIBattleModal";
import { AIBattleErrorBoundary } from "@/components/AIBattleErrorBoundary";
import AIBattleControls from "@/components/AIBattleControls";
import {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { createPlayerFromWallet, createAIPlayer } from "@/lib/playerHelper";
import { Ship, Player } from "@/types/game";
import { GameBalance } from "@/lib/gameBalance";
import ModeSelectModal from "@/components/modals/ModeSelectModal";
import PracticeMenuModal from "@/components/modals/PracticeMenuModal";
import PracticeModeBanner from "@/components/modals/PracticeModeBanner";
import GameHeader from "@/components/GameHeader";
import EmptyStateView from "@/components/EmptyStateView";
import { GameProvider } from "@/contexts/GameContext";

export default function Home() {
  // Safely access wallet context
  const { publicKey, wallet } = useSafeWallet();
  const {
    gameState,
    error,
    showMessage,
    selectedShipId,
    averageDecisionTimeMs,
    joinGame,
    findOrCreateGame,
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
    isPracticeMode,
    // AI vs AI mode
    startAIvsAIGame,
    isAIvsAIMode,
    setPlaybackSpeed,
    getPlaybackSpeed,
    setAIDecisionCallback,
    aiReasoningHistory,
  } = usePirateGameState();

  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | undefined>();
  const [shipActionModalShip, setShipActionModalShip] = useState<Ship | null>(
    null,
  );
  const [showModeSelect, setShowModeSelect] = useState(false);
  const [socialModal, setSocialModal] = useState<{
    type: "leaderboard" | "referral";
    isOpen: boolean;
  }>({
    type: "leaderboard",
    isOpen: false,
  });
  // Practice mode state
  const [showPracticeMenu, setShowPracticeMenu] = useState(false);

  // AI vs AI mode state
  const [showAIBattleModal, setShowAIBattleModal] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState<"leakage" | "ai" | null>(
    "ai",
  );

  // Spectator mode state
  const [showSpectatorMode, setShowSpectatorMode] = useState(false);

  const { handleGameError } = useErrorHandler();
  const { shown: showOnboarding, dismiss: dismissOnboarding } =
    useShowOnboarding();

  // Get current player - moved up before viral system
  const getCurrentPlayer = () => {
    if (!gameState?.players) return null;
    // In practice mode, find human player (not AI)
    if (isPracticeMode()) {
      return (
        gameState.players.find((p: any) => !p.publicKey.startsWith("AI_")) ||
        null
      );
    }
    if (!publicKey) return null;
    return (
      gameState.players.find(
        (p: any) => p.publicKey === publicKey.toString(),
      ) || null
    );
  };

  // Get current player key for turn checking - memoized to prevent recalculations
  const getCurrentPlayerKey = useMemo(() => {
    if (isPracticeMode()) {
      const humanPlayer = gameState?.players?.find(
        (p: any) => !p.publicKey.startsWith("AI_"),
      );
      return humanPlayer?.publicKey;
    }
    return publicKey?.toString();
  }, [gameState?.players, publicKey, isPracticeMode]);

  // Consolidated viral system (auto-dismiss disabled in practice mode)
  const viralSystem = useViralSystem(gameState, getCurrentPlayer(), {
    disableAutoDismiss: isPracticeMode(),
  });

  // Privacy simulation for practice mode
  const privacySim = usePrivacySimulation({ enabled: isPracticeMode() });

  // Update privacy simulation when game state changes in practice mode
  useEffect(() => {
    if (isPracticeMode() && gameState?.players) {
      const humanPlayer = gameState.players.find(
        (p: any) => !p.publicKey.startsWith("AI_"),
      );
      if (humanPlayer) {
        // Get recent actions from game state (or empty array if not available)
        const recentActions = (gameState as any).recentActions || [];
        privacySim.updateLeakage(gameState, humanPlayer, recentActions);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, isPracticeMode]);

  // Get current player name for TurnBanner
  const getCurrentPlayerName = () => {
    if (!gameState?.players) return "opponent";
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    return (
      currentPlayer?.username ||
      currentPlayer?.publicKey?.slice(0, 8) ||
      "opponent"
    );
  };

  // Handle resource collection
  const handleCollectResources = async () => {
    if (!wallet) return false;
    try {
      const success = await collectResources(wallet);
      if (success) {
        handleGameEvent("💰 Resources collected from territories!");
      }
      return success;
    } catch (error) {
      console.error("Resource collection failed:", error);
      return false;
    }
  };

  // Handle ship building
  const handleBuildShip = async (
    shipType: string,
    portX: number,
    portY: number,
  ) => {
    if (!wallet) return false;
    try {
      const success = await buildShip(shipType, portX, portY, wallet);
      if (success) {
        handleGameEvent(
          `🛠️ ${shipType.charAt(0).toUpperCase() + shipType.slice(1)} built successfully!`,
        );
      }
      return success;
    } catch (error) {
      console.error("Ship building failed:", error);
      return false;
    }
  };

  // Handle victory screen actions
  const handleNewGame = async () => {
    if (!publicKey || !wallet) return;
    try {
      const player = createPlayerFromWallet(publicKey);
      await findOrCreateGame("Casual", player, wallet);
      handleGameEvent("🏴‍☠️ New battle begins!");
    } catch (error) {
      handleGameError(error, "create new game");
    }
  };

  const handleReturnToLobby = () => {
    // Reset game state - this would typically navigate to a lobby
    handleGameEvent("Returning to lobby...");
  };

  // Start turn timer when it becomes player's turn
  useEffect(() => {
    const playerKey = getCurrentPlayerKey;
    const isTurn = isMyTurn(playerKey);
    if (isTurn && gameState?.gameStatus === "active") {
      startTurn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gameState?.currentPlayerIndex,
    gameState?.gameStatus,
    publicKey,
    getCurrentPlayerKey,
  ]);

  // Practice mode handlers - memoized with useCallback to prevent re-creations
  // Note: handleGameEvent intentionally not in deps to avoid stale closures in game loops
  const handleStartPractice = useCallback(
    (difficulty: "novice" | "pirate" | "captain" | "admiral") => {
      // Create a temporary player for practice mode
      const practicePlayer: Player = {
        publicKey: publicKey?.toString() || `guest_${Date.now()}`,
        username: publicKey ? undefined : "Guest Pirate",
        resources: {
          gold: 1000,
          crew: 50,
          cannons: 10,
          supplies: 100,
          wood: 0,
          rum: 0,
        },
        ships: [],
        controlledTerritories: [],
        totalScore: 0,
        isActive: true,
        scanCharges: 3,
        scannedCoordinates: [],
        speedBonusAccumulated: 0,
        averageDecisionTimeMs: 0,
        totalMoves: 0,
        consecutiveAttacks: 0,
        lastActionWasAttack: false,
      };

      const success = startPracticeGame(practicePlayer, difficulty);
      if (success) {
        setShowPracticeMenu(false);
        handleGameEvent(`⚔️ Practice mode: ${difficulty} AI opponent!`);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [publicKey, startPracticeGame],
  );

  // AI vs AI mode handler
  // Note: handleGameEvent intentionally not in deps to avoid stale closures in game loops
  const handleStartAIBattle = useCallback(
    (difficulty1: string, difficulty2: string, speed: number) => {
      const success = startAIvsAIGame(
        difficulty1 as "novice" | "pirate" | "captain" | "admiral",
        difficulty2 as "novice" | "pirate" | "captain" | "admiral",
        speed,
      );
      if (success) {
        handleGameEvent(`⚔️ AI Battle: ${difficulty1} vs ${difficulty2}!`);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startAIvsAIGame],
  );

  // Set up AI decision callback for AI vs AI mode
  // Note: AIReasoningPanel now handles all AI reasoning display
  useEffect(() => {
    if (isAIvsAIMode) {
      // Set dummy callback to enable reasoning generation in store
      setAIDecisionCallback(() => { });
    } else {
      setAIDecisionCallback(null);
    }
    return () => {
      setAIDecisionCallback(null);
    };
  }, [isAIvsAIMode, setAIDecisionCallback]);

  const handlePracticeMove = async (shipId: string, coordinate: string) => {
    const [x, y] = coordinate.split(",").map(Number);
    const success = makePracticeMove(shipId, x, y);
    if (success) {
      // Debounce game events to prevent rapid updates
      setTimeout(() => handleGameEvent("Ship moved!"), 50);
    }
    return success;
  };

  const handlePracticeAttack = async (shipId: string, targetShipId: string) => {
    const success = makePracticeAttack(shipId, targetShipId);
    if (success) {
      handleGameEvent("⚔️ Attack launched!");
    }
    return success;
  };

  const handlePracticeClaim = async (shipId: string) => {
    const success = makePracticeClaim(shipId);
    if (success) {
      handleGameEvent("🏴‍☠️ Territory claimed!");
    }
    return success;
  };

  // Simplified game event handling with viral moments
  const handleGameEvent = (message: string) => {
    // Clear any existing message first to prevent queue buildup
    setMessage(null);
    setTimeout(() => {
      setMessage(message);
      setTimeout(() => setMessage(null), 3000);
    }, 50);
  };

  // Handle viral sharing - now consolidated
  const handleViralShare = (
    event: any,
    platform?: "twitter" | "discord" | "copy",
  ) => {
    viralSystem.handleShare(event, platform);
    handleGameEvent("🚀 Epic moment shared! Spread the world!");
  };

  const handleCreateGame = async () => {
    if (!publicKey || !wallet) {
      setJoinError("Please connect your wallet first");
      return;
    }
    setShowModeSelect(true);
  };

  const handleModeSelected = async (
    mode: "Casual" | "Competitive" | "AgentArena",
  ) => {
    if (!publicKey || !wallet) return;

    setShowModeSelect(false);
    setIsCreatingGame(true);
    setJoinError(undefined);

    try {
      // Use proper client-side transaction building
      const { initializeGame, joinGame, createWalletAdapter } = await import("@/lib/client/transactionBuilder");

      // Create a wallet adapter compatible object
      const walletAdapter = createWalletAdapter({ ...wallet, publicKey });

      // Initialize a new game with user's wallet
      console.log(`Creating ${mode} game...`);
      const gameId = Date.now();
      const txSignature = await initializeGame(walletAdapter, gameId, mode);
      console.log('Game initialized:', txSignature);

      // Join the game we just created
      const joinTxSignature = await joinGame(walletAdapter, gameId);
      console.log('Joined game:', joinTxSignature);

      handleGameEvent(`🏴‍☠️ ${mode} Arena created! Waiting for opponents...`);

      // TODO: Update game state from blockchain
      // For now, we'll need to implement proper state fetching

    } catch (error) {
      console.error("Failed to create arena:", error);
      setJoinError(error instanceof Error ? error.message : "Failed to create battle arena");
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
      // Use proper client-side transaction building
      const { joinGame, createWalletAdapter } = await import("@/lib/client/transactionBuilder");

      // Create a wallet adapter compatible object
      const walletAdapter = createWalletAdapter({ ...wallet, publicKey });

      console.log(`Joining game: ${gameIdInput}`);
      const txSignature = await joinGame(walletAdapter);
      console.log('Joined game:', txSignature);

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
  };

  const handleCellSelect = async (coordinate: string) => {
    const playerKey = getCurrentPlayerKey;
    if (!playerKey || !gameState?.players || !isMyTurn(playerKey)) return;

    // Practice mode handling
    if (isPracticeMode()) {
      if (selectedShipId) {
        const success = await handlePracticeMove(selectedShipId, coordinate);
        if (success) {
          handleGameEvent("Ship moved successfully!");
        }
      } else {
        // Try to select a ship at this coordinate
        const humanPlayer = gameState.players.find(
          (p: any) => !p.publicKey.startsWith("AI_"),
        );
        const myShips =
          humanPlayer?.ships?.filter(
            (ship: any) =>
              ship.position.x + "," + ship.position.y === coordinate,
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
        handleGameEvent("Ship moved successfully!");
      }
    } else {
      // Try to select a ship at this coordinate
      const myShips = getAllShips().filter(
        (ship: any) =>
          ship.id.startsWith(publicKey.toString()) &&
          ship.position.x + "," + ship.position.y === coordinate,
      );

      if (myShips.length > 0) {
        selectShip(myShips[0].id);
        handleGameEvent(`${myShips[0].type} selected`);
      }
    }
  };

  const handleShipAction = async (
    shipId: string,
    action: "move" | "attack" | "claim" | "collect" | "build",
  ) => {
    const playerKey = getCurrentPlayerKey;
    if (!playerKey || !gameState || !isMyTurn(playerKey)) return;

    // Practice mode handling
    if (isPracticeMode()) {
      switch (action) {
        case "move":
          handleGameEvent("Select a destination for your ship on the map");
          setShipActionModalShip(null);
          break;
        case "attack":
          const humanPlayer = gameState.players.find(
            (p: any) => !p.publicKey.startsWith("AI_"),
          );
          const myShips = humanPlayer?.ships || [];
          const selectedShip = myShips.find((s: any) => s.id === shipId) as
            | Ship
            | undefined;
          if (selectedShip) {
            const range = GameBalance.SHIP_BALANCE[selectedShip.type].range;
            const nearbyEnemies = getAllShips().filter(
              (ship: any) =>
                ship.id.startsWith("AI_") &&
                ship.health > 0 &&
                Math.sqrt(
                  Math.pow(ship.position.x - selectedShip.position.x, 2) +
                  Math.pow(ship.position.y - selectedShip.position.y, 2),
                ) <=
                range * 1.5,
            );

            if (nearbyEnemies.length > 0) {
              const success = await handlePracticeAttack(
                shipId,
                nearbyEnemies[0].id,
              );
              if (success) {
                handleGameEvent("⚔️ Attack launched!");
              }
            } else {
              handleGameEvent(
                "No enemy ships in range. Move closer to attack.",
              );
            }
          }
          break;
        case "claim":
          const success = await handlePracticeClaim(shipId);
          if (success) {
            handleGameEvent("🏴‍☠️ Territory claimed!");
          }
          break;
        case "collect":
          handleGameEvent(
            "💎 Resources auto-collected at turn end in practice mode",
          );
          break;
        case "build":
          handleGameEvent(
            "🛠️ Ship building: Select water near controlled port",
          );
          break;
      }
      setShipActionModalShip(null);
      return;
    }

    // On-chain mode handling
    if (!wallet) return;

    switch (action) {
      case "move":
        handleGameEvent("Select a destination for your ship on the map");
        setShipActionModalShip(null); // Close modal, wait for map click
        break;
      case "attack":
        // Find nearby enemy ships and attack
        const myShipsOnChain = getAllShips().filter((s: any) =>
          s.id.startsWith(publicKey!.toString()),
        );
        const selectedShipOnChain = myShipsOnChain.find(
          (s: any) => s.id === shipId,
        ) as Ship | undefined;
        if (selectedShipOnChain) {
          const range =
            GameBalance.SHIP_BALANCE[selectedShipOnChain.type].range;
          const nearbyEnemies = getAllShips().filter(
            (ship: any) =>
              !ship.id.startsWith(publicKey!.toString()) &&
              ship.health > 0 &&
              Math.sqrt(
                Math.pow(ship.position.x - selectedShipOnChain.position.x, 2) +
                Math.pow(ship.position.y - selectedShipOnChain.position.y, 2),
              ) <=
              range * 1.5,
          );

          if (nearbyEnemies.length > 0) {
            const success = await attackWithShip(
              shipId,
              nearbyEnemies[0].id,
              wallet,
            );
            if (success) {
              handleGameEvent("⚔️ Attack launched!");
            }
          } else {
            handleGameEvent("No enemy ships in range. Move closer to attack.");
          }
        }
        break;
      case "claim":
        const ship = getAllShips().find((s: any) => s.id === shipId);
        if (ship) {
          const coordinate = `${ship.position.x},${ship.position.y}`;
          const success = await claimTerritory(shipId, coordinate, wallet);
          if (success) {
            handleGameEvent("🏴‍☠️ Territory claimed!");
          }
        }
        break;
      case "collect":
        const collectSuccess = await handleCollectResources();
        if (collectSuccess) {
          handleGameEvent("💎 Resources collected!");
        }
        break;
      case "build":
        handleGameEvent("🛠️ Ship building: Select water near controlled port");
        break;
    }
    setShipActionModalShip(null); // Close modal after action
  };

  // Handle ship click to open action modal
  const handleShipClick = (ship: Ship) => {
    const playerKey = getCurrentPlayerKey;
    if (!playerKey || !isMyTurn(playerKey)) return;

    // Practice mode: only allow selecting human ships
    if (isPracticeMode()) {
      if (ship.id.startsWith("AI_")) return;
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
        isPracticeMode={isPracticeMode()}
      />
      <SocialModal
        type={socialModal.type}
        gameId={gameState?.gameId}
        isOpen={socialModal.isOpen}
        onClose={() => setSocialModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <ErrorToast error={error} onClose={clearError} />
      <SuccessToast message={showMessage} onClose={() => setMessage(null)} />

      {/* Privacy & AI Stream Components - Side Panel Stack */}
      {(isPracticeMode() || isAIvsAIMode) && (
        <div className="fixed top-20 right-4 z-privacy-panel w-80 space-y-3">
          {/* Information Leakage Meter */}
          {privacySim.leakageReport && (
            <LeakageMeter
              report={privacySim.leakageReport}
              isGhostFleetActive={
                privacySim.ghostFleetStatus?.isActive || false
              }
              ghostFleetCharges={
                privacySim.ghostFleetStatus?.chargesRemaining || 0
              }
              isExpanded={expandedPanel === "leakage"}
              onToggle={() =>
                setExpandedPanel(expandedPanel === "leakage" ? null : "leakage")
              }
            />
          )}

          {/* AI Thought Stream - NEW ongoing stream */}
          <AIStreamPanel
            history={aiReasoningHistory}
            isExpanded={expandedPanel === "ai"}
            onToggle={() =>
              setExpandedPanel(expandedPanel === "ai" ? null : "ai")
            }
          />
        </div>
      )}

      {isPracticeMode() && (
        <>
          <PrivacyLessonModal
            lesson={privacySim.currentLesson}
            isVisible={privacySim.isLessonVisible}
            onDismiss={privacySim.dismissLesson}
            onActivateGhostFleet={privacySim.activateGhostFleet}
          />

          <BountyBoard
            dossier={
              privacySim.dossier || {
                playerId: "",
                movesAnalyzed: 0,
                patternsIdentified: [],
                predictabilityScore: 0,
                typicalPlayStyle: "balanced",
                lastUpdated: new Date(),
              }
            }
            isVisible={privacySim.isDossierVisible}
            onClose={privacySim.hideDossier}
          />
        </>
      )}

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

      {/* AI vs AI Battle Modal */}
      <AIBattleModal
        isOpen={showAIBattleModal}
        onClose={() => setShowAIBattleModal(false)}
        onStartBattle={handleStartAIBattle}
      />

      {/* AI Decision display removed - now handled by AIReasoningPanel */}

      {/* Game Mode Selection Modal */}
      <ModeSelectModal
        isOpen={showModeSelect}
        onClose={() => setShowModeSelect(false)}
        onModeSelected={handleModeSelected}
      />

      {/* Practice Mode Menu Modal - Performance Optimized */}
      <PracticeMenuModal
        isOpen={showPracticeMenu && !gameState}
        onClose={() => setShowPracticeMenu(false)}
        onStartPractice={handleStartPractice}
      />

      {/* AI vs AI Battle Controls */}
      {isAIvsAIMode && (
        <AIBattleControls
          playbackSpeed={getPlaybackSpeed()}
          onSpeedChange={setPlaybackSpeed}
          gameState={gameState}
          isAIvsAIMode={isAIvsAIMode}
        />
      )}

      {/* Practice Mode Indicator with Upgrade Prompt - Enhanced Readability */}
      {isPracticeMode() && !isAIvsAIMode && (
        <PracticeModeBanner
          onExit={exitPracticeMode}
          onShowDossier={privacySim.showDossier}
          showUpgradePrompt={!publicKey}
          onUpgrade={() => {
            exitPracticeMode();
            handleGameEvent(
              "Connect your wallet to play on-chain battles!",
            );
          }}
        />
      )}

      {/* Manual sync button for testing blockchain synchronization */}
      <ManualSyncButton />

      {/* Additional debug components in development mode */}
      {process.env.NODE_ENV !== "production" && (
        <>
          <GameSyncStatus />
        </>
      )}

      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4 py-6">
          <GameHeader
            onSpectatorMode={() => setShowSpectatorMode(true)}
            onOpenReferral={() =>
              setSocialModal({ type: "referral", isOpen: true })
            }
            onOpenLeaderboard={() =>
              setSocialModal({ type: "leaderboard", isOpen: true })
            }
            playerCount={gameState?.players?.length}
          />

          {/* Main Game Container - Extracted for cleaner architecture */}
          {gameState ? (
            <GameProvider wallet={wallet}>
              {isAIvsAIMode ? (
                <AIBattleErrorBoundary>
                  <GameContainer
                    onShipAction={handleShipAction}
                    onShipClick={handleShipClick}
                    onCellSelect={handleCellSelect}
                    onNewGame={handleNewGame}
                    onReturnToLobby={handleReturnToLobby}
                    onOpenLeaderboard={() => setSocialModal({ type: "leaderboard", isOpen: true })}
                    onOpenReferral={() => setSocialModal({ type: "referral", isOpen: true })}
                  />
                </AIBattleErrorBoundary>
              ) : (
                <GameContainer
                  onShipAction={handleShipAction}
                  onShipClick={handleShipClick}
                  onCellSelect={handleCellSelect}
                  onNewGame={handleNewGame}
                  onReturnToLobby={handleReturnToLobby}
                  onOpenLeaderboard={() => setSocialModal({ type: "leaderboard", isOpen: true })}
                  onOpenReferral={() => setSocialModal({ type: "referral", isOpen: true })}
                />
              )}
            </GameProvider>
          ) : (
            <EmptyStateView
              isConnected={!!publicKey}
              onPracticeMode={() => setShowPracticeMenu(true)}
              onCreateGame={handleCreateGame}
              onSpectatorMode={() => setShowSpectatorMode(true)}
              onAIBattle={() => setShowAIBattleModal(true)}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
