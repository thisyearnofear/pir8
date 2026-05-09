"use client";

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
    <div className="fixed top-4 left-4 z-40">
      <div className="bg-gradient-to-r from-neon-magenta/90 to-neon-purple/90 text-white rounded-xl font-bold shadow-lg overflow-hidden animate-fade-in">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/20">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <span className="text-sm font-black">PRACTICE MODE</span>
          </div>
          <button
            onClick={onExit}
            className="text-xs bg-black/30 px-3 py-1.5 rounded hover:bg-black/50 transition-all"
            title="Exit practice mode"
          >
            Exit
          </button>
        </div>

        {/* Status Info */}
        <div className="px-4 py-2 bg-black/20">
          <p className="text-xs text-white/90">
            🛡️ Safe environment - no blockchain fees
          </p>
        </div>

        {/* Privacy Education Button */}
        <div className="px-4 py-2 bg-black/20 border-t border-white/10">
          <button
            onClick={onShowDossier}
            className="w-full text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <span>📋</span>
            <span>View AI Dossier on You</span>
          </button>
          <p className="text-[10px] text-white/50 mt-1 text-center">
            See what opponents learn from visible data
          </p>
        </div>

        {/* Upgrade Prompt */}
        {showUpgradePrompt && (
          <div className="px-4 py-3 bg-black/20 space-y-2 border-t border-white/10">
            <p className="text-xs text-white/90 font-semibold">
              🏆 Ready for real battles with stakes?
            </p>
            <button
              onClick={onUpgrade}
              className="w-full text-xs bg-gradient-to-r from-neon-cyan to-neon-gold text-black font-bold py-2 px-3 rounded-lg
                         hover:shadow-lg hover:scale-105 transition-all"
            >
              Connect Wallet & Play On-Chain
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
