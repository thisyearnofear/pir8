import { usePirateGameStore } from "../store/gameStore";

/**
 * Game Mode Types - Progressive Onboarding Architecture
 * - 'on-chain': Full blockchain game (requires wallet)
 * - 'practice': Local AI opponent (no wallet required)
 * - 'spectator': Read-only view of live games (no wallet required)
 */
export type { GameMode } from "../types/game";

// Re-export the store as a hook for backward compatibility
export const usePirateGameState = () => usePirateGameStore();
export const pirateGameStore = usePirateGameStore;
