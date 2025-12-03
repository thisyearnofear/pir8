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
    if (!weather) return 'Clear skies';
    
    switch (weather.type) {
      case 'calm': 
        return 'Calm seas - better resource collection';
      case 'trade_winds': 
        return 'Trade winds - faster movement';
      case 'storm': 
        return 'Violent storm - dangerous waters';
      case 'fog': 
        return 'Dense fog - reduced visibility';
      default: 
        return 'Clear weather';
    }
  };

  const getPhaseDescription = (phase: string): string => {
    switch (phase) {
      case 'deployment': return 'Deploy your fleet strategically';
      case 'movement': return 'Navigate the treacherous waters';
      case 'combat': return 'Engage in ship-to-ship combat';
      case 'resource_collection': return 'Gather resources from controlled territories';
      default: return 'Strategic planning phase';
    }
  };

  if (!gameState) {
    return (
      <div className="battle-info-panel bg-slate-800 rounded-lg border border-gray-600 p-4">
        <div className="text-center text-gray-400">
          <div className="text-2xl mb-2">⚓</div>
          <p className="text-sm">No active battle</p>
        </div>
      </div>
    );
  }

  return (
    <div className="battle-info-panel bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg border border-neon-cyan border-opacity-30 p-4 space-y-4">
      {/* Battle Status */}
      <div className="battle-status">
        <h3 className="text-lg font-bold text-neon-cyan mb-2">⚔️ BATTLE STATUS</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-400">Turn:</span>
            <span className="text-neon-gold ml-2 font-mono">#{gameState.turnNumber}</span>
          </div>
          <div>
            <span className="text-gray-400">Phase:</span>
            <span className="text-neon-blue ml-2 font-mono">{gameState.currentPhase.toUpperCase()}</span>
          </div>
        </div>
        <p className="text-xs text-gray-300 mt-2">{getPhaseDescription(gameState.currentPhase)}</p>
      </div>

      {/* Weather Conditions */}
      {gameState.globalWeather && (
        <div className="weather-conditions border-t border-gray-600 pt-3">
          <h4 className="text-sm font-bold text-neon-orange mb-2">🌊 WEATHER CONDITIONS</h4>
          <div className="weather-card bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-xl mr-2">{getWeatherEmoji(gameState.globalWeather)}</span>
                <span className="text-sm font-bold text-white capitalize">
                  {gameState.globalWeather.type.replace('_', ' ')}
                </span>
              </div>
              <span className="text-xs text-neon-cyan">
                {gameState.globalWeather.duration} turns left
              </span>
            </div>
            <p className="text-xs text-gray-300">{getWeatherDescription(gameState.globalWeather)}</p>
            
            {/* Weather Effects */}
            <div className="weather-effects mt-2 flex flex-wrap gap-1">
              {gameState.globalWeather.effect.movementModifier !== 1.0 && (
                <span className={`text-xs px-2 py-1 rounded ${
                  gameState.globalWeather.effect.movementModifier! > 1 
                    ? 'bg-green-600 text-green-100' 
                    : 'bg-red-600 text-red-100'
                }`}>
                  Movement {gameState.globalWeather.effect.movementModifier! > 1 ? '+' : ''}{Math.round((gameState.globalWeather.effect.movementModifier! - 1) * 100)}%
                </span>
              )}
              {gameState.globalWeather.effect.resourceModifier !== 1.0 && (
                <span className={`text-xs px-2 py-1 rounded ${
                  gameState.globalWeather.effect.resourceModifier! > 1 
                    ? 'bg-green-600 text-green-100' 
                    : 'bg-yellow-600 text-yellow-100'
                }`}>
                  Resources {gameState.globalWeather.effect.resourceModifier! > 1 ? '+' : ''}{Math.round((gameState.globalWeather.effect.resourceModifier! - 1) * 100)}%
                </span>
              )}
              {gameState.globalWeather.effect.damageModifier && gameState.globalWeather.effect.damageModifier !== 1.0 && (
                <span className={`text-xs px-2 py-1 rounded ${
                  gameState.globalWeather.effect.damageModifier! > 1 
                    ? 'bg-red-600 text-red-100' 
                    : 'bg-blue-600 text-blue-100'
                }`}>
                  Combat {gameState.globalWeather.effect.damageModifier! > 1 ? '+' : ''}{Math.round((gameState.globalWeather.effect.damageModifier! - 1) * 100)}%
                </span>
              )}
              {gameState.globalWeather.effect.visibilityReduced && (
                <span className="text-xs px-2 py-1 rounded bg-gray-600 text-gray-100">
                  Limited Visibility
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Events */}
      {gameState.eventLog && gameState.eventLog.length > 0 && (
        <div className="event-log border-t border-gray-600 pt-3">
          <h4 className="text-sm font-bold text-neon-magenta mb-2">📜 BATTLE LOG</h4>
          <div className="events-list space-y-1 max-h-24 overflow-y-auto">
            {gameState.eventLog.slice(-3).reverse().map((event, index) => (
              <div key={event.id} className="event-entry text-xs bg-gray-700 rounded px-2 py-1">
                <span className="text-neon-cyan">T{event.turnNumber}:</span>
                <span className="text-gray-300 ml-1">{event.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Battle Statistics */}
      <div className="battle-stats border-t border-gray-600 pt-3">
        <h4 className="text-sm font-bold text-neon-green mb-2">📊 BATTLE STATS</h4>
        <div className="stats-grid grid grid-cols-2 gap-2 text-xs">
          <div className="stat-item">
            <span className="text-gray-400">Total Ships:</span>
            <span className="text-white ml-1 font-mono">
              {gameState.players.reduce((total, player) => 
                total + player.ships.filter(ship => ship.health > 0).length, 0
              )}
            </span>
          </div>
          <div className="stat-item">
            <span className="text-gray-400">Active Players:</span>
            <span className="text-white ml-1 font-mono">
              {gameState.players.filter(player => player.isActive).length}
            </span>
          </div>
          <div className="stat-item">
            <span className="text-gray-400">Territories:</span>
            <span className="text-white ml-1 font-mono">
              {gameState.players.reduce((total, player) => 
                total + player.controlledTerritories.length, 0
              )}
            </span>
          </div>
          <div className="stat-item">
            <span className="text-gray-400">Battle ID:</span>
            <span className="text-neon-cyan ml-1 font-mono text-xs">
              {gameState.gameId.split('_')[1]?.substring(0, 6)}...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}