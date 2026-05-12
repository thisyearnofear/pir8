import {
  Player,
  GameState,
  GameMap,
  Ship,
  ShipType,
  Coordinate,
  GameAction,
  Resources,
  GameEvent,
  WeatherEffect,
  TerritoryCellType,
} from "../types/game";
import { GAME_CONFIG } from "../utils/constants";
import {
  initializeShipAbility,
  tickAbilityCooldown,
  tickShipEffects,
} from "./shipAbilities";
import { coordinateToString, stringToCoordinate, calculateDistance } from "./engine/utils";
import { MapEngine } from "./engine/map";
import { WeatherEngine } from "./engine/weather";
import { CombatEngine } from "./engine/combat";
import { ResourceEngine } from "./engine/resources";
import { VictoryEngine } from "./engine/victory";
import { AIEngine, type AIOption, type AIReasoning, type AIDecision } from "./engine/ai";

export type { AIOption, AIReasoning, AIDecision };

/**
 * High-level game engine that manages game flow and player actions
 */
export class PirateGameManager {
  // ===== UTILITY FUNCTIONS =====

  static coordinateToString(coordinate: Coordinate): string {
    return coordinateToString(coordinate);
  }

  static stringToCoordinate(coordinateStr: string): Coordinate {
    return stringToCoordinate(coordinateStr);
  }

