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
        <span key="elf" className="inline-block bg-green-600 text-white px-2 py-1 rounded text-xs mr-1">
          🧝 Shield
        </span>
      );
    }
    
    if (player.hasBauble) {
      badges.push(
        <span key="bauble" className="inline-block bg-purple-600 text-white px-2 py-1 rounded text-xs mr-1">
          🔮 Reflect
        </span>
      );
    }
    
    return badges;
  };

  return (
    <div className="pirate-card">
      <div className="mb-4 text-center">
        <h3 className="text-xl font-bold text-pirate-gold font-maritime">
          ⚔️ Crew Status ⚔️
        </h3>
        {gameStatus === 'active' && (
          <p className="text-sm text-gray-300 mt-1">
            Current Turn: {getPlayerDisplayName(players[currentPlayerIndex])}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {players.map((player, index) => (
          <div
            key={player.publicKey}
            className={`p-4 rounded-lg border-2 transition-all ${
              isCurrentPlayer(index)
                ? 'border-pirate-gold bg-pirate-gold bg-opacity-20 animate-treasure-glow'
                : 'border-gray-600 bg-black bg-opacity-30'
            } ${
              isMyPlayer(player) ? 'ring-2 ring-blue-400' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {isMyPlayer(player) ? '👑' : '🏴‍☠️'}
                </span>
                <span className="font-bold text-white">
                  {getPlayerDisplayName(player)}
                  {isMyPlayer(player) && <span className="text-blue-400 ml-1">(You)</span>}
                </span>
                {winner === player.publicKey && (
                  <span className="text-pirate-gold text-lg animate-bounce">👑 WINNER!</span>
                )}
              </div>
              
              {isCurrentPlayer(index) && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">Active</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Current Points</div>
                <div className="text-lg font-bold text-pirate-gold">
                  {player.points.toLocaleString()}
                </div>
              </div>
              
              <div>
                <div className="text-gray-400">Banked Points</div>
                <div className="text-lg font-bold text-green-400">
                  {player.bankedPoints.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-gray-600">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Total Score:</span>
                <span className="text-xl font-bold text-white">
                  {getTotalScore(player).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Player abilities/badges */}
            {(player.hasElf || player.hasBauble) && (
              <div className="mt-2 pt-2 border-t border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Abilities:</div>
                <div>{getPlayerBadges(player)}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Game status indicator */}
      <div className="mt-4 p-3 rounded-lg bg-black bg-opacity-50 text-center">
        <div className="text-sm text-gray-400">Game Status</div>
        <div className={`text-lg font-bold ${
          gameStatus === 'waiting' ? 'text-yellow-400' :
          gameStatus === 'active' ? 'text-green-400' :
          'text-pirate-gold'
        }`}>
          {gameStatus === 'waiting' && '⏳ Waiting for players'}
          {gameStatus === 'active' && '⚔️ Battle in progress'}
          {gameStatus === 'completed' && '🏆 Battle completed'}
        </div>
      </div>
    </div>
  );
}