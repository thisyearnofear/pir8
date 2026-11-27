'use client';

/**
 * MenuDrawer — the captain's ledger.
 *
 * One drawer for every screen size: a bottom sheet on narrow tables, a
 * starboard panel on wide ones — placement is responsive CSS inside the one
 * component, not a layout fork (DESIGN.md §9).
 *
 * The chrome is token-only: ink backdrop without blur (§9 bans
 * backdrop-filter), deep instrument housing, brass hairlines, Lucide tab
 * icons with text labels. The panels inside the tabs are migrating to the
 * token system slice by slice — the ledger is the frame they converge into.
 */

import { useEffect } from 'react';
import PlayerStats from '../PlayerStats';
import BattleInfoPanel from '../BattleInfoPanel';
import ResourceCollectionPanel from '../ResourceCollectionPanel';
import PirateControls from '../PirateControls';
import ShipBuildingPanel from '../ShipBuildingPanel';
import { Icon, type IconName } from '../ui/Icon';
import { Haptic } from '@/utils/haptics';
import type { GameState, Player } from '@/types/game';

export type MenuTab = 'stats' | 'actions' | 'build' | 'ai';

const TABS: Array<{ id: MenuTab; label: string; icon: IconName }> = [
  { id: 'stats', label: 'Stats', icon: 'stats' },
  { id: 'actions', label: 'Actions', icon: 'attack' },
  { id: 'build', label: 'Build', icon: 'build' },
  { id: 'ai', label: 'AI', icon: 'brain' },
];

export interface MenuDrawerProps {
  open: boolean;
  onClose: () => void;
  activeTab: MenuTab;
  onTabChange: (tab: MenuTab) => void;

  gameState: GameState;
  currentPlayer: Player | null;
  isMyTurn: boolean;
  isPracticeMode: boolean;

  decisionTimeMs: number;
  scanChargesRemaining: number;
  speedBonusAccumulated: number;
  averageDecisionTimeMs: number;
  scannedCoordinates: string[];

  selectedShipId: string | null;
  onShipSelect: (shipId: string | null) => void;
  onShipAction: (shipId: string, action: 'move' | 'attack' | 'claim' | 'collect' | 'build') => void;
  onEndTurn: () => void;
  onCollectResources: () => Promise<boolean>;
  /** On-chain scan; undefined in practice where scanning is not a mechanic. */
  onScanCoordinate?: (x: number, y: number) => Promise<void>;
  onBuildShip: (shipType: string, portX: number, portY: number) => Promise<boolean>;
  onPracticeMode: () => void;
  onToggleAIReasoning?: () => void;

  // Lobby actions are inert mid-game; the drawer supplies no-ops so neither
  // layout has to hand-roll stubs.
  onCreateGame?: () => void;
  onQuickStart?: () => void;
  onStartGame?: () => Promise<void>;
  onJoinGame?: (gameId: string) => Promise<boolean>;
  isCreatingGame?: boolean;
  isJoining?: boolean;
  joinError?: string;
  onClearJoinError?: () => void;
}

const noop = () => {};
const noopAsync = async () => {};
const noopJoin = async () => false;

