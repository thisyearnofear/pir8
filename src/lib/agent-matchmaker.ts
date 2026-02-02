/**
 * Agent Matchmaking System
 * 
 * Handles ELO-based matchmaking, tournament bracket generation,
 * and balanced lobby creation for PIR8 agents.
 */

import { AgentProfile, AgentRegistry, getAgentRegistry } from './agent-registry';

export interface GameLobby {
    id: string;
    gameId: number;
    agents: AgentProfile[];
    skillLevel: 'mixed' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
    gameType: 'casual' | 'ranked' | 'tournament';
    entryFee: number;
    maxPlayers: number;
    status: 'waiting' | 'starting' | 'active' | 'completed';
    createdAt: Date;
    estimatedStartTime?: Date;
}

export interface TournamentBracket {
    id: string;
    name: string;
    format: 'single-elimination' | 'double-elimination' | 'round-robin' | 'swiss';
    agents: AgentProfile[];
    rounds: TournamentRound[];
    prizePool: number;
    status: 'registration' | 'active' | 'completed';
    createdAt: Date;
    startTime: Date;
}

export interface TournamentRound {
    roundNumber: number;
    matches: TournamentMatch[];
    status: 'pending' | 'active' | 'completed';
}

export interface TournamentMatch {
    id: string;
    agents: AgentProfile[];
    gameId?: number;
    winner?: string;
    status: 'pending' | 'active' | 'completed';
    scheduledTime: Date;
}

export interface MatchmakingPreferences {
    skillRange: number; // ELO range for opponents
    gameTypes: string[];
    maxWaitTime: number; // milliseconds
    preferredOpponents?: string[]; // Agent public keys
    avoidOpponents?: string[]; // Agent public keys to avoid
}

export class AgentMatchmaker {
    private agentRegistry: AgentRegistry;
    private activeLobbies: Map<string, GameLobby> = new Map();
    private activeTournaments: Map<string, TournamentBracket> = new Map();
    private matchmakingQueue: Map<string, { agent: AgentProfile; preferences: MatchmakingPreferences; queueTime: Date }> = new Map();

    constructor() {
        this.agentRegistry = getAgentRegistry();
    }

    /**
     * Add agent to matchmaking queue
     */
    async joinMatchmaking(
        agentPublicKey: string,
        preferences: MatchmakingPreferences
    ): Promise<void> {
        const agent = this.agentRegistry.getAgent(agentPublicKey);
        if (!agent) {
            throw new Error(`Agent ${agentPublicKey} not found`);
        }

        this.matchmakingQueue.set(agentPublicKey, {
            agent,
            preferences,
            queueTime: new Date(),
        });

        // Try to find a match immediately
        await this.processMatchmaking();
    }

    /**
     * Remove agent from matchmaking queue
     */
    leaveMatchmaking(agentPublicKey: string): void {
        this.matchmakingQueue.delete(agentPublicKey);
    }

    /**
     * Process matchmaking queue and create lobbies
     */
    private async processMatchmaking(): Promise<void> {
        const queuedAgents = Array.from(this.matchmakingQueue.values());

        // Group agents by skill level and preferences
        const skillGroups = this.groupAgentsBySkill(queuedAgents);

        for (const [skillLevel, agents] of skillGroups.entries()) {
            if (agents.length >= 2) {
                // Create balanced matches within skill groups
                const matches = this.createBalancedMatches(agents);

                for (const match of matches) {
                    await this.createLobby(match, skillLevel);

                    // Remove matched agents from queue
                    match.forEach(agent => {
                        this.matchmakingQueue.delete(agent.agent.publicKey);
                    });
                }
            }
        }

        // Handle agents waiting too long - expand search criteria
        await this.handleLongWaitTimes();
    }

    /**
     * Group agents by skill level for balanced matchmaking
     */
    private groupAgentsBySkill(
        queuedAgents: Array<{ agent: AgentProfile; preferences: MatchmakingPreferences; queueTime: Date }>
    ): Map<string, Array<{ agent: AgentProfile; preferences: MatchmakingPreferences; queueTime: Date }>> {
        const groups = new Map<string, Array<{ agent: AgentProfile; preferences: MatchmakingPreferences; queueTime: Date }>>();

        for (const queuedAgent of queuedAgents) {
            const skillLevel = queuedAgent.agent.skillLevel;

            if (!groups.has(skillLevel)) {
                groups.set(skillLevel, []);
            }

            groups.get(skillLevel)!.push(queuedAgent);
        }

        return groups;
    }

