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
    range: number;
  }> = {
    sloop: {
      stats: SHIP_CONFIGS.sloop,
      cost: { gold: 500, crew: 10, cannons: 5, supplies: 20, wood: 0, rum: 0 },
      strength: 1.0,
      resourceBonus: 1.0,
      range: 2
    },
    frigate: {
      stats: SHIP_CONFIGS.frigate,
      cost: { gold: 1200, crew: 25, cannons: 15, supplies: 40, wood: 0, rum: 0 },
      strength: 2.0,
      resourceBonus: 1.2,
      range: 3
    },
    galleon: {
      stats: SHIP_CONFIGS.galleon,
      cost: { gold: 2500, crew: 50, cannons: 30, supplies: 80, wood: 0, rum: 0 },
      strength: 3.5,
      resourceBonus: 1.5,
      range: 2
    },
    flagship: {
      stats: SHIP_CONFIGS.flagship,
      cost: { gold: 5000, crew: 100, cannons: 60, supplies: 150, wood: 0, rum: 0 },
      strength: 5.0,
      resourceBonus: 1.3,
      range: 1
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
    territoryControlThreshold: 0.5, // 50% of valuable territories - lowered from 60%
    fleetDominanceThreshold: 0.65,  // 65% of total fleet power - lowered from 80%
    resourceDominanceThreshold: 10000 // 10K resource value - lowered from 15K
  };

  /**
   * Combat damage calculations with critical strikes
   */
  static calculateCombatDamage(
    attackerType: ShipType,
    defenderType: ShipType,
    attackerHealth: number,
    defenderDefense: number,
    turnNumber: number = 0,
    isMomentumHit: boolean = false,
    distance: number = 1
  ): { damage: number; isCritical: boolean } {
    const attackerStrength = this.SHIP_BALANCE[attackerType].strength;
    const defenderStrength = this.SHIP_BALANCE[defenderType].strength;
    const healthMultiplier = attackerHealth / 100;

    // Distance penalty logic
    // Damage drops off by 20% for each tile beyond range 1
    // Range 1: 100% damage
    // Range 2: 80% damage
    // Range 3: 60% damage
    const distancePenalty = Math.max(0, (distance - 1) * 0.2);
    const distanceMultiplier = Math.max(0.1, 1.0 - distancePenalty);

    let baseDamage = attackerStrength * 40 * healthMultiplier * distanceMultiplier;
    const defenseReduction = defenderDefense * (defenderStrength / 10);
    let effectiveDamage = Math.max(5, baseDamage - defenseReduction);

    // Momentum bonus: consecutive attacks deal 25% more damage
    if (isMomentumHit) {
      effectiveDamage *= 1.25;
    }

    const variance = 0.85 + (Math.random() * 0.3);
    let finalDamage = effectiveDamage * variance;

    // Sudden death: double damage
    if (turnNumber >= 40) {
      finalDamage *= 2;
    }

    // Critical strike: 15% chance for 2x damage
    const isCritical = Math.random() < 0.15;
    if (isCritical) {
      finalDamage *= 2;
    }

    return { damage: Math.floor(finalDamage), isCritical };
  }

  /**
   * Check if momentum bonus applies
   */
  static checkMomentum(consecutiveAttacks: number): boolean {
    return consecutiveAttacks >= 2;
  }

  /**
   * Calculate comeback bonus for resources when losing
   */
  static calculateComebackBonus(
    myTerritories: number,
    avgTerritories: number,
    myShips: number,
    avgShips: number
  ): number {
    const territoryGap = avgTerritories - myTerritories;
    const shipGap = avgShips - myShips;

    if (territoryGap > 0 || shipGap > 0) {
      return Math.floor((territoryGap * 2 + shipGap * 5));
    }
    return 0;
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