/**
 * AIStreamPanel - Scrollable stream of AI reasoning history
 * Designed for the right sidebar, collapsible.
 * Following: MODULAR, CLEAN architecture
 */

'use client';

import { useRef, useEffect } from 'react';
import { AIReasoning } from '@/lib/pirateGameEngine';

interface AIStreamPanelProps {
  history: AIReasoning[];
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
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
    <div className={`bg-slate-900/90 border border-slate-700 rounded-xl overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors bg-slate-900"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🧠</span>
          <div className="text-left">
            <h3 className="font-bold text-white text-sm">AI Thought Stream</h3>
            <p className="text-[10px] text-amber-400 font-mono uppercase tracking-widest">
              Live Reasoning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {history?.length > 0 && (
            <div className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
              {history.length}
            </div>
          )}

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

      {/* Stream Content */}
      {isExpanded && (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto max-h-[400px] border-t border-slate-700 p-2 space-y-3 custom-scrollbar"
        >
          {!history || history.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs italic">
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
    <div className={`p-3 rounded-lg border transition-all duration-500 ${isLatest
      ? 'bg-amber-900/20 border-amber-600/50 shadow-lg shadow-amber-900/10 animate-in slide-in-from-top'
      : 'bg-slate-800/40 border-slate-700/50 opacity-80'
      }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">
            {difficulty.name}
          </span>
          {isLatest && (
            <span className="text-[10px] text-amber-400 animate-pulse font-bold uppercase">
              • Current
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-500 font-mono">{thinkingTime}ms</span>
      </div>

      {chosenOption ? (
        <div className="flex items-start gap-2">
          <span className="text-lg mt-0.5">{getActionIcon(chosenOption.type)}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white capitalize mb-0.5">
              {chosenOption.type.replace('_', ' ')}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed italic line-clamp-2">
              "{chosenOption.reason}"
            </p>
            {chosenOption.target && (
              <div className="text-[9px] text-slate-500 mt-1 font-mono uppercase">
                Target: {chosenOption.target}
              </div>
            )}
          </div>
          <div className={`text-[10px] font-black px-1.5 py-0.5 rounded ${getScoreColor(chosenOption.score)}`}>
            {chosenOption.score}
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-500 italic">No action chosen.</div>
      )}
    </div>
  );
}

function getActionIcon(type: string): string {
  const icons: Record<string, string> = {
    claim_territory: "🏴‍☠️",
    attack: "⚔️",
    move_ship: "⛵",
    build_ship: "🔨",
    pass: "⏭️",
  };
  return icons[type] || "❓";
}

function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-400 bg-green-400/10";
  if (score >= 70) return "text-yellow-400 bg-yellow-400/10";
  if (score >= 50) return "text-orange-400 bg-orange-400/10";
  return "text-red-400 bg-red-400/10";
}
