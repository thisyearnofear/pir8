/**
 * AIStreamPanel - Scrollable stream of AI reasoning history
 * Designed for the right sidebar, collapsible.
 * Following: MODULAR, CLEAN architecture
 */

'use client';

import { useRef, useEffect } from 'react';
import { AIReasoning } from '@/lib/pirateGameEngine';
import { Icon, type IconName } from './ui/Icon';

interface AIStreamPanelProps {
  history: AIReasoning[];
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
}

/* Boundary map: engine action types → instruments. Mirrors AIReasoningPanel. */
const ACTION_ICONS: Record<string, IconName> = {
  claim_territory: 'claim',
  attack: 'attack',
  move_ship: 'move',
  build_ship: 'build',
  pass: 'close',
};

function actionIcon(type: string): IconName {
  return ACTION_ICONS[type] || 'circle-dot';
}

export default function AIStreamPanel({
  history,
  isExpanded,
  onToggle,
  className = '',
}: AIStreamPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when history updates (newest is first)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [history?.length]);

  return (
    <div className={`flex flex-col overflow-hidden rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] ${className}`}>
      {/* Header */}
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between bg-[var(--p8-deep)] p-4 transition-colors hover:bg-[var(--p8-ink)]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] text-[var(--p8-lamp)]">
            <Icon name="brain" size={16} />
          </span>
          <div className="text-left">
            <h3 className="text-sm font-bold text-[var(--p8-vellum)]">AI Thought Stream</h3>
            <p className="font-[var(--font-instrument)] text-[10px] uppercase tracking-[0.14em] text-[var(--p8-lamp)]">
              Live Reasoning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {history?.length > 0 && (
            <div className="rounded-full border border-[var(--p8-lamp)] bg-[var(--p8-ink)] px-2 py-0.5 text-[10px] font-bold text-[var(--p8-lamp)]">
              {history.length}
            </div>
          )}

          <Icon
            name="chevron-down"
            size={20}
            className={`text-[var(--p8-vellum-dim)] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Stream Content */}
      {isExpanded && (
        <div
          ref={scrollRef}
          className="max-h-[400px] flex-1 space-y-3 overflow-y-auto border-t border-[var(--p8-brass-line)] p-2"
        >
          {!history || history.length === 0 ? (
            <div className="py-8 text-center text-xs italic text-[var(--p8-vellum-mute)]">
              Waiting for AI to analyze the seas...
            </div>
          ) : (
            history.map((reasoning, idx) => (
              <ReasoningCard key={`${reasoning.thinkingTime}-${idx}`} reasoning={reasoning} isLatest={idx === 0} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ReasoningCard({ reasoning, isLatest }: { reasoning: AIReasoning; isLatest: boolean }) {
  const { chosenOption, difficulty, thinkingTime } = reasoning;

  return (
    <div className={`rounded-[var(--p8-radius)] border p-3 transition-all duration-500 ${isLatest
      ? 'border-[var(--p8-lamp)] bg-[var(--p8-ink)] shadow-[var(--p8-shadow-instrument)]'
      : 'border-[var(--p8-brass-line)] bg-[var(--p8-ink)] opacity-80'
      }`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded bg-[var(--p8-deep)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-[var(--p8-vellum-dim)]">
            {difficulty.name}
          </span>
          {isLatest && (
            <span className="text-[10px] font-bold uppercase text-[var(--p8-lamp)]">
              • Current
            </span>
          )}
        </div>
        <span className="font-[var(--font-instrument)] text-[10px] text-[var(--p8-vellum-mute)]">{thinkingTime}ms</span>
      </div>

      {chosenOption ? (
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-[var(--p8-signal)]">
            <Icon name={actionIcon(chosenOption.type)} size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 text-xs font-bold capitalize text-[var(--p8-vellum)]">
              {chosenOption.type.replace('_', ' ')}
            </div>
            <p className="line-clamp-2 text-[11px] italic leading-relaxed text-[var(--p8-vellum-dim)]">
              &quot;{chosenOption.reason}&quot;
            </p>
            {chosenOption.target && (
              <div className="mt-1 font-[var(--font-instrument)] text-[9px] uppercase text-[var(--p8-vellum-mute)]">
                Target: {chosenOption.target}
              </div>
            )}
          </div>
          <div className={`rounded px-1.5 py-0.5 text-[10px] font-black ${getScoreClass(chosenOption.score)}`}>
            {chosenOption.score}
          </div>
        </div>
      ) : (
        <div className="text-xs italic text-[var(--p8-vellum-mute)]">No action chosen.</div>
      )}
    </div>
  );
}

// Text-only accents: Tailwind cannot apply /opacity modifiers to var() hex
// colors, so score badges carry color in the glyph, not a tinted wash.
function getScoreClass(score: number): string {
  if (score >= 90) return 'text-[var(--p8-signal)]';
  if (score >= 70) return 'text-[var(--p8-vellum)]';
  if (score >= 50) return 'text-[var(--p8-lamp)]';
  return 'text-[var(--p8-threat)]';
}
