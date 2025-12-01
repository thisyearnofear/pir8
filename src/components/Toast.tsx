'use client';

import { useEffect, useState, useCallback } from 'react';
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

  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  }, [onClose]);

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

  

  if (!isVisible || !message) return null;

  const getToastStyles = () => {
    const baseStyles = `
      fixed top-6 left-1/2 transform -translate-x-1/2 z-50 
      max-w-md w-full mx-4 p-4 rounded-lg backdrop-filter backdrop-blur-lg
      transition-all duration-300 ease-in-out font-mono
      ${isLeaving ? 'opacity-0 translate-y-[-20px]' : 'opacity-100 translate-y-0'}
    `;

    const typeStyles = {
      success: 'bg-neon-cyan bg-opacity-10 border-neon-cyan text-neon-cyan',
      error: 'bg-neon-orange bg-opacity-10 border-neon-orange text-neon-orange',
      info: 'bg-neon-magenta bg-opacity-10 border-neon-magenta text-neon-magenta',
      loading: 'bg-neon-cyan bg-opacity-10 border-neon-cyan text-neon-cyan'
    };

    return `${baseStyles} border-2 shadow-lg shadow-neon-cyan shadow-opacity-20 ${typeStyles[type]}`;
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '◆';
      case 'error': return '▲';
      case 'loading': return '●';
      default: return '⚓';
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xl animate-pulse">{getIcon()}</span>
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
