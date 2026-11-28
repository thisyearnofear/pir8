/**
 * LeakageMeter Component
 *
 * Displays information leakage score and breakdown for practice mode.
 * Shows what the AI can see about the player's moves.
 *
 * Principles:
 * - CSS-only animations for performance
 * - Clear visual hierarchy for educational value
 */

'use client';

import { useState } from 'react';
import { InformationLeakageReport } from '@/lib/privacySimulation';
import { Icon, type IconName } from '../ui/Icon';

interface LeakageMeterProps {
  report: InformationLeakageReport;
  isGhostFleetActive: boolean;
  ghostFleetCharges: number;
  isExpanded?: boolean;
  onToggle?: () => void;
  className?: string;
}

// Privacy state icon by score band.
const getPrivacyIcon = (score: number): IconName => {
  if (score === 0) return 'lock';
  if (score < 30) return 'shield';
  if (score < 60) return 'eye';
  return 'radar';
};

const getPrivacyLabel = (score: number): string => {
  if (score === 0) return 'Fully Private (Ghost Fleet)';
  if (score < 30) return 'Low Leakage';
  if (score < 60) return 'Moderate Leakage';
  if (score < 80) return 'High Leakage';
  return 'Fully Exposed';
};

// Cabin status scale: quiet (signal) → watch (lamp) → exposed (threat).
const getScoreColor = (score: number): string => {
  if (score < 30) return 'text-[var(--p8-signal)]';
  if (score < 60) return 'text-[var(--p8-lamp)]';
  return 'text-[var(--p8-threat)]';
};

const getScoreBg = (score: number): string => {
  if (score < 30) return 'bg-[var(--p8-signal)]';
  if (score < 60) return 'bg-[var(--p8-lamp)]';
  return 'bg-[var(--p8-threat)]';
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
  isExpanded: externalExpanded,
  onToggle,
  className = '',
}: LeakageMeterProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = externalExpanded ?? internalExpanded;
  const toggleExpanded = onToggle || (() => setInternalExpanded(!internalExpanded));
  const [showDetails, setShowDetails] = useState(false);

  const { totalLeakageScore, visibleShipPositions, visibleResources, visibleTerritories, patternsDetected } = report;

  return (
    <div className={`overflow-hidden rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] ${className}`}>
      {/* Header */}
      <button
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between p-4 transition-colors hover:bg-[var(--p8-ink)]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] text-[var(--p8-lamp)]">
            <Icon name={getPrivacyIcon(totalLeakageScore)} size={18} />
          </span>
          <div className="text-left">
            <h3 className="text-sm font-bold text-[var(--p8-vellum)]">Information Leakage</h3>
            <p className={`text-xs ${getScoreColor(totalLeakageScore)}`}>
              {getPrivacyLabel(totalLeakageScore)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`rounded-full px-3 py-1 text-sm font-bold text-[var(--p8-ink)] ${getScoreBg(totalLeakageScore)}`}>
            {totalLeakageScore}%
          </div>

          <Icon
            name="chevron-down"
            size={20}
            className={`text-[var(--p8-vellum-dim)] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-[var(--p8-brass-line)] px-4 pb-4">
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-3 overflow-hidden rounded-full bg-[var(--p8-ink)]">
              <div
                className={`h-full transition-all duration-500 ${getScoreBg(totalLeakageScore)}`}
                style={{ width: `${totalLeakageScore}%` }}
              />
            </div>
          </div>

          {/* Leakage Breakdown */}
          <div className="mt-4 space-y-2">
            <h4 className="font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.14em] text-[var(--p8-vellum-dim)]">
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
          <div className="mt-4 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] p-3">
            <p className="text-sm text-[var(--p8-vellum-dim)]">
              {getEducationalMessage(totalLeakageScore)}
            </p>
          </div>

          {/* Ghost Fleet Status */}
          {isGhostFleetActive && (
            <div className="mt-4 rounded-[var(--p8-radius)] border border-[var(--p8-signal)] bg-[var(--p8-ink)] p-3">
              <div className="flex items-center gap-2">
                <span className="text-[var(--p8-signal)]">
                  <Icon name="eye-off" size={18} />
                </span>
                <div>
                  <p className="font-bold text-[var(--p8-signal)]">Ghost Fleet Active</p>
                  <p className="text-xs text-[var(--p8-vellum-dim)]">
                    {ghostFleetCharges} charge{ghostFleetCharges !== 1 ? 's' : ''} remaining
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Details Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-4 text-xs text-[var(--p8-signal)] transition-colors hover:text-[var(--p8-vellum)]"
          >
            {showDetails ? 'Hide Details' : 'Show What AI Knows'}
          </button>

          {/* Detailed Information */}
          {showDetails && (
            <div className="mt-3 space-y-3 text-sm">
              {patternsDetected.length > 0 && (
                <div className="rounded-[var(--p8-radius)] border border-[var(--p8-threat)] bg-[var(--p8-ink)] p-3">
                  <p className="mb-2 flex items-center gap-1.5 font-semibold text-[var(--p8-threat)]">
                    <Icon name="target" size={14} /> AI Predictions
                  </p>
                  <ul className="space-y-1 text-[var(--p8-vellum-dim)]">
                    {patternsDetected.map((pattern, i) => (
                      <li key={i} className="text-xs">• {pattern}</li>
                    ))}
                  </ul>
                </div>
              )}

              {visibleShipPositions.length > 0 && (
                <div className="rounded-[var(--p8-radius)] border border-[var(--p8-lamp)] bg-[var(--p8-ink)] p-3">
                  <p className="mb-2 flex items-center gap-1.5 font-semibold text-[var(--p8-lamp)]">
                    <Icon name="navigation" size={14} /> Visible Ship Positions
                  </p>
                  <ul className="space-y-1 text-[var(--p8-vellum-dim)]">
                    {visibleShipPositions.map((pos, i) => (
                      <li key={i} className="text-xs">• ({pos.x}, {pos.y})</li>
                    ))}
                  </ul>
                </div>
              )}

              {visibleResources.length > 0 && (
                <div className="rounded-[var(--p8-radius)] border border-[var(--p8-lamp)] bg-[var(--p8-ink)] p-3">
                  <p className="mb-2 flex items-center gap-1.5 font-semibold text-[var(--p8-lamp)]">
                    <Icon name="supplies" size={14} /> Visible Resources
                  </p>
                  <ul className="space-y-1 text-[var(--p8-vellum-dim)]">
                    {visibleResources.map((res, i) => (
                      <li key={i} className="text-xs">• {res.type}: {res.amount} at ({res.position.x}, {res.position.y})</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-[var(--p8-radius)] border border-[var(--p8-signal)] bg-[var(--p8-ink)] p-3">
                <p className="mb-2 flex items-center gap-1.5 font-semibold text-[var(--p8-signal)]">
                  <Icon name="sparkles" size={14} /> Privacy Tip
                </p>
                <p className="text-xs text-[var(--p8-vellum-dim)]">
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
    <div className="flex items-center justify-between rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] p-2">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${isLeaked ? 'bg-[var(--p8-threat)]' : 'bg-[var(--p8-signal)]'}`} />
        <span className="text-sm text-[var(--p8-vellum-dim)]">{label}</span>
      </div>
      <span className={`text-xs ${isLeaked ? 'text-[var(--p8-threat)]' : 'text-[var(--p8-signal)]'}`}>
        {isLeaked ? detail : 'Hidden'}
      </span>
    </div>
  );
}

export default LeakageMeter;
