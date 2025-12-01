"use client";

import { useRef, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Visualization3D from "./Visualization3D";
import GameStatePanel from "./panels/GameStatePanel";
import InfoPanel from "./panels/InfoPanel";
import "../../styles/MusicPlayer.css";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface GameCockpitProps {
  gameState: any;
  onCreateGame: () => void;
  onQuickStart: () => void;
  isCreating: boolean;
  onCoordinateSelect?: (coordinate: string) => void;
  isMyTurn?: boolean;
  onPlayerAction?: (
    action: string,
    targetPlayerId?: string,
    amount?: number
  ) => void;
}

export default function GameCockpit({
  gameState,
  onCreateGame,
  onQuickStart,
  isCreating,
  onCoordinateSelect,
  isMyTurn,
  onPlayerAction,
}: GameCockpitProps) {
  const { connected } = useWallet();
  const [isSmall, setIsSmall] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [anomalyCollapsed, setAnomalyCollapsed] = useState(false);

  function updateResponsive() {
    const small = typeof window !== "undefined" && window.innerWidth < 1200;
    setIsSmall(small);
    if (small) {
      setLeftCollapsed(false);
      setRightCollapsed(true);
      setAnomalyCollapsed(true);
    } else {
      setLeftCollapsed(false);
      setRightCollapsed(false);
      setAnomalyCollapsed(false);
    }
  }

  useEffect(() => {
    updateResponsive();
    function onResize() {
      updateResponsive();
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const [rotationSpeed, setRotationSpeed] = useState(1.5); // Increased default rotation speed
  const [distortion, setDistortion] = useState(1.0);
  const [reactivity, setReactivity] = useState(1.0);

  const audioContextRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();
  const [isAudioPlaying] = useState(false);

  const getCurrentState = ():
    | "disconnected"
    | "connected"
    | "waiting"
    | "active"
    | "complete" => {
    if (!connected) return "disconnected";
    if (!gameState) return "connected";
    if (gameState.gameStatus === "waiting") return "waiting";
    if (gameState.gameStatus === "active") return "active";
    if (gameState.gameStatus === "completed") return "complete";
    return "connected";
  };

  const state = getCurrentState();

  return (
    <div className="music-player">
      {/* Space Background */}
      <div className="space-background" />

      {/* 3D Container */}
      <div id="three-container">
        <Visualization3D
          audioAnalyser={analyserRef.current}
          isAudioPlaying={isAudioPlaying}
          rotationSpeed={rotationSpeed}
          sphereResolution={32}
          distortionFactor={distortion}
          audioReactivity={reactivity}
        />
      </div>

      {/* Grid Overlay */}
      <div className="grid-overlay" />

      {/* Scanner Frame */}
      <div className="scanner-frame">
        <div className="corner-tl"></div>
        <div className="corner-tr"></div>
        <div className="corner-bl"></div>
        <div className="corner-br"></div>
        <div className="scanner-id">PIR8.GAME.SYSTEM</div>
        <div className="scanner-id-right">SOLANA.DEVNET</div>
      </div>

      {/* Interface Container */}
      <div className="interface-container">
        {/* Header */}
        <div className="header">
          <div className="header-item">PIR8.SYSTEM.V1.0</div>
          <div className="header-item">SOLANA.DEVNET</div>
          <div className="header-item" style={{ pointerEvents: "auto" }}>
            <WalletMultiButton className="!text-xs" />
          </div>
        </div>

        {/* Control Panel */}
        <div className="control-panel">
          <div className="panel-header">
            <span className="data-panel-title">ANOMALY CONTROLS</span>
            <span className="drag-handle">⋮⋮</span>
            <button
              className="control-button"
              style={{
                marginLeft: "auto",
                fontSize: "0.75rem",
                padding: "0.25rem 0.5rem",
              }}
              onClick={() => setAnomalyCollapsed((v) => !v)}
            >
              {anomalyCollapsed ? "EXPAND" : "COLLAPSE"}
            </button>
          </div>
          {!anomalyCollapsed && (
            <>
              <div className="control-group">
                <div className="control-row">
                  <span className="control-label">ROTATION</span>
                  <span className="control-value">
                    {rotationSpeed.toFixed(1)}
                  </span>
                </div>
                <div className="slider-container">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={rotationSpeed}
                    onChange={(e) =>
                      setRotationSpeed(parseFloat(e.target.value))
                    }
                    className="slider"
                  />
                </div>
              </div>
              <div className="control-group">
                <div className="control-row">
                  <span className="control-label">DISTORTION</span>
                  <span className="control-value">{distortion.toFixed(1)}</span>
                </div>
                <div className="slider-container">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={distortion}
                    onChange={(e) => setDistortion(parseFloat(e.target.value))}
                    className="slider"
                  />
                </div>
              </div>
              <div className="control-group">
                <div className="control-row">
                  <span className="control-label">REACTIVITY</span>
                  <span className="control-value">{reactivity.toFixed(1)}</span>
                </div>
                <div className="slider-container">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={reactivity}
                    onChange={(e) => setReactivity(parseFloat(e.target.value))}
                    className="slider"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Data Panels */}
        <div className="data-panels">
          <div className="data-panel">
            <GameStatePanel
              state={state}
              onCreateGame={onCreateGame}
              onQuickStart={onQuickStart}
              isCreating={isCreating}
              winner={gameState?.winner}
              players={gameState?.players || []}
              grid={gameState?.grid}
              chosenCoordinates={gameState?.chosenCoordinates || []}
              onCoordinateSelect={onCoordinateSelect}
              isMyTurn={Boolean(isMyTurn)}
              collapsed={isSmall ? leftCollapsed : false}
              onToggle={() => setLeftCollapsed((v) => !v)}
            />
          </div>
          <div className="data-panel">
            <InfoPanel
              state={state}
              players={gameState?.players || []}
              gameId={gameState?.gameId}
              isMyTurn={Boolean(isMyTurn)}
              pendingActionType={gameState?.pendingActionType}
              currentPlayerIndex={gameState?.currentPlayerIndex}
              onPlayerAction={onPlayerAction}
              collapsed={isSmall ? rightCollapsed : false}
              onToggle={() => setRightCollapsed((v) => !v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
