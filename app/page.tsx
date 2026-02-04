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
import PrivacyStatusIndicator from "@/components/PrivacyStatusIndicator";
import ViralEventModal from "@/components/ViralEventModal";
import SocialModal from "@/components/SocialModal";
import LobbyBrowser from "@/components/LobbyBrowser";
import AIStreamPanel from "@/components/AIStreamPanel";
import {
  LeakageMeter,
  BountyBoard,
  PrivacyLessonModal,
} from "@/components/privacy";
import AIBattleModal from "@/components/AIBattleModal";
import { AIBattleErrorBoundary } from "@/components/AIBattleErrorBoundary";
import AIBattleControls from "@/components/AIBattleControls";
import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { createPlayerFromWallet, createAIPlayer } from "@/lib/playerHelper";
import { Ship, Player } from "@/types/game";
import { GameBalance } from "@/lib/gameBalance";

const WalletButtonWrapper = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton,
    ),
  {
    ssr: false,
    loading: () => <div className="px-4 py-2 text-gray-400">Loading...</div>,
  },
);

export default function Home() {
  // Safely access wallet context
  const { publicKey, wallet } = useSafeWallet();
  const {
    gameState,
    error,
    showMessage,
    selectedShipId,
    decisionTime,
    scanChargesRemaining,
    speedBonusAccumulated,
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
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    "novice" | "pirate" | "captain" | "admiral"
  >("pirate");

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
    [publicKey, startPracticeGame],
  );

  // AI vs AI mode handler
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
      const txSignature = await initializeGame(walletAdapter);
      console.log('Game initialized:', txSignature);

      // Join the game we just created
      const joinTxSignature = await joinGame(walletAdapter);
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
      {showModeSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-neon-cyan/50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-neon-cyan/20 transform transition-all duration-300">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-gold mb-4">
              Choose Battle Arena
            </h2>
            <div className="space-y-4">
              <button
                onClick={() => handleModeSelected("Casual")}
                className="w-full p-4 bg-slate-800 border-2 border-neon-cyan rounded-xl hover:bg-slate-700 transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl font-bold text-neon-cyan">
                    Casual Arena
                  </span>
                  <span className="text-2xl">🏴‍☠️</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Mixed battles. Humans and Agents welcome. Great for quick
                  matches.
                </p>
              </button>

              <button
                onClick={() => handleModeSelected("Competitive")}
                className="w-full p-4 bg-slate-800 border-2 border-neon-gold rounded-xl hover:bg-slate-700 transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl font-bold text-neon-gold">
                    Competitive
                  </span>
                  <span className="text-2xl">🏆</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Humans only. Prove your skill against real players.
                </p>
              </button>

              <button
                onClick={() => handleModeSelected("AgentArena")}
                className="w-full p-4 bg-slate-800 border-2 border-neon-magenta rounded-xl hover:bg-slate-700 transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl font-bold text-neon-magenta">
                    Agent Arena
                  </span>
                  <span className="text-2xl">🤖</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Bot battles. Test your agents against others or the house AI.
                </p>
              </button>
            </div>
            <button
              onClick={() => setShowModeSelect(false)}
              className="mt-6 w-full py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Practice Mode Menu Modal - Performance Optimized */}
      {showPracticeMenu && !gameState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-neon-cyan/50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-neon-cyan/20 transform transition-all duration-300">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-gold mb-4">
              ⚔️ Practice Mode
            </h2>
            <p className="text-gray-300 mb-6">
              Hone your skills against AI opponents before entering real
              battles. No wallet required - just pure strategy!
            </p>

            <div className="space-y-3 mb-6">
              {(["novice", "pirate", "captain", "admiral"] as const).map(
                (diff) => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${selectedDifficulty === diff
                      ? "border-neon-cyan bg-neon-cyan/20"
                      : "border-slate-600 hover:border-neon-cyan/50"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold capitalize">{diff}</span>
                      <span className="text-2xl">
                        {diff === "novice" && "🐣"}
                        {diff === "pirate" && "⚔️"}
                        {diff === "captain" && "🏴‍☠️"}
                        {diff === "admiral" && "👑"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {diff === "novice" && "Perfect for learning the basics"}
                      {diff === "pirate" &&
                        "Balanced challenge for new players"}
                      {diff === "captain" &&
                        "Experienced AI with smart tactics"}
                      {diff === "admiral" && "Master-level strategic opponent"}
                    </p>
                  </button>
                ),
              )}
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
        <div className="fixed top-4 left-4 z-40">
          <div className="bg-gradient-to-r from-neon-magenta/90 to-neon-purple/90 text-white rounded-xl font-bold shadow-lg overflow-hidden animate-fade-in">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/20">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <span className="text-sm font-black">PRACTICE MODE</span>
              </div>
              <button
                onClick={exitPracticeMode}
                className="text-xs bg-black/30 px-3 py-1.5 rounded hover:bg-black/50 transition-all"
                title="Exit practice mode"
              >
                Exit
              </button>
            </div>

            {/* Status Info */}
            <div className="px-4 py-2 bg-black/20">
              <p className="text-xs text-white/90">
                🛡️ Safe environment - no blockchain fees
              </p>
            </div>

            {/* Privacy Education Button */}
            <div className="px-4 py-2 bg-black/20 border-t border-white/10">
              <button
                onClick={privacySim.showDossier}
                className="w-full text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <span>📋</span>
                <span>View AI Dossier on You</span>
              </button>
              <p className="text-[10px] text-white/50 mt-1 text-center">
                See what opponents learn from visible data
              </p>
            </div>

            {/* Upgrade Prompt (if not connected) */}
            {!publicKey && (
              <div className="px-4 py-3 bg-black/20 space-y-2 border-t border-white/10">
                <p className="text-xs text-white/90 font-semibold">
                  🏆 Ready for real battles with stakes?
                </p>
                <button
                  onClick={() => {
                    exitPracticeMode();
                    // Wallet button will be visible on main page
                    handleGameEvent(
                      "Connect your wallet to play on-chain battles!",
                    );
                  }}
                  className="w-full text-xs bg-gradient-to-r from-neon-cyan to-neon-gold text-black font-bold py-2 px-3 rounded-lg
                             hover:shadow-lg hover:scale-105 transition-all"
                >
                  Connect Wallet & Play On-Chain
                </button>
              </div>
            )}
          </div>
        </div>
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
          <header className="mb-6">
            {/* Mobile-First Header Layout */}
            <div className="space-y-4">
              {/* Title Section - Always Full Width */}
              <div className="text-center">
                <div className="relative inline-block">
                  {/* Animated background glow */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-neon-cyan/20 via-neon-gold/20 to-neon-cyan/20
                                  rounded-2xl blur-xl animate-pulse"
                  ></div>

                  {/* Main title */}
                  <div
                    className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90
                                  border-2 border-neon-cyan/50 rounded-2xl p-4 sm:p-6 backdrop-blur-sm
                                  shadow-2xl shadow-neon-cyan/20"
                  >
                    <h1
                      className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text
                                   bg-gradient-to-r from-neon-cyan via-neon-gold to-neon-cyan mb-2 sm:mb-3
                                   animate-subtle-glow drop-shadow-2xl"
                    >
                      🏴‍☠️ PIR8 BATTLE ARENA
                    </h1>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-300 font-semibold tracking-wide">
                      Strategic naval warfare on the blockchain
                    </p>

                    {/* Dynamic status indicators */}
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-3 sm:mt-4">
                      <div className="flex items-center gap-2 bg-slate-700/60 rounded-full px-3 py-1.5 border border-neon-cyan/30">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs sm:text-sm font-mono text-green-400">
                          LIVE
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-700/60 rounded-full px-3 py-1.5 border border-neon-gold/30">
                        <span className="text-xs sm:text-sm font-mono text-neon-gold">
                          DEVNET
                        </span>
                      </div>
                      {gameState?.players && gameState.players.length > 0 && (
                        <div className="flex items-center gap-2 bg-slate-700/60 rounded-full px-3 py-1.5 border border-neon-magenta/30">
                          <span className="text-xs sm:text-sm font-mono text-neon-magenta">
                            {gameState.players.length} PIRATES
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Responsive Grid */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                {/* Spectator Mode Button */}
                <button
                  onClick={() => setShowSpectatorMode(true)}
                  className="relative group"
                  aria-label="Watch battles"
                >
                  <div className="absolute inset-0 bg-neon-purple/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                  <div
                    className="relative bg-gradient-to-r from-neon-purple/80 to-neon-cyan/80
                                  hover:from-neon-purple hover:to-neon-cyan
                                  text-black font-bold py-2 px-3 sm:px-4 rounded-xl
                                  hover:shadow-lg hover:shadow-neon-purple/50 hover:scale-105
                                  active:scale-95 transition-all duration-300 flex items-center gap-2
                                  text-sm sm:text-base"
                  >
                    <span className="text-base sm:text-lg">👁️</span>
                    <span className="hidden sm:inline">Watch</span>
                  </div>
                </button>

                {/* Invite Button */}
                <button
                  onClick={() =>
                    setSocialModal({ type: "referral", isOpen: true })
                  }
                  className="relative group"
                  aria-label="Invite friends"
                >
                  <div className="absolute inset-0 bg-neon-gold/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                  <div
                    className="relative bg-gradient-to-r from-neon-gold/80 to-neon-orange/80
                                  hover:from-neon-gold hover:to-neon-orange
                                  text-black font-bold py-2 px-3 sm:px-4 rounded-xl
                                  hover:shadow-lg hover:shadow-neon-gold/50 hover:scale-105
                                  active:scale-95 transition-all duration-300 flex items-center gap-2
                                  text-sm sm:text-base"
                  >
                    <span className="text-base sm:text-lg">🚀</span>
                    <span className="hidden sm:inline">Invite</span>
                  </div>
                </button>

                {/* Leaderboard Button */}
                <button
                  onClick={() =>
                    setSocialModal({ type: "leaderboard", isOpen: true })
                  }
                  className="relative group"
                  aria-label="View leaderboard"
                >
                  <div className="absolute inset-0 bg-neon-magenta/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                  <div
                    className="relative bg-gradient-to-r from-neon-magenta/80 to-neon-orange/80
                                  hover:from-neon-magenta hover:to-neon-orange
                                  text-black font-bold py-2 px-3 sm:px-4 rounded-xl
                                  hover:shadow-lg hover:shadow-neon-magenta/50 hover:scale-105
                                  active:scale-95 transition-all duration-300 flex items-center gap-2
                                  text-sm sm:text-base"
                  >
                    <span className="text-base sm:text-lg">🏆</span>
                    <span className="hidden sm:inline">Leaderboard</span>
                  </div>
                </button>

                {/* Privacy Indicator */}
                <PrivacyStatusIndicator />

                {/* Wallet Button */}
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
            isAIvsAIMode ? (
              <AIBattleErrorBoundary>
                <GameContainer
                  gameState={gameState}
                  currentPlayerPK={
                    isPracticeMode()
                      ? gameState.players.find(
                        (p: any) => !p.publicKey.startsWith("AI_"),
                      )?.publicKey
                      : publicKey?.toString()
                  }
                  isPracticeMode={isPracticeMode()}
                  isMyTurn={isMyTurn(getCurrentPlayerKey)}
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
                      const { startGame, createWalletAdapter } = await import("@/lib/client/transactionBuilder");
                      const walletAdapter = createWalletAdapter({ ...wallet, publicKey });
                      const txSignature = await startGame(walletAdapter);
                      console.log('Game started:', txSignature);
                      handleGameEvent("🏴‍☠️ Battle Started! Hoist the colors!");
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
                  onOpenLeaderboard={() =>
                    setSocialModal({ type: "leaderboard", isOpen: true })
                  }
                  onOpenReferral={() =>
                    setSocialModal({ type: "referral", isOpen: true })
                  }
                />
              </AIBattleErrorBoundary>
            ) : (
              <GameContainer
                gameState={gameState}
                currentPlayerPK={
                  isPracticeMode()
                    ? gameState.players.find(
                      (p: any) => !p.publicKey.startsWith("AI_"),
                    )?.publicKey
                    : publicKey?.toString()
                }
                isPracticeMode={isPracticeMode()}
                isMyTurn={isMyTurn(getCurrentPlayerKey)}
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
                    const { startGame, createWalletAdapter } = await import("@/lib/client/transactionBuilder");
                    const walletAdapter = createWalletAdapter({ ...wallet, publicKey });
                    const txSignature = await startGame(walletAdapter);
                    console.log('Game started:', txSignature);
                    handleGameEvent("🏴‍☠️ Battle Started! Hoist the colors!");
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
                onOpenLeaderboard={() =>
                  setSocialModal({ type: "leaderboard", isOpen: true })
                }
                onOpenReferral={() =>
                  setSocialModal({ type: "referral", isOpen: true })
                }
              />
            )
          ) : (
            /* Enhanced Empty State with Wallet CTA */
            <div className="flex-1 flex items-center justify-center min-h-[600px] px-4">
              <div className="text-center max-w-4xl w-full">
                {!publicKey ? (
                  /* Not Connected - Wallet CTA */
                  <div className="space-y-8">
                    <div className="relative inline-block">
                      <div className="text-8xl sm:text-9xl animate-bounce-slow filter drop-shadow-2xl">
                        🔐
                      </div>
                      <div className="absolute -top-4 -right-4 text-4xl animate-spin-slow">
                        ⚓
                      </div>
                    </div>

                    <div>
                      <h3
                        className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text
                                     bg-gradient-to-r from-neon-cyan via-neon-gold to-neon-cyan mb-4
                                     animate-subtle-glow"
                      >
                        Connect Your Wallet to Begin
                      </h3>
                      <p className="text-lg sm:text-xl text-gray-300 mb-2">
                        Join the battle on Solana blockchain
                      </p>
                      <p className="text-base text-gray-400 mb-8">
                        Or start a practice match without connecting - no wallet
                        needed!
                      </p>
                    </div>

                    {/* Action Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                      <div
                        className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-2 border-neon-cyan/50
                                     rounded-2xl p-6 hover:scale-105 transition-all duration-300
                                     hover:shadow-lg hover:shadow-neon-cyan/30"
                      >
                        <div className="text-5xl mb-4">💎</div>
                        <h4 className="text-xl font-bold text-neon-cyan mb-2">
                          Real Battles
                        </h4>
                        <p className="text-sm text-gray-400 mb-4">
                          Connect wallet to play on-chain, earn rewards, and
                          climb the leaderboard
                        </p>
                        <div className="inline-flex items-center gap-2 text-neon-cyan text-sm font-semibold">
                          <span>Click &quot;Connect Wallet&quot; above</span>
                          <span>↑</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowPracticeMenu(true)}
                        className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-2 border-neon-gold/50
                                   rounded-2xl p-6 hover:scale-105 transition-all duration-300
                                   hover:shadow-lg hover:shadow-neon-gold/30 text-left"
                      >
                        <div className="text-5xl mb-4">🎮</div>
                        <h4 className="text-xl font-bold text-neon-gold mb-2">
                          Practice Mode
                        </h4>
                        <p className="text-sm text-gray-400 mb-4">
                          Play offline vs AI opponents - perfect for learning
                          the game!
                        </p>
                        <div className="inline-flex items-center gap-2 text-neon-gold text-sm font-semibold">
                          <span>Click to Start</span>
                          <span>→</span>
                        </div>
                      </button>

                      {/* NEW: AI vs AI Demo */}
                      <button
                        onClick={() => setShowAIBattleModal(true)}
                        className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-2 border-neon-magenta/50
                                   rounded-2xl p-6 hover:scale-105 transition-all duration-300
                                   hover:shadow-lg hover:shadow-neon-magenta/30 text-left"
                      >
                        <div className="text-5xl mb-4">⚔️</div>
                        <h4 className="text-xl font-bold text-neon-magenta mb-2">
                          Watch AI Battle
                        </h4>
                        <p className="text-sm text-gray-400 mb-4">
                          See the game in action! Learn by watching AI compete.
                        </p>
                        <div className="inline-flex items-center gap-2 text-neon-magenta text-sm font-semibold">
                          <span>Watch Demo</span>
                          <span>→</span>
                        </div>
                      </button>
                    </div>

                    {/* Features Preview */}
                    <div className="mt-12 pt-8 border-t border-slate-700/50">
                      <p className="text-sm text-gray-500 uppercase tracking-wider mb-4">
                        What Awaits You
                      </p>
                      <div className="flex flex-wrap justify-center gap-4 text-sm">
                        <span className="bg-slate-800/40 px-4 py-2 rounded-full text-gray-300 border border-slate-700/50">
                          ⚔️ Strategic Combat
                        </span>
                        <span className="bg-slate-800/40 px-4 py-2 rounded-full text-gray-300 border border-slate-700/50">
                          💰 Treasure Hunting
                        </span>
                        <span className="bg-slate-800/40 px-4 py-2 rounded-full text-gray-300 border border-slate-700/50">
                          🚢 Fleet Building
                        </span>
                        <span className="bg-slate-800/40 px-4 py-2 rounded-full text-gray-300 border border-slate-700/50">
                          ⚡ Speed Bonuses
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Connected but No Game - Clear CTAs */
                  <div className="space-y-12">
                    <div className="text-7xl sm:text-8xl animate-bounce-slow filter drop-shadow-2xl">
                      🏴‍☠️
                    </div>
                    <div>
                      <h3
                        className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text
                                     bg-gradient-to-r from-neon-cyan via-neon-gold to-neon-cyan mb-4"
                      >
                        Ready for Battle, Captain!
                      </h3>
                      <p className="text-lg sm:text-xl text-gray-300 mb-2">
                        Your wallet is connected
                      </p>
                    </div>

                    {/* NEW: Lobby Browser Hero */}
                    <LobbyBrowser />

                    {/* Action Cards for Connected Users (Secondary) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-8 border-t border-slate-700/30">
                      {/* Practice Mode */}
                      <button
                        onClick={() => setShowPracticeMenu(true)}
                        className="group bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-2 border-neon-gold/50
                                   rounded-2xl p-6 hover:scale-105 transition-all duration-300
                                   hover:shadow-lg hover:shadow-neon-gold/30 text-left"
                      >
                        <div className="text-5xl mb-4">⚔️</div>
                        <h4 className="text-xl font-bold text-neon-gold mb-2">
                          Practice Mode
                        </h4>
                        <p className="text-sm text-gray-400 mb-4">
                          Sharpen your skills vs AI. No on-chain fees or gas
                          costs.
                        </p>
                        <div className="flex items-center gap-2 text-neon-gold text-sm font-semibold">
                          <span>Train Now</span>
                          <span>→</span>
                        </div>
                      </button>

                      {/* NEW: AI vs AI Demo */}
                      <button
                        onClick={() => setShowAIBattleModal(true)}
                        className="group bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-2 border-neon-magenta/50
                                   rounded-2xl p-6 hover:scale-105 transition-all duration-300
                                   hover:shadow-lg hover:shadow-neon-magenta/30 text-left"
                      >
                        <div className="text-5xl mb-4">🤖</div>
                        <h4 className="text-xl font-bold text-neon-magenta mb-2">
                          Watch AI Battle
                        </h4>
                        <p className="text-sm text-gray-400 mb-4">
                          Learn by watching AI opponents compete. No commitment
                          required!
                        </p>
                        <div className="flex items-center gap-2 text-neon-magenta text-sm font-semibold">
                          <span>Watch Demo</span>
                          <span>→</span>
                        </div>
                      </button>

                      {/* Watch / Join */}
                      <button
                        onClick={() => setShowSpectatorMode(true)}
                        className="group bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-2 border-neon-purple/50
                                   rounded-2xl p-6 hover:scale-105 transition-all duration-300
                                   hover:shadow-lg hover:shadow-neon-purple/30 text-left"
                      >
                        <div className="text-5xl mb-4">👁️</div>
                        <h4 className="text-xl font-bold text-neon-purple mb-2">
                          Watch & Join
                        </h4>
                        <p className="text-sm text-gray-400 mb-4">
                          Spectate live battles or join an existing game.
                        </p>
                        <div className="flex items-center gap-2 text-neon-purple text-sm font-semibold">
                          <span>Explore</span>
                          <span>→</span>
                        </div>
                      </button>
                    </div>

                    {/* Quick Tips */}
                    <div className="max-w-2xl mx-auto">
                      <div
                        className="bg-gradient-to-r from-neon-cyan/10 to-neon-gold/10
                                     border border-neon-cyan/30 rounded-xl p-6 backdrop-blur-sm"
                      >
                        <div className="flex items-start gap-4">
                          <span className="text-3xl">💡</span>
                          <div className="flex-1 text-left">
                            <div className="text-sm font-semibold text-neon-cyan mb-2">
                              Getting Started
                            </div>
                            <ul className="text-xs text-gray-400 space-y-1">
                              <li>
                                •{" "}
                                <strong className="text-gray-300">
                                  Create Battle:
                                </strong>{" "}
                                Start on-chain game with real stakes
                              </li>
                              <li>
                                •{" "}
                                <strong className="text-gray-300">
                                  Practice Mode:
                                </strong>{" "}
                                Learn mechanics without gas fees
                              </li>
                              <li>
                                •{" "}
                                <strong className="text-gray-300">
                                  Zcash Privacy:
                                </strong>{" "}
                                Use shielded memos for private moves
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
