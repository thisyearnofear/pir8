'use client';

import { useCallback } from 'react';
import { useNotificationState } from '@/store/gameStore';
import { useErrorHandler } from './useErrorHandler';

export function useNotificationController() {
  const { error, showMessage, setError, setMessage, clearError } =
    useNotificationState();
  const { handleGameError } = useErrorHandler();

  const handleGameEvent = useCallback(
    (message: string) => {
      setMessage(null);
      setTimeout(() => {
        setMessage(message);
        setTimeout(() => setMessage(null), 3000);
      }, 50);
    },
    [setMessage]
  );

  return {
    error,
    showMessage,
    setError,
    setMessage,
    clearError,
    handleGameEvent,
    handleGameError,
  };
}
