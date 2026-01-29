/**
 * BountyBoard Component
 * 
 * Displays the AI's "dossier" on the player, demonstrating how
 * opponents can build profiles from visible on-chain activity.
 * 
 * Principles:
 * - Uses z-modal from Tailwind config (DRY)
 * - CSS transitions only (performant)
 * - Single responsibility: display dossier
 */

'use client';

import { useState } from 'react';
import { PlayerDossier } from '@/lib/privacySimulation';

interface BountyBoardProps {
  dossier: PlayerDossier;
  isVisible: boolean;
  onClose: () => void;
}

// Utility functions outside component (CLEAN)
const getPlayStyleIcon = (style: PlayerDossier['typicalPlayStyle']): string => {
  const icons: Record<string, string> = {
    aggressive: '⚔️',
    defensive: '🛡️',
    resource_focused: '💰',
    territorial: '🏴‍☠️',
    balanced: '⚖️',
    unpredictable: '🎲',
  };
  return icons[style] || '❓';
};

const getPlayStyleDescription = (style: PlayerDossier['typicalPlayStyle']): string => {
  const descriptions: Record<string, string> = {
    aggressive: 'Prioritizes combat and attacking opponents',
    defensive: 'Focuses on resource accumulation and defense',
    resource_focused: 'Emphasizes gathering resources over combat',
    territorial: 'Focuses on expanding and controlling territory',
    balanced: 'Adapts strategy based on game state',
    unpredictable: 'Varies strategy frequently to avoid detection',
  };
  return descriptions[style] || 'Play style not yet determined';
};

const getPredictabilityInfo = (score: number): { label: string; color: string; bgColor: string } => {
  if (score < 30) return { 
    label: 'Unpredictable', 
    color: 'text-green-400',
    bgColor: 'bg-green-500'
  };
  if (score < 50) return { 
    label: 'Somewhat Predictable', 
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500'
  };
  if (score < 70) return { 
    label: 'Predictable', 
    color: 'text-orange-400',
    bgColor: 'bg-orange-500'
  };
  return { 
    label: 'Highly Predictable', 
    color: 'text-red-400',
    bgColor: 'bg-red-500'
  };
};

export default function BountyBoard({
  dossier,
  isVisible,
  onClose,
}: BountyBoardProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'patterns' | 'locations'>('profile');

  if (!isVisible) return null;

  const predictability = getPredictabilityInfo(dossier.predictabilityScore);

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border-2 border-red-500/50 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-red-500/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 p-6 border-b border-red-500/30">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">📋</span>
              <div>
                <h2 className="text-xl font-black text-white">AI PIRATE DOSSIER</h2>
                <p className="text-sm text-red-300">Compiled from visible information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="Close dossier"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Warning Banner */}
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-200">
              <span className="font-bold">⚠️ Warning:</span> This is what opponents can learn about you 
              from visible blockchain activity. Your transaction history creates a permanent profile.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {(['profile', 'patterns'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? 'text-red-400 border-b-2 border-red-400 bg-red-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {activeTab === 'profile' && (
            <ProfileTab dossier={dossier} predictability={predictability} />
          )}

          {activeTab === 'patterns' && (
            <PatternsTab patterns={dossier.patternsIdentified} />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800/50 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Dossier updated in real-time from visible game data
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-semibold transition-colors"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponents for single responsibility

interface ProfileTabProps {
  dossier: PlayerDossier;
  predictability: { label: string; color: string; bgColor: string };
}

function ProfileTab({ dossier, predictability }: ProfileTabProps) {
  return (
    <div className="space-y-6">
      {/* Play Style */}
      <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
        <span className="text-4xl">{getPlayStyleIcon(dossier.typicalPlayStyle)}</span>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider">Detected Play Style</p>
          <p className="text-lg font-bold text-white capitalize">{dossier.typicalPlayStyle}</p>
          <p className="text-sm text-slate-400">{getPlayStyleDescription(dossier.typicalPlayStyle)}</p>
        </div>
      </div>

      {/* Predictability Score */}
      <div className="p-4 bg-slate-800/50 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Predictability Score</p>
          <span className={`font-bold ${predictability.color}`}>
            {predictability.label}
          </span>
        </div>
        <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${predictability.bgColor}`}
            style={{ width: `${dossier.predictabilityScore}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Based on {dossier.movesAnalyzed} moves analyzed
        </p>
      </div>

      {/* Analysis Summary */}
      <div className="p-4 bg-orange-900/20 border border-orange-500/30 rounded-xl">
        <p className="text-sm text-orange-200">
          <span className="font-bold">💡 AI Analysis:</span> After watching you for{' '}
          {dossier.movesAnalyzed} turns, the AI has identified{' '}
          {dossier.patternsIdentified.length} behavioral patterns that can be exploited.
        </p>
      </div>
    </div>
  );
}

interface PatternsTabProps {
  patterns: string[];
}

function PatternsTab({ patterns }: PatternsTabProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Behavioral patterns detected from your visible actions:
      </p>
      
      {patterns.length > 0 ? (
        <div className="space-y-3">
          {patterns.map((pattern, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg"
            >
              <span className="text-red-400 mt-0.5">🔍</span>
              <p className="text-sm text-slate-300">{pattern}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center text-slate-500">
          <span className="text-3xl block mb-2">🕵️</span>
          <p>Not enough data collected yet...</p>
          <p className="text-sm mt-1">Keep playing to see what patterns emerge!</p>
        </div>
      )}

      {patterns.length > 0 && (
        <div className="p-4 bg-slate-800 rounded-xl">
          <p className="text-sm text-slate-300">
            <span className="font-bold text-red-400">⚠️ The Problem:</span> On a transparent 
            blockchain, these patterns become part of your permanent record. Sophisticated 
            opponents and MEV bots can use this data to predict and counter your moves.
          </p>
        </div>
      )}
    </div>
  );
}
