"use client";

import { useEffect, useRef, useState } from "react";
import PirateMap from "@/components/PirateMap";
import type {
  BattleMomentPublicEvent,
  BattleMomentReplay,
  BattleMomentSnapshot,
} from "@/lib/battleMoments";
import type { GameMap, Ship } from "@/types/game";

// ─── helpers ────────────────────────────────────────────────────────────────

function snapshotToRenderState(snapshot: BattleMomentSnapshot): {
  gameMap: GameMap;
  ships: Ship[];
  players: Array<{ publicKey: string; username?: string }>;
} {
  const ships: Ship[] = snapshot.players.flatMap((player) =>
    player.ships.map((ship) => ({
      ...ship,
      resources: { gold: 0, crew: 0, cannons: 0, supplies: 0, wood: 0, rum: 0 },
      ability: {
        name: "Replay",
        description: "Replay artifact",
        cooldown: 0,
        currentCooldown: 0,
        isReady: false,
        type: "utility" as const,
      },
      activeEffects: [],
    })),
  );

  const maxCoordinate = snapshot.cells.reduce((max, cell) => {
    const parts = cell.coordinate.split(",");
    const x = Number(parts[0] || 0);
    const y = Number(parts[1] || 0);
    return Math.max(max, x + 1, y + 1);
  }, 10);

  return {
    gameMap: {
      size: maxCoordinate,
      cells: Array.from({ length: maxCoordinate }, (_, y) =>
        Array.from({ length: maxCoordinate }, (_, x) => {
          const coordinate = `${x},${y}`;
          const cell = snapshot.cells.find((c) => c.coordinate === coordinate);
          return {
            coordinate,
            type: cell?.type || "water",
            owner: cell?.owner || null,
            resources: {},
            isContested: cell?.isContested || false,
          };
        }),
      ),
    },
    ships,
    players: snapshot.players.map((p) => ({
      publicKey: p.publicKey,
      username: p.username,
    })),
  };
}

function eventIcon(event: BattleMomentPublicEvent): string {
  switch (event.type) {
    case "scan_reveal": return "🔭";
    case "ambush_reveal": return "💥";
    case "ship_destroyed": return "💀";
    case "territory_claimed": return "🏴";
    case "victory": return "🏆";
    default: return "⚓";
  }
}

// Animation steps: before → one step per public event → after
type ReplayStep =
  | { kind: "before" }
  | { kind: "event"; index: number; event: BattleMomentPublicEvent }
  | { kind: "after" };

function buildSteps(moment: BattleMomentReplay): ReplayStep[] {
  const steps: ReplayStep[] = [{ kind: "before" }];
  moment.publicEvents.forEach((event, index) => {
    steps.push({ kind: "event", index, event });
  });
  steps.push({ kind: "after" });
  return steps;
}

// ─── component ──────────────────────────────────────────────────────────────

