import { PirateGameManager } from "@pir8/core/lib/pirateGameEngine";
import type { GameMap, GameState, Player, Ship, ShipType } from "@pir8/core/types/game";

function createMap(size = 10): GameMap {
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

function createShip(
  id: string,
  type: ShipType,
  x: number,
  y: number,
): Ship {
  const base = PirateGameManager.createNewGame(
    [PirateGameManager.createAIPlayer("base", "pirate")],
    "base",
  ).players[0]!.ships[0]!;

  return {
    ...base,
    id,
    type,
    position: { x, y },
    health:
      type === "sloop" ? 100 : type === "frigate" ? 200 : type === "galleon" ? 350 : 500,
    maxHealth:
      type === "sloop" ? 100 : type === "frigate" ? 200 : type === "galleon" ? 350 : 500,
    attack:
      type === "sloop" ? 20 : type === "frigate" ? 40 : type === "galleon" ? 60 : 80,
    defense:
      type === "sloop" ? 10 : type === "frigate" ? 25 : type === "galleon" ? 40 : 60,
    speed: type === "sloop" ? 3 : type === "frigate" ? 2 : 1,
  };
}

function createPlayer(
  publicKey: string,
  difficulty: "novice" | "pirate" | "captain" | "admiral",
  ships: Ship[],
): Player {
  const player = PirateGameManager.createAIPlayer("test", difficulty);
  return {
    ...player,
    publicKey: `AI_${publicKey}_${difficulty}_${Date.now()}`,
    ships,
    controlledTerritories: [],
    revealedCoordinates: [],
    scannedCoordinates: [],
  };
}

function createState(players: Player[], gameMap = createMap()): GameState {
  return {
    gameId: "ai_test",
    gameMode: "Casual",
    players,
    currentPlayerIndex: 0,
    gameMap,
    gameStatus: "active",
    currentPhase: "action",
    turnNumber: 10,
    turnTimeRemaining: 30,
    pendingActions: [],
    eventLog: [],
    globalWeather: { type: "calm", duration: 2, effect: { movementModifier: 1 } },
  };
}

describe("AI decision priorities", () => {
  it("chooses attack when a legal attack is available", () => {
    const attacker = createPlayer("attacker", "admiral", [
      createShip("AI_attacker_admiral_ship_1", "frigate", 4, 4),
    ]);
    const defender = createPlayer("defender", "pirate", [
      createShip("AI_defender_pirate_ship_1", "sloop", 5, 4),
    ]);

    const state = createState([attacker, defender]);
    const decision = PirateGameManager.generateAIDecision(state, attacker);

    expect(decision.reasoning.optionsConsidered.some((o) => o.type === "attack")).toBe(true);
    expect(decision.action?.type).toBe("attack");
  });

  it("prioritizes attack at first contact for pirate difficulty", () => {
    const attacker = createPlayer("attacker", "pirate", [
      createShip("AI_attacker_pirate_ship_1", "sloop", 3, 2),
    ]);
    const defender = createPlayer("defender", "pirate", [
      createShip("AI_defender_pirate_ship_1", "sloop", 4, 2),
    ]);

    const state = createState([attacker, defender]);
    const decision = PirateGameManager.generateAIDecision(state, attacker, () => 0);
    const attackOption = decision.reasoning.optionsConsidered.find(
      (option) => option.type === "attack",
    );

    expect(attackOption).toBeTruthy();
    expect(decision.reasoning.chosenOption?.type).toBe("attack");
    expect(decision.action?.type).toBe("attack");
  });

  it("chooses a move that improves combat posture when no attack exists", () => {
    const attacker = createPlayer("attacker", "admiral", [
      createShip("AI_attacker_admiral_sloop_1", "sloop", 0, 0),
      createShip("AI_attacker_admiral_frigate_1", "frigate", 4, 4),
    ]);
    const defender = createPlayer("defender", "pirate", [
      createShip("AI_defender_pirate_ship_1", "sloop", 9, 4),
    ]);

    const state = createState([attacker, defender]);
    const decision = PirateGameManager.generateAIDecision(state, attacker);

    expect(decision.reasoning.optionsConsidered.some((o) => o.type === "move_ship")).toBe(true);
    expect(decision.action?.type).toBe("move_ship");

    const shipId = decision.action?.data.shipId;
    const toCoordinate = decision.action?.data.toCoordinate;
    expect(shipId).toBeTruthy();
    expect(toCoordinate).toBeTruthy();

    const chosenShip = attacker.ships.find((ship) => ship.id === shipId)!;
    const targetShip = defender.ships[0]!;
    const destination = PirateGameManager.stringToCoordinate(toCoordinate!);

    const beforeDistance = PirateGameManager.calculateDistance(
      chosenShip.position,
      targetShip.position,
    );
    const afterDistance = PirateGameManager.calculateDistance(
      destination,
      targetShip.position,
    );
    const effectiveRange = chosenShip.type === "sloop" ? 1.5 : 3;
    const beforeGap = beforeDistance - effectiveRange;
    const afterGap = afterDistance - effectiveRange;

    expect(afterGap).toBeLessThan(beforeGap);
  });
});

