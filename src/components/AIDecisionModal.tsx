/**
 * AIDecisionModal - Shows AI's decision-making process for educational purposes
 * ENHANCEMENT: Makes AI vs AI battles more engaging and teachable
 */

'use client';

import { AIReasoning } from '@/lib/pirateGameEngine';
import { Icon, type IconName } from '@/components/ui/Icon';

interface AIDecisionModalProps {
  reasoning: AIReasoning | null;
  isVisible: boolean;
  playerName: string;
  onClose: () => void;
}

const OPTION_ICONS: Record<string, IconName> = {
  attack: 'attack',
  move_ship: 'move',
  claim_territory: 'claim',
  build_ship: 'build',
  pass: 'end-turn',
};

export default function AIDecisionModal({
  reasoning,
  isVisible,
  playerName,
  onClose
}: AIDecisionModalProps) {
  if (!isVisible || !reasoning) return null;

  const { chosenOption, optionsConsidered = [], gameAnalysis, difficulty, thinkingTime } = reasoning || {};

  const position = gameAnalysis.isWinning
    ? { label: 'Winning', icon: 'trend-up' as const, className: 'text-[var(--p8-signal)]' }
    : gameAnalysis.isLosing
      ? { label: 'Losing', icon: 'trend-down' as const, className: 'text-[var(--p8-threat)]' }
      : { label: 'Even', icon: 'circle-dot' as const, className: 'text-[var(--p8-lamp)]' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${playerName} decision log`}
    >
      <div
        className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-6 shadow-[0_2px_8px_rgba(0,0,0,.45)]"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-white/[0.02] text-[var(--p8-lamp)]">
              <Icon name="brain" size={22} strokeWidth={1.5} />
            </span>
            <div>
              <h2 className="font-[var(--font-world)] text-2xl capitalize text-[var(--p8-vellum)]">
                {playerName}&apos;s turn
              </h2>
              <p className="mt-1 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.14em] text-[var(--p8-vellum-dim)]">
                {difficulty.name} • Thinking time: {thinkingTime}ms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close decision log"
            className="rounded-[var(--p8-radius)] p-2 text-[var(--p8-vellum-dim)] transition-colors hover:bg-white/[0.04] hover:text-[var(--p8-vellum)] focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
          >
            <Icon name="close" size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Game Analysis */}
        <div className="mb-4 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] p-4">
          <h3 className="mb-3 flex items-center gap-2 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.16em] text-[var(--p8-vellum-dim)]">
            <Icon name="stats" size={14} strokeWidth={1.5} />
            <span>Situation analysis</span>
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-2">
              <div className="font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.1em] text-[var(--p8-vellum-mute)]">Position</div>
              <div className={`flex items-center gap-1.5 font-bold ${position.className}`}>
                <Icon name={position.icon} size={15} strokeWidth={1.5} />
                {position.label}
              </div>
            </div>
            <div className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-2">
              <div className="font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.1em] text-[var(--p8-vellum-mute)]">Territories</div>
              <div className="font-[var(--font-instrument)] font-bold text-[var(--p8-vellum)]">{gameAnalysis.territoriesControlled}</div>
            </div>
            <div className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-2">
              <div className="font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.1em] text-[var(--p8-vellum-mute)]">Ships</div>
              <div className="font-[var(--font-instrument)] font-bold text-[var(--p8-vellum)]">{gameAnalysis.totalShips}</div>
            </div>
            <div className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-2">
              <div className="font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.1em] text-[var(--p8-vellum-mute)]">Resources</div>
              <div className={`font-bold ${gameAnalysis.resourceAdvantage ? 'text-[var(--p8-signal)]' : 'text-[var(--p8-vellum-dim)]'}`}>
                {gameAnalysis.resourceAdvantage ? 'Rich' : 'Steady'}
              </div>
            </div>
          </div>
        </div>

        {/* Options Considered */}
        <div className="mb-4">
          <h3 className="mb-3 flex items-center gap-2 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.16em] text-[var(--p8-vellum-dim)]">
            <Icon name="target" size={14} strokeWidth={1.5} />
            <span>Options evaluated ({(optionsConsidered || []).length})</span>
          </h3>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {(optionsConsidered || []).slice(0, 5).map((option, idx) => {
              const isChosen = chosenOption?.type === option.type &&
                chosenOption?.shipId === option.shipId &&
                chosenOption?.target === option.target;

              return (
                <div
                  key={idx}
                  className={`rounded-[var(--p8-radius)] border p-3 transition-colors ${isChosen
                      ? 'border-[var(--p8-lamp)] bg-[color-mix(in_srgb,var(--p8-lamp)_8%,transparent)]'
                      : 'border-[var(--p8-brass-line)] bg-[var(--p8-ink)]'
                    }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={isChosen ? 'text-[var(--p8-lamp)]' : 'text-[var(--p8-vellum-dim)]'}>
                        <Icon name={OPTION_ICONS[option.type] ?? 'circle-dot'} size={18} strokeWidth={1.5} />
                      </span>
                      <span className="font-bold capitalize text-[var(--p8-vellum)]">
                        {option.type.replace('_', ' ')}
                      </span>
                      {isChosen && (
                        <span className="rounded-full bg-[var(--p8-lamp)] px-2 py-0.5 font-[var(--font-instrument)] text-[11px] text-[#0b1418]">
                          Chosen
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-[var(--font-instrument)] text-[11px] text-[var(--p8-vellum-mute)]">Score:</span>
                      <span className={`font-[var(--font-instrument)] font-bold ${option.score >= 80 ? 'text-[var(--p8-signal)]' :
                          option.score >= 60 ? 'text-[var(--p8-lamp)]' :
                            'text-[var(--p8-vellum-dim)]'
                        }`}>
                        {option.score}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--p8-vellum-dim)]">{option.reason}</p>
                  {option.target && (
                    <p className="mt-1 font-[var(--font-instrument)] text-[11px] text-[var(--p8-vellum-mute)]">Target: {option.target}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chosen Action */}
        {chosenOption && (
          <div className="mb-4 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] border-l-4 border-l-[var(--p8-lamp)] bg-[var(--p8-ink)] p-4">
            <h3 className="mb-2 flex items-center gap-2 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.16em] text-[var(--p8-lamp)]">
              <Icon name="sparkles" size={14} strokeWidth={1.5} />
              <span>Final decision</span>
            </h3>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] text-[var(--p8-lamp)]">
                <Icon name={OPTION_ICONS[chosenOption.type] ?? 'circle-dot'} size={22} strokeWidth={1.5} />
              </span>
              <div className="flex-1">
                <div className="mb-1 text-lg font-bold capitalize text-[var(--p8-vellum)]">
                  {chosenOption.type.replace('_', ' ')}
                </div>
                <p className="mb-2 text-sm text-[var(--p8-vellum-dim)]">{chosenOption.reason}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[var(--p8-brass-line)] px-2 py-1 font-[var(--font-instrument)] text-[11px] text-[var(--p8-lamp)]">
                    Score: {chosenOption.score}
                  </span>
                  <span className="rounded-full border border-[var(--p8-brass-line)] px-2 py-1 font-[var(--font-instrument)] text-[11px] text-[var(--p8-vellum-dim)]">
                    {difficulty.level} AI • {(difficulty.aggressiveness * 100).toFixed(0)}% aggressive
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Educational Note */}
        <div className="mb-4 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] p-3">
          <p className="text-xs italic text-[var(--p8-vellum-dim)]">
            <strong className="not-italic text-[var(--p8-vellum)]">Learning moment:</strong> The AI evaluates multiple options and scores them based on
            the game situation. Higher difficulty AIs consider more factors and make smarter decisions.
            {gameAnalysis.isLosing && " Notice how the AI becomes more aggressive when losing!"}
          </p>
        </div>

        {/* Continue Button */}
        <button
          onClick={onClose}
          autoFocus
          className="w-full rounded-[var(--p8-radius)] bg-[var(--p8-lamp)] px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#0b1418] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p8-vellum)]"
        >
          Continue watching
        </button>
      </div>
    </div>
  );
}
