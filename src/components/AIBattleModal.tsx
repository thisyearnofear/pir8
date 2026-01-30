/**
 * AIBattleModal - AI vs AI Demo Mode Selection
 * Allows users to watch AI opponents battle and learn game mechanics
 * Following: ENHANCEMENT FIRST, MODULAR architecture
 */

'use client';

import { useState } from 'react';

interface AIBattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBattle: (difficulty1: string, difficulty2: string, speed: number) => void;
}

type Difficulty = 'novice' | 'pirate' | 'captain' | 'admiral';

const difficultyInfo = {
  novice: {
    emoji: '🐣',
    name: 'Novice',
    description: 'Learning the ropes',
    color: 'from-green-400 to-green-600',
  },
  pirate: {
    emoji: '⚔️',
    name: 'Pirate',
    description: 'Balanced strategy',
    color: 'from-blue-400 to-blue-600',
  },
  captain: {
    emoji: '🏴‍☠️',
    name: 'Captain',
    description: 'Aggressive tactics',
    color: 'from-purple-400 to-purple-600',
  },
  admiral: {
    emoji: '👑',
    name: 'Admiral',
    description: 'Master strategist',
    color: 'from-orange-400 to-orange-600',
  },
};

export default function AIBattleModal({ isOpen, onClose, onStartBattle }: AIBattleModalProps) {
  const [difficulty1, setDifficulty1] = useState<Difficulty>('pirate');
  const [difficulty2, setDifficulty2] = useState<Difficulty>('captain');
  const [speed, setSpeed] = useState(1);

  if (!isOpen) return null;

  const handleStart = () => {
    onStartBattle(difficulty1, difficulty2, speed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-neon-cyan/50 rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl shadow-neon-cyan/20 animate-fade-in">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">⚔️</div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-gold mb-2">
            Watch AI Battle
          </h2>
          <p className="text-gray-400">
            See the game in action! Learn strategies by watching AI opponents compete.
          </p>
        </div>

        {/* Combatant Selection */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Player 1 */}
          <div>
            <h3 className="text-sm font-bold text-neon-cyan uppercase mb-3 text-center">
              AI Player 1
            </h3>
            <div className="space-y-2">
              {(Object.keys(difficultyInfo) as Difficulty[]).map((diff) => {
                const info = difficultyInfo[diff];
                return (
                  <button
                    key={diff}
                    onClick={() => setDifficulty1(diff)}
                    className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                      difficulty1 === diff
                        ? 'border-neon-cyan bg-neon-cyan/20 scale-105'
                        : 'border-slate-600 hover:border-neon-cyan/50 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{info.emoji}</span>
                        <div>
                          <div className="font-bold text-white">{info.name}</div>
                          <div className="text-xs text-gray-400">{info.description}</div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* VS Divider */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-12
                          text-4xl font-black text-neon-gold opacity-50 pointer-events-none hidden lg:block">
            VS
          </div>

          {/* Player 2 */}
          <div>
            <h3 className="text-sm font-bold text-neon-gold uppercase mb-3 text-center">
              AI Player 2
            </h3>
            <div className="space-y-2">
              {(Object.keys(difficultyInfo) as Difficulty[]).map((diff) => {
                const info = difficultyInfo[diff];
                return (
                  <button
                    key={diff}
                    onClick={() => setDifficulty2(diff)}
                    className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                      difficulty2 === diff
                        ? 'border-neon-gold bg-neon-gold/20 scale-105'
                        : 'border-slate-600 hover:border-neon-gold/50 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{info.emoji}</span>
                        <div>
                          <div className="font-bold text-white">{info.name}</div>
                          <div className="text-xs text-gray-400">{info.description}</div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Speed Control */}
        <div className="mb-6 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <label className="block text-sm font-bold text-gray-400 uppercase mb-3">
            Playback Speed: {speed}x
          </label>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Slow</span>
            <input
              type="range"
              min="0.5"
              max="4"
              step="0.5"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:h-4
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-neon-cyan
                         [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:transition-transform
                         [&::-webkit-slider-thumb]:hover:scale-110"
            />
            <span className="text-sm text-gray-500">Fast</span>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>0.5x</span>
            <span>1x</span>
            <span>2x</span>
            <span>4x</span>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-r from-neon-cyan/10 to-neon-gold/10 border border-neon-cyan/30 rounded-xl p-4 mb-6">
          <h4 className="font-bold text-neon-cyan mb-2 flex items-center gap-2">
            <span>💡</span>
            <span>What You'll Learn:</span>
          </h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Ship movement and combat strategies</li>
            <li>• Territory control and resource management</li>
            <li>• Timing and positioning tactics</li>
            <li>• How difficulty levels affect AI behavior</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-600 text-gray-300 
                       hover:bg-slate-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-gold 
                       text-black font-bold hover:shadow-lg hover:shadow-neon-cyan/50 
                       hover:scale-105 active:scale-95 transition-all"
          >
            Start Battle
          </button>
        </div>

        {/* Tip */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Tip: Try Admiral vs Admiral at 2x speed for epic battles! ⚡
        </p>
      </div>
    </div>
  );
}
