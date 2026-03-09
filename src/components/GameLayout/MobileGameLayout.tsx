/**
 * MobileGameLayout
 * 
 * Mobile-optimized game layout with touch-friendly controls.
 * Features fixed HUD, bottom action bar, and slide-up menu.
 * 
 * @module components/GameLayout
 */

'use client';

import { useState } from 'react';
import PirateMap from '../PirateMap';
import PlayerStats from '../PlayerStats';
import { useMobileOptimized } from '@/hooks/useMobileOptimized';
import { Haptic } from '@/utils/haptics';
import { GameState, Player } from '@/types/game';

interface MobileGameLayoutProps {
  // Game state
  gameState: GameState;
  
  // Turn state
  isMyTurn: boolean;
  decisionTimeMs: number;
  currentPlayerName: string;
  
  // Player info
  currentPlayerPK?: string;
  currentPlayer: Player | null;
  
  // Skill mechanics
  scanChargesRemaining: number;
  speedBonusAccumulated: number;
  averageDecisionTimeMs: number;
  scannedCoordinates: string[];
  
  // Ship selection
  selectedShipId: string | null;
  
  // Actions
  onCellSelect: (coordinate: string) => void;
  onShipClick: (ship: any) => void;
  onEndTurn: () => void;
  onCollectResources: () => Promise<boolean>;
}

export function MobileGameLayout({
  gameState,
  isMyTurn,
  decisionTimeMs,
  currentPlayerName,
  currentPlayerPK,
  currentPlayer,
  scanChargesRemaining,
  speedBonusAccumulated,
  averageDecisionTimeMs,
  scannedCoordinates,
  selectedShipId,
  onCellSelect,
  onShipClick,
  onEndTurn,
  onCollectResources,
}: MobileGameLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { classes } = useMobileOptimized();
  
  const allShips = gameState.players 
    ? gameState.players.flatMap((p) => p.ships || []).filter((s) => s.health > 0)
    : [];
  
  const formatTime = (ms: number) => `${Math.floor(ms / 1000)}s`;

  return (
    <div className={`h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${classes.container}`}>
      {/* ===== MOBILE HUD ===== */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-neon-cyan/30">
        {/* Turn Indicator */}
        <div className={`px-3 py-1 rounded-full font-bold text-sm ${
          isMyTurn ? 'bg-neon-cyan text-black' : 'bg-slate-700 text-gray-300'
        }`}>
          {isMyTurn ? '⚔️ Your Turn' : `⏳ ${currentPlayerName.slice(0, 12)}`}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Timer */}
          {isMyTurn && (
            <div className={`text-sm font-mono ${
              decisionTimeMs < 5000 ? 'text-green-400' : 
              decisionTimeMs < 10000 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              ⏱️ {formatTime(decisionTimeMs)}
            </div>
          )}
          
          {/* Menu Toggle */}
          <button
            onClick={() => {
              Haptic.light();
              setMenuOpen(prev => !prev);
            }}
            className={`p-2 rounded-lg transition-all ${classes.button} ${
              menuOpen ? 'bg-neon-cyan text-black' : 'bg-slate-700 text-white'
            }`}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* ===== MAIN MAP AREA ===== */}
      <div className="flex-1 flex items-center justify-center p-2 relative">
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
      </div>

      {/* ===== BOTTOM ACTION BAR ===== */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-t border-neon-cyan/30">
        {/* Resources Display */}
        {currentPlayer && (
          <div className="flex space-x-3 text-xs">
            <span className="text-neon-gold">💰{currentPlayer.resources.gold}</span>
            <span className="text-neon-cyan">👥{currentPlayer.resources.crew}</span>
            <span className="text-neon-orange">📦{currentPlayer.resources.supplies}</span>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Scan Charges */}
          {scanChargesRemaining > 0 && (
            <div className="px-2 py-1 bg-neon-magenta bg-opacity-20 rounded text-xs text-neon-magenta">
              🔍 {scanChargesRemaining}
            </div>
          )}
          
          {/* End Turn Button */}
          {isMyTurn && (
            <button
              onClick={() => {
                Haptic.medium();
                onEndTurn();
              }}
              className={`px-4 py-2 bg-neon-cyan text-black rounded font-bold text-sm ${classes.button}`}
            >
              End Turn
            </button>
          )}
        </div>
      </div>

      {/* ===== MENU OVERLAY ===== */}
      {menuOpen && (
        <div className="absolute inset-0 z-50 bg-black bg-opacity-80 backdrop-blur-sm">
          <div className="absolute inset-x-0 bottom-0 bg-slate-900 border-t border-neon-cyan rounded-t-xl max-h-96 overflow-y-auto">
            <div className="p-4">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-neon-cyan">Game Menu</h3>
                <button 
                  onClick={() => {
                    Haptic.light();
                    setMenuOpen(false);
                  }} 
                  className="text-neon-cyan"
                >
                  ✕
                </button>
              </div>
              
              {/* Content */}
              {currentPlayer && (
                <div className="space-y-3">
                  {/* Player Stats */}
                  <PlayerStats
                    players={gameState.players}
                    currentPlayerIndex={gameState.currentPlayerIndex}
                    gameStatus={gameState.gameStatus}
                    winner={gameState.winner}
                    scanChargesRemaining={scanChargesRemaining}
                    speedBonusAccumulated={speedBonusAccumulated}
                    averageDecisionTimeMs={averageDecisionTimeMs}
                  />
                  
                  {/* Quick Actions */}
                  {isMyTurn && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          Haptic.medium();
                          onCollectResources();
                          setMenuOpen(false);
                        }}
                        className={`p-3 bg-neon-gold text-black rounded font-bold ${classes.button}`}
                      >
                        💰 Collect
                      </button>
                      <button
                        onClick={() => {
                          Haptic.light();
                          setMenuOpen(false);
                        }}
                        className={`p-3 bg-slate-700 text-white rounded font-bold ${classes.button}`}
                      >
                        🏗️ Build
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileGameLayout;
