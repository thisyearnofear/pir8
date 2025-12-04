'use client';

import React from 'react';

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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
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

  render() {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-blue via-blue-900 to-slate-900">
      <div className="pirate-card max-w-md mx-4 text-center">
        <div className="text-6xl mb-4">🏴‍☠️</div>
        <h2 className="text-xl font-bold text-pirate-gold mb-4">
          Shiver me timbers!
        </h2>
        <p className="text-gray-300 mb-6">
          Something went wrong on the high seas. But fear not, we&apos;ll get you back to battle!
        </p>
        <div className="bg-red-900 bg-opacity-30 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-300 font-mono break-words">
            {error.message}
          </p>
        </div>
        <div className="space-y-3">
          <button
            onClick={resetError}
            className="pirate-button w-full"
          >
            🔄 Set Sail Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
          >
            🚢 Reload Ship
          </button>
        </div>
      </div>
    </div>
  );
}