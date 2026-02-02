/**
 * ENHANCED: Helius WebSocket monitoring hook for real-time game updates
 * Integrates with PIR8 Anchor program events
 */

import { useEffect, useRef, useCallback } from 'react';
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

        // Turn Notification Logic
        if (event.type === 'moveMade') {
          const { gameState, getCurrentPlayer } = usePirateGameState.getState();
          const me = getCurrentPlayer();
          if (me && event.data.nextPlayerIndex === gameState?.players.findIndex((p: any) => p.publicKey === me.publicKey)) {
            // It's my turn next!
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('⚔️ PIR8: Your Turn!', {
                body: `An opponent has moved in game ${event.gameId}. Your ships await orders.`,
                icon: '/favicon.ico'
              });
            }
            setMessage('⚔️ ATTENTION: IT IS YOUR TURN!');
          }
        }

        // Call custom handler
        onGameEvent?.(event);

        if (LOG_LEVEL === 'debug') {
          // PIR8 Game Event received - silent
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
        // Helius monitor connected - silent
      }
      clearError();
    } catch (error) {
      if (LOG_LEVEL === 'debug') {
        console.error('Failed to connect Helius monitor');
      }
      // Mark as not connected so we can retry later
      isConnectedRef.current = false;
    }
  }, [handleTransaction, gameId, clearError, LOG_LEVEL]);

  const disconnect = useCallback(() => {
    if (monitorRef.current) {
      monitorRef.current.disconnect();
      monitorRef.current = null;
      isConnectedRef.current = false;

      if (LOG_LEVEL === 'debug' || LOG_LEVEL === 'info') {
        // Helius monitor disconnected - silent
      }
    }
  }, [LOG_LEVEL]);

  // Auto-connect when component mounts
  useEffect(() => {
    // Defer connection to avoid blocking initial render
    const timer = setTimeout(() => {
      connect();
    }, 2000);

    return () => {
      clearTimeout(timer);
      disconnect();
    };
  }, [connect, disconnect]);

  // Reconnect when gameId changes
  useEffect(() => {
    if (gameId && isConnectedRef.current) {
      disconnect();
      const timer = setTimeout(() => connect(), 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [gameId, connect, disconnect]);

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
        const gameId = extractGameIdFromLog(log);
        const nextPlayerIndex = parseInt(log.match(/next_player_index:\s*(\d+)/)?.[1] || '0', 10);
        return {
          type: 'moveMade',
          gameId,
          data: {
            description: 'Player made a move',
            nextPlayerIndex,
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
  return match?.[1] ?? 'unknown';
}
