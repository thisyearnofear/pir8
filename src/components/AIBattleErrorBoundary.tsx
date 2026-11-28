'use client';

import React from 'react';
import { Icon } from './ui/Icon';

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
                <div className="flex min-h-screen items-center justify-center bg-[var(--p8-ink)]">
                    <div className="mx-4 max-w-md rounded-[var(--p8-radius)] border border-[var(--p8-threat)] bg-[var(--p8-deep)] p-6 text-center shadow-[var(--p8-shadow-instrument)]">
                        <div className="mb-4 flex items-center justify-center gap-3 text-[var(--p8-threat)]">
                            <Icon name="brain" size={32} />
                            <Icon name="attack" size={32} />
                        </div>
                        <h2 className="mb-4 text-xl font-bold text-[var(--p8-vellum)]">
                            AI Battle Interrupted!
                        </h2>
                        <p className="mb-6 text-[var(--p8-vellum-dim)]">
                            The AI pirates encountered rough seas. Let&apos;s get them back to battle!
                        </p>
                        <div className="mb-6 rounded-[var(--p8-radius)] border border-[var(--p8-threat)] bg-[var(--p8-ink)] p-4">
                            <p className="break-words font-[var(--font-instrument)] text-sm text-[var(--p8-threat)]">
                                {this.state.error?.message || 'Unknown error'}
                            </p>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={this.resetError}
                                className="flex w-full items-center justify-center gap-2 rounded-[var(--p8-radius)] border border-[var(--p8-lamp)] bg-[var(--p8-lamp)] px-4 py-3 font-bold text-[var(--p8-ink)] transition-colors hover:bg-[var(--p8-lamp-glow)]"
                            >
                                <Icon name="undo" size={16} />
                                Restart AI Battle
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="flex w-full items-center justify-center gap-2 rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] px-4 py-2 text-sm text-[var(--p8-vellum-dim)] transition-colors hover:border-[var(--p8-brass)] hover:text-[var(--p8-vellum)]"
                            >
                                <Icon name="ship" size={15} />
                                Reload Game
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
