/**
 * LeakageMeter Component
 * 
 * Displays information leakage score and breakdown for practice mode.
 * Shows what the AI can see about the player's moves.
 * 
 * Principles:
 * - Uses Tailwind config for animations (DRY)
 * - CSS-only animations for performance
 * - Clear visual hierarchy for educational value
 */

'use client';

import { useState } from 'react';
import { InformationLeakageReport } from '@/lib/privacySimulation';

interface LeakageMeterProps {
  report: InformationLeakageReport;
  isGhostFleetActive: boolean;
  ghostFleetCharges: number;
  className?: string;
}

// Utility functions for visual feedback
const getPrivacyIcon = (score: number): string => {
  if (score === 0) return '🔒';
  if (score < 30) return '🛡️';
  if (score < 60) return '👁️';
  return '👀';
};

const getPrivacyLabel = (score: number): string => {
  if (score === 0) return 'Fully Private (Ghost Fleet)';
  if (score < 30) return 'Low Leakage';
  if (score < 60) return 'Moderate Leakage';
  if (score < 80) return 'High Leakage';
  return 'Fully Exposed';
};

const getScoreColor = (score: number): string => {
  if (score === 0) return 'text-emerald-400';
  if (score < 30) return 'text-green-400';
  if (score < 60) return 'text-yellow-400';
  if (score < 80) return 'text-orange-400';
  return 'text-red-400';
};

const getScoreBg = (score: number): string => {
  if (score === 0) return 'bg-emerald-500';
  if (score < 30) return 'bg-green-500';
  if (score < 60) return 'bg-yellow-500';
  if (score < 80) return 'bg-orange-500';
  return 'bg-red-500';
};

const getEducationalMessage = (score: number): string => {
  if (score === 0) {
    return 'Ghost Fleet is active! Your moves are hidden from AI pirates. This simulates Zcash privacy where transactions are shielded.';
  }
  if (score < 30) {
    return 'Good privacy! The AI can see limited information about your strategy. On Solana, this would require careful transaction patterns.';
  }
  if (score < 60) {
    return 'Moderate exposure. The AI is learning your patterns. On a transparent blockchain, this information would be permanently visible.';
  }
  if (score < 80) {
    return 'High information leakage! The AI can predict many of your moves. Consider using Ghost Fleet charges for critical turns.';
  }
  return 'Fully exposed! The AI knows your strategy. This is what happens on transparent blockchains - all your moves are visible to sophisticated opponents.';
};

export function LeakageMeter({
  report,
  isGhostFleetActive,
  ghostFleetCharges,
  className = '',
}: LeakageMeterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const { totalLeakageScore, visibleShipPositions, visibleResources, visibleTerritories, patternsDetected } = report;

  return (
    <div className={`bg-slate-900/90 border border-slate-700 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getPrivacyIcon(totalLeakageScore)}</span>
          <div className="text-left">
            <h3 className="font-bold text-white text-sm">Information Leakage</h3>
            <p className={`text-xs ${getScoreColor(totalLeakageScore)}`}>
              {getPrivacyLabel(totalLeakageScore)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full ${getScoreBg(totalLeakageScore)} text-white text-sm font-bold`}>
            {totalLeakageScore}%
          </div>
          
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-700">
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getScoreBg(totalLeakageScore)}`}
                style={{ width: `${totalLeakageScore}%` }}
              />
            </div>
          </div>

          {/* Leakage Breakdown */}
          <div className="mt-4 space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Visible to AI Pirates
            </h4>
            
            <div className="space-y-2">
              <LeakageItem
                label="Ship Positions"
                isLeaked={visibleShipPositions.length > 0}
                detail={`${visibleShipPositions.length} ships visible`}
              />
              <LeakageItem
                label="Resource Counts"
                isLeaked={visibleResources.length > 0}
                detail={visibleResources.length > 0 ? `${visibleResources.length} resources visible` : 'Hidden'}
              />
              <LeakageItem
                label="Movement Patterns"
                isLeaked={patternsDetected.length > 0}
                detail={`${patternsDetected.length} patterns detected`}
              />
              <LeakageItem
                label="Play Style"
                isLeaked={patternsDetected.length > 2}
                detail={`${patternsDetected.length} patterns detected`}
              />
              <LeakageItem
                label="Territory Control"
                isLeaked={visibleTerritories.length > 0}
                detail={`${visibleTerritories.length} territories visible`}
              />
            </div>
          </div>

          {/* Educational Message */}
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
            <p className="text-sm text-slate-300">
              {getEducationalMessage(totalLeakageScore)}
            </p>
          </div>

          {/* Ghost Fleet Status */}
          {isGhostFleetActive && (
            <div className="mt-4 p-3 bg-green-900/30 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">👻</span>
                <div>
                  <p className="font-bold text-green-400">Ghost Fleet Active</p>
                  <p className="text-xs text-green-300/70">
                    {ghostFleetCharges} charge{ghostFleetCharges !== 1 ? 's' : ''} remaining
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Details Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-4 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {showDetails ? 'Hide Details' : 'Show What AI Knows'}
          </button>

          {/* Detailed Information */}
          {showDetails && (
            <div className="mt-3 space-y-3 text-sm">
              {patternsDetected.length > 0 && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <p className="font-semibold text-red-400 mb-2">🎯 AI Predictions</p>
                  <ul className="space-y-1 text-slate-300">
                    {patternsDetected.map((pattern, i) => (
                      <li key={i} className="text-xs">• {pattern}</li>
                    ))}
                  </ul>
                </div>
              )}

              {visibleShipPositions.length > 0 && (
                <div className="p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                  <p className="font-semibold text-orange-400 mb-2">📍 Visible Ship Positions</p>
                  <ul className="space-y-1 text-slate-300">
                    {visibleShipPositions.map((pos, i) => (
                      <li key={i} className="text-xs">• ({pos.x}, {pos.y})</li>
                    ))}
                  </ul>
                </div>
              )}

              {visibleResources.length > 0 && (
                <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <p className="font-semibold text-yellow-400 mb-2">💎 Visible Resources</p>
                  <ul className="space-y-1 text-slate-300">
                    {visibleResources.map((res, i) => (
                      <li key={i} className="text-xs">• {res.type}: {res.amount} at ({res.position.x}, {res.position.y})</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="font-semibold text-blue-400 mb-2">💡 Privacy Tip</p>
                <p className="text-xs text-slate-300">
                  On transparent blockchains like Solana, all this information would be permanently 
                  recorded and visible to anyone. Zcash uses zero-knowledge proofs to hide transaction 
                  details while still validating them.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Subcomponent for individual leakage items
interface LeakageItemProps {
  label: string;
  isLeaked: boolean;
  detail: string;
}

function LeakageItem({ label, isLeaked, detail }: LeakageItemProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${isLeaked ? 'bg-red-500' : 'bg-emerald-500'}`} />
        <span className="text-sm text-slate-300">{label}</span>
      </div>
      <span className={`text-xs ${isLeaked ? 'text-red-400' : 'text-emerald-400'}`}>
        {isLeaked ? detail : 'Hidden'}
      </span>
    </div>
  );
}

export default LeakageMeter;
