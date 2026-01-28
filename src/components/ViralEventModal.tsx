'use client';

import { ViralEvent } from '../hooks/useViralSystem';

interface ViralEventModalProps {
    event: ViralEvent | null;
    onShare: (event: ViralEvent, platform?: 'twitter' | 'discord' | 'copy') => void;
    onDismiss: () => void;
}

export default function ViralEventModal({ event, onShare, onDismiss }: ViralEventModalProps) {
    if (!event) return null;

    const getRarityStyles = (rarity?: string) => {
        switch (rarity) {
            case 'legendary': return {
                border: 'border-yellow-500',
                bg: 'from-yellow-500/20 to-orange-500/20',
                text: 'text-yellow-500'
            };
            case 'epic': return {
                border: 'border-purple-500',
                bg: 'from-purple-500/20 to-magenta-500/20',
                text: 'text-purple-500'
            };
            case 'rare': return {
                border: 'border-blue-500',
                bg: 'from-blue-500/20 to-cyan-500/20',
                text: 'text-blue-500'
            };
            default: return {
                border: 'border-gray-500',
                bg: 'from-gray-500/20 to-slate-500/20',
                text: 'text-gray-400'
            };
        }
    };

    const styles = getRarityStyles(event.rarity);
    const isLegendary = event.rarity === 'legendary';

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-modal"
             role="dialog" aria-modal="true">
            <div className={`relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 
                      rounded-2xl border-2 ${styles.border} p-6 max-w-md mx-4 
                      shadow-2xl backdrop-blur-lg animate-in zoom-in duration-500
                      ${isLegendary ? 'animate-pulse' : ''}`}>

                {/* Legendary Sparkles */}
                {isLegendary && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2}s`,
                                    animationDuration: `${0.5 + Math.random()}s`
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Header */}
                <div className="text-center mb-6 relative z-10">
                    <div className="text-6xl mb-3 animate-bounce filter drop-shadow-2xl">
                        {event.emoji}
                    </div>

                    {event.rarity && (
                        <div className={`text-xs font-bold px-3 py-1 rounded-full inline-block mb-3
                            bg-gradient-to-r ${styles.bg} ${styles.text} border ${styles.border}`}>
                            {event.type.toUpperCase()} • {event.rarity.toUpperCase()}
                        </div>
                    )}

                    <h3 className="text-2xl font-black text-neon-gold mb-2">
                        {event.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                        {event.description}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 relative z-10">
                    <button
                        onClick={() => onShare(event, 'twitter')}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 
                       rounded-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span>🐦</span>
                        <span>Twitter</span>
                    </button>

                    <button
                        onClick={() => onShare(event, 'copy')}
                        className="flex-1 bg-gradient-to-r from-neon-magenta to-neon-orange 
                       text-black font-bold py-3 px-4 rounded-lg
                       hover:shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <span>📋</span>
                        <span>Copy</span>
                    </button>

                    <button
                        onClick={onDismiss}
                        className="px-4 py-3 bg-slate-600 hover:bg-slate-500 text-white 
                       rounded-lg transition-all"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
}