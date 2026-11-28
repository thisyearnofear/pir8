/**
 * First Time Tutorial for PIR8
 * 
 * Interactive 30-second walkthrough that teaches core mechanics.
 * Progressive disclosure - unlock features as player learns.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { Icon } from '@/components/ui/Icon';
import { Haptic } from '@/utils/haptics';

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  action?: 'select_ship' | 'move_ship' | 'attack' | 'collect' | 'end_turn';
  targetElement?: string;
  skipable?: boolean;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: "Welcome, Captain!",
    description: "Three moves to learn: sail, strike, and spring the ambush. Thirty seconds, then the seas are yours.",
    skipable: true,
  },
  {
    id: 2,
    title: "Sail & Strike",
    description: "Tap a ship to select it, tap an adjacent cell to move, tap an enemy to attack. The map is yours.",
    action: 'select_ship',
    targetElement: 'ship',
    skipable: true,
  },
  {
    id: 3,
    title: "Spring the Ambush",
    description: "Territories pay you every turn. Strike from fog, decide fast for bonus points, and End Turn before the trail goes cold.",
    action: 'end_turn',
    targetElement: 'end-turn-button',
    skipable: true,
  },
];

interface FirstTimeTutorialProps {
  onComplete?: () => void;
  onSkip?: () => void;
  isVisible: boolean;
}

export function FirstTimeTutorial({ 
  onComplete, 
  onSkip,
  isVisible 
}: FirstTimeTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { play } = useSoundEffects();

  const step = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  const handleNext = useCallback(() => {
    if (currentStep >= TUTORIAL_STEPS.length - 1) {
      // Tutorial complete
      play('victory');
      Haptic.success();
      onComplete?.();
      return;
    }

    setIsTransitioning(true);
    play('button_click');
    
    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
      setIsTransitioning(false);
    }, 300);
  }, [currentStep, onComplete, play]);

  const handleSkip = useCallback(() => {
    play('button_click');
    Haptic.light();
    onSkip?.();
  }, [onSkip, play]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isVisible || !step) return;
      
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Escape' && step.skipable) {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible, handleNext, handleSkip, step]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={handleSkip}
      />

      {/* Tutorial Modal */}
      <div
        className="relative rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] shadow-[0_2px_8px_rgba(0,0,0,.45)] max-w-md w-full mx-4 overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="h-1 bg-[var(--p8-ink)]">
          <div
            className="h-full bg-[var(--p8-lamp)] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className={`p-6 transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          {/* Step Number */}
          <div className="flex items-center justify-between mb-4">
            <span className="font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.16em] text-[var(--p8-vellum-dim)]">
              Step {currentStep + 1} of {TUTORIAL_STEPS.length}
            </span>
            {step?.skipable && (
              <button
                onClick={handleSkip}
                className="font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.16em] text-[var(--p8-vellum-dim)] opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
              >
                Skip →
              </button>
            )}
          </div>

          {/* Title */}
          <h2 className="font-[var(--font-world)] text-2xl text-[var(--p8-vellum)] mb-3">
            {step?.title}
          </h2>

          {/* Description */}
          <p className="text-[var(--p8-vellum-dim)] text-lg leading-relaxed mb-6">
            {step?.description}
          </p>

          {/* Visual Demo Area */}
          <div className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] p-4 mb-6 min-h-[120px] flex items-center justify-center">
            {/* Dynamic content based on step */}
            {step?.action === 'select_ship' && (
              <div className="text-center">
                <span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] text-[var(--p8-lamp)]">
                  <Icon name="anchor" size={22} strokeWidth={1.5} />
                </span>
                <div className="text-sm text-[var(--p8-vellum)]">Tap a ship like this</div>
              </div>
            )}

            {step?.action === 'move_ship' && (
              <div className="text-center">
                <span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] text-[var(--p8-lamp)]">
                  <Icon name="move" size={22} strokeWidth={1.5} />
                </span>
                <div className="text-sm text-[var(--p8-vellum)]">Move to adjacent cells</div>
              </div>
            )}

            {step?.action === 'attack' && (
              <div className="text-center">
                <span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] text-[var(--p8-threat)]">
                  <Icon name="attack" size={22} strokeWidth={1.5} />
                </span>
                <div className="text-sm text-[var(--p8-vellum)]">Damage appears!</div>
              </div>
            )}

            {step?.action === 'collect' && (
              <div className="text-center">
                <span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] text-[var(--p8-lamp)]">
                  <Icon name="gold" size={22} strokeWidth={1.5} />
                </span>
                <div className="text-sm text-[var(--p8-vellum)]">+100 resources collected</div>
              </div>
            )}

            {step?.action === 'end_turn' && (
              <div className="text-center">
                <span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] text-[var(--p8-signal)]">
                  <Icon name="clock" size={22} strokeWidth={1.5} />
                </span>
                <div className="text-sm text-[var(--p8-vellum)]">Under 5s earns +100</div>
              </div>
            )}

            {!step?.action && (
              <div className="text-center">
                <span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] text-[var(--p8-lamp)]">
                  <Icon name="compass" size={22} strokeWidth={1.5} />
                </span>
                <div className="text-sm text-[var(--p8-vellum)]">Let&apos;s begin!</div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {currentStep > 0 && (            <button
              onClick={() => {
                  setCurrentStep(prev => prev - 1);
                  play('button_click');
                }}
                className="flex-1 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-4 py-3 text-sm font-bold text-[var(--p8-vellum)] transition-colors hover:border-[var(--p8-brass)] focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
              >
                ← Back
              </button>
            )}

            <button
              onClick={handleNext}
              autoFocus={currentStep === 0}
              className="flex-1 rounded-[var(--p8-radius)] bg-[var(--p8-lamp)] px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#0b1418] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p8-vellum)]"
            >
              {currentStep === TUTORIAL_STEPS.length - 1 ? 'Start playing' : 'Next →'}
            </button>
          </div>

          {/* Keyboard Hint */}
          <div className="mt-4 text-center font-[var(--font-instrument)] text-[11px] text-[var(--p8-vellum-dim)]">
            Press <kbd className="rounded border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-2 py-0.5">Enter</kbd> to continue
            {step?.skipable && (<> or <kbd className="rounded border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-2 py-0.5">Esc</kbd> to skip</>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to manage tutorial state
export function useFirstTimeTutorial() {
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Check localStorage
    const seen = localStorage.getItem('pir8_tutorial_seen');
    setHasSeenTutorial(seen === 'true');
  }, []);

  const markComplete = useCallback(() => {
    localStorage.setItem('pir8_tutorial_seen', 'true');
    setHasSeenTutorial(true);
    setShowTutorial(false);
  }, []);

  const show = useCallback(() => {
    setShowTutorial(true);
  }, []);

  const hide = useCallback(() => {
    setShowTutorial(false);
  }, []);

  return {
    hasSeenTutorial,
    showTutorial,
    show,
    hide,
    markComplete,
  };
}