    /**
     * Create balanced matches within a skill group
     */
    private createBalancedMatches(
        agents: Array<{ agent: AgentProfile; preferences: MatchmakingPreferences; queueTime: Date }>
    ): Array<Array<{ agent: AgentProfile; preferences: MatchmakingPreferences; queueTime: Date }>> {
        const matches: Array<Array<{ agent: AgentProfile; preferences: MatchmakingPreferences; queueTime: Date }>> = [];
        const availableAgents = [...agents];

        // Sort by ELO for balanced pairing
        availableAgents.sort((a, b) => a.agent.eloRating - b.agent.eloRating);

        while (availableAgents.length >= 2) {
            const match: Array<{ agent: AgentProfile; preferences: MatchmakingPreferences; queueTime: Date }> = [];

            // Take agents with similar ELO ratings
            const baseAgent = availableAgents.shift()!;
            match.push(baseAgent);

            // Find best opponent within skill range
            let bestOpponentIndex = -1;
            let bestEloDiff = Infinity;

            for (let i = 0; i < availableAgents.length && match.length < 4; i++) {
                const candidate = availableAgents[i];
                if (!candidate) continue; // Safety check
                const eloDiff = Math.abs(candidate.agent.eloRating - baseAgent.agent.eloRating);

                // Check if within preferred skill range
                if (eloDiff <= baseAgent.preferences.skillRange && eloDiff < bestEloDiff) {
                    // Check avoid list
                    if (!baseAgent.preferences.avoidOpponents?.includes(candidate.agent.publicKey)) {
                        bestOpponentIndex = i;
                        bestEloDiff = eloDiff;
                    }
                }
            }

            if (bestOpponentIndex >= 0) {
                const spliced = availableAgents.splice(bestOpponentIndex, 1)[0];
                if (spliced) {
                    match.push(spliced);
                }
            }

            // Add more players if available (up to 4 per game)
            while (match.length < 4 && availableAgents.length > 0) {
                const avgElo = match.reduce((sum, m) => sum + m.agent.eloRating, 0) / match.length;

                let closestIndex = -1;
                let closestDiff = Infinity;

                for (let i = 0; i < availableAgents.length; i++) {
                    const agentData = availableAgents[i];
                    if (!agentData) continue; // Safety check
                    const diff = Math.abs(agentData.agent.eloRating - avgElo);
                    if (diff < closestDiff) {
                        closestIndex = i;
                        closestDiff = diff;
                    }
                }

                if (closestIndex >= 0) {
                    const spliced = availableAgents.splice(closestIndex, 1)[0];
                    if (spliced) {
                        match.push(spliced);
                    }
                } else {
                    break;
                }
            }

            if (match.length >= 2) {
                matches.push(match);
            }
        }

        return matches;
    }

    /**
     * Handle agents that have been waiting too long
     */
    private async handleLongWaitTimes(): Promise<void> {
        const now = new Date();
        const longWaitAgents: Array<{ agent: AgentProfile; preferences: MatchmakingPreferences; queueTime: Date }> = [];

        for (const queuedAgent of this.matchmakingQueue.values()) {
            const waitTime = now.getTime() - queuedAgent.queueTime.getTime();

            if (waitTime > queuedAgent.preferences.maxWaitTime) {
                longWaitAgents.push(queuedAgent);
            }
        }

        // Create mixed-skill lobbies for long-waiting agents
        if (longWaitAgents.length >= 2) {
            const matches = this.createBalancedMatches(longWaitAgents);

            for (const match of matches) {
                await this.createLobby(match, 'mixed');

                match.forEach(agent => {
                    this.matchmakingQueue.delete(agent.agent.publicKey);
                });
            }
        }
    }

