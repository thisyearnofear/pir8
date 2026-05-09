import {
  GameMap,
  Resources,
  TERRITORY_RESOURCE_GENERATION,
  TerritoryCellType,
  TerritoryCell,
} from "../../types/game";
import { coordinateToString, calculateDistance } from "./utils";

export class MapEngine {
  static createGameMap(size: number = 10): GameMap {
    const cells: TerritoryCell[][] = Array(size)
      .fill(null)
      .map(() => []);

    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        cells[x]![y] = {
          coordinate: coordinateToString({ x, y }),
          type: "water",
          owner: null,
          resources: {},
          isContested: false,
        };
      }
    }

    const numIslands = Math.floor(size / 3) + 1;
    const islandCenters: { x: number; y: number }[] = [];

    const findValidSeed = (minDist: number): { x: number; y: number } | null => {
      let attempts = 0;
      while (attempts < 20) {
        const x = Math.floor(Math.random() * (size - 4)) + 2;
        const y = Math.floor(Math.random() * (size - 4)) + 2;

        let valid = true;
        for (const center of islandCenters) {
          if (calculateDistance({ x, y }, center) < minDist) {
            valid = false;
            break;
          }
        }
        if (valid) return { x, y };
        attempts++;
      }
      return null;
    };

    for (let i = 0; i < numIslands; i++) {
      const seed = findValidSeed(3);
      if (seed) islandCenters.push(seed);
    }

    for (const center of islandCenters) {
      cells[center.x]![center.y]!.type = "island";

      const neighbors = [
        { x: center.x + 1, y: center.y },
        { x: center.x - 1, y: center.y },
        { x: center.x, y: center.y + 1 },
        { x: center.x, y: center.y - 1 },
        { x: center.x + 1, y: center.y + 1 },
        { x: center.x - 1, y: center.y - 1 },
        { x: center.x + 1, y: center.y - 1 },
        { x: center.x - 1, y: center.y + 1 },
      ];

      for (const n of neighbors) {
        if (n.x >= 0 && n.x < size && n.y >= 0 && n.y < size) {
          const rand = Math.random();
          if (rand < 0.4) {
            cells[n.x]![n.y]!.type = "island";
          } else if (rand < 0.7) {
            cells[n.x]![n.y]!.type = "port";
          }
        }
      }
    }

    let treasuresPlaced = 0;
    let attempts = 0;
    while (treasuresPlaced < 3 && attempts < 50) {
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);

      if (cells[x]![y]!.type === "water") {
        let minDistanceToLand = 999;
        for (const center of islandCenters) {
          const d = calculateDistance({ x, y }, center);
          if (d < minDistanceToLand) minDistanceToLand = d;
        }

        if (minDistanceToLand > 2.5) {
          cells[x]![y]!.type = "treasure";
          treasuresPlaced++;
        }
      }
      attempts++;
    }

    const hazardCount = Math.floor(size * size * 0.15);
    for (let i = 0; i < hazardCount; i++) {
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);

      if (cells[x]![y]!.type === "water") {
        const rand = Math.random();
        if (rand < 0.4) cells[x]![y]!.type = "storm";
        else if (rand < 0.7) cells[x]![y]!.type = "reef";
        else cells[x]![y]!.type = "whirlpool";
      }
    }

    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const cell = cells[x]![y]!;
        cell.resources = TERRITORY_RESOURCE_GENERATION[cell.type] || {};
      }
    }

    return { cells, size };
  }

  static checkLocationEvent(territoryType: TerritoryCellType): {
    message: string;
    resourceChange?: Partial<Resources>;
    healthChange?: number;
  } | null {
    const rand = Math.random();

    if (territoryType === "water" && rand < 0.05) {
      return {
        message: "📦 Found floating supply crate! (+10 Supplies)",
        resourceChange: { supplies: 10 },
      };
    }

    if (territoryType === "island" && rand < 0.25) {
      if (rand < 0.1) {
        return {
          message: "🗿 Natives offered tribute! (+50 Gold)",
          resourceChange: { gold: 50 },
        };
      } else {
        return {
          message: "🌴 Explored jungle ruins! (+15 Supplies)",
          resourceChange: { supplies: 15 },
        };
      }
    }

    if (territoryType === "port" && rand < 0.15) {
      return {
        message: "🍻 Local sailors joined your crew! (+5 Crew)",
        resourceChange: { crew: 5 },
      };
    }

    if (territoryType === "treasure" && rand < 0.4) {
      return {
        message: "💎 Discovered hidden loot! (+100 Gold)",
        resourceChange: { gold: 100 },
      };
    }

    if (territoryType === "storm") {
      if (rand < 0.6) {
        return {
          message: "⚡ Storm battered the hull! (-15 HP)",
          healthChange: -15,
        };
      } else {
        return {
          message: "💨 Strong winds damaged rigging! (-10 Supplies)",
          resourceChange: { supplies: -10 },
        };
      }
    }

    if (territoryType === "reef") {
      if (rand < 0.5) {
        return {
          message: "🪨 Scraped hull on hidden reef! (-20 HP)",
          healthChange: -20,
        };
      }
    }

    if (territoryType === "whirlpool") {
      if (rand < 0.8) {
        return {
          message: "🌀 Caught in maelstrom! (-30 HP)",
          healthChange: -30,
        };
      }
    }

    return null;
  }
}
