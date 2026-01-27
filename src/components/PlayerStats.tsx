'use client';

import { Player } from '../types/game';
import { useWallet } from '@solana/wallet-adapter-react';
import { SHIP_EMOJIS } from '../utils/constants';

interface PlayerStatsProps {
  players: Player[];
  currentPlayerIndex: number;
  gameStatus: 'waiting' | 'active' | 'completed';
  winner?: string;
  decisionTimeMs?: number;
  scanChargesRemaining?: number;
  speedBonusAccumulated?: number;
  averageDecisionTimeMs?: number;
  scannedCoordinates?: string[];
}

export default function PlayerStats({
  players,
  currentPlayerIndex,
  gameStatus,
  winner,
  decisionTimeMs = 0,
  scanChargesRemaining = 3,
  speedBonusAccumulated = 0,
  averageDecisionTimeMs: _averageDecisionTimeMs = 0,
  scannedCoordinates: _scannedCoordinates = []
}: PlayerStatsProps) {
  const { publicKey } = useWallet();

  const getTotalScore = (player: Player): number => {
    return player.totalScore;
  };

  const formatDecisionTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    return `${seconds}.${String(Math.floor(milliseconds / 10)).padStart(2, '0')}s`;
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

  const getFleetSummary = (player: Player): React.ReactElement[] => {
    const ships: React.ReactElement[] = [];

    // Group ships by type
    const shipCounts: Record<string, number> = {};
    player.ships.forEach(ship => {
      if (ship.health > 0) {
        shipCounts[ship.type] = (shipCounts[ship.type] || 0) + 1;
      }
    });

    Object.entries(shipCounts).forEach(([shipType, count]) => {
      ships.push(
        <span key={shipType} className="inline-flex items-center bg-neon-blue/20 text-neon-blue 
                                        px-3 py-1 rounded-full text-xs font-mono font-bold 
                                        border border-neon-blue/50 hover:bg-neon-blue/30 transition-all">
          {SHIP_EMOJIS[shipType as keyof typeof SHIP_EMOJIS]} {count}
        </span>
      );
    });

    return ships;
  };

  const getPlayerRank = (player: Player): number => {
    const sortedPlayers = [...players].sort((a, b) => getTotalScore(b) - getTotalScore(a));
    return sortedPlayers.findIndex(p => p.publicKey === player.publicKey) + 1;
  };

  const getRankEmoji = (rank: number): string => {
    switch (rank) {
      case 1: return '👑';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '⚓';
    }
  };

  return (
    <div className="player-stats-scanner bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 
                    rounded-2xl border-2 border-neon-cyan/50 p-6 relative overflow-hidden
                    shadow-2xl shadow-neon-cyan/20">

      {/* Animated background elements */}
      <div className="absolute top-4 right-4 w-20 h-20 bg-neon-cyan/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-4 left-4 w-16 h-16 bg-neon-gold/10 rounded-full blur-lg animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/3 w-12 h-12 bg-neon-magenta/10 rounded-full blur-md animate-pulse delay-500"></div>

      {/* Header Section - Enhanced */}
      <div className="relative mb-6 text-center border-b border-neon-cyan/30 pb-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="text-4xl animate-pulse filter drop-shadow-2xl">⚓</div>
          <h3 className="text-2xl font-black text-transparent bg-clip-text 
                         bg-gradient-to-r from-neon-cyan via-neon-gold to-neon-cyan">
            CAPTAIN STATUS
          </h3>
          <div className="text-4xl animate-pulse filter drop-shadow-2xl">⚓</div>
        </div>

        {gameStatus === 'active' && (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-neon-cyan/20 to-neon-gold/20 
                            rounded-xl p-4 border border-neon-cyan/30 backdrop-blur-sm">
              <p className="text-lg font-bold text-neon-cyan mb-2 flex items-center justify-center gap-2">
                <span className="animate-pulse">🏴‍☠️</span>
                ACTIVE CAPTAIN: {players[currentPlayerIndex] ? getPlayerDisplayName(players[currentPlayerIndex]) : 'Unknown'}
              </p>

              {/* Enhanced Skill Metrics */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-slate-800/60 rounded-lg p-3 border border-neon-magenta/30">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-neon-cyan font-mono font-bold">DECISION TIME:</span>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${decisionTimeMs < 5000 ? 'bg-green-400' :
                        decisionTimeMs < 10000 ? 'bg-yellow-400' : 'bg-red-500'
                        }`}></div>
                      <span className="text-neon-gold font-bold">{formatDecisionTime(decisionTimeMs)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${decisionTimeMs < 5000 ? 'bg-green-400' :
                      decisionTimeMs < 10000 ? 'bg-yellow-400' : 'bg-red-500'
                      }`} style={{ width: `${Math.min(100, (decisionTimeMs / 30000) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="bg-slate-800/60 rounded-lg p-3 border border-neon-magenta/30">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-neon-cyan font-mono font-bold">SCAN CHARGES:</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i < scanChargesRemaining ? 'bg-neon-magenta' : 'bg-gray-600'
                          }`}></div>
                      ))}
                      <span className={`font-bold ml-1 ${scanChargesRemaining > 0 ? 'text-neon-magenta' : 'text-red-500'
                        }`}>
                        {scanChargesRemaining}
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-neon-green font-bold">+{speedBonusAccumulated} pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Players List - Enhanced */}
      <div className="space-y-4">
        {players.map((player, index) => {
          const rank = getPlayerRank(player);
          const isActive = isCurrentPlayer(index);
          const isMe = isMyPlayer(player);

          return (
            <div
              key={player.publicKey}
              className={`player-card relative bg-gradient-to-br from-slate-800/90 to-slate-700/90 
                         rounded-xl p-5 border-2 transition-all duration-300 hover:scale-[1.02]
                         ${isActive ? 'border-neon-cyan shadow-lg shadow-neon-cyan/30 animate-pulse' :
                  winner === player.publicKey ? 'border-neon-gold shadow-lg shadow-neon-gold/30' :
                    isMe ? 'border-neon-orange shadow-lg shadow-neon-orange/20' :
                      'border-slate-600 hover:border-slate-500'}`}
            >
              {/* Rank Badge */}
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-neon-gold to-neon-orange 
                              text-black font-black text-xs px-3 py-1 rounded-full border-2 border-neon-gold">
                {getRankEmoji(rank)} #{rank}
              </div>

              {/* Player Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`text-2xl ${isMe ? 'animate-pulse' : ''}`}>
                    {isMe ? '👑' : '🏴‍☠️'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg text-neon-cyan">
                        {getPlayerDisplayName(player)}
                      </span>
                      {isMe && (
                        <span className="bg-neon-orange/20 text-neon-orange px-2 py-1 rounded-full text-xs font-bold border border-neon-orange/50">
                          YOU
                        </span>
                      )}
                    </div>
                    {winner === player.publicKey && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-neon-gold text-sm font-black animate-pulse">
                          ⭐ PIRATE KING ⭐
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {isActive && (
                  <div className="flex items-center gap-2 bg-neon-cyan/20 rounded-full px-3 py-1 border border-neon-cyan/50">
                    <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse"></div>
                    <span className="text-xs text-neon-cyan font-bold">ACTIVE</span>
                  </div>
                )}
              </div>

              {/* Stats Grid - Enhanced */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-900/60 rounded-lg p-3 text-center border border-neon-cyan/30">
                  <div className="text-2xl mb-1">🚢</div>
                  <div className="text-xl font-black text-neon-cyan">
                    {getActiveShipCount(player)}/{player.ships.length}
                  </div>
                  <div className="text-xs text-gray-400">Fleet Ships</div>
                </div>

                <div className="bg-slate-900/60 rounded-lg p-3 text-center border border-neon-magenta/30">
                  <div className="text-2xl mb-1">🏴‍☠️</div>
                  <div className="text-xl font-black text-neon-magenta">
                    {player.controlledTerritories.length}
                  </div>
                  <div className="text-xs text-gray-400">Territories</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-900/60 rounded-lg p-3 text-center border border-neon-gold/30">
                  <div className="text-2xl mb-1">💰</div>
                  <div className="text-lg font-black text-neon-gold">
                    {player.resources.gold.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">Gold</div>
                </div>

                <div className="bg-slate-900/60 rounded-lg p-3 text-center border border-neon-blue/30">
                  <div className="text-2xl mb-1">👥</div>
                  <div className="text-lg font-black text-neon-blue">
                    {player.resources.crew}
                  </div>
                  <div className="text-xs text-gray-400">Crew</div>
                </div>
              </div>

              {/* Dominance Score - Enhanced */}
              <div className="bg-gradient-to-r from-neon-orange/20 to-neon-gold/20 
                              rounded-lg p-3 border border-neon-gold/50 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-neon-cyan text-sm font-bold flex items-center gap-2">
                    <span className="text-lg">🏆</span>
                    DOMINANCE SCORE
                  </span>
                  <span className="text-2xl font-black text-neon-gold drop-shadow-lg">
                    {getTotalScore(player).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Fleet Summary - Enhanced */}
              {getActiveShipCount(player) > 0 && (
                <div className="bg-slate-900/40 rounded-lg p-3 border border-neon-blue/30">
                  <div className="text-sm text-neon-orange font-bold mb-2 flex items-center gap-2">
                    <span className="text-lg">⚓</span>
                    ACTIVE FLEET
                  </div>
                  <div className="flex gap-2 flex-wrap">{getFleetSummary(player)}</div>
                </div>
              )}

              {/* Fleet Health Bar - Enhanced */}
              <div className="mt-3 bg-slate-900/40 rounded-lg p-3 border border-neon-green/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-neon-cyan text-sm font-bold flex items-center gap-2">
                    <span className="text-lg">❤️</span>
                    FLEET HEALTH
                  </span>
                  <span className="text-lg font-black text-neon-green">
                    {getTotalFleetHealth(player)}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 border border-gray-600">
                  <div
                    className="bg-gradient-to-r from-neon-green via-neon-cyan to-neon-green 
                               h-3 rounded-full transition-all duration-500 relative overflow-hidden"
                    style={{
                      width: `${Math.min(100, (getTotalFleetHealth(player) / (player.ships.length * 100)) * 100)}%`
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent 
                                    animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Game Status Indicator - Enhanced */}
      <div className="mt-6 pt-6 border-t border-neon-cyan/30">
        <div className="text-center">
          <div className="text-sm text-neon-cyan font-bold mb-3 flex items-center justify-center gap-2">
            <span className="text-lg">⚔️</span>
            BATTLE STATUS
          </div>

          <div className={`relative p-4 rounded-xl text-center font-black border-2 overflow-hidden ${gameStatus === 'waiting' ? 'border-neon-gold bg-gradient-to-r from-neon-orange via-neon-gold to-neon-orange text-black' :
            gameStatus === 'active' ? 'border-neon-cyan bg-gradient-to-r from-neon-cyan to-neon-blue text-black' :
              'border-neon-magenta bg-gradient-to-r from-neon-magenta to-purple-600 text-white'
            }`}>

            {/* Animated background shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                            translate-x-[-100%] animate-pulse"></div>

            <div className="relative text-lg drop-shadow-lg">
              {gameStatus === 'waiting' && (
                <div className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⚓</span>
                  ASSEMBLING CREW
                </div>
              )}
              {gameStatus === 'active' && (
                <div className="flex items-center justify-center gap-2">
                  <span className="animate-pulse">⚔️</span>
                  BATTLE IN PROGRESS
                </div>
              )}
              {gameStatus === 'completed' && (
                <div className="flex items-center justify-center gap-2">
                  <span className="animate-bounce">👑</span>
                  PIRATE KING CROWNED
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}