/**
 * TerritoryBonusPanel - Display active territory bonuses
 * 
 * Core Principles:
 * - ENHANCEMENT: Provides strategic info overlay
 * - CLEAN: Pure presentation component
 * - PERFORMANT: Memoized calculations
 */

'use client';

import { useMemo } from 'react';
import { Player, GameState } from '@/types/game';
import { 
  calculateActiveBonuses, 
  calculateNextBonus
} from '@/lib/territoryBonuses';

interface TerritoryBonusPanelProps {
  player: Player;
  gameState: GameState;
  isCompact?: boolean;
}

export default function TerritoryBonusPanel({ 
  player, 
  gameState,
  isCompact = false 
}: TerritoryBonusPanelProps) {
  // PERFORMANT: Memoize expensive calculations
  const activeBonuses = useMemo(
    () => calculateActiveBonuses(player, gameState),
    [player.controlledTerritories, gameState.gameMap]
  );

  const nextBonus = useMemo(
    () => calculateNextBonus(player, gameState),
    [player.controlledTerritories, gameState.gameMap]
  );

  const tierColors = {
    bronze: 'from-amber-700 to-amber-600',
    silver: 'from-gray-400 to-gray-300',
    gold: 'from-yellow-500 to-yellow-400',
    legendary: 'from-purple-600 to-pink-500',
  };

  const tierBorders = {
    bronze: 'border-amber-600',
    silver: 'border-gray-400',
    gold: 'border-yellow-400',
    legendary: 'border-purple-500',
  };

  if (isCompact) {
    return (
      <div className="territory-bonus-compact bg-slate-900/90 border-2 border-neon-gold/50 rounded-lg p-3 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-neon-gold uppercase">Territory Bonuses</h3>
          <span className="text-xs text-gray-400">{activeBonuses.length} Active</span>
        </div>
        
        {activeBonuses.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No bonuses yet</p>
        ) : (
          <div className="space-y-1">
            {activeBonuses.slice(0, 2).map(bonus => (
              <div key={bonus.id} className="flex items-center gap-2 text-xs">
                <span className="text-lg">{bonus.icon}</span>
                <span className="text-white font-semibold truncate">{bonus.name}</span>
              </div>
            ))}
            {activeBonuses.length > 2 && (
              <p className="text-xs text-gray-400">+{activeBonuses.length - 2} more</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="territory-bonus-panel bg-slate-900/95 border-2 border-neon-gold/50 rounded-xl p-4 shadow-2xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-neon-gold uppercase flex items-center gap-2">
          <span>🏆</span>
          <span>Territory Bonuses</span>
        </h3>
        <span className="text-sm bg-neon-gold/20 text-neon-gold px-2 py-1 rounded">
          {activeBonuses.length} Active
        </span>
      </div>

      {/* Active Bonuses */}
      {activeBonuses.length > 0 ? (
        <div className="space-y-3 mb-4">
          {activeBonuses.map(bonus => (
            <div
              key={bonus.id}
              className={`bg-gradient-to-r ${tierColors[bonus.tier]} p-3 rounded-lg border-2 ${tierBorders[bonus.tier]} shadow-lg`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{bonus.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-white font-bold">{bonus.name}</h4>
                    <span className="text-xs bg-black/30 text-white px-2 py-0.5 rounded uppercase">
                      {bonus.tier}
                    </span>
                  </div>
                  <p className="text-xs text-white/90 mb-2">{bonus.description}</p>
                  
                  {/* Effects */}
                  <div className="flex flex-wrap gap-2">
                    {bonus.effects.goldMultiplier && bonus.effects.goldMultiplier > 1 && (
                      <span className="text-xs bg-black/30 text-yellow-300 px-2 py-0.5 rounded">
                        💰 +{((bonus.effects.goldMultiplier - 1) * 100).toFixed(0)}% Gold
                      </span>
                    )}
                    {bonus.effects.suppliesMultiplier && bonus.effects.suppliesMultiplier > 1 && (
                      <span className="text-xs bg-black/30 text-green-300 px-2 py-0.5 rounded">
                        📦 +{((bonus.effects.suppliesMultiplier - 1) * 100).toFixed(0)}% Supplies
                      </span>
                    )}
                    {bonus.effects.shipCostReduction && (
                      <span className="text-xs bg-black/30 text-blue-300 px-2 py-0.5 rounded">
                        🚢 -{(bonus.effects.shipCostReduction * 100).toFixed(0)}% Ship Cost
                      </span>
                    )}
                    {bonus.effects.extraAction && (
                      <span className="text-xs bg-black/30 text-purple-300 px-2 py-0.5 rounded">
                        ⚡ Extra Action
                      </span>
                    )}
                    {bonus.effects.resourceGeneration && (
                      <span className="text-xs bg-black/30 text-cyan-300 px-2 py-0.5 rounded">
                        ✨ +{bonus.effects.resourceGeneration} Resources/Turn
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4 text-center">
          <p className="text-gray-400 text-sm mb-2">No active bonuses</p>
          <p className="text-xs text-gray-500">Control more territories to unlock bonuses!</p>
        </div>
      )}

      {/* Next Bonus Progress */}
      {nextBonus && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2">
              <span>🎯</span>
              <span>Next Bonus</span>
            </h4>
            <span className="text-xs text-gray-400">
              {(nextBonus.progress * 100).toFixed(0)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-700 rounded-full mb-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neon-cyan to-neon-gold transition-all duration-500"
              style={{ width: `${nextBonus.progress * 100}%` }}
            />
          </div>

          <div className="flex items-start gap-2">
            <span className="text-xl">{nextBonus.bonus.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{nextBonus.bonus.name}</p>
              <p className="text-xs text-gray-400">Need: {nextBonus.remaining}</p>
            </div>
          </div>
        </div>
      )}

      {/* Hint */}
      {activeBonuses.length === 0 && !nextBonus && (
        <div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg p-3">
          <p className="text-xs text-neon-cyan">
            💡 <strong>Tip:</strong> Control multiple territories of the same type to unlock powerful bonuses!
          </p>
        </div>
      )}
    </div>
  );
}
