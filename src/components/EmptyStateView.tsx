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
import dynamic from "next/dynamic";
import CompetitivePlatform from "@/components/CompetitivePlatform";

// Wallet-gated and web3-touching: only loads after a wallet connects.
const LobbyBrowser = dynamic(() => import("@/components/LobbyBrowser"), {
  ssr: false,
});

interface EmptyStateViewProps {
  isConnected: boolean;
  onPracticeMode: () => void;
  /** One-click sail: starts a pirate-difficulty skirmish immediately. */
  onInstantPractice?: () => void;
  onCreateGame: () => void;
  onSpectatorMode: () => void;
  onAIBattle: () => void;
}

interface ActionCardProps {
  icon: LucideIcon;
  label: string;
  title: string;
  description: string;
  tone: "lamp" | "signal" | "threat";
  onClick?: () => void;
  disabled?: boolean;
}

const toneText = {
  lamp: "text-[var(--p8-lamp)]",
  signal: "text-[var(--p8-signal)]",
  threat: "text-[var(--p8-threat)]",
} as const;

function ActionCard({
  icon: Icon,
  label,
  title,
  description,
  tone,
  onClick,
  disabled = false,
}: ActionCardProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={disabled ? undefined : onClick}
      className={`group rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-5 text-left shadow-[0_2px_8px_rgba(0,0,0,.45)] transition-colors hover:border-[var(--p8-brass)] ${
        disabled ? "cursor-default opacity-70" : ""
      }`}
    >
      <div className="mb-5 flex items-center justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-white/[0.02] ${toneText[tone]}`}
        >
          <Icon size={22} strokeWidth={1.5} />
        </div>
        <span className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-3 py-1 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.2em] text-[var(--p8-vellum-dim)]">
          {label}
        </span>
      </div>
      <h3 className="mb-2 font-[var(--font-world)] text-lg text-[var(--p8-vellum)]">{title}</h3>
      <p className="text-sm leading-6 text-[var(--p8-vellum-dim)]">{description}</p>
    </Component>
  );
}

