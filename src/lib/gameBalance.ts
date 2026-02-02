import { ShipType, Resources, Ship } from '../types/game';
import { SHIP_CONFIGS } from '../types/game';

/**
 * Consolidated game balance configurations and calculations
 * Merged from GameBalance and PirateGameManager to eliminate duplication
 */
export class GameBalance {
  
  /**
   * Ship configurations - Single source of truth
   * Combines stats from SHIP_CONFIGS with economy data
   */
  static readonly SHIP_BALANCE: Record<ShipType, {
    stats: Omit<Ship, 'id' | 'position' | 'resources' | 'ability' | 'activeEffects'>;
    cost: Resources;
    strength: number;
    resourceBonus: number;
  }> = {
    sloop: {
      stats: SHIP_CONFIGS.sloop,
      cost: { gold: 500, crew: 10, cannons: 5, supplies: 20, wood: 0, rum: 0 },
      strength: 1.0,
      resourceBonus: 1.0
    },
    frigate: {
      stats: SHIP_CONFIGS.frigate,
      cost: { gold: 1200, crew: 25, cannons: 15, supplies: 40, wood: 0, rum: 0 },
      strength: 2.0,
      resourceBonus: 1.2
    },
    galleon: {
      stats: SHIP_CONFIGS.galleon,
      cost: { gold: 2500, crew: 50, cannons: 30, supplies: 80, wood: 0, rum: 0 },
      strength: 3.5,
      resourceBonus: 1.5
    },
    flagship: {
      stats: SHIP_CONFIGS.flagship,
      cost: { gold: 5000, crew: 100, cannons: 60, supplies: 150, wood: 0, rum: 0 },
      strength: 5.0,
      resourceBonus: 1.3
    }
  };

  /**
   * Territory resource generation rates
   */
  static readonly TERRITORY_GENERATION = {
    water: { baseGeneration: 0 },
    island: { 
      supplies: 3,
      baseGeneration: 3
    },
    port: { 
      gold: 5,
      crew: 2,
      baseGeneration: 7
    },
    treasure: { 
      gold: 10,
      baseGeneration: 10
    },
    storm: { baseGeneration: 0 },
    reef: { baseGeneration: 0 },
    whirlpool: { baseGeneration: 0 }
  };

  /**
   * Victory condition thresholds
   */
  static readonly VICTORY_CONDITIONS = {
    territoryControlThreshold: 0.6, // 60% of valuable territories
    fleetDominanceThreshold: 0.8,   // 80% of total fleet power
    resourceDominanceThreshold: 15000 // Total resource value
  };

  /**
   * Combat damage calculations
   */
  static calculateCombatDamage(
    attackerType: ShipType,
    defenderType: ShipType,
    attackerHealth: number,
    defenderDefense: number
  ): number {
    const attackerStrength = this.SHIP_BALANCE[attackerType].strength;
    const defenderStrength = this.SHIP_BALANCE[defenderType].strength;
    const healthMultiplier = attackerHealth / 100; // Full health = 100% damage

    const baseDamage = attackerStrength * 20 * healthMultiplier;
    const defenseReduction = defenderDefense * (defenderStrength / 10); // Defense effectiveness based on ship type
    const effectiveDamage = Math.max(1, baseDamage - defenseReduction);

    // Add some randomness (±15%)
    const variance = 0.85 + (Math.random() * 0.3);
    return Math.floor(effectiveDamage * variance);
  }

  /**
   * Calculate territory control score
   */
  static calculateTerritoryScore(controlledTerritories: string[], gameMap: any): number {
    let score = 0;
    
    for (const coordStr of controlledTerritories) {
      const [x, y] = coordStr.split(',').map(Number);
      if (x !== undefined && y !== undefined && gameMap.cells[x] && gameMap.cells[x][y]) {
        const territory = gameMap.cells[x][y];
        const generation = this.TERRITORY_GENERATION[territory.type as keyof typeof this.TERRITORY_GENERATION];
        score += generation?.baseGeneration || 0;
      }
    }
    
    return score;
  }

  /**
   * Calculate fleet power
   */
  static calculateFleetPower(ships: Ship[]): number {
    return ships
      .filter(ship => ship.health > 0)
      .reduce((power, ship) => {
        const shipBalance = this.SHIP_BALANCE[ship.type];
        const healthRatio = ship.health / ship.maxHealth;
        return power + (shipBalance.strength * healthRatio);
      }, 0);
  }

  /**
   * Get ship building costs - Single source of truth
   * Replaces duplicate in PirateGameManager
   */
  static getShipBuildingCosts(shipType: ShipType): Resources {
    return this.SHIP_BALANCE[shipType].cost;
  }

  /**
   * Get resource collection multiplier based on ship type
   * Replaces duplicate in PirateGameManager
   */
  static getResourceCollectionMultiplier(shipType: ShipType): number {
    return this.SHIP_BALANCE[shipType].resourceBonus;
  }

  /**
   * Calculate resource value
   */
  static calculateResourceValue(resources: Resources): number {
    return (
      resources.gold +
      (resources.crew * 5) +
      (resources.cannons * 10) +
      (resources.supplies * 2) +
      (resources.wood * 2) +
      (resources.rum * 10)
    );
  }

  /**
   * Check if player has achieved victory
   */
  static checkVictoryConditions(
    player: any,
    allPlayers: any[],
    gameMap: any
  ): { hasWon: boolean; reason?: string } {
    
    // Fleet dominance victory
    const totalFleetPower = allPlayers.reduce((total, p) => 
      total + this.calculateFleetPower(p.ships), 0
    );
    const playerFleetPower = this.calculateFleetPower(player.ships);
    
    if (totalFleetPower > 0 && playerFleetPower / totalFleetPower >= this.VICTORY_CONDITIONS.fleetDominanceThreshold) {
      return { hasWon: true, reason: 'Fleet Dominance' };
    }

    // Territory control victory
    const playerTerritoryScore = this.calculateTerritoryScore(player.controlledTerritories, gameMap);
    const totalTerritoryScore = allPlayers.reduce((total, p) => 
      total + this.calculateTerritoryScore(p.controlledTerritories, gameMap), 0
    );
    
    if (totalTerritoryScore > 0 && playerTerritoryScore / totalTerritoryScore >= this.VICTORY_CONDITIONS.territoryControlThreshold) {
      return { hasWon: true, reason: 'Territory Control' };
    }

    // Resource dominance victory
    const playerResourceValue = this.calculateResourceValue(player.resources);
    if (playerResourceValue >= this.VICTORY_CONDITIONS.resourceDominanceThreshold) {
      return { hasWon: true, reason: 'Economic Dominance' };
    }

    return { hasWon: false };
  }

  /**
   * Generate turn-based resource income
   */
  static generateTurnIncome(player: any, gameMap: any): Partial<Resources> {
    const income: Partial<Resources> = { gold: 0, crew: 0, cannons: 0, supplies: 0 };
    
    for (const coordStr of player.controlledTerritories) {
      const [x, y] = coordStr.split(',').map(Number);
      const territory = gameMap.cells[x]?.[y];
      
      if (territory && territory.owner === player.publicKey) {
        const generation = this.TERRITORY_GENERATION[territory.type as keyof typeof this.TERRITORY_GENERATION];
        
        if (generation) {
          Object.entries(generation).forEach(([resource, amount]) => {
            if (resource !== 'baseGeneration' && typeof amount === 'number') {
              income[resource as keyof Resources] = (income[resource as keyof Resources] || 0) + amount;
            }
          });
        }
      }
    }
    
    return income;
  }
}