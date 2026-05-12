"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useSafeWallet } from "@/components/SafeWalletProvider";
import { 
  useAIBattleState, 
  useMatchState, 
  usePlayerState, 
  useActionState, 
  usePracticeState 
} from "@/store/gameStore";
import { useViralSystem as _useViralSystem } from "@/hooks/useViralSystem";
import { usePrivacySimulation } from "@/hooks/usePrivacySimulation";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import GameContainer from "@/components/GameContainer";
import { ManualSyncButton } from "@/components/ManualSyncButton";
import { GameSyncStatus } from "@/components/GameSyncRecovery";
import AIStreamPanel from "@/components/AIStreamPanel";
import {
  LeakageMeter,
} from "@/components/privacy";
import AIBattleErrorBoundary from "@/components/AIBattleErrorBoundary";
import AIBattleControls from "@/components/AIBattleControls";
import { Ship } from "@/types/game";
import { GameBalance } from "@/lib/gameBalance";
import PracticeModeBanner from "@/components/modals/PracticeModeBanner";
import GameHeader from "@/components/GameHeader";
import EmptyStateView from "@/components/EmptyStateView";
import { GameProvider } from "@/contexts/GameContext";
import { useIncomingChallenge } from "@/hooks/useIncomingChallenge";
import { usePracticeModeController } from "@/hooks/usePracticeModeController";
import { useMatchFlowController } from "@/hooks/useMatchFlowController";
import { useEntryController } from "@/hooks/useEntryController";
import { useSpectatorController } from "@/hooks/useSpectatorController";
import { useChallengeController } from "@/hooks/useChallengeController";
import { useNotificationController } from "@/hooks/useNotificationController";
import { useOnChainActions } from "@/store/gameStore";
import { ModalLayer } from "@/components/ModalLayer";
import { NotificationLayer } from "@/components/NotificationLayer";

