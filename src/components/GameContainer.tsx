/**
 * GameContainer - Main game UI with focused, minimal HUD design
 * Map is the hero. Panels accessible via menu toggle.
 * Following: CLEAN separation, MODULAR architecture, PREVENT BLOAT
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import PirateMap from './PirateMap';

// =============================================================================
// HAPTIC FEEDBACK UTILITY
// =============================================================================

const haptic = {
  light: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
  },
  heavy: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
  }
};
import PirateControls from './PirateControls';
import PlayerStats from './PlayerStats';
import BattleInfoPanel from './BattleInfoPanel';
import ShipActionModal from './ShipActionModal';
import ResourceCollectionPanel from './ResourceCollectionPanel';
import ShipBuildingPanel from './ShipBuildingPanel';
import VictoryScreen from './VictoryScreen';
import { GameState, Ship, Player } from '@/types/game';

// =============================================================================
// TYPES
// =============================================================================

interface GameContainerProps {
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
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function GameContainer({
  gameState,
  currentPlayerPK,
  isPracticeMode,
  isMyTurn,
  decisionTimeMs,
  currentPlayerName,
  scanChargesRemaining,
  speedBonusAccumulated,
  averageDecisionTimeMs,
  scannedCoordinates,
  selectedShipId,
  shipActionModalShip,
  onCellSelect,
  onShipClick,
  onShipSelect,
  onShipAction,
  onCloseShipActionModal,
  onCreateGame,
  onQuickStart,
  onStartGame,
  onJoinGame,
  onEndTurn,
  onPracticeMode,
  onCollectResources,
  onBuildShip,
  onNewGame,
  onReturnToLobby,
  isCreatingGame,
  isJoining,
  joinError,
  onClearJoinError,
  onOpenLeaderboard,
}: GameContainerProps) {
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'actions' | 'build'>('stats');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showTutorial, setShowTutorial] = useState(isPracticeMode);
  const [tutorialStep, setTutorialStep] = useState(0);
  
  // =============================================================================
  // KEYBOARD SHORTCUTS
  // =============================================================================
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if typing in input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    
    switch (e.key.toLowerCase()) {
      case 'e':
        // End turn
        if (isMyTurn) {
          haptic.medium();
          onEndTurn();
        }
        break;
      case 'm':
        // Toggle menu
        haptic.light();
        setMenuOpen(prev => !prev);
        break;
      case 'escape':
        // Close menu or deselect
        if (menuOpen) {
          setMenuOpen(false);
        } else if (selectedShipId) {
          onShipSelect(null);
        }
        break;
      case 'c':
        // Collect resources
        if (isMyTurn) {
          haptic.light();
          onCollectResources();
        }
        break;
      case 'q':
        // Toggle quick actions
        setShowQuickActions(prev => !prev);
        break;
      case '1':
        setActiveTab('stats');
        if (!menuOpen) setMenuOpen(true);
        break;
      case '2':
        setActiveTab('actions');
        if (!menuOpen) setMenuOpen(true);
        break;
      case '3':
        setActiveTab('build');
        if (!menuOpen) setMenuOpen(true);
        break;
    }
  }, [isMyTurn, menuOpen, selectedShipId, onEndTurn, onShipSelect, onCollectResources]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  // =============================================================================
  // HELPERS
  // =============================================================================
  
  // Get current player from game state
  const getCurrentPlayer = (): Player | null => {
    if (isPracticeMode) {
      return gameState.players.find((p) => !p.publicKey.startsWith('AI_')) || null;
    }
    if (!currentPlayerPK) return null;
    return gameState.players.find((p) => p.publicKey === currentPlayerPK) || null;
  };

  const currentPlayer = getCurrentPlayer();
  const allShips = gameState.players.flatMap((p) => p.ships).filter((s) => s.health > 0);
  const selectedShip = selectedShipId ? allShips.find(s => s.id === selectedShipId) : null;
  
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  // Victory Screen - show on top of everything when game completed
  if (gameState.gameStatus === 'completed') {
    return (
      <VictoryScreen
        gameState={gameState}
        currentPlayerPK={currentPlayerPK}
        onNewGame={onNewGame}
        onReturnToLobby={onReturnToLobby}
      />
    );
  }

  // Active game - focused layout with map as hero
  if (gameState.gameStatus === 'active' && gameState.gameMap) {
    return (
      <>
        {/* Ship Action Modal */}
        {shipActionModalShip && (
          <ShipActionModal
            ship={shipActionModalShip}
            isOpen={true}
            onClose={onCloseShipActionModal}
            onAction={(action) => onShipAction(shipActionModalShip.id, action)}
          />
        )}

        {/* ===== FOCUSED GAME LAYOUT ===== */}
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          
          {/* Top HUD Bar - Minimal */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-neon-cyan/30">
            {/* Turn Indicator */}
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full font-bold text-sm ${
                isMyTurn 
                  ? 'bg-neon-cyan text-black' 
                  : 'bg-slate-700 text-gray-300'
              }`}>
                {isMyTurn ? '⚔️ Your Turn' : `⏳ ${currentPlayerName}'s Turn`}
              </div>
              {isMyTurn && (
                <Tooltip content="Speed bonus: <5s = +100 | <10s = +50 | <15s = +25" position="bottom">
                  <div className={`text-sm font-mono cursor-help ${
                    decisionTimeMs < 5000 ? 'text-green-400' :
                    decisionTimeMs < 10000 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    ⏱️ {formatTime(decisionTimeMs)}
                  </div>
                </Tooltip>
              )}
            </div>

            {/* Game Info */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-400">Turn {gameState.turnNumber}</span>
              <span className="text-neon-gold">🏴‍☠️ {gameState.players.length} Pirates</span>
              {isPracticeMode && (
                <span className="bg-neon-purple/20 text-neon-purple px-2 py-1 rounded text-xs">
                  Practice
                </span>
              )}
            </div>

            {/* Menu Toggle */}
            <Tooltip content="Game Menu (M)" position="bottom">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`p-2 rounded-lg transition-all min-w-[40px] min-h-[40px] ${
                  menuOpen 
                    ? 'bg-neon-cyan text-black' 
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                {menuOpen ? '✕' : '☰'}
              </button>
            </Tooltip>
          </div>

          {/* Main Content - Map as Hero */}
          <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
            <PirateMap
              gameMap={gameState.gameMap}
              ships={allShips}
              onCellSelect={onCellSelect}
              onShipClick={onShipClick}
              isMyTurn={isMyTurn}
              selectedShipId={selectedShipId || undefined}
              currentPlayerPK={currentPlayerPK}
              scannedCoordinates={scannedCoordinates}
            />
            
            {/* ===== FLOATING QUICK ACTIONS ===== */}
            {isMyTurn && (
              <div className="absolute bottom-20 right-4 flex flex-col gap-2">
                {/* Quick Action Toggle */}
                <button
                  onClick={() => {
                    haptic.light();
                    setShowQuickActions(!showQuickActions);
                  }}
                  className={`w-14 h-14 rounded-full shadow-lg transition-all flex items-center justify-center text-2xl
                             ${showQuickActions 
                               ? 'bg-neon-cyan text-black rotate-45' 
                               : 'bg-slate-800 text-white border border-neon-cyan/50 hover:bg-slate-700'}`}
                  title="Quick Actions (Q)"
                >
                  +
                </button>
                
                {/* Expanded Quick Actions */}
                {showQuickActions && (
                  <div className="flex flex-col gap-2 animate-in slide-in-from-bottom duration-200">
                    {/* Collect Resources */}
                    <button
                      onClick={() => {
                        haptic.medium();
                        onCollectResources();
                        setShowQuickActions(false);
                      }}
                      className="w-14 h-14 rounded-full bg-neon-gold text-black shadow-lg 
                                 hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-2xl"
                      title="Collect Resources (C)"
                    >
                      💰
                    </button>
                    
                    {/* Build Ship */}
                    <button
                      onClick={() => {
                        haptic.light();
                        setActiveTab('build');
                        setMenuOpen(true);
                        setShowQuickActions(false);
                      }}
                      className="w-14 h-14 rounded-full bg-neon-purple text-white shadow-lg 
                                 hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-2xl"
                      title="Build Ship (3)"
                    >
                      🔨
                    </button>
                    
                    {/* View Stats */}
                    <button
                      onClick={() => {
                        haptic.light();
                        setActiveTab('stats');
                        setMenuOpen(true);
                        setShowQuickActions(false);
                      }}
                      className="w-14 h-14 rounded-full bg-slate-700 text-white shadow-lg border border-slate-600
                                 hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-2xl"
                      title="View Stats (1)"
                    >
                      📊
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Action Bar - Mobile Optimized */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-t border-neon-cyan/30 gap-2">
            {/* Selected Ship Info - Tappable */}
            <button
              onClick={() => {
                if (selectedShip) {
                  haptic.light();
                  onShipClick(selectedShip);
                }
              }}
              className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-xl border border-neon-cyan/50 
                         min-h-[48px] active:scale-95 transition-all flex-shrink-0"
            >
              {selectedShip ? (
                <>
                  <span className="text-xl">🚢</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-neon-cyan">{selectedShip.type}</div>
                    <div className="text-xs text-gray-400">{selectedShip.health}/{selectedShip.maxHealth} HP</div>
                  </div>
                </>
              ) : (
                <span className="text-sm text-gray-400">Tap ship to select</span>
              )}
            </button>

            {/* Quick Stats - Compact with Tooltips */}
            <div className="flex items-center gap-3 text-sm flex-shrink-0">
              {currentPlayer && (
                <>
                  <Tooltip content="Gold - Collect from treasure & territories">
                    <div className="flex flex-col items-center cursor-help">
                      <span className="text-lg">💰</span>
                      <span className="text-xs text-neon-gold font-bold">{currentPlayer.resources.gold}</span>
                    </div>
                  </Tooltip>
                  <Tooltip content="Active ships in your fleet">
                    <div className="flex flex-col items-center cursor-help">
                      <span className="text-lg">🚢</span>
                      <span className="text-xs text-neon-cyan font-bold">{currentPlayer.ships.filter(s => s.health > 0).length}</span>
                    </div>
                  </Tooltip>
                  <Tooltip content="Territories you control">
                    <div className="flex flex-col items-center cursor-help">
                      <span className="text-lg">🏴‍☠️</span>
                      <span className="text-xs text-neon-magenta font-bold">{currentPlayer.controlledTerritories.length}</span>
                    </div>
                  </Tooltip>
                </>
              )}
            </div>

            {/* End Turn Button - Large Touch Target */}
            {isMyTurn && (
              <button
                onClick={() => {
                  haptic.heavy();
                  onEndTurn();
                }}
                className="bg-gradient-to-r from-neon-cyan to-neon-blue text-black font-bold 
                           px-5 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all
                           shadow-lg shadow-neon-cyan/30 min-h-[48px] min-w-[120px] text-sm"
              >
                End Turn ⏭️
              </button>
            )}
          </div>
          
          {/* Keyboard Shortcuts Hint */}
          <div className="hidden sm:flex justify-center gap-4 py-1 bg-slate-900/50 text-xs text-gray-500">
            <span><kbd className="bg-slate-700 px-1 rounded">E</kbd> End Turn</span>
            <span><kbd className="bg-slate-700 px-1 rounded">M</kbd> Menu</span>
            <span><kbd className="bg-slate-700 px-1 rounded">Q</kbd> Quick Actions</span>
            <span><kbd className="bg-slate-700 px-1 rounded">C</kbd> Collect</span>
            <span><kbd className="bg-slate-700 px-1 rounded">Esc</kbd> Deselect</span>
          </div>
        </div>

        {/* ===== PRACTICE MODE TUTORIAL ===== */}
        {showTutorial && isPracticeMode && (
          <PracticeTutorial 
            step={tutorialStep}
            onNext={() => setTutorialStep(s => s + 1)}
            onSkip={() => setShowTutorial(false)}
            onComplete={() => setShowTutorial(false)}
          />
        )}

        {/* ===== SLIDE-IN MENU PANEL ===== */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            
            {/* Panel */}
            <div className="relative ml-auto w-full max-w-md bg-slate-900 border-l border-neon-cyan/30 
                            overflow-y-auto animate-in slide-in-from-right duration-300">
              {/* Panel Header */}
              <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-neon-cyan">Game Menu</h2>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
                >
                  ✕
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-slate-700">
                {(['stats', 'actions', 'build'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-sm font-bold transition-all ${
                      activeTab === tab
                        ? 'text-neon-cyan border-b-2 border-neon-cyan bg-slate-800/50'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab === 'stats' && '📊 Stats'}
                    {tab === 'actions' && '⚔️ Actions'}
                    {tab === 'build' && '🔨 Build'}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-4 space-y-4">
                {activeTab === 'stats' && (
                  <>
                    <PlayerStats
                      players={gameState.players}
                      currentPlayerIndex={gameState.currentPlayerIndex}
                      gameStatus={gameState.gameStatus}
                      decisionTimeMs={decisionTimeMs}
                      scanChargesRemaining={scanChargesRemaining}
                      speedBonusAccumulated={speedBonusAccumulated}
                      averageDecisionTimeMs={averageDecisionTimeMs}
                      scannedCoordinates={scannedCoordinates}
                    />
                    <BattleInfoPanel gameState={gameState} />
                  </>
                )}

                {activeTab === 'actions' && (
                  <>
                    <ResourceCollectionPanel
                      gameState={gameState}
                      currentPlayer={currentPlayer}
                      onCollectResources={onCollectResources}
                      isMyTurn={isMyTurn}
                    />
                    <PirateControls
                      gameState={gameState}
                      onCreateGame={onCreateGame}
                      onQuickStart={onQuickStart}
                      onStartGame={onStartGame}
                      onJoinGame={onJoinGame}
                      onShipAction={onShipAction}
                      onEndTurn={onEndTurn}
                      isCreating={isCreatingGame}
                      isJoining={isJoining}
                      joinError={joinError}
                      onClearJoinError={onClearJoinError}
                      selectedShipId={selectedShipId || undefined}
                      onShipSelect={onShipSelect}
                      onScanCoordinate={async () => {}}
                      decisionTimeMs={decisionTimeMs}
                      scanChargesRemaining={scanChargesRemaining}
                      speedBonusAccumulated={speedBonusAccumulated}
                      onPracticeMode={onPracticeMode}
                    />
                  </>
                )}

                {activeTab === 'build' && (
                  <ShipBuildingPanel
                    gameState={gameState}
                    currentPlayer={currentPlayer}
                    onBuildShip={onBuildShip}
                    isMyTurn={isMyTurn}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Pre-game / Waiting state - Show placeholder with controls
  return (
    <GamePlaceholder 
      onPracticeMode={onPracticeMode}
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

// =============================================================================
// SUB-COMPONENT: Practice Tutorial Overlay
// =============================================================================

const TUTORIAL_STEPS = [
  {
    title: "Welcome, Captain! 🏴‍☠️",
    content: "This is Practice Mode - learn the ropes before battling for real treasure on Solana.",
    icon: "⚓",
    tip: "No wallet needed. Just pure pirate strategy!"
  },
  {
    title: "The Map 🗺️",
    content: "The grid shows your battlefield. Each cell is hidden (?) until you scout it.",
    icon: "❓",
    tip: "Tap cells to reveal terrain: islands, ports, treasure, storms..."
  },
  {
    title: "Your Ship 🚢",
    content: "Tap your ship (cyan border) to select it, then tap a cell to move.",
    icon: "🚢", 
    tip: "Ships can move based on their speed stat each turn."
  },
  {
    title: "Win Conditions 🏆",
    content: "Capture territory, collect gold, or destroy enemy ships to score points!",
    icon: "💰",
    tip: "First to 1000 points or last pirate standing wins."
  },
  {
    title: "Speed Bonus ⚡",
    content: "Each turn, a timer tracks how fast you decide. Faster = more bonus points!",
    icon: "⏱️",
    tip: "< 5s = +100 pts | < 10s = +50 pts | < 15s = +25 pts"
  },
  {
    title: "Quick Actions",
    content: "Use the + button for fast access to Collect 💰 and Build 🔨 actions.",
    icon: "➕",
    tip: "Or press Q on keyboard. Menu (☰) has full stats."
  }
];

interface PracticeTutorialProps {
  step: number;
  onNext: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

// =============================================================================
// SUB-COMPONENT: Tooltip
// =============================================================================

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom';
}

function Tooltip({ children, content, position = 'top' }: TooltipProps) {
  return (
    <div className="relative group">
      {children}
      <div className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} 
                       left-1/2 -translate-x-1/2 px-3 py-2 bg-slate-800 border border-slate-600 
                       rounded-lg text-xs text-gray-200 whitespace-nowrap opacity-0 
                       group-hover:opacity-100 transition-opacity pointer-events-none z-50
                       shadow-lg`}>
        {content}
        <div className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-slate-600 
                        rotate-45 ${position === 'top' ? 'top-full -mt-1 border-b border-r' : 'bottom-full -mb-1 border-t border-l'}`} />
      </div>
    </div>
  );
}

function PracticeTutorial({ step, onNext, onSkip, onComplete }: PracticeTutorialProps) {
  const currentStep = TUTORIAL_STEPS[step];
  const isLastStep = step >= TUTORIAL_STEPS.length - 1;
  
  if (!currentStep) {
    onComplete();
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Tutorial Card */}
      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl 
                      border-2 border-neon-cyan/50 p-6 max-w-sm w-full shadow-2xl
                      animate-in zoom-in-95 duration-300">
        {/* Step indicator */}
        <div className="flex justify-center gap-1 mb-4">
          {TUTORIAL_STEPS.map((_, i) => (
            <div 
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step ? 'bg-neon-cyan w-6' : 
                i < step ? 'bg-neon-cyan/50' : 'bg-slate-600'
              }`}
            />
          ))}
        </div>
        
        {/* Icon */}
        <div className="text-5xl text-center mb-4">{currentStep.icon}</div>
        
        {/* Title */}
        <h3 className="text-xl font-bold text-neon-cyan text-center mb-2">
          {currentStep.title}
        </h3>
        
        {/* Content */}
        <p className="text-gray-300 text-center mb-3">
          {currentStep.content}
        </p>
        
        {/* Tip */}
        <div className="bg-slate-700/50 rounded-lg px-3 py-2 mb-6">
          <p className="text-sm text-neon-gold text-center">
            💡 {currentStep.tip}
          </p>
        </div>
        
        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-700 text-gray-300 
                       font-bold hover:bg-slate-600 transition-all"
          >
            Skip
          </button>
          <button
            onClick={isLastStep ? onComplete : onNext}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-blue 
                       text-black font-bold hover:scale-105 active:scale-95 transition-all"
          >
            {isLastStep ? "Let's Go! ⚔️" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