function TacticalChart() {
  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)]">
      <div className="absolute inset-0 bg-[linear-gradient(color-mix(in_srgb,var(--p8-brass)_14%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_srgb,var(--p8-brass)_14%,transparent)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,color-mix(in_srgb,var(--p8-lamp)_14%,transparent),transparent_34%),radial-gradient(circle_at_78%_78%,color-mix(in_srgb,var(--p8-signal)_12%,transparent),transparent_28%)]" />

      <div className="absolute left-[18%] top-[18%] h-20 w-20 rounded-full border border-[var(--p8-brass-line)] bg-white/[0.02]" />
      <div className="absolute bottom-[16%] right-[18%] h-28 w-28 rounded-full border border-[var(--p8-brass-line)] bg-white/[0.02]" />

      <div className="absolute left-[15%] top-[28%] flex items-center gap-2 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-3 py-2 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.18em] text-[var(--p8-vellum)]">
        <Radar size={15} strokeWidth={1.5} />
        Scouting
      </div>
      <div className="absolute right-[11%] top-[22%] flex items-center gap-2 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-3 py-2 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.18em] text-[var(--p8-vellum)]">
        <LockKeyhole size={15} strokeWidth={1.5} />
        Masked Fleet
      </div>
      <div className="absolute bottom-[19%] left-[26%] flex items-center gap-2 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-3 py-2 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.18em] text-[var(--p8-lamp)]">
        <Swords size={15} strokeWidth={1.5} />
        Ambush Window
      </div>

      <div className="absolute left-[30%] top-[44%] h-px w-[34%] rotate-[-16deg] bg-[var(--p8-brass)]" />
      <div className="absolute bottom-[34%] right-[27%] h-px w-[26%] rotate-[28deg] bg-[var(--p8-brass)]" />

      <div className="absolute bottom-0 left-0 right-0 border-t border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-4 py-3">
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <div className="font-[var(--font-instrument)] text-[var(--p8-vellum)]">3 scans</div>
            <div className="text-[var(--p8-vellum-dim)]">reveal intent</div>
          </div>
          <div>
            <div className="font-[var(--font-instrument)] text-[var(--p8-vellum)]">5-8 min</div>
            <div className="text-[var(--p8-vellum-dim)]">duel target</div>
          </div>
          <div>
            <div className="font-[var(--font-instrument)] text-[var(--p8-vellum)]">private</div>
            <div className="text-[var(--p8-vellum-dim)]">session key play</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmptyStateView({
  isConnected,
  onPracticeMode,
  onInstantPractice,
  onCreateGame,
  onSpectatorMode,
  onAIBattle,
}: EmptyStateViewProps) {
  const handleHeroPractice = onInstantPractice || onPracticeMode;
  return (
    <main className="min-h-[620px] bg-[var(--p8-ink)] px-1 pb-10 pt-2">
      <section className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] lg:items-center">
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] px-3 py-1 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.24em] text-[var(--p8-vellum-dim)]">
            <Shield size={14} strokeWidth={1.5} />
            Private Tactical Warfare
          </div>

          <div className="max-w-3xl">
            <h2 className="font-[var(--font-world)] text-4xl leading-tight text-[var(--p8-vellum)] sm:text-5xl lg:text-6xl">
              Scout hidden waters. Mask your fleet. Spring the ambush.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--p8-vellum-dim)] sm:text-lg">
              PIR8 is a short-form naval strategy game where privacy is the
              mechanic: hide intent, reveal threats, and turn one decisive
              command into a shareable challenge.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleHeroPractice}
              autoFocus
              className="inline-flex min-h-[52px] items-center justify-center gap-3 rounded-[var(--p8-radius)] bg-[var(--p8-lamp)] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#0b1418] shadow-[0_2px_8px_rgba(0,0,0,.45)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p8-vellum)]"
            >
              <Play size={18} fill="currentColor" strokeWidth={1.5} />
              Start Private Skirmish
            </button>
            <button
              onClick={onAIBattle}
              className="inline-flex min-h-[52px] items-center justify-center gap-3 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-[var(--p8-vellum)] transition hover:border-[var(--p8-brass)] focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
            >
              <Eye size={18} strokeWidth={1.5} />
              Watch An Ambush
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-3">
              <div className="mb-1 flex items-center gap-2 text-sm font-bold text-[var(--p8-vellum)]">
                <Radar size={16} strokeWidth={1.5} />
                Scout
              </div>
              <p className="text-xs leading-5 text-[var(--p8-vellum-dim)]">
                Spend limited scans to reveal the map before committing.
              </p>
            </div>
            <div className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-3">
              <div className="mb-1 flex items-center gap-2 text-sm font-bold text-[var(--p8-vellum)]">
                <LockKeyhole size={16} strokeWidth={1.5} />
                Mask
              </div>
              <p className="text-xs leading-5 text-[var(--p8-vellum-dim)]">
                Session keys keep your main wallet out of match identity.
              </p>
            </div>
            <div className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-3">
              <div className="mb-1 flex items-center gap-2 text-sm font-bold text-[var(--p8-vellum)]">
                <Swords size={16} strokeWidth={1.5} />
                Reveal
              </div>
              <p className="text-xs leading-5 text-[var(--p8-vellum-dim)]">
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
          tone="lamp"
          onClick={onPracticeMode}
        />
        <ActionCard
          icon={Radio}
          label="Watch"
          title="Spectate command decisions"
          description="Use AI battles as a live product demo: observe scouting, pressure, and reveal moments without setup."
          tone="signal"
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
          tone="threat"
          onClick={isConnected ? onCreateGame : undefined}
          disabled={!isConnected}
        />
      </section>

      <section className="mx-auto mt-8 max-w-7xl">
        {isConnected ? (
          <div className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.2em] text-[var(--p8-vellum)]">
                  <Anchor size={16} strokeWidth={1.5} />
                  On-chain harbor
                </div>
                <p className="mt-1 text-sm text-[var(--p8-vellum-dim)]">
                  Join a live lobby after you understand the ambush loop.
                </p>
              </div>
              <button
                onClick={onSpectatorMode}
                className="inline-flex items-center justify-center gap-2 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-4 py-2 text-sm font-bold text-[var(--p8-vellum)] transition hover:border-[var(--p8-brass)] focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
              >
                <Users size={16} strokeWidth={1.5} />
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
          <div className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="mb-2 flex items-center gap-2 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.2em] text-[var(--p8-lamp)]">
                  <Trophy size={16} strokeWidth={1.5} />
                  Competition unlocks after the hook lands
                </div>
                <p className="max-w-3xl text-sm leading-6 text-[var(--p8-vellum-dim)]">
                  Connect a wallet when you want provable wins, public captain
                  status, lobbies, and eventually shareable Solana challenge
                  links. Until then, the skirmish and AI battle modes are the
                  fastest way to feel the game.
                </p>
              </div>
              <button
                onClick={onSpectatorMode}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-4 py-2 text-sm font-bold text-[var(--p8-vellum)] transition hover:border-[var(--p8-brass)] focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
              >
                <Eye size={16} strokeWidth={1.5} />
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
