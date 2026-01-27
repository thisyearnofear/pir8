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
      document.body.classList.add('modal-open');
      return () => {
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
      };
    }
    return undefined; // Explicit return for when condition is false
  }, [isOpen]);

  if (!isOpen) return null;

  const slide = SLIDES[currentSlide];
  if (!slide) return null; // Safety check for undefined slide

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
    <div className="fixed inset-0 bg-black/95 backdrop-blur-lg flex items-center justify-center z-[99999] 
                    animate-in fade-in duration-300">
      <div className={`relative bg-gradient-to-br from-slate-900/98 via-slate-800/98 to-slate-900/98 
                      border-2 border-neon-cyan rounded-3xl p-8 w-full max-w-2xl mx-4 
                      shadow-2xl shadow-neon-cyan/30 backdrop-blur-xl
                      before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br 
                      before:${slide.bgGradient} before:pointer-events-none
                      animate-in slide-in-from-bottom-4 duration-500`}>

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-neon-cyan/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-neon-gold/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Skip button */}
        <button
          onClick={onDismiss}
          className="absolute top-6 right-6 text-gray-400 hover:text-neon-gold hover:bg-slate-700/50 
                     rounded-xl px-4 py-2 transition-all text-sm font-bold z-10 group
                     hover:scale-105 active:scale-95"
        >
          <span className="group-hover:animate-pulse">✕</span> Skip Tutorial
        </button>

        {/* Slide content */}
        <div className="text-center mb-8 pt-4 relative z-10">
          <div className="text-8xl mb-6 animate-bounce filter drop-shadow-2xl">{slide.emoji}</div>
          <h2 className="text-3xl font-black text-neon-cyan mb-2 drop-shadow-lg leading-tight">
            {slide.title}
          </h2>
          <h3 className="text-lg font-semibold text-neon-gold mb-4 drop-shadow-sm">
            {slide.subtitle}
          </h3>
          <p className="text-base text-gray-200 font-medium leading-relaxed drop-shadow-sm max-w-lg mx-auto">
            {slide.content}
          </p>
        </div>

        {/* Enhanced Details */}
        <div className="space-y-4 mb-8 relative z-10">
          {slide.details.map((detail: any, i: number) => (
            <div key={i} className="group bg-slate-800/80 hover:bg-slate-700/90 
                                     rounded-2xl px-6 py-5 transition-all duration-300 
                                     border border-slate-600/60 hover:border-neon-cyan/50 
                                     shadow-lg backdrop-blur-sm hover:shadow-xl hover:shadow-neon-cyan/10
                                     hover:scale-[1.02] hover:-translate-y-1">
              {'time' in detail ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-700/80 rounded-xl px-4 py-2 border border-slate-600">
                      <span className="font-mono text-gray-300 text-lg font-bold tracking-wider">
                        {detail.time}
                      </span>
                    </div>
                    <div>
                      <span className={`font-black text-xl tracking-wide drop-shadow-sm ${detail.color}`}>
                        {detail.bonus}
                      </span>
                      <p className="text-gray-400 text-sm mt-1">{detail.desc}</p>
                    </div>
                  </div>
                  <div className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">⚡</div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="text-3xl filter drop-shadow-lg flex-shrink-0 mt-1">{detail.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-neon-cyan font-bold text-lg">{detail.text}</span>
                      {detail.value && (
                        <span className="bg-neon-gold/20 text-neon-gold px-3 py-1 rounded-full text-xs font-bold">
                          {detail.value}
                        </span>
                      )}
                      {detail.stats && (
                        <span className="bg-slate-600/60 text-gray-300 px-3 py-1 rounded-full text-xs font-mono">
                          {detail.stats}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{detail.desc}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Enhanced Navigation */}
        <div className="flex items-center justify-between gap-6 pt-6 border-t border-slate-600/60 relative z-10">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="px-6 py-3 text-gray-300 hover:text-neon-cyan hover:bg-slate-700/60 
                       disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all 
                       font-semibold border border-transparent hover:border-neon-cyan/30
                       hover:scale-105 active:scale-95 disabled:hover:scale-100"
          >
            ← Previous
          </button>

          {/* Enhanced Dots */}
          <div className="flex gap-3">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`rounded-full transition-all duration-300 ${i === currentSlide
                  ? 'bg-neon-cyan w-5 h-5 shadow-lg shadow-neon-cyan/50 scale-110'
                  : 'bg-gray-500 hover:bg-gray-400 w-3 h-3 hover:scale-125'
                  }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-8 py-3 bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-cyan 
                       text-black font-bold rounded-xl hover:shadow-xl hover:shadow-neon-cyan/50 
                       hover:scale-105 active:scale-95 transition-all tracking-wide 
                       border border-neon-cyan/20 bg-size-200 hover:bg-pos-100"
            style={{ backgroundSize: '200% 100%' }}
          >
            {isLastSlide ? '🚀 Set Sail!' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}