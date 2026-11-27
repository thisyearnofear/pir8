'use client';

/**
 * PlayerStats — the standings page of the captain's ledger.
 *
 * Token-native rewrite of the neon "CAPTAIN STATUS" panel. Same information:
 * skill readouts, per-captain fleet/territory/gold/crew, dominance score,
 * fleet composition. The theater (gradient text, blur orbs, glow shadows,
 * emoji medals) is gone; rank is a mono numeral with a crown for the leader,
 * ownership is a written YOU marker, active helm is a lamp edge plus an icon —
 * never hue alone.
 */

import { Player } from '../types/game';
import { useSafeWallet } from '@/components/SafeWalletProvider';
import { Icon } from './ui/Icon';

interface PlayerStatsProps {
  players: Player[];
  currentPlayerIndex: number;
  gameStatus: 'waiting' | 'active' | 'completed';
  winner?: string;
  decisionTimeMs?: number;
  scanChargesRemaining?: number;
  speedBonusAccumulated?: number;
  averageDecisionTimeMs?: number;
  scannedCoordinates?: string[];
  isPracticeMode?: boolean;
}

function Stat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: string;
}) {
  return (
    <div className="p8-cell-row" style={{ justifyContent: 'space-between' }}>
      <span className="p8-cell-row">
        {icon}
        <span className="p8-label">{label}</span>
      </span>
      <span className={`p8-value ${tone ?? ''}`} style={{ fontSize: 'var(--p8-fs-sm)' }}>
        {value}
      </span>
    </div>
  );
}

export default function PlayerStats({
  players,
  currentPlayerIndex,
  gameStatus,
  winner,
  decisionTimeMs = 0,
  scanChargesRemaining = 3,
  speedBonusAccumulated = 0,
}: PlayerStatsProps) {
  const { publicKey } = useSafeWallet();

  const getActiveShipCount = (player: Player): number =>
    player.ships.filter((ship) => ship.health > 0).length;

  const getPlayerDisplayName = (player: Player): string => {
    if (player.username) return player.username;
    return `${player.publicKey.slice(0, 4)}…${player.publicKey.slice(-4)}`;
  };

  const getPlayerRank = (player: Player): number => {
    const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);
    return sorted.findIndex((p) => p.publicKey === player.publicKey) + 1;
  };

  const getFleetComposition = (player: Player): string => {
    const counts: Record<string, number> = {};
    player.ships.forEach((ship) => {
      if (ship.health > 0) counts[ship.type] = (counts[ship.type] || 0) + 1;
    });
    return (
      Object.entries(counts)
        .map(([type, n]) => `${n} ${type}`)
        .join(' · ') || 'fleet sunk'
    );
  };

  const sortedPlayers = [...players].sort((a, b) => getPlayerRank(a) - getPlayerRank(b));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--p8-space-3)' }}>
      {/* Skill readouts — the captain's own form this watch */}
      {gameStatus === 'active' && (
        <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--p8-space-1)' }}>
            <Stat
              label="Decision"
              icon={<Icon name="clock" size={12} className="p8-text-mute" />}
              value={`${(decisionTimeMs / 1000).toFixed(1)}s`}
            />
            <div className="p8-cell-row" style={{ justifyContent: 'space-between' }}>
              <span className="p8-cell-row">
                <Icon name="scan" size={12} className="p8-text-mute" />
                <span className="p8-label">Scan charges</span>
              </span>
              <span className="p8-cell-row" aria-label={`${scanChargesRemaining} of 3 scan charges`}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      width: 'calc(7 * var(--p8-u))',
                      height: 'calc(7 * var(--p8-u))',
                      borderRadius: '50%',
                      background:
                        i < scanChargesRemaining
                          ? 'var(--p8-signal)'
                          : 'transparent',
                      border:
                        i < scanChargesRemaining
                          ? 'none'
                          : 'var(--p8-hairline) solid var(--p8-vellum-mute)',
                    }}
                  />
                ))}
              </span>
            </div>
            <Stat
              label="Speed bonus"
              icon={<Icon name="zap" size={12} className="p8-text-mute" />}
              value={`+${speedBonusAccumulated}`}
              tone="p8-text-signal"
            />
          </div>
        </div>
      )}

      {/* Standings — one ledger entry per captain */}
      {sortedPlayers.map((player) => {
        const rank = getPlayerRank(player);
        const isActive =
          players.indexOf(player) === currentPlayerIndex && gameStatus === 'active';
        const isMe = publicKey?.toString() === player.publicKey;
        const isWinner = winner === player.publicKey;

        return (
          <div
            key={player.publicKey}
            className="p8-instrument"
            style={{
              padding: 'var(--p8-space-2)',
              borderLeft: isActive
                ? 'calc(2 * var(--p8-u)) solid var(--p8-lamp)'
                : undefined,
            }}
          >
            {/* Captain row */}
            <div className="p8-cell-row" style={{ justifyContent: 'space-between', marginBottom: 'var(--p8-space-1)' }}>
              <span className="p8-cell-row" style={{ minWidth: 0 }}>
                {rank === 1 ? (
                  <Icon name="crown" size={13} className="p8-text-lamp" label={`Rank ${rank}`} />
                ) : (
                  <span className="p8-value p8-text-mute" style={{ fontSize: 'var(--p8-fs-xs)' }}>
                    {rank}
                  </span>
                )}
                <span
                  className="p8-world"
                  style={{
                    fontSize: 'var(--p8-fs-md)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {getPlayerDisplayName(player)}
                </span>
                {isMe && (
                  <span className="p8-chip" style={{ padding: '0 calc(3 * var(--p8-u))' }}>
                    you
                  </span>
                )}
              </span>
              {isActive && (
                <span className="p8-cell-row" aria-label="currently at the helm">
                  <Icon name="compass" size={12} className="p8-text-lamp" />
                  <span className="p8-label" style={{ color: 'var(--p8-lamp)' }}>
                    helm
                  </span>
                </span>
              )}
              {isWinner && (
                <span className="p8-cell-row">
                  <Icon name="trophy" size={12} className="p8-text-lamp" />
                  <span className="p8-label" style={{ color: 'var(--p8-lamp)' }}>
                    victor
                  </span>
                </span>
              )}
            </div>

            {/* Standing rows — labels mute, numerals mono */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(3 * var(--p8-u))' }}>
              <Stat
                label="Fleet"
                icon={<Icon name="fleet" size={12} className="p8-text-signal" />}
                value={`${getActiveShipCount(player)}/${player.ships.length}`}
              />
              <Stat
                label="Territory"
                icon={<Icon name="claim" size={12} className="p8-text-mute" />}
                value={player.controlledTerritories.length}
              />
              <Stat
                label="Gold"
                icon={<Icon name="gold" size={12} className="p8-text-mute" />}
                value={player.resources.gold.toLocaleString()}
              />
              <Stat
                label="Crew"
                icon={<Icon name="crew" size={12} className="p8-text-mute" />}
                value={player.resources.crew}
              />
              <Stat
                label="Score"
                icon={<Icon name="trophy" size={12} className="p8-text-lamp" />}
                value={player.totalScore}
                tone="p8-text-lamp"
              />
              <div
                className="p8-text-mute"
                style={{
                  fontSize: 'var(--p8-fs-xs)',
                  fontFamily: 'var(--p8-font-ui)',
                  paddingTop: 'calc(2 * var(--p8-u))',
                  borderTop: 'var(--p8-hairline) solid var(--p8-brass-line)',
                }}
              >
                {getFleetComposition(player)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
