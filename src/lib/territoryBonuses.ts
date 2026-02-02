/**
 * Territory Bonuses System
 * 
 * Core Principles Applied:
 * - DRY: Single source of truth for territory combos
 * - CLEAN: Clear separation from game engine
 * - MODULAR: Each bonus is independently testable
 * - ORGANIZED: Domain-driven design (territory bonuses domain)
 */

import { Player, TerritoryCellType, GameState } from '@/types/game';

export interface TerritoryBonus {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: {
    type: 'count' | 'combo' | 'specific';
    territories: Partial<Record<TerritoryCellType, number>>;
  };
  effects: {
    goldMultiplier?: number;
    crewMultiplier?: number;
    suppliesMultiplier?: number;
    shipCostReduction?: number;
    extraAction?: boolean;
    resourceGeneration?: number;
  };
  tier: 'bronze' | 'silver' | 'gold' | 'legendary';
}

/**
 * SINGLE SOURCE OF TRUTH: All territory bonus definitions
 */
export const TERRITORY_BONUSES: TerritoryBonus[] = [
  // BRONZE TIER - Early game bonuses
  {
    id: 'port_starter',
    name: 'Harbor Master',
    description: 'Control 2 ports to establish trade routes',
    icon: '⚓',
    requirement: {
      type: 'count',
      territories: { port: 2 },
    },
    effects: {
      goldMultiplier: 1.25,
      crewMultiplier: 1.25,
    },
    tier: 'bronze',
  },
  {
    id: 'island_starter',
    name: 'Island Chain',
    description: 'Control 2 islands for supply production',
    icon: '🏝️',
    requirement: {
      type: 'count',
      territories: { island: 2 },
    },
    effects: {
      suppliesMultiplier: 1.3,
    },
    tier: 'bronze',
  },

  // SILVER TIER - Mid game bonuses
  {
    id: 'trade_network',
    name: 'Trade Network',
    description: 'Control 3 ports to dominate commerce',
    icon: '🏛️',
    requirement: {
      type: 'count',
      territories: { port: 3 },
    },
    effects: {
      goldMultiplier: 1.5,
      crewMultiplier: 1.5,
      shipCostReduction: 0.15,
    },
    tier: 'silver',
  },
  {
    id: 'supply_chain',
    name: 'Supply Chain',
    description: 'Control 3 islands for abundant resources',
    icon: '📦',
    requirement: {
      type: 'count',
      territories: { island: 3 },
    },
    effects: {
      suppliesMultiplier: 1.5,
      resourceGeneration: 5,
    },
    tier: 'silver',
  },
  {
    id: 'treasure_hunter',
    name: 'Treasure Hunter',
    description: 'Control 2 treasures for immense wealth',
    icon: '💰',
    requirement: {
      type: 'count',
      territories: { treasure: 2 },
    },
    effects: {
      goldMultiplier: 2.0,
      extraAction: true,
    },
    tier: 'silver',
  },

  // GOLD TIER - Advanced combos
  {
    id: 'naval_supremacy',
    name: 'Naval Supremacy',
    description: 'Control 4 ports to rule the seas',
    icon: '👑',
    requirement: {
      type: 'count',
      territories: { port: 4 },
    },
    effects: {
      goldMultiplier: 2.0,
      crewMultiplier: 2.0,
      shipCostReduction: 0.30,
    },
    tier: 'gold',
  },
  {
    id: 'resource_empire',
    name: 'Resource Empire',
    description: 'Control 5 islands to dominate production',
    icon: '🌴',
    requirement: {
      type: 'count',
      territories: { island: 5 },
    },
    effects: {
      suppliesMultiplier: 2.0,
      resourceGeneration: 10,
      shipCostReduction: 0.20,
    },
    tier: 'gold',
  },
  {
    id: 'balanced_fleet',
    name: 'Balanced Fleet',
    description: 'Control 1 port + 2 islands for versatility',
    icon: '⚖️',
    requirement: {
      type: 'combo',
      territories: { port: 1, island: 2 },
    },
    effects: {
      goldMultiplier: 1.3,
      suppliesMultiplier: 1.3,
      shipCostReduction: 0.20,
    },
    tier: 'gold',
  },

  // LEGENDARY TIER - Ultimate achievements
  {
    id: 'pirate_king',
    name: 'Pirate King',
    description: 'Control 3 treasures to become legendary',
    icon: '👑',
    requirement: {
      type: 'count',
      territories: { treasure: 3 },
    },
    effects: {
      goldMultiplier: 3.0,
      extraAction: true,
      shipCostReduction: 0.40,
      resourceGeneration: 20,
    },
    tier: 'legendary',
  },
  {
    id: 'master_strategist',
    name: 'Master Strategist',
    description: 'Control 2 ports + 3 islands + 1 treasure for ultimate power',
    icon: '🎯',
    requirement: {
      type: 'combo',
      territories: { port: 2, island: 3, treasure: 1 },
    },
    effects: {
      goldMultiplier: 2.5,
      suppliesMultiplier: 2.5,
      crewMultiplier: 2.0,
      shipCostReduction: 0.35,
      extraAction: true,
    },
    tier: 'legendary',
  },
];

