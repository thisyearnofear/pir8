"use client";

import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletContextProvider } from "./WalletProvider";
import { SafeWalletContext, defaultWalletContext } from "./SafeWalletProvider";

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
    if (!error.message.includes("WalletContext")) {
      console.warn("Wallet error caught:", error);
    }
  }

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      retryCount: prev.retryCount + 1,
    }));
  };

  override render() {
    if (this.state.hasError) {
      if (this.state.retryCount >= this.maxRetries) {
        return (
          <SafeWalletContext.Provider value={defaultWalletContext}>
            <div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-xl border border-red-500/50 bg-red-900/90 p-4 text-sm text-red-200">
              <p className="mb-1 font-bold">Wallet Connection Failed</p>
              <p className="mb-2 text-xs text-red-300">
                Unable to connect after {this.maxRetries} attempts.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="rounded bg-red-700 px-3 py-1 text-xs hover:bg-red-600"
              >
                Reload Page
              </button>
            </div>
            {this.props.children}
          </SafeWalletContext.Provider>
        );
      }

      return (
        <SafeWalletContext.Provider value={defaultWalletContext}>
          <div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-xl border border-yellow-500/50 bg-yellow-900/90 p-4 text-sm text-yellow-200">
            <p className="mb-1 font-bold">Wallet Disconnected</p>
            <p className="mb-2 text-xs text-yellow-300">
              Connection lost. Reconnect to continue playing.
            </p>
            <button
              onClick={this.handleRetry}
              className="rounded bg-yellow-700 px-3 py-1 text-xs hover:bg-yellow-600"
            >
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
  const {
    publicKey,
    wallet,
    connected,
    connecting,
    disconnect,
    connect,
    signTransaction,
    signAllTransactions,
  } = useWallet();

  // Create a clean safe context object to prevent "read property on WalletContext" errors
  // caused by passing the raw full context object which might have internal library checks
  const safeContext = {
    ...defaultWalletContext,
    ready: true,
    publicKey,
    wallet,
    connected,
    connecting,
    disconnect,
    connect,
    signTransaction,
    signAllTransactions,
  };

  return (
    <SafeWalletContext.Provider value={safeContext}>
      {children}
    </SafeWalletContext.Provider>
  );
}

/**
 * WalletStack — the full wallet provider chain (Connection + adapters +
 * modal). Loaded lazily via next/dynamic so ~500KB of wallet/web3 code
 * never blocks first paint. Until it mounts, descendants see the default
 * (disconnected) safe context, which every consumer already handles.
 */
export default function WalletStack({
  children,
}: {
  children: React.ReactNode;
}) {
  // Wrap in try-catch to prevent provider conflicts from crashing the app
  try {
    return (
      <WalletContextProvider>
        <WalletErrorBoundary>
          <SafeWalletWrapper>{children}</SafeWalletWrapper>
        </WalletErrorBoundary>
      </WalletContextProvider>
    );
  } catch (error) {
    console.warn(
      "Wallet provider initialization failed, continuing without wallet support:",
      error,
    );
    return <div>{children}</div>;
  }
}
