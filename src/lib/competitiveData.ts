export interface BountyTarget {
  captain: string;
  record: string;
  bounty: string;
  reason: string;
  status: "Open" | "Watched" | "Claimed";
}

export interface CaptainProfile {
  name: string;
  rank: string;
  style: string;
  winRate: string;
  signal: string;
}

export interface ChallengeAcceptance {
  id: string;
  account: string;
  challenge: string;
  join: string | null;
  ref: string | null;
  acceptedAt: string;
}

export interface CompetitiveSnapshot {
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

export function buildDefaultCompetitiveSnapshot(
  acceptedChallenges: ChallengeAcceptance[] = [],
): CompetitiveSnapshot {
  return {
    queue: {
      format: "1v1",
      targetDuration: "5-8m",
      stakes: "Rank",
      activeCaptains: Math.max(acceptedChallenges.length, 3),
      averageWait: acceptedChallenges.length > 0 ? "< 2m" : "Open",
    },
    bountyTargets: DEFAULT_BOUNTY_TARGETS,
    captainProfiles: DEFAULT_CAPTAIN_PROFILES,
    acceptedChallenges,
  };
}
