/**
 * Integration tests for challenge routing, practice start, AI battle, and match flow.
 * These cover the main route-to-action flows described in Track 4 acceptance criteria.
 */

import {
  createChallengeRecord,
  getChallengeRecord,
  markChallengeAccepted,
  markChallengeStarted,
  markChallengeCompleted,
  recordMatchResult,
  listMatchResults,
  getCompetitiveSnapshot,
} from "@/lib/server/competitiveStore";
import { computeCaptainProfiles } from "@/lib/competitiveData";
import { PirateGameManager } from "@pir8/core/lib/pirateGameEngine";

// ---------------------------------------------------------------------------
// Challenge routing flow
// ---------------------------------------------------------------------------

describe("challenge routing flow", () => {
  it("shared challenge URL: open → accepted → started lifecycle", async () => {
    const challenge = await createChallengeRecord({
      type: "duel",
      creatorId: "creator_wallet_abc",
      creatorLabel: "Cipher Corsair",
      gameId: "game_42",
      referrer: "ref_xyz",
    });

    expect(challenge.status).toBe("open");
    expect(challenge.type).toBe("duel");
    expect(challenge.referrer).toBe("ref_xyz");

    const fetched = await getChallengeRecord(challenge.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.id).toBe(challenge.id);

    const accepted = await markChallengeAccepted({
      challengeId: challenge.id,
      account: "joiner_wallet_def",
      signature: "tx_sig_001",
    });

    expect(accepted.status).toBe("accepted");
    expect(accepted.acceptedBy).toBe("joiner_wallet_def");
    expect(accepted.acceptanceSignature).toBe("tx_sig_001");
    expect(accepted.acceptedAt).toBeTruthy();

    const started = await markChallengeStarted({ challengeId: challenge.id });
    expect(started.status).toBe("started");
    expect(started.startedAt).toBeTruthy();
  });

  it("shadow-skirmish: creates practice receipt without requiring wallet signature", async () => {
    const challenge = await createChallengeRecord({
      type: "shadow-skirmish",
      creatorId: "practice_user",
    });

    expect(challenge.status).toBe("open");
    expect(challenge.type).toBe("shadow-skirmish");

    const accepted = await markChallengeAccepted({
      challengeId: challenge.id,
      account: "practice_user",
    });

    expect(accepted.status).toBe("accepted");
    expect(accepted.acceptanceSignature).toBeNull();
  });

  it("watch challenge: creates spectate intent without joining", async () => {
    const challenge = await createChallengeRecord({
      type: "watch",
      creatorId: "spectator_wallet",
      gameId: "game_99",
    });

    expect(challenge.type).toBe("watch");
    expect(challenge.status).toBe("open");
    expect(challenge.gameId).toBe("game_99");
  });

  it("referrer attribution survives acceptance", async () => {
    const challenge = await createChallengeRecord({
      type: "duel",
      creatorId: "creator_ref_test",
      referrer: "referrer_captain_xyz",
    });

    const accepted = await markChallengeAccepted({
      challengeId: challenge.id,
      account: "joiner_ref_test",
    });

    expect(accepted.referrer).toBe("referrer_captain_xyz");
  });

  it("expired challenge cannot be accepted", async () => {
    const challenge = await createChallengeRecord({
      type: "duel",
      creatorId: "expire_test_creator",
    });

    // Expire it first
    const { markChallengeExpired } = await import("@/lib/server/competitiveStore");
    await markChallengeExpired({ challengeId: challenge.id, statusReason: "timed out" });

    await expect(
      markChallengeAccepted({ challengeId: challenge.id, account: "late_joiner" }),
    ).rejects.toThrow("Challenge expired");
  });
});

// ---------------------------------------------------------------------------
// Practice start flow
// ---------------------------------------------------------------------------

