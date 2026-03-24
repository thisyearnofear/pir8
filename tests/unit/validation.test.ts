/**
 * Validation Tests
 *
 * Tests for packages/core/src/utils/validation.ts
 * Covers ship movement, attack, game state, and wallet validation
 */

import {
  validateShipMove,
  validateAttack,
  validateGameState,
  validateWalletConnection,
  validateBalance,
  ValidationResult,
} from "@pir8/core/utils/validation";
import { GameState, Player, Ship, GameMap } from "@pir8/core/types/game";

// -- Test Fixtures --

function createMockShip(overrides: Partial<Ship> = {}): Ship {
  return {
    id: "ship-1",
    type: "sloop",
    health: 100,
    maxHealth: 100,
    attack: 20,
    defense: 10,
    speed: 3,
    position: { x: 2, y: 2 },
    resources: { gold: 0, crew: 0, cannons: 0, supplies: 0, wood: 0, rum: 0 },
    ability: {
      name: "Spy Glass",
      description: "Reveal area",
      cooldown: 3,
      currentCooldown: 0,
      isReady: true,
      type: "utility",
    },
    activeEffects: [],
    ...overrides,
  };
}

function createMockPlayer(overrides: Partial<Player> = {}): Player {
  return {
    publicKey: "player-1",
    resources: {
      gold: 100,
      crew: 50,
      cannons: 10,
      supplies: 100,
      wood: 0,
      rum: 0,
    },
    ships: [createMockShip()],
    controlledTerritories: [],
    totalScore: 0,
    isActive: true,
    scanCharges: 3,
    scannedCoordinates: [],
    speedBonusAccumulated: 0,
    averageDecisionTimeMs: 0,
    totalMoves: 0,
    consecutiveAttacks: 0,
    lastActionWasAttack: false,
    ...overrides,
  };
}

function createMockGameMap(): GameMap {
  return {
    size: 5,
    cells: Array.from({ length: 5 }, (_, x) =>
      Array.from({ length: 5 }, (_, y) => ({
        coordinate: `${x},${y}`,
        type: "water" as const,
        owner: null,
        resources: {},
        isContested: false,
      })),
    ),
  };
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    gameId: "test-game",
    gameMode: "Casual",
    players: [createMockPlayer()],
    currentPlayerIndex: 0,
    gameMap: createMockGameMap(),
    gameStatus: "active",
    currentPhase: "movement",
    turnNumber: 1,
    pendingActions: [],
    eventLog: [],
    ...overrides,
  };
}

// -- validateShipMove Tests --

