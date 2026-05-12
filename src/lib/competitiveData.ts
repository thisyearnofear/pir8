export type CompetitiveDataProvenance =
  | "live"
  | "testnet"
  | "preview"
  | "seeded";

export type BountyStatus = "Open" | "Watched" | "Claimed";

export type ChallengeType = "shadow-skirmish" | "duel" | "watch";
export type ChallengeStatus =
  | "open"
  | "accepted"
  | "started"
  | "completed"
  | "expired"
  | "rejected";

export interface BountyTarget {
  captain: string;
  record: string;
  bounty: string;
  reason: string;
  status: BountyStatus;
}

export interface CaptainProfile {
  name: string;
  rank: string;
  style: string;
  winRate: string;
  signal: string;
}

export interface ChallengeRecord {
  id: string;
  type: ChallengeType;
  status: ChallengeStatus;
  creatorId: string;
  creatorLabel?: string;
  acceptedBy?: string | null;
  gameId: string | null;
  seedStateId?: string | null;
  referrer: string | null;
  acceptanceSignature?: string | null;
  statusReason?: string | null;
  createdAt: string;
  acceptedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  expiresAt?: string | null;
}

export interface ChallengeAcceptance {
  id: string;
  account: string;
  challenge: ChallengeType;
  join: string | null;
  ref: string | null;
  acceptedAt: string;
}

export interface CompetitiveSnapshot {
  provenance: CompetitiveDataProvenance;
  queue: {
    format: string;
    targetDuration: string;
    stakes: string;
    activeCaptains: number;
    averageWait: string;
  };
  bountyTargets: BountyTarget[];
  captainProfiles: CaptainProfile[];
  acceptedChallenges: ChallengeAcceptance[];
  challengeRecords: ChallengeRecord[];
}

export const DEFAULT_BOUNTY_TARGETS: BountyTarget[] = [
  {
    captain: "Cipher Corsair",
    record: "18-4",
    bounty: "2.4 SOL",
    reason: "Six-match ambush streak",
    status: "Open",
  },
  {
    captain: "Fogline Marauder",
    record: "14-6",
    bounty: "1.1 SOL",
    reason: "Controls the scout meta",
    status: "Open",
  },
  {
    captain: "Northwake",
    record: "11-5",
    bounty: "0.8 SOL",
    reason: "Perfect port defense",
    status: "Watched",
  },
];

export const DEFAULT_CAPTAIN_PROFILES: CaptainProfile[] = [
  {
    name: "Cipher Corsair",
    rank: "#1",
    style: "Ambush",
    winRate: "82%",
    signal: "Late reveal attacks",
  },
  {
    name: "Fogline Marauder",
    rank: "#2",
    style: "Recon",
    winRate: "74%",
    signal: "Scan denial",
  },
  {
    name: "Northwake",
    rank: "#3",
    style: "Control",
    winRate: "69%",
    signal: "Port pressure",
  },
];

export function challengeRecordToAcceptance(
  record: ChallengeRecord,
): ChallengeAcceptance | null {
  if (record.status !== "accepted" || !record.acceptedBy || !record.acceptedAt) {
    return null;
  }

  return {
    id: record.id,
    account: record.acceptedBy,
    challenge: record.type,
    join: record.gameId,
    ref: record.referrer,
    acceptedAt: record.acceptedAt,
  };
}

export function buildDefaultCompetitiveSnapshot(
  challengeRecords: ChallengeRecord[] = [],
  bountyTargets: BountyTarget[] = DEFAULT_BOUNTY_TARGETS,
  captainProfiles: CaptainProfile[] = DEFAULT_CAPTAIN_PROFILES,
): CompetitiveSnapshot {
  const acceptedChallenges = challengeRecords
    .map(challengeRecordToAcceptance)
    .filter((entry): entry is ChallengeAcceptance => entry !== null)
    .slice(0, 20);

  const hasRealRecords = challengeRecords.length > 0;

  return {
    provenance: hasRealRecords ? "preview" : "seeded",
    queue: {
      format: "1v1",
      targetDuration: "5-8m",
      stakes: "Rank",
      activeCaptains: Math.max(acceptedChallenges.length, 3),
      averageWait: acceptedChallenges.length > 0 ? "< 2m" : "Open",
    },
    bountyTargets,
    captainProfiles,
    acceptedChallenges,
    challengeRecords: challengeRecords.slice(0, 20),
  };
}
