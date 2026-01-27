'use client';

import { GameState, WeatherEffect } from '../types/game';

interface BattleInfoPanelProps {
  gameState: GameState | null;
}

export default function BattleInfoPanel({ gameState }: BattleInfoPanelProps) {
  const getWeatherEmoji = (weather?: WeatherEffect): string => {
    if (!weather) return '☀️';

    switch (weather.type) {
      case 'calm': return '🌊';
      case 'trade_winds': return '💨';
      case 'storm': return '⛈️';
      case 'fog': return '🌫️';
      default: return '☀️';
    }
  };

  const getWeatherDescription = (weather?: WeatherEffect): string => {
    if (!weather) return 'Clear skies ahead';

    switch (weather.type) {
      case 'calm':
        return 'Calm seas - perfect for resource gathering';
      case 'trade_winds':
        return 'Trade winds - swift sailing conditions';
      case 'storm':
        return 'Violent storm - treacherous waters ahead';
      case 'fog':
        return 'Dense fog - visibility severely limited';
      default:
        return 'Clear weather conditions';
    }
  };

  const getPhaseDescription = (phase: string): string => {
    switch (phase) {
      case 'deployment': return 'Deploy your fleet strategically across the battlefield';
      case 'movement': return 'Navigate the treacherous waters with tactical precision';
      case 'combat': return 'Engage in fierce ship-to-ship combat';
      case 'resource_collection': return 'Gather precious resources from controlled territories';
      default: return 'Strategic planning and coordination phase';
    }
  };

  const getPhaseEmoji = (phase: string): string => {
    switch (phase) {
      case 'deployment': return '⚓';
      case 'movement': return '🧭';
      case 'combat': return '⚔️';
      case 'resource_collection': return '💰';
      default: return '🏴‍☠️';
    }
  };

  if (!gameState) {
    return (
      <div className="battle-info-panel bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 
                      rounded-2xl border-2 border-neon-cyan/30 p-6 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-neon-gold/5 rounded-2xl"></div>
        <div className="absolute top-4 right-4 w-16 h-16 bg-neon-cyan/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-4 left-4 w-12 h-12 bg-neon-gold/10 rounded-full blur-lg animate-pulse delay-1000"></div>

        <div className="relative text-center">
          <div className="text-6xl mb-4 animate-bounce filter drop-shadow-2xl">⚓</div>
          <h3 className="text-xl font-black text-transparent bg-clip-text 
                         bg-gradient-to-r from-neon-cyan to-neon-gold mb-2">
            BATTLE COMMAND CENTER
          </h3>
          <p className="text-gray-400 font-semibold">Awaiting battle initialization...</p>

          {/* Status indicators */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-center gap-2 bg-slate-700/60 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-mono text-orange-400">STANDBY</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="battle-info-panel bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 
                    rounded-2xl border-2 border-neon-cyan/50 p-6 space-y-6 relative overflow-hidden
                    shadow-2xl shadow-neon-cyan/20">

      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-neon-gold/5 rounded-2xl"></div>
      <div className="absolute top-4 right-4 w-20 h-20 bg-neon-cyan/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-4 left-4 w-16 h-16 bg-neon-gold/10 rounded-full blur-lg animate-pulse delay-1000"></div>

      {/* Battle Status - Enhanced */}
      <div className="relative bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-cyan 
                      rounded-xl p-4 border-2 border-neon-cyan shadow-lg shadow-neon-cyan/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-black text-black drop-shadow-lg flex items-center gap-2">
            ⚔️ BATTLE COMMAND
          </h3>
          <div className="flex items-center gap-2 bg-black/20 rounded-full px-3 py-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-black">ACTIVE</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-black/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🎯</span>
              <span className="text-black font-bold">Turn</span>
            </div>
            <span className="text-2xl font-black text-neon-gold drop-shadow">#{gameState.turnNumber}</span>
          </div>

          <div className="bg-black/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getPhaseEmoji(gameState.currentPhase)}</span>
              <span className="text-black font-bold">Phase</span>
            </div>
            <span className="text-lg font-black text-neon-gold drop-shadow">
              {gameState.currentPhase.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="mt-3 bg-black/20 rounded-lg p-3">
          <p className="text-sm text-black font-bold leading-relaxed">
            {getPhaseDescription(gameState.currentPhase)}
          </p>
        </div>
      </div>

      {/* Weather Conditions - Enhanced */}
      {gameState.globalWeather && (
        <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-700/90 
                        rounded-xl p-4 border border-neon-magenta/50 backdrop-blur-sm">
          <h4 className="text-lg font-black text-neon-magenta mb-3 flex items-center gap-2">
            🌊 WEATHER CONDITIONS
          </h4>

          <div className="flex items-center gap-4 mb-3">
            <div className="text-4xl filter drop-shadow-lg animate-pulse">
              {getWeatherEmoji(gameState.globalWeather)}
            </div>
            <div className="flex-1">
              <div className="text-xl font-bold text-neon-cyan capitalize mb-1">
                {gameState.globalWeather.type.replace('_', ' ')}
              </div>
              <div className="text-sm text-gray-300 leading-relaxed">
                {getWeatherDescription(gameState.globalWeather)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-900/60 rounded-lg p-3">
            <span className="text-sm font-bold text-neon-magenta">Duration:</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-neon-gold">
                {gameState.globalWeather.duration}
              </span>
              <span className="text-sm text-gray-400">turns remaining</span>
            </div>
          </div>
        </div>
      )}

      {/* Battle Statistics - New */}
      <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-700/90 
                      rounded-xl p-4 border border-neon-gold/50 backdrop-blur-sm">
        <h4 className="text-lg font-black text-neon-gold mb-3 flex items-center gap-2">
          📊 BATTLEFIELD INTEL
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/60 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">🚢</div>
            <div className="text-xl font-black text-neon-cyan">
              {gameState.players.reduce((total, player) =>
                total + player.ships.filter(ship => ship.health > 0).length, 0
              )}
            </div>
            <div className="text-xs text-gray-400">Active Ships</div>
          </div>

          <div className="bg-slate-900/60 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">🏴‍☠️</div>
            <div className="text-xl font-black text-neon-magenta">
              {gameState.players.reduce((total, player) =>
                total + player.controlledTerritories.length, 0
              )}
            </div>
            <div className="text-xs text-gray-400">Territories</div>
          </div>

          <div className="bg-slate-900/60 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">💰</div>
            <div className="text-xl font-black text-neon-gold">
              {gameState.players.reduce((total, player) =>
                total + player.resources.gold, 0
              ).toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">Total Gold</div>
          </div>

          <div className="bg-slate-900/60 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-xl font-black text-neon-blue">
              {gameState.players.length}
            </div>
            <div className="text-xs text-gray-400">Pirates</div>
          </div>
        </div>
      </div>

      {/* Recent Events - Enhanced */}
      {gameState.eventLog && gameState.eventLog.length > 0 && (
        <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-700/90 
                        rounded-xl p-4 border border-neon-orange/50 backdrop-blur-sm">
          <h4 className="text-lg font-black text-neon-orange mb-3 flex items-center gap-2">
            📜 BATTLE LOG
          </h4>

          <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
            {gameState.eventLog.slice(-5).reverse().map((event) => (
              <div key={event.id}
                className="bg-slate-900/60 rounded-lg p-3 border-l-4 border-neon-cyan/50
                              hover:bg-slate-800/60 transition-all duration-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-neon-cyan/20 text-neon-cyan px-2 py-1 rounded text-xs font-mono font-bold">
                    T{event.turnNumber}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(event.timestamp || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed">{event.description}</p>
              </div>
            ))}
          </div>

          {gameState.eventLog.length === 0 && (
            <div className="text-center text-gray-400 py-4">
              <div className="text-2xl mb-2">📝</div>
              <p className="text-sm">No battle events yet...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}