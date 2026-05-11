"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Clock3,
  Coins,
  Crosshair,
  Flag,
  Medal,
  Radio,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import {
  CompetitiveSnapshot,
  buildDefaultCompetitiveSnapshot,
} from "@/lib/competitiveData";

interface CompetitivePlatformProps {
  isConnected: boolean;
  onJoinDuelQueue: () => void;
  onSpectate: () => void;
}

function StatusPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
      {children}
    </span>
  );
}

export default function CompetitivePlatform({
  isConnected,
  onJoinDuelQueue,
  onSpectate,
}: CompetitivePlatformProps) {
  const [snapshot, setSnapshot] = useState<CompetitiveSnapshot>(() =>
    buildDefaultCompetitiveSnapshot(),
  );

  useEffect(() => {
    let isMounted = true;

    fetch("/api/competitive", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: CompetitiveSnapshot | null) => {
        if (isMounted && data) setSnapshot(data);
      })
      .catch(() => {
        // The seeded snapshot keeps the surface usable offline.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="mt-5 space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
        <section className="rounded-lg border border-cyan-200/20 bg-slate-950/65 p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-cyan-100">
                <Clock3 size={16} />
                Short Duel Queue
              </div>
              <h3 className="text-2xl font-black text-white">
                Five-minute ranked waters
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                The competitive path starts with compact 1v1 duels: scout,
                commit, reveal, and settle before tournaments add bracket
                overhead.
              </p>
            </div>
            <StatusPill>{isConnected ? "Ready" : "Wallet gated"}</StatusPill>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
                Format
              </div>
              <div className="mt-2 text-xl font-black text-white">
                {snapshot.queue.format}
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Short duel queue before larger brackets.
              </p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-100">
                Target
              </div>
              <div className="mt-2 text-xl font-black text-white">
                {snapshot.queue.targetDuration}
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Built around decisive reveal turns.
              </p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-fuchsia-100">
                Stakes
              </div>
              <div className="mt-2 text-xl font-black text-white">
                {snapshot.queue.stakes}
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Wins feed public captain status.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={onJoinDuelQueue}
              disabled={!isConnected}
              className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-md bg-cyan-200 px-4 py-2 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Crosshair size={16} />
              Join Duel Queue
            </button>
            <button
              onClick={onSpectate}
              className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-md border border-amber-200/35 bg-amber-200/10 px-4 py-2 text-sm font-black uppercase tracking-[0.14em] text-amber-100 transition hover:border-amber-100"
            >
              <Radio size={16} />
              Watch Queue
              </button>
            </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
            <span>{snapshot.queue.activeCaptains} active captains</span>
            <span>Average wait: {snapshot.queue.averageWait}</span>
            {snapshot.acceptedChallenges.length > 0 && (
              <span>{snapshot.acceptedChallenges.length} accepted challenges</span>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-amber-200/20 bg-slate-950/65 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-amber-100">
              <Coins size={16} />
              Bounty Board
            </div>
            <StatusPill>Public targets</StatusPill>
          </div>
          <div className="space-y-2">
            {snapshot.bountyTargets.map((target) => (
              <div
                key={target.captain}
                className="grid gap-3 rounded-md border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-white">{target.captain}</span>
                    <span className="text-xs font-bold text-slate-500">
                      {target.record}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {target.reason}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="font-mono text-sm font-black text-amber-100">
                    {target.bounty}
                  </span>
                  <StatusPill>{target.status}</StatusPill>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]">
        <section className="rounded-lg border border-white/10 bg-slate-950/65 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-fuchsia-100">
              <Users size={16} />
              Captain Profiles
            </div>
            <StatusPill>Reputation preview</StatusPill>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {snapshot.captainProfiles.map((captain) => (
              <article
                key={captain.name}
                className="rounded-md border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="font-black text-white">{captain.name}</span>
                  <span className="font-mono text-sm font-black text-cyan-100">
                    {captain.rank}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-slate-500">Style</div>
                    <div className="mt-1 font-bold text-slate-200">
                      {captain.style}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Win rate</div>
                    <div className="mt-1 font-bold text-slate-200">
                      {captain.winRate}
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded border border-cyan-200/15 bg-cyan-200/5 px-2 py-1.5 text-xs font-bold text-cyan-100">
                  {captain.signal}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-slate-950/65 p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-slate-300">
            <Trophy size={16} />
            Tournament Gate
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-md border border-cyan-200/20 bg-cyan-200/5 p-3">
              <ShieldCheck className="mt-0.5 text-cyan-100" size={17} />
              <div>
                <div className="font-bold text-white">Duel loop first</div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Queue quality, replay sharing, and bounty outcomes must work
                  before bracket complexity.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-md border border-amber-200/20 bg-amber-200/5 p-3">
              <Medal className="mt-0.5 text-amber-100" size={17} />
              <div>
                <div className="font-bold text-white">Seed from reputation</div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Public captain profiles become the source for future bracket
                  seeding.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-md border border-fuchsia-200/20 bg-fuchsia-200/5 p-3">
              <Flag className="mt-0.5 text-fuchsia-100" size={17} />
              <div>
                <div className="font-bold text-white">Season scaffolding</div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Badges and trophies wait until short duels are fun and
                  shareable.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
