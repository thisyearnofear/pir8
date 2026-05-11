"use client";

import { useEffect, useMemo, useState } from "react";
import { Clipboard, Eye, Share2, Swords, Trophy, X } from "lucide-react";
import { useSafeWallet } from "@/components/SafeWalletProvider";
import { AgentArenaLeaderboard } from "./AgentArenaLeaderboard";
import {
  LeaderboardManager,
  LeaderboardAgent,
} from "@/lib/leaderboard-manager";
import { buildChallengeActionUrl, buildChallengeUrl } from "@/lib/shareLinks";

interface SocialModalProps {
  type: "leaderboard" | "referral";
  gameId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SocialModal({
  type,
  gameId,
  isOpen,
  onClose,
}: SocialModalProps) {
  const { publicKey } = useSafeWallet();
  const [agents, setAgents] = useState<LeaderboardAgent[]>([]);
  const [copied, setCopied] = useState(false);

  const referralCode = useMemo(() => {
    if (!publicKey) return "GUEST";
    return publicKey.toString().slice(0, 8).toUpperCase();
  }, [publicKey]);

  const challengeLink = useMemo(() => {
    return buildChallengeUrl({
      gameId,
      ref: referralCode !== "GUEST" ? referralCode : null,
    });
  }, [gameId, referralCode]);

  const actionLink = useMemo(() => {
    return buildChallengeActionUrl({
      gameId,
      ref: referralCode !== "GUEST" ? referralCode : null,
    });
  }, [gameId, referralCode]);

  const shareText = useMemo(() => {
    if (type === "leaderboard") {
      return "Check the PIR8 Shadow Seas captain ranks.";
    }

    if (gameId) {
      return `I opened a PIR8 duel in the Shadow Seas. Scout the board, mask your fleet, and try to beat my position.\n${challengeLink}\n#PIR8 #SolanaGaming`;
    }

    return `Beat my fleet in PIR8 Shadow Seas. Private naval tactics: scout, mask, reveal, ambush.\n${challengeLink}\n#PIR8 #SolanaGaming`;
  }, [challengeLink, gameId, type]);

  useEffect(() => {
    if (!isOpen || type !== "leaderboard") return;
    setAgents(LeaderboardManager.getTopAgents(10));
  }, [isOpen, type]);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: "twitter" | "copy") => {
    if (platform === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
        "_blank",
      );
      return;
    }

    handleCopy(shareText);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-cyan-200/30 bg-slate-950 p-5 shadow-2xl shadow-cyan-950/50 sm:p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/5 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-100">
              {type === "leaderboard" ? (
                <Trophy size={14} />
              ) : (
                <Share2 size={14} />
              )}
              {type === "leaderboard" ? "Ranks" : "Challenge Link"}
            </div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              {type === "leaderboard"
                ? "Captain standings"
                : gameId
                  ? "Challenge this duel"
                  : "Send a shadow skirmish"}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              {type === "leaderboard"
                ? "Track the captains and agents shaping the current meta."
                : "Share a playable entry point instead of a generic invite. The link opens PIR8 around scouting, masking, and ambush play."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-slate-300 transition hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {type === "leaderboard" ? (
          <AgentArenaLeaderboard agents={agents} />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-cyan-200/20 bg-cyan-200/5 p-3">
                <div className="mb-1 flex items-center gap-2 text-sm font-bold text-cyan-100">
                  <Swords size={16} />
                  Duel hook
                </div>
                <p className="text-xs leading-5 text-slate-500">
                  The recipient lands on a playable skirmish or match join.
                </p>
              </div>
              <div className="rounded-md border border-amber-200/20 bg-amber-200/5 p-3">
                <div className="mb-1 flex items-center gap-2 text-sm font-bold text-amber-100">
                  <Eye size={16} />
                  Watchable
                </div>
                <p className="text-xs leading-5 text-slate-500">
                  The message frames the game around decisive ambush moments.
                </p>
              </div>
              <div className="rounded-md border border-fuchsia-200/20 bg-fuchsia-200/5 p-3">
                <div className="mb-1 text-sm font-bold text-fuchsia-100">
                  Code {referralCode}
                </div>
                <p className="text-xs leading-5 text-slate-500">
                  Wallet-connected captains get attribution in the URL.
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-100">
                Challenge URL
              </h3>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="min-h-[48px] flex-1 rounded-md border border-white/10 bg-white/[0.04] px-3 py-3 font-mono text-sm text-slate-300 break-all">
                  {challengeLink}
                </div>
                <button
                  onClick={() => handleCopy(challengeLink)}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md bg-cyan-200 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-white"
                >
                  <Clipboard size={16} />
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-fuchsia-100">
                Blink Action URL
              </h3>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="min-h-[48px] flex-1 rounded-md border border-white/10 bg-white/[0.04] px-3 py-3 font-mono text-sm text-slate-300 break-all">
                  {actionLink}
                </div>
                <button
                  onClick={() => handleCopy(actionLink)}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border border-fuchsia-200/30 bg-fuchsia-200/10 px-4 py-2 text-sm font-black text-fuchsia-100 transition hover:border-fuchsia-100"
                >
                  <Clipboard size={16} />
                  Copy
                </button>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Prototype endpoint for Solana Actions/Blinks inspectors. The
                normal challenge URL remains the fallback for every browser.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-amber-100">
                Share Copy
              </h3>
              <div className="rounded-md border border-white/10 bg-slate-900/80 p-4 text-sm leading-6 text-slate-300 whitespace-pre-wrap">
                {shareText}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => handleShare("twitter")}
                className="flex-1 rounded-md border border-cyan-200/30 bg-cyan-200/10 px-4 py-3 text-sm font-bold text-cyan-100 transition hover:border-cyan-100"
              >
                Share on X
              </button>
              <button
                onClick={() => handleShare("copy")}
                className="flex-1 rounded-md border border-amber-200/30 bg-amber-200/10 px-4 py-3 text-sm font-bold text-amber-100 transition hover:border-amber-100"
              >
                Copy Discord Text
              </button>
            </div>
          </div>
        )}

        {copied && (
          <div className="fixed bottom-4 right-4 rounded-md bg-green-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
            Copied to clipboard
          </div>
        )}
      </div>
    </div>
  );
}