  static calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
    return calculateDistance(coord1, coord2);
  }

  static generateStartingResources(): Resources {
    return {
      gold: 1000,
      crew: 50,
      cannons: 10,
      supplies: 100,
      wood: 0,
      rum: 0,
    };
  }

  static createGameMap(size: number = 10): GameMap {
    return MapEngine.createGameMap(size);
  }

  static checkLocationEvent(_territoryType: TerritoryCellType): {
    message: string;
    resourceChange?: Partial<Resources>;
    healthChange?: number;
  } | null {
    // Logic currently in PirateGameEngine
    return null; 
  }

  static createStartingFleet(
    playerId: string,
    startingPosition: Coordinate,
  ): Ship[] {
    return [
      {
        id: `${playerId}_sloop_1`,
        type: "sloop",
        health: 100,
        maxHealth: 100,
        attack: 25,
        defense: 10,
        speed: 3,
        position: startingPosition,
        resources: {
          gold: 0,
          crew: 0,
          cannons: 0,
          supplies: 0,
          wood: 0,
          rum: 0,
        },
        ability: initializeShipAbility("sloop"),
        activeEffects: [],
      },
      {
        id: `${playerId}_frigate_1`,
        type: "frigate",
        health: 200,
        maxHealth: 200,
        attack: 40,
        defense: 25,
        speed: 2,
        position: { x: startingPosition.x + 1, y: startingPosition.y },
        resources: {
          gold: 0,
          crew: 0,
          cannons: 0,
          supplies: 0,
          wood: 0,
          rum: 0,
        },
        ability: initializeShipAbility("frigate"),
        activeEffects: [],
      },
    ];
  }

  static createNewGame(players: Player[], gameId: string): GameState {
    const gameMap = MapEngine.createGameMap(GAME_CONFIG.MAP_SIZE);

    const startingPositions = this.generateStartingPositions(
      players.length,
      gameMap.size,
    );

    const initializedPlayers = players.map((player, index) => ({
      ...player,
      resources: this.generateStartingResources(),
      ships: this.createStartingFleet(
        player.publicKey,
        startingPositions[index]?.[0] || { x: 0, y: 0 },
      ),
      controlledTerritories: player.controlledTerritories || [],
      totalScore: player.totalScore || 0,
      isActive: true,
      consecutiveAttacks: player.consecutiveAttacks || 0,
      lastActionWasAttack: player.lastActionWasAttack || false,
      scannedCoordinates: player.scannedCoordinates || [],
      scanCharges: player.scanCharges || 3,
      speedBonusAccumulated: player.speedBonusAccumulated || 0,
      averageDecisionTimeMs: player.averageDecisionTimeMs || 0,
      totalMoves: player.totalMoves || 0,
    }));

    return {
      gameId,
      gameMode: "Casual",
      players: initializedPlayers,
      currentPlayerIndex: 0,
      gameMap,
      gameStatus: "waiting",
      currentPhase: "deployment",
      turnNumber: 1,
      turnTimeRemaining: GAME_CONFIG.TURN_TIMEOUT,
      pendingActions: [],
      eventLog: [],
      globalWeather: this.generateRandomWeather(),
    };
  }

  static generateStartingPositions(
    playerCount: number,
    mapSize: number,
  ): Coordinate[][] {
    const positions: Coordinate[][] = [];
    const corners = [
      [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
      [
        { x: mapSize - 2, y: 1 },
        { x: mapSize - 1, y: 1 },
      ],
      [
        { x: 1, y: mapSize - 2 },
        { x: 1, y: mapSize - 1 },
      ],
      [
        { x: mapSize - 2, y: mapSize - 1 },
        { x: mapSize - 1, y: mapSize - 2 },
      ],
    ];

    for (let i = 0; i < playerCount && i < corners.length; i++) {
      if (corners[i]) {
        positions.push(corners[i]!);
      }
    }

    return positions;
  }

  static processTurnAction(
    gameState: GameState,
    action: GameAction,
    randomFn: () => number = Math.random,
  ): {
    updatedGameState: GameState;
    success: boolean;
    message: string;
  } {
    const { type, player } = action;
    const currentPlayer = gameState.players.find((p) => p.publicKey === player);

    if (!currentPlayer) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Player not found",
      };
    }

    switch (type) {
      case "move_ship":
        return this.processShipMovementAction(gameState, action);
      case "attack":
        return CombatEngine.processAttackAction(gameState, action, randomFn);
      case "claim_territory":
        return this.processTerritoryClaimAction(gameState, action);
      case "collect_resources":
        return ResourceEngine.processResourceCollectionAction(gameState, action);
      case "build_ship":
        return ResourceEngine.processShipBuildAction(gameState, action);
      default:
        return {
          updatedGameState: gameState,
          success: false,
          message: "Unknown action type",
        };
    }
  }

  static processShipMovementAction(
    gameState: GameState,
    action: GameAction,
  ): { updatedGameState: GameState; success: boolean; message: string } {
    const { data, player } = action;
    const { shipId, toCoordinate } = data;

    if (!shipId || !toCoordinate) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Missing ship ID or destination",
      };
    }

    const playerIndex = gameState.players.findIndex(
      (p) => p.publicKey === player,
    );
    if (playerIndex === -1) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Player not found",
      };
    }
    const currentPlayer = gameState.players[playerIndex];
    if (!currentPlayer) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Current player not found",
      };
    }
    const ship = currentPlayer.ships.find((s) => s.id === shipId);

    if (!ship) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Ship not found",
      };
    }

    const toPosition = stringToCoordinate(toCoordinate);

    // Validate path
    if (!MapEngine.isPathClear(gameState.gameMap, ship.position, toPosition)) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Path is blocked",
      };
    }

    // Apply weather modifier to movement
    const baseSpeed = ship.speed;
    const _modifiedSpeed = WeatherEngine.applyWeatherModifiers(
      baseSpeed,
      "movement",
      gameState.globalWeather || ({ type: 'clear', effect: {}, duration: 0 } as any)
    );

    const moveResult = {
      success: true,
      updatedShip: { ...ship, position: { x: toPosition.x, y: toPosition.y } },
      message: "Movement processed",
    };

    if (!moveResult.success) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Movement failed",
      };
    }

    const updatedPlayers = [...gameState.players];
    if (!currentPlayer) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Current player not found",
      };
    }

    let eventMessage = "";
    let healthChange = 0;
    let resourceChange: Partial<Resources> = {};

    const territory = gameState.gameMap.cells[toPosition.x]?.[toPosition.y];
    if (territory) {
      const event = this.checkLocationEvent(territory.type);
      if (event) {
        eventMessage = ` ${event.message}`;
        healthChange = event.healthChange || 0;
        resourceChange = event.resourceChange || {};
      }
    }

    const updatedShips = currentPlayer.ships.map((s) => {
      if (s.id === shipId) {
        const newHealth = Math.max(0, s.health + healthChange);
        return {
          ...moveResult.updatedShip!,
          previousPosition: { ...s.position },
          position: { ...moveResult.updatedShip!.position },
          health: newHealth,
        };
      }
      return {
        ...s,
        previousPosition: s.previousPosition
          ? { ...s.previousPosition }
          : undefined,
        position: { ...s.position },
      };
    });

    const updatedResources = { ...currentPlayer.resources };
    if (resourceChange) {
      for (const [key, val] of Object.entries(resourceChange)) {
        // @ts-ignore
        updatedResources[key] = (updatedResources[key] || 0) + val;
      }
    }

    updatedPlayers[playerIndex] = {
      ...currentPlayer,
      ships: updatedShips,
      resources: updatedResources,
      publicKey: currentPlayer.publicKey,
      consecutiveAttacks: 0,
      lastActionWasAttack: false,
    };

    const moveEvent: GameEvent = {
      id: `event_${Date.now()}`,
      type: "ship_moved",
      playerId: player,
      turnNumber: gameState.turnNumber,
      timestamp: Date.now(),
      description: `${moveResult.updatedShip!.type} moved to ${toCoordinate}.${eventMessage}`,
      data: {
        shipId,
        from: coordinateToString(ship.position),
        to: toCoordinate,
      },
    };

    const updatedGameState = {
      ...gameState,
      players: updatedPlayers,
      eventLog: [...gameState.eventLog, moveEvent].slice(-10),
    };

    return {
      updatedGameState,
      success: true,
      message: moveResult.message + eventMessage,
    };
  }

  static advanceTurn(gameState: GameState): GameState {
    const MAX_SCAN_CHARGES = 5;

    const updatedPlayers = gameState.players.map((player) => ({
      ...player,
      scanCharges: Math.min((player.scanCharges || 0) + 1, MAX_SCAN_CHARGES),
      consecutiveAttacks: 0,
      lastActionWasAttack: false,
      ships: player.ships.map((ship) => {
        let updated = tickAbilityCooldown(ship);
        updated = tickShipEffects(updated);
        return updated;
      }),
    }));

    let nextPlayerIndex =
      (gameState.currentPlayerIndex + 1) % updatedPlayers.length;
    let turnNumber = gameState.turnNumber;
    let updatedWeather = gameState.globalWeather;

    if (nextPlayerIndex === 0) {
      turnNumber++;

      if (updatedWeather && updatedWeather.duration > 0) {
        updatedWeather = {
          ...updatedWeather,
          duration: updatedWeather.duration - 1,
        };

        if (updatedWeather.duration === 0 || Math.random() < 0.15) {
          updatedWeather = this.generateRandomWeather();
        }
      } else {
        updatedWeather = this.generateRandomWeather();
      }
    }

    let nextPlayer = gameState.players[nextPlayerIndex];
    while (nextPlayer && nextPlayer.ships.every((ship) => ship.health === 0)) {
      nextPlayerIndex = (nextPlayerIndex + 1) % gameState.players.length;
      nextPlayer = gameState.players[nextPlayerIndex];
      if (nextPlayerIndex === gameState.currentPlayerIndex) {
        break;
      }
    }

    return {
      ...gameState,
      players: updatedPlayers,
      currentPlayerIndex: nextPlayerIndex,
      turnNumber,
      turnTimeRemaining: GAME_CONFIG.TURN_TIMEOUT,
      globalWeather: updatedWeather,
    };
  }

  static generateRandomWeather(): WeatherEffect {
    const weatherTypes = [
      {
        type: "calm" as const,
        duration: 2,
        effect: { resourceModifier: 1.2, movementModifier: 1.0 },
      },
      {
        type: "trade_winds" as const,
        duration: 3,
        effect: { movementModifier: 1.5, resourceModifier: 1.1 },
      },
      {
        type: "storm" as const,
        duration: 2,
        effect: {
          movementModifier: 0.5,
          damageModifier: 1.3,
          resourceModifier: 0.8,
        },
      },
      {
        type: "fog" as const,
        duration: 3,
        effect: {
          visibilityReduced: true,
          movementModifier: 0.7,
          damageModifier: 0.8,
        },
      },
    ];

    const randomIndex = Math.floor(Math.random() * weatherTypes.length);
    return (
      weatherTypes[randomIndex] || {
        type: "calm",
        duration: 2,
        effect: { resourceModifier: 1.2, movementModifier: 1.0 },
      }
    );
  }

  static processTerritoryClaimAction(gameState: GameState, action: GameAction) {
    const { data, player } = action;
    const { shipId, toCoordinate } = data;

    if (!shipId || !toCoordinate) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Missing ship ID or coordinate for claiming",
      };
    }

    const playerIndex = gameState.players.findIndex(
      (p) => p.publicKey === player,
    );
    if (playerIndex === -1) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Player not found",
      };
    }
    const currentPlayer = gameState.players[playerIndex];
    if (!currentPlayer) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Current player not found",
      };
    }
    const ship = currentPlayer.ships.find((s) => s.id === shipId);

    if (!ship) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Ship not found",
      };
    }

    const shipCoordinate = coordinateToString(ship.position);
    if (shipCoordinate !== toCoordinate) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Ship must be at territory to claim it",
      };
    }

    const coord = stringToCoordinate(toCoordinate);
    const territory = gameState.gameMap.cells[coord.x]?.[coord.y];

    if (!territory) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Territory not found",
      };
    }

    if (territory.owner === player) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Territory already owned by you",
      };
    }

    const updatedCells = gameState.gameMap.cells.map((row, x) =>
      row.map((cell, y) => {
        if (x === coord.x && y === coord.y) {
          return { ...cell, owner: player };
        }
        return cell;
      }),
    );

    const claimResult = {
      success: true,
      message: `Territory ${toCoordinate} claimed!`,
      updatedMap: { ...gameState.gameMap, cells: updatedCells },
    };

    if (!claimResult.success) {
      return {
        updatedGameState: gameState,
        success: false,
        message: (claimResult as any).message || "Claim failed",
      };
    }

    const updatedPlayers = [...gameState.players];
    const targetPlayer = updatedPlayers[playerIndex];
    if (!targetPlayer) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Player not found",
      };
    }

    updatedPlayers[playerIndex] = {
      ...targetPlayer,
      publicKey: targetPlayer.publicKey,
      controlledTerritories: [
        ...targetPlayer.controlledTerritories,
        toCoordinate,
      ],
      consecutiveAttacks: 0,
      lastActionWasAttack: false,
    };

    const updatedGameState = {
      ...gameState,
      gameMap: claimResult.updatedMap,
      players: updatedPlayers,
    };

    return {
      updatedGameState,
      success: true,
      message: claimResult.message,
    };
  }

  // ===== DELEGATED METHODS =====

  static checkGameEnd(gameState: GameState): {
    isGameOver: boolean;
    winner: Player | null;
    updatedGameState: GameState;
  } {
    return VictoryEngine.checkGameEnd(gameState);
  }

  static resign(gameState: GameState, player: string): GameState {
    return VictoryEngine.resign(gameState, player);
  }

  static shouldResign(player: Player, gameState: GameState): boolean {
    return VictoryEngine.shouldResign(player, gameState);
  }

  static processResourceCollectionAction(
    gameState: GameState,
    action: GameAction,
  ) {
    return ResourceEngine.processResourceCollectionAction(gameState, action);
  }

  static processShipBuildAction(gameState: GameState, action: GameAction) {
    return ResourceEngine.processShipBuildAction(gameState, action);
  }

  static getShipBuildingCosts(shipType: ShipType): Resources {
    return ResourceEngine.getShipBuildingCosts(shipType);
  }

  static getResourceCollectionMultiplier(shipType: ShipType): number {
    return ResourceEngine.getResourceCollectionMultiplier(shipType);
  }

  static hasAdjacentControlledPort(
    position: Coordinate,
    gameState: GameState,
    player: string,
  ): boolean {
    return ResourceEngine.hasAdjacentControlledPort(position, gameState, player);
  }

  static processAttackAction(gameState: GameState, action: GameAction) {
    return CombatEngine.processAttackAction(gameState, action);
  }

  // ===== AI METHODS =====

  static createAIPlayer(
    _gameId: string,
    difficulty: "novice" | "pirate" | "captain" | "admiral" = "pirate",
  ): Player {
    return AIEngine.createAIPlayer(_gameId, difficulty);
  }

  static generateAIMove(
    gameState: GameState,
    aiPlayer: Player,
    randomFn: () => number = Math.random,
  ): GameAction | null {
    return AIEngine.generateAIMove(gameState, aiPlayer, randomFn);
  }

  static generateAIDecision(
    gameState: GameState,
    aiPlayer: Player,
    randomFn: () => number = Math.random,
  ): AIDecision {
    return AIEngine.generateAIDecision(gameState, aiPlayer, randomFn);
  }

  // ===== PRACTICE MODE =====

  static createPracticeGame(
    humanPlayer: Player,
    aiDifficulty: "novice" | "pirate" | "captain" | "admiral" = "pirate",
  ): GameState {
    const aiPlayer = AIEngine.createAIPlayer("practice", aiDifficulty);
    const gameState = this.createNewGame(
      [humanPlayer, aiPlayer],
      `practice_${Date.now()}`,
    );

    return {
      ...gameState,
      gameStatus: "active",
    };
  }

  static processAITurn(gameState: GameState): GameState {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer?.publicKey.startsWith("AI_")) {
      return gameState;
    }

    const debugMode =
      typeof window !== "undefined" && (window as any).PIR8_DEBUG_AI === true;

    const aiAction = AIEngine.generateAIMove(gameState, currentPlayer);

    if (aiAction) {
      const result = this.processTurnAction(gameState, aiAction);
      if (result.success) {
        if (debugMode) {
          console.log(
            `✅ AI action succeeded: ${aiAction.type}`,
            result.message,
          );
        }
        return this.advanceTurn(result.updatedGameState);
      } else {
        if (debugMode) {
          console.warn(`❌ AI action failed: ${aiAction.type}`, result.message);
        }
        return this.advanceTurn(gameState);
      }
    }

    if (debugMode) {
      console.log("⏭️ AI passes turn (no valid actions found)");
    }
    return this.advanceTurn(gameState);
  }
}
