"use client";

import { Icon } from "@/components/ui/Icon";

interface PracticeModeBannerProps {
  onExit: () => void;
  onShowDossier: () => void;
  showUpgradePrompt: boolean;
  onUpgrade: () => void;
}

export default function PracticeModeBanner({
  onExit,
  onShowDossier,
  showUpgradePrompt,
  onUpgrade,
}: PracticeModeBannerProps) {
  return (
    <div className="fixed left-4 top-4 z-40">
      <div className="overflow-hidden rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] font-bold shadow-[0_2px_8px_rgba(0,0,0,.45)]">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-[var(--p8-brass-line)] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[var(--p8-lamp)]">
              <Icon name="target" size={18} strokeWidth={1.5} />
            </span>
            <span className="font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.2em] text-[var(--p8-vellum)]">Practice mode</span>
          </div>
          <button
            onClick={onExit}
            className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-3 py-1.5 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.1em] text-[var(--p8-vellum-dim)] transition-colors hover:border-[var(--p8-brass)] hover:text-[var(--p8-vellum)] focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
            title="Exit practice mode"
          >
            Exit
          </button>
        </div>

        {/* Status Info */}
        <div className="bg-[var(--p8-ink)] px-4 py-2">
          <p className="flex items-center gap-2 text-xs text-[var(--p8-vellum-dim)]">
            <Icon name="shield" size={14} strokeWidth={1.5} />
            Safe environment — no blockchain fees
          </p>
        </div>

        {/* Privacy Education Button */}
        <div className="border-t border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-4 py-2">
          <button
            onClick={onShowDossier}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--p8-radius)] border border-[color-mix(in_srgb,var(--p8-threat)_55%,transparent)] px-3 py-2 text-xs text-[var(--p8-threat)] transition-colors hover:border-[var(--p8-threat)] focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
          >
            <Icon name="log" size={14} strokeWidth={1.5} />
            <span>View AI dossier on you</span>
          </button>
          <p className="mt-1 text-center font-[var(--font-instrument)] text-[11px] text-[var(--p8-vellum-mute)]">
            See what opponents learn from visible data
          </p>
        </div>

        {/* Upgrade Prompt */}
        {showUpgradePrompt && (
          <div className="space-y-2 border-t border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-4 py-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-[var(--p8-vellum)]">
              <Icon name="trophy" size={14} className="text-[var(--p8-lamp)]" strokeWidth={1.5} />
              Ready for real battles with stakes?
            </p>
            <button
              onClick={onUpgrade}
              className="w-full rounded-[var(--p8-radius)] bg-[var(--p8-lamp)] px-3 py-2 text-xs font-bold text-[#0b1418] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p8-vellum)]"
            >
              Connect wallet & play on-chain
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