/**
 * Calculate which bonuses a player has active (MODULAR: Pure function)
 */
export function calculateActiveBonuses(
  player: Player,
  gameState: GameState
): TerritoryBonus[] {
  const activeBonuses: TerritoryBonus[] = [];

  // Count territories by type
  const territoryCounts: Partial<Record<TerritoryCellType, number>> = {};
  
  for (const coordString of player.controlledTerritories) {
    const parts = coordString.split(',');
    const x = parseInt(parts[0] || '0', 10);
    const y = parseInt(parts[1] || '0', 10);
    const cell = gameState.gameMap.cells[x]?.[y];
    if (cell && cell.type) {
      territoryCounts[cell.type] = (territoryCounts[cell.type] || 0) + 1;
    }
  }

  // Check each bonus to see if requirements are met
  for (const bonus of TERRITORY_BONUSES) {
    let requirementsMet = true;

    for (const [territoryType, requiredCount] of Object.entries(bonus.requirement.territories)) {
      const actualCount = territoryCounts[territoryType as TerritoryCellType] || 0;
      if (requiredCount !== undefined && actualCount < requiredCount) {
        requirementsMet = false;
        break;
      }
    }

    if (requirementsMet) {
      activeBonuses.push(bonus);
    }
  }

  // Sort by tier (legendary > gold > silver > bronze)
  const tierOrder = { legendary: 0, gold: 1, silver: 2, bronze: 3 };
  activeBonuses.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);

  return activeBonuses;
}

/**
 * Calculate next possible bonus (MODULAR: Helper function)
 */
export function calculateNextBonus(
  player: Player,
  gameState: GameState
): { bonus: TerritoryBonus; progress: number; remaining: string } | null {
  const territoryCounts: Partial<Record<TerritoryCellType, number>> = {};
  
  for (const coordString of player.controlledTerritories) {
    const parts = coordString.split(',');
    const x = parseInt(parts[0] || '0', 10);
    const y = parseInt(parts[1] || '0', 10);
    const cell = gameState.gameMap.cells[x]?.[y];
    if (cell && cell.type) {
      territoryCounts[cell.type] = (territoryCounts[cell.type] || 0) + 1;
    }
  }

  // Find bonuses not yet achieved
  const activeBonusIds = new Set(
    calculateActiveBonuses(player, gameState).map(b => b.id)
  );

  for (const bonus of TERRITORY_BONUSES) {
    if (activeBonusIds.has(bonus.id)) continue;

    // Calculate progress toward this bonus
    let totalRequired = 0;
    let totalHave = 0;
    const missing: string[] = [];

    for (const [territoryType, requiredCount] of Object.entries(bonus.requirement.territories)) {
      const actualCount = territoryCounts[territoryType as TerritoryCellType] || 0;
      const required = requiredCount ?? 0;
      totalRequired += required;
      totalHave += Math.min(actualCount, required);

      if (actualCount < required) {
        missing.push(`${required - actualCount} ${territoryType}`);
      }
    }

    const progress = totalRequired > 0 ? totalHave / totalRequired : 0;

    // Return the closest bonus (highest progress)
    if (progress > 0 && progress < 1) {
      return {
        bonus,
        progress,
        remaining: missing.join(', '),
      };
    }
  }

  return null;
}

/**
 * Apply bonuses to resource generation (CLEAN: Calculation logic)
 */
export function applyBonusesToResources(
  baseResources: { gold: number; crew: number; supplies: number },
  activeBonuses: TerritoryBonus[]
): { gold: number; crew: number; supplies: number } {
  let gold = baseResources.gold;
  let crew = baseResources.crew;
  let supplies = baseResources.supplies;

  for (const bonus of activeBonuses) {
    if (bonus.effects.goldMultiplier) {
      gold *= bonus.effects.goldMultiplier;
    }
    if (bonus.effects.crewMultiplier) {
      crew *= bonus.effects.crewMultiplier;
    }
    if (bonus.effects.suppliesMultiplier) {
      supplies *= bonus.effects.suppliesMultiplier;
    }
    if (bonus.effects.resourceGeneration) {
      gold += bonus.effects.resourceGeneration;
      supplies += bonus.effects.resourceGeneration;
    }
  }

  return {
    gold: Math.round(gold),
    crew: Math.round(crew),
    supplies: Math.round(supplies),
  };
}

/**
 * Calculate total ship cost reduction (CLEAN: Helper)
 */
export function getTotalShipCostReduction(activeBonuses: TerritoryBonus[]): number {
  let totalReduction = 0;
  for (const bonus of activeBonuses) {
    if (bonus.effects.shipCostReduction) {
      totalReduction += bonus.effects.shipCostReduction;
    }
  }
  return Math.min(totalReduction, 0.5); // Cap at 50% reduction
}

/**
 * Check if player has extra action bonus (CLEAN: Helper)
 */
export function hasExtraActionBonus(activeBonuses: TerritoryBonus[]): boolean {
  return activeBonuses.some(bonus => bonus.effects.extraAction);
}
