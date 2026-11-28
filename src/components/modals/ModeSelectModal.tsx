"use client";

import { useRef, useEffect, useCallback } from "react";
import { useFocusTrap } from "@/hooks/useAccessibility";
import { Icon, type IconName } from "../ui/Icon";

interface ModeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModeSelected: (mode: "Casual" | "Competitive" | "AgentArena") => void;
}

const MODES: { mode: "Casual" | "Competitive" | "AgentArena"; title: string; blurb: string; icon: IconName; accent: string }[] = [
  {
    mode: "Casual",
    title: "Casual Arena",
    blurb: "Mixed battles. Humans and Agents welcome. Great for quick matches.",
    icon: "ship",
    accent: "signal",
  },
  {
    mode: "Competitive",
    title: "Competitive",
    blurb: "Humans only. Prove your skill against real players.",
    icon: "trophy",
    accent: "lamp",
  },
  {
    mode: "AgentArena",
    title: "Agent Arena",
    blurb: "Bot battles. Test your agents against others or the house AI.",
    icon: "brain",
    accent: "vellum",
  },
];

const ACCENT_TEXT: Record<string, string> = {
  signal: "text-[var(--p8-signal)]",
  lamp: "text-[var(--p8-lamp)]",
  vellum: "text-[var(--p8-vellum)]",
};

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mode-select-title"
        className="mx-4 w-full max-w-md rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-8 shadow-[var(--p8-shadow-instrument)]"
      >
        <h2
          id="mode-select-title"
          className="mb-4 text-2xl font-black text-[var(--p8-vellum)]"
        >
          Choose Battle Arena
        </h2>
        <div className="space-y-4">
          {MODES.map(({ mode, title, blurb, icon, accent }) => (
            <button
              key={mode}
              onClick={() => onModeSelected(mode)}
              className="w-full rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] p-4 text-left transition-colors hover:border-[var(--p8-brass)]"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className={`flex items-center gap-2 text-xl font-bold ${ACCENT_TEXT[accent]}`}>
                  <Icon name={icon} size={20} />
                  {title}
                </span>
              </div>
              <p className="text-sm text-[var(--p8-vellum-dim)]">
                {blurb}
              </p>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] py-2 text-[var(--p8-vellum-dim)] transition-colors hover:text-[var(--p8-vellum)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
