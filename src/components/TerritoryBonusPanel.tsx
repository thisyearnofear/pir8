/**
 * TerritoryBonusPanel — the bonuses instrument at the table's edge.
 *
 * Compact overlay form only: it was the sole variant ever rendered (both
 * layouts use isCompact); the dead full-size variant was removed rather than
 * reskinned. Bonus definitions in the data layer still carry emoji in their
 * `icon` field — they are mapped to Lucide here rather than rendered as
 * iconography (DESIGN.md §5), until the data layer is cleaned up.
 */

'use client';

import { useMemo } from 'react';
import { Player, GameState } from '@/types/game';
import {
  calculateActiveBonuses,
} from '@/lib/territoryBonuses';
import { Icon, type IconName } from './ui/Icon';

interface TerritoryBonusPanelProps {
  player: Player;
  gameState: GameState;
  isCompact?: boolean;
}

/* Transitional map: the data layer's emoji content → semantic Lucide icons. */
const BONUS_ICONS: Record<string, IconName> = {
  '⚓': 'anchor',
  '🏝️': 'island',
  '🌴': 'island',
  '🏛️': 'landmark',
  '📦': 'supplies',
  '💰': 'gold',
  '👑': 'crown',
  '⚖️': 'gauge',
};

export default function TerritoryBonusPanel({
  player,
  gameState,
}: TerritoryBonusPanelProps) {
  const activeBonuses = useMemo(
    () => calculateActiveBonuses(player, gameState),
    [player, gameState]
  );

  return (
    <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)' }}>
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 'var(--p8-space-1)' }}
      >
        <span className="p8-label">Bonuses</span>
        <span className="p8-value p8-text-mute" style={{ fontSize: 'var(--p8-fs-xs)' }}>
          {activeBonuses.length}
        </span>
      </div>

      {activeBonuses.length === 0 ? (
        <span
          className="p8-text-mute"
          style={{ fontSize: 'var(--p8-fs-xs)', fontFamily: 'var(--p8-font-ui)' }}
        >
          None yet
        </span>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(3 * var(--p8-u))' }}>
          {activeBonuses.slice(0, 2).map((bonus) => (
            <div key={bonus.id} className="p8-cell-row">
              <Icon
                name={BONUS_ICONS[bonus.icon] || 'trophy'}
                size={12}
                className="p8-text-lamp"
              />
              <span
                className="p8-text-dim"
                style={{
                  fontSize: 'var(--p8-fs-xs)',
                  fontFamily: 'var(--p8-font-ui)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 'calc(120 * var(--p8-u))',
                }}
              >
                {bonus.name}
              </span>
            </div>
          ))}
          {activeBonuses.length > 2 && (
            <span
              className="p8-value p8-text-mute"
              style={{ fontSize: 'var(--p8-fs-xs)' }}
            >
              +{activeBonuses.length - 2} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
