import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  BattleMomentReplay,
  buildBattleMomentReplay,
} from "@/lib/battleMoments";
import {
  BountyTarget,
  CaptainProfile,
  ChallengeAcceptance,
  ChallengeRecord,
  ChallengeStatus,
  ChallengeType,
  CompetitiveSnapshot,
  MatchResult,
  DEFAULT_BOUNTY_TARGETS,
  DEFAULT_CAPTAIN_PROFILES,
  buildDefaultCompetitiveSnapshot,
  challengeRecordToAcceptance,
  computeCaptainProfiles,
} from "@/lib/competitiveData";
import { GameState } from "@/types/game";

interface LegacyCompetitiveStoreFile {
  acceptedChallenges?: ChallengeAcceptance[];
  battleMoments?: BattleMomentReplay[];
}

interface CompetitiveStoreFile {
  challengeRecords: ChallengeRecord[];
  bountyTargets: BountyTarget[];
  captainProfiles: CaptainProfile[];
  battleMoments: BattleMomentReplay[];
  matchResults: MatchResult[];
}

const storeDir = path.join(process.cwd(), ".data");
const storePath = path.join(storeDir, "competitive-platform.json");

let memoryStore: CompetitiveStoreFile = {
  challengeRecords: [],
  bountyTargets: DEFAULT_BOUNTY_TARGETS,
  captainProfiles: DEFAULT_CAPTAIN_PROFILES,
  battleMoments: [],
  matchResults: [],
};

function toChallengeType(value?: string | null): ChallengeType {
  if (value === "duel" || value === "watch" || value === "shadow-skirmish") {
    return value;
  }
  return "shadow-skirmish";
}

function toChallengeStatus(value?: string | null): ChallengeStatus {
  switch (value) {
    case "accepted":
    case "started":
    case "completed":
    case "expired":
    case "rejected":
      return value;
    default:
      return "open";
  }
}

