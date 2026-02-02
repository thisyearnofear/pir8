'use client';

import React, { useMemo, useEffect, useState } from "react";
// @ts-ignore: Exports from @solana/wallet-adapter-react are not resolving correctly in TS
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

export function WalletContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side before initializing wallets
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Use Helius RPC if available, otherwise fall back to default
  // Use Helius RPC if successfully configured, otherwise fall back to default
  const endpoint = useMemo(() => {
    const heliusUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
    if (heliusUrl && !heliusUrl.includes('YOUR_API_KEY')) {
      return heliusUrl;
    }
    return clusterApiUrl("devnet");
  }, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    [],
  );

  const onError = (error: Error) => {
    console.error("Wallet connection error:", error);
    // Don't throw, just log - allows app to continue
    // Suppress ethereum provider conflicts in AI vs AI mode
    if (error.message.includes('ethereum') || error.message.includes('provider')) {
      console.warn("Ethereum provider conflict detected - continuing without wallet");
      return;
    }
  };

  // Prevent SSR issues and ethereum provider conflicts
  if (!isClient) {
    return <div>{children}</div>;
  }

  // Wrap in try-catch to prevent provider conflicts from crashing the app
  try {
    return (
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider
          wallets={wallets}
          autoConnect={false}
          onError={onError}
        >
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    );
  } catch (error) {
    console.warn("Wallet provider initialization failed, continuing without wallet support:", error);
    return <div>{children}</div>;
  }
}