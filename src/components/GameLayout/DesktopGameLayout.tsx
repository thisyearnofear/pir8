/**
 * DesktopGameLayout
 *
 * Desktop-optimized game layout with multi-panel design.
 * Features fixed HUD, side panels, floating quick actions, and slide-in menu.
 *
 * @module components/GameLayout
 */

"use client";

import { useState } from "react";
import PirateMap from "../PirateMap";
import AIReasoningPanel from "../AIReasoningPanel";
import TerritoryBonusPanel from "../TerritoryBonusPanel";
import GameEventLog from "../GameEventLog";
import ShipActionModal from "../ShipActionModal";
import InstrumentStrip from "../hud/InstrumentStrip";
import ActionRail from "../hud/ActionRail";
import MenuDrawer from "../hud/MenuDrawer";
import { Haptic } from "@/utils/haptics";
import { GameState, Ship, Player } from "@/types/game";
import { AIReasoning } from "@/lib/pirateGameEngine";

interface DesktopGameLayoutProps {
  // Game state
  gameState: GameState;

  // Turn state
  isMyTurn: boolean;
  decisionTimeMs: number;
  currentPlayerName: string;

  // Player info
  currentPlayerPK?: string;
  isPracticeMode: boolean;
  currentPlayer: Player | null;

  // Skill mechanics
  scanChargesRemaining: number;
  speedBonusAccumulated: number;
  averageDecisionTimeMs: number;
  scannedCoordinates: string[];

  // Ship selection
  selectedShipId: string | null;
  shipActionModalShip: Ship | null;

  // Actions
  onCellSelect: (coordinate: string) => void;
  onShipClick: (ship: Ship) => void;
  onShipSelect: (shipId: string | null) => void;
  onShipAction: (
    shipId: string,
    action: "move" | "attack" | "claim" | "collect" | "build",
  ) => void;
  onCloseShipActionModal: () => void;
  onEndTurn: () => void;
  onCollectResources: () => Promise<boolean>;
  onBuildShip: (
    shipType: string,
    portX: number,
    portY: number,
  ) => Promise<boolean>;

  // Lobby/Menu actions
  onCreateGame: () => void;
  onQuickStart: () => void;
  onStartGame: () => Promise<void>;
  onJoinGame: (gameId: string) => Promise<boolean>;
  onClearJoinError: () => void;
  onPracticeMode: () => void;

  // Victory actions
  onNewGame: () => void;
  onReturnToLobby: () => void;

  // Loading states
  isCreatingGame: boolean;
  isJoining: boolean;
  joinError?: string;

  // AI Reasoning
  aiReasoning?: AIReasoning | null;
  showAIReasoning?: boolean;
  onToggleAIReasoning?: () => void;
}