function normalizeChallengeRecord(record: Partial<ChallengeRecord>): ChallengeRecord {
  return {
    id:
      record.id ||
      `challenge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: toChallengeType(record.type),
    status: toChallengeStatus(record.status),
    creatorId: record.creatorId || "legacy_import",
    creatorLabel: record.creatorLabel,
    acceptedBy: record.acceptedBy || null,
    gameId: record.gameId || null,
    seedStateId: record.seedStateId || null,
    referrer: record.referrer || null,
    acceptanceSignature: record.acceptanceSignature || null,
    statusReason: record.statusReason || null,
    createdAt: record.createdAt || new Date().toISOString(),
    acceptedAt: record.acceptedAt || null,
    startedAt: record.startedAt || null,
    completedAt: record.completedAt || null,
    expiresAt: record.expiresAt || null,
  };
}

function migrateLegacyAcceptances(
  acceptedChallenges: ChallengeAcceptance[] = [],
): ChallengeRecord[] {
  return acceptedChallenges.map((acceptance) =>
    normalizeChallengeRecord({
      id: acceptance.id,
      type: toChallengeType(acceptance.challenge),
      status: "accepted",
      creatorId: acceptance.ref || acceptance.account,
      acceptedBy: acceptance.account,
      gameId: acceptance.join,
      referrer: acceptance.ref,
      createdAt: acceptance.acceptedAt,
      acceptedAt: acceptance.acceptedAt,
    }),
  );
}

function normalizeStore(
  parsed: Partial<CompetitiveStoreFile & LegacyCompetitiveStoreFile>,
): CompetitiveStoreFile {
  const challengeRecords = Array.isArray(parsed.challengeRecords)
    ? parsed.challengeRecords.map(normalizeChallengeRecord)
    : migrateLegacyAcceptances(parsed.acceptedChallenges || []);

  return {
    challengeRecords,
    bountyTargets:
      Array.isArray(parsed.bountyTargets) && parsed.bountyTargets.length > 0
        ? parsed.bountyTargets
        : DEFAULT_BOUNTY_TARGETS,
    captainProfiles:
      Array.isArray(parsed.captainProfiles) && parsed.captainProfiles.length > 0
        ? parsed.captainProfiles
        : DEFAULT_CAPTAIN_PROFILES,
    battleMoments: parsed.battleMoments || [],
    matchResults: Array.isArray(parsed.matchResults) ? parsed.matchResults : [],
  };
}

async function readStore(): Promise<CompetitiveStoreFile> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<
      CompetitiveStoreFile & LegacyCompetitiveStoreFile
    >;
    memoryStore = normalizeStore(parsed);
  } catch {
    return memoryStore;
  }

  return memoryStore;
}

async function writeStore(store: CompetitiveStoreFile) {
  memoryStore = store;

  try {
    await mkdir(storeDir, { recursive: true });
    await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // Read-only deployments still get per-process memory persistence.
  }
}

function sortChallengeRecords(records: ChallengeRecord[]) {
  return [...records].sort((a, b) =>
    (b.acceptedAt || b.createdAt).localeCompare(a.acceptedAt || a.createdAt),
  );
}

function withUpdatedChallenge(
  store: CompetitiveStoreFile,
  challengeId: string,
  updater: (record: ChallengeRecord) => ChallengeRecord,
): CompetitiveStoreFile {
  return {
    ...store,
    challengeRecords: sortChallengeRecords(
      store.challengeRecords.map((record) =>
        record.id === challengeId ? updater(record) : record,
      ),
    ).slice(0, 100),
  };
}

async function requireChallengeRecord(challengeId: string): Promise<{
  store: CompetitiveStoreFile;
  record: ChallengeRecord;
}> {
  const store = await readStore();
  const record = store.challengeRecords.find((entry) => entry.id === challengeId);

  if (!record) {
    throw new Error("Challenge not found");
  }

  return { store, record };
}

export async function getCompetitiveSnapshot(): Promise<CompetitiveSnapshot> {
  const store = await readStore();
  const captainProfiles = computeCaptainProfiles(
    store.captainProfiles,
    store.matchResults,
  );
  return buildDefaultCompetitiveSnapshot(
    store.challengeRecords,
    store.bountyTargets,
    captainProfiles,
  );
}

export async function recordMatchResult(input: MatchResult): Promise<MatchResult> {
  const store = await readStore();
  const matchResults = [input, ...store.matchResults].slice(0, 200);
  await writeStore({ ...store, matchResults });
  return input;
}

export async function listMatchResults(): Promise<MatchResult[]> {
  const store = await readStore();
  return store.matchResults;
}

export async function createChallengeRecord(input: {
  type: ChallengeType;
  creatorId: string;
  creatorLabel?: string;
  gameId?: string | null;
  seedStateId?: string | null;
  referrer?: string | null;
  expiresAt?: string | null;
}): Promise<ChallengeRecord> {
  const store = await readStore();
  const now = new Date().toISOString();
  const record = normalizeChallengeRecord({
    id: `challenge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: input.type,
    status: "open",
    creatorId: input.creatorId,
    creatorLabel: input.creatorLabel,
    gameId: input.gameId || null,
    seedStateId: input.seedStateId || null,
    referrer: input.referrer || null,
    createdAt: now,
    expiresAt: input.expiresAt || null,
  });

  await writeStore({
    ...store,
    challengeRecords: sortChallengeRecords([record, ...store.challengeRecords]).slice(
      0,
      100,
    ),
  });

  return record;
}

export async function listChallengeRecords(filters?: {
  status?: ChallengeStatus;
  type?: ChallengeType;
}): Promise<ChallengeRecord[]> {
  const store = await readStore();
  return sortChallengeRecords(store.challengeRecords).filter((record) => {
    if (filters?.status && record.status !== filters.status) return false;
    if (filters?.type && record.type !== filters.type) return false;
    return true;
  });
}

export async function getChallengeRecord(
  challengeId: string,
): Promise<ChallengeRecord | null> {
  const store = await readStore();
  return store.challengeRecords.find((record) => record.id === challengeId) || null;
}

export async function updateChallengeStatus(input: {
  challengeId: string;
  status: ChallengeStatus;
  account?: string;
  signature?: string | null;
  statusReason?: string | null;
}): Promise<ChallengeRecord> {
  switch (input.status) {
    case "accepted":
      if (!input.account) {
        throw new Error("Account is required to accept a challenge");
      }
      return markChallengeAccepted({
        challengeId: input.challengeId,
        account: input.account,
        signature: input.signature,
      });
    case "started":
      return markChallengeStarted({ challengeId: input.challengeId });
    case "completed":
      return markChallengeCompleted({
        challengeId: input.challengeId,
        statusReason: input.statusReason,
      });
    case "expired":
      return markChallengeExpired({
        challengeId: input.challengeId,
        statusReason: input.statusReason,
      });
    case "rejected":
      return markChallengeRejected({
        challengeId: input.challengeId,
        statusReason: input.statusReason,
      });
    default:
      throw new Error("Open status must be created, not patched");
  }
}

