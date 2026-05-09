"use client";

import LobbyBrowser from "@/components/LobbyBrowser";

interface EmptyStateViewProps {
  isConnected: boolean;
  onPracticeMode: () => void;
  onCreateGame: () => void;
  onSpectatorMode: () => void;
  onAIBattle: () => void;
}

export default function EmptyStateView({
  isConnected,
  onPracticeMode,
  onCreateGame,
  onSpectatorMode,
  onAIBattle,
}: EmptyStateViewProps) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[600px] px-4">
      <div className="text-center max-w-4xl w-full">
        {!isConnected ? (
          /* Not Connected - Wallet CTA */
          <div className="space-y-8">
            <div className="relative inline-block">
              <div className="text-8xl sm:text-9xl animate-bounce-slow filter drop-shadow-2xl">
                🔐
              </div>
              <div className="absolute -top-4 -right-4 text-4xl animate-spin-slow">
                ⚓
              </div>
            </div>

            <div>
              <h3
                className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text
                             bg-gradient-to-r from-neon-cyan via-neon-gold to-neon-cyan mb-4
                             animate-subtle-glow"
              >
                Connect Your Wallet to Begin
              </h3>
              <p className="text-lg sm:text-xl text-gray-300 mb-2">
                Join the battle on Solana blockchain
              </p>
              <p className="text-base text-gray-400 mb-8">
                Or start a practice match without connecting - no wallet
                needed!
              </p>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div
                className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-2 border-neon-cyan/50
                             rounded-2xl p-6 hover:scale-105 transition-all duration-300
                             hover:shadow-lg hover:shadow-neon-cyan/30"
              >
                <div className="text-5xl mb-4">💎</div>
                <h4 className="text-xl font-bold text-neon-cyan mb-2">
                  Real Battles
                </h4>
                <p className="text-sm text-gray-400 mb-4">
                  Connect wallet to play on-chain, earn rewards, and
                  climb the leaderboard
                </p>
                <div className="inline-flex items-center gap-2 text-neon-cyan text-sm font-semibold">
                  <span>Click &quot;Connect Wallet&quot; above</span>
                  <span>↑</span>
                </div>
              </div>

              <button
                onClick={onPracticeMode}
                className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-2 border-neon-gold/50
                           rounded-2xl p-6 hover:scale-105 transition-all duration-300
                           hover:shadow-lg hover:shadow-neon-gold/30 text-left"
              >
                <div className="text-5xl mb-4">🎮</div>
                <h4 className="text-xl font-bold text-neon-gold mb-2">
                  Practice Mode
                </h4>
                <p className="text-sm text-gray-400 mb-4">
                  Play offline vs AI opponents - perfect for learning
                  the game!
                </p>
                <div className="inline-flex items-center gap-2 text-neon-gold text-sm font-semibold">
                  <span>Click to Start</span>
                  <span>→</span>
                </div>
              </button>

              {/* NEW: AI vs AI Demo */}
              <button
                onClick={onAIBattle}
                className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-2 border-neon-magenta/50
                           rounded-2xl p-6 hover:scale-105 transition-all duration-300
                           hover:shadow-lg hover:shadow-neon-magenta/30 text-left"
              >
                <div className="text-5xl mb-4">⚔️</div>
                <h4 className="text-xl font-bold text-neon-magenta mb-2">
                  Watch AI Battle
                </h4>
                <p className="text-sm text-gray-400 mb-4">
                  See the game in action! Learn by watching AI compete.
                </p>
                <div className="inline-flex items-center gap-2 text-neon-magenta text-sm font-semibold">
                  <span>Watch Demo</span>
                  <span>→</span>
                </div>
              </button>
            </div>

            {/* Features Preview */}
            <div className="mt-12 pt-8 border-t border-slate-700/50">
              <p className="text-sm text-gray-500 uppercase tracking-wider mb-4">
                What Awaits You
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <span className="bg-slate-800/40 px-4 py-2 rounded-full text-gray-300 border border-slate-700/50">
                  ⚔️ Strategic Combat
                </span>
                <span className="bg-slate-800/40 px-4 py-2 rounded-full text-gray-300 border border-slate-700/50">
                  💰 Treasure Hunting
                </span>
                <span className="bg-slate-800/40 px-4 py-2 rounded-full text-gray-300 border border-slate-700/50">
                  🚢 Fleet Building
                </span>
                <span className="bg-slate-800/40 px-4 py-2 rounded-full text-gray-300 border border-slate-700/50">
                  ⚡ Speed Bonuses
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Connected but No Game - Clear CTAs */
          <div className="space-y-12">
            <div className="text-7xl sm:text-8xl animate-bounce-slow filter drop-shadow-2xl">
              🏴‍☠️
            </div>
            <div>
              <h3
                className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text
                             bg-gradient-to-r from-neon-cyan via-neon-gold to-neon-cyan mb-4"
              >
                Ready for Battle, Captain!
              </h3>
              <p className="text-lg sm:text-xl text-gray-300 mb-2">
                Your wallet is connected
              </p>
            </div>

            {/* NEW: Lobby Browser Hero */}
            <LobbyBrowser />

            {/* Action Cards for Connected Users (Secondary) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-8 border-t border-slate-700/30">
              {/* Practice Mode */}
              <button
                onClick={onPracticeMode}
                className="group bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-2 border-neon-gold/50
                           rounded-2xl p-6 hover:scale-105 transition-all duration-300
                           hover:shadow-lg hover:shadow-neon-gold/30 text-left"
              >
                <div className="text-5xl mb-4">⚔️</div>
                <h4 className="text-xl font-bold text-neon-gold mb-2">
                  Practice Mode
                </h4>
                <p className="text-sm text-gray-400 mb-4">
                  Sharpen your skills vs AI. No on-chain fees or gas
                  costs.
                </p>
                <div className="flex items-center gap-2 text-neon-gold text-sm font-semibold">
                  <span>Train Now</span>
                  <span>→</span>
                </div>
              </button>

              {/* NEW: AI vs AI Demo */}
              <button
                onClick={onAIBattle}
                className="group bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-2 border-neon-magenta/50
                           rounded-2xl p-6 hover:scale-105 transition-all duration-300
                           hover:shadow-lg hover:shadow-neon-magenta/30 text-left"
              >
                <div className="text-5xl mb-4">🤖</div>
                <h4 className="text-xl font-bold text-neon-magenta mb-2">
                  Watch AI Battle
                </h4>
                <p className="text-sm text-gray-400 mb-4">
                  Learn by watching AI opponents compete. No commitment
                  required!
                </p>
                <div className="flex items-center gap-2 text-neon-magenta text-sm font-semibold">
                  <span>Watch Demo</span>
                  <span>→</span>
                </div>
              </button>

              {/* Watch / Join */}
              <button
                onClick={onSpectatorMode}
                className="group bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-2 border-neon-purple/50
                           rounded-2xl p-6 hover:scale-105 transition-all duration-300
                           hover:shadow-lg hover:shadow-neon-purple/30 text-left"
              >
                <div className="text-5xl mb-4">👁️</div>
                <h4 className="text-xl font-bold text-neon-purple mb-2">
                  Watch & Join
                </h4>
                <p className="text-sm text-gray-400 mb-4">
                  Spectate live battles or join an existing game.
                </p>
                <div className="flex items-center gap-2 text-neon-purple text-sm font-semibold">
                  <span>Explore</span>
                  <span>→</span>
                </div>
              </button>
            </div>

            {/* Quick Tips */}
            <div className="max-w-2xl mx-auto">
              <div
                className="bg-gradient-to-r from-neon-cyan/10 to-neon-gold/10
                             border border-neon-cyan/30 rounded-xl p-6 backdrop-blur-sm"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">💡</span>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-neon-cyan mb-2">
                      Getting Started
                    </div>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>
                        •{" "}
                        <strong className="text-gray-300">
                          Create Battle:
                        </strong>{" "}
                        Start on-chain game with real stakes
                      </li>
                      <li>
                        •{" "}
                        <strong className="text-gray-300">
                          Practice Mode:
                        </strong>{" "}
                        Learn mechanics without gas fees
                      </li>
                      <li>
                        •{" "}
                        <strong className="text-gray-300">
                          Zcash Privacy:
                        </strong>{" "}
                        Use shielded memos for private moves
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
