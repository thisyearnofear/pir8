/**
 * SpectatorView - Read-only game viewing component
 * Allows users to watch live games without wallet connection
 * Following: ENHANCEMENT FIRST, MODULAR architecture
 */

'use client';

import { useState } from 'react';
import { useSpectatorMode } from '@/hooks/useSpectatorMode';
import PirateMap from './PirateMap';
import PlayerStats from './PlayerStats';
import BattleInfoPanel from './BattleInfoPanel';

// =============================================================================
// TYPES
// =============================================================================

interface SpectatorViewProps {
  initialGameId?: string;
  onClose?: () => void;
  onJoinGame?: (gameId: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function SpectatorView({ initialGameId, onClose, onJoinGame }: SpectatorViewProps) {
  const [gameIdInput, setGameIdInput] = useState(initialGameId || '');

  const {
    gameState,
    isLoading,
    error,
    lastUpdate,
    isLive,
    refresh,
    setGameId,
    clearError,
  } = useSpectatorMode({
    gameId: initialGameId,
    autoRefresh: true,
    refreshInterval: 10000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameIdInput.trim()) return;
    
    setGameId(gameIdInput.trim());
  };

  const formatLastUpdate = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  // Show search form if no game loaded
  if (!gameState) {
    return (
      <div className="min-h-[600px] flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">👁️</div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text 
                           bg-gradient-to-r from-neon-cyan to-neon-gold mb-2">
              Spectator Mode
            </h2>
            <p className="text-gray-400">
              Watch live battles unfold in real-time. No wallet required.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={gameIdInput}
                onChange={(e) => {
                  setGameIdInput(e.target.value);
                  clearError();
                }}
                placeholder="Enter Game ID..."
                className="w-full bg-slate-900/80 border-2 border-neon-cyan/50 rounded-xl px-5 py-4 
                           text-white font-mono text-lg focus:ring-2 focus:ring-neon-cyan 
                           focus:border-neon-cyan transition-all placeholder-gray-500"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neon-cyan text-2xl">
                🔍
              </div>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !gameIdInput.trim()}
              className="w-full bg-gradient-to-r from-neon-cyan to-neon-blue text-black 
                         font-black py-4 rounded-xl hover:shadow-lg hover:shadow-neon-cyan/50
                         hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 
                         disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Finding Game...
                </div>
              ) : (
                'Watch Game'
              )}
            </button>
          </form>

          {/* Popular Games */}
          <div className="mt-8">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
              Popular Active Games
            </h3>
            <div className="space-y-2">
              {['battle_001', 'pirate_war_42', 'treasure_hunt_7'].map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    setGameIdInput(id);
                    setGameId(id);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-slate-800/50 
                             border border-slate-700 rounded-lg hover:border-neon-cyan/50 
                             hover:bg-slate-800 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-mono text-neon-cyan">{id}</span>
                  </div>
                  <span className="text-xs text-gray-500">4 players • Turn 23</span>
                </button>
              ))}
            </div>
          </div>

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="w-full mt-6 py-3 text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Main Menu
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show game view
  return (
    <div className="h-screen max-h-[900px] flex flex-col">
      {/* Spectator Header */}
      <div className="bg-slate-900/90 border-b border-neon-cyan/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👁️</span>
              <span className="font-bold text-neon-cyan">SPECTATOR MODE</span>
            </div>
            
            {/* Live indicator */}
            <div className="flex items-center gap-2 bg-slate-800 rounded-full px-3 py-1">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-xs text-gray-400">
                {isLive ? 'LIVE' : 'ENDED'}
              </span>
            </div>

            {/* Last update */}
            <span className="text-xs text-gray-500">
              Updated {formatLastUpdate(lastUpdate)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh button */}
            <button
              onClick={refresh}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors
                         disabled:opacity-50"
              title="Refresh"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-neon-cyan">🔄</span>
              )}
            </button>

            {/* Join button */}
            {onJoinGame && isLive && (
              <button
                onClick={() => onJoinGame(gameState.gameId)}
                className="px-4 py-2 bg-gradient-to-r from-neon-gold to-neon-orange 
                           text-black font-bold rounded-lg hover:shadow-lg 
                           hover:shadow-neon-gold/50 transition-all"
              >
                Join Battle
              </button>
            )}

            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                title="Close"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Game info bar */}
        <div className="flex items-center gap-6 mt-3 text-sm">
          <span className="text-gray-400">
            Game: <span className="font-mono text-neon-cyan">{gameState.gameId}</span>
          </span>
          <span className="text-gray-400">
            Turn: <span className="text-white">{gameState.turnNumber}</span>
          </span>
          <span className="text-gray-400">
            Players: <span className="text-white">{gameState.players.length}</span>
          </span>
          <span className="text-gray-400">
            Phase: <span className="capitalize text-white">{gameState.currentPhase}</span>
          </span>
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 overflow-hidden">
        {/* Left: Player Stats */}
        <div className="lg:col-span-1 overflow-y-auto">
          <PlayerStats
            players={gameState.players}
            currentPlayerIndex={gameState.currentPlayerIndex}
            gameStatus={gameState.gameStatus}
            decisionTimeMs={0}
            scanChargesRemaining={3}
            speedBonusAccumulated={0}
            averageDecisionTimeMs={0}
            scannedCoordinates={[]}
          />

          {/* Event Log */}
          <div className="mt-4 bg-slate-900/50 border border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Recent Events</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {gameState.eventLog.slice(-5).reverse().map((event) => (
                <div key={event.id} className="text-xs p-2 bg-slate-800/50 rounded">
                  <span className="text-gray-500">Turn {event.turnNumber}:</span>
                  <p className="text-gray-300 mt-1">{event.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Game Map */}
        <div className="lg:col-span-2 flex flex-col">
          <PirateMap
            gameMap={gameState.gameMap}
            ships={gameState.players.flatMap((p) => p.ships).filter((s) => s.health > 0)}
            players={gameState.players}
            onCellSelect={() => {}} // No-op in spectator mode
            onShipClick={() => {}} // No-op in spectator mode
            isMyTurn={false} // Spectators never have turn
            selectedShipId={undefined}
            currentPlayerPK={undefined}
            scannedCoordinates={[]}
          />
        </div>

        {/* Right: Battle Info */}
        <div className="lg:col-span-1">
          <BattleInfoPanel gameState={gameState} />

          {/* Spectator Call-to-Action */}
          <div className="mt-4 bg-gradient-to-br from-neon-cyan/20 to-neon-gold/20 
                          border border-neon-cyan/50 rounded-xl p-4">
            <h3 className="font-bold text-neon-cyan mb-2">Want to Play?</h3>
            <p className="text-sm text-gray-300 mb-3">
              Connect your wallet to join battles and earn real rewards!
            </p>
            {onJoinGame && isLive && (
              <button
                onClick={() => onJoinGame(gameState.gameId)}
                className="w-full py-2 bg-neon-cyan text-black font-bold rounded-lg
                           hover:bg-neon-cyan/80 transition-colors"
              >
                Join This Game
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