    /**
     * Create a game lobby from matched agents
     */
    private async createLobby(
        matchedAgents: Array<{ agent: AgentProfile; preferences: MatchmakingPreferences; queueTime: Date }>,
        skillLevel: string
    ): Promise<GameLobby> {
        const lobbyId = `lobby_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const gameId = Math.floor(Math.random() * 1000000); // TODO: Use proper game ID generation

        const lobby: GameLobby = {
            id: lobbyId,
            gameId,
            agents: matchedAgents.map(m => m.agent),
            skillLevel: skillLevel as any,
            gameType: 'ranked',
            entryFee: 0.1, // 0.1 SOL
            maxPlayers: 4,
            status: 'waiting',
            createdAt: new Date(),
            estimatedStartTime: new Date(Date.now() + 30000), // 30 seconds from now
        };

        this.activeLobbies.set(lobbyId, lobby);

        // TODO: Notify agents about the match
        console.log(`Created lobby ${lobbyId} with ${lobby.agents.length} agents`);

        return lobby;
    }

    /**
     * Find suitable opponents for an agent
     */
    async findOpponents(
        agentPublicKey: string,
        count: number = 3,
        skillRange: number = 200
    ): Promise<AgentProfile[]> {
        const agent = this.agentRegistry.getAgent(agentPublicKey);
        if (!agent) return [];

        const onlineAgents = this.agentRegistry.getOnlineAgents()
            .filter(a => a.publicKey !== agentPublicKey);

        // Sort by ELO proximity for balanced matches
        return onlineAgents
            .filter(a => Math.abs(a.eloRating - agent.eloRating) <= skillRange)
            .sort((a, b) => {
                const aDiff = Math.abs(a.eloRating - agent.eloRating);
                const bDiff = Math.abs(b.eloRating - agent.eloRating);
                return aDiff - bDiff;
            })
            .slice(0, count);
    }

    /**
     * Create a balanced lobby manually
     */
    async createBalancedLobby(agents: AgentProfile[]): Promise<GameLobby> {
        if (agents.length < 2 || agents.length > 4) {
            throw new Error('Lobby must have 2-4 agents');
        }

        const lobbyId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const gameId = Math.floor(Math.random() * 1000000);

        // Determine skill level
        const avgElo = agents.reduce((sum, agent) => sum + agent.eloRating, 0) / agents.length;
        let skillLevel: GameLobby['skillLevel'] = 'mixed';

        if (avgElo >= 1800) skillLevel = 'expert';
        else if (avgElo >= 1600) skillLevel = 'advanced';
        else if (avgElo >= 1400) skillLevel = 'intermediate';
        else if (avgElo >= 1200) skillLevel = 'beginner';

        const lobby: GameLobby = {
            id: lobbyId,
            gameId,
            agents,
            skillLevel,
            gameType: 'casual',
            entryFee: 0.05, // Lower fee for casual games
            maxPlayers: agents.length,
            status: 'waiting',
            createdAt: new Date(),
        };

        this.activeLobbies.set(lobbyId, lobby);
        return lobby;
    }

    /**
     * Generate tournament bracket
     */
    async generateTournamentBracket(
        agents: AgentProfile[],
        format: TournamentBracket['format'] = 'single-elimination',
        prizePool: number = 10
    ): Promise<TournamentBracket> {
        const tournamentId = `tournament_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Seed agents by ELO rating
        const seededAgents = [...agents].sort((a, b) => b.eloRating - a.eloRating);

        const tournament: TournamentBracket = {
            id: tournamentId,
            name: `PIR8 Tournament ${new Date().toLocaleDateString()}`,
            format,
            agents: seededAgents,
            rounds: [],
            prizePool,
            status: 'registration',
            createdAt: new Date(),
            startTime: new Date(Date.now() + 300000), // 5 minutes from now
        };

        // Generate bracket based on format
        switch (format) {
            case 'single-elimination':
                tournament.rounds = this.generateSingleEliminationBracket(seededAgents);
                break;
            case 'round-robin':
                tournament.rounds = this.generateRoundRobinBracket(seededAgents);
                break;
            default:
                throw new Error(`Tournament format ${format} not implemented yet`);
        }

        this.activeTournaments.set(tournamentId, tournament);
        return tournament;
    }

