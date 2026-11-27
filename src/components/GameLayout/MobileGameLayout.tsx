/**
 * MobileGameLayout
 * 
 * Mobile-optimized game layout with touch-friendly controls.
 * Features fixed HUD, bottom action bar, and slide-up menu.
 * Following: CLEAN separation, MODULAR architecture, PREVENT BLOAT
 * 
 * @module components/GameLayout
 */

'use client';

import { useState } from 'react';
import PirateMap from '../PirateMap';
import AIReasoningPanel from '../AIReasoningPanel';
import TerritoryBonusPanel from '../TerritoryBonusPanel';
import GameEventLog from '../GameEventLog';
import ShipActionModal from '../ShipActionModal';
import InstrumentStrip from '../hud/InstrumentStrip';
import ActionRail from '../hud/ActionRail';
import MenuDrawer from '../hud/MenuDrawer';
import { useMobileOptimized } from '@/hooks/useMobileOptimized';
import { Haptic } from '@/utils/haptics';
import { GameState, Ship, Player } from '@/types/game';

interface MobileGameLayoutProps {
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
  onShipAction: (shipId: string, action: 'move' | 'attack' | 'claim' | 'collect' | 'build') => void;
  onCloseShipActionModal: () => void;
  onEndTurn: () => void;
  onCollectResources: () => Promise<boolean>;
  onScanCoordinate?: (x: number, y: number) => Promise<void>;
  onBuildShip: (shipType: string, portX: number, portY: number) => Promise<boolean>;
  
  // AI Reasoning
  aiReasoning?: any;
  showAIReasoning?: boolean;
  onToggleAIReasoning?: () => void;

  // Lobby/Victory actions
  onNewGame: () => void;
  onReturnToLobby: () => void;
  onPracticeMode: () => void;
  onOpenLeaderboard: () => void;
  onOpenReferral: () => void;
}

export function MobileGameLayout({
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
  onScanCoordinate,
  onBuildShip,
  aiReasoning,
  showAIReasoning,
  onToggleAIReasoning,
  onPracticeMode,
  onOpenLeaderboard: _onOpenLeaderboard,
  onOpenReferral: _onOpenReferral,
}: MobileGameLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'actions' | 'build' | 'ai'>('stats');
  const { classes } = useMobileOptimized();
  
  const allShips = gameState.players 
    ? gameState.players.flatMap((p) => p.ships || []).filter((s) => s.health > 0)
    : [];
    
  const selectedShip = selectedShipId ? allShips.find(s => s.id === selectedShipId) : null;
  
  return (
    <div className={`h-screen flex flex-col bg-[var(--p8-ink)] overflow-hidden ${classes.container}`}>
      {/* Ship Action Modal */}
      {shipActionModalShip && (
        <ShipActionModal
          ship={shipActionModalShip}
          isOpen={true}
          onClose={onCloseShipActionModal}
          onAction={(action) => onShipAction(shipActionModalShip.id, action)}
        />
      )}

      {/* ===== INSTRUMENT STRIP =====
          The same brass rail as the desktop table, restowed for a narrow
          cabin — density changes inside the strip, the instrument does not
          fork (DESIGN.md §9). */}
      <div className="relative z-40">
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
            setMenuOpen(prev => !prev);
          }}
        />
      </div>

      {/* ===== MAIN MAP AREA ===== */}
      <div className="flex-1 flex items-center justify-center relative bg-slate-950 overflow-hidden">
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

        {/* AI Reasoning Panel (Slide-out) */}
        <AIReasoningPanel
          reasoning={aiReasoning || null}
          isVisible={!!showAIReasoning}
          onClose={onToggleAIReasoning}
          showHints={isPracticeMode}
        />

        {/* Floating Components - Left */}
        {currentPlayer && (
          <div className="absolute top-2 left-2 z-30 flex flex-col gap-2 max-w-[140px]">
            <GameEventLog events={gameState.eventLog} maxVisible={3} isCompact={true} />
          </div>
        )}

        {/* Territory Bonus - Right */}
        {currentPlayer && (
          <div className="absolute top-2 right-2 z-30">
            <TerritoryBonusPanel 
              player={currentPlayer} 
              gameState={gameState} 
              isCompact={true} 
            />
          </div>
        )}
      </div>

      {/* ===== ACTION RAIL =====
          The same rail as the desktop table — plaque, stowed disposition,
          single End Turn lever. No fork (DESIGN.md §9). */}
      <div className="relative z-40">
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
      </div>

      {/* ===== CAPTAIN'S LEDGER =====
          The same drawer as the desktop table — bottom sheet here, starboard
          panel there. One component, no fork. */}
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
          onScanCoordinate={onScanCoordinate}
        onBuildShip={onBuildShip}
        onPracticeMode={onPracticeMode}
        onToggleAIReasoning={onToggleAIReasoning}
      />

    </div>
  );
}

export default MobileGameLayout;
