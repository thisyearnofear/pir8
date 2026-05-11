"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useFocusTrap } from "@/hooks/useAccessibility";

interface PracticeMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPractice: (difficulty: "novice" | "pirate" | "captain" | "admiral") => void;
}

export default function PracticeMenuModal({
  isOpen,
  onClose,
  onStartPractice,
}: PracticeMenuModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    "novice" | "pirate" | "captain" | "admiral"
  >("pirate");

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
        aria-labelledby="practice-menu-title"
        className="bg-slate-900 border-2 border-neon-cyan/50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-neon-cyan/20 transform transition-all duration-300"
      >
        <h2
          id="practice-menu-title"
          className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-gold mb-4"
        >
          ⚔️ Practice Mode
        </h2>
        <p className="text-gray-300 mb-6">
          Hone your skills against AI opponents before entering real
          battles. No wallet required - just pure strategy!
        </p>

        <div className="space-y-3 mb-6">
          {(["novice", "pirate", "captain", "admiral"] as const).map(
            (diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${selectedDifficulty === diff
                  ? "border-neon-cyan bg-neon-cyan/20"
                  : "border-slate-600 hover:border-neon-cyan/50"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold capitalize">{diff}</span>
                  <span className="text-2xl">
                    {diff === "novice" && "🐣"}
                    {diff === "pirate" && "⚔️"}
                    {diff === "captain" && "🏴‍☠️"}
                    {diff === "admiral" && "👑"}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {diff === "novice" && "Perfect for learning the basics"}
                  {diff === "pirate" &&
                    "Balanced challenge for new players"}
                  {diff === "captain" &&
                    "Experienced AI with smart tactics"}
                  {diff === "admiral" && "Master-level strategic opponent"}
                </p>
              </button>
            ),
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-600 text-gray-300 hover:bg-slate-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onStartPractice(selectedDifficulty)}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-gold text-black font-bold hover:shadow-lg hover:shadow-neon-cyan/50 transition-all"
          >
            Start Practice
          </button>
        </div>
      </div>
    </div>
  );
}
