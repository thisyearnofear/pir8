import {
  buildDefaultCompetitiveSnapshot,
  challengeRecordToAcceptance,
} from "@/lib/competitiveData";
import {
  createChallengeRecord,
  getCompetitiveSnapshot,
  listChallengeRecords,
  markChallengeAccepted,
  markChallengeExpired,
  markChallengeRejected,
  markChallengeStarted,
  updateChallengeStatus,
} from "@/lib/server/competitiveStore";

describe("competitiveStore challenge lifecycle", () => {
  it("records open and accepted challenge states in the competitive snapshot", async () => {
    const openRecord = await createChallengeRecord({
      type: "duel",
      creatorId: "creator_wallet",
      gameId: "42",
      referrer: "captain_ref",
    });

    expect(openRecord.status).toBe("open");

    const acceptedRecord = await markChallengeAccepted({
      challengeId: openRecord.id,
      account: "acceptor_wallet",
      signature: "sig_123",
    });

    expect(acceptedRecord.status).toBe("accepted");
    expect(acceptedRecord.acceptedBy).toBe("acceptor_wallet");
    expect(acceptedRecord.acceptanceSignature).toBe("sig_123");

    const snapshot = await getCompetitiveSnapshot();
    expect(snapshot.challengeRecords.some((record) => record.id === openRecord.id)).toBe(
      true,
    );
    expect(snapshot.acceptedChallenges.some((record) => record.id === openRecord.id)).toBe(
      true,
    );
    expect(snapshot.provenance).toBe("preview");
  });

  it("marks expired challenges and excludes them from accepted challenge projections", async () => {
    const openRecord = await createChallengeRecord({
      type: "shadow-skirmish",
      creatorId: "practice_creator",
      referrer: "test_ref",
    });

    const expiredRecord = await markChallengeExpired({
      challengeId: openRecord.id,
      statusReason: "expired in test",
    });

    expect(expiredRecord.status).toBe("expired");
    expect(challengeRecordToAcceptance(expiredRecord)).toBeNull();
  });

  it("supports started and rejected status transitions through the generic updater", async () => {
    const created = await createChallengeRecord({
      type: "duel",
      creatorId: "creator_status",
      gameId: "84",
    });

    const accepted = await updateChallengeStatus({
      challengeId: created.id,
      status: "accepted",
      account: "wallet_status",
      signature: "sig_status",
    });
    expect(accepted.status).toBe("accepted");

    const started = await markChallengeStarted({
      challengeId: created.id,
    });
    expect(started.status).toBe("started");

    const another = await createChallengeRecord({
      type: "watch",
      creatorId: "watch_creator",
    });
    const rejected = await markChallengeRejected({
      challengeId: another.id,
      statusReason: "user rejected",
    });
    expect(rejected.status).toBe("rejected");
    expect(rejected.statusReason).toBe("user rejected");
  });

  it("filters challenge listing by status and type", async () => {
    await createChallengeRecord({
      type: "watch",
      creatorId: "filter_watch",
    });
    const duel = await createChallengeRecord({
      type: "duel",
      creatorId: "filter_duel",
    });
    await markChallengeAccepted({
      challengeId: duel.id,
      account: "filter_wallet",
    });

    const accepted = await listChallengeRecords({ status: "accepted" });
    const watch = await listChallengeRecords({ type: "watch" });

    expect(accepted.some((record) => record.id === duel.id)).toBe(true);
    expect(watch.every((record) => record.type === "watch")).toBe(true);
  });
});

describe("competitive data snapshot helpers", () => {
  it("maps accepted challenge records into acceptance previews", () => {
    const snapshot = buildDefaultCompetitiveSnapshot([
      {
        id: "challenge_1",
        type: "duel",
        status: "accepted",
        creatorId: "creator_1",
        acceptedBy: "wallet_1",
        gameId: "7",
        referrer: "ref_1",
        acceptanceSignature: "sig_1",
        statusReason: null,
        createdAt: new Date().toISOString(),
        acceptedAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        expiresAt: null,
      },
    ]);

    expect(snapshot.acceptedChallenges).toHaveLength(1);
    expect(snapshot.acceptedChallenges[0]?.account).toBe("wallet_1");
    expect(snapshot.acceptedChallenges[0]?.join).toBe("7");
  });
});
