import { getAgentRegistry } from "./agent-registry";

export interface LeaderboardAgent {
  publicKey: string;
  username: string;
  eloRating: number;
  winRate: number;
  gamesPlayed: number;
}

export class LeaderboardManager {
  static getTopAgents(limit: number = 10): LeaderboardAgent[] {
    const registry = getAgentRegistry();
    const agents = registry.getOnlineAgents();

    return agents
      .sort((a, b) => b.eloRating - a.eloRating)
      .slice(0, limit)
      .map((agent) => ({
        publicKey: agent.publicKey,
        username: agent.name,
        eloRating: agent.eloRating,
        winRate: agent.winRate,
        gamesPlayed: agent.gamesPlayed,
      }));
  }
}
