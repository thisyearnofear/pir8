"use client";

type GameState = "disconnected" | "connected" | "waiting" | "active" | "complete";

interface InfoPanelProps {
  state: GameState;
  players?: any[];
}

export default function InfoPanel({ state, players = [] }: InfoPanelProps) {
  switch (state) {
    case "disconnected":
      return (
        <>
          <div className="data-panel-title">FEATURES</div>
          <div className="data-readouts">
            <div className="data-row">
              <span className="data-value">⚡ SOLANA</span>
            </div>
            <div className="data-row">
              <span className="data-value">🔒 HELIUS</span>
            </div>
            <div className="data-row">
              <span className="data-value">🪙 PUMPFUN</span>
            </div>
            <div className="data-row">
              <span className="data-value">🎮 BATTLES</span>
            </div>
          </div>
        </>
      );

    case "connected":
      return (
        <>
          <div className="data-panel-title">GAME ECONOMICS</div>
          <div className="data-readouts">
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
        </>
      );

    case "waiting":
    case "active":
      return (
        <>
          <div className="data-panel-title">PLAYER STATS</div>
          <div className="data-readouts" style={{ fontSize: "0.7rem" }}>
            {players.map((player, idx) => (
              <div key={idx} className="data-row">
                <span className="data-label">{player.username}:</span>
                <span className="data-value">{player.points + player.bankedPoints} PTS</span>
              </div>
            ))}
          </div>
        </>
      );

    case "complete":
      return (
        <>
          <div className="data-panel-title">FINAL SCORES</div>
          <div className="data-readouts" style={{ fontSize: "0.7rem" }}>
            {players
              .sort((a, b) => b.points + b.bankedPoints - (a.points + a.bankedPoints))
              .map((player, idx) => (
                <div key={idx} className="data-row">
                  <span className="data-label">#{idx + 1} {player.username}:</span>
                  <span className="data-value">{player.points + player.bankedPoints}</span>
                </div>
              ))}
          </div>
        </>
      );

    default:
      return null;
  }
}
