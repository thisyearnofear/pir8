'use client';

import { useEffect, useState } from 'react';
import { useMobileOptimized } from '../hooks/useMobileOptimized';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'error' | 'info' | 'loading';
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type = 'info', duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const { isMobile, triggerHaptic } = useMobileOptimized();

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      setIsLeaving(false);
      
      // Haptic feedback for mobile
      if (isMobile) {
        if (type === 'error') triggerHaptic('heavy');
        else if (type === 'success') triggerHaptic('medium');
        else triggerHaptic('light');
      }

      if (type !== 'loading' && duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [message, type, duration, isMobile, triggerHaptic]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible || !message) return null;

  const getToastStyles = () => {
    const baseStyles = `
      fixed top-4 left-1/2 transform -translate-x-1/2 z-50 
      max-w-sm w-full mx-4 p-4 rounded-lg shadow-lg
      transition-all duration-300 ease-in-out
      ${isLeaving ? 'opacity-0 translate-y-[-20px]' : 'opacity-100 translate-y-0'}
    `;

    const typeStyles = {
      success: 'bg-green-800 border-green-600 text-green-100',
      error: 'bg-red-800 border-red-600 text-red-100',
      info: 'bg-pirate-brown border-pirate-gold text-skull-white',
      loading: 'bg-blue-800 border-blue-600 text-blue-100'
    };

    return `${baseStyles} border-2 ${typeStyles[type]}`;
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '🎉';
      case 'error': return '⚠️';
      case 'loading': return '⏳';
      default: return '🏴‍☠️';
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-lg">{getIcon()}</span>
          <div className="flex-1">
            <p className="text-sm font-medium whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>
        
        {type !== 'loading' && (
          <button
            onClick={handleClose}
            className="ml-3 text-lg hover:opacity-70 transition-opacity focus:outline-none"
            aria-label="Close notification"
          >
            ×
          </button>
        )}
        
        {type === 'loading' && (
          <div className="ml-3">
            <div className="pirate-spinner w-4 h-4 border-white"></div>
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced error display component
interface ErrorToastProps {
  error: string | null;
  onClose: () => void;
}

export function ErrorToast({ error, onClose }: ErrorToastProps) {
  return <Toast message={error} type="error" onClose={onClose} />;
}

// Enhanced success display component  
interface SuccessToastProps {
  message: string | null;
  onClose: () => void;
}

export function SuccessToast({ message, onClose }: SuccessToastProps) {
  return <Toast message={message} type="success" onClose={onClose} />;
}

// Loading display component
interface LoadingToastProps {
  message: string | null;
  isLoading: boolean;
}

export function LoadingToast({ message, isLoading }: LoadingToastProps) {
  return <Toast message={isLoading ? message : null} type="loading" duration={0} />;
}