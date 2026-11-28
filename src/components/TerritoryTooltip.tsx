'use client';

import { TerritoryCellType } from '../types/game';
import { Icon, type IconName } from './ui/Icon';

interface TerritoryTooltipProps {
  type: TerritoryCellType;
  position: { x: number; y: number };
  isVisible: boolean;
}

type DriftClass = 'safe' | 'rich' | 'danger';

const DRIFT_BORDER: Record<DriftClass, string> = {
  safe: 'border-[var(--p8-signal)]',
  rich: 'border-[var(--p8-lamp)]',
  danger: 'border-[var(--p8-threat)]',
};

const DRIFT_T_BORDER: Record<DriftClass, string> = {
  safe: 'border-t-[var(--p8-signal)]',
  rich: 'border-t-[var(--p8-lamp)]',
  danger: 'border-t-[var(--p8-threat)]',
};

export const TERRITORY_INFO: Record<
  TerritoryCellType,
  {
    icon: IconName;
    name: string;
    effect: string;
    resources: string;
    drift: DriftClass;
  }
> = {
  water: {
    icon: 'water',
    name: 'Water',
    effect: 'Safe passage',
    resources: 'None',
    drift: 'safe',
  },
  island: {
    icon: 'island',
    name: 'Island',
    effect: 'Supplies generation',
    resources: '+3 supplies/turn',
    drift: 'rich',
  },
  port: {
    icon: 'port',
    name: 'Port',
    effect: 'Ship building hub',
    resources: '+5 gold, +2 crew/turn',
    drift: 'rich',
  },
  treasure: {
    icon: 'treasure',
    name: 'Treasure',
    effect: 'Wealth generator',
    resources: '+10 gold/turn',
    drift: 'rich',
  },
  storm: {
    icon: 'storm',
    name: 'Storm',
    effect: 'Dangerous - 50% speed penalty',
    resources: '-30 health if entered',
    drift: 'danger',
  },
  reef: {
    icon: 'reef',
    name: 'Reef',
    effect: 'Hidden hazard',
    resources: '-20 health if hit',
    drift: 'danger',
  },
  whirlpool: {
    icon: 'whirlpool',
    name: 'Whirlpool',
    effect: 'Deadly trap',
    resources: '-100 health',
    drift: 'danger',
  },
};

export default function TerritoryTooltip({ type, position, isVisible }: TerritoryTooltipProps) {
  if (!isVisible) return null;

  const info = TERRITORY_INFO[type];

  return (
    <div
      className={`pointer-events-none absolute z-50 min-w-[180px] -translate-x-1/2 -translate-y-full transform rounded-[var(--p8-radius)] border-2 bg-[var(--p8-deep)] p-3 shadow-[var(--p8-shadow-instrument)] ${DRIFT_BORDER[info.drift]}`}
      style={{
        left: position.x,
        top: position.y - 8,
      }}
    >
      {/* Arrow */}
      <div
        className={`absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent ${DRIFT_T_BORDER[info.drift]}`}
      />

      {/* Content */}
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] text-[var(--p8-lamp)]">
          <Icon name={info.icon} size={14} />
        </span>
        <span className="font-bold text-[var(--p8-vellum)]">{info.name}</span>
      </div>

      <div className="space-y-1 text-sm">
        <div className="text-[var(--p8-vellum-dim)]">
          <span className="text-[var(--p8-vellum-mute)]">Effect:</span> {info.effect}
        </div>
        <div
          className={`font-[var(--font-instrument)] ${info.drift === 'danger' ? 'text-[var(--p8-threat)]' : 'text-[var(--p8-signal)]'}`}
        >
          {info.resources}
        </div>
      </div>
    </div>
  );
}
