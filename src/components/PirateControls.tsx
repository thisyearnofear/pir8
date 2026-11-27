'use client';

/**
 * PirateControls — the actions page of the captain's ledger.
 *
 * Token-native rewrite of the neon control panel. What changed beyond the
 * surface:
 *
 * - Duplicated readouts removed. Turn state lives in the instrument strip,
 *   weather/battlefield in the conditions ledger, skill metrics in the
 *   standings ledger, End Turn on the action rail's lever. This panel is
 *   for acting: fleet selection, ship orders, scanning, weather rites.
 * - The broken build section removed — both buttons passed the literal
 *   string 'build' as a ship id, and the drawer's build tab already owns
 *   shipbuilding.
 * - The neon coordinate-scan grid is kept but wired for real (it was a
 *   placebo bound to a noop) and restyled.
 * - Pre-game and crew-assembly states keep their theatre in world type and
 *   brass rather than emoji and glow.
 */

import { useState } from 'react';
import { useSafeWallet } from '@/components/SafeWalletProvider';
import WeatherControl from './WeatherControl';
import { Ship, GameState, Player, ShipType } from '../types/game';
import { Icon, type IconName } from './ui/Icon';

interface PirateControlsProps {
  gameState: GameState | null;
  onCreateGame: () => void;
  onQuickStart: () => void;
  onStartGame?: () => void;
  onJoinGame: (gameId: string) => Promise<boolean>;
  onShipAction: (shipId: string, action: 'move' | 'attack' | 'claim' | 'collect' | 'build') => void;
  onEndTurn: () => void;
  isCreating: boolean;
  isJoining: boolean;
  joinError?: string;
  onClearJoinError: () => void;
  selectedShipId?: string;
  onShipSelect: (shipId: string | null) => void;
  onScanCoordinate?: (x: number, y: number) => Promise<void>;
  decisionTimeMs?: number;
  scanChargesRemaining?: number;
  speedBonusAccumulated?: number;
  onPracticeMode?: () => void;
  isPracticeMode?: boolean;
}

const SHIP_ICON: Record<ShipType, IconName> = {
  sloop: 'ship-scout',
  frigate: 'ship',
  galleon: 'ship-heavy',
  flagship: 'ship-heavy',
};

