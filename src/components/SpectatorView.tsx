/**
 * SpectatorView - Read-only game viewing component
 * Allows users to watch live games without wallet connection
 * Following: ENHANCEMENT FIRST, MODULAR architecture
 */

"use client";

import { useState } from "react";
import { useSpectatorMode } from "@/hooks/useSpectatorMode";
import { Icon } from "@/components/ui/Icon";
import PirateMap from "./PirateMap";
import PlayerStats from "./PlayerStats";
import BattleInfoPanel from "./BattleInfoPanel";

// =============================================================================
// TYPES
// =============================================================================

interface SpectatorViewProps {
  initialGameId?: string;
  onClose?: () => void;
  onJoinGame?: (gameId: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function SpectatorView({
  initialGameId,
  onClose,
  onJoinGame,
}: SpectatorViewProps) {
  const [gameIdInput, setGameIdInput] = useState(initialGameId || "");
  const [copied, setCopied] = useState(false);

  const {
    gameState,
    isLoading,
    error,
    lastUpdate,
    isLive,
    refresh,
    setGameId,
    clearError,
  } = useSpectatorMode({
    gameId: initialGameId,
    autoRefresh: true,
    refreshInterval: 10000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameIdInput.trim()) return;

    setGameId(gameIdInput.trim());
  };

  const handleShare = async () => {
    const url = `${window.location.origin}?spectate=${gameState?.gameId || gameIdInput}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      prompt("Copy this link to share:", url);
    }
  };

  const formatLastUpdate = (timestamp: number) => {
    if (!timestamp) return "Never";
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 5) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  // Show search form if no game loaded
  if (!gameState) {
    return (
      <div className="min-h-[600px] flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] text-[var(--p8-lamp)]">
              <Icon name="eye" size={28} strokeWidth={1.5} />
            </span>
            <h2 className="mb-2 font-[var(--font-world)] text-3xl text-[var(--p8-vellum)]">
              Spectator mode
            </h2>
            <p className="text-[var(--p8-vellum-dim)]">
              Watch live battles unfold in real-time. No wallet required.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={gameIdInput}
                onChange={(e) => {
                  setGameIdInput(e.target.value);
                  clearError();
                }}
                placeholder="Enter Game ID..."
                className="w-full rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-5 py-4 font-[var(--font-instrument)] text-lg text-[var(--p8-vellum)] placeholder:text-[var(--p8-vellum-mute)] transition-colors focus:border-[var(--p8-lamp)] focus:outline-none"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--p8-vellum-dim)]">
                <Icon name="scan" size={22} strokeWidth={1.5} />
              </div>
            </div>

            {error && (
              <div className="rounded-[var(--p8-radius)] border border-[color-mix(in_srgb,var(--p8-threat)_55%,transparent)] bg-[color-mix(in_srgb,var(--p8-threat)_12%,transparent)] p-3 text-sm text-[var(--p8-vellum)]" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !gameIdInput.trim()}
              className="w-full rounded-[var(--p8-radius)] bg-[var(--p8-lamp)] py-4 text-sm font-black uppercase tracking-[0.14em] text-[#0b1418] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p8-vellum)]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Finding Game...
                </div>
              ) : (
                "Watch Game"
              )}
            </button>
          </form>

          {/* Popular Games */}
          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.16em] text-[var(--p8-vellum-dim)]">
                Demo games
              </h3>
              <span className="rounded-full border border-[var(--p8-brass-line)] px-2 py-0.5 font-[var(--font-instrument)] text-[11px] text-[var(--p8-vellum-mute)]">
                DEMO
              </span>
            </div>
            <div className="space-y-2">
              {["battle_001", "pirate_war_42", "treasure_hunt_7"].map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    setGameIdInput(id);
                    setGameId(id);
                  }}
                  className="flex w-full items-center justify-between rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-3 text-left transition-colors hover:border-[var(--p8-brass)] focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-[var(--p8-signal)]" />
                    <span className="font-[var(--font-instrument)] text-[var(--p8-vellum)]">{id}</span>
                  </div>
                  <span className="font-[var(--font-instrument)] text-[11px] text-[var(--p8-vellum-mute)]">
                    4 players • Turn 23
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-[var(--p8-radius)] py-3 text-sm font-bold text-[var(--p8-vellum-dim)] transition-colors hover:text-[var(--p8-vellum)] focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
            >
              ← Back to main menu
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show game view
  return (
    <div className="h-screen max-h-[900px] flex flex-col">
      {/* Spectator Header */}
      <div className="border-b border-[var(--p8-brass-line)] bg-[var(--p8-ink)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[var(--p8-lamp)]">
                <Icon name="eye" size={18} strokeWidth={1.5} />
              </span>
              <span className="font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.2em] text-[var(--p8-vellum)]">Spectator mode</span>
            </div>

            {/* Live indicator */}
            <div className="flex items-center gap-2 rounded-full border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] px-3 py-1">
              <span
                className={`h-2 w-2 rounded-full ${isLive ? "bg-[var(--p8-signal)]" : "bg-[var(--p8-vellum-mute)]"}`}
              />
              <span className="font-[var(--font-instrument)] text-[11px] text-[var(--p8-vellum-dim)]">
                {isLive ? "Live" : "Ended"}
              </span>
            </div>

            {/* Last update */}
            <span className="font-[var(--font-instrument)] text-[11px] text-[var(--p8-vellum-mute)]">
              Updated {formatLastUpdate(lastUpdate)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh button */}
            <button
              onClick={refresh}
              disabled={isLoading}
              className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-2 text-[var(--p8-vellum-dim)] transition-colors hover:border-[var(--p8-brass)] hover:text-[var(--p8-vellum)] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
              title="Refresh"
              aria-label="Refresh game state"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--p8-brass-line)] border-t-[var(--p8-lamp)]" />
              ) : (
                <Icon name="undo" size={16} strokeWidth={1.5} />
              )}
            </button>

            {/* Share button */}
            <button
              onClick={handleShare}
              className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-2 text-[var(--p8-vellum-dim)] transition-colors hover:border-[var(--p8-brass)] hover:text-[var(--p8-vellum)] focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
              title="Share game link"
              aria-label="Share game link"
            >
              <Icon name={copied ? "check" : "link"} size={16} strokeWidth={1.5} />
            </button>

            {/* Join button */}
            {onJoinGame && isLive && (
              <button
                onClick={() => onJoinGame(gameState.gameId)}
                className="rounded-[var(--p8-radius)] bg-[var(--p8-lamp)] px-4 py-2 font-bold text-[#0b1418] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p8-vellum)]"
              >
                Join battle
              </button>
            )}

            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-2 text-[var(--p8-vellum-dim)] transition-colors hover:border-[var(--p8-brass)] hover:text-[var(--p8-vellum)] focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
                title="Close"
                aria-label="Close spectator view"
              >
                <Icon name="close" size={16} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>

        {/* Game info bar */}
        <div className="mt-3 flex items-center gap-6 text-sm">
          <span className="text-[var(--p8-vellum-dim)]">
            Game:{" "}
            <span className="font-[var(--font-instrument)] text-[var(--p8-signal)]">{gameState.gameId}</span>
          </span>
          <span className="text-[var(--p8-vellum-dim)]">
            Turn: <span className="font-[var(--font-instrument)] text-[var(--p8-vellum)]">{gameState.turnNumber}</span>
          </span>
          <span className="text-[var(--p8-vellum-dim)]">
            Players:{" "}
            <span className="font-[var(--font-instrument)] text-[var(--p8-vellum)]">{gameState.players.length}</span>
          </span>
          <span className="text-[var(--p8-vellum-dim)]">
            Phase:{" "}
            <span className="capitalize text-[var(--p8-vellum)]">
              {gameState.currentPhase}
            </span>
          </span>
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 overflow-hidden">
        {/* Left: Player Stats */}
        <div className="lg:col-span-1 overflow-y-auto">
          <PlayerStats
            players={gameState.players}
            currentPlayerIndex={gameState.currentPlayerIndex}
            gameStatus={gameState.gameStatus}
            decisionTimeMs={0}
            scanChargesRemaining={3}
            speedBonusAccumulated={0}
            averageDecisionTimeMs={0}
            scannedCoordinates={[]}
          />

          {/* Event Log */}
          <div className="mt-4 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-4">
            <h3 className="mb-3 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.16em] text-[var(--p8-vellum-dim)]">
              Recent events
            </h3>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {gameState.eventLog
                .slice(-5)
                .reverse()
                .map((event) => (
                  <div
                    key={event.id}
                    className="rounded-[var(--p8-radius)] bg-[var(--p8-ink)] p-2 text-xs"
                  >
                    <span className="font-[var(--font-instrument)] text-[var(--p8-vellum-mute)]">
                      Turn {event.turnNumber}:
                    </span>
                    <p className="mt-1 text-[var(--p8-vellum-dim)]">{event.description}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Center: Game Map */}
        <div className="lg:col-span-2 flex flex-col">
          <PirateMap
            gameMap={gameState.gameMap}
            ships={gameState.players
              .flatMap((p) => p.ships)
              .filter((s) => s.health > 0)}
            players={gameState.players}
            onCellSelect={() => {}} // No-op in spectator mode
            onShipClick={() => {}} // No-op in spectator mode
            isMyTurn={false} // Spectators never have turn
            selectedShipId={undefined}
            currentPlayerPK={undefined}
            scannedCoordinates={[]}
          />
        </div>

        {/* Right: Battle Info */}
        <div className="lg:col-span-1">
          <BattleInfoPanel gameState={gameState} />

          {/* Spectator Call-to-Action */}
          <div className="mt-4 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-4">
            <h3 className="mb-2 font-[var(--font-world)] text-[var(--p8-vellum)]">Want to play?</h3>
            <p className="mb-3 text-sm text-[var(--p8-vellum-dim)]">
              Connect your wallet to join battles and earn real rewards!
            </p>
            {onJoinGame && isLive && (
              <button
                onClick={() => onJoinGame(gameState.gameId)}
                className="w-full rounded-[var(--p8-radius)] bg-[var(--p8-lamp)] py-2 font-bold text-[#0b1418] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p8-vellum)]"
              >
                Join this game
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
