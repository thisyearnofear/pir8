'use client';

import React from 'react';

interface AIBattleErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    retryCount: number;
}

interface AIBattleErrorBoundaryProps {
    children: React.ReactNode;
}

export class AIBattleErrorBoundary extends React.Component<AIBattleErrorBoundaryProps, AIBattleErrorBoundaryState> {
    private maxRetries = 3;

    constructor(props: AIBattleErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, retryCount: 0 };
    }

    static getDerivedStateFromError(error: Error): AIBattleErrorBoundaryState {
        return { hasError: true, error, retryCount: 0 };
    }

    override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Only auto-recover if we haven't exceeded max retries
        if (this.state.retryCount >= this.maxRetries) {
            console.error('AI Battle: Max retries exceeded', error, errorInfo);
            return;
        }

        // Handle specific AI vs AI errors
        if (error.message.includes('ethereum') || error.message.includes('Cannot set property')) {
            console.warn('AI Battle: Ethereum provider conflict detected, attempting recovery');
            setTimeout(() => {
                this.setState(prev => ({ hasError: false, error: undefined, retryCount: prev.retryCount + 1 }));
            }, 1000);
            return;
        }

        if (error.message.includes('length') || error.message.includes('undefined')) {
            console.warn('AI Battle: Array access error detected, attempting recovery');
            setTimeout(() => {
                this.setState(prev => ({ hasError: false, error: undefined, retryCount: prev.retryCount + 1 }));
            }, 500);
            return;
        }

        console.error('AI Battle Error:', error, errorInfo);
    }

    resetError = () => {
        this.setState({ hasError: false, error: undefined });
    };

    override render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                    <div className="pirate-card max-w-md mx-4 text-center">
                        <div className="text-6xl mb-4">🤖⚔️</div>
                        <h2 className="text-xl font-bold text-neon-cyan mb-4">
                            AI Battle Interrupted!
                        </h2>
                        <p className="text-gray-300 mb-6">
                            The AI pirates encountered rough seas. Let&apos;s get them back to battle!
                        </p>
                        <div className="bg-red-900 bg-opacity-30 rounded-lg p-4 mb-6">
                            <p className="text-sm text-red-300 font-mono break-words">
                                {this.state.error?.message || 'Unknown error'}
                            </p>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={this.resetError}
                                className="pirate-button w-full"
                            >
                                🔄 Restart AI Battle
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                            >
                                🚢 Reload Game
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default AIBattleErrorBoundary;