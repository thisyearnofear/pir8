'use client';

import { useEffect, useState, useCallback } from 'react';
import { useMobileOptimized } from '../hooks/useMobileOptimized';
import { Icon, type IconName } from '@/components/ui/Icon';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    return undefined; // Explicit return for when condition is false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, type, duration, isMobile, triggerHaptic]);



  if (!isVisible || !message) return null;

  const getToastStyles = () => {
    const baseStyles = `
      fixed top-6 left-1/2 transform -translate-x-1/2 z-toast
      max-w-md w-full mx-4 p-4 rounded-[var(--p8-radius)]
      border border-[var(--p8-brass-line)] bg-[var(--p8-deep)]
      shadow-[0_2px_8px_rgba(0,0,0,.45)]
      transition-all duration-300 ease-in-out border-l-4
      ${isLeaving ? 'opacity-0 translate-y-[-20px]' : 'opacity-100 translate-y-0'}
    `;

    const typeStyles = {
      success: 'border-l-[var(--p8-signal)]',
      error: 'border-l-[var(--p8-threat)]',
      info: 'border-l-[var(--p8-lamp)]',
      loading: 'border-l-[var(--p8-lamp)]'
    };

    return `${baseStyles} ${typeStyles[type]}`;
  };

  const iconName: IconName | null = (() => {
    switch (type) {
      case 'success': return 'check';
      case 'error': return 'skull';
      case 'info': return 'anchor';
      default: return null;
    }
  })();

  return (
    <div className={getToastStyles()}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {iconName && (
            <span className={type === 'error' ? 'text-[var(--p8-threat)]' : type === 'success' ? 'text-[var(--p8-signal)]' : 'text-[var(--p8-lamp)]'}>
              <Icon name={iconName} size={18} strokeWidth={1.5} />
            </span>
          )}
          <div className="flex-1">
            <p className="text-sm font-medium whitespace-pre-line text-[var(--p8-vellum)]">
              {message}
            </p>
          </div>
        </div>

        {type !== 'loading' && (
          <button
            onClick={handleClose}
            className="ml-3 text-[var(--p8-vellum-dim)] hover:text-[var(--p8-vellum)] hover:opacity-100 transition-opacity focus-visible:outline-2 focus-visible:outline-[var(--p8-lamp)]"
            aria-label="Close notification"
          >
            <Icon name="close" size={16} strokeWidth={1.5} />
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
