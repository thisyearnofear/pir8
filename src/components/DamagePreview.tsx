/**
 * DamagePreview - Show attack outcome before confirming
 * 
 * Core Principles:
 * - ENHANCEMENT: Helps players make informed decisions
 * - CLEAN: Pure calculation and display
 * - MODULAR: Reusable damage calculation
 */

'use client';

import { Ship } from '@/types/game';
import { GameBalance } from '@/lib/gameBalance';
import { getEffectiveStats } from '@/lib/shipAbilities';

interface DamagePreviewProps {
  attacker: Ship;
  defender: Ship;
  turnNumber?: number;
  consecutiveAttacks?: number;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export default function DamagePreview({
  attacker,
  defender,
  turnNumber = 0,
  consecutiveAttacks = 0,
  onConfirm,
  onCancel,
  isProcessing = false,
}: DamagePreviewProps) {
  const isMomentumHit = GameBalance.checkMomentum(consecutiveAttacks);

  // Get effective stats (including buffs/debuffs)
  const attackerStats = getEffectiveStats(attacker);
  const defenderStats = getEffectiveStats(defender);

  // Calculate expected damage range
  const { damage: baseDamage } = GameBalance.calculateCombatDamage(
    attacker.type,
    defender.type,
    attacker.health,
    defenderStats.defense,
    turnNumber,
    isMomentumHit
  );

  // Show damage range (±15% variance)
  const minDamage = Math.floor(baseDamage * 0.85);
  const maxDamage = Math.ceil(baseDamage * 1.15);

  // Calculate outcomes
  const defenderHealthAfter = Math.max(0, defender.health - baseDamage);
  const willDestroy = defenderHealthAfter === 0;
  const damagePercent = Math.round((baseDamage / defender.health) * 100);

  // Calculate counterattack (if defender survives and is adjacent)
  const counterResult = !willDestroy
    ? GameBalance.calculateCombatDamage(
        defender.type,
        attacker.type,
        defenderHealthAfter,
        attackerStats.defense,
        turnNumber,
        false
      )
    : { damage: 0, isCritical: false };
  const counterDamage = counterResult.damage;
  const attackerHealthAfter = Math.max(0, attacker.health - counterDamage);
  const willBeDestroyed = attackerHealthAfter === 0;

  return (
    <div className="damage-preview fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border-2 border-red-600 rounded-xl p-6 shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-red-400 mb-1">⚔️ Attack Preview</h2>
          <p className="text-sm text-gray-400">Review before engaging</p>
        </div>

        {/* Combatants */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Attacker */}
          <div className="text-center">
            <div className="text-3xl mb-2">
              {getShipEmoji(attacker.type)}
            </div>
            <p className="text-sm font-bold text-neon-cyan capitalize">{attacker.type}</p>
            <div className="mt-2">
              <HealthBar current={attacker.health} max={attacker.maxHealth} />
              <p className="text-xs text-gray-400 mt-1">{attacker.health} HP</p>
            </div>
            {attackerStats.attack !== attacker.attack && (
              <p className="text-xs text-green-400 mt-1">
                ATK: {attackerStats.attack} (+buff)
              </p>
            )}
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <div className="text-4xl text-red-500 animate-pulse">→</div>
          </div>

          {/* Defender */}
          <div className="text-center">
            <div className="text-3xl mb-2">
              {getShipEmoji(defender.type)}
            </div>
            <p className="text-sm font-bold text-red-400 capitalize">{defender.type}</p>
            <div className="mt-2">
              <HealthBar current={defender.health} max={defender.maxHealth} />
              <p className="text-xs text-gray-400 mt-1">{defender.health} HP</p>
            </div>
            {defenderStats.defense !== defender.defense && (
              <p className="text-xs text-blue-400 mt-1">
                DEF: {defenderStats.defense} (+buff)
              </p>
            )}
          </div>
        </div>

        {/* Damage Prediction */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-bold text-gray-300 mb-3">Expected Outcome</h3>

          <div className="space-y-3">
            {/* Your Attack */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Your damage:</span>
              <span className="text-lg font-bold text-red-400">
                {minDamage === maxDamage ? baseDamage : `${minDamage}-${maxDamage}`}
                {isMomentumHit && <span className="text-orange-400 ml-2">🔥(+25%)</span>}
                <span className="text-yellow-400 ml-2">💥(15%)</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Target after:</span>
              <div className="flex items-center gap-2">
                <HealthBar current={defenderHealthAfter} max={defender.maxHealth} size="sm" />
                <span className={`text-sm font-bold ${willDestroy ? 'text-red-500' : 'text-gray-300'}`}>
                  {willDestroy ? '💀 DESTROYED' : `${defenderHealthAfter} HP`}
                </span>
              </div>
            </div>

            {/* Counter Attack */}
            {!willDestroy && counterDamage > 0 && (
              <>
                <div className="border-t border-slate-700 pt-3">
                  <p className="text-xs text-yellow-400 mb-2">⚠️ Counterattack Expected</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Counter damage:</span>
                  <span className="text-lg font-bold text-orange-400">~{counterDamage}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Your ship after:</span>
                  <div className="flex items-center gap-2">
                    <HealthBar current={attackerHealthAfter} max={attacker.maxHealth} size="sm" />
                    <span className={`text-sm font-bold ${willBeDestroyed ? 'text-red-500' : 'text-gray-300'}`}>
                      {willBeDestroyed ? '💀 DESTROYED' : `${attackerHealthAfter} HP`}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Risk Assessment */}
        <div className={`text-center p-2 rounded-lg mb-4 ${
          willDestroy ? 'bg-green-900/30 border border-green-600' :
          willBeDestroyed ? 'bg-red-900/30 border border-red-600' :
          damagePercent > 50 ? 'bg-yellow-900/30 border border-yellow-600' :
          'bg-slate-800/50 border border-slate-700'
        }`}>
          <p className={`text-sm font-semibold ${
            willDestroy ? 'text-green-400' :
            willBeDestroyed ? 'text-red-400' :
            damagePercent > 50 ? 'text-yellow-400' :
            'text-gray-400'
          }`}>
            {willDestroy ? '✅ High chance of victory!' :
             willBeDestroyed ? '❌ You will lose this fight!' :
             damagePercent > 50 ? '⚠️ Risky - significant damage dealt' :
             '➖ Light skirmish'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <span className="animate-spin">⏳</span>
                Attacking...
              </>
            ) : (
              <>
                ⚔️ Attack!
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function HealthBar({ current, max, size = 'md' }: { current: number; max: number; size?: 'sm' | 'md' }) {
  const percent = (current / max) * 100;
  const height = size === 'sm' ? 'h-1.5' : 'h-2';
  
  return (
    <div className={`w-full ${height} bg-slate-700 rounded-full overflow-hidden`}>
      <div
        className={`${height} rounded-full transition-all duration-300 ${
          percent > 60 ? 'bg-green-500' :
          percent > 30 ? 'bg-yellow-500' :
          'bg-red-500'
        }`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function getShipEmoji(type: string): string {
  const emojis: Record<string, string> = {
    sloop: '⛵',
    frigate: '🚢',
    galleon: '🛳️',
    flagship: '🚤',
  };
  return emojis[type] || '🚢';
}
