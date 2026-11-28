"use client";

import { useState, useEffect } from "react";
import { AIReasoning, AIOption } from "@/lib/pirateGameEngine";
import { Icon, type IconName } from "./ui/Icon";

interface AIReasoningPanelProps {
  reasoning: AIReasoning | null;
  isVisible: boolean;
  onClose?: () => void;
  showHints?: boolean; // For practice mode - show AI hints to player
}

/* Boundary map: engine action types → instruments. Mirrors AIStreamPanel. */
const ACTION_ICONS: Record<AIOption["type"], IconName> = {
  claim_territory: "claim",
  attack: "attack",
  move_ship: "move",
  build_ship: "build",
  pass: "close",
};

const actionIcon = (type: AIOption["type"]): IconName =>
  ACTION_ICONS[type] || "circle-dot";

/**
 * AIReasoningPanel - Displays the AI's "Thought Stream"
 *
 * ENHANCEMENT: Now with user-controlled expansion
 * - Starts as mini-panel on left side
 * - User can click to expand to full modal
 * - Doesn't block the game interface by default
 */
export const AIReasoningPanel: React.FC<AIReasoningPanelProps> = ({
  reasoning,
  isVisible,
  onClose,
  showHints = false,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Animate the thinking process
  useEffect(() => {
    if (reasoning) {
      setIsThinking(true);
      const timer = setTimeout(() => {
        setIsThinking(false);
        if (reasoning.chosenOption) {
          setAnimatedScore(reasoning.chosenOption.score);
        }
      }, Math.min(reasoning.thinkingTime, 1000)); // Cap animation at 1 second

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [reasoning]);

  // Reset expansion when reasoning changes
  useEffect(() => {
    if (reasoning) {
      setIsExpanded(false);
    }
  }, [reasoning]);

  if (!isVisible || !reasoning) {
    return null;
  }

  const { optionsConsidered = [], chosenOption, gameAnalysis, difficulty, thinkingTime } = reasoning || {};

  // Sort options by score (highest first)
  const sortedOptions = [...(optionsConsidered || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
  const discardedOptions = sortedOptions.filter(
    (opt) => opt.target !== chosenOption?.target || opt.type !== chosenOption?.type
  );

  // Mini panel version (default, non-blocking)
  if (!isExpanded) {
    return (
      <div
        className="ai-reasoning-panel-mini fixed bottom-24 left-2 top-auto z-40 w-[calc(100%-16px)] max-w-[calc(100%-16px)] cursor-pointer rounded-[var(--p8-radius)] border-2 border-[var(--p8-brass-line)] bg-[var(--p8-deep)] shadow-[var(--p8-shadow-instrument)] transition-all hover:border-[var(--p8-brass)] sm:bottom-auto sm:left-4 sm:top-32 sm:w-72"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(true);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(true);
          }
        }}>
        {/* Mini Header */}
        <div className="panel-header border-b border-[var(--p8-brass-line)] bg-[var(--p8-ink)] p-2 sm:p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[var(--p8-lamp)]">
                <Icon name="brain" size={18} />
              </span>
              <h3 className="text-xs font-bold text-[var(--p8-lamp)] sm:text-sm">
                AI Thinking...
              </h3>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose?.();
              }}
              className="flex min-h-[32px] min-w-[32px] items-center justify-center p-1 text-[var(--p8-vellum-dim)] hover:text-[var(--p8-lamp)] sm:hidden"
              aria-label="Close panel"
            >
              <Icon name="close" size={14} />
            </button>
            <span className="hidden items-center gap-1 rounded bg-[var(--p8-deep)] px-2 py-1 text-xs text-[var(--p8-lamp)] transition-colors group-hover:bg-[var(--p8-ink)] sm:flex">
              Expand <Icon name="chevron-right" size={12} />
            </span>
          </div>
        </div>

        {/* Compact content */}
        <div className="space-y-2 p-2 sm:p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--p8-vellum-dim)]">AI Level:</span>
            <span className="font-semibold text-[var(--p8-lamp)]">{difficulty.name}</span>
          </div>

          {chosenOption && (
            <div className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] p-2">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[var(--p8-signal)]">
                  <Icon name={actionIcon(chosenOption.type)} size={16} />
                </span>
                <span className="text-xs font-bold capitalize text-[var(--p8-vellum)] sm:text-sm">
                  {chosenOption.type.replace('_', ' ')}
                </span>
              </div>
              <p className="line-clamp-2 text-xs text-[var(--p8-vellum-dim)]">{chosenOption.reason}</p>
            </div>
          )}

          <div className="border-t border-[var(--p8-brass-line)] pt-2 text-center text-xs text-[var(--p8-lamp)] transition-colors group-hover:text-[var(--p8-vellum)]">
            <span className="hidden sm:inline">
              {(optionsConsidered || []).length > 1
                ? `Evaluated ${(optionsConsidered || []).length} options — tap for full analysis`
                : 'Tap anywhere to see full analysis'}
            </span>
            <span className="sm:hidden">Tap for details</span>
          </div>
        </div>
      </div>
    );
  }

  // Expanded modal version (full detail)
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={() => setIsExpanded(false)}
    >
      <div
        className="ai-reasoning-panel mx-2 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[var(--p8-radius)] border-2 border-[var(--p8-brass-line)] bg-[var(--p8-deep)] shadow-[var(--p8-shadow-instrument)] overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="panel-header border-b border-[var(--p8-brass-line)] bg-[var(--p8-ink)] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[var(--p8-lamp)]">
                <Icon name="brain" size={24} />
              </span>
              <h3 className="text-lg font-bold text-[var(--p8-lamp)]">
                {showHints ? "AI Strategy Hint" : "AI Thought Stream"}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(false)}
                className="rounded bg-[var(--p8-deep)] px-2 py-1 text-sm text-[var(--p8-vellum-dim)] transition-colors hover:text-[var(--p8-lamp)]"
                aria-label="Minimize panel"
              >
                Minimize
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-[var(--p8-vellum-dim)] transition-colors hover:text-[var(--p8-lamp)]"
                  aria-label="Close panel"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-[var(--p8-vellum-dim)]">Difficulty:</span>
            <span className="text-xs font-semibold text-[var(--p8-lamp)]">{difficulty.name}</span>
            <span className="text-xs text-[var(--p8-vellum-mute)]">|</span>
            <span className="text-xs text-[var(--p8-vellum-dim)]">Aggression:</span>
            <div className="h-2 w-16 overflow-hidden rounded-full bg-[var(--p8-deep)]">
              <div
                className="h-full bg-[var(--p8-threat)] transition-all duration-500"
                style={{ width: `${difficulty.aggressiveness * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Thinking Time Indicator */}
        <div className="thinking-time border-b border-[var(--p8-brass-line)] bg-[var(--p8-ink)] p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--p8-vellum-dim)]">Thinking Time</span>
            <span className="font-[var(--font-instrument)] text-[var(--p8-lamp)]">{thinkingTime}ms</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--p8-deep)]">
            <div
              className={`h-full w-full transition-all duration-300 ${isThinking ? "bg-[var(--p8-lamp)]" : "bg-[var(--p8-signal)]"
                }`}
            />
          </div>
        </div>

        {/* Game Analysis */}
        <div className="game-analysis border-b border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-3">
          <h4 className="mb-2 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.14em] text-[var(--p8-vellum-dim)]">Strategic Assessment</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`rounded p-2 ${gameAnalysis.isWinning ? "border border-[var(--p8-signal)] text-[var(--p8-signal)]" : "border border-[var(--p8-brass-line)] text-[var(--p8-vellum-dim)]"}`}>
              <span className="block text-[var(--p8-vellum-mute)]">Status</span>
              <span className="flex items-center gap-1">
                {gameAnalysis.isWinning ? (
                  <><Icon name="trend-up" size={13} /> Winning</>
                ) : gameAnalysis.isLosing ? (
                  <><Icon name="trend-down" size={13} /> Losing</>
                ) : (
                  <><Icon name="gauge" size={13} /> Balanced</>
                )}
              </span>
            </div>
            <div className="rounded border border-[var(--p8-brass-line)] p-2 text-[var(--p8-vellum-dim)]">
              <span className="block text-[var(--p8-vellum-mute)]">Territories</span>
              {gameAnalysis.territoriesControlled} controlled
            </div>
            <div className="rounded border border-[var(--p8-brass-line)] p-2 text-[var(--p8-vellum-dim)]">
              <span className="block text-[var(--p8-vellum-mute)]">Fleet Size</span>
              {gameAnalysis.totalShips} ships
            </div>
            <div className={`rounded p-2 ${gameAnalysis.resourceAdvantage ? "border border-[var(--p8-signal)] text-[var(--p8-signal)]" : "border border-[var(--p8-brass-line)] text-[var(--p8-vellum-dim)]"}`}>
              <span className="block text-[var(--p8-vellum-mute)]">Resources</span>
              <span className="flex items-center gap-1">
                {gameAnalysis.resourceAdvantage ? (
                  <><Icon name="gold" size={13} /> Advantage</>
                ) : (
                  <><Icon name="gauge" size={13} /> Normal</>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Chosen Action */}
        {chosenOption && (
          <div className="chosen-action border-b border-[var(--p8-signal)] bg-[var(--p8-ink)] p-4">
            <h4 className="mb-2 flex items-center gap-1 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.14em] text-[var(--p8-signal)]">
              <Icon name="check" size={13} /> Selected Action
            </h4>
            <div className="flex items-start gap-3">
              <div className="action-icon text-[var(--p8-signal)]">
                <Icon name={actionIcon(chosenOption.type)} size={24} />
              </div>
              <div className="flex-1">
                <div className="font-semibold capitalize text-[var(--p8-signal)]">
                  {formatActionType(chosenOption.type)}
                </div>
                <div className="text-sm text-[var(--p8-vellum-dim)]">{chosenOption.reason}</div>
                {chosenOption.target && (
                  <div className="mt-1 text-xs text-[var(--p8-vellum-mute)]">Target: {chosenOption.target}</div>
                )}
              </div>
              <div className="score-badge">
                <ScoreBadge score={animatedScore} isChosen />
              </div>
            </div>
          </div>
        )}

        {/* Discarded Options */}
        {(discardedOptions || []).length > 0 && (
          <div className="discarded-options p-4">
            <h4 className="mb-2 flex items-center gap-1 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.14em] text-[var(--p8-vellum-dim)]">
              <Icon name="close" size={13} /> Discarded Options
            </h4>
            <div className="space-y-2">
              {(discardedOptions || []).slice(0, 3).map((option, index) => (
                <DiscardedOptionCard key={`${option.type}-${index}`} option={option} index={index} />
              ))}
              {(discardedOptions || []).length > 3 && (
                <div className="py-1 text-center text-xs text-[var(--p8-vellum-mute)]">
                  +{(discardedOptions || []).length - 3} more options considered
                </div>
              )}
            </div>
          </div>
        )}

        {/* Educational Footer */}
        <div className="panel-footer border-t border-[var(--p8-brass-line)] bg-[var(--p8-ink)] p-3 text-xs text-[var(--p8-vellum-dim)]">
          <p className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-[var(--p8-lamp)]">
              <Icon name={showHints ? "sparkles" : "eye"} size={14} />
            </span>
            {showHints
              ? "Learning AI: Study these decisions to improve your strategy!"
              : "Spectator Mode: Watch how the AI evaluates each move"}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Score Badge Component - Visual representation of option score
 */
const ScoreBadge: React.FC<{ score: number; isChosen?: boolean }> = ({ score, isChosen }) => {
  const getScoreBg = (s: number) => {
    if (s >= 90) return "bg-[var(--p8-signal)]";
    if (s >= 70) return "bg-[var(--p8-vellum-dim)]";
    if (s >= 50) return "bg-[var(--p8-lamp)]";
    return "bg-[var(--p8-threat)]";
  };

  return (
    <div
      className={`score-badge flex h-12 w-12 flex-col items-center justify-center rounded-full ${isChosen ? "ring-2 ring-[var(--p8-signal)] ring-offset-2 ring-offset-[var(--p8-ink)]" : ""
        } ${getScoreBg(score)}`}
    >
      <span className="text-xs text-[var(--p8-ink)]">Score</span>
      <span className="text-sm font-bold text-[var(--p8-ink)]">{score}</span>
    </div>
  );
};

/**
 * Discarded Option Card - Shows why an option was rejected
 */
const DiscardedOptionCard: React.FC<{ option: AIOption; index: number }> = ({ option, index }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      className={`discarded-option flex items-center gap-3 rounded border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] p-2 transition-all duration-300 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
        }`}
    >
      <div className="text-[var(--p8-vellum-mute)] opacity-50">
        <Icon name={actionIcon(option.type)} size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm capitalize text-[var(--p8-vellum-dim)]">{formatActionType(option.type)}</div>
        <div className="truncate text-xs text-[var(--p8-vellum-mute)]">{option.reason}</div>
      </div>
      <ScoreBadge score={option.score} />
    </div>
  );
};

/**
 * Helper: Format action type for display
 */
const formatActionType = (type: AIOption["type"]): string => {
  const formats: Record<AIOption["type"], string> = {
    claim_territory: "Claim Territory",
    attack: "Attack",
    move_ship: "Move Ship",
    build_ship: "Build Ship",
    pass: "Pass Turn",
  };
  return formats[type] || type;
};

export default AIReasoningPanel;