export function MenuDrawer({
  open,
  onClose,
  activeTab,
  onTabChange,
  gameState,
  currentPlayer,
  isMyTurn,
  isPracticeMode,
  decisionTimeMs,
  scanChargesRemaining,
  speedBonusAccumulated,
  averageDecisionTimeMs,
  scannedCoordinates,
  selectedShipId,
  onShipSelect,
  onShipAction,
  onEndTurn,
  onCollectResources,
  onScanCoordinate,
  onBuildShip,
  onPracticeMode,
  onToggleAIReasoning,
  onCreateGame = noop,
  onQuickStart = noop,
  onStartGame = noopAsync,
  onJoinGame = noopJoin,
  isCreatingGame = false,
  isJoining = false,
  joinError,
  onClearJoinError = noop,
}: MenuDrawerProps) {
  // Esc closes the ledger — consistent with deselect elsewhere.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open, onClose]);

  if (!open) return null;

  const handleTab = (tab: MenuTab) => {
    Haptic.light();
    onTabChange(tab);
    if (tab === 'ai' && onToggleAIReasoning) {
      onToggleAIReasoning();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Captain's ledger">
      {/* Backdrop — ink, never blur (DESIGN.md §9) */}
      <div
        className="absolute inset-0"
        style={{ background: 'color-mix(in srgb, var(--p8-ink) 78%, transparent)' }}
        onClick={onClose}
      />

      {/* Sheet: bottom on narrow tables, starboard panel on wide ones */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col max-h-[85vh] sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:max-h-none sm:w-full sm:max-w-md"
        style={{
          background: 'var(--p8-deep)',
          borderTop: 'var(--p8-hairline) solid var(--p8-brass-line)',
          boxShadow: 'var(--p8-shadow-instrument)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: 'var(--p8-space-2) var(--p8-space-3)',
            borderBottom: 'var(--p8-hairline) solid var(--p8-brass-line)',
          }}
        >
          <span
            className="p8-world"
            style={{ fontSize: 'var(--p8-fs-lg)' }}
          >
            Captain&rsquo;s Ledger
          </span>
          <button
            type="button"
            className="p8-iconbtn"
            style={{ minHeight: '36px', minWidth: '36px' }}
            onClick={() => {
              Haptic.light();
              onClose();
            }}
            aria-label="Close ledger"
          >
            <Icon name="close" size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Tabs — instrument labels with Lucide icons, active in lamp */}
        <div
          className="flex"
          style={{ borderBottom: 'var(--p8-hairline) solid var(--p8-brass-line)' }}
          role="tablist"
        >
          {TABS.map(({ id, label, icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleTab(id)}
                className="flex-1 flex items-center justify-center gap-1.5 transition-colors"
                style={{
                  padding: 'var(--p8-space-2) var(--p8-space-1)',
                  fontFamily: 'var(--p8-font-instrument)',
                  fontSize: 'var(--p8-fs-xs)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: active ? 'var(--p8-lamp)' : 'var(--p8-vellum-mute)',
                  borderBottom: active
                    ? 'calc(2 * var(--p8-u)) solid var(--p8-lamp)'
                    : 'calc(2 * var(--p8-u)) solid transparent',
                  background: 'transparent',
                  cursor: 'pointer',
                  minHeight: '44px',
                }}
              >
                <Icon name={icon} size={13} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: 'var(--p8-space-3)', paddingBottom: 'var(--p8-space-6)' }}
          role="tabpanel"
        >
          {activeTab === 'stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--p8-space-3)' }}>
              <PlayerStats
                players={gameState.players}
                currentPlayerIndex={gameState.currentPlayerIndex}
                gameStatus={gameState.gameStatus}
                decisionTimeMs={decisionTimeMs}
                scanChargesRemaining={scanChargesRemaining}
                speedBonusAccumulated={speedBonusAccumulated}
                averageDecisionTimeMs={averageDecisionTimeMs}
                scannedCoordinates={scannedCoordinates}
              />
              <BattleInfoPanel gameState={gameState} />
            </div>
          )}

          {activeTab === 'actions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--p8-space-3)' }}>
              {!isPracticeMode && (
                <ResourceCollectionPanel
                  gameState={gameState}
                  currentPlayer={currentPlayer}
                  onCollectResources={onCollectResources}
                  isMyTurn={isMyTurn}
                />
              )}
              <PirateControls
                gameState={gameState}
                onCreateGame={onCreateGame}
                onQuickStart={onQuickStart}
                onStartGame={onStartGame}
                onJoinGame={onJoinGame}
                onShipAction={onShipAction}
                onEndTurn={onEndTurn}
                isCreating={isCreatingGame}
                isJoining={isJoining}
                joinError={joinError}
                onClearJoinError={onClearJoinError}
                selectedShipId={selectedShipId || undefined}
                onShipSelect={onShipSelect}
                onScanCoordinate={onScanCoordinate}
                decisionTimeMs={decisionTimeMs}
                scanChargesRemaining={scanChargesRemaining}
                speedBonusAccumulated={speedBonusAccumulated}
                onPracticeMode={onPracticeMode}
              />
            </div>
          )}

          {activeTab === 'build' && (
            <ShipBuildingPanel
              gameState={gameState}
              currentPlayer={currentPlayer}
              onBuildShip={onBuildShip}
              isMyTurn={isMyTurn}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default MenuDrawer;
