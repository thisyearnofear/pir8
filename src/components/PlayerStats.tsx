'use client';

import { Player } from '../types/game';
import { useWallet } from '@solana/wallet-adapter-react';
import { SHIP_EMOJIS, TERRITORY_EMOJIS } from '../utils/constants';

interface PlayerStatsProps {
  players: Player[];
  currentPlayerIndex: number;
  gameStatus: 'waiting' | 'active' | 'completed';
  winner?: string;
}

export default function PlayerStats({ 
  players, 
  currentPlayerIndex, 
  gameStatus, 
  winner 
}: PlayerStatsProps) {
  const { publicKey } = useWallet();

  const getTotalScore = (player: Player): number => {
    return player.totalScore;
  };

  const getActiveShipCount = (player: Player): number => {
    return player.ships.filter(ship => ship.health > 0).length;
  };

  const getTotalFleetHealth = (player: Player): number => {
    return player.ships.reduce((total, ship) => total + ship.health, 0);
  };

  const getPlayerDisplayName = (player: Player): string => {
    if (player.username) return player.username;
    return `${player.publicKey.slice(0, 4)}...${player.publicKey.slice(-4)}`;
  };

  const isCurrentPlayer = (index: number): boolean => {
    return index === currentPlayerIndex && gameStatus === 'active';
  };

  const isMyPlayer = (player: Player): boolean => {
    return publicKey?.toString() === player.publicKey;
  };

  const getFleetSummary = (player: Player): JSX.Element[] => {
    const ships: JSX.Element[] = [];
    
    // Group ships by type
    const shipCounts: Record<string, number> = {};
    player.ships.forEach(ship => {
      if (ship.health > 0) {
        shipCounts[ship.type] = (shipCounts[ship.type] || 0) + 1;
      }
    });
    
    Object.entries(shipCounts).forEach(([shipType, count]) => {
      ships.push(
        <span key={shipType} className="inline-flex items-center bg-neon-blue bg-opacity-20 text-neon-blue px-2 py-1 rounded text-xs font-mono font-bold border border-neon-blue border-opacity-50">
          {SHIP_EMOJIS[shipType as keyof typeof SHIP_EMOJIS]} {count}
        </span>
      );
    });
    
    return ships;
  };

  return (
    <div className="player-stats-scanner">
      <div className="corner-tl"></div>
      <div className="corner-tr"></div>
      <div className="corner-bl"></div>
      <div className="corner-br"></div>
      
      <div className="mb-6 text-center border-b border-neon-cyan border-opacity-30 pb-4">
        <h3 className="text-xl font-bold font-tech holographic-text">
          ⚓ CAPTAIN.STATUS
        </h3>
        {gameStatus === 'active' && (
          <p className="text-sm text-neon-cyan font-mono mt-2 animate-glow-pulse">
            &gt; ACTIVE CAPTAIN: {getPlayerDisplayName(players[currentPlayerIndex])}
          </p>
        )}
        <div className="scanner-line mt-2"></div>
      </div>

      <div className="space-y-3">
        {players.map((player, index) => (
          <div
            key={player.publicKey}
            className={`player-card-enhanced ${
              isCurrentPlayer(index) ? 'current-player' : ''
            } ${
              winner === player.publicKey ? 'winner' : ''
            } ${
              isMyPlayer(player) ? 'ring-2 ring-neon-orange' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {isMyPlayer(player) ? '◆' : '◇'}
                </span>
                <span className="font-bold font-tech text-neon-cyan">
                  {getPlayerDisplayName(player)}
                  {isMyPlayer(player) && <span className="text-neon-orange ml-1 text-xs">[YOU]</span>}
                </span>
                {winner === player.publicKey && (
                  <span className="text-neon-gold text-sm font-bold animate-glow-pulse ml-2">★ VICTOR ★</span>
                )}
              </div>
              
              {isCurrentPlayer(index) && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse"></div>
                  <span className="text-xs text-neon-cyan font-mono font-bold">ACTIVE</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="score-display">
                <div className="score-label">FLEET SHIPS</div>
                <div className="score-value text-neon-cyan">
                  {getActiveShipCount(player)}/{player.ships.length}
                </div>
              </div>
              
              <div className="score-display">
                <div className="score-label">TERRITORIES</div>
                <div className="score-value text-neon-magenta">
                  {player.controlledTerritories.length}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="score-display">
                <div className="score-label">💰 GOLD</div>
                <div className="score-value text-neon-gold">
                  {player.resources.gold.toLocaleString()}
                </div>
              </div>
              
              <div className="score-display">
                <div className="score-label">👥 CREW</div>
                <div className="score-value text-neon-blue">
                  {player.resources.crew}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neon-cyan border-opacity-20">
              <div className="flex items-center justify-between">
                <span className="text-neon-cyan text-xs font-mono font-bold">DOMINANCE SCORE:</span>
                <span className="text-xl font-bold text-neon-orange font-tech">
                  {getTotalScore(player).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Fleet summary */}
            {getActiveShipCount(player) > 0 && (
              <div className="mt-3 pt-3 border-t border-neon-cyan border-opacity-20">
                <div className="text-xs text-neon-orange font-mono font-bold mb-2">ACTIVE FLEET:</div>
                <div className="flex gap-2 flex-wrap">{getFleetSummary(player)}</div>
              </div>
            )}

            {/* Fleet health indicator */}
            <div className="mt-3 pt-3 border-t border-neon-cyan border-opacity-20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-neon-cyan text-xs font-mono font-bold">FLEET HEALTH:</span>
                <span className="text-sm font-bold text-neon-green font-tech">
                  {getTotalFleetHealth(player)}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-neon-green to-neon-cyan h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, (getTotalFleetHealth(player) / (player.ships.length * 100)) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Game status indicator */}
      <div className="mt-6 pt-4 border-t border-neon-cyan border-opacity-30">
        <div className="text-xs text-neon-cyan font-mono font-bold mb-2 uppercase">BATTLE STATUS</div>
        <div className={`p-3 rounded-lg text-center font-mono border-2 ${
          gameStatus === 'waiting' ? 'border-neon-orange bg-neon-orange bg-opacity-10 text-neon-orange' :
          gameStatus === 'active' ? 'border-neon-cyan bg-neon-cyan bg-opacity-10 text-neon-cyan' :
          'border-neon-magenta bg-neon-magenta bg-opacity-10 text-neon-magenta'
        }`}>
          <div className="text-sm font-bold">
            {gameStatus === 'waiting' && '⚓ ASSEMBLING CREW'}
            {gameStatus === 'active' && '⚔️ BATTLE IN PROGRESS'}
            {gameStatus === 'completed' && '🏴‍☠️ PIRATE KING CROWNED'}
          </div>
        </div>
      </div>
    </div>
  );
}