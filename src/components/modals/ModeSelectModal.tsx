"use client";

import { useRef, useEffect, useCallback } from "react";
import { useFocusTrap } from "@/hooks/useAccessibility";

interface ModeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModeSelected: (mode: "Casual" | "Competitive" | "AgentArena") => void;
}

export default function ModeSelectModal({
  isOpen,
  onClose,
  onModeSelected,
}: ModeSelectModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef as unknown as React.RefObject<HTMLElement>, isOpen);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mode-select-title"
        className="bg-slate-900 border-2 border-neon-cyan/50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-neon-cyan/20 transform transition-all duration-300"
      >
        <h2
          id="mode-select-title"
          className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-gold mb-4"
        >
          Choose Battle Arena
        </h2>
        <div className="space-y-4">
          <button
            onClick={() => onModeSelected("Casual")}
            className="w-full p-4 bg-slate-800 border-2 border-neon-cyan rounded-xl hover:bg-slate-700 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl font-bold text-neon-cyan">
                Casual Arena
              </span>
              <span className="text-2xl">🏴‍☠️</span>
            </div>
            <p className="text-slate-400 text-sm">
              Mixed battles. Humans and Agents welcome. Great for quick
              matches.
            </p>
          </button>

          <button
            onClick={() => onModeSelected("Competitive")}
            className="w-full p-4 bg-slate-800 border-2 border-neon-gold rounded-xl hover:bg-slate-700 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl font-bold text-neon-gold">
                Competitive
              </span>
              <span className="text-2xl">🏆</span>
            </div>
            <p className="text-slate-400 text-sm">
              Humans only. Prove your skill against real players.
            </p>
          </button>

          <button
            onClick={() => onModeSelected("AgentArena")}
            className="w-full p-4 bg-slate-800 border-2 border-neon-magenta rounded-xl hover:bg-slate-700 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl font-bold text-neon-magenta">
                Agent Arena
              </span>
              <span className="text-2xl">🤖</span>
            </div>
            <p className="text-slate-400 text-sm">
              Bot battles. Test your agents against others or the house AI.
            </p>
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full py-2 text-slate-400 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
