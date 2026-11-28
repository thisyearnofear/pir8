"use client";

import { Ship } from "../types/game";
import { GameBalance } from "../lib/gameBalance";
import { Icon, type IconName } from "@/components/ui/Icon";

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

const SHIP_ICONS: Record<Ship["type"], IconName> = {
  sloop: "ship-scout",
  frigate: "ship",
  galleon: "ship-heavy",
  flagship: "crown",
};

const ACTIONS: Array<{
  id: "move" | "attack" | "claim" | "collect";
  icon: IconName;
  label: string;
  description: string;
  threat?: boolean;
}> = [
  {
    id: "move",
    icon: "move",
    label: "Move",
    description: "Navigate to adjacent territory",
  },
  {
    id: "attack",
    icon: "attack",
    label: "Attack",
    description: "Engage nearby enemy ships",
    threat: true,
  },
  {
    id: "claim",
    icon: "claim",
    label: "Claim",
    description: "Claim current territory",
  },
  {
    id: "collect",
    icon: "collect",
    label: "Collect",
    description: "Harvest resources",
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
      ? "bg-[var(--p8-signal)]"
      : healthPercent > 30
        ? "bg-[var(--p8-lamp)]"
        : "bg-[var(--p8-threat)]";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${ship.type} orders`}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-5 shadow-[0_2px_8px_rgba(0,0,0,.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-white/[0.02] text-[var(--p8-lamp)]">
              <Icon name={SHIP_ICONS[ship.type]} size={22} strokeWidth={1.5} />
            </span>
            <div>
              <h3 className="font-[var(--font-world)] text-lg capitalize text-[var(--p8-vellum)]">
                {ship.type}
              </h3>
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-24 overflow-hidden rounded-full bg-[var(--p8-ink)]"
                  role="progressbar"
                  aria-valuenow={ship.health}
                  aria-valuemin={0}
                  aria-valuemax={ship.maxHealth}
                  aria-label={`${ship.type} hull integrity`}
                >
                  <div
                    className={`h-full ${healthColor} transition-all`}
                    style={{ width: `${healthPercent}%` }}
                  />
                </div>
                <span className="font-[var(--font-instrument)] text-[11px] text-[var(--p8-vellum-dim)]">
                  {ship.health}/{ship.maxHealth}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close orders"
            className="rounded-[var(--p8-radius)] p-2 text-[var(--p8-vellum-dim)] transition-colors hover:bg-white/[0.04] hover:text-[var(--p8-vellum)] focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
          >
            <Icon name="close" size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Ship Stats */}
        <div className="mb-4 flex justify-center gap-4 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.1em] text-[var(--p8-vellum-dim)]">
          <span className="inline-flex items-center gap-1">
            <Icon name="attack" size={13} /> ATK {ship.attack}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="shield" size={13} /> DEF {ship.defense}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="target" size={13} /> RNG {GameBalance.SHIP_BALANCE[ship.type].range}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="move" size={13} /> SPD {ship.speed}
          </span>
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
                aria-label={`${action.label}: ${action.description}`}
                className={`
                  relative rounded-[var(--p8-radius)] border p-3 transition-colors
                  ${action.threat
                    ? "border-[color-mix(in_srgb,var(--p8-threat)_55%,transparent)] hover:border-[var(--p8-threat)]"
                    : "border-[var(--p8-brass-line)] hover:border-[var(--p8-brass)]"}
                  bg-white/[0.02]
                  ${isDisabled ? "cursor-not-allowed opacity-40" : ""}
                  ${aiMode ? "cursor-default" : ""}
                  ${isChosen ? "ring-2 ring-[var(--p8-lamp)]" : ""}
                  focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]
                `}
              >
                {isChosen && (
                  <div className="absolute -top-2 -right-2 rounded-full bg-[var(--p8-lamp)] px-2 py-1 font-[var(--font-instrument)] text-[11px] text-[#0b1418]">
                    AI choice
                  </div>
                )}
                <div className={`mb-1 ${action.threat ? "text-[var(--p8-threat)]" : "text-[var(--p8-lamp)]"}`}>
                  <Icon name={action.icon} size={22} strokeWidth={1.5} />
                </div>
                <div className="text-sm font-bold text-[var(--p8-vellum)]">
                  {action.label}
                </div>
                <div className="mt-1 text-xs text-[var(--p8-vellum-dim)]">
                  {action.description}
                </div>
              </button>
            );
          })}
        </div>

        {/* AI Mode Indicator */}
        {aiMode && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-3 py-2">
              <Icon name="brain" size={16} className="text-[var(--p8-vellum-dim)]" />
              <span className="text-sm font-bold text-[var(--p8-vellum-dim)]">
                AI is deciding…
              </span>
            </div>
          </div>
        )}

        {/* Position Info */}
        <div className="mt-4 text-center font-[var(--font-instrument)] text-[11px] text-[var(--p8-vellum-mute)]">
          Position: ({ship.position.x}, {ship.position.y})
        </div>
      </div>
    </div>
  );
}