export default function PirateControls({
  gameState,
  onCreateGame,
  onQuickStart,
  onStartGame,
  onJoinGame,
  onShipAction,
  isCreating,
  isJoining,
  joinError,
  onClearJoinError,
  selectedShipId,
  onShipSelect,
  onScanCoordinate,
  scanChargesRemaining = 3,
  onPracticeMode,
}: PirateControlsProps) {
  const { publicKey } = useSafeWallet();
  const [gameIdInput, setGameIdInput] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [selectedCoordinate, setSelectedCoordinate] = useState<{ x: number; y: number } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const getCurrentPlayer = (): Player | null => {
    if (!gameState) return null;
    if (publicKey) {
      const mine = gameState.players.find(p => p.publicKey === publicKey.toString());
      if (mine) return mine;
    }
    // Practice guests have no wallet: the human is the non-AI player.
    return gameState.players.find(p => !p.publicKey.startsWith('AI_')) ?? null;
  };

  const getMyShips = (): Ship[] => {
    const currentPlayer = getCurrentPlayer();
    return currentPlayer?.ships.filter(ship => ship.health > 0) || [];
  };

  const isMyTurn = (): boolean => {
    if (!gameState) return false;
    const active = gameState.players[gameState.currentPlayerIndex];
    const me = getCurrentPlayer();
    return !!active && !!me && active.publicKey === me.publicKey;
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameIdInput.trim()) return;
    const success = await onJoinGame(gameIdInput.trim());
    if (success) {
      setGameIdInput('');
      setShowJoinForm(false);
    }
  };

  const handleScan = async () => {
    if (!selectedCoordinate || scanChargesRemaining <= 0 || !onScanCoordinate) return;
    setIsScanning(true);
    try {
      await onScanCoordinate(selectedCoordinate.x, selectedCoordinate.y);
      setSelectedCoordinate(null);
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCopyGameId = () => {
    if (!gameState?.gameId) return;
    navigator.clipboard.writeText(gameState.gameId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ------------------------------ pre-game ------------------------------ */

  const renderPreGameControls = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--p8-space-3)' }}>
      <div className="p8-instrument" style={{ padding: 'var(--p8-space-3)', textAlign: 'center' }}>
        <h3
          className="p8-world"
          style={{ fontSize: 'var(--p8-fs-lg)', marginBottom: 'var(--p8-space-1)' }}
        >
          Prepare for battle
        </h3>
        <p
          className="p8-text-dim"
          style={{ fontSize: 'var(--p8-fs-sm)', fontFamily: 'var(--p8-font-ui)' }}
        >
          Command your fleet in strategic naval warfare
        </p>
      </div>

      {publicKey ? (
        <>
          <button onClick={onCreateGame} disabled={isCreating} className="p8-lever" style={{ width: '100%' }}>
            <Icon name="attack" size={15} />
            {isCreating ? 'Creating arena…' : 'Create new battle'}
            <span className="p8-label" style={{ color: 'color-mix(in srgb, var(--p8-ink) 70%, transparent)' }}>
              0.1 SOL
            </span>
          </button>

          {!showJoinForm ? (
            <button onClick={() => setShowJoinForm(true)} className="p8-btn" style={{ width: '100%' }}>
              <Icon name="navigation" size={14} />
              Join existing battle
            </button>
          ) : (
            <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)' }}>
              <span className="p8-label">Join battle arena</span>
              <form
                onSubmit={handleJoinSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--p8-space-2)', marginTop: 'var(--p8-space-1)' }}
              >
                <input
                  type="text"
                  value={gameIdInput}
                  onChange={(e) => setGameIdInput(e.target.value)}
                  placeholder="Enter game id…"
                  className="p8-input"
                  aria-label="Game id"
                />
                <div style={{ display: 'flex', gap: 'var(--p8-space-1)' }}>
                  <button
                    type="submit"
                    disabled={isJoining || !gameIdInput.trim()}
                    className="p8-btn"
                    style={{ flex: 1 }}
                  >
                    <Icon name="anchor" size={14} />
                    {isJoining ? 'Joining…' : 'Join (0.1 SOL)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinForm(false);
                      setGameIdInput('');
                      onClearJoinError();
                    }}
                    className="p8-btn"
                    aria-label="Cancel join"
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
              </form>
            </div>
          )}

          {joinError && (
            <div
              className="p8-instrument"
              style={{
                padding: 'var(--p8-space-2)',
                borderColor: 'color-mix(in srgb, var(--p8-threat) 55%, transparent)',
              }}
              role="alert"
            >
              <div className="p8-cell-row">
                <Icon name="skull" size={14} className="p8-text-threat" />
                <span className="p8-label" style={{ color: 'var(--p8-threat)' }}>
                  Battle join failed
                </span>
              </div>
              <p
                className="p8-text-dim"
                style={{ fontSize: 'var(--p8-fs-xs)', fontFamily: 'var(--p8-font-ui)', marginTop: 'calc(3 * var(--p8-u))' }}
              >
                {joinError}
              </p>
            </div>
          )}

          <button onClick={onPracticeMode} className="p8-btn" style={{ width: '100%' }}>
            <Icon name="target" size={14} />
            Practice mode
            <span className="p8-label">no wallet required</span>
          </button>
        </>
      ) : (
        <>
          <button onClick={onPracticeMode} className="p8-lever" style={{ width: '100%' }}>
            <Icon name="target" size={15} />
            Try practice mode
            <span className="p8-label" style={{ color: 'color-mix(in srgb, var(--p8-ink) 70%, transparent)' }}>
              vs AI
            </span>
          </button>
          <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)', textAlign: 'center' }}>
            <span className="p8-label">Ready for real battles?</span>
            <p
              className="p8-text-dim"
              style={{ fontSize: 'var(--p8-fs-xs)', fontFamily: 'var(--p8-font-ui)', marginTop: 'calc(3 * var(--p8-u))' }}
            >
              Connect a wallet to compete for SOL rewards
            </p>
          </div>
        </>
      )}
    </div>
  );

  /* ------------------------------ waiting ------------------------------- */

  const renderWaitingControls = () => {
    const playerCount = gameState?.players.length || 0;
    const maxPlayers = 4;
    const crewPercentage = Math.round((playerCount / maxPlayers) * 100);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--p8-space-3)' }}>
        <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)' }}>
          <div className="p8-cell-row" style={{ justifyContent: 'space-between', marginBottom: 'var(--p8-space-1)' }}>
            <span className="p8-label">Battle roster</span>
            <span className="p8-value" style={{ fontSize: 'var(--p8-fs-md)' }}>
              {playerCount}/{maxPlayers}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={playerCount}
            aria-valuemin={0}
            aria-valuemax={maxPlayers}
            aria-label={`${playerCount} of ${maxPlayers} captains assembled`}
            style={{
              height: 'calc(6 * var(--p8-u))',
              borderRadius: 'calc(3 * var(--p8-u))',
              background: 'var(--p8-ink)',
              border: 'var(--p8-hairline) solid var(--p8-brass-line)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${crewPercentage}%`,
                background: 'var(--p8-brass)',
                transition: 'width 400ms ease',
              }}
            />
          </div>
          <p
            className="p8-text-dim"
            style={{ fontSize: 'var(--p8-fs-xs)', fontFamily: 'var(--p8-font-ui)', marginTop: 'var(--p8-space-1)' }}
          >
            {playerCount < 2 && `Awaiting crew — ${2 - playerCount} more pirate${2 - playerCount > 1 ? 's' : ''} needed`}
            {playerCount === 2 && 'Battle ready — two pirates detected'}
            {playerCount === 3 && 'Forming alliance…'}
            {playerCount >= 4 && 'Full crew assembled'}
          </p>
        </div>

        <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)' }}>
          <span className="p8-label">Share this game id</span>
          <div
            className="p8-value"
            style={{
              fontSize: 'var(--p8-fs-xs)',
              wordBreak: 'break-all',
              marginTop: 'calc(3 * var(--p8-u))',
              padding: 'calc(4 * var(--p8-u))',
              background: 'var(--p8-ink)',
              borderRadius: 'var(--p8-radius)',
            }}
          >
            {gameState?.gameId}
          </div>
          <button onClick={handleCopyGameId} className="p8-btn" style={{ width: '100%', marginTop: 'var(--p8-space-1)' }}>
            <Icon name={copied ? 'check' : 'box'} size={13} />
            {copied ? 'Copied' : 'Copy game id'}
          </button>
        </div>

        {gameState && gameState.players.length > 0 && (
          <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)' }}>
            <span className="p8-label">Joining battle</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(3 * var(--p8-u))', marginTop: 'var(--p8-space-1)' }}>
              {gameState.players.map((player, index) => (
                <div key={index} className="p8-cell-row" style={{ justifyContent: 'space-between' }}>
                  <span className="p8-cell-row" style={{ minWidth: 0 }}>
                    <span
                      aria-hidden
                      style={{
                        width: 'calc(6 * var(--p8-u))',
                        height: 'calc(6 * var(--p8-u))',
                        borderRadius: '50%',
                        background: player.isActive ? 'var(--p8-signal)' : 'var(--p8-vellum-mute)',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      className="p8-text-dim"
                      style={{
                        fontSize: 'var(--p8-fs-sm)',
                        fontFamily: 'var(--p8-font-ui)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {player.username || 'Captain'}
                    </span>
                  </span>
                  <span className="p8-cell-row">
                    <Icon name="ship" size={11} className="p8-text-mute" />
                    <span className="p8-value" style={{ fontSize: 'var(--p8-fs-xs)' }}>
                      {player.ships.length}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {gameState && gameState.players.length >= 2 && (
          <button
            onClick={onStartGame || onQuickStart}
            disabled={isCreating}
            className="p8-lever"
            style={{ width: '100%' }}
          >
            <Icon name="zap" size={15} />
            {isCreating ? 'Launching…' : 'Hoist the colors!'}
          </button>
        )}
      </div>
    );
  };

  /* ---------------------------- fleet + orders --------------------------- */

  const renderShipSelection = () => {
    const myShips = getMyShips();

    return (
      <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)' }}>
        <span className="p8-label">Your fleet</span>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--p8-space-1)',
            marginTop: 'var(--p8-space-1)',
          }}
        >
          {myShips.map(ship => {
            const selected = selectedShipId === ship.id;
            return (
              <button
                key={ship.id}
                onClick={() => onShipSelect(selected ? null : ship.id)}
                aria-pressed={selected}
                style={{
                  padding: 'var(--p8-space-1)',
                  borderRadius: 'var(--p8-radius)',
                  border: `${selected ? 'calc(1.5 * var(--p8-u))' : 'var(--p8-hairline)'} solid ${
                    selected ? 'var(--p8-lamp)' : 'var(--p8-brass-line)'
                  }`,
                  background: selected
                    ? 'color-mix(in srgb, var(--p8-lamp) 10%, var(--p8-depth))'
                    : 'color-mix(in srgb, var(--p8-brass) 8%, var(--p8-depth))',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 120ms ease, background 120ms ease',
                }}
              >
                <div className="p8-cell-row" style={{ justifyContent: 'space-between' }}>
                  <Icon name={SHIP_ICON[ship.type]} size={14} className={selected ? 'p8-text-lamp' : 'p8-text-dim'} />
                  <span className="p8-value" style={{ fontSize: 'var(--p8-fs-xs)' }}>
                    {ship.health}/{ship.maxHealth}
                  </span>
                </div>
                <div
                  className="p8-label"
                  style={{ marginTop: 'calc(2 * var(--p8-u))' }}
                >
                  {ship.type}
                </div>
                <div
                  aria-hidden
                  style={{
                    height: 'calc(3 * var(--p8-u))',
                    borderRadius: 'calc(1.5 * var(--p8-u))',
                    background: 'var(--p8-ink)',
                    marginTop: 'calc(3 * var(--p8-u))',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(ship.health / ship.maxHealth) * 100}%`,
                      background: 'var(--p8-signal)',
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
        {myShips.length === 0 && (
          <p
            className="p8-text-mute"
            style={{ fontSize: 'var(--p8-fs-xs)', fontFamily: 'var(--p8-font-ui)', marginTop: 'var(--p8-space-1)' }}
          >
            No ships afloat.
          </p>
        )}
      </div>
    );
  };

  const renderActionControls = () => {
    if (!selectedShipId) {
      return (
        <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)', textAlign: 'center' }}>
          <p className="p8-text-dim" style={{ fontSize: 'var(--p8-fs-sm)', fontFamily: 'var(--p8-font-ui)' }}>
            Select a ship to issue orders
          </p>
        </div>
      );
    }

    const selectedShip = getCurrentPlayer()?.ships.find(s => s.id === selectedShipId);

    const actions: Array<{ action: 'move' | 'attack' | 'claim' | 'collect'; icon: IconName; label: string; title: string; threat?: boolean }> = [
      { action: 'move', icon: 'move', label: 'Move', title: 'Move to an adjacent coordinate' },
      { action: 'attack', icon: 'attack', label: 'Attack', title: 'Attack adjacent enemy ships', threat: true },
      { action: 'claim', icon: 'claim', label: 'Claim', title: 'Claim current territory' },
      { action: 'collect', icon: 'collect', label: 'Collect', title: 'Collect resources from controlled territory' },
    ];

    return (
      <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)' }}>
        <div className="p8-cell-row" style={{ justifyContent: 'space-between', marginBottom: 'var(--p8-space-1)' }}>
          <span className="p8-label">Ship orders</span>
          {selectedShip && (
            <span className="p8-value p8-text-dim" style={{ fontSize: 'var(--p8-fs-xs)' }}>
              {selectedShip.type} · {selectedShip.health}/{selectedShip.maxHealth} hp
            </span>
          )}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--p8-space-1)',
          }}
        >
          {actions.map(({ action, icon, label, title, threat }) => (
            <button
              key={action}
              onClick={() => onShipAction(selectedShipId, action)}
              title={title}
              className={`p8-btn ${threat ? 'p8-btn-threat' : ''}`}
            >
              <Icon name={icon} size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderScanSection = () => {
    if (scanChargesRemaining <= 0 || !onScanCoordinate) return null;
    const size = gameState?.gameMap.size || 7;

    return (
      <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)' }}>
        <button
          onClick={() => setScanOpen(!scanOpen)}
          aria-expanded={scanOpen}
          className="p8-cell-row"
          style={{
            width: '100%',
            justifyContent: 'space-between',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span className="p8-cell-row">
            <Icon name="scan" size={13} className="p8-text-dim" />
            <span className="p8-label">Scan coordinate</span>
            <span className="p8-chip" style={{ padding: '0 calc(3 * var(--p8-u))' }}>
              {scanChargesRemaining} left
            </span>
          </span>
          <span style={{ display: 'inline-flex', transform: scanOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }}>
            <Icon name="chevron-down" size={13} className="p8-text-mute" />
          </span>
        </button>

        {scanOpen && (
          <div style={{ marginTop: 'var(--p8-space-2)' }}>
            <p
              className="p8-text-dim"
              style={{ fontSize: 'var(--p8-fs-xs)', fontFamily: 'var(--p8-font-ui)', marginBottom: 'var(--p8-space-1)' }}
            >
              Reveal a coordinate&apos;s terrain without claiming it:
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
                gap: 'calc(2 * var(--p8-u))',
                marginBottom: 'var(--p8-space-1)',
              }}
            >
              {Array.from({ length: size }).map((_, x) =>
                Array.from({ length: size }).map((_, y) => {
                  const sel = selectedCoordinate?.x === x && selectedCoordinate?.y === y;
                  return (
                    <button
                      key={`${x}-${y}`}
                      onClick={() => setSelectedCoordinate({ x, y })}
                      disabled={scanChargesRemaining <= 0 || !isMyTurn()}
                      title={`Scan coordinate (${x}, ${y})`}
                      className="p8-value"
                      style={{
                        padding: 'calc(3 * var(--p8-u)) 0',
                        fontSize: 'var(--p8-fs-xs)',
                        borderRadius: 'calc(2 * var(--p8-u))',
                        border: `var(--p8-hairline) solid ${sel ? 'var(--p8-lamp)' : 'var(--p8-brass-line)'}`,
                        background: sel
                          ? 'color-mix(in srgb, var(--p8-lamp) 15%, var(--p8-depth))'
                          : 'var(--p8-ink)',
                        color: sel ? 'var(--p8-lamp)' : 'var(--p8-vellum-dim)',
                        cursor: 'pointer',
                      }}
                    >
                      {x},{y}
                    </button>
                  );
                })
              )}
            </div>
            <button
              onClick={handleScan}
              disabled={!selectedCoordinate || scanChargesRemaining <= 0 || isScanning}
              className="p8-btn"
              style={{ width: '100%' }}
            >
              <Icon name="scan" size={13} />
              {isScanning
                ? 'Scanning…'
                : selectedCoordinate
                  ? `Execute scan (${selectedCoordinate.x}, ${selectedCoordinate.y})`
                  : 'Execute scan'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderGameControls = () => {
    if (!isMyTurn()) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--p8-space-3)' }}>
          {renderShipSelection()}
          <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)', textAlign: 'center' }}>
            <div className="p8-cell-row" style={{ justifyContent: 'center' }}>
              <Icon name="hourglass" size={13} className="p8-text-mute" />
              <span className="p8-text-dim" style={{ fontSize: 'var(--p8-fs-sm)', fontFamily: 'var(--p8-font-ui)' }}>
                Awaiting your watch — orders unlock at the helm
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--p8-space-3)' }}>
        {renderShipSelection()}
        {renderActionControls()}
        {renderScanSection()}

        {/* Weather rites — VRF oracle control, self-gates to on-chain games */}
        {gameState?.gameId && (
          <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)' }}>
            <span className="p8-label">Weather rites</span>
            <WeatherControl gameId={gameState.gameId} />
          </div>
        )}
      </div>
    );
  };

  /* -------------------------------- root -------------------------------- */

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--p8-space-3)' }}>
      {!gameState && renderPreGameControls()}
      {gameState?.gameStatus === 'waiting' && renderWaitingControls()}
      {gameState?.gameStatus === 'active' && renderGameControls()}

      {gameState?.gameStatus === 'completed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--p8-space-3)' }}>
          <div className="p8-instrument" style={{ padding: 'var(--p8-space-3)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--p8-space-1)' }}>
              <Icon name="trophy" size={20} className="p8-text-lamp" />
            </div>
            <h3 className="p8-world" style={{ fontSize: 'var(--p8-fs-lg)' }}>
              Battle complete
            </h3>
            {gameState.winner && (
              <p
                className="p8-text-dim"
                style={{ fontSize: 'var(--p8-fs-sm)', fontFamily: 'var(--p8-font-ui)', marginTop: 'var(--p8-space-1)' }}
              >
                Victory belongs to{' '}
                {gameState.players.find(p => p.publicKey === gameState.winner)?.username || 'an unknown captain'}
              </p>
            )}
          </div>
          <button onClick={onCreateGame} className="p8-lever" style={{ width: '100%' }}>
            <Icon name="attack" size={15} />
            Start new battle
          </button>
        </div>
      )}
    </div>
  );
}
