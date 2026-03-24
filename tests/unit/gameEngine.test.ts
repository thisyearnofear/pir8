/**
 * Game Engine Tests
 *
 * Tests for packages/core/src/lib/pirateGameEngine.ts
 * Covers coordinate utilities, map generation, and core game mechanics
 */

import { PirateGameManager } from "@pir8/core/lib/pirateGameEngine";
import { GAME_CONFIG } from "@pir8/core/utils/constants";

// -- Coordinate Utility Tests --

describe("PirateGameManager.coordinateToString", () => {
  it("should convert coordinate to string", () => {
    expect(PirateGameManager.coordinateToString({ x: 3, y: 5 })).toBe("3,5");
    expect(PirateGameManager.coordinateToString({ x: 0, y: 0 })).toBe("0,0");
  });
});

describe("PirateGameManager.stringToCoordinate", () => {
  it("should parse valid coordinate string", () => {
    const coord = PirateGameManager.stringToCoordinate("3,5");
    expect(coord.x).toBe(3);
    expect(coord.y).toBe(5);
  });

  it("should parse zero coordinates", () => {
    const coord = PirateGameManager.stringToCoordinate("0,0");
    expect(coord.x).toBe(0);
    expect(coord.y).toBe(0);
  });

  it("should throw on invalid format", () => {
    expect(() => PirateGameManager.stringToCoordinate("invalid")).toThrow(
      "Invalid coordinate format",
    );
    expect(() => PirateGameManager.stringToCoordinate("3")).toThrow(
      "Invalid coordinate format",
    );
    expect(() => PirateGameManager.stringToCoordinate("a,b")).toThrow(
      "Invalid coordinate format",
    );
  });

  it("should roundtrip coordinate conversion", () => {
    const original = { x: 7, y: 3 };
    const str = PirateGameManager.coordinateToString(original);
    const parsed = PirateGameManager.stringToCoordinate(str);
    expect(parsed.x).toBe(original.x);
    expect(parsed.y).toBe(original.y);
  });
});

describe("PirateGameManager.calculateDistance", () => {
  it("should return 0 for same coordinates", () => {
    expect(
      PirateGameManager.calculateDistance({ x: 3, y: 3 }, { x: 3, y: 3 }),
    ).toBe(0);
  });

  it("should calculate horizontal distance", () => {
    expect(
      PirateGameManager.calculateDistance({ x: 0, y: 0 }, { x: 3, y: 0 }),
    ).toBe(3);
  });

  it("should calculate vertical distance", () => {
    expect(
      PirateGameManager.calculateDistance({ x: 0, y: 0 }, { x: 0, y: 4 }),
    ).toBe(4);
  });

  it("should calculate diagonal distance", () => {
    // Distance from (0,0) to (3,4) = sqrt(9+16) = 5
    expect(
      PirateGameManager.calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 }),
    ).toBe(5);
  });

  it("should be symmetric", () => {
    const a = { x: 1, y: 2 };
    const b = { x: 4, y: 6 };
    expect(PirateGameManager.calculateDistance(a, b)).toBe(
      PirateGameManager.calculateDistance(b, a),
    );
  });
});

// -- Map Generation Tests --

describe("PirateGameManager.createGameMap", () => {
  it("should create map with correct size", () => {
    const map = PirateGameManager.createGameMap(10);
    expect(map.size).toBe(10);
    expect(map.cells.length).toBe(10);
    expect(map.cells[0]!.length).toBe(10);
  });

  it("should create map with default size from config", () => {
    const map = PirateGameManager.createGameMap();
    expect(map.size).toBe(GAME_CONFIG.MAP_SIZE);
  });

  it("should assign coordinates to all cells", () => {
    const map = PirateGameManager.createGameMap(5);
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        expect(map.cells[x]![y]!.coordinate).toBe(`${x},${y}`);
      }
    }
  });

  it("should have no owners initially", () => {
    const map = PirateGameManager.createGameMap(5);
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        expect(map.cells[x]![y]!.owner).toBeNull();
      }
    }
  });

  it("should contain water cells", () => {
    const map = PirateGameManager.createGameMap(10);
    const waterCells = map.cells.flat().filter((c) => c.type === "water");
    expect(waterCells.length).toBeGreaterThan(0);
  });
});

// -- Starting Resources Tests --

describe("PirateGameManager.generateStartingResources", () => {
  it("should generate all resource types", () => {
    const resources = PirateGameManager.generateStartingResources();
    expect(resources.gold).toBeGreaterThanOrEqual(0);
    expect(resources.crew).toBeGreaterThanOrEqual(0);
    expect(resources.cannons).toBeGreaterThanOrEqual(0);
    expect(resources.supplies).toBeGreaterThanOrEqual(0);
    expect(resources.wood).toBeGreaterThanOrEqual(0);
    expect(resources.rum).toBeGreaterThanOrEqual(0);
  });

  it("should generate positive starting gold", () => {
    const resources = PirateGameManager.generateStartingResources();
    expect(resources.gold).toBeGreaterThan(0);
  });
});
