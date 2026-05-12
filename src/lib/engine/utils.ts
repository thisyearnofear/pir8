import { Coordinate, Player, GameState } from "../../types/game";

export function coordinateToString(coordinate: Coordinate): string {
  return `${coordinate.x},${coordinate.y}`;
}

export function stringToCoordinate(coordinateStr: string): Coordinate {
  const [xStr, yStr] = coordinateStr.split(",");
  const x = Number(xStr);
  const y = Number(yStr);
  if (isNaN(x) || isNaN(y)) {
    throw new Error('Invalid coordinate format. Expected format: "x,y"');
  }
  return { x, y };
}

export function calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
  return Math.max(
    Math.abs(coord2.x - coord1.x),
    Math.abs(coord2.y - coord1.y),
  );
}

export function analyzeGameState(
  gameState: GameState,
  aiPlayer: Player,
): {
  isWinning: boolean;
  isLosing: boolean;
  territoriesControlled: number;
  averageTerritoriesPerPlayer: number;
  totalShips: number;
  averageShipsPerPlayer: number;
  resourceAdvantage: boolean;
} {
  const activePlayers = gameState.players.filter((p) => p.isActive);
  const totalTerritories = activePlayers.reduce(
    (sum, p) => sum + p.controlledTerritories.length,
    0,
  );
  const totalShips = activePlayers.reduce(
    (sum, p) => sum + p.ships.filter((s) => s.health > 0).length,
    0,
  );

  const myTerritories = aiPlayer.controlledTerritories.length;
  const myShips = aiPlayer.ships.filter((s) => s.health > 0).length;
  const myResources =
    aiPlayer.resources.gold +
    aiPlayer.resources.crew +
    aiPlayer.resources.cannons;

  const avgTerritories = totalTerritories / activePlayers.length;
  const avgShips = totalShips / activePlayers.length;
  const avgResources =
    activePlayers.reduce(
      (sum, p) =>
        sum + p.resources.gold + p.resources.crew + p.resources.cannons,
      0,
    ) / activePlayers.length;

  return {
    isWinning: myTerritories > avgTerritories * 1.3 && myShips >= avgShips,
    isLosing:
      myTerritories < avgTerritories * 0.7 || myShips < avgShips * 0.7,
    territoriesControlled: myTerritories,
    averageTerritoriesPerPlayer: avgTerritories,
    totalShips: myShips,
    averageShipsPerPlayer: avgShips,
    resourceAdvantage: myResources > avgResources * 1.2,
  };
}
