'use client';

/**
 * BattleInfoPanel — the conditions page of the captain's ledger.
 *
 * Token-native rewrite of the neon "BATTLE COMMAND CENTER". What is unique
 * here stays: the phase and what it means, the weather and what it does,
 * battlefield totals. What merely repeated the instrument strip (turn number
 * readouts, weather glyphs as decoration) is gone — one glance hierarchy,
 * reference detail lives in the ledger.
 */

import { GameState, WeatherEffect } from '../types/game';
import { Icon, type IconName } from './ui/Icon';

interface BattleInfoPanelProps {
  gameState: GameState | null;
}

const WEATHER_DISPLAY: Record<string, { icon: IconName; label: string; description: string }> = {
  calm: {
    icon: 'calm',
    label: 'Calm seas',
    description: 'Perfect for resource gathering',
  },
  trade_winds: {
    icon: 'trade-winds',
    label: 'Trade winds',
    description: 'Swift sailing conditions',
  },
  storm: {
    icon: 'storm',
    label: 'Storm',
    description: 'Treacherous waters ahead',
  },
  fog: {
    icon: 'fog',
    label: 'Fog',
    description: 'Visibility severely limited',
  },
};

const PHASE_DISPLAY: Record<string, { icon: IconName; description: string }> = {
  deployment: {
    icon: 'anchor',
    description: 'Deploy the fleet across the chart',
  },
  movement: {
    icon: 'navigation',
    description: 'Navigate with tactical precision',
  },
  combat: {
    icon: 'attack',
    description: 'Ship-to-ship combat',
  },
  resource_collection: {
    icon: 'collect',
    description: 'Gather resources from controlled territory',
  },
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="p8-cell-row" style={{ justifyContent: 'space-between' }}>
      <span className="p8-label">{label}</span>
      <span className="p8-value" style={{ fontSize: 'var(--p8-fs-sm)' }}>
        {children}
      </span>
    </div>
  );
}

export default function BattleInfoPanel({ gameState }: BattleInfoPanelProps) {
  if (!gameState) {
    return (
      <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)' }}>
        <span className="p8-label">Conditions</span>
        <p
          className="p8-text-mute"
          style={{ fontSize: 'var(--p8-fs-sm)', fontFamily: 'var(--p8-font-ui)', marginTop: 'var(--p8-space-1)' }}
        >
          Awaiting battle initialization…
        </p>
      </div>
    );
  }

  const weather: WeatherEffect | undefined = gameState.globalWeather;
  const weatherDisplay = weather ? WEATHER_DISPLAY[weather.type] : undefined;
  const phase = PHASE_DISPLAY[gameState.currentPhase];

  const activeShips = gameState.players.reduce(
    (total, player) => total + player.ships.filter((ship) => ship.health > 0).length,
    0,
  );
  const controlledTerritories = gameState.players.reduce(
    (total, player) => total + player.controlledTerritories.length,
    0,
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--p8-space-3)' }}>
      {/* Phase — what the fleet is doing this turn */}
      <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)' }}>
        <div className="p8-cell-row" style={{ justifyContent: 'space-between', marginBottom: 'var(--p8-space-1)' }}>
          <span className="p8-label">Phase</span>
          <span className="p8-cell-row">
            {phase && <Icon name={phase.icon} size={12} className="p8-text-mute" />}
            <span className="p8-value" style={{ fontSize: 'var(--p8-fs-sm)', textTransform: 'capitalize' }}>
              {gameState.currentPhase.replace('_', ' ')}
            </span>
          </span>
        </div>
        {phase && (
          <p
            className="p8-text-dim"
            style={{ fontSize: 'var(--p8-fs-xs)', fontFamily: 'var(--p8-font-ui)', lineHeight: 1.4 }}
          >
            {phase.description}
          </p>
        )}
      </div>

      {/* Weather — the sky and what it does to the chart */}
      {weather && weatherDisplay && (
        <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)' }}>
          <div className="p8-cell-row" style={{ justifyContent: 'space-between', marginBottom: 'var(--p8-space-1)' }}>
            <span className="p8-label">Weather</span>
            <span className="p8-cell-row">
              <Icon name={weatherDisplay.icon} size={12} className="p8-text-mute" />
              <span className="p8-value" style={{ fontSize: 'var(--p8-fs-sm)' }}>
                {weatherDisplay.label}
              </span>
            </span>
          </div>
          <p
            className="p8-text-dim"
            style={{ fontSize: 'var(--p8-fs-xs)', fontFamily: 'var(--p8-font-ui)', lineHeight: 1.4, marginBottom: 'var(--p8-space-1)' }}
          >
            {weatherDisplay.description}
          </p>
          <Row label="Turns remaining">{weather.duration}</Row>
        </div>
      )}

      {/* Battlefield totals */}
      <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--p8-space-1)' }}>
          <span className="p8-label">Battlefield</span>
          <Row label="Ships afloat">{activeShips}</Row>
          <Row label="Territory held">{controlledTerritories}</Row>
        </div>
      </div>
    </div>
  );
}
