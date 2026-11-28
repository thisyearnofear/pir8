'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';

interface OnboardingModalProps {
  isOpen: boolean;
  onDismiss: () => void;
}

interface SlideDetail {
  icon: IconName;
  text: string;
  desc: string;
  value?: string;
}

interface Slide {
  icon: IconName;
  title: string;
  subtitle: string;
  content: string;
  details: SlideDetail[];
}

const SLIDES: Slide[] = [
  {
    icon: 'compass',
    title: 'Welcome Aboard, Captain',
    subtitle: 'Master the Seven Seas',
    content:
      'Command your fleet in short naval duels. Every order matters in this skill-based battle for treasure and glory.',
    details: [
      { icon: 'attack', text: 'Strategic Combat', desc: 'Outmaneuver enemies with tactical positioning' },
      { icon: 'treasure', text: 'Treasure Hunting', desc: 'Control valuable territories for resources' },
      { icon: 'ship', text: 'Fleet Building', desc: 'Expand your armada with powerful ships' },
    ],
  },
  {
    icon: 'radar',
    title: 'Scout Before You Strike',
    subtitle: 'Intelligence Wins Wars',
    content:
      'Use your 3 precious scans wisely to reveal hidden treasures and plan your conquest.',
    details: [
      { icon: 'island', text: 'Islands', desc: 'Generate supplies for your fleet', value: '+3 supplies/turn' },
      { icon: 'port', text: 'Ports', desc: 'Build new ships and recruit crew', value: '+5 gold, +2 crew/turn' },
      { icon: 'treasure', text: 'Treasures', desc: 'Rich deposits of pirate gold', value: '+10 gold/turn' },
    ],
  },
  {
    icon: 'crown',
    title: 'Spring the Ambush',
    subtitle: 'Three Paths to Glory',
    content:
      'Mask your fleet, strike from fog, and decide fast — quick captains earn bonus points. Choose your strategy.',
    details: [
      { icon: 'claim', text: 'Territory Control', desc: 'Dominate 50% of valuable lands' },
      { icon: 'attack', text: 'Fleet Supremacy', desc: 'Control 65% of naval power' },
      { icon: 'treasure', text: 'Economic Victory', desc: 'Amass 10,000+ resources' },
    ],
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

  const slide = SLIDES[currentSlide];
  const isLastSlide = currentSlide === SLIDES.length - 1;

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      onDismiss();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  }, [isLastSlide, onDismiss]);

  const handlePrev = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  }, [currentSlide]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
      if (e.key === 'Enter') handleNext();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, handleNext, handlePrev, onDismiss]);

  if (!isOpen) return null;
  if (!slide) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 w-screen h-screen"
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div
        className="mx-4 w-full max-w-2xl rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,.45)] max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="mb-3 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.16em] text-[var(--p8-vellum)] opacity-60">
              Captain&apos;s orders · {currentSlide + 1} of {SLIDES.length}
            </p>
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-white/[0.04] text-[var(--p8-lamp)]">
                <Icon name={slide.icon} size={22} strokeWidth={1.5} />
              </span>
              <div>
                <h2
                  id="onboarding-title"
                  className="font-[var(--font-world)] text-2xl text-[var(--p8-vellum)]"
                >
                  {slide.title}
                </h2>
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--p8-lamp)]">
                  {slide.subtitle}
                </h3>
              </div>
            </div>
            <p className="text-sm leading-6 text-[var(--p8-vellum)] opacity-80">
              {slide.content}
            </p>
          </div>
          <button
            onClick={onDismiss}
            aria-label="Close onboarding"
            className="rounded-[var(--p8-radius)] border border-transparent p-2 text-[var(--p8-vellum)] opacity-60 transition-colors hover:bg-white/[0.04] hover:opacity-100 focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
          >
            <Icon name="close" size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Details */}
        <div className="mb-6 space-y-3">
          {slide.details.map((detail, i) => (
            <div
              key={i}
              className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-white/[0.02] px-4 py-3"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--p8-radius)] border border-white/10 bg-white/[0.04] text-[var(--p8-brass)]">
                  <Icon name={detail.icon} size={18} strokeWidth={1.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-[var(--p8-vellum)]">
                      {detail.text}
                    </span>
                    {detail.value && (
                      <span className="rounded-full border border-[var(--p8-brass-line)] px-2 py-0.5 font-[var(--font-instrument)] text-[11px] text-[var(--p8-lamp)]">
                        {detail.value}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--p8-vellum)] opacity-70">
                    {detail.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 border-t border-[var(--p8-brass-line)] pt-4">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="rounded-[var(--p8-radius)] px-4 py-2 text-sm font-bold text-[var(--p8-vellum)] opacity-80 transition-colors hover:bg-white/[0.04] hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
          >
            ← Previous
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2" role="tablist" aria-label="Onboarding progress">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                role="tab"
                aria-selected={i === currentSlide}
                aria-label={`Go to slide ${i + 1}`}
                className={`rounded-full transition-all ${
                  i === currentSlide
                    ? 'h-2 w-6 bg-[var(--p8-lamp)]'
                    : 'h-2 w-2 bg-[var(--p8-brass)] opacity-50 hover:opacity-100'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            autoFocus
            className="rounded-[var(--p8-radius)] bg-[var(--p8-lamp)] px-6 py-2.5 text-sm font-black uppercase tracking-[0.14em] text-[#0b1418] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p8-vellum)] sm:px-8 sm:py-3"
          >
            {isLastSlide ? 'Set Sail' : 'Next'}
          </button>
        </div>

        <button
          onClick={onDismiss}
          className="mt-3 w-full py-1 text-center font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.16em] text-[var(--p8-vellum)] opacity-50 hover:opacity-100"
        >
          Skip logbook
        </button>
      </div>
    </div>
  );
}
