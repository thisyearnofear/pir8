import { useState } from 'react';
import { useGameState } from './useGameState';
import { Player } from '@/types/game';

interface UseGameJoinReturn {
  isJoining: boolean;
  error: string | null;
  joinGame: (gameId: string, player: Player) => Promise<boolean>;
  clearError: () => void;
}

export const useGameJoin = (): UseGameJoinReturn => {
  const { joinGame: joinGameStore } = useGameState();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinGame = async (gameId: string, player: Player): Promise<boolean> => {
    if (!gameId || !gameId.trim()) {
      setError('Game ID is required');
      return false;
    }

    try {
      setIsJoining(true);
      setError(null);

      // Call the store's joinGame (local state join)
      // TODO: Future enhancement - validate game exists on-chain before joining
      joinGameStore(gameId, player);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join game';
      setError(message);
      return false;
    } finally {
      setIsJoining(false);
    }
  };

  const clearError = () => setError(null);

  return {
    isJoining,
    error,
    joinGame,
    clearError,
  };
};
