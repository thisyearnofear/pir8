'use client';

import { useState } from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';

interface AIBattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBattle: (difficulty1: string, difficulty2: string, speed: number) => void;
}

type Difficulty = 'novice' | 'pirate' | 'captain' | 'admiral';

const difficulties: { key: Difficulty; icon: IconName; name: string; desc: string }[] = [
  { key: 'novice', icon: 'compass', name: 'Novice', desc: 'Learning' },
  { key: 'pirate', icon: 'attack', name: 'Pirate', desc: 'Balanced' },
  { key: 'captain', icon: 'ship', name: 'Captain', desc: 'Aggressive' },
  { key: 'admiral', icon: 'crown', name: 'Admiral', desc: 'Master' },
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

  const panels = [
    { label: 'AI 1', state: difficulty1, setState: setDifficulty1, accent: 'lamp' as const },
    { label: 'AI 2', state: difficulty2, setState: setDifficulty2, accent: 'signal' as const },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="AI battle arena"
    >
      <div
        className="mx-4 w-full max-w-lg rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-6 shadow-[0_2px_8px_rgba(0,0,0,.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 text-center">
          <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] text-[var(--p8-lamp)]">
            <Icon name="attack" size={24} strokeWidth={1.5} />
          </span>
          <h2 className="font-[var(--font-world)] text-xl text-[var(--p8-vellum)]">AI battle arena</h2>
          <p className="mt-1 text-sm text-[var(--p8-vellum-dim)]">Two captains enter. Study them both.</p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          {panels.map(({ label, state, setState, accent }) => (
            <div key={label}>
              <p className="mb-2 text-center font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.16em] text-[var(--p8-vellum-dim)]">{label}</p>
              <div className="space-y-1" role="radiogroup" aria-label={`${label} difficulty`}>
                {difficulties.map(({ key, icon, name, desc }) => {
                  const selected = state === key;
                  return (
                    <button
                      key={key}
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setState(key)}
                      className={`flex w-full items-center gap-2 rounded-[var(--p8-radius)] border p-2 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)] ${
                        selected
                          ? accent === 'lamp'
                            ? 'border-[var(--p8-lamp)] bg-[color-mix(in_srgb,var(--p8-lamp)_10%,transparent)]'
                            : 'border-[var(--p8-signal)] bg-[color-mix(in_srgb,var(--p8-signal)_10%,transparent)]'
                          : 'border-[var(--p8-brass-line)] bg-[var(--p8-ink)] hover:border-[var(--p8-brass)]'
                      }`}
                    >
                      <span className={selected
                        ? accent === 'lamp' ? 'text-[var(--p8-lamp)]' : 'text-[var(--p8-signal)]'
                        : 'text-[var(--p8-vellum-dim)]'
                      }>
                        <Icon name={icon} size={18} strokeWidth={1.5} />
                      </span>
                      <span className="text-left">
                        <span className="block text-sm font-bold leading-none text-[var(--p8-vellum)]">{name}</span>
                        <span className="mt-0.5 block font-[var(--font-instrument)] text-[11px] text-[var(--p8-vellum-mute)]">{desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] p-3">
          <div className="flex items-center justify-between">
            <span className="font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.14em] text-[var(--p8-vellum-dim)]">
              Speed: <span className="text-[var(--p8-vellum)]">{speed}x</span>
            </span>
            <div className="flex gap-1" role="radiogroup" aria-label="Battle speed">
              {speeds.map((s) => (
                <button
                  key={s}
                  role="radio"
                  aria-checked={speed === s}
                  onClick={() => setSpeed(s)}
                  className={`rounded-[var(--p8-radius)] px-2 py-1 font-[var(--font-instrument)] text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)] ${
                    speed === s
                      ? 'bg-[var(--p8-lamp)] text-[#0b1418]'
                      : 'border border-[var(--p8-brass-line)] text-[var(--p8-vellum-dim)] hover:border-[var(--p8-brass)] hover:text-[var(--p8-vellum)]'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] py-2 font-bold text-[var(--p8-vellum-dim)] transition-colors hover:border-[var(--p8-brass)] hover:text-[var(--p8-vellum)] focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            autoFocus
            className="flex-1 rounded-[var(--p8-radius)] bg-[var(--p8-lamp)] py-2 font-bold text-[#0b1418] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p8-vellum)]"
          >
            Start battle
          </button>
        </div>
      </div>
    </div>
  );
}
