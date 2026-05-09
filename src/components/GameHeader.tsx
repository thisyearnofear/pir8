"use client";

import dynamic from "next/dynamic";

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
    <header className="mb-6">
      {/* Mobile-First Header Layout */}
      <div className="space-y-4">
        {/* Title Section - Always Full Width */}
        <div className="text-center">
          <div className="relative inline-block">
            {/* Animated background glow */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-neon-cyan/20 via-neon-gold/20 to-neon-cyan/20
                            rounded-2xl blur-xl animate-pulse"
            ></div>

            {/* Main title */}
            <div
              className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90
                            border-2 border-neon-cyan/50 rounded-2xl p-4 sm:p-6 backdrop-blur-sm
                            shadow-2xl shadow-neon-cyan/20"
            >
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text
                             bg-gradient-to-r from-neon-cyan via-neon-gold to-neon-cyan mb-2 sm:mb-3
                             animate-subtle-glow drop-shadow-2xl"
              >
                🏴‍☠️ PIR8 BATTLE ARENA
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-300 font-semibold tracking-wide">
                Strategic naval warfare on the blockchain
              </p>

              {/* Dynamic status indicators */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-3 sm:mt-4">
                <div className="flex items-center gap-2 bg-slate-700/60 rounded-full px-3 py-1.5 border border-neon-cyan/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm font-mono text-green-400">
                    LIVE
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-slate-700/60 rounded-full px-3 py-1.5 border border-neon-gold/30">
                  <span className="text-xs sm:text-sm font-mono text-neon-gold">
                    DEVNET
                  </span>
                </div>
                {playerCount !== undefined && playerCount > 0 && (
                  <div className="flex items-center gap-2 bg-slate-700/60 rounded-full px-3 py-1.5 border border-neon-magenta/30">
                    <span className="text-xs sm:text-sm font-mono text-neon-magenta">
                      {playerCount} PIRATES
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Responsive Grid */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {/* Spectator Mode Button */}
          <button
            onClick={onSpectatorMode}
            className="relative group"
            aria-label="Watch battles"
          >
            <div className="absolute inset-0 bg-neon-purple/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
            <div
              className="relative bg-gradient-to-r from-neon-purple/80 to-neon-cyan/80
                            hover:from-neon-purple hover:to-neon-cyan
                            text-black font-bold py-2 px-3 sm:px-4 rounded-xl
                            hover:shadow-lg hover:shadow-neon-purple/50 hover:scale-105
                            active:scale-95 transition-all duration-300 flex items-center gap-2
                            text-sm sm:text-base"
            >
              <span className="text-base sm:text-lg">👁️</span>
              <span className="hidden sm:inline">Watch</span>
            </div>
          </button>

          {/* Invite Button */}
          <button
            onClick={onOpenReferral}
            className="relative group"
            aria-label="Invite friends"
          >
            <div className="absolute inset-0 bg-neon-gold/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
            <div
              className="relative bg-gradient-to-r from-neon-gold/80 to-neon-orange/80
                            hover:from-neon-gold hover:to-neon-orange
                            text-black font-bold py-2 px-3 sm:px-4 rounded-xl
                            hover:shadow-lg hover:shadow-neon-gold/50 hover:scale-105
                            active:scale-95 transition-all duration-300 flex items-center gap-2
                            text-sm sm:text-base"
            >
              <span className="text-base sm:text-lg">🚀</span>
              <span className="hidden sm:inline">Invite</span>
            </div>
          </button>

          {/* Leaderboard Button */}
          <button
            onClick={onOpenLeaderboard}
            className="relative group"
            aria-label="View leaderboard"
          >
            <div className="absolute inset-0 bg-neon-magenta/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
            <div
              className="relative bg-gradient-to-r from-neon-magenta/80 to-neon-orange/80
                            hover:from-neon-magenta hover:to-neon-orange
                            text-black font-bold py-2 px-3 sm:px-4 rounded-xl
                            hover:shadow-lg hover:shadow-neon-magenta/50 hover:scale-105
                            active:scale-95 transition-all duration-300 flex items-center gap-2
                            text-sm sm:text-base"
            >
              <span className="text-base sm:text-lg">🏆</span>
              <span className="hidden sm:inline">Leaderboard</span>
            </div>
          </button>

          {/* Wallet Button */}
          <div className="relative">
            <div className="absolute inset-0 bg-neon-cyan/20 rounded-xl blur-md"></div>
            <div className="relative">
              <WalletButtonWrapper />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
