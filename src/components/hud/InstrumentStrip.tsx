'use client';

/**
 * InstrumentStrip — the brass rail at the top edge of the chart table.
 *
 * One component for every screen size (DESIGN.md §9 bans layout forks):
 * density changes responsively inside the strip, the instrument does not fork.
 *
 * Glance hierarchy, left to right:
 *   HELM     — whose watch it is, decision clock, speed bonus tier
 *   WEATHER  — the sky and how many turns it lasts (core mechanic)
 *   STORES   — the six resources, mono tabular, icon + number
 *   TURN     — the log position and the fleet count
 *   PRACTICE — mode marker chip, when local
 *   menu     — the one button in the strip
 *
 * Contract notes:
 *  - Numbers are .p8-value (JetBrains Mono, tabular) so ticking never reflows.
 *  - Hue is never the only signal: the clock also shows the bonus digits,
 *    weather always names itself in text, the helm says whose turn in words.
 *  - The lamp glows only on the helm during your own watch.
 */

import { Icon, type IconName } from '../ui/Icon';
import { Tooltip } from '../Tooltip';
import type { Resources, WeatherEffect } from '@/types/game';

export interface InstrumentStripProps {
  isMyTurn: boolean;
  currentPlayerName: string;
  decisionTimeMs: number;
  turnNumber: number;
  playerCount: number;
  weather?: WeatherEffect | null;
  resources?: Resources | null;
  isPracticeMode: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
}

function speedBonusTier(ms: number): number {
  if (ms < 5000) return 100;
  if (ms < 10000) return 50;
  if (ms < 15000) return 25;
  return 0;
}

