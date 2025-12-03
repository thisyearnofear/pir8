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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-neon-cyan 
                      rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl shadow-neon-cyan/20">
        {/* Skip button */}
        <button 
          onClick={onDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-sm"
        >
          Skip →
        </button>

        {/* Slide content */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">{slide.emoji}</div>
          <h2 className="text-2xl font-bold text-neon-cyan mb-2">{slide.title}</h2>
          <p className="text-gray-300">{slide.content}</p>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-6">
          {slide.details.map((detail, i) => (
            <div key={i} className="flex items-center gap-3 bg-slate-700/50 rounded-lg px-4 py-2">
              {'time' in detail ? (
                <>
                  <span className="font-mono text-gray-400 w-16">{detail.time}</span>
                  <span className={`font-bold ${detail.color}`}>{detail.bonus}</span>
                </>
              ) : (
                <>
                  <span className="text-xl">{detail.icon}</span>
                  <span className="text-gray-300">{detail.text}</span>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Back
          </button>

          {/* Dots */}
          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentSlide ? 'bg-neon-cyan w-4' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-4 py-2 bg-neon-cyan text-black font-bold rounded-lg hover:bg-neon-cyan/80 transition-all"
          >
            {isLastSlide ? 'Start Playing' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
