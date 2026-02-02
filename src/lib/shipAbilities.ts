/**
 * Ship Abilities System
 * 
 * Core Principles Applied:
 * - DRY: Single source of truth for all ship abilities
 * - MODULAR: Each ability is self-contained and testable
 * - CLEAN: Clear separation between ability definitions and game logic
 * - ORGANIZED: Domain-driven design (ships domain)
 */

import { ShipType, ShipAbility, Ship, GameState, ShipEffect } from '@/types/game';

/**
 * SINGLE SOURCE OF TRUTH: All ship ability definitions
 * MODULAR: Each ability is a complete, testable unit
 */
export const SHIP_ABILITIES: Record<ShipType, Omit<ShipAbility, 'currentCooldown' | 'isReady'>> = {
  sloop: {
    name: 'Spy Glass',
    description: 'Reveal a 5x5 area of fog of war, spotting hidden enemies and treasures',
    cooldown: 2,
    cost: { gold: 50 },
    type: 'utility',
    range: 2,
  },
  frigate: {
    name: 'Broadside',
    description: 'Fire all guns, attacking up to 2 enemy ships within range 3',
    cooldown: 3,
    cost: { cannons: 2 },
    type: 'offensive',
    range: 3,
  },
  galleon: {
    name: 'Fortress Mode',
    description: '+50% defense for 2 turns, but cannot move during this time',
    cooldown: 3,
    cost: { supplies: 30 },
    type: 'defensive',
    range: 0,
  },
  flagship: {
    name: 'Devastating Volley',
    description: 'Unleash a massive attack dealing 2x damage to a single target within range 2',
    cooldown: 4,
    cost: { cannons: 4, supplies: 20 },
    type: 'offensive',
    range: 2,
  },
};

/**
 * Initialize ability for a new ship (CLEAN: Factory pattern)
 */
export function initializeShipAbility(shipType: ShipType): ShipAbility {
  const baseAbility = SHIP_ABILITIES[shipType];
  return {
    ...baseAbility,
    currentCooldown: 0,
    isReady: true,
  };
}

/**
 * Check if ship can use its ability (MODULAR: Single responsibility)
 */
export function canUseAbility(ship: Ship, playerResources: any): { canUse: boolean; reason?: string } {
  if (!ship.ability.isReady) {
    return { canUse: false, reason: `On cooldown for ${ship.ability.currentCooldown} more turns` };
  }

  if (ship.health <= 0) {
    return { canUse: false, reason: 'Ship destroyed' };
  }

  // Check resource costs
  if (ship.ability.cost) {
    for (const [resource, cost] of Object.entries(ship.ability.cost)) {
      if (cost !== undefined && playerResources[resource] < cost) {
        return { canUse: false, reason: `Need ${cost} ${resource}` };
      }
    }
  }

  return { canUse: true };
}

/**
 * Use ship ability (MODULAR: Pure function, returns new state)
 */
