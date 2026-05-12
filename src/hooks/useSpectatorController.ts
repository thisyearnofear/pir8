'use client';

import { useState, useCallback } from 'react';

export function useSpectatorController() {
  const [showSpectatorMode, setShowSpectatorMode] = useState(false);

  const openSpectatorMode = useCallback(() => setShowSpectatorMode(true), []);
  const closeSpectatorMode = useCallback(() => setShowSpectatorMode(false), []);

  return {
    showSpectatorMode,
    openSpectatorMode,
    closeSpectatorMode,
  };
}
