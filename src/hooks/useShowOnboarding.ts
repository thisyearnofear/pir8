'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'pir8_onboarding_seen';

export function useShowOnboarding() {
  const [shown, setShown] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    try {
      const hasSeenOnboarding = localStorage.getItem(STORAGE_KEY);
      if (!hasSeenOnboarding) {
        setShown(true);
      }
    } catch {
      // localStorage not available (SSR or private mode)
      setShown(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // localStorage not available
    }
    setShown(false);
  };

  const reset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage not available
    }
    setShown(true);
  };

  return { 
    shown: isClient && shown, 
    dismiss,
    reset 
  };
}
