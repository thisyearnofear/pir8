'use client';

import { useState } from 'react';

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999]">
      <div className="bg-gradient-to-b from-slate-800 via-slate-850 to-slate-900 border-3 border-neon-cyan 
                      rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl shadow-neon-cyan/40">
        {/* Skip button */}
        <button 
          onClick={onDismiss}
          className="absolute top-6 right-6 text-gray-500 hover:text-neon-gold transition-colors text-sm font-bold"
        >
          ✕ Skip
        </button>

        {/* Slide content */}
        <div className="text-center mb-8 pt-4">
          <div className="text-7xl mb-6 animate-pulse">{slide.emoji}</div>
          <h2 className="text-3xl font-black text-neon-cyan mb-3">{slide.title}</h2>
          <p className="text-lg text-gray-300">{slide.content}</p>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-8">
          {slide.details.map((detail, i) => (
            <div key={i} className="flex items-center gap-4 bg-slate-700/60 hover:bg-slate-700/80 rounded-xl px-5 py-3 transition-all border border-slate-600/50">
              {'time' in detail ? (
                <>
                  <span className="font-mono text-gray-400 w-20 text-lg font-bold">{detail.time}</span>
                  <span className={`font-black text-lg ${detail.color}`}>{detail.bonus}</span>
                </>
              ) : (
                <>
                  <span className="text-2xl">{detail.icon}</span>
                  <span className="text-gray-300 text-base">{detail.text}</span>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-700">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="px-5 py-2 text-gray-400 hover:text-neon-cyan hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all font-semibold"
          >
            ← Back
          </button>

          {/* Dots */}
          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`rounded-full transition-all ${
                  i === currentSlide ? 'bg-neon-cyan w-3 h-3' : 'bg-gray-600 hover:bg-gray-500 w-2 h-2'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-6 py-2 bg-gradient-to-r from-neon-cyan to-neon-blue text-black font-bold rounded-lg hover:shadow-lg hover:shadow-neon-cyan/50 transition-all"
          >
            {isLastSlide ? '🚀 Start Playing' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