function formatClock(ms: number): string {
  const total = Math.floor(ms / 1000);
  if (total < 60) return `${String(total).padStart(2, '0')}s`;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const WEATHER_DISPLAY: Record<string, { icon: IconName; label: string }> = {
  storm: { icon: 'storm', label: 'Storm' },
  fog: { icon: 'fog', label: 'Fog' },
  calm: { icon: 'calm', label: 'Calm' },
  trade_winds: { icon: 'trade-winds', label: 'Trade winds' },
  clear: { icon: 'calm', label: 'Clear' },
};

const STORE_CELLS: Array<{
  key: keyof Resources;
  icon: IconName;
  label: string;
  hideBelow?: 'sm' | 'md';
}> = [
  { key: 'gold', icon: 'gold', label: 'Gold' },
  { key: 'crew', icon: 'crew', label: 'Crew' },
  { key: 'cannons', icon: 'cannons', label: 'Cannons', hideBelow: 'sm' },
  { key: 'supplies', icon: 'supplies', label: 'Supplies', hideBelow: 'sm' },
  { key: 'wood', icon: 'wood', label: 'Wood', hideBelow: 'md' },
  { key: 'rum', icon: 'rum', label: 'Rum', hideBelow: 'md' },
];

function stowClass(hideBelow?: 'sm' | 'md'): string {
  if (hideBelow === 'sm') return 'p8-stow-sm';
  if (hideBelow === 'md') return 'p8-stow-md';
  return '';
}

export function InstrumentStrip({
  isMyTurn,
  currentPlayerName,
  decisionTimeMs,
  turnNumber,
  playerCount,
  weather,
  resources,
  isPracticeMode,
  menuOpen,
  onToggleMenu,
}: InstrumentStripProps) {
  const bonus = speedBonusTier(decisionTimeMs);
  const weatherDisplay = weather ? WEATHER_DISPLAY[weather.type] : undefined;
  const opponent = currentPlayerName.trim() || 'Opponent';

  return (
    <header className="p8-strip" role="banner">
      {/* HELM — whose watch, the decision clock, the speed bonus tier. */}
      <div className="p8-cluster">
        <div className={`p8-cell ${isMyTurn ? 'p8-cell-lit' : ''}`} aria-live="polite">
          <span className="p8-label">Helm</span>
          <span className="p8-cell-row">
            <Icon
              name={isMyTurn ? 'compass' : 'hourglass'}
              size={14}
              className={isMyTurn ? 'p8-text-lamp' : 'p8-text-mute'}
            />
            <span
              className="p8-value"
              style={{ fontSize: 'var(--p8-fs-sm)', whiteSpace: 'nowrap' }}
            >
              {isMyTurn
                ? 'Your turn'
                : `${opponent.slice(0, 10)}${opponent.length > 10 ? '…' : ''}`}
            </span>
          </span>
        </div>

        {isMyTurn && (
          <Tooltip
            content="Speed bonus: under 5s +100, under 10s +50, under 15s +25"
            position="bottom"
          >
            <div className="p8-cell cursor-help">
              <span className="p8-label">Clock</span>
              <span className="p8-cell-row">
                <span
                  className={`p8-value ${bonus === 0 ? 'p8-text-threat' : ''}`}
                  style={{ fontSize: 'var(--p8-fs-sm)' }}
                >
                  {formatClock(decisionTimeMs)}
                </span>
                {bonus > 0 && (
                  <span
                    className="p8-value p8-text-signal"
                    style={{ fontSize: 'var(--p8-fs-xs)' }}
                  >
                    +{bonus}
                  </span>
                )}
              </span>
            </div>
          </Tooltip>
        )}
      </div>

      {/* WEATHER — the sky, named in text, with its remaining duration. */}
      <div className="p8-cluster">
        <div className="p8-cell">
          <span className="p8-label">Weather</span>
          <span className="p8-cell-row">
            <Icon
              name={weatherDisplay?.icon ?? 'calm'}
              size={14}
              className="p8-text-dim"
            />
            <span
              className="p8-value"
              style={{ fontSize: 'var(--p8-fs-sm)', whiteSpace: 'nowrap' }}
            >
              {weatherDisplay?.label ?? 'Calm'}
            </span>
            {weather && weather.duration > 0 && (
              <span
                className="p8-value p8-text-mute"
                style={{ fontSize: 'var(--p8-fs-xs)' }}
              >
                {weather.duration}t
              </span>
            )}
          </span>
        </div>
      </div>

      {/* STORES — the six resources. Lower-priority stores stow away on narrow
          tables rather than forking the layout. */}
      {resources && (
        <div className="p8-cluster" aria-label="Stores">
          {STORE_CELLS.map(({ key, icon, label, hideBelow }) => (
            <div
              key={key}
              className={`p8-cell ${stowClass(hideBelow)}`}
              aria-label={`${label}: ${resources[key]}`}
            >
              <span className="p8-cell-row">
                <Icon name={icon} size={13} className="p8-text-mute" />
                <span
                  className="p8-value"
                  style={{ fontSize: 'var(--p8-fs-sm)' }}
                >
                  {resources[key]}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Spacer pushes the log and menu to the starboard end. */}
      <div style={{ flex: 1 }} />

      {/* TURN — position in the log and the size of the fleet action. */}
      <div className="p8-cluster p8-stow-sm">
        <div className="p8-cell">
          <span className="p8-label">Turn</span>
          <span className="p8-value" style={{ fontSize: 'var(--p8-fs-sm)' }}>
            {turnNumber}
          </span>
        </div>
        <div className="p8-cell p8-stow-md">
          <span className="p8-label">Pirates</span>
          <span className="p8-cell-row">
            <Icon name="crew" size={13} className="p8-text-mute" />
            <span className="p8-value" style={{ fontSize: 'var(--p8-fs-sm)' }}>
              {playerCount}
            </span>
          </span>
        </div>
      </div>

      {isPracticeMode && (
        <Tooltip
          content="Local practice game — connect a wallet for on-chain battles"
          position="bottom"
        >
          <span className="p8-chip cursor-help" style={{ alignSelf: 'center' }} aria-label="Practice mode">
            <Icon name="zap" size={12} />
            <span className="hidden sm:inline">Practice</span>
          </span>
        </Tooltip>
      )}

      <button
        type="button"
        className="p8-iconbtn"
        onClick={onToggleMenu}
        aria-label={menuOpen ? 'Close game menu' : 'Open game menu'}
        aria-expanded={menuOpen}
      >
        <Icon name={menuOpen ? 'close' : 'menu'} size={18} strokeWidth={2} />
      </button>
    </header>
  );
}

export default InstrumentStrip;
