'use client';

import { useState, useCallback } from 'react';
import { useShowOnboarding } from './useShowOnboarding';

export function useEntryController() {
  const [showModeSelect, setShowModeSelect] = useState(false);
  const [showPracticeMenu, setShowPracticeMenu] = useState(false);
  const [showAIBattleModal, setShowAIBattleModal] = useState(false);
  const [handledIncomingChallenge, setHandledIncomingChallenge] =
    useState(false);

  const { shown: showOnboarding, dismiss: dismissOnboarding } =
    useShowOnboarding();

  const openModeSelect = useCallback(() => setShowModeSelect(true), []);
  const closeModeSelect = useCallback(() => setShowModeSelect(false), []);

  const openPracticeMenu = useCallback(() => setShowPracticeMenu(true), []);
  const closePracticeMenu = useCallback(() => setShowPracticeMenu(false), []);

  const openAIBattleModal = useCallback(() => setShowAIBattleModal(true), []);
  const closeAIBattleModal = useCallback(() => setShowAIBattleModal(false), []);

  return {
    showModeSelect,
    setShowModeSelect,
    showPracticeMenu,
    setShowPracticeMenu,
    showAIBattleModal,
    setShowAIBattleModal,
    handledIncomingChallenge,
    setHandledIncomingChallenge,
    showOnboarding,
    dismissOnboarding,
    openModeSelect,
    closeModeSelect,
    openPracticeMenu,
    closePracticeMenu,
    openAIBattleModal,
    closeAIBattleModal,
  };
}