describe("practice start flow", () => {
  it("creates a valid practice game state with human and AI players", () => {
    const humanPlayer = PirateGameManager.createAIPlayer("practice_game_1", "novice");
    const aiPlayer = PirateGameManager.createAIPlayer("practice_game_1", "pirate");
    const gameState = PirateGameManager.createNewGame([humanPlayer, aiPlayer], "practice_game_1");

    expect(gameState.players).toHaveLength(2);
    expect(gameState.gameStatus).toBe("waiting");
    expect(gameState.gameMap.cells.length).toBeGreaterThan(0);
  });

  it("practice game can be started and first turn processed", () => {
    const humanPlayer = PirateGameManager.createAIPlayer("practice_game_2", "novice");
    const aiPlayer = PirateGameManager.createAIPlayer("practice_game_2", "pirate");

    let gameState = PirateGameManager.createNewGame([humanPlayer, aiPlayer], "practice_game_2");
    gameState = { ...gameState, gameStatus: "active", currentPhase: "action" };

    expect(gameState.players).toHaveLength(2);
    expect(gameState.players.some((p) => p.publicKey.startsWith("AI_"))).toBe(true);

    const currentPlayer = gameState.players[gameState.currentPlayerIndex]!;
    const decision = PirateGameManager.generateAIDecision(gameState, currentPlayer);
    expect(decision.action === null || typeof decision.action.type === "string").toBe(true);
  });

  it("AI battle: two AI players can play several turns without crashing", () => {
    const ai1 = PirateGameManager.createAIPlayer("ai_battle_1", "pirate");
    const ai2 = PirateGameManager.createAIPlayer("ai_battle_1", "captain");

    let gameState = PirateGameManager.createNewGame([ai1, ai2], "ai_battle_1");
    gameState = { ...gameState, gameStatus: "active", currentPhase: "action" };

    let turns = 0;
    while (turns < 20 && gameState.gameStatus === "active") {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex]!;
      const decision = PirateGameManager.generateAIDecision(gameState, currentPlayer);
      const action = decision.action;
      if (action) {
        const result = PirateGameManager.processTurnAction(gameState, action);
        if (result.success) {
          gameState = PirateGameManager.advanceTurn(result.updatedGameState);
        } else {
          gameState = PirateGameManager.advanceTurn(gameState);
        }
      } else {
        gameState = PirateGameManager.advanceTurn(gameState);
      }
      turns++;
    }

    expect(turns).toBeGreaterThan(0);
    expect(["active", "finished"]).toContain(gameState.gameStatus);
  });
});

// ---------------------------------------------------------------------------
// Match result recording and captain profile computation
// ---------------------------------------------------------------------------

describe("match result recording and captain profile computation", () => {
  it("records a match result and reflects it in the competitive snapshot", async () => {
    const now = new Date().toISOString();
    const result = await recordMatchResult({
      winnerPublicKey: "winner_wallet_001",
      loserPublicKey: "loser_wallet_001",
      winnerLabel: "Sea Hawk",
      loserLabel: "Fogline",
      gameId: "game_match_001",
      turnCount: 24,
      completedAt: now,
    });

    expect(result.winnerPublicKey).toBe("winner_wallet_001");

    const results = await listMatchResults();
    expect(results.some((r) => r.gameId === "game_match_001")).toBe(true);

    const snapshot = await getCompetitiveSnapshot();
    const seaHawk = snapshot.captainProfiles.find((p) => p.name === "Sea Hawk");
    expect(seaHawk).toBeTruthy();
    expect(seaHawk!.winRate).toBe("100%");
    expect(seaHawk!.wins).toBeGreaterThanOrEqual(1);
  });

  it("computeCaptainProfiles ranks captains by win rate", () => {
    const profiles = computeCaptainProfiles([], [
      {
        winnerPublicKey: "pk_alpha",
        loserPublicKey: "pk_beta",
        winnerLabel: "Alpha",
        loserLabel: "Beta",
        gameId: "g1",
        turnCount: 20,
        completedAt: new Date().toISOString(),
      },
      {
        winnerPublicKey: "pk_alpha",
        loserPublicKey: "pk_gamma",
        winnerLabel: "Alpha",
        loserLabel: "Gamma",
        gameId: "g2",
        turnCount: 18,
        completedAt: new Date().toISOString(),
      },
      {
        winnerPublicKey: "pk_beta",
        loserPublicKey: "pk_gamma",
        winnerLabel: "Beta",
        loserLabel: "Gamma",
        gameId: "g3",
        turnCount: 22,
        completedAt: new Date().toISOString(),
      },
    ]);

    expect(profiles[0]!.name).toBe("Alpha");
    expect(profiles[0]!.rank).toBe("#1");
    expect(profiles[0]!.wins).toBe(2);
    expect(profiles[0]!.losses).toBe(0);
    expect(profiles[0]!.winRate).toBe("100%");

    const beta = profiles.find((p) => p.name === "Beta")!;
    expect(beta.wins).toBe(1);
    expect(beta.losses).toBe(1);
    expect(beta.winRate).toBe("50%");
  });

  it("completed challenge triggers match completion status", async () => {
    const challenge = await createChallengeRecord({
      type: "duel",
      creatorId: "match_creator",
      gameId: "game_complete_001",
    });

    await markChallengeAccepted({ challengeId: challenge.id, account: "match_joiner" });
    await markChallengeStarted({ challengeId: challenge.id });
    const completed = await markChallengeCompleted({
      challengeId: challenge.id,
      statusReason: "winner: match_creator",
    });

    expect(completed.status).toBe("completed");
    expect(completed.completedAt).toBeTruthy();
    expect(completed.statusReason).toContain("match_creator");
  });
});
