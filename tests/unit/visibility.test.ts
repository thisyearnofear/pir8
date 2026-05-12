import { buildVisibilityProjection } from "@/lib/visibility";
import { GameMap, Ship, ShipType } from "@/types/game";

function createMap(size = 5): GameMap {
  return {
    size,
    cells: Array.from({ length: size }, (_, x) =>
      Array.from({ length: size }, (_, y) => ({
        coordinate: `${x},${y}`,
        type: "water" as const,
        owner: null,
        resources: {},
        isContested: false,
      })),
    ),
  };
}

function createShip(id: string, type: ShipType, x: number, y: number): Ship {
  return {
    id,
    type,
    health: 100,
    maxHealth: 100,
    attack: 20,
    defense: 10,
    speed: 2,
    position: { x, y },
    resources: {
      gold: 0,
      crew: 0,
      cannons: 0,
      supplies: 0,
      wood: 0,
      rum: 0,
    },
    ability: {
      name: "Test",
      description: "Test ability",
      cooldown: 0,
      currentCooldown: 0,
      isReady: true,
      type: "utility",
    },
    activeEffects: [],
  };
}

describe("buildVisibilityProjection", () => {
  it("hides enemy ships outside player visibility", () => {
    const projection = buildVisibilityProjection({
      gameMap: createMap(),
      ships: [
        createShip("PLAYER_sloop_1", "sloop", 0, 0),
        createShip("ENEMY_sloop_1", "sloop", 4, 4),
      ],
      currentPlayerPK: "PLAYER",
      scannedCoordinates: [],
      visionRange: 1,
    });

    expect(projection.visibleShips.map((ship) => ship.id)).toEqual([
      "PLAYER_sloop_1",
    ]);
    expect(projection.hiddenEnemyShipCount).toBe(1);
    expect(projection.getCoordinateIntel("4,4")).toBe("hidden");
  });

  it("reveals enemy ships inside scanned coordinates", () => {
    const projection = buildVisibilityProjection({
      gameMap: createMap(),
      ships: [
        createShip("PLAYER_sloop_1", "sloop", 0, 0),
        createShip("ENEMY_sloop_1", "sloop", 4, 4),
      ],
      currentPlayerPK: "PLAYER",
      scannedCoordinates: ["4,4"],
      visionRange: 1,
    });

    expect(projection.visibleShips.map((ship) => ship.id)).toContain(
      "ENEMY_sloop_1",
    );
    expect(projection.hiddenEnemyShipCount).toBe(0);
    expect(projection.getCoordinateIntel("4,4")).toBe("current");
  });

  it("keeps stale intel separate from live visibility", () => {
    const projection = buildVisibilityProjection({
      gameMap: createMap(),
      ships: [
        createShip("PLAYER_sloop_1", "sloop", 0, 0),
        createShip("ENEMY_sloop_1", "sloop", 4, 4),
      ],
      currentPlayerPK: "PLAYER",
      revealedCoordinates: ["3,3"],
      visionRange: 1,
    });

    expect(projection.getCoordinateIntel("3,3")).toBe("stale");
    expect(projection.getCoordinateIntel("4,4")).toBe("hidden");
    expect(projection.visibleShips.map((ship) => ship.id)).not.toContain(
      "ENEMY_sloop_1",
    );
  });

  it("allows omniscient spectator projections explicitly", () => {
    const projection = buildVisibilityProjection({
      gameMap: createMap(),
      ships: [
        createShip("PLAYER_sloop_1", "sloop", 0, 0),
        createShip("ENEMY_sloop_1", "sloop", 4, 4),
      ],
      spectatorMode: "omniscient",
    });

    expect(projection.visibleShips).toHaveLength(2);
    expect(projection.getCoordinateIntel("4,4")).toBe("current");
  });
});
