import {
  GameState,
  GameAction,
  ShipType,
  Coordinate,
  Resources,
  TERRITORY_RESOURCE_GENERATION,
} from "../../types/game";
import { GAME_CONFIG } from "../../utils/constants";
import { GameBalance } from "../gameBalance";
import { initializeShipAbility } from "../shipAbilities";
import { coordinateToString, stringToCoordinate, analyzeGameState } from "./utils";

export class ResourceEngine {
  static processResourceCollectionAction(
    gameState: GameState,
    action: GameAction,
  ) {
    const { data, player } = action;
    const { shipId } = data;

    if (!shipId) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Missing ship ID for resource collection",
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
    const coord = stringToCoordinate(shipCoordinate);
    const territory = gameState.gameMap.cells[coord.x]?.[coord.y];

    if (!territory) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "No territory at ship position",
      };
    }

    if (territory.owner !== player) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "You must control this territory to collect resources",
      };
    }

    const baseResources = TERRITORY_RESOURCE_GENERATION[territory.type];
    if (!baseResources || Object.keys(baseResources).length === 0) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "This territory produces no resources",
      };
    }

    const collectionMultiplier = this.getResourceCollectionMultiplier(
      ship.type,
    );
    const collectedResources: Partial<Resources> = {};

    Object.entries(baseResources).forEach(([resource, amount]) => {
      if (amount !== undefined) {
        collectedResources[resource as keyof Resources] = Math.floor(
          amount * collectionMultiplier,
        );
      }
    });

    const gameAnalysis = analyzeGameState(gameState, currentPlayer);
    const comebackBonus = GameBalance.calculateComebackBonus(
      gameAnalysis.territoriesControlled,
      gameAnalysis.averageTerritoriesPerPlayer,
      gameAnalysis.totalShips,
      gameAnalysis.averageShipsPerPlayer,
    );

    if (comebackBonus > 0) {
      collectedResources.gold = (collectedResources.gold || 0) + comebackBonus;
    }

    const updatedPlayers = [...gameState.players];
    updatedPlayers[playerIndex] = {
      ...currentPlayer,
      publicKey: currentPlayer.publicKey,
      ships: currentPlayer.ships,
      resources: {
        gold: currentPlayer.resources.gold + (collectedResources.gold || 0),
        crew: currentPlayer.resources.crew + (collectedResources.crew || 0),
        cannons:
          currentPlayer.resources.cannons + (collectedResources.cannons || 0),
        supplies:
          currentPlayer.resources.supplies + (collectedResources.supplies || 0),
        wood: currentPlayer.resources.wood + (collectedResources.wood || 0),
        rum: currentPlayer.resources.rum + (collectedResources.rum || 0),
      },
    };

    const resourcesList = Object.entries(collectedResources)
      .filter(([_, amount]) => amount && amount > 0)
      .map(([resource, amount]) => `${amount} ${resource}`)
      .join(", ");

    const comebackMessage =
      comebackBonus > 0 ? ` (+${comebackBonus} comeback bonus)` : "";

    return {
      updatedGameState: { ...gameState, players: updatedPlayers },
      success: true,
      message: `Collected: ${resourcesList}${comebackMessage}`,
    };
  }

  static processShipBuildAction(gameState: GameState, action: GameAction) {
    const { data, player } = action;
    const { shipType, toCoordinate } = data;

    if (!shipType || !toCoordinate) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Missing ship type or build location",
      };
    }

    const playerIndex = gameState.players.findIndex(
      (p) => p.publicKey === player,
    );
    const currentPlayer = gameState.players[playerIndex];

    if (!currentPlayer) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Player not found",
      };
    }

    const activeShips = currentPlayer.ships.filter((ship) => ship.health > 0);
    if (activeShips.length >= GAME_CONFIG.MAX_SHIPS_PER_PLAYER) {
      return {
        updatedGameState: gameState,
        success: false,
        message: `Maximum fleet size reached (${GAME_CONFIG.MAX_SHIPS_PER_PLAYER} ships)`,
      };
    }

    const costs = this.getShipBuildingCosts(shipType as ShipType);

    const canAfford = Object.entries(costs).every(
      ([resource, cost]) =>
        currentPlayer.resources[resource as keyof Resources] >= cost,
    );

    if (!canAfford) {
      const costList = Object.entries(costs)
        .map(([resource, cost]) => `${cost} ${resource}`)
        .join(", ");
      return {
        updatedGameState: gameState,
        success: false,
        message: `Insufficient resources. Need: ${costList}`,
      };
    }

    const buildCoord = stringToCoordinate(toCoordinate);
    const territory = gameState.gameMap.cells[buildCoord.x]?.[buildCoord.y];

    if (!territory || territory.type !== "water") {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Ships can only be built in water",
      };
    }

    const hasAdjacentPort = this.hasAdjacentControlledPort(
      buildCoord,
      gameState,
      player,
    );
    if (!hasAdjacentPort) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Must build ships adjacent to a controlled port",
      };
    }

    const occupiedByShip = gameState.players.some((p) =>
      p.ships.some(
        (ship) =>
          ship.health > 0 &&
          coordinateToString(ship.position) === toCoordinate,
      ),
    );

    if (occupiedByShip) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Position occupied by another ship",
      };
    }

    const newShip = {
      id: `${player}_${shipType}_${Date.now()}`,
      type: shipType as ShipType,
      health: 100,
      maxHealth: 100,
      attack: 25,
      defense: 10,
      speed: 2,
      position: buildCoord,
      resources: { gold: 0, crew: 0, cannons: 0, supplies: 0, wood: 0, rum: 0 },
      ability: initializeShipAbility(shipType as ShipType),
      activeEffects: [],
    };

    const updatedPlayers = [...gameState.players];
    updatedPlayers[playerIndex] = {
      ...currentPlayer,
      publicKey: currentPlayer.publicKey,
      resources: {
        gold: currentPlayer.resources.gold - costs.gold,
        crew: currentPlayer.resources.crew - costs.crew,
        cannons: currentPlayer.resources.cannons - costs.cannons,
        supplies: currentPlayer.resources.supplies - costs.supplies,
        wood: currentPlayer.resources.wood - (costs.wood || 0),
        rum: currentPlayer.resources.rum - (costs.rum || 0),
      },
      ships: [...currentPlayer.ships, newShip],
    };

    return {
      updatedGameState: { ...gameState, players: updatedPlayers },
      success: true,
      message: `${shipType.toUpperCase()} built successfully!`,
    };
  }

  static getShipBuildingCosts(shipType: ShipType): Resources {
    return GameBalance.getShipBuildingCosts(shipType);
  }

  static getResourceCollectionMultiplier(shipType: ShipType): number {
    return GameBalance.getResourceCollectionMultiplier(shipType);
  }

  static hasAdjacentControlledPort(
    position: Coordinate,
    gameState: GameState,
    player: string,
  ): boolean {
    const adjacentOffsets = [
      { x: -1, y: -1 },
      { x: 0, y: -1 },
      { x: 1, y: -1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ];

    return adjacentOffsets.some((offset) => {
      const checkPos = { x: position.x + offset.x, y: position.y + offset.y };
      const territory = gameState.gameMap.cells[checkPos.x]?.[checkPos.y];

      return (
        territory && territory.type === "port" && territory.owner === player
      );
    });
  }
}
