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
import { FirstTimeTutorial } from './onboarding/FirstTimeTutorial';
import { ContextualHints, HINT_TEMPLATES } from './onboarding/ContextualHints';
import { Ship } from '@/types/game';
import { useGame } from '@/contexts/GameContext';

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
    selectedShipId,
    selectShip,
    decisionTime,
    currentPlayer,
  } = game;

  const {
    onCellSelect,
    onShipClick,
    onShipAction,
    onNewGame,
    onReturnToLobby,
    onOpenLeaderboard,
    onOpenReferral,
  } = props;

  const { isMobile } = useMobileOptimized();

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

  useEffect(() => {
    if (!gameState?.gameMap || !isMyTurn || !currentPlayer) return;

    if (!hintTrigger) {
      if (gameState.turnNumber === 1 && !selectedShipId) {
        setHintTrigger({ type: 'FIRST_SHIP_SELECT' });
      }
      else if (gameState.turnNumber <= 3 && !hintTrigger) {
        setHintTrigger({ type: 'SPEED_BONUS' });
      }
      else if (currentPlayer.controlledTerritories.length === 0 && gameState.turnNumber > 2) {
        setHintTrigger({ type: 'TERRITORY_CONTROL' });
      }
    }
  }, [gameState, isMyTurn, currentPlayer, hintTrigger, selectedShipId]);

  const handleHintDismiss = () => {
    setHintTrigger(null);
  };

  // =============================================================================
  // KEYBOARD SHORTCUTS
  // =============================================================================

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    switch (e.key.toLowerCase()) {
      case 'e':
        if (isMyTurn && gameState) {
          Haptic.medium();
          // We'll need gameId and wallet here, but for now we'll rely on props/context
          // This is a simplification
        }
        break;
      case 'escape':
        if (selectedShipId) {
          selectShip(null);
        }
        break;
      case 'c':
        if (isMyTurn) {
          Haptic.light();
          // collectResources
        }
        break;
    }
  }, [isMyTurn, gameState, selectedShipId, selectShip]);

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
      currentPlayerName: currentPlayer?.username || 'Pirate',
    };

    return (
      <>
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        {/* Hero */}
        <div className="mb-8">
          <div className="text-8xl mb-4 filter drop-shadow-2xl">🏴‍☠️</div>
          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text 
                         bg-gradient-to-r from-neon-cyan via-neon-gold to-neon-cyan mb-4">
            Pir8
          </h1>
          <p className="text-lg text-gray-300 mb-2">
            Strategic naval warfare on <span className="text-neon-cyan font-bold">Solana</span>
          </p>
          <p className="text-sm text-gray-400">
            Fast battles, tactical decisions, pirate glory
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={onPracticeMode}
            className="bg-gradient-to-r from-neon-cyan to-neon-blue text-black font-bold 
                       py-4 px-8 rounded-xl hover:scale-105 active:scale-95 transition-all
                       shadow-lg shadow-neon-cyan/30"
          >
            <span className="text-xl mr-2">⚔️</span>
            Play Now (Free)
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="bg-slate-700 text-white font-bold py-4 px-8 rounded-xl 
                       border border-neon-gold/50 hover:bg-slate-600 transition-all"
          >
            <span className="text-xl mr-2">🏆</span>
            Leaderboard
          </button>
        </div>

        {/* Quick Features */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-neon-cyan font-bold">Speed Rewards</div>
            <div className="text-gray-400 text-xs">Fast decisions = bonus points</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl mb-2">🔍</div>
            <div className="text-neon-gold font-bold">Strategic Scouting</div>
            <div className="text-gray-400 text-xs">3 scans to reveal the map</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl mb-2">🚢</div>
            <div className="text-neon-purple font-bold">Fleet Command</div>
            <div className="text-gray-400 text-xs">Build your armada</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl mb-2">🏴‍☠️</div>
            <div className="text-neon-orange font-bold">Conquer Territory</div>
            <div className="text-gray-400 text-xs">Dominate the seas</div>
          </div>
        </div>
      </div>
    </div>
  );
}
