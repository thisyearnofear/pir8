"use client";
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
  isCreating?: boolean;
  winner?: string;
  players?: any[];
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
  isCreating,
  winner,
  players = [],
  grid = [],
  chosenCoordinates = [],
  onCoordinateSelect,
  isMyTurn = false,
  collapsed = false,
  onToggle,
}: GameStatePanelProps) {
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
              <button
                onClick={onCreateGame}
                disabled={isCreating}
                className="control-button"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  fontSize: "0.75rem",
                }}
              >
                {isCreating ? "CREATING..." : "START BATTLE"}
              </button>
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
                <div className="data-row">
                  <span className="data-label">STATUS:</span>
                  <span className="data-value">AWAITING PLAYERS</span>
                </div>
                <div className="data-row">
                  <span className="data-label">PLAYERS:</span>
                  <span className="data-value">{players.length}/4</span>
                </div>
              </div>
              <button
                onClick={onQuickStart}
                className="control-button"
                style={{
                  marginTop: "1rem",
                  width: "100%",
                  padding: "0.5rem",
                  fontSize: "0.75rem",
                }}
              >
                QUICK START
              </button>
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
