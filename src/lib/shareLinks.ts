interface BuildChallengeUrlOptions {
  origin?: string;
  gameId?: string | number;
  ref?: string | null;
  challenge?: "shadow-skirmish" | "duel" | "watch";
}

interface BuildReplayUrlOptions {
  origin?: string;
  momentId: string;
}

export function getShareOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export function buildChallengeUrl({
  origin = getShareOrigin(),
  gameId,
  ref,
  challenge,
}: BuildChallengeUrlOptions = {}): string {
  if (!origin) return "";

  const params = new URLSearchParams();
  const challengeType = challenge || (gameId ? "duel" : "shadow-skirmish");

  params.set("challenge", challengeType);

  if (gameId !== undefined && gameId !== null && gameId !== "") {
    params.set("join", String(gameId));
  }

  if (ref) {
    params.set("ref", ref);
  }

  return `${origin}?${params.toString()}`;
}

export function buildReplayUrl({
  origin = getShareOrigin(),
  momentId,
}: BuildReplayUrlOptions): string {
  if (!origin) return "";
  return `${origin}/replay/${momentId}`;
}

export function buildChallengeActionUrl({
  origin = getShareOrigin(),
  gameId,
  ref,
  challenge,
}: BuildChallengeUrlOptions = {}): string {
  if (!origin) return "";

  const params = new URLSearchParams();
  const challengeType = challenge || (gameId ? "duel" : "shadow-skirmish");

  params.set("challenge", challengeType);

  if (gameId !== undefined && gameId !== null && gameId !== "") {
    params.set("join", String(gameId));
  }

  if (ref) {
    params.set("ref", ref);
  }

  return `${origin}/api/actions/challenge?${params.toString()}`;
}

export function buildAmbushShareText({
  url,
  winnerName,
  turnNumber,
  shipsDestroyed,
  territoriesControlled,
  gold,
  isWinner,
}: {
  url: string;
  winnerName: string;
  turnNumber: number;
  shipsDestroyed: number;
  territoriesControlled: number;
  gold: number;
  isWinner: boolean;
}): string {
  const headline = isWinner
    ? "I won a PIR8 Shadow Seas duel."
    : `${winnerName} won a PIR8 Shadow Seas duel.`;

  return (
    `${headline}\n` +
    `Scout hidden waters. Mask your fleet. Spring the ambush.\n\n` +
    `Turns: ${turnNumber}\n` +
    `Ships sunk: ${shipsDestroyed}\n` +
    `Territories held: ${territoriesControlled}\n` +
    `Gold plundered: ${gold.toLocaleString()}\n\n` +
    `Watch the replay or beat this position:\n` +
    `${url}\n\n` +
    `#PIR8 #ShadowSeas #SolanaGaming`
  );
}
