"use client";

import { useEffect, useState } from "react";
import PirateMap from "@/components/PirateMap";
import type { BattleMomentReplay } from "@/lib/battleMoments";
import type { GameMap, Ship } from "@/types/game";

function toReplayState(moment: BattleMomentReplay): {
  gameMap: GameMap;
  ships: Ship[];
  players: Array<{ publicKey: string; username?: string }>;
} {
  const ships: Ship[] = moment.after.players.flatMap((player) =>
    player.ships.map((ship) => ({
      ...ship,
      resources: {
        gold: 0,
        crew: 0,
        cannons: 0,
        supplies: 0,
        wood: 0,
        rum: 0,
      },
      ability: {
        name: "Replay",
        description: "Replay artifact",
        cooldown: 0,
        currentCooldown: 0,
        isReady: false,
        type: "utility",
      },
      activeEffects: [],
    })),
  );

  const maxCoordinate = moment.after.cells.reduce((max, cell) => {
    const coordinateParts = cell.coordinate.split(",");
    const x = Number(coordinateParts[0] || 0);
    const y = Number(coordinateParts[1] || 0);
    return Math.max(max, x + 1, y + 1);
  }, 10);

  return {
    gameMap: {
      size: maxCoordinate,
      cells: Array.from({ length: maxCoordinate }, (_, y) =>
        Array.from({ length: maxCoordinate }, (_, x) => {
          const coordinate = `${x},${y}`;
          const cell = moment.after.cells.find((entry) => entry.coordinate === coordinate);
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
    players: moment.after.players.map((player) => ({
      publicKey: player.publicKey,
      username: player.username,
    })),
  };
}

export default function BattleMomentReplayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [moment, setMoment] = useState<BattleMomentReplay | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { id } = await params;
        const response = await fetch(`/api/moments/${id}`);
        if (!response.ok) {
          throw new Error("Replay not found");
        }
        const data = (await response.json()) as BattleMomentReplay;
        if (mounted) {
          setMoment(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load replay");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [params]);

  if (loading) {
    return <div className="replay-shell">Loading replay…</div>;
  }

  if (error || !moment) {
    return <div className="replay-shell">{error || "Replay unavailable"}</div>;
  }

  const replayState = toReplayState(moment);

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

      <section className="replay-grid">
        <div className="replay-map-card">
          <PirateMap
            gameMap={replayState.gameMap}
            ships={replayState.ships}
            players={replayState.players}
            onCellSelect={() => {}}
            isMyTurn={false}
            currentPlayerPK={moment.actingPlayer}
          />
        </div>

        <aside className="replay-sidebar">
          <div className="replay-panel">
            <h2>Public events</h2>
            <ul>
              {moment.publicEvents.map((event, index) => (
                <li key={`${event.type}-${index}`}>
                  <strong>{event.type.replace(/_/g, " ")}</strong>
                  <p>{event.description}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="replay-panel">
            <h2>Reveal state</h2>
            <p>
              Newly visible: {moment.revealMetadata.becameVisibleCoordinates.length}
            </p>
            <p>Stale intel: {moment.revealMetadata.staleCoordinates.length}</p>
            <p>Still hidden: {moment.revealMetadata.hiddenCoordinates.length}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
