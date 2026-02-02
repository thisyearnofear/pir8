'use client';

import React, { createContext, useContext } from "react";
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
    // Always wrap in WalletContextProvider so useWallet() works everywhere
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
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    override componentDidCatch(error: Error) {
        // Only log if it's not the known context error
        if (!error.message.includes('WalletContext')) {
            console.warn('Wallet error caught:', error);
        }
    }

    override render() {
        if (this.state.hasError) {
            // Provide safe default context if useWallet fails
            return (
                <SafeWalletContext.Provider value={defaultWalletContext}>
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
    const { publicKey, wallet, connected, connecting, disconnect, connect } = useWallet();

    // Create a clean safe context object to prevent "read property on WalletContext" errors
    // caused by passing the raw full context object which might have internal library checks
    const safeContext: SafeWalletContextType = {
        publicKey,
        wallet,
        connected,
        connecting,
        disconnect,
        connect
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