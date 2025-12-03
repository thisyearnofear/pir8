/**
 * ENHANCED: Helius WebSocket monitoring hook for real-time game updates
 * Integrates with PIR8 Anchor program events
 */

import { useEffect, useRef, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { HeliusMonitor } from '../lib/integrations';
import { usePirateGameState } from './usePirateGameState';

interface UseHeliusMonitorProps {
  gameId?: string;
  onGameEvent?: (event: GameEvent) => void;
}

export interface GameEvent {
  type: 'gameCreated' | 'playerJoined' | 'gameStarted' | 'moveMade' | 'gameCompleted';
  gameId: string;
  data: any;
  timestamp: number;
}

export const useHeliusMonitor = ({ gameId, onGameEvent }: UseHeliusMonitorProps = {}) => {
  const { connection } = useConnection();
  const { setMessage, clearError } = usePirateGameState();
  const monitorRef = useRef<HeliusMonitor | null>(null);
  const isConnectedRef = useRef(false);
  const LOG_LEVEL = (process.env.NEXT_PUBLIC_LOG_LEVEL as any) || 'error';

  const handleTransaction = useCallback((data: any) => {
    try {
      // Process transaction data and extract game events
      const event = parseGameEvent(data);
      if (event) {
        // Show real-time feedback in UI
        setMessage(`🔥 ${event.type}: ${event.data.description || 'Event occurred'}`);
        
        // Call custom handler
        onGameEvent?.(event);
        
        if (LOG_LEVEL === 'debug') {
          console.log('PIR8 Game Event', event);
        }
      }
    } catch (error) {
      if (LOG_LEVEL === 'debug') {
        console.error('Error handling game transaction');
      }
    }
  }, [onGameEvent, setMessage, LOG_LEVEL]);

  const connect = useCallback(() => {
    if (isConnectedRef.current || !process.env.NEXT_PUBLIC_HELIUS_RPC_URL) {
      return;
    }

    try {
      monitorRef.current = new HeliusMonitor(handleTransaction, gameId);
      monitorRef.current.connect();
      isConnectedRef.current = true;
      
      if (LOG_LEVEL === 'debug' || LOG_LEVEL === 'info') {
        console.log('Helius monitor connected');
      }
      clearError();
    } catch (error) {
      if (LOG_LEVEL === 'debug') {
        console.error('Failed to connect Helius monitor');
      }
    }
  }, [handleTransaction, gameId, clearError, LOG_LEVEL]);

  const disconnect = useCallback(() => {
    if (monitorRef.current) {
      monitorRef.current.disconnect();
      monitorRef.current = null;
      isConnectedRef.current = false;
      
      if (LOG_LEVEL === 'debug' || LOG_LEVEL === 'info') {
        console.log('Helius monitor disconnected');
      }
    }
  }, [LOG_LEVEL]);

  // Auto-connect when component mounts
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, []);

  // Reconnect when gameId changes
  useEffect(() => {
    if (gameId && isConnectedRef.current) {
      disconnect();
      setTimeout(() => connect(), 100);
    }
  }, [gameId]);

  return {
    isConnected: isConnectedRef.current,
    connect,
    disconnect,
    monitor: monitorRef.current,
  };
};

// Helper function to parse game events from transaction data
function parseGameEvent(data: any): GameEvent | null {
  try {
    const logs = data?.result?.value?.meta?.logMessages || [];
    const signature = data?.result?.value?.signature;
    
    for (const log of logs) {
      if (log.includes('Program log: GameCreated')) {
        return {
          type: 'gameCreated',
          gameId: extractGameIdFromLog(log),
          data: { 
            description: 'New game created',
            signature,
            log 
          },
          timestamp: Date.now(),
        };
      } else if (log.includes('Program log: PlayerJoined')) {
        return {
          type: 'playerJoined',
          gameId: extractGameIdFromLog(log),
          data: { 
            description: 'Player joined game',
            signature,
            log 
          },
          timestamp: Date.now(),
        };
      } else if (log.includes('Program log: GameStarted')) {
        return {
          type: 'gameStarted',
          gameId: extractGameIdFromLog(log),
          data: { 
            description: 'Game battle has begun!',
            signature,
            log 
          },
          timestamp: Date.now(),
        };
      } else if (log.includes('Program log: MoveMade')) {
        return {
          type: 'moveMade',
          gameId: extractGameIdFromLog(log),
          data: { 
            description: 'Player made a move',
            signature,
            log 
          },
          timestamp: Date.now(),
        };
      } else if (log.includes('Program log: GameCompleted')) {
        return {
          type: 'gameCompleted',
          gameId: extractGameIdFromLog(log),
          data: { 
            description: 'Game completed! Winner determined',
            signature,
            log 
          },
          timestamp: Date.now(),
        };
      }
    }
    
    return null;
  } catch (error) {
    if (process.env.NEXT_PUBLIC_LOG_LEVEL === 'debug') {
      console.error('Error parsing game event:', error);
    }
    return null;
  }
}

function extractGameIdFromLog(log: string): string {
  // Extract game ID from program log
  // Format: "Program log: GameCreated { game_id: 123, ... }"
  const match = log.match(/game_id:\s*(\d+)/);
  return match ? match[1] : 'unknown';
}