export function useShipAbility(
  ship: Ship,
  gameState: GameState,
  targetData?: any
): {
  success: boolean;
  updatedShip: Ship;
  updatedGameState: GameState;
  message: string;
  effects?: ShipEffect[];
} {
  const ability = ship.ability;

  // Put ability on cooldown
  const updatedShip: Ship = {
    ...ship,
    ability: {
      ...ability,
      currentCooldown: ability.cooldown,
      isReady: false,
    },
  };

  let updatedGameState = { ...gameState };
  let effects: ShipEffect[] = [];
  let message = '';

  // Execute ability based on ship type (MODULAR: Strategy pattern)
  switch (ship.type) {
    case 'sloop':
      // Spy Glass: Reveal fog of war
      const revealed = revealFogOfWar(ship.position, gameState);
      message = `Spy Glass revealed ${revealed.treasures} treasures and ${revealed.enemies} enemy ships!`;
      // Note: Fog of war system would need to be implemented
      break;

    case 'frigate':
      // Broadside: Attack 2 targets within range
      const range = ship.ability.range || 1;
      const targets = findEnemiesInRange(ship, gameState, range, 2);
      if (targets.length === 0) {
        return {
          success: false,
          updatedShip: ship, // Don't use cooldown if no targets
          updatedGameState: gameState,
          message: 'No enemy ships in range for Broadside',
        };
      }
      message = `Broadside hit ${targets.length} enemy ships!`;
      // Damage would be applied in game engine
      break;

    case 'galleon':
      // Fortress Mode: +50% defense, immobile
      effects = [
        {
          type: 'defense_buff',
          duration: 2,
          magnitude: 0.5,
          source: ship.id,
        },
        {
          type: 'immobile',
          duration: 2,
          magnitude: 1,
          source: ship.id,
        },
      ];
      updatedShip.activeEffects = [...(updatedShip.activeEffects || []), ...effects];
      message = 'Fortress Mode activated! +50% defense for 2 turns';
      break;

    case 'flagship':
      // Devastating Volley: 2x damage attack
      if (!targetData?.targetShipId) {
        return {
          success: false,
          updatedShip: ship,
          updatedGameState: gameState,
          message: 'No target selected for Devastating Volley',
        };
      }
      
      // Check range
      const volleyRange = ship.ability.range || 1;
      const targetShip = findShipById(gameState, targetData.targetShipId);
      if (!targetShip) {
         return {
          success: false,
          updatedShip: ship,
          updatedGameState: gameState,
          message: 'Target ship not found',
        };
      }
      
      const dist = Math.sqrt(
        Math.pow(targetShip.position.x - ship.position.x, 2) + 
        Math.pow(targetShip.position.y - ship.position.y, 2)
      );
      
      // Allow diagonals logic (range * 1.5)
      if (dist > volleyRange * 1.5) {
         return {
          success: false,
          updatedShip: ship,
          updatedGameState: gameState,
          message: `Target out of range for Volley (Max: ${volleyRange})`,
        };
      }

      message = 'Devastating Volley unleashed! 2x damage dealt!';
      // Damage would be applied in game engine
      break;
  }

  return {
    success: true,
    updatedShip,
    updatedGameState,
    message,
    effects,
  };
}

/**
 * Reduce ability cooldown at turn end (MODULAR: Helper function)
 */
export function tickAbilityCooldown(ship: Ship): Ship {
  if (ship.ability.currentCooldown > 0) {
    return {
      ...ship,
      ability: {
        ...ship.ability,
        currentCooldown: ship.ability.currentCooldown - 1,
        isReady: ship.ability.currentCooldown - 1 === 0,
      },
    };
  }
  return ship;
}

/**
 * Tick down active effects (MODULAR: Effect management)
 */
export function tickShipEffects(ship: Ship): Ship {
  const updatedEffects = ship.activeEffects
    .map(effect => ({ ...effect, duration: effect.duration - 1 }))
    .filter(effect => effect.duration > 0);

  return {
    ...ship,
    activeEffects: updatedEffects,
  };
}

/**
 * Calculate modified stats based on active effects (CLEAN: Calculation logic)
 */
export function getEffectiveStats(ship: Ship): {
  attack: number;
  defense: number;
  canMove: boolean;
} {
  let attack = ship.attack;
  let defense = ship.defense;
  let canMove = true;

  for (const effect of ship.activeEffects) {
    switch (effect.type) {
      case 'attack_buff':
        attack *= (1 + effect.magnitude);
        break;
      case 'defense_buff':
        defense *= (1 + effect.magnitude);
        break;
      case 'immobile':
        canMove = false;
        break;
    }
  }

  return { attack: Math.round(attack), defense: Math.round(defense), canMove };
}

// HELPER FUNCTIONS (MODULAR: Single responsibility)

function revealFogOfWar(_position: any, _gameState: GameState): { treasures: number; enemies: number } {
  // TODO: Implement fog of war system
  // For now, return placeholder
  return { treasures: 2, enemies: 1 };
}

function findShipById(gameState: GameState, shipId: string): Ship | undefined {
  for (const player of gameState.players) {
    const ship = player.ships.find(s => s.id === shipId);
    if (ship) return ship;
  }
  return undefined;
}

function findEnemiesInRange(ship: Ship, gameState: GameState, range: number, maxTargets: number): Ship[] {
  const enemies: Ship[] = [];
  
  for (const player of gameState.players) {
    if (player.publicKey === ship.id.split('_')[0]) continue; // Skip own player
    
    for (const enemyShip of player.ships) {
      if (enemyShip.health <= 0) continue;
      
      const distance = Math.sqrt(
        Math.pow(ship.position.x - enemyShip.position.x, 2) + 
        Math.pow(ship.position.y - enemyShip.position.y, 2)
      );
      
      // Allow diagonals logic
      if (distance <= range * 1.5 && enemies.length < maxTargets) {
        enemies.push(enemyShip);
      }
    }
  }
  
  return enemies;
}
