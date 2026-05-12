import { GameMap, Ship, TerritoryCell } from "@/types/game";
import { getVisibleCoordinates } from "@/utils/helpers";
import { PirateGameManager } from "@/lib/pirateGameEngine";

export type IntelState = "current" | "stale" | "hidden";

export interface VisibilityProjection {
  visibleCoordinates: Set<string>;
  staleCoordinates: Set<string>;
  visibleShips: Ship[];
  hiddenEnemyShipCount: number;
  getCoordinateIntel: (coordinate: string) => IntelState;
  getVisibleCell: (coordinate: string) => TerritoryCell | undefined;
}

interface BuildVisibilityProjectionOptions {
  gameMap: GameMap;
  ships: Ship[];
  currentPlayerPK?: string;
  scannedCoordinates?: string[];
  revealedCoordinates?: string[];
  visionRange?: number;
  spectatorMode?: "public" | "omniscient";
}

function isOwnedBy(ship: Ship, playerKey: string): boolean {
  return ship.id.startsWith(playerKey);
}

function getCell(gameMap: GameMap, coordinate: string): TerritoryCell | undefined {
  return gameMap.cells.flat().find((cell) => cell.coordinate === coordinate);
}

function isInBounds(gameMap: GameMap, coordinate: string): boolean {
  const { x, y } = PirateGameManager.stringToCoordinate(coordinate);
  return x >= 0 && y >= 0 && x < gameMap.size && y < gameMap.size;
}

export function buildVisibilityProjection({
  gameMap,
  ships,
  currentPlayerPK,
  scannedCoordinates = [],
  revealedCoordinates = [],
  visionRange = 1,
  spectatorMode = "public",
}: BuildVisibilityProjectionOptions): VisibilityProjection {
  const allCoordinates = gameMap.cells.flat().map((cell) => cell.coordinate);

  if (!currentPlayerPK || spectatorMode === "omniscient") {
    const visibleCoordinates = new Set(allCoordinates);
    return {
      visibleCoordinates,
      staleCoordinates: new Set(),
      visibleShips: ships,
      hiddenEnemyShipCount: 0,
      getCoordinateIntel: () => "current",
      getVisibleCell: (coordinate) => getCell(gameMap, coordinate),
    };
  }

  const visibleCoordinates = new Set<string>();
  const staleCoordinates = new Set<string>();

  for (const coordinate of scannedCoordinates) {
    if (isInBounds(gameMap, coordinate)) visibleCoordinates.add(coordinate);
  }

  for (const coordinate of revealedCoordinates) {
    if (isInBounds(gameMap, coordinate)) staleCoordinates.add(coordinate);
  }

  for (const ship of ships) {
    if (!isOwnedBy(ship, currentPlayerPK)) continue;
    const shipCoordinate = PirateGameManager.coordinateToString(ship.position);
    visibleCoordinates.add(shipCoordinate);
    getVisibleCoordinates(ship.position.x, ship.position.y, visionRange).forEach(
      (coordinate) => {
        if (isInBounds(gameMap, coordinate)) visibleCoordinates.add(coordinate);
      },
    );
  }

  const visibleShips = ships.filter((ship) => {
    if (isOwnedBy(ship, currentPlayerPK)) return true;
    const coordinate = PirateGameManager.coordinateToString(ship.position);
    return visibleCoordinates.has(coordinate);
  });

  const hiddenEnemyShipCount = ships.length - visibleShips.length;

  return {
    visibleCoordinates,
    staleCoordinates,
    visibleShips,
    hiddenEnemyShipCount,
    getCoordinateIntel: (coordinate) => {
      if (visibleCoordinates.has(coordinate)) return "current";
      if (staleCoordinates.has(coordinate)) return "stale";
      return "hidden";
    },
    getVisibleCell: (coordinate) => {
      if (!visibleCoordinates.has(coordinate) && !staleCoordinates.has(coordinate)) {
        return undefined;
      }
      return getCell(gameMap, coordinate);
    },
  };
}
