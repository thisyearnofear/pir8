/**
 * PIR8 Core- Shared Game Logic
 * 
 * Framework-agnostic game engine, types, and utilities.
 * Used by both web (Next.js) and mobile (Expo) applications.
 */

// Types
export * from './types/game';
export * from './types/gameMap';

// Game Engine
export * from './lib/pirateGameEngine';

// Utilities
export * from './utils/haptics';
export * from './utils/time';
export * from './utils/constants';

// Territory Bonuses
export { 
  calculateActiveBonuses, 
  calculateNextBonus,
  TERRITORY_BONUSES 
} from './lib/territoryBonuses';