export function DesktopGameLayout({
  gameState,
  isMyTurn,
  decisionTimeMs,
  currentPlayerName,
  currentPlayerPK,
  isPracticeMode,
  currentPlayer,
  scanChargesRemaining,
  speedBonusAccumulated,
  averageDecisionTimeMs,
  scannedCoordinates,
  selectedShipId,
  shipActionModalShip,
  onCellSelect,
  onShipClick,
  onShipSelect,
  onShipAction,
  onCloseShipActionModal,
  onEndTurn,
  onCollectResources,
  onBuildShip,
  onCreateGame,
  onQuickStart,
  onStartGame,
  onJoinGame,
  onClearJoinError,
  onPracticeMode,
  // Victory actions (not used in desktop layout but kept for interface consistency)
  // onNewGame,
  // onReturnToLobby,
  isCreatingGame,
  isJoining,
  joinError,
  aiReasoning,
  showAIReasoning,
  onToggleAIReasoning,
}: DesktopGameLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "stats" | "actions" | "build" | "ai"
  >("stats");

  const allShips = gameState.players
    ? gameState.players
        .flatMap((p) => p.ships || [])
        .filter((s) => s.health > 0)
    : [];
  const selectedShip = selectedShipId
    ? allShips.find((s) => s.id === selectedShipId)
    : null;

  return (
    <>
      {/* Ship Action Modal */}
      {shipActionModalShip && (
        <ShipActionModal
          ship={shipActionModalShip}
          isOpen={true}
          onClose={onCloseShipActionModal}
          onAction={(action) => onShipAction(shipActionModalShip.id, action)}
        />
      )}

      {/* ===== DESKTOP GAME LAYOUT ===== */}
      <div className="h-screen flex flex-col bg-[var(--p8-ink)]">
        {/* ===== INSTRUMENT STRIP =====
            The brass rail at the table's edge: helm, weather, stores, log.
            Same instrument on every screen size (DESIGN.md §9). */}
        <InstrumentStrip
          isMyTurn={isMyTurn}
          currentPlayerName={currentPlayerName}
          decisionTimeMs={decisionTimeMs}
          turnNumber={gameState.turnNumber}
          playerCount={gameState.players.length}
          weather={gameState.globalWeather}
          resources={currentPlayer?.resources ?? null}
          isPracticeMode={isPracticeMode}
          menuOpen={menuOpen}
          onToggleMenu={() => {
            Haptic.light();
            setMenuOpen(!menuOpen);
          }}
        />

        {/* ===== MAIN CONTENT - MAP AS HERO ===== */}
        <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
          <PirateMap
            gameMap={gameState.gameMap}
            ships={allShips}
            players={gameState.players}
            onCellSelect={onCellSelect}
            onShipClick={onShipClick}
            isMyTurn={isMyTurn}
            selectedShipId={selectedShipId || undefined}
            currentPlayerPK={currentPlayerPK}
            scannedCoordinates={scannedCoordinates}
          />

          {/* AI Reasoning Panel */}
          <AIReasoningPanel
            reasoning={aiReasoning || null}
            isVisible={!!showAIReasoning}
            onClose={onToggleAIReasoning}
            showHints={isPracticeMode}
          />

          {/* LEFT SIDE PANELS */}
          {currentPlayer && (
            <div className="absolute top-4 left-4 z-30 flex flex-col gap-3 max-w-xs">
              <GameEventLog
                events={gameState.eventLog}
                maxVisible={4}
                isCompact={true}
              />
            </div>
          )}

          {/* TERRITORY BONUS PANEL */}
          {currentPlayer && (
            <div className="absolute top-4 right-4 z-30">
              <TerritoryBonusPanel
                player={currentPlayer}
                gameState={gameState}
                isCompact={true}
              />
            </div>
          )}
        </div>

        {/* ===== ACTION RAIL =====
            The near edge of the table: selected-ship plaque, disposition
            instruments, and the single End Turn lever (DESIGN.md §8.3). */}
        <ActionRail
          selectedShip={selectedShip ?? null}
          onShipPlaqueClick={() => {
            if (selectedShip) {
              Haptic.light();
              onShipClick(selectedShip);
            }
          }}
          fleetCount={currentPlayer?.ships.filter((s) => s.health > 0).length ?? 0}
          territoryCount={currentPlayer?.controlledTerritories.length ?? 0}
          isMyTurn={isMyTurn}
          onEndTurn={() => {
            Haptic.heavy();
            onEndTurn();
          }}
        />

        {/* Keyboard Shortcuts Hint — inside the token system, stowed on narrow tables */}
        <div className="p8-keyhints p8-stow-sm">
          <span><kbd>E</kbd> End Turn</span>
          {!isPracticeMode && <span><kbd>C</kbd> Collect</span>}
          <span><kbd>T</kbd> Chart view</span>
          <span><kbd>Esc</kbd> Deselect</span>
        </div>

        {/* ===== CAPTAIN'S LEDGER =====
            One drawer for every screen — bottom sheet narrow, starboard
            panel wide. Panels inside migrate to the token system by slice. */}
        <MenuDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          gameState={gameState}
          currentPlayer={currentPlayer}
          isMyTurn={isMyTurn}
          isPracticeMode={isPracticeMode}
          decisionTimeMs={decisionTimeMs}
          scanChargesRemaining={scanChargesRemaining}
          speedBonusAccumulated={speedBonusAccumulated}
          averageDecisionTimeMs={averageDecisionTimeMs}
          scannedCoordinates={scannedCoordinates}
          selectedShipId={selectedShipId}
          onShipSelect={onShipSelect}
          onShipAction={onShipAction}
          onEndTurn={onEndTurn}
          onCollectResources={onCollectResources}
          onBuildShip={onBuildShip}
          onPracticeMode={onPracticeMode}
          onToggleAIReasoning={onToggleAIReasoning}
          onCreateGame={onCreateGame}
          onQuickStart={onQuickStart}
          onStartGame={onStartGame}
          onJoinGame={onJoinGame}
          isCreatingGame={isCreatingGame}
          isJoining={isJoining}
          joinError={joinError}
          onClearJoinError={onClearJoinError}
        />
      </div>
    </>
  );
}

export default DesktopGameLayout;
