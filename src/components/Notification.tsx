'use client';

import { useState, useEffect } from 'react';

interface NotificationProps {
  message: string;
  isVisible: boolean;
  onClose?: () => void;
  duration?: number;
}

export default function Notification({ message, isVisible, onClose, duration = 3000 }: NotificationProps) {
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowNotification(true);
      const timer = setTimeout(() => {
        setShowNotification(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setShowNotification(false);
    }
  }, [isVisible, duration, onClose]);

  if (!showNotification) return null;

  return (
    <div className="notification animate-slide-down">
      <div className="notification-content">
        <span className="notification-icon">●</span>
        <span className="notification-text">{message}</span>
      </div>
    </div>
  );
}