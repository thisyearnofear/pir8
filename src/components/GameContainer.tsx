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

import { useEffect, useCallback } from 'react';
import { useMobileOptimized } from '@/hooks/useMobileOptimized';
import { Haptic } from '@/utils/haptics';
import { MobileGameLayout } from './GameLayout/MobileGameLayout';
import { DesktopGameLayout } from './GameLayout/DesktopGameLayout';
import VictoryScreen from './VictoryScreen';
import { GameState, Ship, Player } from '@/types/game';
import { AIReasoning } from '@/lib/pirateGameEngine';

// =============================================================================
// TYPES
// =============================================================================

export interface GameContainerProps {
  // Game state
  gameState: GameState;

  // Player identification
  currentPlayerPK?: string;
  isPracticeMode: boolean;

  // Turn state
  isMyTurn: boolean;
  decisionTimeMs: number;
  currentPlayerName: string;

  // Skill mechanics
  scanChargesRemaining: number;
  speedBonusAccumulated: number;
  averageDecisionTimeMs: number;
  scannedCoordinates: string[];

  // Ship selection
  selectedShipId: string | null;
  shipActionModalShip: Ship | null;

  // Actions
  onCellSelect: (coordinate: string) => void;
  onShipClick: (ship: Ship) => void;
  onShipSelect: (shipId: string | null) => void;
  onShipAction: (shipId: string, action: 'move' | 'attack' | 'claim' | 'collect' | 'build') => void;
  onCloseShipActionModal: () => void;

  // Controls
  onCreateGame: () => void;
  onQuickStart: () => void;
  onStartGame: () => Promise<void>;
  onJoinGame: (gameId: string) => Promise<boolean>;
  onEndTurn: () => void;
  onPracticeMode: () => void;

  // Resource/Build
  onCollectResources: () => Promise<boolean>;
  onBuildShip: (shipType: string, portX: number, portY: number) => Promise<boolean>;

  // Victory
  onNewGame: () => void;
  onReturnToLobby: () => void;

  // Loading states
  isCreatingGame: boolean;
  isJoining: boolean;
  joinError?: string;
  onClearJoinError: () => void;

  // Viral/Social
  onOpenLeaderboard: () => void;
  onOpenReferral: () => void;

  // AI Reasoning
  aiReasoning?: AIReasoning | null;
  showAIReasoning?: boolean;
  onToggleAIReasoning?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function GameContainer(props: GameContainerProps) {
  const {
    gameState,
    currentPlayerPK,
    isPracticeMode,
    isMyTurn,
    onEndTurn,
    onNewGame,
    onReturnToLobby,
  } = props;

  const { isMobile } = useMobileOptimized();

  // Get current player
  const getCurrentPlayer = (): Player | null => {
    if (!gameState?.players) return null;
    if (isPracticeMode) {
      return gameState.players.find((p) => !p.publicKey.startsWith('AI_')) || null;
    }
    if (!currentPlayerPK) return null;
    return gameState.players.find((p) => p.publicKey === currentPlayerPK) || null;
  };

  const currentPlayer = getCurrentPlayer();

  // =============================================================================
  // KEYBOARD SHORTCUTS
  // =============================================================================

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if typing in input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    switch (e.key.toLowerCase()) {
      case 'e':
        if (isMyTurn) {
          Haptic.medium();
          onEndTurn();
        }
        break;
      case 'm':
        Haptic.light();
        // Menu toggle handled by layout
        break;
      case 'escape':
        // Close menu or deselect
        if (props.selectedShipId) {
          props.onShipSelect(null);
        }
        break;
      case 'c':
        if (isMyTurn) {
          Haptic.light();
          props.onCollectResources();
        }
        break;
      case 'q':
        // Quick actions toggle - handled by layout
        break;
    }
  }, [isMyTurn, onEndTurn, props]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // =============================================================================
  // VICTORY SCREEN
  // =============================================================================

  if (gameState.gameStatus === 'completed') {
    return (
      <VictoryScreen
        gameState={gameState}
        currentPlayerPK={currentPlayerPK}
        onNewGame={onNewGame}
        onReturnToLobby={onReturnToLobby}
        isPracticeMode={isPracticeMode}
      />
    );
  }

  // =============================================================================
  // ACTIVE GAME - ROUTE TO PLATFORM-SPECIFIC LAYOUT
  // =============================================================================

  if (gameState.gameStatus === 'active' && gameState.gameMap) {
    const commonProps = {
      ...props,
      currentPlayer,
    };

    return isMobile ? (
      <MobileGameLayout {...commonProps} />
    ) : (
      <DesktopGameLayout {...commonProps} />
    );
  }

  // =============================================================================
  // PRE-GAME / WAITING STATE
  // =============================================================================

  return (
    <GamePlaceholder
      onPracticeMode={props.onPracticeMode}
      onOpenLeaderboard={props.onOpenLeaderboard}
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
