/**
 * GameContainer - Orchestrator Component
 * 
 * Routes to platform-specific layouts (mobile/desktop).
 * Handles game state orchestration, keyboard shortcuts, and victory conditions.
 * Following: CLEAN separation, MODULAR architecture, PREVENT BLOAT
 * 
 * @module components/GameContainer
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { useMobileOptimized } from '@/hooks/useMobileOptimized';
import { Haptic } from '@/utils/haptics';
import { MobileGameLayout } from './GameLayout/MobileGameLayout';
import { DesktopGameLayout } from './GameLayout/DesktopGameLayout';
import VictoryScreen from './VictoryScreen';
import VictoryProgress from './VictoryProgress';
import { FirstTimeTutorial } from './onboarding/FirstTimeTutorial';
import { ContextualHints, HINT_TEMPLATES } from './onboarding/ContextualHints';
import { Ship } from '@/types/game';
import { useGame } from '@/contexts/GameContext';
import { usePirateGameStore } from '@/store/gameStore';

// =============================================================================
// TYPES
// =============================================================================

export interface GameContainerProps {
  // Actions passed from page shell
  onCellSelect: (coordinate: string) => void;
  onShipClick: (ship: Ship) => void;
  onShipAction: (shipId: string, action: 'move' | 'attack' | 'claim' | 'collect' | 'build') => void;
  onNewGame: () => void;
  onReturnToLobby: () => void;
  onOpenLeaderboard: () => void;
  onOpenReferral: () => void;
  
  // Optional overrides
  onPracticeMode?: () => void;
  onStartGame?: () => Promise<void>;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function GameContainer(props: GameContainerProps) {
  const game = useGame();
  const {
    gameState,
    isPracticeMode,
    isMyTurn,
    endTurn,
    collectResources,
    passPracticeTurn,
    wallet,
    selectedShipId,
    selectShip,
    decisionTime,
    currentPlayer,
  } = game;

  const {
    onCellSelect: _onCellSelect,
    onShipClick,
    onShipAction: _onShipAction,
    onNewGame,
    onReturnToLobby,
    onOpenLeaderboard,
    onOpenReferral: _onOpenReferral,
  } = props;

  const { isMobile } = useMobileOptimized();
  const scanCoordinate = usePirateGameStore((state) => state.scanCoordinate);

  // Local UI state
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialComplete, setTutorialComplete] = useState(false);
  const [hintTrigger, setHintTrigger] = useState<{type: string, data?: any} | null>(null);
  const [shipActionModalShip, setShipActionModalShip] = useState<Ship | null>(null);

  // =============================================================================
  // TUTORIAL & ONBOARDING
  // =============================================================================

  useEffect(() => {
    if (gameState?.gameStatus === 'active' && !tutorialComplete && isPracticeMode) {
      const hasSeenTutorial = localStorage.getItem('pir8_tutorial_complete');
      if (!hasSeenTutorial) {
        setShowTutorial(true);
      }
    }
  }, [gameState?.gameStatus, tutorialComplete, isPracticeMode]);

  const handleTutorialComplete = () => {
    localStorage.setItem('pir8_tutorial_complete', 'true');
    setTutorialComplete(true);
    setShowTutorial(false);
    Haptic.success();
  };

  const handleTutorialSkip = () => {
    localStorage.setItem('pir8_tutorial_complete', 'true');
    setTutorialComplete(true);
    setShowTutorial(false);
    Haptic.light();
  };

  // =============================================================================
  // CONTEXTUAL HINTS TRIGGERS
  // =============================================================================

  const ambushTargetId = (gameState as any)?.ambushTargetId as string | undefined;

  useEffect(() => {
    if (!gameState?.gameMap || !isMyTurn || !currentPlayer) return;

    if (!hintTrigger) {
      if (ambushTargetId) {
        setHintTrigger({ type: 'AMBUSH_WINDOW' });
      }
      else if (gameState.turnNumber === 1 && !selectedShipId) {
        setHintTrigger({ type: 'FIRST_SHIP_SELECT' });
      }
      else if (gameState.turnNumber <= 3 && !hintTrigger) {
        setHintTrigger({ type: 'SPEED_BONUS' });
      }
      else if (currentPlayer.controlledTerritories.length === 0 && gameState.turnNumber > 2) {
        setHintTrigger({ type: 'TERRITORY_CONTROL' });
      }
    }
  }, [gameState, isMyTurn, currentPlayer, hintTrigger, selectedShipId, ambushTargetId]);

  const handleHintDismiss = () => {
    setHintTrigger(null);
  };


  // =============================================================================
  // PRIMARY ACTIONS — the one truthful wiring path for the rail and the keyboard
  // =============================================================================

  const handleEndTurn = useCallback(async () => {
    if (!gameState) return;
    if (isPracticeMode) {
      // passPracticeTurn validates human-at-helm from game state itself;
      // context isMyTurn is wallet-derived and unreliable for guest practice.
      passPracticeTurn();
      return;
    }
    if (!isMyTurn) return;
    await endTurn(Number(gameState.gameId), wallet);
  }, [gameState, isMyTurn, isPracticeMode, passPracticeTurn, endTurn, wallet]);

  const handleCollectResources = useCallback(async (): Promise<boolean> => {
    if (!gameState || !isMyTurn) return false;
    // Practice economies accrue from controlled territories at the turn
    // boundary; the collect instruction is an on-chain mechanic.
    if (isPracticeMode) return false;
    return collectResources(Number(gameState.gameId), wallet);
  }, [gameState, isMyTurn, isPracticeMode, collectResources, wallet]);

  // Scanning is an on-chain oracle mechanic only — practice tracks scan
  // charges in state but implements no scan resolution, so the control
  // hides itself in practice by passing undefined.
  const handleScanCoordinate = useCallback(async (x: number, y: number) => {
    if (!gameState || !isMyTurn || isPracticeMode) return;
    await scanCoordinate(Number(gameState.gameId), x, y, wallet);
  }, [gameState, isMyTurn, isPracticeMode, scanCoordinate, wallet]);

  // =============================================================================
  // KEYBOARD SHORTCUTS
  // =============================================================================

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    switch (e.key.toLowerCase()) {
      case 'e':
        if (isMyTurn && gameState) {
          Haptic.medium();
          handleEndTurn();
        }
        break;
      case 'escape':
        if (selectedShipId) {
          selectShip(null);
        }
        break;
      case 'c':
        if (isMyTurn && !isPracticeMode) {
          Haptic.light();
          handleCollectResources();
        }
        break;
    }
  }, [isMyTurn, gameState, selectedShipId, selectShip, isPracticeMode, handleEndTurn, handleCollectResources]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // =============================================================================
  // VICTORY SCREEN
  // =============================================================================

  if (gameState?.gameStatus === 'completed') {
    return (
      <VictoryScreen
        gameState={gameState}
        currentPlayerPK={currentPlayer?.publicKey}
        onNewGame={onNewGame}
        onReturnToLobby={onReturnToLobby}
        isPracticeMode={isPracticeMode}
      />
    );
  }

  // =============================================================================
  // ACTIVE GAME - ROUTE TO PLATFORM-SPECIFIC LAYOUT
  // =============================================================================

  if (gameState?.gameStatus === 'active' && gameState.gameMap) {
    // Merge context and props for sub-components
    const mergedProps = {
      ...game,
      ...props,
      shipActionModalShip,
      onCloseShipActionModal: () => setShipActionModalShip(null),
      onShipClick: (ship: Ship) => {
        onShipClick(ship);
        setShipActionModalShip(ship);
      },
      decisionTimeMs: decisionTime,
      currentPlayerName:
        gameState.players[gameState.currentPlayerIndex]?.username || 'Pirate',
      onEndTurn: handleEndTurn,
      onCollectResources: handleCollectResources,
      onScanCoordinate: isPracticeMode ? undefined : handleScanCoordinate,
    };

    return (
      <>
        <VictoryProgress gameState={gameState} currentPlayer={currentPlayer} />
        <FirstTimeTutorial
          isVisible={showTutorial}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
        
        <ContextualHints
          hints={hintTrigger ? [HINT_TEMPLATES[hintTrigger.type as keyof typeof HINT_TEMPLATES] as any].filter(Boolean) : []}
          onDismiss={handleHintDismiss}
          isVisible={!!hintTrigger}
        />
        
        {isMobile ? (
          <MobileGameLayout {...mergedProps as any} />
        ) : (
          <DesktopGameLayout {...mergedProps as any} />
        )}
      </>
    );
  }

  // =============================================================================
  // PRE-GAME / WAITING STATE
  // =============================================================================

  return (
    <GamePlaceholder
      onPracticeMode={props.onPracticeMode || (() => {})}
      onOpenLeaderboard={onOpenLeaderboard}
    />
  );
}

// =============================================================================
// SUB-COMPONENT: Game Placeholder (when no active game)
// =============================================================================

interface GamePlaceholderProps {
  onPracticeMode: () => void;
  onOpenLeaderboard: () => void;
}

function GamePlaceholder({ onPracticeMode, onOpenLeaderboard }: GamePlaceholderProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--p8-ink)]">
      <div className="mx-auto max-w-2xl px-6 py-12 text-center">
        {/* Hero */}
        <div className="mb-8">
          <p className="mb-3 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.2em] text-[var(--p8-vellum-dim)]">
            Captain&apos;s table · practice waters
          </p>
          <h1 className="mb-4 font-[var(--font-world)] text-4xl text-[var(--p8-vellum)] sm:text-5xl">
            Pir8
          </h1>
          <p className="mb-2 text-lg text-[var(--p8-vellum)]">
            Strategic naval warfare on Solana
          </p>
          <p className="text-sm text-[var(--p8-vellum-dim)]">
            Fast battles, tactical decisions, pirate glory
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="mb-8 flex flex-col justify-center gap-4 sm:flex-row">
          <button
            onClick={onPracticeMode}
            autoFocus
            className="rounded-[var(--p8-radius)] bg-[var(--p8-lamp)] px-8 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#0b1418] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p8-vellum)]"
          >
            Play Now (Free)
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] px-8 py-4 text-sm font-black uppercase tracking-[0.16em] text-[var(--p8-vellum)] transition hover:border-[var(--p8-brass)] focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
          >
            Leaderboard
          </button>
        </div>

        {/* Quick Features */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-4">
            <div className="font-bold text-[var(--p8-vellum)]">Speed Rewards</div>
            <div className="text-xs text-[var(--p8-vellum-dim)]">Fast decisions = bonus points</div>
          </div>
          <div className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-4">
            <div className="font-bold text-[var(--p8-vellum)]">Strategic Scouting</div>
            <div className="text-xs text-[var(--p8-vellum-dim)]">3 scans to reveal the map</div>
          </div>
          <div className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-4">
            <div className="font-bold text-[var(--p8-vellum)]">Fleet Command</div>
            <div className="text-xs text-[var(--p8-vellum-dim)]">Build your armada</div>
          </div>
          <div className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-4">
            <div className="font-bold text-[var(--p8-vellum)]">Conquer Territory</div>
            <div className="text-xs text-[var(--p8-vellum-dim)]">Dominate the seas</div>
          </div>
        </div>
      </div>
    </div>
  );
}
