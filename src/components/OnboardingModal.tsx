'use client';

import { useState, useEffect } from 'react';

interface OnboardingModalProps {
  isOpen: boolean;
  onDismiss: () => void;
}

const SLIDES = [
  {
    emoji: '⏱️',
    title: 'Watch the Timer',
    content: 'Faster moves earn bonus points!',
    details: [
      { time: '< 5s', bonus: '+100 pts', color: 'text-neon-green' },
      { time: '< 10s', bonus: '+50 pts', color: 'text-neon-cyan' },
      { time: '< 15s', bonus: '+25 pts', color: 'text-neon-gold' },
    ]
  },
  {
    emoji: '🔍',
    title: 'Scan Territory',
    content: 'Use your 3 scans to reveal territory before claiming.',
    details: [
      { icon: '🏝️', text: 'Islands give supplies' },
      { icon: '⚓', text: 'Ports build ships' },
      { icon: '💰', text: 'Treasures give gold' },
    ]
  },
  {
    emoji: '⛵',
    title: 'Move & Attack',
    content: 'Click a ship, then choose your action.',
    details: [
      { icon: '⛵', text: 'Move to adjacent tiles' },
      { icon: '💥', text: 'Attack nearby enemies' },
      { icon: '🏴‍☠️', text: 'Claim territories' },
    ]
  },
  {
    emoji: '🏴‍☠️',
    title: 'Win the Battle',
    content: 'Control territories, build fleets, outsmart opponents!',
    details: [
      { icon: '🎯', text: 'Control 60% of territories' },
      { icon: '⚔️', text: 'Destroy enemy fleets' },
      { icon: '💎', text: 'Accumulate 15,000+ resources' },
    ]
  },
];

export default function OnboardingModal({ isOpen, onDismiss }: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Prevent body scroll when modal is open - always call this hook
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
      return () => {
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const slide = SLIDES[currentSlide];
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[99999] 
                    before:content-[''] before:fixed before:inset-0 before:bg-black/50 before:z-[-1]"
         style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="relative bg-gradient-to-b from-slate-900/95 via-slate-800/95 to-slate-900/95 
                      border-2 border-neon-cyan rounded-2xl p-8 w-full max-w-lg mx-4 
                      shadow-2xl shadow-neon-cyan/40 backdrop-blur-sm
                      before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br 
                      before:from-neon-cyan/10 before:to-transparent before:pointer-events-none">
        {/* Skip button */}
        <button 
          onClick={onDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-neon-gold hover:bg-slate-700/50 
                     rounded-lg px-3 py-1 transition-colors text-sm font-bold z-10"
        >
          ✕ Skip
        </button>

        {/* Slide content */}
        <div className="text-center mb-8 pt-2">
          <div className="text-6xl mb-6 animate-pulse filter drop-shadow-lg">{slide.emoji}</div>
          <h2 className="text-2xl font-black text-neon-cyan mb-4 drop-shadow-sm leading-tight">
            {slide.title}
          </h2>
          <p className="text-base text-gray-200 font-medium leading-relaxed drop-shadow-sm">
            {slide.content}
          </p>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-8">
          {slide.details.map((detail, i) => (
            <div key={i} className="flex items-center gap-4 bg-slate-700/70 hover:bg-slate-600/80 
                                     rounded-xl px-5 py-4 transition-all border border-slate-600/60 
                                     hover:border-neon-cyan/50 shadow-lg backdrop-blur-sm">
              {'time' in detail ? (
                <>
                  <span className="font-mono text-gray-300 w-20 text-base font-bold tracking-wide">
                    {detail.time}
                  </span>
                  <span className={`font-black text-lg tracking-wide drop-shadow-sm ${detail.color}`}>
                    {detail.bonus}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-2xl filter drop-shadow-sm">{detail.icon}</span>
                  <span className="text-gray-200 text-sm font-medium leading-relaxed drop-shadow-sm">
                    {detail.text}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-600/60">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="px-4 py-2 text-gray-300 hover:text-neon-cyan hover:bg-slate-700/60 
                       disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all 
                       font-semibold text-sm border border-transparent hover:border-neon-cyan/30"
          >
            ← Back
          </button>

          {/* Dots */}
          <div className="flex gap-3">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`rounded-full transition-all shadow-sm ${
                  i === currentSlide 
                    ? 'bg-neon-cyan w-4 h-4 shadow-lg shadow-neon-cyan/50' 
                    : 'bg-gray-500 hover:bg-gray-400 w-3 h-3'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-6 py-2 bg-gradient-to-r from-neon-cyan to-neon-blue text-black font-bold 
                       rounded-lg hover:shadow-lg hover:shadow-neon-cyan/50 hover:scale-105 
                       transition-all text-sm tracking-wide border border-neon-cyan/20"
          >
            {isLastSlide ? '🚀 Start Playing' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
