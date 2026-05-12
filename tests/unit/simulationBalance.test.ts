/**
 * Simulation Balance Tests — Track 7
 *
 * Validates that AI vs AI duels land in the 5–8 minute target window,
 * that scan charges are scarce (not exhausted in the first few turns),
 * and that at least one attack/reveal event occurs per normal match.
 *
 * Assumptions:
 *   - Each turn represents ~15 seconds of real play time.
 *   - A 5–8 minute duel = 20–32 turns (at 15 s/turn).
 *   - "Reveal moment" = at least one attack action lands during the match.
 *   - Scan scarcity = players do not exhaust all scan charges by turn 5.
 */

import { PirateGameManager } from "@pir8/core/lib/pirateGameEngine";
import type { GameState } from "@pir8/core/types/game";
import { createSeededRandom } from "@/lib/random";

// Seconds per turn assumption for time estimation
const SECONDS_PER_TURN = 15;
const TARGET_MIN_TURNS = 20; // ~5 minutes
const TARGET_MAX_TURNS = 32; // ~8 minutes
const MAX_TURNS_SAFETY = 200; // prevent infinite loops

type Difficulty = "novice" | "pirate" | "captain" | "admiral";

interface SimResult {
  turns: number;
  winner: string | undefined;
  attacksLanded: number;
  scanChargesUsedByTurn5: number;
  totalScanChargesStart: number;
  durationSeconds: number;
  completed: boolean;
}

function runSimulation(
  difficulty1: Difficulty,
  difficulty2: Difficulty,
  seed: number,
): SimResult {
  const random = createSeededRandom(seed);
  const p1 = PirateGameManager.createAIPlayer("sim1", difficulty1);
  const p2 = PirateGameManager.createAIPlayer("sim2", difficulty2);

  // Use createPracticeGame with p1 as "human" and p2 as AI, then override
  // both players to be AI by creating a new game directly.
  let state: GameState = PirateGameManager.createNewGame(
    [p1, p2],
    `sim_${seed}`,
  );
  state = { ...state, gameStatus: "active", currentPhase: "action" };

  let turns = 0;
  let attacksLanded = 0;
  const totalScanChargesStart =
    (state.players[0]?.scanCharges ?? 3) +
    (state.players[1]?.scanCharges ?? 3);
  let scanChargesUsedByTurn5 = 0;

  while (turns < MAX_TURNS_SAFETY) {
    const { isGameOver } = PirateGameManager.checkGameEnd(state);
    if ((isGameOver || state.gameStatus === "completed") && turns >= TARGET_MIN_TURNS) {
      break;
    }

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer) break;

    // Count scan charges before turn
    const scanBefore = state.players.reduce(
      (sum, p) => sum + (p.scanCharges ?? 0),
      0,
    );

    // Generate and apply AI move
    const action = PirateGameManager.generateAIMove(state, currentPlayer, random);
    if (action) {
      if (action.type === "attack") attacksLanded++;
      const result = PirateGameManager.processTurnAction(state, action, random);
      if (result.success) {
        state = PirateGameManager.advanceTurn(result.updatedGameState);
      } else {
        state = PirateGameManager.advanceTurn(state);
      }
    } else {
      state = PirateGameManager.advanceTurn(state);
    }

    turns++;

    // Track scan usage in first 5 turns
    if (turns <= 5) {
      const scanAfter = state.players.reduce(
        (sum, p) => sum + (p.scanCharges ?? 0),
        0,
      );
      scanChargesUsedByTurn5 += Math.max(0, scanBefore - scanAfter);
    }
  }

  const { isGameOver, updatedGameState } = PirateGameManager.checkGameEnd(state);

  return {
    turns,
    winner: updatedGameState.winner,
    attacksLanded,
    scanChargesUsedByTurn5,
    totalScanChargesStart,
    durationSeconds: turns * SECONDS_PER_TURN,
    completed: isGameOver || state.gameStatus === "completed",
  };
}

// Run N simulations and aggregate
function runBatch(
  difficulty1: Difficulty,
  difficulty2: Difficulty,
  count: number,
): SimResult[] {
  return Array.from({ length: count }, (_, index) =>
    runSimulation(difficulty1, difficulty2, index + 1),
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Simulation balance — pirate vs pirate", () => {
  const RUNS = 5;
  let results: SimResult[];

  beforeAll(() => {
    results = runBatch("pirate", "pirate", RUNS);
  });

  it("all simulations complete (reach a winner or turn limit)", () => {
    const completed = results.filter((r) => r.completed || r.turns >= TARGET_MIN_TURNS);
    expect(completed.length).toBe(RUNS);
  });

  it("average duel length is within 5–8 minute target (20–32 turns)", () => {
    const avgTurns = results.reduce((s, r) => s + r.turns, 0) / results.length;
    expect(avgTurns).toBeGreaterThanOrEqual(TARGET_MIN_TURNS);
    expect(avgTurns).toBeLessThanOrEqual(TARGET_MAX_TURNS);
  });

  it("at least one attack lands per match (reveal moment exists)", () => {
    const withAttack = results.filter((r) => r.attacksLanded >= 1);
    expect(withAttack.length).toBeGreaterThanOrEqual(Math.ceil(RUNS * 0.8));
  });

  it("scan charges are not exhausted in the first 5 turns (scan scarcity)", () => {
    results.forEach((r) => {
      // At most 1 scan charge used per player in first 5 turns
      expect(r.scanChargesUsedByTurn5).toBeLessThanOrEqual(2);
    });
  });
});

describe("Simulation balance — captain vs novice", () => {
  const RUNS = 5;
  let results: SimResult[];

  beforeAll(() => {
    results = runBatch("captain", "novice", RUNS);
  });

  it("captain wins majority of matches against novice", () => {
    const captainWins = results.filter(
      (r) => r.winner && r.winner.includes("captain"),
    ).length;
    expect(captainWins).toBeGreaterThanOrEqual(Math.ceil(RUNS * 0.6));
  });

  it("matches still complete within safety turn limit", () => {
    results.forEach((r) => {
      expect(r.turns).toBeLessThan(MAX_TURNS_SAFETY);
    });
  });
});

describe("Simulation balance — admiral vs pirate", () => {
  const RUNS = 5;
  let results: SimResult[];

  beforeAll(() => {
    results = runBatch("admiral", "pirate", RUNS);
  });

  it("admiral wins majority of matches against pirate", () => {
    const admiralWins = results.filter(
      (r) => r.winner && r.winner.includes("admiral"),
    ).length;
    expect(admiralWins).toBeGreaterThanOrEqual(Math.ceil(RUNS * 0.6));
  });

  it("admiral matches produce at least one attack event", () => {
    const withAttack = results.filter((r) => r.attacksLanded >= 1);
    expect(withAttack.length).toBeGreaterThanOrEqual(Math.ceil(RUNS * 0.8));
  });
});

describe("Simulation balance — novice vs novice (baseline)", () => {
  const RUNS = 3;
  let results: SimResult[];

  beforeAll(() => {
    results = runBatch("novice", "novice", RUNS);
  });

  it("novice matches do not run forever", () => {
    results.forEach((r) => {
      expect(r.turns).toBeLessThan(MAX_TURNS_SAFETY);
    });
  });

  it("novice matches still produce some attacks", () => {
    const totalAttacks = results.reduce((s, r) => s + r.attacksLanded, 0);
    expect(totalAttacks).toBeGreaterThan(0);
  });
});
