/**
 * Practice Mode Selector
 * 
 * Allows users to choose their practice mode experience:
 * - Solo Sandbox: Explore without opponents
 * - AI Battle: Face AI pirates with privacy education
 * - Guided Tutorial: Step-by-step privacy lessons
 * 
 * DRY: Uses Tailwind config for animations and z-index
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Bot, 
  GraduationCap, 
  Shield, 
  Eye, 
  Ghost,
  ChevronRight,
  Info
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type PracticeModeType = 'solo' | 'ai-battle' | 'tutorial';

export interface PracticeModeConfig {
  type: PracticeModeType;
  aiDifficulty?: 'novice' | 'pirate' | 'captain' | 'admiral';
  enablePrivacyEducation: boolean;
  enableGhostFleet: boolean;
  enableVeniceAI: boolean;
}

interface PracticeModeOption {
  type: PracticeModeType;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  privacyFocus: 'low' | 'medium' | 'high';
  recommended: boolean;
}

// ============================================================================
// MODE CONFIGURATIONS
// ============================================================================

const PRACTICE_MODES: PracticeModeOption[] = [
  {
    type: 'solo',
    title: 'Solo Sandbox',
    description: 'Explore the pirate world at your own pace. No opponents, no pressure - just pure discovery.',
    icon: <User className="w-8 h-8" />,
    features: [
      'No AI opponents',
      'Full map exploration',
      'Resource collection practice',
      'Ship building sandbox',
      'Privacy lessons at your pace',
    ],
    privacyFocus: 'medium',
    recommended: false,
  },
  {
    type: 'ai-battle',
    title: 'AI Battle',
    description: 'Face AI pirates that learn from your moves. Experience how transparency enables prediction.',
    icon: <Bot className="w-8 h-8" />,
    features: [
      'Adaptive AI opponents',
      'Real-time privacy feedback',
      'Information leakage meter',
      'Bounty Board dossier',
      'Ghost Fleet privacy mode',
    ],
    privacyFocus: 'high',
    recommended: true,
  },
  {
    type: 'tutorial',
    title: 'Guided Tutorial',
    description: 'Step-by-step lessons on blockchain privacy. Learn Solana and Zcash through gameplay.',
    icon: <GraduationCap className="w-8 h-8" />,
    features: [
      'Structured privacy lessons',
      'Interactive demonstrations',
      'Solana transparency explained',
      'Zcash privacy showcased',
      'Quiz challenges',
    ],
    privacyFocus: 'high',
    recommended: false,
  },
];

const AI_DIFFICULTIES = [
  { value: 'novice', label: 'Novice', description: 'AI makes basic moves, minimal prediction' },
  { value: 'pirate', label: 'Pirate', description: 'AI learns patterns, moderate challenge' },
  { value: 'captain', label: 'Captain', description: 'AI exploits transparency aggressively' },
  { value: 'admiral', label: 'Admiral', description: 'Maximum AI intelligence, true test of privacy' },
] as const;

// ============================================================================
// COMPONENT
// ============================================================================

interface PracticeModeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (config: PracticeModeConfig) => void;
  veniceAIEnabled: boolean;
}

export const PracticeModeSelector: React.FC<PracticeModeSelectorProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  veniceAIEnabled,
}) => {
  const [selectedMode, setSelectedMode] = useState<PracticeModeType>('ai-battle');
  const [aiDifficulty, setAiDifficulty] = useState<'novice' | 'pirate' | 'captain' | 'admiral'>('pirate');
  const [enablePrivacyEd, setEnablePrivacyEd] = useState(true);
  const [enableGhostFleet, setEnableGhostFleet] = useState(true);
  const [enableVeniceAI, setEnableVeniceAI] = useState(veniceAIEnabled);

  const handleStart = () => {
    onSelectMode({
      type: selectedMode,
      aiDifficulty: selectedMode === 'ai-battle' ? aiDifficulty : undefined,
      enablePrivacyEducation: enablePrivacyEd,
      enableGhostFleet: enableGhostFleet,
      enableVeniceAI: enableVeniceAI,
    });
    onClose();
  };

  const getPrivacyBadge = (focus: 'low' | 'medium' | 'high') => {
    const styles = {
      low: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      high: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    };
    
    const labels = {
      low: 'Basic Privacy',
      medium: 'Privacy Aware',
      high: 'Privacy Focused',
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full border ${styles[focus]}`}>
        {labels[focus]}
      </span>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 p-6 bg-slate-900/95 backdrop-blur border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Shield className="w-7 h-7 text-emerald-400" />
                    Choose Your Practice Mode
                  </h2>
                  <p className="text-slate-400 mt-2">
                    Learn blockchain privacy through gameplay before connecting your wallet
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Mode Selection */}
            <div className="p-6 space-y-6">
              {/* Mode Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PRACTICE_MODES.map((mode) => (
                  <motion.button
                    key={mode.type}
                    onClick={() => setSelectedMode(mode.type)}
                    className={`relative p-5 rounded-xl border-2 text-left transition-all duration-300 ${
                      selectedMode === mode.type
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Recommended Badge */}
                    {mode.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                        Recommended
                      </div>
                    )}

                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                      selectedMode === mode.type
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {mode.icon}
                    </div>

                    {/* Title & Badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-white">{mode.title}</h3>
                    </div>
                    {getPrivacyBadge(mode.privacyFocus)}

                    {/* Description */}
                    <p className="text-sm text-slate-400 mt-3 mb-4">
                      {mode.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-1.5">
                      {mode.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="text-emerald-400 mt-0.5">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </motion.button>
                ))}
              </div>

              {/* Configuration Panel */}
              <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-400" />
                  Configure Your Experience
                </h3>

                <div className="space-y-4">
                  {/* AI Difficulty (only for AI Battle) */}
                  {selectedMode === 'ai-battle' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        AI Difficulty
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {AI_DIFFICULTIES.map((diff) => (
                          <button
                            key={diff.value}
                            onClick={() => setAiDifficulty(diff.value)}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              aiDifficulty === diff.value
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                            }`}
                          >
                            <div className="font-medium text-white text-sm">{diff.label}</div>
                            <div className="text-xs text-slate-400 mt-1">{diff.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Privacy Education Toggle */}
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5 text-amber-400" />
                      <div>
                        <div className="font-medium text-white">Privacy Education</div>
                        <div className="text-xs text-slate-400">Learn about information leakage and transparency</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setEnablePrivacyEd(!enablePrivacyEd)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        enablePrivacyEd ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                        enablePrivacyEd ? 'left-7' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  {/* Ghost Fleet Toggle */}
                  {enablePrivacyEd && (
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Ghost className="w-5 h-5 text-purple-400" />
                        <div>
                          <div className="font-medium text-white">Ghost Fleet Mode</div>
                          <div className="text-xs text-slate-400">Experience temporary privacy (Zcash simulation)</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setEnableGhostFleet(!enableGhostFleet)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          enableGhostFleet ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                          enableGhostFleet ? 'left-7' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  )}

                  {/* Venice AI Toggle */}
                  {veniceAIEnabled && (
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Bot className="w-5 h-5 text-blue-400" />
                        <div>
                          <div className="font-medium text-white flex items-center gap-2">
                            Venice AI Content
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                              Premium
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">Dynamic, personalized educational content</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setEnableVeniceAI(!enableVeniceAI)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          enableVeniceAI ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                          enableVeniceAI ? 'left-7' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-200">
                  <p className="font-medium mb-1">Why Practice Mode Matters</p>
                  <p className="text-blue-300/80">
                    Before connecting your wallet, understand how blockchain privacy works. 
                    Practice mode teaches you about transparent vs. private transactions through 
                    interactive gameplay. No wallet required - just learning.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 p-6 bg-slate-900/95 backdrop-blur border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStart}
                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all flex items-center gap-2 group"
              >
                Start Practice
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PracticeModeSelector;
