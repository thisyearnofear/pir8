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
      {/* Battle Status - High contrast heading */}
      <div className="battle-status bg-gradient-to-r from-neon-cyan to-neon-blue rounded-lg p-3 border border-neon-cyan">
        <h3 className="text-lg font-black text-black drop-shadow">⚔️ BATTLE STATUS</h3>
        <div className="grid grid-cols-2 gap-3 text-sm mt-2">
          <div>
            <span className="text-gray-300">Turn:</span>
            <span className="text-neon-gold ml-2 font-mono font-bold">#{gameState.turnNumber}</span>
          </div>
          <div>
            <span className="text-gray-300">Phase:</span>
            <span className="text-neon-gold ml-2 font-mono font-bold">{gameState.currentPhase.toUpperCase()}</span>
          </div>
        </div>
        <p className="text-xs text-black font-semibold mt-2">{getPhaseDescription(gameState.currentPhase)}</p>
      </div>

      {/* Recent Events */}
      {gameState.eventLog && gameState.eventLog.length > 0 && (
        <div className="event-log border border-gray-600 rounded-lg p-3">
          <h4 className="text-sm font-bold text-neon-magenta mb-2">📜 BATTLE LOG</h4>
          <div className="events-list space-y-1 max-h-20 overflow-y-auto">
            {gameState.eventLog.slice(-3).reverse().map((event, index) => (
              <div key={event.id} className="event-entry text-xs bg-gray-800 rounded px-2 py-1">
                <span className="text-neon-cyan font-mono">T{event.turnNumber}:</span>
                <span className="text-gray-300 ml-1">{event.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}