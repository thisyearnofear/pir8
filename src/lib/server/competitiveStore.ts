import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ChallengeAcceptance,
  CompetitiveSnapshot,
  buildDefaultCompetitiveSnapshot,
} from "@/lib/competitiveData";

interface CompetitiveStoreFile {
  acceptedChallenges: ChallengeAcceptance[];
}

const storeDir = path.join(process.cwd(), ".data");
const storePath = path.join(storeDir, "competitive-platform.json");

let memoryStore: CompetitiveStoreFile = {
  acceptedChallenges: [],
};

async function readStore(): Promise<CompetitiveStoreFile> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<CompetitiveStoreFile>;
    memoryStore = {
      acceptedChallenges: parsed.acceptedChallenges || [],
    };
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

export async function getCompetitiveSnapshot(): Promise<CompetitiveSnapshot> {
  const store = await readStore();
  return buildDefaultCompetitiveSnapshot(store.acceptedChallenges.slice(0, 20));
}

export async function recordChallengeAcceptance(input: {
  account: string;
  challenge: string;
  join: string | null;
  ref: string | null;
}): Promise<ChallengeAcceptance> {
  const store = await readStore();
  const acceptance: ChallengeAcceptance = {
    id: `accept_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    account: input.account,
    challenge: input.challenge,
    join: input.join,
    ref: input.ref,
    acceptedAt: new Date().toISOString(),
  };

  await writeStore({
    acceptedChallenges: [acceptance, ...store.acceptedChallenges].slice(0, 100),
  });

  return acceptance;
}