export default function GameShell() {
  const { publicKey, wallet } = useSafeWallet();
  const { gameState, gameMode } = useMatchState();
  const { isMyTurn, getAllShips } = usePlayerState();
  const { 
    selectedShipId, 
    selectShip, 
    moveShip, 
    attackWithShip, 
    claimTerritory, 
    collectResources 
  } = useActionState();
  const { 
    startPracticeGame, 
    makePracticeMove, 
    makePracticeAttack, 
    makePracticeClaim, 
    exitPracticeMode 
  } = usePracticeState();
  
  const {
    startAIvsAIGame,
    isAIvsAIMode,
    setPlaybackSpeed,
    getPlaybackSpeed,
    setAIDecisionCallback,
    aiReasoningHistory,
  } = useAIBattleState();

  const {
    joinGame,
    findOrCreateGame,
  } = useOnChainActions();

  const isPracticeMode = gameMode === "practice";
  const [_shipActionModalShip, setShipActionModalShip] = useState<Ship | null>(
    null,
  );
  const [expandedPanel, setExpandedPanel] = useState<"leakage" | "ai" | null>(
    "ai",
  );

  const {
    showModeSelect,
    setShowModeSelect,
    showPracticeMenu,
    setShowPracticeMenu,
    showAIBattleModal,
    setShowAIBattleModal,
    handledIncomingChallenge,
    setHandledIncomingChallenge,
    showOnboarding,
    dismissOnboarding,
    openModeSelect: _openModeSelect,
    openPracticeMenu,
    openAIBattleModal,
  } = useEntryController();

  const {
    showSpectatorMode,
    openSpectatorMode,
    closeSpectatorMode,
  } = useSpectatorController();

  const {
    error,
    showMessage,
    clearError,
    setMessage,
    handleGameEvent,
    handleGameError,
  } = useNotificationController();

  const getCurrentPlayer = useCallback(() => {
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
  }, [gameState?.players, isPracticeMode, publicKey]);

  const {
    socialModal,
    viralSystem,
    handleViralShare,
    openSocialModal,
    closeSocialModal,
  } = useChallengeController({
    gameState,
    currentPlayer: getCurrentPlayer(),
    isPracticeMode,
    handleGameEvent,
  });

  const getCurrentPlayerKey = useMemo(() => {
    if (isPracticeMode) {
      const humanPlayer = gameState?.players?.find(
        (p: any) => !p.publicKey.startsWith("AI_"),
      );
      return humanPlayer?.publicKey;
    }
    return publicKey?.toString();
  }, [gameState?.players, publicKey, isPracticeMode]);

  const privacySim = usePrivacySimulation({ enabled: isPracticeMode });
  const { updateLeakage } = privacySim;

  useEffect(() => {
    if (isPracticeMode && gameState?.players) {
      const humanPlayer = gameState.players.find(
        (p: any) => !p.publicKey.startsWith("AI_"),
      );
      if (humanPlayer) {
        const recentActions = (gameState as any).recentActions || [];
        updateLeakage(gameState, humanPlayer, recentActions);
      }
    }
  }, [gameState, isPracticeMode, updateLeakage]);

  const {
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

  useIncomingChallenge({
    handledIncomingChallenge,
    publicKey,
    wallet,
    setHandledIncomingChallenge,
    setJoinError: (err) => err && handleGameError(new Error(err), "joining challenge"),
    setShowAIBattleModal,
    setShowPracticeMenu,
    handleGameEvent,
    handleJoinGame,
  });

  const handleCellSelect = useCallback(async (coordinate: string) => {
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
  }, [
    getCurrentPlayerKey,
    gameState,
    isMyTurn,
    isPracticeMode,
    selectedShipId,
    handlePracticeMove,
    handleGameEvent,
    selectShip,
    publicKey,
    wallet,
    moveShip,
    getAllShips,
  ]);

  const handleShipAction = useCallback(async (
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
        const success = await claimTerritory(
          Number(gameState!.gameId),
          shipId,
          wallet,
        );
        if (success) {
          handleGameEvent("🏴‍☠️ Territory claimed!");
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
  }, [
    getCurrentPlayerKey,
    gameState,
    isMyTurn,
    isPracticeMode,
    handleGameEvent,
    getAllShips,
    handlePracticeAttack,
    handlePracticeClaim,
    wallet,
    publicKey,
    attackWithShip,
    claimTerritory,
    handleCollectResources,
  ]);

  const handleShipClick = useCallback((ship: Ship) => {
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
  }, [getCurrentPlayerKey, isMyTurn, isPracticeMode, selectShip, publicKey]);

  return (
    <ErrorBoundary>
      <ModalLayer
        showOnboarding={showOnboarding}
        onDismissOnboarding={dismissOnboarding}
        currentViralEvent={viralSystem.currentEvent}
        onViralShare={handleViralShare}
        onDismissViralEvent={viralSystem.dismissCurrentEvent}
        isPracticeMode={isPracticeMode}
        socialModal={socialModal}
        onCloseSocialModal={closeSocialModal}
        gameId={gameState?.gameId}
        showAIBattleModal={showAIBattleModal}
        onCloseAIBattleModal={() => setShowAIBattleModal(false)}
        onStartAIBattle={handleStartAIBattle}
        showModeSelect={showModeSelect}
        onCloseModeSelect={() => setShowModeSelect(false)}
        onModeSelected={handleModeSelected}
        showPracticeMenu={showPracticeMenu}
        onClosePracticeMenu={() => setShowPracticeMenu(false)}
        onStartPractice={handleStartPractice}
        gameStateExists={!!gameState}
        privacySim={privacySim}
        showSpectatorMode={showSpectatorMode}
        onCloseSpectatorMode={closeSpectatorMode}
        onJoinGame={handleJoinGame}
      />

      <NotificationLayer
        error={error}
        showMessage={showMessage}
        onClearError={clearError}
        onClearMessage={() => setMessage(null)}
      />

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
            onSpectatorMode={openSpectatorMode}
            onOpenReferral={() => openSocialModal("referral")}
            onOpenLeaderboard={() => openSocialModal("leaderboard")}
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
                    onOpenLeaderboard={() => openSocialModal("leaderboard")}
                    onOpenReferral={() => openSocialModal("referral")}
                  />
                </AIBattleErrorBoundary>
              ) : (
                <GameContainer
                  onShipAction={handleShipAction}
                  onShipClick={handleShipClick}
                  onCellSelect={handleCellSelect}
                  onNewGame={handleNewGame}
                  onReturnToLobby={handleReturnToLobby}
                  onOpenLeaderboard={() => openSocialModal("leaderboard")}
                  onOpenReferral={() => openSocialModal("referral")}
                />
              )}
            </GameProvider>
          ) : (
            <EmptyStateView
              isConnected={!!publicKey}
              onPracticeMode={openPracticeMenu}
              onCreateGame={handleCreateGame}
              onSpectatorMode={openSpectatorMode}
              onAIBattle={openAIBattleModal}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
