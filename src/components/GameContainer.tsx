/**
 * GameContainer - Extracted from page.tsx to reduce complexity
 * Encapsulates the main game UI: map, controls, stats panels
 * Following: CLEAN separation of concerns, MODULAR architecture
 */

'use client';

import PirateMap from './PirateMap';
import PirateControls from './PirateControls';
import PlayerStats from './PlayerStats';
import BattleInfoPanel from './BattleInfoPanel';
import TurnBanner from './TurnBanner';
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

      {/* Victory Screen */}
      {gameState.gameStatus === 'completed' && (
        <VictoryScreen
          gameState={gameState}
          currentPlayerPK={currentPlayerPK}
          onNewGame={onNewGame}
          onReturnToLobby={onReturnToLobby}
        />
      )}

      {/* Turn Banner */}
      {gameState.gameStatus === 'active' && (
        <div className="mb-4">
          <TurnBanner
            isMyTurn={isMyTurn}
            decisionTimeMs={decisionTimeMs}
            currentPlayerName={currentPlayerName}
          />
        </div>
      )}

      {/* Main Game Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-screen max-h-[800px]">
        {/* Left Panel: Player Stats */}
        <div className="lg:col-span-1">
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
        </div>

        {/* Main Game Area */}
        <div className="lg:col-span-2 flex flex-col">
          {gameState.gameStatus === 'active' && gameState.gameMap ? (
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
          ) : (
            <GamePlaceholder 
              onPracticeMode={onPracticeMode}
              onOpenLeaderboard={onOpenLeaderboard}
            />
          )}
        </div>

        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-4">
          <BattleInfoPanel gameState={gameState} />

          <ResourceCollectionPanel
            gameState={gameState}
            currentPlayer={currentPlayer}
            onCollectResources={onCollectResources}
            isMyTurn={isMyTurn}
          />

          <ShipBuildingPanel
            gameState={gameState}
            currentPlayer={currentPlayer}
            onBuildShip={onBuildShip}
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
            onScanCoordinate={async () => {}} // TODO: Implement scanning
            decisionTimeMs={decisionTimeMs}
            scanChargesRemaining={scanChargesRemaining}
            speedBonusAccumulated={speedBonusAccumulated}
            onPracticeMode={onPracticeMode}
          />
        </div>
      </div>
    </>
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
    <div className="flex-1 flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl">
        <div className="absolute inset-0 bg-[url('/images/ocean-pattern.svg')] opacity-5"></div>
        <div className="absolute top-10 left-10 w-32 h-32 bg-neon-cyan/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-neon-gold/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center p-12 max-w-2xl">
        <div className="mb-8 relative">
          <div className="text-9xl animate-bounce filter drop-shadow-2xl">🗺️</div>
          <div className="absolute -top-4 -right-4 text-4xl animate-spin-slow">⚓</div>
          <div className="absolute -bottom-4 -left-4 text-3xl animate-pulse">💰</div>
        </div>

        <h3 className="text-4xl font-black text-transparent bg-clip-text 
                       bg-gradient-to-r from-neon-cyan via-neon-gold to-neon-cyan mb-4
                       animate-subtle-glow">
          Prepare for Battle!
        </h3>

        <p className="text-xl text-gray-300 font-semibold mb-8">
          Ready to command your pirate fleet?
        </p>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={onPracticeMode}
            className="bg-slate-800/60 border border-neon-cyan/30 rounded-xl p-4 
                       hover:bg-slate-700/60 hover:border-neon-cyan/50 transition-all
                       hover:scale-105 hover:shadow-lg hover:shadow-neon-cyan/20"
          >
            <div className="text-3xl mb-2">🎮</div>
            <div className="text-sm font-semibold text-neon-cyan">Practice Mode</div>
            <div className="text-xs text-gray-400 mt-1">Play vs AI, no wallet needed</div>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="bg-slate-800/60 border border-neon-gold/30 rounded-xl p-4 
                       hover:bg-slate-700/60 hover:border-neon-gold/50 transition-all
                       hover:scale-105 hover:shadow-lg hover:shadow-neon-gold/20"
          >
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-sm font-semibold text-neon-gold">Leaderboard</div>
            <div className="text-xs text-gray-400 mt-1">View top pirates</div>
          </button>
        </div>

        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-neon-cyan/20 to-neon-gold/20 
                        border border-neon-cyan/50 rounded-full px-6 py-3 backdrop-blur-sm">
          <span className="text-neon-cyan font-bold">🏴‍☠️</span>
          <span className="text-gray-300 font-semibold">Use the controls panel to begin →</span>
        </div>
      </div>
    </div>
  );
}
