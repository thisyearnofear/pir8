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
import { Icon, type IconName } from './ui/Icon';

interface DamagePreviewProps {
  attacker: Ship;
  defender: Ship;
  turnNumber?: number;
  consecutiveAttacks?: number;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

function shipIcon(type: string): IconName {
  switch (type) {
    case 'sloop':
      return 'ship-scout';
    case 'galleon':
    case 'flagship':
      return 'ship-heavy';
    case 'frigate':
    default:
      return 'ship';
  }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="mx-4 w-full max-w-md rounded-[var(--p8-radius)] border-2 border-[var(--p8-threat)] bg-[var(--p8-deep)] p-6 shadow-[var(--p8-shadow-instrument)]">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="mb-1 flex items-center justify-center gap-2 text-xl font-bold text-[var(--p8-vellum)]">
            <Icon name="attack" size={20} className="text-[var(--p8-threat)]" />
            Attack Preview
          </h2>
          <p className="text-sm text-[var(--p8-vellum-dim)]">Review before engaging</p>
        </div>

        {/* Combatants */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {/* Attacker */}
          <div className="text-center">
            <div className="mb-2 flex justify-center text-[var(--p8-signal)]">
              <Icon name={shipIcon(attacker.type)} size={30} />
            </div>
            <p className="text-sm font-bold capitalize text-[var(--p8-signal)]">{attacker.type}</p>
            <div className="mt-2">
              <HealthBar current={attacker.health} max={attacker.maxHealth} />
              <p className="mt-1 text-xs text-[var(--p8-vellum-dim)]">{attacker.health} HP</p>
            </div>
            {attackerStats.attack !== attacker.attack && (
              <p className="mt-1 text-xs text-[var(--p8-signal)]">
                ATK: {attackerStats.attack} (+buff)
              </p>
            )}
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center text-[var(--p8-threat)]">
            <Icon name="chevron-right" size={36} />
          </div>

          {/* Defender */}
          <div className="text-center">
            <div className="mb-2 flex justify-center text-[var(--p8-threat)]">
              <Icon name={shipIcon(defender.type)} size={30} />
            </div>
            <p className="text-sm font-bold capitalize text-[var(--p8-threat)]">{defender.type}</p>
            <div className="mt-2">
              <HealthBar current={defender.health} max={defender.maxHealth} />
              <p className="mt-1 text-xs text-[var(--p8-vellum-dim)]">{defender.health} HP</p>
            </div>
            {defenderStats.defense !== defender.defense && (
              <p className="mt-1 text-xs text-[var(--p8-signal)]">
                DEF: {defenderStats.defense} (+buff)
              </p>
            )}
          </div>
        </div>

        {/* Damage Prediction */}
        <div className="mb-4 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] p-4">
          <h3 className="mb-3 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.14em] text-[var(--p8-vellum-dim)]">
            Expected Outcome
          </h3>

          <div className="space-y-3">
            {/* Your Attack */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--p8-vellum-dim)]">Your damage:</span>
              <span className="flex items-center gap-2 text-lg font-bold text-[var(--p8-threat)]">
                {minDamage === maxDamage ? baseDamage : `${minDamage}-${maxDamage}`}
                {isMomentumHit && (
                  <span className="flex items-center gap-1 text-xs text-[var(--p8-lamp)]">
                    <Icon name="flame" size={14} /> +25%
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-[var(--p8-lamp)]">
                  <Icon name="zap" size={14} /> 15%
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--p8-vellum-dim)]">Target after:</span>
              <div className="flex items-center gap-2">
                <HealthBar current={defenderHealthAfter} max={defender.maxHealth} size="sm" />
                <span className={`flex items-center gap-1 text-sm font-bold ${willDestroy ? 'text-[var(--p8-threat)]' : 'text-[var(--p8-vellum-dim)]'}`}>
                  {willDestroy && <Icon name="skull" size={14} />}
                  {willDestroy ? 'DESTROYED' : `${defenderHealthAfter} HP`}
                </span>
              </div>
            </div>

            {/* Counter Attack */}
            {!willDestroy && counterDamage > 0 && (
              <>
                <div className="border-t border-[var(--p8-brass-line)] pt-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--p8-lamp)]">
                    Counterattack Expected
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--p8-vellum-dim)]">Counter damage:</span>
                  <span className="text-lg font-bold text-[var(--p8-lamp)]">~{counterDamage}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--p8-vellum-dim)]">Your ship after:</span>
                  <div className="flex items-center gap-2">
                    <HealthBar current={attackerHealthAfter} max={attacker.maxHealth} size="sm" />
                    <span className={`flex items-center gap-1 text-sm font-bold ${willBeDestroyed ? 'text-[var(--p8-threat)]' : 'text-[var(--p8-vellum-dim)]'}`}>
                      {willBeDestroyed && <Icon name="skull" size={14} />}
                      {willBeDestroyed ? 'DESTROYED' : `${attackerHealthAfter} HP`}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Risk Assessment */}
        <div className={`mb-4 rounded-[var(--p8-radius)] border p-2 text-center ${
          willDestroy ? 'border-[var(--p8-signal)] bg-[var(--p8-ink)]' :
          willBeDestroyed ? 'border-[var(--p8-threat)] bg-[var(--p8-ink)]' :
          damagePercent > 50 ? 'border-[var(--p8-lamp)] bg-[var(--p8-ink)]' :
          'border-[var(--p8-brass-line)] bg-[var(--p8-ink)]'
        }`}>
          <p className={`flex items-center justify-center gap-2 text-sm font-semibold ${
            willDestroy ? 'text-[var(--p8-signal)]' :
            willBeDestroyed ? 'text-[var(--p8-threat)]' :
            damagePercent > 50 ? 'text-[var(--p8-lamp)]' :
            'text-[var(--p8-vellum-dim)]'
          }`}>
            {willDestroy ? (
              <><Icon name="check" size={15} /> High chance of victory!</>
            ) : willBeDestroyed ? (
              <><Icon name="close" size={15} /> You will lose this fight!</>
            ) : damagePercent > 50 ? (
              'Risky - significant damage dealt'
            ) : (
              'Light skirmish'
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-4 py-3 font-bold text-[var(--p8-vellum-dim)] transition-colors hover:border-[var(--p8-brass)] hover:text-[var(--p8-vellum)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex flex-1 items-center justify-center gap-2 rounded-[var(--p8-radius)] border border-[var(--p8-lamp)] bg-[var(--p8-lamp)] px-4 py-3 font-bold text-[var(--p8-ink)] transition-colors hover:bg-[var(--p8-lamp-glow)] disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--p8-ink)] border-t-transparent" />
                Attacking...
              </>
            ) : (
              <>
                <Icon name="attack" size={16} />
                Attack!
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
    <div className={`w-full ${height} overflow-hidden rounded-full bg-[var(--p8-ink)]`}>
      <div
        className={`${height} rounded-full transition-all duration-300 ${
          percent > 60 ? 'bg-[var(--p8-signal)]' :
          percent > 30 ? 'bg-[var(--p8-lamp)]' :
          'bg-[var(--p8-threat)]'
        }`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
