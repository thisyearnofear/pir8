"use client";
import { useState } from "react";
import GameGrid from "@/components/GameGrid";
type GameState =
  | "disconnected"
  | "connected"
  | "waiting"
  | "active"
  | "complete";

interface GameStatePanelProps {
  state: GameState;
  onCreateGame?: () => void;
  onQuickStart?: () => void;
  onJoinGame?: (gameId: string) => Promise<boolean>;
  isCreating?: boolean;
  isJoining?: boolean;
  joinError?: string | null;
  onClearJoinError?: () => void;
  winner?: string;
  players?: any[];
  gameId?: string;
  grid?: any[][];
  chosenCoordinates?: string[];
  onCoordinateSelect?: (coordinate: string) => void;
  isMyTurn?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function GameStatePanel({
  state,
  onCreateGame,
  onQuickStart,
  onJoinGame,
  isCreating,
  isJoining,
  joinError,
  onClearJoinError,
  winner,
  players = [],
  gameId,
  grid = [],
  chosenCoordinates = [],
  onCoordinateSelect,
  isMyTurn = false,
  collapsed = false,
  onToggle,
}: GameStatePanelProps) {
  const [joinGameId, setJoinGameId] = useState("");
  console.log("[GameStatePanel] Rendering state:", state, { isCreating, gameId, playersCount: players.length });
  
  switch (state) {
    case "disconnected":
      return (
        <>
          <div className="data-panel-title">SYSTEM.INIT</div>
          <div className="data-readouts">
            <div className="data-row">
              <span className="data-label">STATUS:</span>
              <span className="data-value">OFFLINE</span>
            </div>
            <div className="data-row">
              <span className="data-label">ENLIST:</span>
              <span className="data-value">Connect</span>
            </div>
            <div className="data-row">
              <span className="data-label">ENTRY:</span>
              <span className="data-value">0.1 SOL</span>
            </div>
          </div>
        </>
      );

    case "connected":
      return (
        <>
          <div className="data-panel-title">FUNCTION</div>
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
            <>
              <div
                className="data-readouts"
                style={{ fontSize: "0.7rem", lineHeight: "1.4" }}
              >
                <div className="data-row">
                  <span className="data-value">Grid: 7x7 • Turn-based</span>
                </div>
                <div className="data-row">
                  <span className="data-value">Score: Earn and bank</span>
                </div>
                <div className="data-row">
                  <span className="data-value">Items: Gift/Steal/Reset</span>
                </div>
              </div>

              {/* Create Game Section */}
              <button
                onClick={onCreateGame}
                disabled={isCreating}
                className="control-button"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  fontSize: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                {isCreating ? "CREATING..." : "START BATTLE"}
              </button>

              {/* Join Game Section */}
              {onJoinGame && (
                <>
                  <div
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.5rem",
                      textAlign: "center",
                    }}
                  >
                    OR
                  </div>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <input
                      type="text"
                      placeholder="Enter Game ID"
                      value={joinGameId}
                      onChange={(e) => {
                        setJoinGameId(e.target.value);
                        if (joinError) onClearJoinError?.();
                      }}
                      disabled={isJoining}
                      style={{
                        width: "100%",
                        padding: "0.4rem",
                        fontSize: "0.7rem",
                        backgroundColor: "rgba(0, 0, 0, 0.2)",
                        border: "1px solid var(--panel-border)",
                        color: "var(--text-primary)",
                        borderRadius: "3px",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                  <button
                    onClick={() => onJoinGame(joinGameId)}
                    disabled={isJoining || !joinGameId.trim()}
                    className="control-button"
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      fontSize: "0.75rem",
                    }}
                  >
                    {isJoining ? "JOINING..." : "JOIN GAME"}
                  </button>
                  {joinError && (
                    <div
                      style={{
                        fontSize: "0.65rem",
                        color: "var(--accent-tertiary)",
                        marginTop: "0.5rem",
                      }}
                    >
                      {joinError}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      );

    case "waiting":
      return (
        <>
          <div className="data-panel-title">ARENA.READY</div>
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
            <>
              <div className="data-readouts">
                {gameId && (
                  <>
                    <div className="data-row">
                      <span className="data-label">GAME ID:</span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.65rem",
                        backgroundColor: "rgba(0, 0, 0, 0.3)",
                        padding: "0.4rem",
                        borderRadius: "3px",
                        marginBottom: "0.5rem",
                        wordBreak: "break-all",
                        fontFamily: "monospace",
                        color: "var(--accent-tertiary)",
                        cursor: "pointer",
                      }}
                      title="Click to copy"
                      onClick={() => {
                        navigator.clipboard.writeText(gameId);
                      }}
                    >
                      {gameId}
                    </div>
                  </>
                )}
                <div className="data-row">
                  <span className="data-label">STATUS:</span>
                  <span className="data-value">AWAITING PLAYERS</span>
                </div>
                <div className="data-row">
                  <span className="data-label">PLAYERS:</span>
                  <span className="data-value">{players.length}/4</span>
                </div>
                {players.length > 0 && (
                  <>
                    <div style={{ fontSize: "0.65rem", marginTop: "0.5rem" }}>
                      {players.map((p, i) => (
                        <div key={i} style={{ color: "var(--text-secondary)" }}>
                          • {p.username}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {players.length >= 2 && (
                <button
                  onClick={onQuickStart}
                  disabled={isCreating}
                  className="control-button"
                  style={{
                    marginTop: "1rem",
                    width: "100%",
                    padding: "0.5rem",
                    fontSize: "0.75rem",
                  }}
                >
                  {isCreating ? "STARTING..." : "QUICK START"}
                </button>
              )}
              {players.length < 2 && (
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--text-secondary)",
                    marginTop: "0.75rem",
                    textAlign: "center",
                  }}
                >
                  Waiting for {4 - players.length} more player(s)...
                </div>
              )}
            </>
          )}
        </>
      );

    case "active":
      return (
        <>
          <div className="data-panel-title">BATTLE.ACTIVE</div>
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
          {!collapsed && grid && onCoordinateSelect && (
            <div style={{ marginTop: "0.5rem" }}>
              <GameGrid
                grid={grid}
                chosenCoordinates={chosenCoordinates}
                onCoordinateSelect={onCoordinateSelect}
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
          <div className="data-panel-title">🏆 VICTOR CROWNED</div>
          <div className="data-readouts">
            <div className="data-row">
              <span className="data-label">WINNER:</span>
              <span className="data-value">{winner?.slice(0, 8)}...</span>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="control-button"
            style={{
              marginTop: "1rem",
              width: "100%",
              padding: "0.5rem",
              fontSize: "0.75rem",
            }}
          >
            ▶ NEW BATTLE
          </button>
        </>
      );

    default:
      return null;
  }
}