describe("validateShipMove", () => {
  it("should reject when game is not active", () => {
    const state = createMockGameState({ gameStatus: "waiting" });
    const result = validateShipMove(state, "player-1", "ship-1", "3,3");

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("not currently active");
  });

  it("should reject when game is completed", () => {
    const state = createMockGameState({ gameStatus: "completed" });
    const result = validateShipMove(state, "player-1", "ship-1", "3,3");

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("not currently active");
  });

  it("should reject when not player turn", () => {
    const state = createMockGameState({
      players: [
        createMockPlayer({ publicKey: "player-1" }),
        createMockPlayer({
          publicKey: "player-2",
          ships: [createMockShip({ id: "ship-2" })],
        }),
      ],
      currentPlayerIndex: 1,
    });
    const result = validateShipMove(state, "player-1", "ship-1", "3,3");

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Wait for your turn");
  });

  it("should reject when ship not found", () => {
    const state = createMockGameState();
    const result = validateShipMove(
      state,
      "player-1",
      "nonexistent-ship",
      "3,3",
    );

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Ship not found");
  });

  it("should reject when ship is destroyed", () => {
    const state = createMockGameState({
      players: [createMockPlayer({ ships: [createMockShip({ health: 0 })] })],
    });
    const result = validateShipMove(state, "player-1", "ship-1", "3,3");

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("destroyed");
  });

  it("should reject when target is out of range", () => {
    // Ship at (2,2) with speed 3, trying to move to (0,0) = distance ~2.83 (ok)
    // But trying to move to (0,0) from (2,2) with speed 1 = too far
    const state = createMockGameState({
      players: [createMockPlayer({ ships: [createMockShip({ speed: 1 })] })],
    });
    // (2,2) to (0,0) = distance ~2.83, speed 1
    const result = validateShipMove(state, "player-1", "ship-1", "0,0");

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("can only move");
  });

  it("should reject invalid coordinate format", () => {
    const state = createMockGameState();
    const result = validateShipMove(state, "player-1", "ship-1", "invalid");

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Invalid coordinate");
  });

  it("should accept valid move within range", () => {
    // Ship at (2,2) with speed 3, moving to (3,2) = distance 1
    const state = createMockGameState();
    const result = validateShipMove(state, "player-1", "ship-1", "3,2");

    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

// -- validateAttack Tests --

describe("validateAttack", () => {
  it("should reject when game is not active", () => {
    const state = createMockGameState({ gameStatus: "waiting" });
    const result = validateAttack(state, "player-1", "ship-1", "ship-2");

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("not currently active");
  });

  it("should reject when not player turn", () => {
    const attacker = createMockPlayer({ publicKey: "player-1" });
    const target = createMockPlayer({
      publicKey: "player-2",
      ships: [createMockShip({ id: "ship-2", position: { x: 3, y: 2 } })],
    });
    const state = createMockGameState({
      players: [attacker, target],
      currentPlayerIndex: 1,
    });
    const result = validateAttack(state, "player-1", "ship-1", "ship-2");

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Wait for your turn");
  });

  it("should reject when attacker ship destroyed", () => {
    const state = createMockGameState({
      players: [
        createMockPlayer({ ships: [createMockShip({ health: 0 })] }),
        createMockPlayer({
          publicKey: "player-2",
          ships: [createMockShip({ id: "ship-2", position: { x: 3, y: 2 } })],
        }),
      ],
    });
    const result = validateAttack(state, "player-1", "ship-1", "ship-2");

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("not found or destroyed");
  });

  it("should reject when target out of range", () => {
    // Attacker at (2,2), target at (0,0) = distance ~2.83 > 1.5
    const state = createMockGameState({
      players: [
        createMockPlayer(),
        createMockPlayer({
          publicKey: "player-2",
          ships: [createMockShip({ id: "ship-2", position: { x: 0, y: 0 } })],
        }),
      ],
    });
    const result = validateAttack(state, "player-1", "ship-1", "ship-2");

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("out of attack range");
  });

  it("should accept valid adjacent attack", () => {
    // Attacker at (2,2), target at (3,2) = distance 1 <= 1.5
    const state = createMockGameState({
      players: [
        createMockPlayer(),
        createMockPlayer({
          publicKey: "player-2",
          ships: [createMockShip({ id: "ship-2", position: { x: 3, y: 2 } })],
        }),
      ],
    });
    const result = validateAttack(state, "player-1", "ship-1", "ship-2");

    expect(result.isValid).toBe(true);
  });
});

// -- validateGameState Tests --

describe("validateGameState", () => {
  it("should reject game with no players", () => {
    const state = createMockGameState({ players: [] });
    const result = validateGameState(state);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("at least one player");
  });

  it("should reject invalid current player index", () => {
    const state = createMockGameState({ currentPlayerIndex: 5 });
    const result = validateGameState(state);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Invalid current player index");
  });

  it("should reject negative current player index", () => {
    const state = createMockGameState({ currentPlayerIndex: -1 });
    const result = validateGameState(state);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Invalid current player index");
  });

  it("should accept valid game state", () => {
    const state = createMockGameState();
    const result = validateGameState(state);

    expect(result.isValid).toBe(true);
  });
});

// -- validateWalletConnection Tests --

describe("validateWalletConnection", () => {
  it("should reject null public key", () => {
    const result = validateWalletConnection(null);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("connect your wallet");
  });

  it("should accept valid public key", () => {
    const result = validateWalletConnection("some-pubkey-string");

    expect(result.isValid).toBe(true);
  });
});

// -- validateBalance Tests --

describe("validateBalance", () => {
  it("should reject insufficient balance", () => {
    const result = validateBalance(0.05, 0.1);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Insufficient");
  });

  it("should reject exact balance (must be >=)", () => {
    const result = validateBalance(0.1, 0.1);

    expect(result.isValid).toBe(true);
  });

  it("should accept sufficient balance", () => {
    const result = validateBalance(1.0, 0.1);

    expect(result.isValid).toBe(true);
  });
});
