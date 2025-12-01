"use client";
import GameControls from "@/components/GameControls";
import { useState } from "react";

type GameState =
  | "disconnected"
  | "connected"
  | "waiting"
  | "active"
  | "complete";

interface InfoPanelProps {
  state: GameState;
  players?: any[];
  gameId?: string;
  isMyTurn?: boolean;
  pendingActionType?: string;
  currentPlayerIndex?: number;
  onPlayerAction?: (
    action: string,
    targetPlayerId?: string,
    amount?: number,
    coordinate?: string
  ) => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function InfoPanel({
  state,
  players = [],
  gameId,
  isMyTurn = false,
  pendingActionType,
  currentPlayerIndex = 0,
  onPlayerAction,
  collapsed = false,
  onToggle,
}: InfoPanelProps) {
  const [targetId, setTargetId] = useState<string | undefined>(undefined);
  const [amount, setAmount] = useState<number>(100);
  const [coord, setCoord] = useState<string>("");
  const isCoordValid = /^[A-G][1-7]$/.test(coord);
  switch (state) {
    case "disconnected":
      return (
        <>
          <div className="data-panel-title">CONFIG</div>
          <div
            className="data-readouts"
            style={{ textAlign: "center", fontSize: "0.75rem" }}
          >
            <div className="data-row">
              <span className="data-label">CHAIN:</span>
              <span className="data-value">SOLANA</span>
            </div>
            <div className="data-row">
              <span className="data-label">RPC:</span>
              <span className="data-value">HELIUS</span>
            </div>
            <div className="data-row">
              <span className="data-label">TOKEN:</span>
              <span className="data-value">PUMPFUN</span>
            </div>
          </div>
        </>
      );

    case "connected":
      return (
        <>
          <div className="data-panel-title">GAME ECONOMICS</div>
          {onToggle && (
            <button
              className="control-button"
              style={{
                float: "right",
                fontSize: "0.7rem",
                padding: "0.25rem 0.5rem",
              }}
              onClick={onToggle}
            >
              {collapsed ? "EXPAND" : "COLLAPSE"}
            </button>
          )}
          {!collapsed && (
            <div
              className="data-readouts"
              style={{ fontSize: "0.7rem", lineHeight: "1.4" }}
            >
              <div className="data-row">
                <span className="data-label">ENTRY FEE:</span>
                <span className="data-value">0.1 SOL</span>
              </div>
              <div className="data-row">
                <span className="data-label">PLATFORM FEE:</span>
                <span className="data-value">5%</span>
              </div>
              <div className="data-row">
                <span className="data-label">WINNER PRIZE:</span>
                <span className="data-value">85%</span>
              </div>
            </div>
          )}
        </>
      );

    case "waiting":
    case "active":
      return (
        <>
          <div className="data-panel-title">PLAYER STATS</div>
          {onToggle && (
            <button
              className="control-button"
              style={{
                float: "right",
                fontSize: "0.7rem",
                padding: "0.25rem 0.5rem",
              }}
              onClick={onToggle}
            >
              {collapsed ? "EXPAND" : "COLLAPSE"}
            </button>
          )}
          {!collapsed && (
            <div className="data-readouts" style={{ fontSize: "0.7rem" }}>
              {players.map((player, idx) => (
                <div key={idx} className="data-row">
                  <span className="data-label">{player.username}:</span>
                  <span className="data-value">
                    {player.points + player.bankedPoints} PTS
                  </span>
                </div>
              ))}
            </div>
          )}
          {state === "active" && pendingActionType && isMyTurn && (
            <div style={{ marginTop: "0.5rem" }}>
              <div className="data-panel-title">ACTION</div>
              <div className="data-readouts" style={{ fontSize: "0.7rem" }}>
                <div className="data-row">
                  <span className="data-label">TYPE:</span>
                  <span className="data-value">
                    {pendingActionType.toUpperCase()}
                  </span>
                </div>
                {pendingActionType !== "choose" && (
                  <div className="data-row">
                    <span className="data-label">TARGET:</span>
                    <span className="data-value">
                      <select
                        style={{ width: "100%" }}
                        onChange={(e) => setTargetId(e.target.value)}
                      >
                        <option value="">Select player</option>
                        {players
                          .filter((_, idx) => idx !== currentPlayerIndex)
                          .map((p, idx) => (
                            <option key={idx} value={p.publicKey}>
                              {p.username || p.publicKey.slice(0, 8)}
                            </option>
                          ))}
                      </select>
                    </span>
                  </div>
                )}
                {pendingActionType === "choose" && (
                  <div className="data-row">
                    <span className="data-label">COORDINATE:</span>
                    <span className="data-value">
                      <input
                        type="text"
                        placeholder="A1"
                        style={{ width: "100%" }}
                        value={coord}
                        onChange={(e) => setCoord(e.target.value.toUpperCase())}
                      />
                    </span>
                  </div>
                )}
                {pendingActionType === "steal" && (
                  <div className="data-row">
                    <span className="data-label">AMOUNT:</span>
                    <span className="data-value">
                      <input
                        type="number"
                        value={amount}
                        min={1}
                        style={{ width: "100%" }}
                        onChange={(e) =>
                          setAmount(parseInt(e.target.value, 10))
                        }
                      />
                    </span>
                  </div>
                )}
              </div>
              <button
                className="control-button"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  fontSize: "0.75rem",
                  marginTop: "0.5rem",
                }}
                disabled={
                  pendingActionType === "choose"
                    ? !isCoordValid
                    : pendingActionType === "steal"
                    ? !(targetId && amount > 0)
                    : !targetId
                }
                onClick={() => {
                  if (!onPlayerAction || !pendingActionType) return;
                  if (pendingActionType === "choose") {
                    onPlayerAction("choose", undefined, undefined, coord);
                  } else {
                    onPlayerAction(
                      pendingActionType,
                      targetId,
                      pendingActionType === "steal" ? amount : undefined
                    );
                  }
                }}
              >
                CONFIRM ACTION
              </button>
            </div>
          )}
          {state === "active" && gameId && (
            <div style={{ marginTop: "0.5rem" }}>
              <GameControls
                gameId={gameId as string}
                isMyTurn={isMyTurn}
                disabled={false}
              />
            </div>
          )}
        </>
      );

    case "complete":
      return (
        <>
          <div className="data-panel-title">FINAL SCORES</div>
          <div className="data-readouts" style={{ fontSize: "0.7rem" }}>
            {players
              .sort(
                (a, b) =>
                  b.points + b.bankedPoints - (a.points + a.bankedPoints)
              )
              .map((player, idx) => (
                <div key={idx} className="data-row">
                  <span className="data-label">
                    #{idx + 1} {player.username}:
                  </span>
                  <span className="data-value">
                    {player.points + player.bankedPoints}
                  </span>
                </div>
              ))}
          </div>
        </>
      );

    default:
      return null;
  }
}
