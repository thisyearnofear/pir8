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
import PlayerStats from "../PlayerStats";
import BattleInfoPanel from "../BattleInfoPanel";
import ResourceCollectionPanel from "../ResourceCollectionPanel";
import PirateControls from "../PirateControls";
import ShipBuildingPanel from "../ShipBuildingPanel";
import AIReasoningPanel from "../AIReasoningPanel";
import TerritoryBonusPanel from "../TerritoryBonusPanel";
import QuickActionsBar from "../QuickActionsBar";
import GameEventLog from "../GameEventLog";
import ResourceBar from "../ResourceBar";
import ShipActionModal from "../ShipActionModal";
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
  const [showQuickActions, setShowQuickActions] = useState(false);

  const allShips = gameState.players
    ? gameState.players
        .flatMap((p) => p.ships || [])
        .filter((s) => s.health > 0)
    : [];
  const selectedShip = selectedShipId
    ? allShips.find((s) => s.id === selectedShipId)
    : null;

  const formatTime = (ms: number) => `${Math.floor(ms / 1000)}s`;

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
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* ===== TOP HUD BAR ===== */}
        <div className="flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2 bg-slate-900/80 border-b border-neon-cyan/30">
          {/* Turn Indicator */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`px-2 sm:px-3 py-1 rounded-full font-bold text-xs sm:text-sm ${
                isMyTurn
                  ? "bg-neon-cyan text-black"
                  : "bg-slate-700 text-gray-300"
              }`}
            >
              {isMyTurn
                ? "⚔️ You"
                : `⏳ ${currentPlayerName.slice(0, 8)}${currentPlayerName.length > 8 ? "..." : ""}`}
              <span className="hidden sm:inline">
                {isMyTurn ? "r Turn" : "'s Turn"}
              </span>
            </div>

            {/* Timer with Tooltip */}
            {isMyTurn && (
              <Tooltip
                content="Speed bonus: <5s = +100 | <10s = +50 | <15s = +25"
                position="bottom"
              >
                <div
                  className={`text-xs sm:text-sm font-mono cursor-help ${
                    decisionTimeMs < 5000
                      ? "text-green-400"
                      : decisionTimeMs < 10000
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  ⏱️ {formatTime(decisionTimeMs)}
                </div>
              </Tooltip>
            )}
          </div>

          {/* Game Info */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <span className="text-gray-400 hidden sm:inline">
              Turn {gameState.turnNumber}
            </span>
            <span className="text-neon-gold hidden md:inline">
              🏴‍☠️ {gameState.players.length} Pirates
            </span>
            {isPracticeMode && (
              <Tooltip
                content="Local game - connect wallet for on-chain battles"
                position="bottom"
              >
                <span className="bg-neon-purple/20 text-neon-purple px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs cursor-help border border-neon-purple/30">
                  ⚡ <span className="hidden sm:inline">Practice</span>
                </span>
              </Tooltip>
            )}
          </div>

          {/* Menu Toggle */}
          <Tooltip content="Game Menu (M)" position="bottom">
            <button
              onClick={() => {
                Haptic.light();
                setMenuOpen(!menuOpen);
              }}
              className={`p-3 rounded-lg transition-all min-w-[48px] min-h-[48px] ${
                menuOpen
                  ? "bg-neon-cyan text-black"
                  : "bg-slate-700 text-white hover:bg-slate-600"
              }`}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </Tooltip>
        </div>

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
              <ResourceBar
                resources={currentPlayer.resources}
                isCompact={true}
              />
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

          {/* FLOATING QUICK ACTIONS */}
          {isMyTurn && (
            <div className="absolute bottom-20 right-4 flex flex-col gap-2">
              {/* Toggle Button */}
              <button
                onClick={() => {
                  Haptic.light();
                  setShowQuickActions(!showQuickActions);
                }}
                className={`w-14 h-14 rounded-full shadow-lg transition-all flex items-center justify-center text-2xl ${
                  showQuickActions
                    ? "bg-neon-cyan text-black rotate-45"
                    : "bg-slate-800 text-white border border-neon-cyan/50 hover:bg-slate-700"
                }`}
                title="Quick Actions (Q)"
              >
                +
              </button>

              {/* Expanded Actions */}
              {showQuickActions && (
                <div className="flex flex-col gap-2 animate-in slide-in-from-bottom duration-200">
                  <button
                    onClick={() => {
                      Haptic.medium();
                      onCollectResources();
                      setShowQuickActions(false);
                    }}
                    className="w-16 h-16 rounded-full bg-neon-gold text-black shadow-lg hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-2xl"
                    title="Collect Resources (C)"
                  >
                    💰
                  </button>

                  <button
                    onClick={() => {
                      Haptic.light();
                      setActiveTab("build");
                      setMenuOpen(true);
                      setShowQuickActions(false);
                    }}
                    className="w-16 h-16 rounded-full bg-neon-purple text-white shadow-lg hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-2xl"
                    title="Build Ship (3)"
                  >
                    🔨
                  </button>

                  <button
                    onClick={() => {
                      Haptic.light();
                      setActiveTab("stats");
                      setMenuOpen(true);
                      setShowQuickActions(false);
                    }}
                    className="w-16 h-16 rounded-full bg-slate-700 text-white shadow-lg border border-slate-600 hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-2xl"
                    title="View Stats (1)"
                  >
                    📊
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== QUICK ACTIONS BAR ===== */}
        <QuickActionsBar
          onCollectAll={onCollectResources}
          onEndTurn={() => Promise.resolve(onEndTurn())}
          isMyTurn={isMyTurn}
          canUndo={false}
        />

        {/* ===== BOTTOM ACTION BAR ===== */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-t border-neon-cyan/30 gap-2">
          {/* Selected Ship Info */}
          <button
            onClick={() => {
              if (selectedShip) {
                Haptic.light();
                onShipClick(selectedShip);
              }
            }}
            className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-xl border border-neon-cyan/50 min-h-[48px] active:scale-95 transition-all flex-shrink-0"
          >
            {selectedShip ? (
              <>
                <span className="text-xl">🚢</span>
                <div className="text-left">
                  <div className="text-sm font-bold text-neon-cyan">
                    {selectedShip.type}
                  </div>
                  <div className="text-xs text-gray-400">
                    {selectedShip.health}/{selectedShip.maxHealth} HP
                  </div>
                </div>
              </>
            ) : (
              <span className="text-sm text-gray-400">Tap ship to select</span>
            )}
          </button>

          {/* Quick Stats */}
          <div className="flex items-center gap-3 text-sm flex-shrink-0">
            {currentPlayer && (
              <>
                <Tooltip content="Gold - Collect from treasure & territories">
                  <div className="flex flex-col items-center cursor-help">
                    <span className="text-lg">💰</span>
                    <span className="text-xs text-neon-gold font-bold">
                      {currentPlayer.resources.gold}
                    </span>
                  </div>
                </Tooltip>
                <Tooltip content="Active ships in your fleet">
                  <div className="flex flex-col items-center cursor-help">
                    <span className="text-lg">🚢</span>
                    <span className="text-xs text-neon-cyan font-bold">
                      {currentPlayer.ships.filter((s) => s.health > 0).length}
                    </span>
                  </div>
                </Tooltip>
                <Tooltip content="Territories you control">
                  <div className="flex flex-col items-center cursor-help">
                    <span className="text-lg">🏴‍☠️</span>
                    <span className="text-xs text-neon-magenta font-bold">
                      {currentPlayer.controlledTerritories.length}
                    </span>
                  </div>
                </Tooltip>
              </>
            )}
          </div>

          {/* End Turn Button */}
          {isMyTurn && (
            <button
              onClick={() => {
                Haptic.heavy();
                onEndTurn();
              }}
              className="bg-gradient-to-r from-neon-cyan to-neon-blue text-black font-bold px-5 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-neon-cyan/30 min-h-[48px] min-w-[120px] text-sm"
            >
              End Turn ⏭️
            </button>
          )}
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="hidden sm:flex justify-center gap-4 py-1 bg-slate-900/50 text-xs text-gray-500">
          <span>
            <kbd className="bg-slate-700 px-1 rounded">E</kbd> End Turn
          </span>
          <span>
            <kbd className="bg-slate-700 px-1 rounded">M</kbd> Menu
          </span>
          <span>
            <kbd className="bg-slate-700 px-1 rounded">Q</kbd> Quick Actions
          </span>
          <span>
            <kbd className="bg-slate-700 px-1 rounded">C</kbd> Collect
          </span>
          <span>
            <kbd className="bg-slate-700 px-1 rounded">Esc</kbd> Deselect
          </span>
        </div>

        {/* ===== SLIDE-IN MENU PANEL ===== */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />

            {/* Panel */}
            <div className="relative ml-auto w-full max-w-md bg-slate-900 border-l border-neon-cyan/30 overflow-y-auto animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-neon-cyan">Game Menu</h2>
                <button
                  onClick={() => {
                    Haptic.light();
                    setMenuOpen(false);
                  }}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
                >
                  ✕
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-slate-700">
                {(["stats", "actions", "build", "ai"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      if (tab === "ai" && onToggleAIReasoning) {
                        onToggleAIReasoning();
                        setMenuOpen(false);
                      }
                    }}
                    className={`flex-1 py-3 text-sm font-bold transition-all ${
                      activeTab === tab
                        ? "text-neon-cyan border-b-2 border-neon-cyan bg-slate-800/50"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {tab === "stats" && "📊 Stats"}
                    {tab === "actions" && "⚔️ Actions"}
                    {tab === "build" && "🔨 Build"}
                    {tab === "ai" && "🧠 AI"}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-4 space-y-4">
                {activeTab === "stats" && (
                  <>
                    <PlayerStats
                      players={gameState.players}
                      currentPlayerIndex={gameState.currentPlayerIndex}
                      gameStatus={gameState.gameStatus}
                      decisionTimeMs={decisionTimeMs}
                      scanChargesRemaining={scanChargesRemaining}
                      speedBonusAccumulated={speedBonusAccumulated}
                      averageDecisionTimeMs={averageDecisionTimeMs}
                      scannedCoordinates={scannedCoordinates}
                    />
                    <BattleInfoPanel gameState={gameState} />
                  </>
                )}

                {activeTab === "actions" && (
                  <>
                    <ResourceCollectionPanel
                      gameState={gameState}
                      currentPlayer={currentPlayer}
                      onCollectResources={onCollectResources}
                      isMyTurn={isMyTurn}
                    />
                    <PirateControls
                      gameState={gameState}
                      onCreateGame={onCreateGame}
                      onQuickStart={onQuickStart}
                      onStartGame={onStartGame}
                      onJoinGame={onJoinGame}
                      onShipAction={onShipAction}
                      onEndTurn={onEndTurn}
                      isCreating={isCreatingGame}
                      isJoining={isJoining}
                      joinError={joinError}
                      onClearJoinError={onClearJoinError}
                      selectedShipId={selectedShipId || undefined}
                      onShipSelect={onShipSelect}
                      onScanCoordinate={async () => {}}
                      decisionTimeMs={decisionTimeMs}
                      scanChargesRemaining={scanChargesRemaining}
                      speedBonusAccumulated={speedBonusAccumulated}
                      onPracticeMode={onPracticeMode}
                    />
                  </>
                )}

                {activeTab === "build" && (
                  <ShipBuildingPanel
                    gameState={gameState}
                    currentPlayer={currentPlayer}
                    onBuildShip={onBuildShip}
                    isMyTurn={isMyTurn}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

import { Tooltip } from "@/components/Tooltip";

export default DesktopGameLayout;
