"use client";

import dynamic from "next/dynamic";
import { Eye, Radio, Share2, Trophy } from "lucide-react";

const WalletButtonWrapper = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton,
    ),
  {
    ssr: false,
    loading: () => <div className="px-4 py-2 text-gray-400">Loading...</div>,
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
  return (
    <header className="mb-5 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-3 shadow-2xl shadow-slate-950/40 backdrop-blur sm:px-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-cyan-200/30 bg-cyan-200/10 text-cyan-100">
            <Radio size={21} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black tracking-wide text-white sm:text-2xl">
                PIR8
              </h1>
              <span className="rounded-full border border-cyan-200/20 bg-cyan-200/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100">
                Shadow Seas
              </span>
              {playerCount !== undefined && playerCount > 0 && (
                <span className="rounded-full border border-amber-200/20 bg-amber-200/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-100">
                  {playerCount} captains
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-sm text-slate-400">
              Private naval tactics: scout, mask, reveal, and challenge.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onSpectatorMode}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-bold text-slate-200 transition hover:border-cyan-200/40 hover:text-cyan-100"
            aria-label="Watch battles"
          >
            <Eye size={16} />
            <span className="hidden sm:inline">Watch</span>
          </button>

          <button
            onClick={onOpenReferral}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-bold text-slate-200 transition hover:border-amber-200/40 hover:text-amber-100"
            aria-label="Invite friends"
          >
            <Share2 size={16} />
            <span className="hidden sm:inline">Challenge</span>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-bold text-slate-200 transition hover:border-fuchsia-200/40 hover:text-fuchsia-100"
            aria-label="View leaderboard"
          >
            <Trophy size={16} />
            <span className="hidden sm:inline">Ranks</span>
          </button>

          <div className="min-h-[40px]">
            <WalletButtonWrapper />
          </div>
        </div>
      </div>
    </header>
  );
}
