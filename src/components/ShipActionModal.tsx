"use client";

import { Ship } from "../types/game";
import { SHIP_EMOJIS } from "../utils/constants";
import { GameBalance } from "../lib/gameBalance";

interface ShipActionModalProps {
  ship: Ship;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: "move" | "attack" | "claim" | "collect") => void;
  canAttack?: boolean;
  canClaim?: boolean;
  canCollect?: boolean;
  aiMode?: boolean; // True when showing AI decisions
  aiChosenAction?: "move" | "attack" | "claim" | "collect" | null; // Which action AI will take
}

const ACTIONS = [
  {
    id: "move" as const,
    icon: "⛵",
    label: "Move",
    description: "Navigate to adjacent territory",
    bgClass: "bg-neon-blue/20 border-neon-blue hover:bg-neon-blue/30",
    textClass: "text-neon-blue",
  },
  {
    id: "attack" as const,
    icon: "💥",
    label: "Attack",
    description: "Engage nearby enemy ships",
    bgClass: "bg-red-600/20 border-red-500 hover:bg-red-600/30",
    textClass: "text-red-400",
  },
  {
    id: "claim" as const,
    icon: "🏴‍☠️",
    label: "Claim",
    description: "Claim current territory",
    bgClass: "bg-neon-gold/20 border-neon-gold hover:bg-neon-gold/30",
    textClass: "text-neon-gold",
  },
  {
    id: "collect" as const,
    icon: "💎",
    label: "Collect",
    description: "Harvest resources",
    bgClass: "bg-green-600/20 border-green-500 hover:bg-green-600/30",
    textClass: "text-green-400",
  },
];

export default function ShipActionModal({
  ship,
  isOpen,
  onClose,
  onAction,
  canAttack = true,
  canClaim = true,
  canCollect = true,
  aiMode = false,
  aiChosenAction = null,
}: ShipActionModalProps) {
  if (!isOpen) return null;

  const healthPercent = (ship.health / ship.maxHealth) * 100;
  const healthColor =
    healthPercent > 60
      ? "bg-green-500"
      : healthPercent > 30
        ? "bg-yellow-500"
        : "bg-red-500";

  const isActionDisabled = (actionId: string) => {
    if (actionId === "attack" && !canAttack) return true;
    if (actionId === "claim" && !canClaim) return true;
    if (actionId === "collect" && !canCollect) return true;
    return false;
  };

  const handleAction = (actionId: "move" | "attack" | "claim" | "collect") => {
    onAction(actionId);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-neon-cyan 
                   rounded-xl p-5 w-full max-w-sm mx-4 shadow-2xl shadow-neon-cyan/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{SHIP_EMOJIS[ship.type]}</span>
            <div>
              <h3 className="text-lg font-bold text-white capitalize">
                {ship.type}
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${healthColor} transition-all`}
                    style={{ width: `${healthPercent}%` }}
                  />
                </div>
                <span className="text-xs text-gray-300 font-mono">
                  {ship.health}/{ship.maxHealth}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Ship Stats */}
        <div className="flex gap-4 mb-4 text-xs text-gray-400 justify-center">
          <span>⚔️ ATK: {ship.attack}</span>
          <span>🛡️ DEF: {ship.defense}</span>
          <span>🎯 RNG: {GameBalance.SHIP_BALANCE[ship.type].range}</span>
          <span>💨 SPD: {ship.speed}</span>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-2 gap-3">
          {ACTIONS.map((action) => {
            const isChosen = aiMode && aiChosenAction === action.id;
            const isDisabled = isActionDisabled(action.id);

            return (
              <button
                key={action.id}
                onClick={() => !aiMode && handleAction(action.id)}
                disabled={isDisabled || aiMode}
                className={`
                  ${action.bgClass} border rounded-lg p-3 
                  transition-all duration-200 relative
                  ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}
                  ${aiMode ? "cursor-default" : ""}
                  ${isChosen ? "ring-4 ring-neon-cyan ring-opacity-70 scale-105 animate-pulse" : ""}
                `}
              >
                {isChosen && (
                  <div className="absolute -top-2 -right-2 bg-neon-cyan text-black text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                    AI Choice!
                  </div>
                )}
                <div className={`text-2xl mb-1 ${action.textClass}`}>
                  {action.icon}
                </div>
                <div className={`text-sm font-bold ${action.textClass}`}>
                  {action.label}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {action.description}
                </div>
              </button>
            );
          })}
        </div>

        {/* AI Mode Indicator */}
        {aiMode && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 bg-neon-cyan/20 border border-neon-cyan px-3 py-2 rounded-lg">
              <span className="text-lg">🤖</span>
              <span className="text-sm font-bold text-neon-cyan">
                AI is deciding...
              </span>
            </div>
          </div>
        )}

        {/* Position Info */}
        <div className="mt-4 text-center text-xs text-gray-500">
          Position: ({ship.position.x}, {ship.position.y})
        </div>
      </div>
    </div>
  );
}
