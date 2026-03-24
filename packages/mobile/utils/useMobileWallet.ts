/**
 * Mobile Wallet Hook - Solana Mobile Wallet Adapter
 *
 * Provides wallet connection, signing, and transaction building
 * for the PIR8 mobile game using the MWA protocol.
 *
 * Follows: CLEAN, MODULAR, ENHANCEMENT FIRST
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { SOLANA_CONFIG } from "@pir8/core/utils/constants";

export interface WalletState {
  isConnected: boolean;
  publicKey: PublicKey | null;
  address: string | null;
  balance: number;
  isLoading: boolean;
  error: string | null;
}

// MWA types (simplified - actual MWA protocol is more complex)
interface MWAAuthorizationResult {
  accounts: Array<{
    publicKey: Uint8Array;
    address: string;
    label?: string;
  }>;
  auth_token: string;
}

interface MWAInterface {
  authorize: (config: {
    cluster: string;
    identity: { name: string; uri: string; icon?: string };
  }) => Promise<MWAAuthorizationResult>;
  deauthorize: (authToken: string) => Promise<void>;
  signAndSendTransaction?: (params: {
    transaction: Transaction;
    authToken: string;
    publicKeys: PublicKey[];
  }) => Promise<string>;
  getCapabilities?: () => Promise<string[]>;
}

/**
 * Safely import MWA (may not be available in all environments)
 */
async function getMWA(): Promise<MWAInterface | null> {
  try {
    // MWA is typically available through @solana-mobile/mobile-wallet-adapter-protocol
    // In Expo, it's accessed through native modules
    const MobileWalletAdapter = require("@solana-mobile/mobile-wallet-adapter-protocol");
    return MobileWalletAdapter as MWAInterface;
  } catch {
    // Fallback: try web3 wallet adapter
    return null;
  }
}

export function useMobileWallet() {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    publicKey: null,
    address: null,
    balance: 0,
    isLoading: false,
    error: null,
  });

  const authTokenRef = useRef<string | null>(null);
  const connectionRef = useRef<Connection | null>(null);

  // Initialize connection
  useEffect(() => {
    const rpcUrl = SOLANA_CONFIG.RPC_URL || "https://api.devnet.solana.com";
    connectionRef.current = new Connection(rpcUrl, "confirmed");
  }, []);

  /**
   * Connect wallet via MWA protocol
   */
  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const mwa = await getMWA();

      if (!mwa) {
        // Development fallback: generate a mock wallet for testing
        console.warn("MWA not available, using mock wallet for development");
        const mockPubkey = PublicKey.unique();
        setState({
          isConnected: true,
          publicKey: mockPubkey,
          address: mockPubkey.toBase58(),
          balance: 0,
          isLoading: false,
          error: null,
        });
        return;
      }

      const result = await mwa.authorize({
        cluster: SOLANA_CONFIG.NETWORK || "devnet",
        identity: {
          name: "PIR8 Battle Arena",
          uri: "https://pir8.app",
        },
      });

      if (result.accounts.length === 0) {
        throw new Error("No accounts returned from wallet");
      }

      const account = result.accounts[0]!;
      const pubkey = new PublicKey(account.publicKey);
      authTokenRef.current = result.auth_token;

      // Fetch balance
      let balance = 0;
      try {
        if (connectionRef.current) {
          const lamports = await connectionRef.current.getBalance(pubkey);
          balance = lamports / 1e9; // Convert to SOL
        }
      } catch (e) {
        console.warn("Failed to fetch balance:", e);
      }

      setState({
        isConnected: true,
        publicKey: pubkey,
        address: pubkey.toBase58(),
        balance,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to connect wallet",
      }));
    }
  }, []);

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(async () => {
    try {
      if (authTokenRef.current) {
        const mwa = await getMWA();
        if (mwa?.deauthorize) {
          await mwa.deauthorize(authTokenRef.current);
        }
        authTokenRef.current = null;
      }
    } catch (e) {
      console.warn("Error disconnecting:", e);
    }

    setState({
      isConnected: false,
      publicKey: null,
      address: null,
      balance: 0,
      isLoading: false,
      error: null,
    });
  }, []);

  /**
   * Sign and send a transaction
   */
  const signAndSendTransaction = useCallback(
    async (transaction: Transaction): Promise<string | null> => {
      if (!state.publicKey || !authTokenRef.current) {
        setState((prev) => ({ ...prev, error: "Wallet not connected" }));
        return null;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const mwa = await getMWA();

        if (!mwa?.signAndSendTransaction) {
          throw new Error("Transaction signing not available");
        }

        const txSignature = await mwa.signAndSendTransaction({
          transaction,
          authToken: authTokenRef.current,
          publicKeys: [state.publicKey],
        });

        // Confirm transaction
        if (connectionRef.current) {
          await connectionRef.current.confirmTransaction(
            txSignature,
            "confirmed",
          );
        }

        // Refresh balance
        if (connectionRef.current && state.publicKey) {
          const lamports = await connectionRef.current.getBalance(
            state.publicKey,
          );
          setState((prev) => ({
            ...prev,
            balance: lamports / 1e9,
            isLoading: false,
          }));
        }

        return txSignature;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || "Transaction failed",
        }));
        return null;
      }
    },
    [state.publicKey],
  );

  /**
   * Refresh balance
   */
  const refreshBalance = useCallback(async () => {
    if (!state.publicKey || !connectionRef.current) return;

    try {
      const lamports = await connectionRef.current.getBalance(state.publicKey);
      setState((prev) => ({ ...prev, balance: lamports / 1e9 }));
    } catch (e) {
      console.warn("Failed to refresh balance:", e);
    }
  }, [state.publicKey]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    signAndSendTransaction,
    refreshBalance,
    clearError,
    connection: connectionRef.current,
  };
}