export async function markChallengeAccepted(input: {
  challengeId: string;
  account: string;
  signature?: string | null;
}): Promise<ChallengeRecord> {
  const { store, record: existing } = await requireChallengeRecord(input.challengeId);

  if (existing.status === "expired") {
    throw new Error("Challenge expired");
  }

  if (existing.status === "completed") {
    throw new Error("Challenge already completed");
  }

  const acceptedAt = new Date().toISOString();
  const updated = normalizeChallengeRecord({
    ...existing,
    status: "accepted",
    acceptedBy: input.account,
    acceptanceSignature: input.signature || null,
    acceptedAt,
  });

  const nextStore = withUpdatedChallenge(store, input.challengeId, () => updated);
  await writeStore(nextStore);
  return updated;
}

export async function markChallengeStarted(input: {
  challengeId: string;
}): Promise<ChallengeRecord> {
  const { store, record: existing } = await requireChallengeRecord(input.challengeId);

  const startedAt = new Date().toISOString();
  const updated = normalizeChallengeRecord({
    ...existing,
    status: "started",
    startedAt,
  });

  const nextStore = withUpdatedChallenge(store, input.challengeId, () => updated);
  await writeStore(nextStore);
  return updated;
}

export async function markChallengeCompleted(input: {
  challengeId: string;
  statusReason?: string | null;
}): Promise<ChallengeRecord> {
  const { store, record: existing } = await requireChallengeRecord(input.challengeId);

  const completedAt = new Date().toISOString();
  const updated = normalizeChallengeRecord({
    ...existing,
    status: "completed",
    statusReason: input.statusReason || null,
    completedAt,
  });

  const nextStore = withUpdatedChallenge(store, input.challengeId, () => updated);
  await writeStore(nextStore);
  return updated;
}

export async function markChallengeExpired(input: {
  challengeId: string;
  statusReason?: string | null;
}): Promise<ChallengeRecord> {
  const { store, record: existing } = await requireChallengeRecord(input.challengeId);

  const updated = normalizeChallengeRecord({
    ...existing,
    status: "expired",
    statusReason: input.statusReason || null,
  });

  const nextStore = withUpdatedChallenge(store, input.challengeId, () => updated);
  await writeStore(nextStore);
  return updated;
}

export async function markChallengeRejected(input: {
  challengeId: string;
  statusReason?: string | null;
}): Promise<ChallengeRecord> {
  const { store, record: existing } = await requireChallengeRecord(input.challengeId);

  const updated = normalizeChallengeRecord({
    ...existing,
    status: "rejected",
    statusReason: input.statusReason || null,
  });

  const nextStore = withUpdatedChallenge(store, input.challengeId, () => updated);
  await writeStore(nextStore);
  return updated;
}

export async function recordChallengeAcceptance(input: {
  account: string;
  challenge: ChallengeType;
  join: string | null;
  ref: string | null;
  signature?: string | null;
}): Promise<ChallengeAcceptance> {
  const record = await createChallengeRecord({
    type: input.challenge,
    creatorId: input.ref || input.account,
    gameId: input.join,
    referrer: input.ref,
  });
  const accepted = await markChallengeAccepted({
    challengeId: record.id,
    account: input.account,
    signature: input.signature,
  });
  const acceptance = challengeRecordToAcceptance(accepted);

  if (!acceptance) {
    throw new Error("Accepted challenge could not be recorded");
  }

  return acceptance;
}

export async function recordBattleMoment(
  gameState: GameState,
  winnerPublicKey?: string,
): Promise<BattleMomentReplay> {
  const store = await readStore();
  const moment = buildBattleMomentReplay(gameState, winnerPublicKey);
  const remaining = store.battleMoments.filter((entry) => entry.id !== moment.id);

  await writeStore({
    ...store,
    battleMoments: [moment, ...remaining].slice(0, 100),
  });

  return moment;
}

export async function getBattleMoment(
  id: string,
): Promise<BattleMomentReplay | null> {
  const store = await readStore();
  return store.battleMoments.find((entry) => entry.id === id) || null;
}
