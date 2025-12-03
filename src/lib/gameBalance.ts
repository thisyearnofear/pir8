import { ShipType, TerritoryCellType, Resources } from '../types/game';

/**
 * Game balance configurations and calculations
 */
export class GameBalance {
  
  /**
   * Ship combat balance
   */
  static readonly SHIP_BALANCE = {
    sloop: {
      cost: { gold: 500, crew: 10, cannons: 5, supplies: 20 },
      strength: 1.0,
      speed: 3,
      resourceBonus: 1.0
    },
    frigate: {
      cost: { gold: 1200, crew: 25, cannons: 15, supplies: 40 },
      strength: 2.0,
      speed: 2,
      resourceBonus: 1.2
    },
    galleon: {
      cost: { gold: 2500, crew: 50, cannons: 30, supplies: 80 },
      strength: 3.5,
      speed: 1,
      resourceBonus: 1.5
    },
    flagship: {
      cost: { gold: 5000, crew: 100, cannons: 60, supplies: 150 },
      strength: 5.0,
      speed: 1,
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
    const healthMultiplier = attackerHealth / 100; // Full health = 100% damage
    
    const baseDamage = attackerStrength * 20 * healthMultiplier;
    const effectiveDamage = Math.max(1, baseDamage - defenderDefense);
    
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
      const territory = gameMap.cells[x]?.[y];
      
      if (territory) {
        const generation = this.TERRITORY_GENERATION[territory.type];
        score += generation?.baseGeneration || 0;
      }
    }
    
    return score;
  }

  /**
   * Calculate fleet power
   */
  static calculateFleetPower(ships: any[]): number {
    return ships
      .filter(ship => ship.health > 0)
      .reduce((power, ship) => {
        const shipBalance = this.SHIP_BALANCE[ship.type];
        const healthRatio = ship.health / ship.maxHealth;
        return power + (shipBalance.strength * healthRatio);
      }, 0);
  }

  /**
   * Calculate resource value
   */
  static calculateResourceValue(resources: Resources): number {
    return (
      resources.gold +
      (resources.crew * 5) +
      (resources.cannons * 10) +
      (resources.supplies * 2)
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
        const generation = this.TERRITORY_GENERATION[territory.type];
        
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