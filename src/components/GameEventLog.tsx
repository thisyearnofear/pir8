/**
 * GameEventLog - Display recent game events
 * 
 * Core Principles:
 * - ENHANCEMENT: Helps players track what happened
 * - CLEAN: Pure presentation component
 * - PERFORMANT: Shows last N events only
 */

'use client';

import { useState } from 'react';
import { GameEvent } from '@/types/game';

interface GameEventLogProps {
  events: GameEvent[];
  maxVisible?: number;
  isCompact?: boolean;
}

const EVENT_ICONS: Record<string, string> = {
  ship_moved: '⛵',
  ship_attacked: '⚔️',
  territory_claimed: '🏴‍☠️',
  resources_collected: '💰',
  ship_built: '🛠️',
  weather_change: '🌤️',
  coordinate_scanned: '🔭',
  move_executed: '📍',
  ship_destroyed: '💥',
  ability_used: '✨',
};

const EVENT_COLORS: Record<string, string> = {
  ship_moved: 'text-blue-400',
  ship_attacked: 'text-red-400',
  territory_claimed: 'text-green-400',
  resources_collected: 'text-yellow-400',
  ship_built: 'text-purple-400',
  weather_change: 'text-cyan-400',
  coordinate_scanned: 'text-indigo-400',
  move_executed: 'text-gray-400',
  ship_destroyed: 'text-red-500',
  ability_used: 'text-pink-400',
};

export default function GameEventLog({
  events,
  maxVisible = 5,
  isCompact = false,
}: GameEventLogProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleEvents = isExpanded ? events.slice(-15) : events.slice(-maxVisible);
  const hasMore = events.length > maxVisible;

  if (events.length === 0) {
    return null;
  }

  if (isCompact) {
    return (
      <div className="game-event-log-compact bg-slate-900/80 border border-slate-700 rounded-lg p-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-gray-400 uppercase">Recent</span>
          <span className="text-xs text-gray-500">{events.length}</span>
        </div>
        <div className="space-y-1">
          {events.slice(-3).map((event, idx) => (
            <div key={event.id || idx} className="flex items-center gap-1 text-xs">
              <span>{EVENT_ICONS[event.type] || '📋'}</span>
              <span className={`truncate ${EVENT_COLORS[event.type] || 'text-gray-400'}`}>
                {event.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="game-event-log bg-slate-900/95 border-2 border-slate-700 rounded-xl shadow-2xl backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 bg-slate-800/50 border-b border-slate-700 cursor-pointer hover:bg-slate-800/70 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-sm font-bold text-gray-300 uppercase flex items-center gap-2">
          <span>📜</span>
          <span>Battle Log</span>
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{events.length} events</span>
          <span className="text-gray-500">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {/* Events List */}
      <div className={`overflow-y-auto transition-all duration-300 ${isExpanded ? 'max-h-80' : 'max-h-40'}`}>
        <div className="p-2 space-y-1">
          {visibleEvents.reverse().map((event, idx) => (
            <div
              key={event.id || idx}
              className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
            >
              <span className="text-lg flex-shrink-0">{EVENT_ICONS[event.type] || '📋'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${EVENT_COLORS[event.type] || 'text-gray-400'}`}>
                  {event.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-600">Turn {event.turnNumber}</span>
                  <span className="text-xs text-gray-600">•</span>
                  <span className="text-xs text-gray-600">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Show More */}
      {hasMore && !isExpanded && (
        <div className="p-2 text-center border-t border-slate-700">
          <button
            onClick={() => setIsExpanded(true)}
            className="text-xs text-neon-cyan hover:text-neon-cyan/80 transition-colors"
          >
            Show {events.length - maxVisible} more events ↓
          </button>
        </div>
      )}
    </div>
  );
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) {
    return 'Just now';
  } else if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins}m ago`;
  } else {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
