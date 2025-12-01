"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

type GameState = "disconnected" | "connected" | "waiting" | "active" | "complete";

interface GameStatePanelProps {
  state: GameState;
  onCreateGame?: () => void;
  onQuickStart?: () => void;
  isCreating?: boolean;
  winner?: string;
  players?: any[];
}

export default function GameStatePanel({
  state,
  onCreateGame,
  onQuickStart,
  isCreating,
  winner,
  players = [],
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
              <span className="data-label">WALLET:</span>
              <span className="data-value">DISCONNECTED</span>
            </div>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <WalletMultiButton className="!bg-accent-primary !text-bg-color !font-bold !text-xs !py-2 !px-4 !w-full" />
          </div>
        </>
      );

    case "connected":
      return (
        <>
          <div className="data-panel-title">⚓ HOW TO PLAY</div>
          <div className="data-readouts" style={{ fontSize: "0.7rem", lineHeight: "1.4" }}>
            <div className="data-row">
              <span className="data-value">🗺️ 7x7 grid • Take turns</span>
            </div>
            <div className="data-row">
              <span className="data-value">💰 Earn & bank points</span>
            </div>
            <div className="data-row">
              <span className="data-value">⚔️ 🎁 Gift • 👹 Steal • 🍮 Reset</span>
            </div>
            <div className="data-row">
              <span className="data-value">🏆 Winner: 85% pot</span>
            </div>
          </div>
          <button
            onClick={onCreateGame}
            disabled={isCreating}
            className="control-button"
            style={{ marginTop: "1rem", width: "100%", padding: "0.5rem", fontSize: "0.75rem" }}
          >
            {isCreating ? "CREATING..." : "▶ START BATTLE"}
          </button>
        </>
      );

    case "waiting":
      return (
        <>
          <div className="data-panel-title">ARENA.READY</div>
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
            style={{ marginTop: "1rem", width: "100%", padding: "0.5rem", fontSize: "0.75rem" }}
          >
            ▶ QUICK START
          </button>
        </>
      );

    case "active":
      return (
        <>
          <div className="data-panel-title">BATTLE.ACTIVE</div>
          <div className="data-readouts">
            <div className="data-row">
              <span className="data-label">STATUS:</span>
              <span className="data-value">IN PROGRESS</span>
            </div>
            <div className="data-row">
              <span className="data-label">PLAYERS:</span>
              <span className="data-value">{players.length}</span>
            </div>
            <div className="data-row">
              <span className="data-label">MOVES LEFT:</span>
              <span className="data-value">{49 - (players[0]?.chosenCoordinates?.length || 0)}</span>
            </div>
          </div>
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
            style={{ marginTop: "1rem", width: "100%", padding: "0.5rem", fontSize: "0.75rem" }}
          >
            ▶ NEW BATTLE
          </button>
        </>
      );

    default:
      return null;
  }
}
