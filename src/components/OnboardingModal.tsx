'use client';

import { useState, useEffect } from 'react';

interface OnboardingModalProps {
  isOpen: boolean;
  onDismiss: () => void;
}

const SLIDES = [
  {
    emoji: '🏴‍☠️',
    title: 'Welcome Aboard, Captain!',
    subtitle: 'Master the Seven Seas',
    content: 'Command your pirate fleet in strategic naval warfare. Every decision matters in this skill-based battle for treasure and glory!',
    details: [
      { icon: '⚔️', text: 'Strategic Combat', desc: 'Outmaneuver enemies with tactical positioning' },
      { icon: '💰', text: 'Treasure Hunting', desc: 'Control valuable territories for resources' },
      { icon: '🚢', text: 'Fleet Building', desc: 'Expand your armada with powerful ships' },
    ],
    bgGradient: 'from-red-900/20 to-orange-900/20'
  },
  {
    emoji: '⏱️',
    title: 'Speed Rewards the Bold',
    subtitle: 'Think Fast, Strike Faster',
    content: 'Quick decisions earn bonus points! The fastest captains dominate the leaderboards.',
    details: [
      { time: '< 5s', bonus: '+100 pts', color: 'text-green-400', desc: 'Lightning reflexes!' },
      { time: '< 10s', bonus: '+50 pts', color: 'text-cyan-400', desc: 'Swift thinking' },
      { time: '< 15s', bonus: '+25 pts', color: 'text-yellow-400', desc: 'Steady pace' },
    ],
    bgGradient: 'from-cyan-900/20 to-blue-900/20'
  },
  {
    emoji: '🔍',
    title: 'Scout Before You Strike',
    subtitle: 'Intelligence Wins Wars',
    content: 'Use your 3 precious scans wisely to reveal hidden treasures and plan your conquest.',
    details: [
      { icon: '🏝️', text: 'Islands', desc: 'Generate supplies for your fleet', value: '+3 supplies/turn' },
      { icon: '⚓', text: 'Ports', desc: 'Build new ships and recruit crew', value: '+5 gold, +2 crew/turn' },
      { icon: '💰', text: 'Treasures', desc: 'Rich deposits of pirate gold', value: '+10 gold/turn' },
    ],
    bgGradient: 'from-emerald-900/20 to-teal-900/20'
  },
  {
    emoji: '🚢',
    title: 'Command Your Fleet',
    subtitle: 'Every Ship Has Its Purpose',
    content: 'Build a balanced armada. Each vessel serves a unique role in your conquest strategy.',
    details: [
      { icon: '⛵', text: 'Sloop', desc: 'Fast scout ship', stats: 'Speed: 3 | Health: 100' },
      { icon: '🚢', text: 'Frigate', desc: 'Balanced warship', stats: 'Speed: 2 | Health: 200' },
      { icon: '🛳️', text: 'Galleon', desc: 'Heavy battleship', stats: 'Speed: 1 | Health: 350' },
    ],
    bgGradient: 'from-purple-900/20 to-indigo-900/20'
  },
  {
    emoji: '👑',
    title: 'Claim Your Victory',
    subtitle: 'Three Paths to Glory',
    content: 'Choose your strategy! Multiple victory conditions mean every playstyle can triumph.',
    details: [
      { icon: '🏴‍☠️', text: 'Territory Control', desc: 'Dominate 60% of valuable lands', color: 'text-red-400' },
      { icon: '⚔️', text: 'Fleet Supremacy', desc: 'Control 80% of naval power', color: 'text-orange-400' },
      { icon: '💎', text: 'Economic Victory', desc: 'Amass 15,000+ resources', color: 'text-yellow-400' },
    ],
    bgGradient: 'from-yellow-900/20 to-amber-900/20'
  },
];

export default function OnboardingModal({ isOpen, onDismiss }: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    return undefined;
  }, [isOpen]);

  if (!isOpen) return null;

  const slide = SLIDES[currentSlide];
  if (!slide) return null;

  const isLastSlide = currentSlide === SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      onDismiss();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[99999] w-screen h-screen"
      onClick={onDismiss}
    >
      <div 
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 
                   rounded-3xl border-2 border-neon-cyan p-6 sm:p-8 w-full max-w-2xl mx-4 
                   shadow-2xl shadow-neon-cyan/30 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 pr-8">
            <div className="text-5xl sm:text-6xl mb-3">{slide.emoji}</div>
            <h2 className="text-xl sm:text-2xl font-black text-neon-cyan mb-1">
              {slide.title}
            </h2>
            <h3 className="text-base sm:text-lg font-semibold text-neon-gold mb-2">
              {slide.subtitle}
            </h3>
            <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
              {slide.content}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-white text-2xl font-bold leading-none"
          >
            ✕
          </button>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-6">
          {slide.details.map((detail: any, i: number) => (
            <div key={i} className="bg-slate-800/80 rounded-xl px-4 py-3 border border-slate-600/60">
              {'time' in detail ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-700/80 rounded-lg px-3 py-1 border border-slate-600">
                      <span className="font-mono text-gray-300 text-sm font-bold">
                        {detail.time}
                      </span>
                    </div>
                    <div>
                      <span className={`font-bold text-lg ${detail.color}`}>
                        {detail.bonus}
                      </span>
                      <p className="text-gray-400 text-xs">{detail.desc}</p>
                    </div>
                  </div>
                  <div className="text-xl">⚡</div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{detail.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-neon-cyan font-bold">{detail.text}</span>
                      {detail.value && (
                        <span className="bg-neon-gold/20 text-neon-gold px-2 py-0.5 rounded-full text-xs">
                          {detail.value}
                        </span>
                      )}
                      {detail.stats && (
                        <span className="bg-slate-600/60 text-gray-300 px-2 py-0.5 rounded-full text-xs font-mono">
                          {detail.stats}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm">{detail.desc}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-600/60">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="px-4 py-2 text-gray-300 hover:text-neon-cyan hover:bg-slate-700/60 
                       disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all 
                       font-semibold text-sm sm:text-base"
          >
            ← Previous
          </button>

          {/* Dots */}
          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`rounded-full transition-all duration-300 ${i === currentSlide
                  ? 'bg-neon-cyan w-4 h-4'
                  : 'bg-gray-500 hover:bg-gray-400 w-3 h-3'
                  }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-cyan 
                       text-black font-bold rounded-lg hover:shadow-lg hover:shadow-neon-cyan/50 
                       transition-all tracking-wide text-sm sm:text-base"
            style={{ backgroundSize: '200% 100%' }}
          >
            {isLastSlide ? '🚀 Set Sail!' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
