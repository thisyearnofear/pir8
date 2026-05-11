"use client";

import {
  Anchor,
  Eye,
  LockKeyhole,
  Play,
  Radar,
  Radio,
  Shield,
  Swords,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import CompetitivePlatform from "@/components/CompetitivePlatform";
import LobbyBrowser from "@/components/LobbyBrowser";

interface EmptyStateViewProps {
  isConnected: boolean;
  onPracticeMode: () => void;
  onCreateGame: () => void;
  onSpectatorMode: () => void;
  onAIBattle: () => void;
}

interface ActionCardProps {
  icon: LucideIcon;
  label: string;
  title: string;
  description: string;
  tone: "cyan" | "gold" | "magenta";
  onClick?: () => void;
  disabled?: boolean;
}

const toneClasses = {
  cyan: {
    border: "border-cyan-300/50",
    icon: "text-cyan-200",
    label: "text-cyan-200",
    hover: "hover:border-cyan-200 hover:shadow-cyan-950/60",
  },
  gold: {
    border: "border-amber-300/50",
    icon: "text-amber-200",
    label: "text-amber-200",
    hover: "hover:border-amber-200 hover:shadow-amber-950/50",
  },
  magenta: {
    border: "border-fuchsia-300/50",
    icon: "text-fuchsia-200",
    label: "text-fuchsia-200",
    hover: "hover:border-fuchsia-200 hover:shadow-fuchsia-950/50",
  },
};

function ActionCard({
  icon: Icon,
  label,
  title,
  description,
  tone,
  onClick,
  disabled = false,
}: ActionCardProps) {
  const classes = toneClasses[tone];
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={disabled ? undefined : onClick}
      className={`group h-full rounded-lg border bg-slate-950/70 p-5 text-left shadow-2xl transition-all ${classes.border} ${classes.hover} ${
        disabled ? "cursor-default opacity-70" : "hover:-translate-y-0.5"
      }`}
    >
      <div className="mb-5 flex items-center justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] ${classes.icon}`}
        >
          <Icon size={22} strokeWidth={1.8} />
        </div>
        <span
          className={`rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${classes.label}`}
        >
          {label}
        </span>
      </div>
      <h3 className="mb-2 text-lg font-black text-white">{title}</h3>
      <p className="text-sm leading-6 text-slate-400">{description}</p>
    </Component>
  );
}

