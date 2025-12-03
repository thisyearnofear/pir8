'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Ship, GameState, Player } from '../types/game';
import { SHIP_EMOJIS, SHIP_DESCRIPTIONS } from '../utils/constants';

interface PirateControlsProps {
  gameState: GameState | null;
  onCreateGame: () => void;
  onQuickStart: () => void;
  onJoinGame: (gameId: string) => Promise<boolean>;
  onShipAction: (shipId: string, action: 'move' | 'attack' | 'claim' | 'collect' | 'build') => void;
  onEndTurn: () => void;
  isCreating: boolean;
  isJoining: boolean;
  joinError?: string;
  onClearJoinError: () => void;
  selectedShipId?: string;
  onShipSelect: (shipId: string | null) => void;
  onScanCoordinate?: (x: number, y: number) => Promise<void>;
  decisionTimeMs?: number;
  scanChargesRemaining?: number;
}

export default function PirateControls({
  gameState,
  onCreateGame,
  onQuickStart,
  onJoinGame,
  onShipAction,
  onEndTurn,
  isCreating,
  isJoining,
  joinError,
  onClearJoinError,
  selectedShipId,
  onShipSelect,
  onScanCoordinate,
  decisionTimeMs = 0,
  scanChargesRemaining = 3
}: PirateControlsProps) {
  const { publicKey } = useWallet();
  const [gameIdInput, setGameIdInput] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [selectedCoordinate, setSelectedCoordinate] = useState<{ x: number; y: number } | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const getCurrentPlayer = (): Player | null => {
    if (!gameState || !publicKey) return null;
    return gameState.players.find(p => p.publicKey === publicKey.toString()) || null;
  };

  const getMyShips = (): Ship[] => {
    const currentPlayer = getCurrentPlayer();
    return currentPlayer?.ships.filter(ship => ship.health > 0) || [];
  };

  const isMyTurn = (): boolean => {
    if (!gameState || !publicKey) return false;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    return currentPlayer.publicKey === publicKey.toString();
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameIdInput.trim()) return;
    
    const success = await onJoinGame(gameIdInput.trim());
    if (success) {
      setGameIdInput('');
      setShowJoinForm(false);
    }
  };

  const handleScan = async () => {
    if (!selectedCoordinate || scanChargesRemaining <= 0 || !onScanCoordinate) return;

    setIsScanning(true);
    try {
      await onScanCoordinate(selectedCoordinate.x, selectedCoordinate.y);
      setSelectedCoordinate(null);
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    return `${seconds}.${String(Math.floor(milliseconds / 10)).padStart(2, '0')}s`;
  };

  const getTimerColor = (ms: number) => {
    // Green: <10s, Yellow: <20s, Red: >20s
    if (ms < 10000) return 'text-neon-green';
    if (ms < 20000) return 'text-neon-gold';
    return 'text-red-500';
  };

  const getSpeedBonusLabel = (ms: number) => {
    if (ms < 5000) return '+100 points!';
    if (ms < 10000) return '+50 points!';
    if (ms < 15000) return '+25 points!';
    return 'No bonus';
  };

  const renderPreGameControls = () => (
    <div className="pre-game-controls space-y-4">
      <h3 className="text-lg font-bold text-neon-cyan text-center">
        🏴‍☠️ PREPARE FOR BATTLE
      </h3>
      
      {!publicKey ? (
        <div className="wallet-connection text-center">
          <p className="text-sm text-gray-300 mb-4">Connect your wallet to join the pirate crew</p>
          <WalletMultiButton />
        </div>
      ) : (
        <div className="game-actions space-y-3">
          <button
            onClick={onCreateGame}
            disabled={isCreating}
            className="w-full bg-gradient-to-r from-neon-orange to-neon-gold text-black font-bold py-3 px-6 rounded-lg hover:shadow-neon-orange transition-all duration-300 disabled:opacity-50"
          >
            {isCreating ? '⚓ Creating Arena...' : '⚔️ Create New Battle'}
          </button>
          
          {!showJoinForm ? (
            <button
              onClick={() => setShowJoinForm(true)}
              className="w-full bg-gradient-to-r from-neon-cyan to-neon-blue text-black font-bold py-3 px-6 rounded-lg hover:shadow-neon-cyan transition-all duration-300"
            >
              🗺️ Join Existing Battle
            </button>
          ) : (
            <form onSubmit={handleJoinSubmit} className="join-form space-y-2">
              <input
                type="text"
                value={gameIdInput}
                onChange={(e) => setGameIdInput(e.target.value)}
                placeholder="Enter Game ID..."
                className="w-full bg-gray-800 border border-neon-cyan rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-neon-cyan"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isJoining || !gameIdInput.trim()}
                  className="flex-1 bg-neon-cyan text-black font-bold py-2 px-4 rounded-lg hover:bg-neon-cyan-bright transition-all duration-300 disabled:opacity-50"
                >
                  {isJoining ? 'Joining...' : 'Join'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinForm(false);
                    setGameIdInput('');
                    onClearJoinError();
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          
          {joinError && (
            <div className="error-message bg-red-900 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
              {joinError}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderWaitingControls = () => (
    <div className="waiting-controls space-y-4 text-center">
      <h3 className="text-lg font-bold text-neon-orange">
        ⚓ ASSEMBLING CREW
      </h3>
      <p className="text-sm text-gray-300">
        Waiting for more pirates to join...
      </p>
      <p className="text-xs text-neon-cyan">
        Game ID: {gameState?.gameId}
      </p>
      
      {gameState && gameState.players.length >= 2 && (
        <button
          onClick={onQuickStart}
          disabled={isCreating}
          className="bg-gradient-to-r from-neon-gold to-neon-orange text-black font-bold py-2 px-6 rounded-lg hover:shadow-neon-gold transition-all duration-300 disabled:opacity-50"
        >
          {isCreating ? 'Starting...' : '⚡ Start Battle Now'}
        </button>
      )}
    </div>
  );

  const renderShipSelection = () => {
    const myShips = getMyShips();
    
    return (
      <div className="ship-selection space-y-3">
        <h4 className="text-sm font-bold text-neon-cyan">🚢 YOUR FLEET</h4>
        <div className="ships-grid grid grid-cols-2 gap-2">
          {myShips.map(ship => (
            <button
              key={ship.id}
              onClick={() => onShipSelect(ship.id === selectedShipId ? null : ship.id)}
              className={`ship-card p-3 rounded-lg border-2 transition-all duration-300 ${
                selectedShipId === ship.id
                  ? 'border-neon-gold bg-neon-gold bg-opacity-20'
                  : 'border-neon-blue bg-neon-blue bg-opacity-10 hover:bg-neon-blue hover:bg-opacity-20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{SHIP_EMOJIS[ship.type]}</span>
                <span className="text-xs font-mono text-neon-cyan">
                  {ship.health}/{ship.maxHealth}
                </span>
              </div>
              <div className="text-xs text-gray-300 mt-1">
                {ship.type.toUpperCase()}
              </div>
              <div className="health-bar w-full bg-gray-700 rounded-full h-1 mt-2">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-green-500 rounded-full"
                  style={{ width: `${(ship.health / ship.maxHealth) * 100}%` }}
                ></div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderActionControls = () => {
    if (!selectedShipId) {
      return (
        <div className="action-hint text-center p-4 bg-neon-cyan bg-opacity-10 border border-neon-cyan rounded-lg">
          <p className="text-sm text-neon-cyan">Select a ship to view available actions</p>
        </div>
      );
    }

    const selectedShip = gameState?.players
      .find(p => p.publicKey === publicKey?.toString())
      ?.ships.find(s => s.id === selectedShipId);

    const shipPosition = selectedShip ? `${selectedShip.position.x},${selectedShip.position.y}` : '';

    return (
      <div className="action-controls space-y-3">
        <h4 className="text-sm font-bold text-neon-orange">⚔️ SHIP ACTIONS</h4>
        
        {/* Ship info */}
        {selectedShip && (
          <div className="ship-info bg-gray-800 p-2 rounded border border-gray-600">
            <div className="text-xs text-gray-300">
              {selectedShip.type.toUpperCase()} - {selectedShip.health}/{selectedShip.maxHealth} HP
            </div>
            <div className="text-xs text-neon-cyan">
              Position: {shipPosition}
            </div>
          </div>
        )}
        
        <div className="actions-grid grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => onShipAction(selectedShipId, 'move')}
            className="action-btn bg-neon-blue bg-opacity-20 border border-neon-blue text-neon-blue py-2 px-3 rounded-lg hover:bg-neon-blue hover:bg-opacity-30 transition-all duration-300"
          >
            <div className="text-lg">⛵</div>
            <div className="text-xs">Move</div>
          </button>
          <button
            onClick={() => onShipAction(selectedShipId, 'attack')}
            className="action-btn bg-red-600 bg-opacity-20 border border-red-500 text-red-400 py-2 px-3 rounded-lg hover:bg-red-600 hover:bg-opacity-30 transition-all duration-300"
            title="Attack adjacent enemy ships"
          >
            <div className="text-lg">💥</div>
            <div className="text-xs">Attack</div>
          </button>
        </div>
        
        <div className="actions-grid grid grid-cols-2 gap-2">
          <button
            onClick={() => onShipAction(selectedShipId, 'claim')}
            className="action-btn bg-neon-gold bg-opacity-20 border border-neon-gold text-neon-gold py-2 px-3 rounded-lg hover:bg-neon-gold hover:bg-opacity-30 transition-all duration-300"
            title="Claim current territory"
          >
            <div className="text-lg">🏴‍☠️</div>
            <div className="text-xs">Claim</div>
          </button>
          <button
            onClick={() => onShipAction(selectedShipId, 'collect')}
            className="action-btn bg-green-600 bg-opacity-20 border border-green-500 text-green-400 py-2 px-3 rounded-lg hover:bg-green-600 hover:bg-opacity-30 transition-all duration-300"
            title="Collect resources from controlled territory"
          >
            <div className="text-lg">💎</div>
            <div className="text-xs">Collect</div>
          </button>
        </div>
      </div>
    );
  };

  const renderGameControls = () => (
    <div className="game-controls space-y-4">
      <div className="turn-info text-center p-3 bg-black bg-opacity-50 rounded-lg border border-neon-cyan">
        <div className="text-sm text-neon-cyan">
          {isMyTurn() ? '🏴‍☠️ YOUR TURN' : '⏳ WAITING...'}
        </div>
        <div className="text-xs text-gray-300 mt-1">
          Phase: {gameState?.currentPhase?.toUpperCase()}
        </div>
      </div>

      {isMyTurn() && (
         <>
           {/* Skill Metrics Display with Timer */}
           <div className="skill-metrics bg-gradient-to-r from-gray-800 to-gray-900 border border-neon-magenta border-opacity-50 rounded-lg p-4 space-y-3">
             <div className="flex items-center justify-between">
               <span className="text-neon-cyan font-mono text-sm">⏱️ DECISION TIME:</span>
               <span className={`${getTimerColor(decisionTimeMs)} font-bold font-mono text-lg`}>
                 {formatTime(decisionTimeMs)}
               </span>
             </div>
             
             <div className="bg-gray-700 rounded h-2 overflow-hidden">
               <div 
                 className={`h-full transition-all ${
                   decisionTimeMs < 5000 ? 'bg-neon-green' :
                   decisionTimeMs < 10000 ? 'bg-neon-magenta' :
                   decisionTimeMs < 15000 ? 'bg-neon-gold' :
                   'bg-red-500'
                }`}
                 style={{ width: `${Math.min(100, (decisionTimeMs / 30000) * 100)}%` }}
               ></div>
             </div>

             <div className="text-center text-xs text-neon-cyan font-mono">
               Speed Bonus: {getSpeedBonusLabel(decisionTimeMs)}
             </div>
             
             <div className="flex items-center justify-between text-xs border-t border-gray-700 pt-2">
               <span className="text-neon-cyan font-mono">SCAN CHARGES:</span>
               <div className="flex items-center gap-1">
                 {Array.from({ length: 3 }).map((_, i) => (
                   <div
                     key={i}
                     className={`w-2 h-2 rounded-full ${
                       i < scanChargesRemaining ? 'bg-neon-magenta' : 'bg-gray-600'
                     }`}
                   ></div>
                 ))}
                 <span className={`font-bold ml-2 ${scanChargesRemaining > 0 ? 'text-neon-magenta' : 'text-red-500'}`}>
                   {scanChargesRemaining} / 3
                 </span>
               </div>
             </div>
           </div>

          {/* Scan Section */}
          {scanChargesRemaining > 0 && (
            <div className="scan-section bg-gradient-to-r from-gray-800 to-gray-900 border border-neon-magenta border-opacity-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-neon-magenta">🔍 SCAN COORDINATE</h4>
                <span className="text-xs text-neon-cyan">{scanChargesRemaining} scans remaining</span>
              </div>
              
              <p className="text-xs text-gray-300">
                Select a coordinate to reveal its territory type without claiming it:
              </p>

              <div
                className="grid gap-2 p-3 bg-black bg-opacity-30 rounded"
                style={{
                  gridTemplateColumns: `repeat(${gameState?.gameMap.size || 7}, minmax(2rem, 1fr))`,
                }}
              >
                {gameState?.gameMap && Array.from({ length: gameState.gameMap.size }).map((_, x) =>
                  Array.from({ length: gameState.gameMap.size }).map((_, y) => (
                    <button
                      key={`${x}-${y}`}
                      onClick={() => setSelectedCoordinate({ x, y })}
                      disabled={scanChargesRemaining <= 0 || !isMyTurn()}
                      title={`Scan coordinate (${x}, ${y})`}
                      className={`p-2 rounded text-xs font-bold transition-all duration-200 ${
                        selectedCoordinate?.x === x && selectedCoordinate?.y === y
                          ? 'bg-neon-magenta text-black ring-2 ring-neon-cyan shadow-lg'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-neon-cyan'
                      } ${scanChargesRemaining <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {x},{y}
                    </button>
                  ))
                )}
              </div>

              {selectedCoordinate && (
                <div className="text-center text-xs text-neon-cyan font-mono">
                  Selected: ({selectedCoordinate.x}, {selectedCoordinate.y})
                </div>
              )}

              <button
                onClick={handleScan}
                disabled={!selectedCoordinate || scanChargesRemaining <= 0 || isScanning}
                className="w-full bg-gradient-to-r from-neon-magenta to-purple-600 text-white font-bold py-3 px-3 rounded-lg hover:shadow-neon-magenta transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScanning ? '🔍 Scanning...' : `🔍 Execute Scan (${scanChargesRemaining})`}
              </button>
            </div>
          )}

          {renderShipSelection()}
          {renderActionControls()}
          
          {/* Ship Building Section */}
          <div className="ship-building space-y-3">
            <h4 className="text-sm font-bold text-neon-cyan">🛠️ BUILD SHIPS</h4>
            <div className="build-options grid grid-cols-2 gap-2">
              <button
                onClick={() => onShipAction('build', 'build')}
                className="build-btn bg-neon-cyan bg-opacity-15 border border-neon-cyan text-neon-cyan py-2 px-2 rounded-lg hover:bg-neon-cyan hover:bg-opacity-25 transition-all duration-300"
                title="Build new ships at controlled ports"
              >
                <div className="text-sm">⛵</div>
                <div className="text-xs">Sloop</div>
                <div className="text-xs text-gray-400">500💰</div>
              </button>
              <button
                onClick={() => onShipAction('build', 'build')}
                className="build-btn bg-neon-cyan bg-opacity-15 border border-neon-cyan text-neon-cyan py-2 px-2 rounded-lg hover:bg-neon-cyan hover:bg-opacity-25 transition-all duration-300"
                title="Build frigate"
              >
                <div className="text-sm">🚢</div>
                <div className="text-xs">Frigate</div>
                <div className="text-xs text-gray-400">1.2k💰</div>
              </button>
            </div>
          </div>

          <button
            onClick={onEndTurn}
            className="w-full bg-gradient-to-r from-neon-magenta to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:shadow-neon-magenta transition-all duration-300"
          >
            ⚓ End Turn
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="pirate-controls-panel bg-gradient-to-b from-slate-800 to-slate-900 border border-neon-cyan border-opacity-50 rounded-lg p-6 min-h-[400px]">
      {!gameState && renderPreGameControls()}
      {gameState?.gameStatus === 'waiting' && renderWaitingControls()}
      {gameState?.gameStatus === 'active' && renderGameControls()}
      
      {gameState?.gameStatus === 'completed' && (
        <div className="game-complete text-center space-y-4">
          <h3 className="text-xl font-bold text-neon-gold">
            🏴‍☠️ BATTLE COMPLETE!
          </h3>
          {gameState.winner && (
            <p className="text-neon-cyan">
              Victory belongs to: {gameState.players.find(p => p.publicKey === gameState.winner)?.username || 'Unknown Captain'}
            </p>
          )}
          <button
            onClick={onCreateGame}
            className="bg-gradient-to-r from-neon-orange to-neon-gold text-black font-bold py-3 px-6 rounded-lg hover:shadow-neon-orange transition-all duration-300"
          >
            ⚔️ Start New Battle
          </button>
        </div>
      )}
    </div>
  );
}