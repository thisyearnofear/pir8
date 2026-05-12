"use client";

import {
  useState,
  useEffect,
  useMemo,
} from "react";
import { useSafeWallet } from "@/components/SafeWalletProvider";
import { useGameShellState, useAIBattleState } from "@/store/gameStore";
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
import { Ship } from "@/types/game";
import { GameBalance } from "@/lib/gameBalance";
import ModeSelectModal from "@/components/modals/ModeSelectModal";
import PracticeMenuModal from "@/components/modals/PracticeMenuModal";
import PracticeModeBanner from "@/components/modals/PracticeModeBanner";
import GameHeader from "@/components/GameHeader";
import EmptyStateView from "@/components/EmptyStateView";
import { GameProvider } from "@/contexts/GameContext";
import { useIncomingChallenge } from "@/hooks/useIncomingChallenge";
import { usePracticeModeController } from "@/hooks/usePracticeModeController";
import { useMatchFlowController } from "@/hooks/useMatchFlowController";

export default function GameShell() {
  const { publicKey, wallet } = useSafeWallet();
  const {
    gameState,
    error,
    showMessage,
    selectedShipId,
    joinGame,
    findOrCreateGame,
    moveShip,
    attackWithShip,
    claimTerritory,
    collectResources,
    selectShip,
    setMessage,
    clearError,
    isMyTurn,
    getAllShips,
    startPracticeGame,
    makePracticeMove,
    makePracticeAttack,
    makePracticeClaim,
    exitPracticeMode,
    gameMode,
  } = useGameShellState();
  const {
    startAIvsAIGame,
    isAIvsAIMode,
    setPlaybackSpeed,
    getPlaybackSpeed,
    setAIDecisionCallback,
    aiReasoningHistory,
  } = useAIBattleState();

  const isPracticeMode = gameMode === "practice";
  const [_shipActionModalShip, setShipActionModalShip] = useState<Ship | null>(
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
  const [handledIncomingChallenge, setHandledIncomingChallenge] =
    useState(false);
  const [showPracticeMenu, setShowPracticeMenu] = useState(false);
  const [showAIBattleModal, setShowAIBattleModal] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState<"leakage" | "ai" | null>(
    "ai",
  );
  const [showSpectatorMode, setShowSpectatorMode] = useState(false);

  const { handleGameError } = useErrorHandler();
  const { shown: showOnboarding, dismiss: dismissOnboarding } =
    useShowOnboarding();

  const getCurrentPlayer = () => {
    if (!gameState?.players) return null;
    if (isPracticeMode) {
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

  const getCurrentPlayerKey = useMemo(() => {
    if (isPracticeMode) {
      const humanPlayer = gameState?.players?.find(
        (p: any) => !p.publicKey.startsWith("AI_"),
      );
      return humanPlayer?.publicKey;
    }
    return publicKey?.toString();
  }, [gameState?.players, publicKey, isPracticeMode]);

  const viralSystem = useViralSystem(gameState, getCurrentPlayer(), {
    disableAutoDismiss: isPracticeMode,
  });

  const privacySim = usePrivacySimulation({ enabled: isPracticeMode });

  useEffect(() => {
    if (isPracticeMode && gameState?.players) {
      const humanPlayer = gameState.players.find(
        (p: any) => !p.publicKey.startsWith("AI_"),
      );
      if (humanPlayer) {
        const recentActions = (gameState as any).recentActions || [];
        privacySim.updateLeakage(gameState, humanPlayer, recentActions);
      }
    }
  }, [gameState?.players, isPracticeMode, privacySim]);

  const handleGameEvent = (message: string) => {
    setMessage(null);
    setTimeout(() => {
      setMessage(message);
      setTimeout(() => setMessage(null), 3000);
    }, 50);
  };

  const {
    isCreatingGame: _isCreatingGame,
    isJoining: _isJoining,
    joinError: _joinError,
    setJoinError,
    handleCollectResources,
    handleNewGame,
    handleReturnToLobby,
    handleCreateGame,
    handleModeSelected,
    handleJoinGame,
  } = useMatchFlowController({
    publicKey,
    wallet,
    gameId: gameState?.gameId,
    collectResources,
    findOrCreateGame,
    joinGame,
    handleGameEvent,
    handleGameError,
    setShowModeSelect,
  });

  const {
    handleStartPractice,
    handleStartAIBattle,
    handlePracticeMove,
    handlePracticeAttack,
    handlePracticeClaim,
  } = usePracticeModeController({
    publicKey,
    startPracticeGame,
    startAIvsAIGame,
    makePracticeMove,
    makePracticeAttack,
    makePracticeClaim,
    isAIvsAIMode,
    setAIDecisionCallback,
    setShowPracticeMenu,
    handleGameEvent,
  });

  const handleViralShare = (
    event: any,
    platform?: "twitter" | "discord" | "copy",
  ) => {
    viralSystem.handleShare(event, platform);
    handleGameEvent("🚀 Epic moment shared! Spread the world!");
  };

  useIncomingChallenge({
    handledIncomingChallenge,
    publicKey,
    wallet,
    setHandledIncomingChallenge,
    setJoinError,
    setShowAIBattleModal,
    setShowPracticeMenu,
    handleGameEvent,
    handleJoinGame,
  });

  const handleCellSelect = async (coordinate: string) => {
    const playerKey = getCurrentPlayerKey;
    if (!playerKey || !gameState?.players || !isMyTurn(playerKey)) return;

    if (isPracticeMode) {
      if (selectedShipId) {
        const success = await handlePracticeMove(selectedShipId, coordinate);
        if (success) {
          handleGameEvent("Ship moved successfully!");
        }
      } else {
        const humanPlayer = gameState.players.find(
          (p: any) => !p.publicKey.startsWith("AI_"),
        );
        const myShips =
          humanPlayer?.ships?.filter(
            (ship: any) =>
              ship.position.x + "," + ship.position.y === coordinate,
          ) || [];

        if (myShips.length > 0) {
          selectShip(myShips[0]?.id || null);
          handleGameEvent(`${myShips[0]?.type} selected`);
        }
      }
      return;
    }

    if (!publicKey || !wallet) return;

    if (selectedShipId) {
      const [x, y] = coordinate.split(",").map(Number);
      const success = await moveShip(
        Number(gameState!.gameId),
        selectedShipId,
        x ?? 0,
        y ?? 0,
        wallet,
      );
      if (success) {
        handleGameEvent("Ship moved successfully!");
      }
    } else {
      const myShips = getAllShips().filter(
        (ship: any) =>
          ship.id.startsWith(publicKey.toString()) &&
          ship.position.x + "," + ship.position.y === coordinate,
      );

      if (myShips.length > 0) {
        selectShip(myShips[0]?.id || null);
        handleGameEvent(`${myShips[0]?.type} selected`);
      }
    }
  };

  const handleShipAction = async (
    shipId: string,
    action: "move" | "attack" | "claim" | "collect" | "build",
  ) => {
    const playerKey = getCurrentPlayerKey;
    if (!playerKey || !gameState || !isMyTurn(playerKey)) return;

    if (isPracticeMode) {
      switch (action) {
        case "move": {
          handleGameEvent("Select a destination for your ship on the map");
          setShipActionModalShip(null);
          break;
        }
        case "attack": {
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
                nearbyEnemies[0]?.id || "",
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
        }
        case "claim": {
          const success = await handlePracticeClaim(shipId);
          if (success) {
            handleGameEvent("🏴‍☠️ Territory claimed!");
          }
          break;
        }
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

    if (!wallet) return;

    switch (action) {
      case "move":
        handleGameEvent("Select a destination for your ship on the map");
        setShipActionModalShip(null);
        break;
      case "attack": {
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
              Number(gameState!.gameId),
              shipId,
              nearbyEnemies[0]?.id || "",
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
      }
      case "claim": {
        const ship = getAllShips().find((s: any) => s.id === shipId);
        if (ship) {
          const success = await claimTerritory(
            Number(gameState!.gameId),
            shipId,
            wallet,
          );
          if (success) {
            handleGameEvent("🏴‍☠️ Territory claimed!");
          }
        }
        break;
      }
      case "collect": {
        const collectSuccess = await handleCollectResources();
        if (collectSuccess) {
          handleGameEvent("💎 Resources collected!");
        }
        break;
      }
      case "build":
        handleGameEvent("🛠️ Ship building: Select water near controlled port");
        break;
    }
    setShipActionModalShip(null);
  };

  const handleShipClick = (ship: Ship) => {
    const playerKey = getCurrentPlayerKey;
    if (!playerKey || !isMyTurn(playerKey)) return;

    if (isPracticeMode) {
      if (ship.id.startsWith("AI_")) return;
      selectShip(ship.id);
      setShipActionModalShip(ship);
      return;
    }

    if (!publicKey) return;
    if (!ship.id.startsWith(publicKey.toString())) return;

    selectShip(ship.id);
    setShipActionModalShip(ship);
  };

  return (
    <ErrorBoundary>
      <OnboardingModal isOpen={showOnboarding} onDismiss={dismissOnboarding} />

      <ViralEventModal
        event={viralSystem.currentEvent}
        onShare={handleViralShare}
        onDismiss={viralSystem.dismissCurrentEvent}
        isPracticeMode={isPracticeMode}
      />
      <SocialModal
        type={socialModal.type}
        gameId={gameState?.gameId}
        isOpen={socialModal.isOpen}
        onClose={() => setSocialModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <ErrorToast error={error} onClose={clearError} />
      <SuccessToast message={showMessage} onClose={() => setMessage(null)} />

      {(isPracticeMode || isAIvsAIMode) && (
        <div className="fixed top-20 right-4 z-privacy-panel w-80 space-y-3">
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

          <AIStreamPanel
            history={aiReasoningHistory}
            isExpanded={expandedPanel === "ai"}
            onToggle={() =>
              setExpandedPanel(expandedPanel === "ai" ? null : "ai")
            }
          />
        </div>
      )}

      {isPracticeMode && (
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

      <AIBattleModal
        isOpen={showAIBattleModal}
        onClose={() => setShowAIBattleModal(false)}
        onStartBattle={handleStartAIBattle}
      />

      <ModeSelectModal
        isOpen={showModeSelect}
        onClose={() => setShowModeSelect(false)}
        onModeSelected={handleModeSelected}
      />

      <PracticeMenuModal
        isOpen={showPracticeMenu && !gameState}
        onClose={() => setShowPracticeMenu(false)}
        onStartPractice={handleStartPractice}
      />

      {isAIvsAIMode && (
        <AIBattleControls
          playbackSpeed={getPlaybackSpeed()}
          onSpeedChange={setPlaybackSpeed}
          gameState={gameState}
          isAIvsAIMode={isAIvsAIMode}
        />
      )}

      {isPracticeMode && !isAIvsAIMode && (
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

      <ManualSyncButton />

      {process.env.NODE_ENV !== "production" && <GameSyncStatus />}

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
                  onShipAction={handleShipAction}
                  onShipClick={handleShipClick}
                  onCellSelect={handleCellSelect}
                  onNewGame={handleNewGame}
                  onReturnToLobby={handleReturnToLobby}
                  onOpenLeaderboard={() =>
                    setSocialModal({ type: "leaderboard", isOpen: true })
                  }
                  onOpenReferral={() =>
                    setSocialModal({ type: "referral", isOpen: true })
                  }
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