function TacticalChart() {
  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-lg border border-cyan-200/20 bg-[#08131f]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(103,232,249,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(14,165,233,0.25),transparent_34%),radial-gradient(circle_at_78%_78%,rgba(245,158,11,0.2),transparent_28%)]" />

      <div className="absolute left-[18%] top-[18%] h-20 w-20 rounded-full border border-cyan-200/30 bg-cyan-300/10 blur-sm" />
      <div className="absolute bottom-[16%] right-[18%] h-28 w-28 rounded-full border border-amber-200/25 bg-amber-300/10 blur-sm" />

      <div className="absolute left-[15%] top-[28%] flex items-center gap-2 rounded-md border border-cyan-200/40 bg-slate-950/75 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
        <Radar size={15} />
        Scouting
      </div>
      <div className="absolute right-[11%] top-[22%] flex items-center gap-2 rounded-md border border-fuchsia-200/35 bg-slate-950/75 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-100">
        <LockKeyhole size={15} />
        Masked Fleet
      </div>
      <div className="absolute bottom-[19%] left-[26%] flex items-center gap-2 rounded-md border border-amber-200/40 bg-slate-950/75 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-100">
        <Swords size={15} />
        Ambush Window
      </div>

      <div className="absolute left-[30%] top-[44%] h-1 w-[34%] rotate-[-16deg] rounded-full bg-cyan-200/50 shadow-[0_0_20px_rgba(103,232,249,0.65)]" />
      <div className="absolute bottom-[34%] right-[27%] h-1 w-[26%] rotate-[28deg] rounded-full bg-amber-200/45 shadow-[0_0_20px_rgba(251,191,36,0.55)]" />

      <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-slate-950/80 px-4 py-3">
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <div className="font-bold text-cyan-100">3 scans</div>
            <div className="text-slate-500">reveal intent</div>
          </div>
          <div>
            <div className="font-bold text-amber-100">5-8 min</div>
            <div className="text-slate-500">duel target</div>
          </div>
          <div>
            <div className="font-bold text-fuchsia-100">private</div>
            <div className="text-slate-500">session key play</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmptyStateView({
  isConnected,
  onPracticeMode,
  onCreateGame,
  onSpectatorMode,
  onAIBattle,
}: EmptyStateViewProps) {
  return (
    <main className="min-h-[620px] px-1 pb-10 pt-2">
      <section className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] lg:items-center">
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-cyan-100">
            <Shield size={14} />
            Private Tactical Warfare
          </div>

          <div className="max-w-3xl">
            <h2 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              Scout hidden waters. Mask your fleet. Spring the ambush.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              PIR8 is a short-form naval strategy game where privacy is the
              mechanic: hide intent, reveal threats, and turn one decisive
              command into a shareable challenge.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onPracticeMode}
              className="inline-flex min-h-[52px] items-center justify-center gap-3 rounded-md bg-cyan-200 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-slate-950 shadow-lg shadow-cyan-950/50 transition hover:bg-white"
            >
              <Play size={18} fill="currentColor" />
              Start Private Skirmish
            </button>
            <button
              onClick={onAIBattle}
              className="inline-flex min-h-[52px] items-center justify-center gap-3 rounded-md border border-amber-200/45 bg-amber-200/10 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-amber-100 transition hover:border-amber-100 hover:bg-amber-200/15"
            >
              <Eye size={18} />
              Watch An Ambush
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-1 flex items-center gap-2 text-sm font-bold text-cyan-100">
                <Radar size={16} />
                Scout
              </div>
              <p className="text-xs leading-5 text-slate-500">
                Spend limited scans to reveal the map before committing.
              </p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-1 flex items-center gap-2 text-sm font-bold text-fuchsia-100">
                <LockKeyhole size={16} />
                Mask
              </div>
              <p className="text-xs leading-5 text-slate-500">
                Session keys keep your main wallet out of match identity.
              </p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-1 flex items-center gap-2 text-sm font-bold text-amber-100">
                <Swords size={16} />
                Reveal
              </div>
              <p className="text-xs leading-5 text-slate-500">
                Ambush turns become the replay and challenge hook.
              </p>
            </div>
          </div>
        </div>

        <TacticalChart />
      </section>

      <section className="mx-auto mt-8 grid max-w-7xl gap-4 md:grid-cols-3">
        <ActionCard
          icon={Swords}
          label="Instant"
          title="Play before wallet friction"
          description="Start against an AI captain immediately. Learn the scouting and ambush loop before moving into real stakes."
          tone="cyan"
          onClick={onPracticeMode}
        />
        <ActionCard
          icon={Radio}
          label="Watch"
          title="Spectate command decisions"
          description="Use AI battles as a live product demo: observe scouting, pressure, and reveal moments without setup."
          tone="gold"
          onClick={onAIBattle}
        />
        <ActionCard
          icon={Wallet}
          label={isConnected ? "Compete" : "Upgrade"}
          title={isConnected ? "Create or join on-chain" : "Connect when ready"}
          description={
            isConnected
              ? "Browse active lobbies, start private-session play, and turn matches into public reputation."
              : "Wallet play unlocks on-chain battles, provable wins, lobbies, and future challenge links."
          }
          tone="magenta"
          onClick={isConnected ? onCreateGame : undefined}
          disabled={!isConnected}
        />
      </section>

      <section className="mx-auto mt-8 max-w-7xl">
        {isConnected ? (
          <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-cyan-100">
                  <Anchor size={16} />
                  On-chain harbor
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Join a live lobby after you understand the ambush loop.
                </p>
              </div>
              <button
                onClick={onSpectatorMode}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white transition hover:border-cyan-200/50"
              >
                <Users size={16} />
                Browse Spectator View
              </button>
            </div>
            <LobbyBrowser />
            <CompetitivePlatform
              isConnected={isConnected}
              onJoinDuelQueue={onCreateGame}
              onSpectate={onSpectatorMode}
            />
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-slate-950/50 p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-amber-100">
                  <Trophy size={16} />
                  Competition unlocks after the hook lands
                </div>
                <p className="max-w-3xl text-sm leading-6 text-slate-400">
                  Connect a wallet when you want provable wins, public captain
                  status, lobbies, and eventually shareable Solana challenge
                  links. Until then, the skirmish and AI battle modes are the
                  fastest way to feel the game.
                </p>
              </div>
              <button
                onClick={onSpectatorMode}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border border-cyan-200/35 bg-cyan-200/10 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:border-cyan-100"
              >
                <Eye size={16} />
                Spectate Battles
              </button>
            </div>
            <CompetitivePlatform
              isConnected={isConnected}
              onJoinDuelQueue={onCreateGame}
              onSpectate={onSpectatorMode}
            />
          </div>
        )}
      </section>
    </main>
  );
}
