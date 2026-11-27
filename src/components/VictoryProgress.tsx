'use client';

import { useMemo } from "react";
import { GameBalance } from "@/lib/gameBalance";
import type { GameState, Player } from "@/types/game";
import { Icon, type IconName } from "./ui/Icon";

interface VictoryProgressProps {
  gameState: GameState;
  currentPlayer: Player | null;
}

/**
 * VictoryProgress — all three win conditions, live, in one strip.
 *
 * Every turn should read as a decision, so the HUD answers the only three
 * questions that matter: how close am I to each path to glory? Shares math
 * with GameBalance.checkVictoryConditions (same numerators, same
 * thresholds) so the bars and the actual wins can never disagree.
 */
export default function VictoryProgress({
  gameState,
  currentPlayer,
}: VictoryProgressProps) {
  const paths = useMemo(() => {
    if (!gameState?.players || !currentPlayer) return null;

    const { territoryControlThreshold, fleetDominanceThreshold, resourceDominanceThreshold } =
      GameBalance.VICTORY_CONDITIONS;

    const playerTerritory = GameBalance.calculateTerritoryScore(
      currentPlayer.controlledTerritories,
      gameState.gameMap,
    );
    const totalTerritory = gameState.players.reduce(
      (total, p) =>
        total + GameBalance.calculateTerritoryScore(p.controlledTerritories, gameState.gameMap),
      0,
    );

    const playerFleet = GameBalance.calculateFleetPower(currentPlayer.ships);
    const totalFleet = gameState.players.reduce(
      (total, p) => total + GameBalance.calculateFleetPower(p.ships),
      0,
    );

    const playerRiches = GameBalance.calculateResourceValue(currentPlayer.resources);

    return [
      {
        id: "territory",
        label: "Territory",
        icon: "claim" as IconName,
        ratio: totalTerritory > 0 ? playerTerritory / totalTerritory : 0,
        goal: territoryControlThreshold,
        goalLabel: `${Math.round(territoryControlThreshold * 100)}%`,
      },
      {
        id: "fleet",
        label: "Supremacy",
        icon: "attack" as IconName,
        ratio: totalFleet > 0 ? playerFleet / totalFleet : 0,
        goal: fleetDominanceThreshold,
        goalLabel: `${Math.round(fleetDominanceThreshold * 100)}%`,
      },
      {
        id: "riches",
        label: "Riches",
        icon: "gold" as IconName,
        ratio: Math.min(1, playerRiches / resourceDominanceThreshold),
        goal: 1,
        goalLabel: `${Math.round(resourceDominanceThreshold / 1000)}k`,
      },
    ];
  }, [gameState, currentPlayer]);

  if (!paths) return null;

  let leaderId: string | null = null;
  let leaderRatio = -1;
  for (const p of paths) {
    if (p.ratio > leaderRatio) {
      leaderRatio = p.ratio;
      leaderId = p.id;
    }
  }

  return (
    <div
      role="status"
      aria-label="Victory progress"
      className="mb-3 grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2"
    >
      {paths.map((p) => {
        const pct = Math.round(Math.min(1, p.ratio / p.goal) * 100);
        const isLeader = p.id === leaderId && p.ratio > 0;
        return (
          <div key={p.id} className="min-w-0">
            <div className="mb-1 flex items-center justify-between gap-1 text-[11px] font-bold uppercase tracking-[0.14em]">
              <span
                className={
                  isLeader ? "text-amber-200" : "text-slate-300"
                }
              >
                <Icon name={p.icon} size={12} /> {p.label}
              </span>
              <span className="font-mono text-slate-400">
                {Math.round(p.ratio * 100)}%<span className="text-slate-600">/{p.goalLabel}</span>
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${p.label} victory progress`}
              className="h-1.5 overflow-hidden rounded-full bg-slate-700/60"
            >
              <div
                className={`h-full rounded-full transition-all ${
                  isLeader ? "bg-amber-300" : "bg-cyan-300/70"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
