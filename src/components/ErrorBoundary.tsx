'use client';

import React from 'react';
import { Icon } from './ui/Icon';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Handle stack overflow specially - immediate recovery
    if (error.message.includes('Maximum call stack size exceeded')) {
      console.warn('PIR8 Stack Overflow detected - reloading page immediately');
      // Force immediate reload without delay
      window.location.reload();
      return;
    }

    console.error('PIR8 Error Boundary:', error, errorInfo);

    // Send error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Add error reporting here if needed
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error!} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--p8-ink)]">
      <div className="mx-4 max-w-md rounded-[var(--p8-radius)] border border-[var(--p8-threat)] bg-[var(--p8-deep)] p-6 text-center shadow-[var(--p8-shadow-instrument)]">
        <div className="mb-4 flex justify-center text-[var(--p8-threat)]">
          <Icon name="ship" size={44} />
        </div>
        <h2 className="mb-4 text-xl font-bold text-[var(--p8-vellum)]">
          Shiver me timbers!
        </h2>
        <p className="mb-6 text-[var(--p8-vellum-dim)]">
          Something went wrong on the high seas. But fear not, we&apos;ll get you back to battle!
        </p>
        <div className="mb-6 rounded-[var(--p8-radius)] border border-[var(--p8-threat)] bg-[var(--p8-ink)] p-4">
          <p className="break-words font-[var(--font-instrument)] text-sm text-[var(--p8-threat)]">
            {error.message}
          </p>
        </div>
        <div className="space-y-3">
          <button
            onClick={resetError}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--p8-radius)] border border-[var(--p8-lamp)] bg-[var(--p8-lamp)] px-4 py-3 font-bold text-[var(--p8-ink)] transition-colors hover:bg-[var(--p8-lamp-glow)]"
          >
            <Icon name="undo" size={16} />
            Set Sail Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-4 py-2 text-sm text-[var(--p8-vellum-dim)] transition-colors hover:border-[var(--p8-brass)] hover:text-[var(--p8-vellum)]"
          >
            <Icon name="ship" size={15} />
            Reload Ship
          </button>
        </div>
      </div>
    </div>
  );
}
