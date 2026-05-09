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
import PlayerStats from '../PlayerStats';
import BattleInfoPanel from '../BattleInfoPanel';
import ResourceCollectionPanel from '../ResourceCollectionPanel';
import PirateControls from '../PirateControls';
import ShipBuildingPanel from '../ShipBuildingPanel';
import AIReasoningPanel from '../AIReasoningPanel';
import TerritoryBonusPanel from '../TerritoryBonusPanel';
import GameEventLog from '../GameEventLog';
import ResourceBar from '../ResourceBar';
import ShipActionModal from '../ShipActionModal';
import QuickActionsBar from '../QuickActionsBar';
import { useMobileOptimized } from '@/hooks/useMobileOptimized';
import { Haptic } from '@/utils/haptics';
import { GameState, Ship, Player } from '@/types/game';
import { Tooltip } from '@/components/Tooltip';

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
  onBuildShip,
  aiReasoning,
  showAIReasoning,
  onToggleAIReasoning,
  onPracticeMode,
  onOpenLeaderboard,
}: MobileGameLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'actions' | 'build' | 'ai'>('stats');
  const { classes } = useMobileOptimized();
  
  const allShips = gameState.players 
    ? gameState.players.flatMap((p) => p.ships || []).filter((s) => s.health > 0)
    : [];
    
  const selectedShip = selectedShipId ? allShips.find(s => s.id === selectedShipId) : null;
  
  const formatTime = (ms: number) => `${Math.floor(ms / 1000)}s`;

  return (
    <div className={`h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden ${classes.container}`}>
      {/* Ship Action Modal */}
      {shipActionModalShip && (
        <ShipActionModal
          ship={shipActionModalShip}
          isOpen={true}
          onClose={onCloseShipActionModal}
          onAction={(action) => onShipAction(shipActionModalShip.id, action)}
        />
      )}

      {/* ===== MOBILE HUD ===== */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/95 border-b border-neon-cyan/30 z-40">
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full font-bold text-xs ${
            isMyTurn ? 'bg-neon-cyan text-black' : 'bg-slate-700 text-gray-300'
          }`}>
            {isMyTurn ? '⚔️ You' : `⏳ ${currentPlayerName.slice(0, 8)}`}
          </div>
          
          {isMyTurn && (
            <div className={`text-xs font-mono ${
              decisionTimeMs < 5000 ? 'text-green-400' : 
              decisionTimeMs < 10000 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              ⏱️ {formatTime(decisionTimeMs)}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isPracticeMode && (
            <span className="bg-neon-purple/20 text-neon-purple px-2 py-0.5 rounded text-[10px] border border-neon-purple/30">
              ⚡ Practice
            </span>
          )}
          
          <button
            onClick={() => {
              Haptic.light();
              setMenuOpen(prev => !prev);
            }}
            className={`p-2 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
              menuOpen ? 'bg-neon-cyan text-black' : 'bg-slate-700 text-white'
            }`}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
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
            <ResourceBar resources={currentPlayer.resources} isCompact={true} />
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

      {/* Quick Actions (Floating above bottom bar) */}
      <QuickActionsBar 
        onCollectAll={onCollectResources}
        onEndTurn={() => Promise.resolve(onEndTurn())}
        isMyTurn={isMyTurn}
        canUndo={false}
      />

      {/* ===== BOTTOM ACTION BAR ===== */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/95 border-t border-neon-cyan/30 z-40 gap-2">
        {/* Selected Ship Mini-Info */}
        <button
          onClick={() => {
            if (selectedShip) {
              Haptic.light();
              onShipClick(selectedShip);
            }
          }}
          className="flex-1 flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-neon-cyan/30 min-h-[48px]"
        >
          <span className="text-xl">🚢</span>
          <div className="text-left overflow-hidden">
            <div className="text-[10px] font-bold text-neon-cyan truncate">
              {selectedShip ? selectedShip.type.toUpperCase() : 'NO SHIP'}
            </div>
            <div className="text-[10px] text-gray-400">
              {selectedShip ? `${selectedShip.health} HP` : 'Tap to select'}
            </div>
          </div>
        </button>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isMyTurn ? (
            <button
              onClick={() => {
                Haptic.heavy();
                onEndTurn();
              }}
              className="px-4 py-3 bg-gradient-to-r from-neon-cyan to-neon-blue text-black rounded-lg font-bold text-sm shadow-lg shadow-neon-cyan/20 active:scale-95 transition-all min-h-[48px]"
            >
              End Turn ⏭️
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg text-[10px] text-gray-400 border border-slate-700">
              <span className="animate-pulse">⏳</span> Waiting...
            </div>
          )}
        </div>
      </div>

      {/* ===== SLIDE-UP MENU OVERLAY ===== */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          
          {/* Panel */}
          <div className="relative bg-slate-900 border-t border-neon-cyan/50 rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Header / Handle */}
            <div className="w-full flex flex-col items-center pt-2 pb-4 border-b border-slate-800">
              <div className="w-12 h-1.5 bg-slate-700 rounded-full mb-4" />
              <div className="w-full px-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-neon-cyan">Battle Station</h3>
                <button 
                  onClick={() => {
                    Haptic.light();
                    setMenuOpen(false);
                  }} 
                  className="w-10 h-10 flex items-center justify-center bg-slate-800 rounded-full text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900/50">
              {(['stats', 'actions', 'build', 'ai'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab === 'ai' && onToggleAIReasoning) {
                      onToggleAIReasoning();
                      setMenuOpen(false);
                    }
                  }}
                  className={`flex-1 py-4 text-xs font-bold transition-all ${
                    activeTab === tab 
                      ? 'text-neon-cyan border-b-2 border-neon-cyan bg-slate-800/30' 
                      : 'text-gray-500'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
            
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
              {activeTab === 'stats' && (
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
              
              {activeTab === 'actions' && (
                <>
                  <ResourceCollectionPanel
                    gameState={gameState}
                    currentPlayer={currentPlayer}
                    onCollectResources={onCollectResources}
                    isMyTurn={isMyTurn}
                  />
                  <PirateControls
                    gameState={gameState}
                    onCreateGame={() => {}} // Not applicable mid-game
                    onQuickStart={() => {}} // Not applicable mid-game
                    onStartGame={async () => {}} // Not applicable mid-game
                    onJoinGame={async () => false} // Not applicable mid-game
                    onShipAction={onShipAction}
                    onEndTurn={onEndTurn}
                    isCreating={false}
                    isJoining={false}
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
              
              {activeTab === 'build' && (
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
  );
}

export default MobileGameLayout;
