'use client';

import OnboardingModal from '@/components/OnboardingModal';
import ViralEventModal from '@/components/ViralEventModal';
import SocialModal from '@/components/SocialModal';
import AIBattleModal from '@/components/AIBattleModal';
import ModeSelectModal from '@/components/modals/ModeSelectModal';
import PracticeMenuModal from '@/components/modals/PracticeMenuModal';
import { PrivacyLessonModal, BountyBoard } from '@/components/privacy';
import SpectatorView from '@/components/SpectatorView';

interface ModalLayerProps {
  // Onboarding
  showOnboarding: boolean;
  onDismissOnboarding: () => void;
  // Viral
  currentViralEvent: any;
  onViralShare: (event: any, platform?: any) => void;
  onDismissViralEvent: () => void;
  isPracticeMode: boolean;
  // Social
  socialModal: { type: 'leaderboard' | 'referral'; isOpen: boolean };
  onCloseSocialModal: () => void;
  gameId?: string | number;
  // AI Battle
  showAIBattleModal: boolean;
  onCloseAIBattleModal: () => void;
  onStartAIBattle: (d1: string, d2: string, speed: number) => void;
  // Mode Select
  showModeSelect: boolean;
  onCloseModeSelect: () => void;
  onModeSelected: (mode: any) => void;
  // Practice Menu
  showPracticeMenu: boolean;
  onClosePracticeMenu: () => void;
  onStartPractice: (difficulty: any) => void;
  gameStateExists: boolean;
  // Privacy/Practice
  privacySim: any;
  // Spectator
  showSpectatorMode: boolean;
  onCloseSpectatorMode: () => void;
  onJoinGame: (id: string) => void;
}

export function ModalLayer({
  showOnboarding,
  onDismissOnboarding,
  currentViralEvent,
  onViralShare,
  onDismissViralEvent,
  isPracticeMode,
  socialModal,
  onCloseSocialModal,
  gameId,
  showAIBattleModal,
  onCloseAIBattleModal,
  onStartAIBattle,
  showModeSelect,
  onCloseModeSelect,
  onModeSelected,
  showPracticeMenu,
  onClosePracticeMenu,
  onStartPractice,
  gameStateExists,
  privacySim,
  showSpectatorMode,
  onCloseSpectatorMode,
  onJoinGame,
}: ModalLayerProps) {
  return (
    <>
      <OnboardingModal
        isOpen={showOnboarding}
        onDismiss={onDismissOnboarding}
      />

      <ViralEventModal
        event={currentViralEvent}
        onShare={onViralShare}
        onDismiss={onDismissViralEvent}
        isPracticeMode={isPracticeMode}
      />

      <SocialModal
        type={socialModal.type}
        gameId={gameId !== undefined ? String(gameId) : undefined}
        isOpen={socialModal.isOpen}
        onClose={onCloseSocialModal}
      />

      {showSpectatorMode && (
        <div className="fixed inset-0 z-50 bg-slate-900">
          <SpectatorView
            onClose={onCloseSpectatorMode}
            onJoinGame={onJoinGame}
          />
        </div>
      )}

      <AIBattleModal
        isOpen={showAIBattleModal}
        onClose={onCloseAIBattleModal}
        onStartBattle={onStartAIBattle}
      />

      <ModeSelectModal
        isOpen={showModeSelect}
        onClose={onCloseModeSelect}
        onModeSelected={onModeSelected}
      />

      <PracticeMenuModal
        isOpen={showPracticeMenu && !gameStateExists}
        onClose={onClosePracticeMenu}
        onStartPractice={onStartPractice}
      />

      {isPracticeMode && (
        <>
          <PrivacyLessonModal
            lesson={privacySim.currentLesson}
            isVisible={privacySim.isLessonVisible}
            onDismiss={privacySim.dismissLesson}
            onActivateGhostFleet={privacySim.activateGhostFleet}
          />

          <BountyBoard
            dossier={
              privacySim.dossier || {
                playerId: '',
                movesAnalyzed: 0,
                patternsIdentified: [],
                predictabilityScore: 0,
                typicalPlayStyle: 'balanced',
                lastUpdated: new Date(),
              }
            }
            isVisible={privacySim.isDossierVisible}
            onClose={privacySim.hideDossier}
          />
        </>
      )}
    </>
  );
}
