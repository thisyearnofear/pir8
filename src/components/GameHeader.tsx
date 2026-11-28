"use client";

import dynamic from "next/dynamic";
import { Eye, Radio, Share2, Trophy, Volume2, VolumeX } from "lucide-react";
import { useSafeWallet } from "@/components/SafeWalletProvider";
import { useSoundEffects } from "@/hooks/useSoundEffects";

const WalletButtonWrapper = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton,
    ),
  {
    ssr: false,
    loading: () => <div className="px-4 py-2 text-[var(--p8-vellum-mute)]">Loading...</div>,
  },
);

interface GameHeaderProps {
  onSpectatorMode: () => void;
  onOpenReferral: () => void;
  onOpenLeaderboard: () => void;
  playerCount?: number;
}

export default function GameHeader({
  onSpectatorMode,
  onOpenReferral,
  onOpenLeaderboard,
  playerCount,
}: GameHeaderProps) {
  // WalletMultiButton throws without its provider chain, which loads after
  // first paint — hold a quiet placeholder until then.
  const { ready: walletReady } = useSafeWallet();
  const { isMuted, toggleMute } = useSoundEffects();
  return (
    <header
      className="mb-5 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-3 py-3 shadow-[0_2px_8px_rgba(0,0,0,.45)] sm:px-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] text-[var(--p8-lamp)]">
            <Radio size={21} strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-[var(--font-world)] text-xl tracking-wide text-[var(--p8-vellum)] sm:text-2xl">
                PIR8
              </h1>
              <span className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] px-2.5 py-1 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.2em] text-[var(--p8-vellum-dim)]">
                Shadow Seas
              </span>
              {playerCount !== undefined && playerCount > 0 && (
                <span className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] px-2.5 py-1 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.2em] text-[var(--p8-lamp)]">
                  {playerCount} captains
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-sm text-[var(--p8-vellum-dim)]">
              Private naval tactics: scout, mask, reveal, and challenge.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onSpectatorMode}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] px-3 py-2 text-sm font-bold text-[var(--p8-vellum-dim)] transition hover:border-[var(--p8-brass)] hover:text-[var(--p8-vellum)] focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
            aria-label="Watch battles"
          >
            <Eye size={16} strokeWidth={1.5} />
            <span className="hidden sm:inline">Watch</span>
          </button>

          <button
            onClick={onOpenReferral}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] px-3 py-2 text-sm font-bold text-[var(--p8-vellum-dim)] transition hover:border-[var(--p8-brass)] hover:text-[var(--p8-vellum)] focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
            aria-label="Invite friends"
          >
            <Share2 size={16} strokeWidth={1.5} />
            <span className="hidden sm:inline">Challenge</span>
          </button>

          <button
            onClick={toggleMute}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] px-3 py-2 text-sm font-bold text-[var(--p8-vellum-dim)] transition hover:border-[var(--p8-brass)] hover:text-[var(--p8-vellum)] focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
            aria-label={isMuted ? "Unmute sound" : "Mute sound"}
            aria-pressed={isMuted}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={16} strokeWidth={1.5} /> : <Volume2 size={16} strokeWidth={1.5} />}
            <span className="hidden sm:inline">{isMuted ? "Muted" : "Sound"}</span>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] px-3 py-2 text-sm font-bold text-[var(--p8-vellum-dim)] transition hover:border-[var(--p8-brass)] hover:text-[var(--p8-vellum)] focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
            aria-label="View leaderboard"
          >
            <Trophy size={16} strokeWidth={1.5} />
            <span className="hidden sm:inline">Ranks</span>
          </button>

          <div className="min-h-[40px]">
            {walletReady ? (
              <WalletButtonWrapper />
            ) : (
              <div
                aria-hidden="true"
                className="inline-flex min-h-[40px] items-center rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] px-3 py-2 text-sm font-bold text-[var(--p8-vellum-mute)]"
              >
                Select Wallet
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
