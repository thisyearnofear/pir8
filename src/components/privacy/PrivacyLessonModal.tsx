/**
 * PrivacyLessonModal Component
 * 
 * Displays educational content about privacy at key moments
 * during the practice mode experience.
 * 
 * Principles:
 * - Uses z-modal from Tailwind config (DRY)
 * - CSS transitions only (performant)
 * - Single responsibility: display lesson
 */

'use client';

// PrivacyLessonModal - No React import needed for Next.js
import { PrivacyLesson } from '@/lib/privacySimulation';

interface PrivacyLessonModalProps {
  lesson: PrivacyLesson | null;
  isVisible: boolean;
  onDismiss: () => void;
  onActivateGhostFleet?: () => void;
}

// Determine lesson type from content/title
const getLessonType = (lesson: PrivacyLesson): string => {
  const title = lesson.title.toLowerCase();
  if (title.includes('ghost') || title.includes('privacy')) return 'privacy_solution';
  if (title.includes('pattern')) return 'pattern_recognition';
  if (title.includes('predict')) return 'prediction';
  if (title.includes('counter') || title.includes('strategy')) return 'counter_strategy';
  return 'information_leak';
};

// Utility functions outside component (CLEAN)
const getLessonIcon = (lesson: PrivacyLesson): string => {
  const type = getLessonType(lesson);
  const icons: Record<string, string> = {
    information_leak: '🔓',
    pattern_recognition: '📊',
    prediction: '🎯',
    counter_strategy: '🛡️',
    privacy_solution: '🔒',
  };
  return icons[type] || '💡';
};

const getLessonStyles = (lesson: PrivacyLesson): string => {
  const type = getLessonType(lesson);
  const styles: Record<string, string> = {
    information_leak: 'from-red-500/20 to-orange-500/20 border-red-500/50',
    pattern_recognition: 'from-orange-500/20 to-yellow-500/20 border-orange-500/50',
    prediction: 'from-yellow-500/20 to-blue-500/20 border-yellow-500/50',
    counter_strategy: 'from-blue-500/20 to-purple-500/20 border-blue-500/50',
    privacy_solution: 'from-green-500/20 to-emerald-500/20 border-green-500/50',
  };
  return styles[type] || 'from-slate-500/20 to-slate-600/20 border-slate-500/50';
};

const getBlockchainContext = (lesson: PrivacyLesson): string => {
  // Use the lesson's blockchainContext if available, otherwise fallback
  if (lesson.blockchainContext) {
    return lesson.blockchainContext;
  }
  
  const type = getLessonType(lesson);
  const contexts: Record<string, string> = {
    information_leak: 'On transparent blockchains like Ethereum, all transactions are public. Anyone can see your wallet balance, transaction history, and smart contract interactions.',
    pattern_recognition: 'Sophisticated analytics firms and MEV bots analyze on-chain data to build profiles of wallet addresses, identifying whales, traders, and their strategies.',
    prediction: 'With enough data, opponents can predict your next moves. This is how MEV extraction works - bots see your pending transaction and front-run it.',
    counter_strategy: 'In DeFi, this manifests as sandwich attacks and front-running. Your visible transactions become opportunities for others to profit at your expense.',
    privacy_solution: 'Zcash uses zero-knowledge proofs (zk-SNARKs) to validate transactions without revealing sender, recipient, or amount. Solana privacy solutions are emerging.',
  };
  return contexts[type] || 'Privacy is a fundamental right. In blockchain gaming, it ensures fair play and strategic depth.';
};

export default function PrivacyLessonModal({
  lesson,
  isVisible,
  onDismiss,
  onActivateGhostFleet,
}: PrivacyLessonModalProps) {
  if (!isVisible || !lesson) return null;

  const isGhostFleetLesson = lesson.id.includes('ghost') || lesson.title.toLowerCase().includes('ghost');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`bg-gradient-to-br ${getLessonStyles(lesson)} border-2 rounded-2xl max-w-md w-full p-6 shadow-2xl`}>
        {/* Icon */}
        <div className="text-center mb-4">
          <span className="text-6xl">{getLessonIcon(lesson)}</span>
        </div>

        {/* Title */}
        <h2 className="text-xl font-black text-white text-center mb-3">
          {lesson.title}
        </h2>

        {/* Content */}
        <p className="text-slate-200 text-center leading-relaxed mb-6">
          {lesson.content}
        </p>

        {/* Ghost Fleet Special UI */}
        {isGhostFleetLesson && onActivateGhostFleet && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">👻</span>
              <div>
                <p className="font-bold text-green-400">Ghost Fleet Power</p>
                <p className="text-sm text-green-300/70">3 charges available</p>
              </div>
            </div>
            <ul className="text-sm text-slate-300 space-y-1 mb-4">
              <li>✓ Your moves are hidden from AI</li>
              <li>✓ AI cannot predict your strategy</li>
              <li>✓ Experience true privacy</li>
            </ul>
            <button
              onClick={onActivateGhostFleet}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
            >
              Activate Ghost Fleet
            </button>
          </div>
        )}

        {/* Blockchain Context */}
        <div className="mb-6 p-4 bg-slate-800/50 rounded-xl">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Blockchain Context</p>
          <p className="text-sm text-slate-300 leading-relaxed">
            {getBlockchainContext(lesson)}
          </p>
        </div>

        {/* Call to Action */}
        {lesson.callToAction && (
          <p className="text-center text-sm text-cyan-400 mb-4 font-semibold">
            {lesson.callToAction}
          </p>
        )}

        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