export default function BattleMomentReplayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [moment, setMoment] = useState<BattleMomentReplay | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { id } = await params;
        const response = await fetch(`/api/moments/${id}`);
        if (!response.ok) throw new Error("Replay not found");
        const data = (await response.json()) as BattleMomentReplay;
        if (mounted) setMoment(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load replay");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [params]);

  const steps = moment ? buildSteps(moment) : [];
  const totalSteps = steps.length;
  const currentStep = steps[stepIndex] ?? { kind: "before" as const };

  useEffect(() => {
    if (!playing || totalSteps === 0) return;
    intervalRef.current = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= totalSteps - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1400);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, totalSteps]);

  if (loading) return <div className="replay-shell">Loading replay…</div>;
  if (error || !moment) return <div className="replay-shell">{error || "Replay unavailable"}</div>;

  const snapshot = currentStep.kind === "before" ? moment.before : moment.after;
  const renderState = snapshotToRenderState(snapshot);

  function handlePlay() {
    if (stepIndex >= totalSteps - 1) setStepIndex(0);
    setPlaying(true);
  }

  function handlePause() {
    setPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  return (
    <main className="replay-shell">
      <section className="replay-card">
        <p className="replay-kicker">Battle moment replay</p>
        <h1 className="replay-title">{moment.title}</h1>
        <p className="replay-summary">{moment.summary}</p>
        <div className="replay-meta">
          <span>Game {moment.gameId}</span>
          <span>Turn {moment.turnNumber}</span>
          <span>{moment.type.replace(/_/g, " ")}</span>
        </div>
      </section>

      {/* Playback controls */}
      <section className="replay-controls">
        <button
          className="replay-btn"
          onClick={() => { setPlaying(false); setStepIndex((p) => Math.max(0, p - 1)); }}
          disabled={stepIndex === 0}
          aria-label="Step back"
        >
          ◀
        </button>
        {playing ? (
          <button className="replay-btn replay-btn--primary" onClick={handlePause} aria-label="Pause">
            ⏸ Pause
          </button>
        ) : (
          <button className="replay-btn replay-btn--primary" onClick={handlePlay} aria-label="Play">
            ▶ Play
          </button>
        )}
        <button
          className="replay-btn"
          onClick={() => { setPlaying(false); setStepIndex((p) => Math.min(totalSteps - 1, p + 1)); }}
          disabled={stepIndex >= totalSteps - 1}
          aria-label="Step forward"
        >
          ▶▶
        </button>
        <span className="replay-step-counter">{stepIndex + 1} / {totalSteps}</span>
      </section>

      {/* Current step label */}
      <section className="replay-step-label">
        {currentStep.kind === "before" && (
          <p className="replay-phase replay-phase--before">⚓ Before — turn {moment.before.turnNumber}</p>
        )}
        {currentStep.kind === "event" && (
          <p className="replay-phase replay-phase--event">
            {eventIcon(currentStep.event)} {currentStep.event.type.replace(/_/g, " ")} — {currentStep.event.description}
          </p>
        )}
        {currentStep.kind === "after" && (
          <p className="replay-phase replay-phase--after">✅ After — turn {moment.after.turnNumber}</p>
        )}
      </section>

      <section className="replay-grid">
        <div className="replay-map-card">
          <PirateMap
            gameMap={renderState.gameMap}
            ships={renderState.ships}
            players={renderState.players}
            onCellSelect={() => {}}
            isMyTurn={false}
            currentPlayerPK={moment.actingPlayer}
            spectatorMode="omniscient"
          />
        </div>

        <aside className="replay-sidebar">
          <div className="replay-panel">
            <h2>Public events</h2>
            <ul>
              {moment.publicEvents.map((event, index) => (
                <li
                  key={`${event.type}-${index}`}
                  className={
                    currentStep.kind === "event" && currentStep.index === index
                      ? "replay-event replay-event--active"
                      : "replay-event"
                  }
                >
                  <strong>{eventIcon(event)} {event.type.replace(/_/g, " ")}</strong>
                  <p>{event.description}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="replay-panel">
            <h2>Reveal state</h2>
            <p>Newly visible: {moment.revealMetadata.becameVisibleCoordinates.length}</p>
            <p>Stale intel: {moment.revealMetadata.staleCoordinates.length}</p>
            <p>Still hidden: {moment.revealMetadata.hiddenCoordinates.length}</p>
          </div>

          <div className="replay-panel">
            <h2>Snapshot diff</h2>
            {moment.before.players.map((beforePlayer) => {
              const afterPlayer = moment.after.players.find(
                (p) => p.publicKey === beforePlayer.publicKey,
              );
              if (!afterPlayer) return null;
              const shipsBefore = beforePlayer.ships.length;
              const shipsAfter = afterPlayer.ships.length;
              const terrBefore = beforePlayer.controlledTerritories.length;
              const terrAfter = afterPlayer.controlledTerritories.length;
              return (
                <div key={beforePlayer.publicKey} className="replay-diff-row">
                  <strong>{beforePlayer.username || beforePlayer.publicKey.slice(0, 8)}</strong>
                  <span>Ships: {shipsBefore}→{shipsAfter}{shipsAfter < shipsBefore ? " 💀" : ""}</span>
                  <span>Territories: {terrBefore}→{terrAfter}{terrAfter > terrBefore ? " 🏴" : ""}</span>
                </div>
              );
            })}
          </div>
        </aside>
      </section>
    </main>
  );
}
