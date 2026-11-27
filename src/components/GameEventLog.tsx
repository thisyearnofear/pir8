/**
 * GameEventLog — the log book at the table's edge.
 *
 * A compact instrument showing the latest entries. Only the compact form was
 * ever used (both layouts); the dead full-size variant was removed rather
 * than reskinned. Event descriptions are content strings and may still carry
 * emoji inside their copy — that cleanup is downstream of the data layer —
 * but no emoji serves as iconography here (DESIGN.md §5).
 */

'use client';

import { GameEvent } from '@/types/game';
import { Icon, type IconName } from './ui/Icon';

interface GameEventLogProps {
  events: GameEvent[];
  maxVisible?: number;
  isCompact?: boolean;
}

const EVENT_ICONS: Record<string, IconName> = {
  ship_moved: 'move',
  ship_attacked: 'attack',
  territory_claimed: 'claim',
  resources_collected: 'collect',
  ship_built: 'build',
  weather_change: 'trade-winds',
  coordinate_scanned: 'scan',
  move_executed: 'navigation',
  ship_destroyed: 'skull',
  ability_used: 'sparkles',
};

/* Semantic colour is the second channel — the icon already carries the
   meaning, so tone only reinforces it. */
const EVENT_TONE: Record<string, string> = {
  ship_attacked: 'p8-text-threat',
  ship_destroyed: 'p8-text-threat',
  territory_claimed: 'p8-text-signal',
  resources_collected: 'p8-text-lamp',
  ship_built: 'p8-text-signal',
  weather_change: 'p8-text-lamp',
};

export default function GameEventLog({
  events,
  maxVisible = 3,
}: GameEventLogProps) {
  if (events.length === 0) {
    return null;
  }

  const visible = events.slice(-maxVisible);

  return (
    <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)' }}>
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 'var(--p8-space-1)' }}
      >
        <span className="p8-label">Log book</span>
        <span className="p8-value p8-text-mute" style={{ fontSize: 'var(--p8-fs-xs)' }}>
          {events.length}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(3 * var(--p8-u))' }}>
        {visible.map((event, idx) => (
          <div key={event.id || idx} className="p8-cell-row" style={{ alignItems: 'flex-start' }}>
            <span style={{ marginTop: 'calc(1 * var(--p8-u))', flexShrink: 0 }}>
              <Icon
                name={EVENT_ICONS[event.type] || 'log'}
                size={12}
                className={EVENT_TONE[event.type] || 'p8-text-mute'}
              />
            </span>
            <span
              className="p8-text-dim"
              style={{
                fontSize: 'var(--p8-fs-xs)',
                fontFamily: 'var(--p8-font-ui)',
                lineHeight: 1.35,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {event.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
