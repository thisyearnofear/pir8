'use client';

import { TerritoryCellType } from '../types/game';

interface TerritoryTooltipProps {
  type: TerritoryCellType;
  position: { x: number; y: number };
  isVisible: boolean;
}

export const TERRITORY_INFO: Record<TerritoryCellType, {
  emoji: string;
  name: string;
  effect: string;
  resources: string;
  color: string;
}> = {
  water: {
    emoji: '🌊',
    name: 'Water',
    effect: 'Safe passage',
    resources: 'None',
    color: 'border-blue-400',
  },
  island: {
    emoji: '🏝️',
    name: 'Island',
    effect: 'Supplies generation',
    resources: '+3 supplies/turn',
    color: 'border-green-400',
  },
  port: {
    emoji: '⚓',
    name: 'Port',
    effect: 'Ship building hub',
    resources: '+5 gold, +2 crew/turn',
    color: 'border-yellow-400',
  },
  treasure: {
    emoji: '💰',
    name: 'Treasure',
    effect: 'Wealth generator',
    resources: '+10 gold/turn',
    color: 'border-neon-gold',
  },
  storm: {
    emoji: '⛈️',
    name: 'Storm',
    effect: 'Dangerous - 50% speed penalty',
    resources: '-30 health if entered',
    color: 'border-purple-400',
  },
  reef: {
    emoji: '🪨',
    name: 'Reef',
    effect: 'Hidden hazard',
    resources: '-20 health if hit',
    color: 'border-orange-400',
  },
  whirlpool: {
    emoji: '🌀',
    name: 'Whirlpool',
    effect: 'Deadly trap',
    resources: '-100 health',
    color: 'border-red-500',
  },
};

export default function TerritoryTooltip({ type, position, isVisible }: TerritoryTooltipProps) {
  if (!isVisible) return null;

  const info = TERRITORY_INFO[type];

  return (
    <div 
      className={`absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full
                  bg-slate-900/95 backdrop-blur-sm border-2 ${info.color} 
                  rounded-lg p-3 shadow-xl min-w-[180px]`}
      style={{ 
        left: position.x, 
        top: position.y - 8,
      }}
    >
      {/* Arrow */}
      <div 
        className={`absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 
                    border-l-8 border-r-8 border-t-8 
                    border-l-transparent border-r-transparent ${info.color.replace('border-', 'border-t-')}`}
      />
      
      {/* Content */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{info.emoji}</span>
        <span className="font-bold text-white">{info.name}</span>
      </div>
      
      <div className="space-y-1 text-sm">
        <div className="text-gray-300">
          <span className="text-gray-500">Effect:</span> {info.effect}
        </div>
        <div className={`font-mono ${type === 'storm' || type === 'reef' || type === 'whirlpool' ? 'text-red-400' : 'text-neon-green'}`}>
          {info.resources}
        </div>
      </div>
    </div>
  );
}
