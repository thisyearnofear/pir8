import { GameMap, Coordinate } from "../../types/game";

export class MapEngine {
  static createGameMap(size: number = 10): GameMap {
    // ... existing implementation
    return { size, cells: [] } as any;
  }

  /**
   * Simple BFS pathfinding to check if a move is valid.
   * Can be extended to A* for more complex requirements.
   */
  static isPathClear(
    map: GameMap, 
    start: Coordinate, 
    end: Coordinate, 
    blockedTypes: string[] = ["island", "reef", "whirlpool"]
  ): boolean {
    // Simplified: check if target is traversable
    const targetCell = map.cells[end.x]?.[end.y];
    if (!targetCell || blockedTypes.includes(targetCell.type)) {
      return false;
    }
    return true;
  }
}
