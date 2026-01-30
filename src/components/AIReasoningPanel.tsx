"use client";

import React, { useState, useEffect } from "react";
import { AIReasoning, AIOption } from "@/lib/pirateGameEngine";

interface AIReasoningPanelProps {
  reasoning: AIReasoning | null;
  isVisible: boolean;
  onClose?: () => void;
  showHints?: boolean; // For practice mode - show AI hints to player
}

/**
 * AIReasoningPanel - Displays the AI's "Thought Stream"
 * 
 * Core Principles Applied:
 * - ENHANCEMENT FIRST: Enhances game experience by teaching players strategy
 * - CLEAN: Clear visual hierarchy with explicit separation of concerns
 * - MODULAR: Self-contained component with minimal external dependencies
 * - PERFORMANT: Uses CSS transitions, avoids unnecessary re-renders
 */
export const AIReasoningPanel: React.FC<AIReasoningPanelProps> = ({
  reasoning,
  isVisible,
  onClose,
  showHints = false,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isThinking, setIsThinking] = useState(false);

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

  if (!isVisible || !reasoning) {
    return null;
  }

  const { optionsConsidered, chosenOption, gameAnalysis, difficulty, thinkingTime } = reasoning;

  // Sort options by score (highest first)
  const sortedOptions = [...optionsConsidered].sort((a, b) => b.score - a.score);
  const discardedOptions = sortedOptions.filter(
    (opt) => opt.target !== chosenOption?.target || opt.type !== chosenOption?.type
  );

  return (
    <div className="ai-reasoning-panel fixed right-4 top-20 w-96 max-h-[80vh] overflow-y-auto bg-slate-900/95 border-2 border-amber-600 rounded-lg shadow-2xl z-50">
      {/* Header */}
      <div className="panel-header bg-gradient-to-r from-amber-900 to-slate-900 p-4 border-b border-amber-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <h3 className="text-amber-400 font-bold text-lg font-pirate">
              {showHints ? "AI Strategy Hint" : "AI Thought Stream"}
            </h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-amber-400 transition-colors"
              aria-label="Close panel"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-slate-400">Difficulty:</span>
          <span className="text-xs text-amber-300 font-semibold">{difficulty.name}</span>
          <span className="text-xs text-slate-500">|</span>
          <span className="text-xs text-slate-400">Aggression:</span>
          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-500"
              style={{ width: `${difficulty.aggressiveness * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Thinking Time Indicator */}
      <div className="thinking-time p-3 bg-slate-800/50 border-b border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Thinking Time</span>
          <span className="text-amber-400 font-mono">{thinkingTime}ms</span>
        </div>
        <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isThinking ? "bg-amber-500 animate-pulse w-full" : "bg-green-500 w-full"
            }`}
          />
        </div>
      </div>

      {/* Game Analysis */}
      <div className="game-analysis p-3 bg-slate-800/30 border-b border-slate-700">
        <h4 className="text-xs uppercase text-slate-500 font-semibold mb-2">Strategic Assessment</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={`p-2 rounded ${gameAnalysis.isWinning ? "bg-green-900/30 text-green-400" : "bg-slate-800 text-slate-400"}`}>
            <span className="block text-slate-500">Status</span>
            {gameAnalysis.isWinning ? "📈 Winning" : gameAnalysis.isLosing ? "📉 Losing" : "⚖️ Balanced"}
          </div>
          <div className="p-2 rounded bg-slate-800 text-slate-400">
            <span className="block text-slate-500">Territories</span>
            {gameAnalysis.territoriesControlled} controlled
          </div>
          <div className="p-2 rounded bg-slate-800 text-slate-400">
            <span className="block text-slate-500">Fleet Size</span>
            {gameAnalysis.totalShips} ships
          </div>
          <div className={`p-2 rounded ${gameAnalysis.resourceAdvantage ? "bg-green-900/30 text-green-400" : "bg-slate-800 text-slate-400"}`}>
            <span className="block text-slate-500">Resources</span>
            {gameAnalysis.resourceAdvantage ? "💰 Advantage" : "⚖️ Normal"}
          </div>
        </div>
      </div>

      {/* Chosen Action */}
      {chosenOption && (
        <div className="chosen-action p-4 bg-gradient-to-r from-green-900/30 to-slate-900 border-b border-green-600/30">
          <h4 className="text-xs uppercase text-green-500 font-semibold mb-2 flex items-center gap-1">
            <span>✓</span> Selected Action
          </h4>
          <div className="flex items-start gap-3">
            <div className="action-icon text-2xl">{getActionIcon(chosenOption.type)}</div>
            <div className="flex-1">
              <div className="text-green-400 font-semibold capitalize">
                {formatActionType(chosenOption.type)}
              </div>
              <div className="text-sm text-slate-300">{chosenOption.reason}</div>
              {chosenOption.target && (
                <div className="text-xs text-slate-500 mt-1">Target: {chosenOption.target}</div>
              )}
            </div>
            <div className="score-badge">
              <ScoreBadge score={animatedScore} isChosen />
            </div>
          </div>
        </div>
      )}

      {/* Discarded Options */}
      {discardedOptions.length > 0 && (
        <div className="discarded-options p-4">
          <h4 className="text-xs uppercase text-slate-500 font-semibold mb-2 flex items-center gap-1">
            <span>✕</span> Discarded Options
          </h4>
          <div className="space-y-2">
            {discardedOptions.slice(0, 3).map((option, index) => (
              <DiscardedOptionCard key={`${option.type}-${index}`} option={option} index={index} />
            ))}
            {discardedOptions.length > 3 && (
              <div className="text-xs text-slate-500 text-center py-1">
                +{discardedOptions.length - 3} more options considered
              </div>
            )}
          </div>
        </div>
      )}

      {/* Educational Footer */}
      <div className="panel-footer p-3 bg-slate-800/50 border-t border-slate-700 text-xs text-slate-400">
        <p>
          {showHints
            ? "💡 Learning AI: Study these decisions to improve your strategy!"
            : "🎓 Spectator Mode: Watch how the AI evaluates each move"}
        </p>
      </div>
    </div>
  );
};

/**
 * Score Badge Component - Visual representation of option score
 */
const ScoreBadge: React.FC<{ score: number; isChosen?: boolean }> = ({ score, isChosen }) => {
  const getScoreColor = (s: number) => {
    if (s >= 90) return "bg-green-500";
    if (s >= 70) return "bg-yellow-500";
    if (s >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div
      className={`score-badge flex flex-col items-center justify-center w-12 h-12 rounded-full ${
        isChosen ? "ring-2 ring-green-400 ring-offset-2 ring-offset-slate-900" : ""
      } ${getScoreColor(score)}`}
    >
      <span className="text-xs text-white/80">Score</span>
      <span className="text-sm font-bold text-white">{score}</span>
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
      className={`discarded-option flex items-center gap-3 p-2 rounded bg-slate-800/50 transition-all duration-300 ${
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
      }`}
    >
      <div className="text-lg opacity-50">{getActionIcon(option.type)}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-400 capitalize truncate">{formatActionType(option.type)}</div>
        <div className="text-xs text-slate-500 truncate">{option.reason}</div>
      </div>
      <ScoreBadge score={option.score} />
    </div>
  );
};

/**
 * Helper: Get emoji icon for action type
 */
const getActionIcon = (type: AIOption["type"]): string => {
  const icons: Record<AIOption["type"], string> = {
    claim_territory: "🏴‍☠️",
    attack: "⚔️",
    move_ship: "⛵",
    build_ship: "🔨",
    pass: "⏭️",
  };
  return icons[type] || "❓";
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