    /**
     * Generate single elimination bracket
     */
    private generateSingleEliminationBracket(agents: AgentProfile[]): TournamentRound[] {
        const rounds: TournamentRound[] = [];
        let currentAgents = [...agents];
        let roundNumber = 1;

        while (currentAgents.length > 1) {
            const matches: TournamentMatch[] = [];
            const nextRoundAgents: AgentProfile[] = [];

            // Pair agents for matches
            for (let i = 0; i < currentAgents.length; i += 2) {
                if (i + 1 < currentAgents.length) {
                    // Standard pairing
                    const agent1 = currentAgents[i];
                    const agent2 = currentAgents[i + 1];
                    if (agent1 && agent2) { // Safety check
                        const match: TournamentMatch = {
                            id: `match_${roundNumber}_${i / 2 + 1}`,
                            agents: [agent1, agent2],
                            status: 'pending',
                            scheduledTime: new Date(Date.now() + roundNumber * 600000), // 10 minutes per round
                        };
                        matches.push(match);
                    }
                } else {
                    // Bye - agent advances automatically
                    const agent = currentAgents[i];
                    if (agent) {
                        nextRoundAgents.push(agent);
                    }
                }
            }

            rounds.push({
                roundNumber,
                matches,
                status: 'pending',
            });

            roundNumber++;
            currentAgents = nextRoundAgents;
        }

        return rounds;
    }

    /**
     * Generate round robin bracket
     */
    private generateRoundRobinBracket(agents: AgentProfile[]): TournamentRound[] {
        const rounds: TournamentRound[] = [];
        const n = agents.length;

        // Each agent plays every other agent once
        let matchId = 1;

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const roundNumber = Math.floor((matchId - 1) / Math.floor(n / 2)) + 1;

                // Find or create round
                let round = rounds.find(r => r.roundNumber === roundNumber);
                if (!round) {
                    round = {
                        roundNumber,
                        matches: [],
                        status: 'pending',
                    };
                    rounds.push(round);
                }

                const agent1 = agents[i];
                const agent2 = agents[j];
                if (agent1 && agent2) { // Safety check
                    const match: TournamentMatch = {
                        id: `match_${matchId}`,
                        agents: [agent1, agent2],
                        status: 'pending',
                        scheduledTime: new Date(Date.now() + roundNumber * 600000),
                    };
                    round.matches.push(match);
                }
                matchId++;
            }
        }

        return rounds;
    }

    /**
     * Get active lobbies
     */
    getActiveLobbies(): GameLobby[] {
        return Array.from(this.activeLobbies.values());
    }

    /**
     * Get active tournaments
     */
    getActiveTournaments(): TournamentBracket[] {
        return Array.from(this.activeTournaments.values());
    }

    /**
     * Get matchmaking queue status
     */
    getQueueStatus(): Array<{ agent: AgentProfile; waitTime: number }> {
        const now = new Date();
        return Array.from(this.matchmakingQueue.values()).map(queued => ({
            agent: queued.agent,
            waitTime: now.getTime() - queued.queueTime.getTime(),
        }));
    }

    /**
     * Get lobby by ID
     */
    getLobby(lobbyId: string): GameLobby | undefined {
        return this.activeLobbies.get(lobbyId);
    }

    /**
     * Get tournament by ID
     */
    getTournament(tournamentId: string): TournamentBracket | undefined {
        return this.activeTournaments.get(tournamentId);
    }

    /**
     * Update lobby status
     */
    updateLobbyStatus(lobbyId: string, status: GameLobby['status']): void {
        const lobby = this.activeLobbies.get(lobbyId);
        if (lobby) {
            lobby.status = status;
            this.activeLobbies.set(lobbyId, lobby);
        }
    }

    /**
     * Update tournament status
     */
    updateTournamentStatus(tournamentId: string, status: TournamentBracket['status']): void {
        const tournament = this.activeTournaments.get(tournamentId);
        if (tournament) {
            tournament.status = status;
            this.activeTournaments.set(tournamentId, tournament);
        }
    }
}

// Singleton instance
let matchmakerInstance: AgentMatchmaker | null = null;

export function getAgentMatchmaker(): AgentMatchmaker {
    if (!matchmakerInstance) {
        matchmakerInstance = new AgentMatchmaker();
    }

    return matchmakerInstance;
}