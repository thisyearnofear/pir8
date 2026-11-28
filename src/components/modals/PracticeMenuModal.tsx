"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Anchor, Compass, Crown, Swords } from "lucide-react";
import { useFocusTrap } from "@/hooks/useAccessibility";

interface PracticeMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPractice: (difficulty: "novice" | "pirate" | "captain" | "admiral") => void;
}

const DIFFICULTIES = [
  {
    id: "novice",
    title: "Novice",
    blurb: "Perfect for learning the basics",
    Icon: Compass,
  },
  {
    id: "pirate",
    title: "Pirate",
    blurb: "Balanced challenge for new players",
    Icon: Swords,
  },
  {
    id: "captain",
    title: "Captain",
    blurb: "Experienced AI with smart tactics",
    Icon: Anchor,
  },
  {
    id: "admiral",
    title: "Admiral",
    blurb: "Master-level strategic opponent",
    Icon: Crown,
  },
] as const;

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
      if (e.key === "Enter") onStartPractice(selectedDifficulty);
    },
    [onClose, onStartPractice, selectedDifficulty],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="practice-menu-title"
        className="mx-4 w-full max-w-md rounded-[var(--p8-radius)] border border-[var(--p8-brass)] bg-[var(--p8-deep)] p-8 shadow-[0_2px_8px_rgba(0,0,0,.45)]"
      >
        <h2
          id="practice-menu-title"
          className="mb-2 font-[var(--font-world)] text-2xl text-[var(--p8-vellum)]"
        >
          Choose your opponent
        </h2>
        <p className="mb-6 text-sm leading-6 text-[var(--p8-vellum)] opacity-80">
          Hone your skills against AI captains before entering real
          battles. No wallet required.
        </p>

        <div className="mb-6 space-y-3">
          {DIFFICULTIES.map(({ id, title, blurb, Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedDifficulty(id)}
              aria-pressed={selectedDifficulty === id}
              className={`w-full rounded-[var(--p8-radius)] border p-4 text-left transition-all ${
                selectedDifficulty === id
                  ? "border-[var(--p8-lamp)] bg-white/[0.06]"
                  : "border-white/10 hover:border-[var(--p8-brass)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--p8-vellum)]">
                  {title}
                </span>
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  aria-hidden
                  className={
                    selectedDifficulty === id
                      ? "text-[var(--p8-lamp)]"
                      : "text-[var(--p8-brass)]"
                  }
                />
              </div>
              <p className="mt-1 text-sm text-[var(--p8-vellum)] opacity-70">
                {blurb}
              </p>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-[var(--p8-radius)] border border-[var(--p8-brass)] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[var(--p8-vellum)] transition-colors hover:bg-white/[0.04]"
          >
            Cancel
          </button>
          <button
            onClick={() => onStartPractice(selectedDifficulty)}
            autoFocus
            className="flex-1 rounded-[var(--p8-radius)] bg-[var(--p8-lamp)] px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#0b1418] transition hover:brightness-110"
          >
            Set sail
          </button>
        </div>
      </div>
    </div>
  );
}
