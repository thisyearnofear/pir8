/**
 * Helpers Tests
 *
 * Tests for packages/core/src/utils/helpers.ts
 * Covers on-chain state mapping and coordinate utilities
 */

import { getVisibleCoordinates } from "@pir8/core/utils/helpers";
import { calculateSpeedBonus, getSpeedBonusTier } from "@pir8/core/utils/time";
import {
  GAME_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from "@pir8/core/utils/constants";

// -- getVisibleCoordinates Tests --

describe("getVisibleCoordinates", () => {
  it("should return center coordinate for range 0", () => {
    const coords = getVisibleCoordinates(5, 5, 0);
    expect(coords).toContain("5,5");
    expect(coords.length).toBe(1);
  });

  it("should return 9 coordinates for range 1", () => {
    const coords = getVisibleCoordinates(5, 5, 1);
    expect(coords.length).toBe(9);
    expect(coords).toContain("5,5");
    expect(coords).toContain("4,5");
    expect(coords).toContain("6,5");
    expect(coords).toContain("5,4");
    expect(coords).toContain("5,6");
  });

  it("should return 25 coordinates for range 2", () => {
    const coords = getVisibleCoordinates(5, 5, 2);
    expect(coords.length).toBe(25);
  });

  it("should default to range 1", () => {
    const coords = getVisibleCoordinates(3, 3);
    expect(coords.length).toBe(9);
  });

  it("should handle edge coordinates (0,0)", () => {
    const coords = getVisibleCoordinates(0, 0, 1);
    expect(coords).toContain("0,0");
    expect(coords).toContain("1,0");
    expect(coords).toContain("0,1");
    expect(coords).toContain("1,1");
    // Negative coordinates are included (caller filters for bounds)
    expect(coords).toContain("-1,-1");
  });
});

// -- Constants Integrity Tests --

describe("GAME_CONFIG", () => {
  it("should have valid map size", () => {
    expect(GAME_CONFIG.MAP_SIZE).toBeGreaterThan(0);
    expect(GAME_CONFIG.MAP_SIZE).toBeLessThanOrEqual(20);
  });

  it("should have valid player limits", () => {
    expect(GAME_CONFIG.MIN_PLAYERS).toBeGreaterThanOrEqual(2);
    expect(GAME_CONFIG.MAX_PLAYERS).toBeGreaterThanOrEqual(
      GAME_CONFIG.MIN_PLAYERS,
    );
  });

  it("should have valid entry fee", () => {
    expect(GAME_CONFIG.ENTRY_FEE).toBeGreaterThan(0);
  });

  it("should have valid platform fee", () => {
    expect(GAME_CONFIG.PLATFORM_FEE).toBeGreaterThan(0);
    expect(GAME_CONFIG.PLATFORM_FEE).toBeLessThan(1);
  });

  it("should have valid turn timeout", () => {
    expect(GAME_CONFIG.TURN_TIMEOUT).toBeGreaterThan(0);
  });
});

describe("ERROR_MESSAGES", () => {
  it("should have all required error messages", () => {
    expect(ERROR_MESSAGES.WALLET_NOT_CONNECTED).toBeTruthy();
    expect(ERROR_MESSAGES.INVALID_COORDINATE).toBeTruthy();
    expect(ERROR_MESSAGES.NOT_YOUR_TURN).toBeTruthy();
    expect(ERROR_MESSAGES.GAME_NOT_ACTIVE).toBeTruthy();
    expect(ERROR_MESSAGES.INSUFFICIENT_FUNDS).toBeTruthy();
    expect(ERROR_MESSAGES.SHIP_DESTROYED).toBeTruthy();
    expect(ERROR_MESSAGES.TRANSACTION_FAILED).toBeTruthy();
  });
});

describe("SUCCESS_MESSAGES", () => {
  it("should have all required success messages", () => {
    expect(SUCCESS_MESSAGES.WALLET_CONNECTED).toBeTruthy();
    expect(SUCCESS_MESSAGES.GAME_CREATED).toBeTruthy();
    expect(SUCCESS_MESSAGES.SHIP_MOVED).toBeTruthy();
    expect(SUCCESS_MESSAGES.TERRITORY_CLAIMED).toBeTruthy();
    expect(SUCCESS_MESSAGES.GAME_WON).toBeTruthy();
  });
});
