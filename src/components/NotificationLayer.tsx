'use client';

import { ErrorToast, SuccessToast } from './Toast';

interface NotificationLayerProps {
  error: string | null;
  showMessage: string | null;
  onClearError: () => void;
  onClearMessage: () => void;
}

export function NotificationLayer({
  error,
  showMessage,
  onClearError,
  onClearMessage,
}: NotificationLayerProps) {
  return (
    <>
      <ErrorToast error={error} onClose={onClearError} />
      <SuccessToast message={showMessage} onClose={onClearMessage} />
    </>
  );
}
