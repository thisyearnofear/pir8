/**
 * First Time Tutorial for PIR8
 * 
 * Interactive 30-second walkthrough that teaches core mechanics.
 * Progressive disclosure - unlock features as player learns.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
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
    title: "Welcome, Captain! 🏴‍☠️",
    description: "Let's learn the basics in 30 seconds. You'll command a fleet, conquer territories, and dominate the seas!",
    skipable: false,
  },
  {
    id: 2,
    title: "Your Fleet ⚓",
    description: "These are your ships. Tap any ship to select it and see its stats.",
    action: 'select_ship',
    targetElement: 'ship',
    skipable: true,
  },
  {
    id: 3,
    title: "Move Your Ships ⛵",
    description: "With a ship selected, tap an adjacent cell to move. Control the map!",
    action: 'move_ship',
    targetElement: 'map-cell',
    skipable: true,
  },
  {
    id: 4,
    title: "Attack Enemies 💥",
    description: "Tap an enemy ship to attack. Watch for the damage numbers!",
    action: 'attack',
    targetElement: 'enemy-ship',
    skipable: true,
  },
  {
    id: 5,
    title: "Collect Resources 💰",
    description: "Click here to collect gold, crew, and supplies from your territories.",
    action: 'collect',
    targetElement: 'collect-button',
    skipable: true,
  },
  {
    id: 6,
    title: "End Your Turn ⏭️",
    description: "When ready, click 'End Turn' to pass to the next player. Speed matters - fast decisions earn bonuses!",
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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={step?.skipable ? handleSkip : undefined}
      />

      {/* Tutorial Modal */}
      <div 
        className={`relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 
                    border-2 border-neon-cyan rounded-2xl shadow-2xl shadow-neon-cyan/50
                    max-w-md w-full mx-4 overflow-hidden
                    animate-in fade-in zoom-in duration-300`}
      >
        {/* Progress Bar */}
        <div className="h-1 bg-slate-700">
          <div 
            className="h-full bg-gradient-to-r from-neon-cyan to-neon-blue transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className={`p-6 transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          {/* Step Number */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-neon-cyan tracking-wider">
              STEP {currentStep + 1} OF {TUTORIAL_STEPS.length}
            </span>
            {step?.skipable && (
              <button
                onClick={handleSkip}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                SKIP →
              </button>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-black text-transparent bg-clip-text 
                         bg-gradient-to-r from-neon-cyan via-neon-gold to-neon-cyan 
                         mb-3 animate-pulse-slow">
            {step?.title}
          </h2>

          {/* Description */}
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            {step?.description}
          </p>

          {/* Visual Demo Area */}
          <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700 min-h-[120px] flex items-center justify-center">
            {/* Dynamic content based on step */}
            {step?.action === 'select_ship' && (
              <div className="text-center animate-float">
                <div className="text-4xl mb-2">⚓</div>
                <div className="text-sm text-neon-cyan">← Tap a ship like this</div>
              </div>
            )}
            
            {step?.action === 'move_ship' && (
              <div className="text-center">
                <div className="text-2xl mb-2">⛵ → ⬜</div>
                <div className="text-sm text-neon-cyan">Move to adjacent cells</div>
              </div>
            )}
            
            {step?.action === 'attack' && (
              <div className="text-center">
                <div className="text-2xl mb-2">💥 -5</div>
                <div className="text-sm text-neon-cyan">Damage appears!</div>
              </div>
            )}
            
            {step?.action === 'collect' && (
              <div className="text-center animate-pulse">
                <div className="text-3xl mb-2">💰 +100</div>
                <div className="text-sm text-neon-gold">Resources collected</div>
              </div>
            )}
            
            {step?.action === 'end_turn' && (
              <div className="text-center">
                <div className="text-2xl mb-2">⏱️ &lt;5s = +100</div>
                <div className="text-sm text-neon-green">Speed bonus!</div>
              </div>
            )}
            
            {!step?.action && (
              <div className="text-center">
                <div className="text-5xl mb-2">🏴‍☠️</div>
                <div className="text-sm text-neon-cyan">Let's begin!</div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={() => {
                  setCurrentStep(prev => prev - 1);
                  play('button_click');
                }}
                className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl 
                           font-bold hover:bg-slate-600 transition-all button-click"
              >
                ← BACK
              </button>
            )}
            
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-neon-cyan to-neon-blue 
                         text-black rounded-xl font-bold hover:scale-105 active:scale-95 
                         transition-all shadow-lg shadow-neon-cyan/30 button-click"
            >
              {currentStep === TUTORIAL_STEPS.length - 1 ? 'START PLAYING!' : 'NEXT →'}
            </button>
          </div>

          {/* Keyboard Hint */}
          <div className="mt-4 text-center text-xs text-gray-500">
            Press <kbd className="bg-slate-700 px-2 py-0.5 rounded">Enter</kbd> to continue
            {step?.skipable && ' or <kbd className="bg-slate-700 px-2 py-0.5 rounded ml-1">Esc</kbd> to skip'}
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
