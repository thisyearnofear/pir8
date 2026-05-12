'use client';

import { useState, useCallback } from 'react';
import { useViralSystem } from './useViralSystem';
import { GameState, Player } from '@/types/game';

interface UseChallengeControllerOptions {
  gameState: GameState | null;
  currentPlayer: Player | null;
  isPracticeMode: boolean;
  handleGameEvent: (message: string) => void;
}

export function useChallengeController({
  gameState,
  currentPlayer,
  isPracticeMode,
  handleGameEvent,
}: UseChallengeControllerOptions) {
  const [socialModal, setSocialModal] = useState<{
    type: 'leaderboard' | 'referral';
    isOpen: boolean;
  }>({
    type: 'leaderboard',
    isOpen: false,
  });

  const viralSystem = useViralSystem(gameState, currentPlayer, {
    disableAutoDismiss: isPracticeMode,
  });

  const handleViralShare = useCallback(
    (event: any, platform?: 'twitter' | 'discord' | 'copy') => {
      viralSystem.handleShare(event, platform);
      handleGameEvent('🚀 Epic moment shared! Spread the world!');
    },
    [viralSystem, handleGameEvent]
  );

  const openSocialModal = useCallback((type: 'leaderboard' | 'referral') => {
    setSocialModal({ type, isOpen: true });
  }, []);

  const closeSocialModal = useCallback(() => {
    setSocialModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    socialModal,
    viralSystem,
    handleViralShare,
    openSocialModal,
    closeSocialModal,
  };
}
