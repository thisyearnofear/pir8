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
            isPracticeMode={isPracticeMode}
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
    <div className="flex-1 relative overflow-hidden">
      {/* Animated background with floating elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute top-20 left-20 w-32 h-32 bg-neon-cyan/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-neon-gold/10 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-neon-purple/10 rounded-full blur-2xl animate-pulse"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mb-6 relative inline-block">
            <div className="text-8xl sm:text-9xl animate-bounce-slow filter drop-shadow-2xl">🏴‍☠️</div>
            <div className="absolute -top-2 -right-8 text-3xl sm:text-4xl animate-spin-slow">⚓</div>
            <div className="absolute -bottom-2 -left-8 text-2xl sm:text-3xl animate-float">💎</div>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text 
                         bg-gradient-to-r from-neon-cyan via-neon-gold to-neon-cyan mb-6
                         animate-subtle-glow leading-tight">
            Command Your Pirate Fleet
          </h2>

          <p className="text-lg sm:text-xl text-gray-300 font-semibold mb-4 max-w-2xl mx-auto">
            Strategic naval warfare on <span className="text-neon-cyan font-bold">Solana</span> with <span className="text-neon-purple font-bold">Zcash</span> privacy
          </p>
          
          <p className="text-base text-gray-400 max-w-xl mx-auto mb-4">
            Fast battles, private moves, viral wins. Every decision matters in this skill-based conquest for treasure and glory!
          </p>

          {/* Dual-Chain Badge */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <div className="flex items-center gap-2 bg-gradient-to-r from-neon-cyan/20 to-neon-blue/20 
                           border border-neon-cyan/50 rounded-full px-4 py-2 backdrop-blur-sm">
              <span className="text-lg">⚡</span>
              <span className="text-sm font-semibold text-neon-cyan">Powered by Solana</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-neon-purple/20 to-neon-magenta/20 
                           border border-neon-purple/50 rounded-full px-4 py-2 backdrop-blur-sm">
              <span className="text-lg">🔒</span>
              <span className="text-sm font-semibold text-neon-purple">Secured by Zcash</span>
            </div>
          </div>

          {/* CTA Buttons - Practice First (No Wallet Required) */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={onPracticeMode}
              className="group relative w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-neon-cyan/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
              <div className="relative bg-gradient-to-r from-neon-cyan to-neon-blue
                             hover:from-neon-cyan hover:to-neon-cyan
                             text-black font-bold py-4 px-8 rounded-xl
                             hover:shadow-lg hover:shadow-neon-cyan/50 hover:scale-105 
                             active:scale-95 transition-all duration-300 flex items-center justify-center gap-3">
                <span className="text-2xl">⚔️</span>
                <div className="flex flex-col items-start">
                  <span className="text-lg">Play Now (Free)</span>
                  <span className="text-xs opacity-80">No wallet needed</span>
                </div>
              </div>
            </button>

            <button
              onClick={onOpenLeaderboard}
              className="group relative w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-neon-gold/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
              <div className="relative bg-gradient-to-r from-slate-700 to-slate-800
                             hover:from-slate-600 hover:to-slate-700
                             text-white font-bold py-4 px-8 rounded-xl border border-neon-gold/50
                             hover:shadow-lg hover:shadow-neon-gold/30 hover:scale-105 
                             active:scale-95 transition-all duration-300 flex items-center justify-center gap-3">
                <span className="text-2xl">🏆</span>
                <span className="text-lg">Leaderboard</span>
              </div>
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {/* Feature 1 */}
          <div className="group bg-slate-800/40 backdrop-blur-sm border border-neon-cyan/30 rounded-xl p-5 
                         hover:bg-slate-800/60 hover:border-neon-cyan/50 hover:scale-105 transition-all duration-300
                         hover:shadow-lg hover:shadow-neon-cyan/20">
            <div className="text-4xl mb-3 group-hover:animate-bounce">⚡</div>
            <h3 className="text-lg font-bold text-neon-cyan mb-2">Speed Rewards</h3>
            <p className="text-sm text-gray-400">Quick decisions earn bonus points. Lightning reflexes dominate!</p>
          </div>

          {/* Feature 2 */}
          <div className="group bg-slate-800/40 backdrop-blur-sm border border-neon-gold/30 rounded-xl p-5 
                         hover:bg-slate-800/60 hover:border-neon-gold/50 hover:scale-105 transition-all duration-300
                         hover:shadow-lg hover:shadow-neon-gold/20">
            <div className="text-4xl mb-3 group-hover:animate-bounce">🔍</div>
            <h3 className="text-lg font-bold text-neon-gold mb-2">Strategic Scouting</h3>
            <p className="text-sm text-gray-400">Use 3 scans wisely to reveal hidden treasures and plan your conquest.</p>
          </div>

          {/* Feature 3 */}
          <div className="group bg-slate-800/40 backdrop-blur-sm border border-neon-purple/30 rounded-xl p-5 
                         hover:bg-slate-800/60 hover:border-neon-purple/50 hover:scale-105 transition-all duration-300
                         hover:shadow-lg hover:shadow-neon-purple/20">
            <div className="text-4xl mb-3 group-hover:animate-bounce">🚢</div>
            <h3 className="text-lg font-bold text-neon-purple mb-2">Fleet Command</h3>
            <p className="text-sm text-gray-400">Build balanced armadas. Each ship serves a unique tactical role.</p>
          </div>

          {/* Feature 4 */}
          <div className="group bg-slate-800/40 backdrop-blur-sm border border-neon-purple/30 rounded-xl p-5 
                         hover:bg-slate-800/60 hover:border-neon-purple/50 hover:scale-105 transition-all duration-300
                         hover:shadow-lg hover:shadow-neon-purple/20">
            <div className="text-4xl mb-3 group-hover:animate-bounce">🔒</div>
            <h3 className="text-lg font-bold text-neon-purple mb-2">Zcash Privacy</h3>
            <p className="text-sm text-gray-400">Shielded memos for private moves. Solana speed with Zcash security!</p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-sm 
                       border border-neon-cyan/20 rounded-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-black text-neon-cyan mb-1">3</div>
              <div className="text-sm text-gray-400">Victory Paths</div>
            </div>
            <div>
              <div className="text-3xl font-black text-neon-gold mb-1">&lt;5s</div>
              <div className="text-sm text-gray-400">Speed Bonus</div>
            </div>
            <div>
              <div className="text-3xl font-black text-neon-purple mb-1">∞</div>
              <div className="text-sm text-gray-400">Strategies</div>
            </div>
            <div>
              <div className="text-3xl font-black text-neon-orange mb-1">100%</div>
              <div className="text-sm text-gray-400">On-Chain</div>
            </div>
          </div>
        </div>

        {/* Helper Text */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-neon-cyan/10 to-neon-gold/10 
                         border border-neon-cyan/30 rounded-full px-6 py-3 backdrop-blur-sm">
            <span className="text-neon-cyan font-bold text-lg">👆</span>
            <span className="text-gray-300 font-medium">Connect wallet or use controls panel to begin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
