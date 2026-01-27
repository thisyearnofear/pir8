/**
 * useGameIdRecovery - Handles game ID mismatches between frontend and blockchain
 * When a memo creates a new game instead of joining, this helps frontend switch
 */

import { useCallback } from "react";
import { usePirateGameState, pirateGameStore } from "./usePirateGameState";
import { getAnchorClient } from "@/lib/server/anchorActions";
import { getGamePDA, getConfigPDA } from "@/lib/anchor";

interface GameIdRecoveryOptions {
  currentGameId?: string;
  expectedPlayerCount?: number;
  onGameIdChanged?: (newGameId: string) => void;
}

/**
 * Check if current game has expected number of players
 */
async function checkGamePlayerCount(
  gameId: string,
  expectedCount: number,
): Promise<boolean> {
  try {
    const { program } = await getAnchorClient();
    const gameIdNum = parseInt(gameId.replace(/[^\d]/g, ""), 10);
    if (isNaN(gameIdNum)) return false;

    const [gamePDA] = getGamePDA(gameIdNum);
    const gameAccount = await (program as any).account.game.fetch(gamePDA);

    // Count active players
    const activePlayers = gameAccount.players.filter(
      (player: any) =>
        player.key.toString() !== "11111111111111111111111111111111",
    ).length;

    console.log(
      `[Game Recovery] Game ${gameId} has ${activePlayers} players (expected ${expectedCount})`,
    );
    return activePlayers === expectedCount;
  } catch (error) {
    console.log(`[Game Recovery] Could not check game ${gameId}:`, error);
    return false;
  }
}

/**
 * Find the correct game ID by checking recent games
 */
async function findCorrectGameId(
  expectedCount: number,
): Promise<string | null> {
  try {
    const { program } = await getAnchorClient();
    const [configPDA] = getConfigPDA();
    const configAccount = await (program as any).account.gameConfig.fetch(configPDA);
    const totalGames = configAccount.totalGames.toNumber();

    // Check last 5 games
    const gamesToCheck = Math.max(0, totalGames - 5);

    for (let gameId = gamesToCheck; gameId < totalGames; gameId++) {
      const hasCorrectPlayers = await checkGamePlayerCount(
        `onchain_${gameId}`,
        expectedCount,
      );
      if (hasCorrectPlayers) {
        console.log(`[Game Recovery] Found correct game: onchain_${gameId}`);
        return `onchain_${gameId}`;
      }
    }

    return null;
  } catch (error) {
    console.error("[Game Recovery] Failed to search for games:", error);
    return null;
  }
}

/**
 * Hook to handle game ID recovery
 */
export function useGameIdRecovery(options: GameIdRecoveryOptions) {
  const { currentGameId, expectedPlayerCount = 2, onGameIdChanged } = options;
  const { gameState } = usePirateGameState();

  const attemptRecovery = useCallback(async () => {
    // Use setTimeout to break potential recursion
    setTimeout(async () => {
      try {
        if (!currentGameId || expectedPlayerCount <= 1) return;

        const currentState = pirateGameStore.getState().gameState;
        if (!currentState) return;

        const currentPlayerCount = currentState.players.length;

        // Only attempt recovery if we're missing players
        if (currentPlayerCount >= expectedPlayerCount) {
          console.log(
            `[Game Recovery] Game already has ${currentPlayerCount} players, no recovery needed`,
          );
          return;
        }

        console.log(
          `[Game Recovery] Current game ${currentGameId} has ${currentPlayerCount} players, expected ${expectedPlayerCount}`,
        );

        // Try to find the correct game
        const correctGameId = await findCorrectGameId(expectedPlayerCount);

        if (correctGameId && correctGameId !== currentGameId) {
          console.log(
            `[Game Recovery] Switching from ${currentGameId} to ${correctGameId}`,
          );

          // Update the game state with new game ID
          const updatedGameState = {
            ...currentState,
            gameId: correctGameId,
          };

          pirateGameStore.getState().setGameState(updatedGameState);
          onGameIdChanged?.(correctGameId);

          // Trigger a page reload to fully reset the game state
          setTimeout(() => {
            console.log(
              "[Game Recovery] Reloading page to fully sync with correct game",
            );
            window.location.reload();
          }, 1000);
        } else {
          console.log("[Game Recovery] No matching game found for recovery");
        }
      } catch (error) {
        console.error("[Game Recovery] Error during recovery:", error);
      }
    }, 100);
  }, [currentGameId, expectedPlayerCount, onGameIdChanged]);

  // Manual recovery only - disable automatic to prevent stack overflow
  // useEffect(() => {
  //     // Automatic recovery disabled to prevent circular dependencies
  // }, [currentGameId, expectedPlayerCount, attemptRecovery]);

  return {
    attemptRecovery,
    currentPlayerCount: gameState?.players.length || 0,
    expectedPlayerCount,
  };
}
