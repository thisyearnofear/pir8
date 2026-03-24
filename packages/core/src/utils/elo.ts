/**
 * ELO Rating System
 *
 * Standard ELO calculation for competitive matchmaking.
 * Used for both players and AI agents.
 *
 * @module utils/elo
 */

const ELO_K_FACTOR = 32;
const ELO_DEFAULT_RATING = 1200;

/**
 * Calculate expected score (probability of winning)
 *
 * @param playerRating - Current player's ELO rating
 * @param opponentRating - Opponent's ELO rating
 * @returns Expected score (0-1)
 */
export function calculateExpectedScore(
  playerRating: number,
  opponentRating: number,
): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

/**
 * Calculate new ELO rating after a game
 *
 * @param playerRating - Current player's ELO rating
 * @param opponentRating - Opponent's ELO rating
 * @param score - Game result: 1 for win, 0.5 for draw, 0 for loss
 * @param kFactor - K-factor for rating sensitivity (default: 32)
 * @returns New ELO rating
 */
export function calculateNewEloRating(
  playerRating: number,
  opponentRating: number,
  score: number,
  kFactor: number = ELO_K_FACTOR,
): number {
  const expectedScore = calculateExpectedScore(playerRating, opponentRating);
  return Math.round(playerRating + kFactor * (score - expectedScore));
}

/**
 * Calculate ELO change (delta) without applying it
 *
 * @param playerRating - Current player's ELO rating
 * @param opponentRating - Opponent's ELO rating
 * @param score - Game result: 1 for win, 0.5 for draw, 0 for loss
 * @param kFactor - K-factor for rating sensitivity (default: 32)
 * @returns ELO change (positive = gain, negative = loss)
 */
export function calculateEloDelta(
  playerRating: number,
  opponentRating: number,
  score: number,
  kFactor: number = ELO_K_FACTOR,
): number {
  const expectedScore = calculateExpectedScore(playerRating, opponentRating);
  return Math.round(kFactor * (score - expectedScore));
}

/**
 * Get skill tier from ELO rating
 *
 * Tiers:
 * - Beginner: < 1200
 * - Intermediate: 1200-1399
 * - Advanced: 1400-1599
 * - Expert: 1600-1799
 * - Master: 1800+
 *
 * @param elo - ELO rating
 * @returns Skill tier name
 */
export function getSkillTier(elo: number): string {
  if (elo >= 1800) return "Master";
  if (elo >= 1600) return "Expert";
  if (elo >= 1400) return "Advanced";
  if (elo >= 1200) return "Intermediate";
  return "Beginner";
}

/**
 * Initialize default player rating fields
 *
 * @returns Default rating fields for a new player
 */
export function getDefaultPlayerRating() {
  return {
    eloRating: ELO_DEFAULT_RATING,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
  };
}

/**
 * Update player ratings after a game
 *
 * @param winner - Winner's current stats
 * @param loser - Loser's current stats
 * @returns Updated stats for both players
 */
export function updateRatingsAfterGame(
  winner: {
    eloRating: number;
    wins: number;
    losses: number;
    gamesPlayed: number;
  },
  loser: {
    eloRating: number;
    wins: number;
    losses: number;
    gamesPlayed: number;
  },
) {
  const winnerNewElo = calculateNewEloRating(
    winner.eloRating,
    loser.eloRating,
    1,
  );
  const loserNewElo = calculateNewEloRating(
    loser.eloRating,
    winner.eloRating,
    0,
  );

  return {
    winner: {
      eloRating: winnerNewElo,
      wins: winner.wins + 1,
      losses: winner.losses,
      gamesPlayed: winner.gamesPlayed + 1,
    },
    loser: {
      eloRating: loserNewElo,
      wins: loser.wins,
      losses: loser.losses + 1,
      gamesPlayed: loser.gamesPlayed + 1,
    },
  };
}
