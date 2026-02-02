/**
 * ResourceBar - Persistent resource display
 * 
 * Core Principles:
 * - ENHANCEMENT: Always visible resource info
 * - CLEAN: Pure presentation component
 * - PERFORMANT: Minimal re-renders with memo
 */

'use client';

import { memo } from 'react';
import { Resources } from '@/types/game';

interface ResourceBarProps {
  resources: Resources;
  previousResources?: Resources;
  isCompact?: boolean;
}

const RESOURCE_CONFIG = {
  gold: { icon: '💰', label: 'Gold', color: 'text-yellow-400' },
  crew: { icon: '👥', label: 'Crew', color: 'text-blue-400' },
  cannons: { icon: '🎯', label: 'Cannons', color: 'text-red-400' },
  supplies: { icon: '📦', label: 'Supplies', color: 'text-green-400' },
  wood: { icon: '🪵', label: 'Wood', color: 'text-amber-600' },
  rum: { icon: '🍺', label: 'Rum', color: 'text-purple-400' },
};

function ResourceBar({ resources, previousResources, isCompact = false }: ResourceBarProps) {
  const mainResources: (keyof Resources)[] = ['gold', 'crew', 'cannons', 'supplies'];

  const getDelta = (key: keyof Resources): number | null => {
    if (!previousResources) return null;
    const delta = resources[key] - previousResources[key];
    return delta !== 0 ? delta : null;
  };

  if (isCompact) {
    return (
      <div className="resource-bar-compact flex items-center gap-3 bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-1.5">
        {mainResources.map(key => {
          const config = RESOURCE_CONFIG[key];
          return (
            <div key={key} className="flex items-center gap-1" title={config.label}>
              <span className="text-sm">{config.icon}</span>
              <span className={`text-sm font-mono font-bold ${config.color}`}>
                {formatNumber(resources[key])}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="resource-bar bg-slate-900/95 border-2 border-slate-700 rounded-xl p-3 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase">Resources</h3>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {mainResources.map(key => {
          const config = RESOURCE_CONFIG[key];
          const delta = getDelta(key);
          
          return (
            <div
              key={key}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-2 text-center relative overflow-hidden"
            >
              <div className="text-xl mb-1">{config.icon}</div>
              <div className={`text-lg font-mono font-bold ${config.color}`}>
                {formatNumber(resources[key])}
              </div>
              <div className="text-xs text-gray-500">{config.label}</div>
              
              {/* Delta indicator */}
              {delta !== null && (
                <div
                  className={`absolute top-1 right-1 text-xs font-bold px-1 rounded ${
                    delta > 0 ? 'text-green-400 bg-green-900/50' : 'text-red-400 bg-red-900/50'
                  } animate-fade-in`}
                >
                  {delta > 0 ? '+' : ''}{delta}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Secondary resources (if any) */}
      {(resources.wood > 0 || resources.rum > 0) && (
        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-slate-700">
          {resources.wood > 0 && (
            <div className="flex items-center gap-1">
              <span>{RESOURCE_CONFIG.wood.icon}</span>
              <span className={`text-sm font-mono ${RESOURCE_CONFIG.wood.color}`}>
                {resources.wood}
              </span>
            </div>
          )}
          {resources.rum > 0 && (
            <div className="flex items-center gap-1">
              <span>{RESOURCE_CONFIG.rum.icon}</span>
              <span className={`text-sm font-mono ${RESOURCE_CONFIG.rum.color}`}>
                {resources.rum}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 10000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toLocaleString();
}

export default memo(ResourceBar);
