'use client';

import { Player } from '../types/game';
import { useWallet } from '@solana/wallet-adapter-react';

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
    return player.points + player.bankedPoints;
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

  const getPlayerBadges = (player: Player): JSX.Element[] => {
    const badges: JSX.Element[] = [];
    
    if (player.hasElf) {
      badges.push(
        <span key="elf" className="inline-block bg-neon-cyan bg-opacity-20 text-neon-cyan px-3 py-1 rounded text-xs font-mono font-bold border border-neon-cyan border-opacity-50">
          🧝 SHIELD
        </span>
      );
    }
    
    if (player.hasBauble) {
      badges.push(
        <span key="bauble" className="inline-block bg-neon-magenta bg-opacity-20 text-neon-magenta px-3 py-1 rounded text-xs font-mono font-bold border border-neon-magenta border-opacity-50">
          🔮 REFLECT
        </span>
      );
    }
    
    return badges;
  };

  return (
    <div className="pirate-card">
      <div className="mb-6 text-center border-b border-neon-cyan border-opacity-30 pb-4">
        <h3 className="text-xl font-bold font-tech text-neon-magenta">
          ▶ PILOT.STATUS
        </h3>
        {gameStatus === 'active' && (
          <p className="text-sm text-neon-cyan font-mono mt-2">
            &gt; ACTIVE PILOT: {getPlayerDisplayName(players[currentPlayerIndex])}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {players.map((player, index) => (
          <div
            key={player.publicKey}
            className={`p-4 rounded-lg border-2 transition-all ${
              isCurrentPlayer(index)
                ? 'border-neon-cyan bg-neon-cyan bg-opacity-10 animate-glow-pulse'
                : 'border-neon-magenta border-opacity-30 bg-neon-magenta bg-opacity-5'
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

            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div className="bg-neon-cyan bg-opacity-5 p-2 rounded border border-neon-cyan border-opacity-20">
                <div className="text-xs text-neon-cyan font-mono uppercase mb-1">Live Points</div>
                <div className="text-lg font-bold text-neon-cyan font-tech">
                  {player.points.toLocaleString()}
                </div>
              </div>
              
              <div className="bg-neon-magenta bg-opacity-5 p-2 rounded border border-neon-magenta border-opacity-20">
                <div className="text-xs text-neon-magenta font-mono uppercase mb-1">Banked</div>
                <div className="text-lg font-bold text-neon-magenta font-tech">
                  {player.bankedPoints.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neon-cyan border-opacity-20">
              <div className="flex items-center justify-between">
                <span className="text-neon-cyan text-xs font-mono font-bold">TOTAL SCORE:</span>
                <span className="text-xl font-bold text-neon-orange font-tech">
                  {getTotalScore(player).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Player abilities/badges */}
            {(player.hasElf || player.hasBauble) && (
              <div className="mt-3 pt-3 border-t border-neon-cyan border-opacity-20">
                <div className="text-xs text-neon-orange font-mono font-bold mb-2">ACTIVE MODULES:</div>
                <div className="flex gap-2">{getPlayerBadges(player)}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Game status indicator */}
      <div className="mt-6 pt-4 border-t border-neon-cyan border-opacity-30">
        <div className="text-xs text-neon-cyan font-mono font-bold mb-2 uppercase">SYSTEM STATUS</div>
        <div className={`p-3 rounded-lg text-center font-mono border-2 ${
          gameStatus === 'waiting' ? 'border-neon-orange bg-neon-orange bg-opacity-10 text-neon-orange' :
          gameStatus === 'active' ? 'border-neon-cyan bg-neon-cyan bg-opacity-10 text-neon-cyan' :
          'border-neon-magenta bg-neon-magenta bg-opacity-10 text-neon-magenta'
        }`}>
          <div className="text-sm font-bold">
            {gameStatus === 'waiting' && '▲ AWAITING PLAYERS'}
            {gameStatus === 'active' && '◆ BATTLE ACTIVE'}
            {gameStatus === 'completed' && '★ VICTOR CROWNED'}
          </div>
        </div>
      </div>
    </div>
  );
}