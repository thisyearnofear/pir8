'use client';

import React, { createContext, useContext, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletContextProvider } from "./WalletProvider";

// Safe wallet context that doesn't throw errors
interface SafeWalletContextType {
    publicKey: any;
    wallet: any;
    connected: boolean;
    connecting: boolean;
    disconnect: () => Promise<void>;
    connect: () => Promise<void>;
    signTransaction?: (transaction: any) => Promise<any>;
    signAllTransactions?: (transactions: any[]) => Promise<any[]>;
}

const defaultWalletContext: SafeWalletContextType = {
    publicKey: null,
    wallet: null,
    connected: false,
    connecting: false,
    disconnect: async () => { },
    connect: async () => { },
};

const SafeWalletContext = createContext<SafeWalletContextType>(defaultWalletContext);

export function SafeWalletProvider({ children }: { children: React.ReactNode }) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // During SSR, render children with default context (no wallet)
    if (!isClient) {
        return (
            <SafeWalletContext.Provider value={defaultWalletContext}>
                {children}
            </SafeWalletContext.Provider>
        );
    }

    // On client, wrap in WalletContextProvider
    return (
        <WalletContextProvider>
            <WalletErrorBoundary>
                <SafeWalletWrapper>{children}</SafeWalletWrapper>
            </WalletErrorBoundary>
        </WalletContextProvider>
    );
}

class WalletErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; retryCount: number }
> {
    private maxRetries = 3;

    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, retryCount: 0 };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    override componentDidCatch(error: Error) {
        if (!error.message.includes('WalletContext')) {
            console.warn('Wallet error caught:', error);
        }
    }

    handleRetry = () => {
        this.setState(prev => ({ hasError: false, retryCount: prev.retryCount + 1 }));
    };

    override render() {
        if (this.state.hasError) {
            if (this.state.retryCount >= this.maxRetries) {
                return (
                    <SafeWalletContext.Provider value={defaultWalletContext}>
                        <div className="fixed bottom-4 right-4 z-50 bg-red-900/90 border border-red-500/50 rounded-xl p-4 text-sm text-red-200 max-w-xs">
                            <p className="font-bold mb-1">Wallet Connection Failed</p>
                            <p className="text-red-300 text-xs mb-2">Unable to connect after {this.maxRetries} attempts.</p>
                            <button onClick={() => window.location.reload()} className="text-xs bg-red-700 hover:bg-red-600 px-3 py-1 rounded">
                                Reload Page
                            </button>
                        </div>
                        {this.props.children}
                    </SafeWalletContext.Provider>
                );
            }

            return (
                <SafeWalletContext.Provider value={defaultWalletContext}>
                    <div className="fixed bottom-4 right-4 z-50 bg-yellow-900/90 border border-yellow-500/50 rounded-xl p-4 text-sm text-yellow-200 max-w-xs">
                        <p className="font-bold mb-1">Wallet Disconnected</p>
                        <p className="text-yellow-300 text-xs mb-2">Connection lost. Reconnect to continue playing.</p>
                        <button onClick={this.handleRetry} className="text-xs bg-yellow-700 hover:bg-yellow-600 px-3 py-1 rounded">
                            Reconnect Wallet
                        </button>
                    </div>
                    {this.props.children}
                </SafeWalletContext.Provider>
            );
        }

        return this.props.children;
    }
}

function SafeWalletWrapper({ children }: { children: React.ReactNode }) {
    // Now we can safely call useWallet because we're inside WalletContextProvider
    // If this throws (e.g. context missing), ErrorBoundary will catch it
    const { publicKey, wallet, connected, connecting, disconnect, connect, signTransaction, signAllTransactions } = useWallet();

    // Create a clean safe context object to prevent "read property on WalletContext" errors
    // caused by passing the raw full context object which might have internal library checks
    const safeContext: SafeWalletContextType = {
        publicKey,
        wallet,
        connected,
        connecting,
        disconnect,
        connect,
        signTransaction,
        signAllTransactions
    };

    return (
        <SafeWalletContext.Provider value={safeContext}>
            {children}
        </SafeWalletContext.Provider>
    );
}

export function useSafeWallet() {
    return useContext(SafeWalletContext);
}