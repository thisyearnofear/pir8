'use client';

import { ViralEvent } from '../hooks/useViralSystem';
import { Icon, type IconName } from './ui/Icon';

/* Boundary map: the viral-event data layer emits a fixed set of emoji.
   Translated to instruments at render, same as TerritoryBonusPanel. */
const VIRAL_ICONS: Record<string, IconName> = {
  '👑': 'crown',
  '⚔️': 'attack',
  '💥': 'zap',
};

interface ViralEventModalProps {
    event: ViralEvent | null;
    onShare: (event: ViralEvent, platform?: 'twitter' | 'discord' | 'copy') => void;
    onDismiss: () => void;
    isPracticeMode?: boolean;
}

export default function ViralEventModal({ event, onShare, onDismiss, isPracticeMode = false }: ViralEventModalProps) {
    if (!event) return null;

    const getRarityAccent = (rarity?: string) => {
        switch (rarity) {
            case 'legendary': return 'border-[var(--p8-lamp)] text-[var(--p8-lamp)]';
            case 'epic': return 'border-[var(--p8-signal)] text-[var(--p8-signal)]';
            case 'rare': return 'border-[var(--p8-signal)] text-[var(--p8-signal)]';
            default: return 'border-[var(--p8-brass-line)] text-[var(--p8-vellum-dim)]';
        }
    };

    const accent = getRarityAccent(event.rarity);
    const isLegendary = event.rarity === 'legendary';

    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/80"
             role="dialog" aria-modal="true">
            <div className={`relative mx-4 max-w-md rounded-[var(--p8-radius)] border-2 bg-[var(--p8-deep)] p-6 shadow-[var(--p8-shadow-instrument)] ${accent.split(' ')[0]}`}>

                {/* Legendary marker */}
                {isLegendary && !isPracticeMode && (
                    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[var(--p8-radius)]">
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute h-1 w-1 rounded-full bg-[var(--p8-lamp)]"
                                style={{
                                    left: `${(i * 83) % 100}%`,
                                    top: `${(i * 47) % 100}%`,
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Header */}
                <div className="relative z-10 mb-6 text-center">
                    <div className="mb-3 flex justify-center text-[var(--p8-lamp)]">
                        <Icon name={VIRAL_ICONS[event.emoji] || 'sparkles'} size={44} />
                    </div>

                    {event.rarity && (
                        <div className={`mb-3 inline-block rounded-full border px-3 py-1 font-[var(--font-instrument)] text-[11px] font-bold uppercase tracking-[0.14em] ${accent}`}>
                            {event.type.toUpperCase()} • {event.rarity.toUpperCase()}
                        </div>
                    )}

                    <h3 className="mb-2 text-2xl font-black text-[var(--p8-vellum)]">
                        {event.title}
                    </h3>
                    <p className="leading-relaxed text-[var(--p8-vellum-dim)]">
                        {event.description}
                    </p>
                </div>

                {/* Actions */}
                <div className="relative z-10 flex gap-3">
                    <button
                        onClick={() => onShare(event, 'twitter')}
                        className="flex flex-1 items-center justify-center gap-2 rounded-[var(--p8-radius)] border border-[var(--p8-signal)] bg-[var(--p8-ink)] px-4 py-3 font-bold text-[var(--p8-signal)] transition-colors hover:bg-[var(--p8-signal)] hover:text-[var(--p8-ink)]"
                    >
                        <Icon name="message" size={16} />
                        <span>Share</span>
                    </button>

                    <button
                        onClick={() => onShare(event, 'copy')}
                        className="flex flex-1 items-center justify-center gap-2 rounded-[var(--p8-radius)] border border-[var(--p8-lamp)] bg-[var(--p8-lamp)] px-4 py-3 font-bold text-[var(--p8-ink)] transition-colors hover:bg-[var(--p8-lamp-glow)]"
                    >
                        <Icon name="copy" size={16} />
                        <span>Copy</span>
                    </button>

                    <button
                        onClick={onDismiss}
                        aria-label="Dismiss"
                        className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-4 py-3 text-[var(--p8-vellum-dim)] transition-colors hover:border-[var(--p8-brass)] hover:text-[var(--p8-vellum)]"
                    >
                        <Icon name="close" size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
