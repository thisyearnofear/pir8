'use client';

import React, { createContext, useContext, useEffect, useState } from "react";
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

const SafeWalletContext = createContext<SafeWalletContextType>({
    publicKey: null,
    wallet: null,
    connected: false,
    connecting: false,
    disconnect: async () => { },
    connect: async () => { },
});

export function SafeWalletProvider({ children }: { children: React.ReactNode }) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        // Provide safe defaults during SSR
        return (
            <SafeWalletContext.Provider
                value={{
                    publicKey: null,
                    wallet: null,
                    connected: false,
                    connecting: false,
                    disconnect: async () => { },
                    connect: async () => { },
                }}
            >
                {children}
            </SafeWalletContext.Provider>
        );
    }

    return (
        <WalletContextProvider>
            <SafeWalletWrapper>{children}</SafeWalletWrapper>
        </WalletContextProvider>
    );
}

function SafeWalletWrapper({ children }: { children: React.ReactNode }) {
    // This component is inside WalletContextProvider, so it can safely use wallet hooks
    let walletContext;

    try {
        // Import useWallet dynamically to avoid SSR issues
        const { useWallet } = require("@solana/wallet-adapter-react");
        walletContext = useWallet();
    } catch (error) {
        console.warn('Wallet adapter not available:', error);
        walletContext = {
            publicKey: null,
            wallet: null,
            connected: false,
            connecting: false,
            disconnect: async () => { },
            connect: async () => { },
        };
    }

    return (
        <SafeWalletContext.Provider value={walletContext}>
            {children}
        </SafeWalletContext.Provider>
    );
}

export function useSafeWallet() {
    return useContext(SafeWalletContext);
}