"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface WatchState {
  runId: string;
  agentName?: string;
  status?: string;
  turnNumber?: number;
  moves?: number;
  finished?: boolean;
  winner?: string | null;
  agentWon?: boolean;
  score?: number;
  gold?: number;
  yourShips?: Array<{ id: string; type: string; health: number; x: number; y: number }>;
  enemyShips?: Array<{ id: string; type: string; health: number; x: number; y: number }>;
  lastMessage?: string;
  error?: string;
}

export default function WatchRunPage() {
  const params = useParams<{ runId: string }>();
  const runId = params?.runId || "";
  const [state, setState] = useState<WatchState | null>(null);
  const [note, setNote] = useState("Setting sail…");

  useEffect(() => {
    if (!runId) return;
    let alive = true;
    async function poll() {
      try {
        const res = await fetch(`/api/byte/state?runId=${encodeURIComponent(runId)}`, {
          cache: "no-store",
        });
        const json = (await res.json()) as WatchState;
        if (!alive) return;
        if (res.ok) {
          setState(json);
          setNote(json.finished ? "Skirmish complete." : `Turn ${json.turnNumber} · Move ${json.moves}`);
        } else {
          setNote(json.error || "Run not found.");
        }
      } catch {
        if (alive) setNote("Waiting for the run… (retrying)");
      }
    }
    poll();
    const t = setInterval(poll, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [runId]);

  const cells: Record<string, string> = {};
  state?.yourShips?.forEach((s: { x: number; y: number; type: string; health: number }) => {
    cells[`${s.x},${s.y}`] = `Y:${s.type}@${s.health}`;
  });
  state?.enemyShips?.forEach((s: { x: number; y: number; type: string; health: number }) => {
    const k = `${s.x},${s.y}`;
    if (!cells[k]) cells[k] = `E:${s.type}@${s.health}`;
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b1418",
        color: "#e8dfc8",
        padding: 20,
        fontFamily: "Georgia, serif",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ letterSpacing: "0.25em", fontSize: 12, color: "#9a7b3f" }}>PIR8 · SPECTATOR</div>
        <h1 style={{ fontSize: 28, margin: "6px 0" }}>
          {state?.agentName ? `${state.agentName} vs AI` : "Practice skirmish"}
        </h1>
        <p style={{ fontSize: 13, opacity: 0.8 }}>{note}</p>
        {state ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(10, 1fr)",
                gap: 2,
                margin: "14px 0",
                fontSize: 9,
              }}
              aria-label={`Spectator board for run ${runId}`}
            >
              {Array.from({ length: 100 }, (_, i) => {
                const x = i % 10;
                const y = Math.floor(i / 10);
                const v = cells[`${x},${y}`];
                return (
                  <div
                    key={i}
                    title={`${x},${y}${v ? ` ${v}` : ""}`}
                    style={{
                      aspectRatio: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: v ? (v.startsWith("Y") ? "#14363a" : "#3d1d1a") : "#12232b",
                      border: "1px solid rgba(154,123,63,0.35)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    {v ? (v.startsWith("Y") ? "◆" : "●") : ""}
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 14 }}>
              {state.lastMessage || state.error || "Awaiting moves."}
            </p>
            <p style={{ fontSize: 12, opacity: 0.7 }}>
              Score {state.score ?? 0} · Gold {state.gold ?? 0} ·{" "}
              {state.finished
                ? state.agentWon
                  ? "Agent won"
                  : `Winner: ${state.winner || "unknown"}`
                : "Live"}
            </p>
          </>
        ) : (
          <p style={{ fontSize: 14 }}>{note}</p>
        )}
        <p style={{ fontSize: 11, opacity: 0.6, marginTop: 16 }}>
          Read-only spectator view. The agent plays via the Byte API; nothing here needs a click.
          Run {runId}.
        </p>
      </div>
    </main>
  );
}
