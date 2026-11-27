'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ComponentType,
  type ReactNode,
} from "react";

// Safe wallet context that doesn't throw errors
export interface SafeWalletContextType {
    publicKey: any;
    wallet: any;
    connected: boolean;
    connecting: boolean;
    /** True once the real provider chain has mounted. Gate wallet UI on this. */
    ready: boolean;
    disconnect: () => Promise<void>;
    connect: () => Promise<void>;
    signTransaction?: (transaction: any) => Promise<any>;
    signAllTransactions?: (transactions: any[]) => Promise<any[]>;
}

export const defaultWalletContext: SafeWalletContextType = {
    publicKey: null,
    wallet: null,
    connected: false,
    connecting: false,
    ready: false,
    disconnect: async () => { },
    connect: async () => { },
};

export const SafeWalletContext = createContext<SafeWalletContextType>(defaultWalletContext);

export function SafeWalletProvider({ children }: { children: ReactNode }) {
    // The full provider chain (Connection + adapters + modal, ~500KB with
    // web3.js) loads after first paint — selecting a wallet is never on the
    // critical path. Children render exactly once: standalone under the
    // default (disconnected) context first, then re-parented into the live
    // providers when the chunk arrives. Every consumer already handles the
    // disconnected state (it's what SSR renders).
    const [Stack, setStack] =
        useState<ComponentType<{ children: ReactNode }> | null>(null);

    useEffect(() => {
        let cancelled = false;
        import("./WalletStack").then((mod) => {
            if (!cancelled) setStack(() => mod.default);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <SafeWalletContext.Provider value={defaultWalletContext}>
            {Stack ? <Stack>{children}</Stack> : children}
        </SafeWalletContext.Provider>
    );
}

export function useSafeWallet() {
    return useContext(SafeWalletContext);
}
