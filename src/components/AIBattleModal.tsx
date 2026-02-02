'use client';

import { useState } from 'react';

interface AIBattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBattle: (difficulty1: string, difficulty2: string, speed: number) => void;
}

type Difficulty = 'novice' | 'pirate' | 'captain' | 'admiral';

const difficulties: { key: Difficulty; emoji: string; name: string; desc: string }[] = [
  { key: 'novice', emoji: '🐣', name: 'Novice', desc: 'Learning' },
  { key: 'pirate', emoji: '⚔️', name: 'Pirate', desc: 'Balanced' },
  { key: 'captain', emoji: '🏴‍☠️', name: 'Captain', desc: 'Aggressive' },
  { key: 'admiral', emoji: '👑', name: 'Admiral', desc: 'Master' },
];

const speeds = [0.5, 1, 2, 4];

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
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-neon-cyan/50 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl shadow-neon-cyan/20">
        <div className="text-center mb-4">
          <span className="text-4xl">⚔️</span>
          <h2 className="text-xl font-black text-neon-cyan mt-1">AI Battle Arena</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {[{ label: 'AI 1', state: difficulty1, setState: setDifficulty1, color: 'cyan' }, { label: 'AI 2', state: difficulty2, setState: setDifficulty2, color: 'gold' }].map(({ label, state, setState, color }) => (
            <div key={label}>
              <p className={`text-xs font-bold text-${color}-400 uppercase mb-2 text-center`}>{label}</p>
              <div className="space-y-1">
                {difficulties.map(({ key, emoji, name, desc }) => (
                  <button
                    key={key}
                    onClick={() => setState(key)}
                    className={`w-full p-2 rounded-lg border transition-all flex items-center gap-2 ${
                      state === key
                        ? `border-neon-${color} bg-neon-${color}/20`
                        : 'border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-lg">{emoji}</span>
                    <div>
                      <div className="text-sm font-bold text-white leading-none">{name}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Speed: {speed}x</span>
            <div className="flex gap-1">
              {speeds.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                    speed === s ? 'bg-neon-cyan text-black' : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-700 text-gray-400 hover:bg-slate-800">
            Cancel
          </button>
          <button onClick={handleStart} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-gold text-black font-bold">
            Start Battle
          </button>
        </div>
      </div>
    </div>
  );
}
