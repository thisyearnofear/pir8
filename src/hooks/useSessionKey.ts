/**
 * useSessionKey hook - Session key management for private gameplay
 * 
 * Handles:
 * - Ephemeral keypair generation
 * - Session storage persistence
 * - Integration with join/move operations
 */

import { useState, useEffect, useCallback } from 'react';
import { Keypair, PublicKey } from '@solana/web3.js';

const SESSION_KEY_STORAGE_KEY = 'pir8_session_key';
const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface SessionKeyState {
  keypair: Keypair | null;
  publicKey: PublicKey | null;
  isActive: boolean;
  createdAt: number | null;
  expiresAt: number | null;
}

export interface UseSessionKeyReturn {
  state: SessionKeyState;
  createSession: () => Keypair | null;
  clearSession: () => void;
  getSessionSigner: () => Keypair | null;
  isSessionValid: () => boolean;
}

/**
 * Generate a new ephemeral session keypair
 */
export const generateSessionKeypair = (): Keypair => {
  return Keypair.generate();
};

/**
 * Serialize keypair for storage
 */
export const serializeSessionKey = (keypair: Keypair): string => {
  return JSON.stringify({
    secret: Array.from(keypair.secretKey),
    publicKey: keypair.publicKey.toBase58(),
  });
};

/**
 * Deserialize keypair from storage
 */
export const deserializeSessionKey = (data: string): Keypair | null => {
  try {
    const parsed = JSON.parse(data);
    if (parsed.secret && Array.isArray(parsed.secret)) {
      const secretKey = Uint8Array.from(parsed.secret);
      return Keypair.fromSecretKey(secretKey);
    }
    return null;
  } catch {
    return null;
  }
};

export function useSessionKey(): UseSessionKeyReturn {
  const [state, setState] = useState<SessionKeyState>({
    keypair: null,
    publicKey: null,
    isActive: false,
    createdAt: null,
    expiresAt: null,
  });

  // Load session from storage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY_STORAGE_KEY);
    if (stored) {
      const keypair = deserializeSessionKey(stored);
      if (keypair) {
        const createdAt = Date.now();
        const expiresAt = createdAt + SESSION_TIMEOUT_MS;
        
        // Check if session is still valid
        if (expiresAt > Date.now()) {
          setState({
            keypair,
            publicKey: keypair.publicKey,
            isActive: true,
            createdAt,
            expiresAt,
          });
        } else {
          // Session expired, clear it
          sessionStorage.removeItem(SESSION_KEY_STORAGE_KEY);
        }
      }
    }
  }, []);

  /**
   * Create a new session keypair
   */
  const createSession = useCallback((): Keypair | null => {
    const keypair = generateSessionKeypair();
    const createdAt = Date.now();
    const expiresAt = createdAt + SESSION_TIMEOUT_MS;

    // Store in sessionStorage
    const serialized = serializeSessionKey(keypair);
    sessionStorage.setItem(SESSION_KEY_STORAGE_KEY, serialized);

    setState({
      keypair,
      publicKey: keypair.publicKey,
      isActive: true,
      createdAt,
      expiresAt,
    });

    return keypair;
  }, []);

  /**
   * Clear the session key
   */
  const clearSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY_STORAGE_KEY);
    setState({
      keypair: null,
      publicKey: null,
      isActive: false,
      createdAt: null,
      expiresAt: null,
    });
  }, []);

  /**
   * Check if session is still valid
   */
  const isSessionValid = useCallback((): boolean => {
    if (!state.isActive || !state.expiresAt) return false;
    return state.expiresAt > Date.now();
  }, [state.isActive, state.expiresAt]);

  /**
   * Get the session signer keypair
   */
  const getSessionSigner = useCallback((): Keypair | null => {
    if (!isSessionValid()) return null;
    return state.keypair;
  }, [state.keypair, isSessionValid]);

  return {
    state,
    createSession,
    clearSession,
    getSessionSigner,
    isSessionValid,
  };
}

export default useSessionKey;