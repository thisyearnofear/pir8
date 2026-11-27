'use client';

/**
 * ActionRail — the near edge of the chart table, where the captain's hands rest.
 *
 * Exactly one primary action, in one place (DESIGN.md §8.3): the End Turn
 * lever is the only lamp-lit element on the rail. Everything else is an
 * instrument you consult, not a competing call to action.
 *
 * Contents, port to starboard:
 *   PLAQUE   — the selected ship, named in the world register with mono HP.
 *              Inert guidance when no ship is selected.
 *   DISPOSITION — fleet and territory counts as instruments (gold already
 *              lives in the instrument strip's stores; it is not repeated).
 *   LEVER    — End Turn, solid lamp with ink text. When the watch is not
 *              yours the lever is replaced by an inert awaiting instrument,
 *              so the rail never shows a dead control.
 *
 * Same component on every screen size; the disposition instruments stow on
 * narrow tables instead of forking the layout.
 */

import { Icon } from '../ui/Icon';
import { Tooltip } from '../Tooltip';
import type { Ship } from '@/types/game';

export interface ActionRailProps {
  selectedShip: Ship | null;
  onShipPlaqueClick: () => void;
  fleetCount: number;
  territoryCount: number;
  isMyTurn: boolean;
  onEndTurn: () => void;
}

export function ActionRail({
  selectedShip,
  onShipPlaqueClick,
  fleetCount,
  territoryCount,
  isMyTurn,
  onEndTurn,
}: ActionRailProps) {
  return (
    <div className="p8-rail">
      {/* PLAQUE — the ship under the captain's hand. */}
      <button
        type="button"
        className="p8-plaque"
        onClick={onShipPlaqueClick}
        disabled={!selectedShip}
        aria-label={
          selectedShip
            ? `${selectedShip.type}, ${selectedShip.health} of ${selectedShip.maxHealth} hull — open actions`
            : 'No ship selected — tap a ship on the chart'
        }
      >
        <Icon
          name="ship"
          size={18}
          className={selectedShip ? 'p8-text-lamp' : 'p8-text-mute'}
        />
        {selectedShip ? (
          <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span
              className="p8-world"
              style={{
                fontSize: 'var(--p8-fs-md)',
                lineHeight: 1.15,
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
              }}
            >
              {selectedShip.type}
            </span>
            <span
              className="p8-cell-row"
              style={{ gap: 'calc(3 * var(--p8-u))' }}
            >
              <Icon name="health" size={11} className="p8-text-threat" />
              <span
                className="p8-value"
                style={{ fontSize: 'var(--p8-fs-xs)' }}
              >
                {selectedShip.health}/{selectedShip.maxHealth}
              </span>
            </span>
          </span>
        ) : (
          <span
            className="p8-text-dim"
            style={{
              fontSize: 'var(--p8-fs-sm)',
              fontFamily: 'var(--p8-font-ui)',
              whiteSpace: 'nowrap',
            }}
          >
            Select a ship
          </span>
        )}
      </button>

      {/* DISPOSITION — fleet and territory standing. Stowed on narrow tables;
          the same numbers live in the stats drawer at every width. */}
      <div className="p8-cluster p8-stow-md">
        <Tooltip content="Active ships in your fleet" position="top">
          <div className="p8-cell cursor-help" aria-label={`${fleetCount} ships in your fleet`}>
            <span className="p8-cell-row">
              <Icon name="fleet" size={13} className="p8-text-signal" />
              <span className="p8-value" style={{ fontSize: 'var(--p8-fs-sm)' }}>
                {fleetCount}
              </span>
            </span>
          </div>
        </Tooltip>
        <Tooltip content="Territories you control" position="top">
          <div className="p8-cell cursor-help" aria-label={`${territoryCount} territories controlled`}>
            <span className="p8-cell-row">
              <Icon name="claim" size={13} className="p8-text-lamp" />
              <span className="p8-value" style={{ fontSize: 'var(--p8-fs-sm)' }}>
                {territoryCount}
              </span>
            </span>
          </div>
        </Tooltip>
      </div>

      <div style={{ flex: 1 }} />

      {/* The one primary action — or, off-watch, an inert awaiting instrument
          so the rail never presents a dead control. */}
      {isMyTurn ? (
        <button type="button" className="p8-lever" onClick={onEndTurn}>
          End Turn
          <Icon name="end-turn" size={16} strokeWidth={2} color="var(--p8-ink)" />
          <kbd className="hidden sm:inline">E</kbd>
        </button>
      ) : (
        <div className="p8-cluster" aria-live="polite">
          <div className="p8-cell">
            <span className="p8-cell-row">
              <Icon name="hourglass" size={13} className="p8-text-mute" />
              <span
                className="p8-text-dim"
                style={{
                  fontSize: 'var(--p8-fs-sm)',
                  fontFamily: 'var(--p8-font-ui)',
                  whiteSpace: 'nowrap',
                }}
              >
                Awaiting opponent
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActionRail;
