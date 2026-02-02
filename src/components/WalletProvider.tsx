"use client";

import React, { useMemo } from "react";
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
  // Use Helius RPC if available, otherwise fall back to default
  const endpoint = useMemo(() => {
    return process.env.NEXT_PUBLIC_HELIUS_RPC_URL || clusterApiUrl("devnet");
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
  };

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
}
