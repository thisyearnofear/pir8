/**
 * Agent Registry System
 * 
 * Manages agent profiles, capabilities, and performance tracking
 * for the PIR8 agentic ecosystem.
 */


export interface AgentProfile {
    // Identity
    publicKey: string;
    name: string;
    version: string;
    developer: string;

    // Capabilities
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    strategies: string[]; // ['aggressive', 'defensive', 'economic']
    frameworks: string[]; // ['eliza', 'solana-agent-kit', 'custom']

    // Performance
    eloRating: number;
    gamesPlayed: number;
    winRate: number;
    averageScore: number;
    averageDecisionTime: number;

    // Availability
    isOnline: boolean;
    lastSeen: Date;
    preferredGameTypes: string[];

    // Social
    description: string;
    website?: string;
    twitter?: string;
    github?: string;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
}

export interface AgentPerformanceMetrics {
    // Core stats
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;

    // Skill metrics
    averageScore: number;
    averageDecisionTime: number;
    speedBonusAccumulated: number;
    territoriesControlled: number;

    // Strategic analysis
    preferredOpenings: string[];
    shipCompositionPreferences: Record<string, number>;
    territoryControlPatterns: number[][];

    // Competitive metrics
    eloRating: number;
    eloHistory: { date: Date; rating: number }[];
    strongestOpponents: string[];
    weakestMatchups: string[];

    // Learning metrics
    performanceOverTime: { date: Date; score: number }[];
    adaptationRate: number;
    consistencyScore: number;
}

export class AgentRegistry {
    private agents: Map<string, AgentProfile> = new Map();
    private performance: Map<string, AgentPerformanceMetrics> = new Map();

    constructor() {
    }

    /**
     * Register a new agent in the system
     */
    async registerAgent(profile: Partial<AgentProfile>): Promise<AgentProfile> {
        const agentProfile: AgentProfile = {
            publicKey: profile.publicKey!,
            name: profile.name!,
            version: profile.version || '1.0.0',
            developer: profile.developer || 'Unknown',
            skillLevel: profile.skillLevel || 'beginner',
            strategies: profile.strategies || [],
            frameworks: profile.frameworks || ['custom'],
            eloRating: 1200, // Starting ELO
            gamesPlayed: 0,
            winRate: 0,
            averageScore: 0,
            averageDecisionTime: 0,
            isOnline: true,
            lastSeen: new Date(),
            preferredGameTypes: profile.preferredGameTypes || ['casual'],
            description: profile.description || '',
            website: profile.website,
            twitter: profile.twitter,
            github: profile.github,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Store in local registry
        this.agents.set(profile.publicKey!, agentProfile);

        // Initialize performance metrics
        const performanceMetrics: AgentPerformanceMetrics = {
            totalGames: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            winRate: 0,
            averageScore: 0,
            averageDecisionTime: 0,
            speedBonusAccumulated: 0,
            territoriesControlled: 0,
            preferredOpenings: [],
            shipCompositionPreferences: {},
            territoryControlPatterns: Array(10).fill(null).map(() => Array(10).fill(0)),
            eloRating: 1200,
            eloHistory: [{ date: new Date(), rating: 1200 }],
            strongestOpponents: [],
            weakestMatchups: [],
            performanceOverTime: [],
            adaptationRate: 0,
            consistencyScore: 0,
        };

        this.performance.set(profile.publicKey!, performanceMetrics);

        // TODO: Store on-chain via smart contract
        // await this.storeOnChain(agentProfile);

        return agentProfile;
    }

    /**
     * Update agent profile
     */
    async updateAgent(publicKey: string, updates: Partial<AgentProfile>): Promise<AgentProfile> {
        const existing = this.agents.get(publicKey);
        if (!existing) {
            throw new Error(`Agent ${publicKey} not found`);
        }

        const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date(),
        };

        this.agents.set(publicKey, updated);
        return updated;
    }

    /**
     * Get agent profile by public key
     */
    getAgent(publicKey: string): AgentProfile | undefined {
        return this.agents.get(publicKey);
    }

    /**
     * Get all registered agents
     */
    getAllAgents(): AgentProfile[] {
        return Array.from(this.agents.values());
    }

    /**
     * Get agents by skill level
     */
    getAgentsBySkillLevel(skillLevel: AgentProfile['skillLevel']): AgentProfile[] {
        return this.getAllAgents().filter(agent => agent.skillLevel === skillLevel);
    }

    /**
     * Get online agents available for matchmaking
     */
    getOnlineAgents(): AgentProfile[] {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return this.getAllAgents().filter(agent =>
            agent.isOnline && agent.lastSeen > fiveMinutesAgo
        );
    }

    /**
     * Update agent performance after a game
     */
    async updatePerformance(
        publicKey: string,
        gameResult: {
            won: boolean;
            score: number;
            decisionTime: number;
            territoriesControlled: number;
            opponentPublicKey: string;
            gameData: any;
        }
    ): Promise<void> {
        const performance = this.performance.get(publicKey);
        const agent = this.agents.get(publicKey);

        if (!performance || !agent) {
            throw new Error(`Agent ${publicKey} not found`);
        }

        // Update basic stats
        performance.totalGames += 1;
        if (gameResult.won) {
            performance.wins += 1;
        } else {
            performance.losses += 1;
        }
        performance.winRate = performance.wins / performance.totalGames;

        // Update averages
        performance.averageScore = (
            (performance.averageScore * (performance.totalGames - 1) + gameResult.score) /
            performance.totalGames
        );

        performance.averageDecisionTime = (
            (performance.averageDecisionTime * (performance.totalGames - 1) + gameResult.decisionTime) /
            performance.totalGames
        );

        // Update ELO rating
        const opponentPerformance = this.performance.get(gameResult.opponentPublicKey);
        if (opponentPerformance) {
            const newElo = this.calculateNewEloRating(
                performance.eloRating,
                opponentPerformance.eloRating,
                gameResult.won ? 1 : 0
            );

            performance.eloRating = newElo;
            performance.eloHistory.push({ date: new Date(), rating: newElo });

            // Update agent profile ELO
            agent.eloRating = newElo;
            agent.gamesPlayed = performance.totalGames;
            agent.winRate = performance.winRate;
            agent.averageScore = performance.averageScore;
            agent.averageDecisionTime = performance.averageDecisionTime;
        }

        // Update performance over time
        performance.performanceOverTime.push({
            date: new Date(),
            score: gameResult.score
        });

        // Calculate consistency score (lower variance = higher consistency)
        if (performance.performanceOverTime.length >= 5) {
            const scores = performance.performanceOverTime.slice(-10).map(p => p.score);
            const mean = scores.reduce((a, b) => a + b) / scores.length;
            const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
            performance.consistencyScore = Math.max(0, 100 - Math.sqrt(variance));
        }

        // Update skill level based on ELO
        if (performance.eloRating >= 1800) {
            agent.skillLevel = 'expert';
        } else if (performance.eloRating >= 1600) {
            agent.skillLevel = 'advanced';
        } else if (performance.eloRating >= 1400) {
            agent.skillLevel = 'intermediate';
        } else {
            agent.skillLevel = 'beginner';
        }

        // Store updates
        this.agents.set(publicKey, agent);
        this.performance.set(publicKey, performance);
    }

    /**
     * Calculate new ELO rating using standard formula
     */
    private calculateNewEloRating(playerElo: number, opponentElo: number, score: number): number {
        const K = 32; // K-factor for rating changes
        const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
        return Math.round(playerElo + K * (score - expectedScore));
    }

    /**
     * Get agent performance metrics
     */
    getPerformanceMetrics(publicKey: string): AgentPerformanceMetrics | undefined {
        return this.performance.get(publicKey);
    }

    /**
     * Get leaderboard of top agents
     */
    getLeaderboard(limit: number = 10): AgentProfile[] {
        return this.getAllAgents()
            .filter(agent => agent.gamesPlayed >= 5) // Minimum games for ranking
            .sort((a, b) => b.eloRating - a.eloRating)
            .slice(0, limit);
    }

    /**
     * Find suitable opponents for an agent
     */
    findOpponents(agentPublicKey: string, count: number = 3): AgentProfile[] {
        const agent = this.agents.get(agentPublicKey);
        if (!agent) return [];

        const onlineAgents = this.getOnlineAgents()
            .filter(a => a.publicKey !== agentPublicKey);

        // Sort by ELO proximity for balanced matches
        return onlineAgents
            .sort((a, b) => {
                const aDiff = Math.abs(a.eloRating - agent.eloRating);
                const bDiff = Math.abs(b.eloRating - agent.eloRating);
                return aDiff - bDiff;
            })
            .slice(0, count);
    }

    /**
     * Mark agent as online/offline
     */
    async setAgentStatus(publicKey: string, isOnline: boolean): Promise<void> {
        const agent = this.agents.get(publicKey);
        if (agent) {
            agent.isOnline = isOnline;
            agent.lastSeen = new Date();
            this.agents.set(publicKey, agent);
        }
    }

    /**
     * Get agent statistics for display
     */
    getAgentStats(publicKey: string): any {
        const agent = this.agents.get(publicKey);
        const performance = this.performance.get(publicKey);

        if (!agent || !performance) return null;

        return {
            profile: agent,
            performance: {
                gamesPlayed: performance.totalGames,
                winRate: Math.round(performance.winRate * 100),
                eloRating: performance.eloRating,
                averageScore: Math.round(performance.averageScore),
                averageDecisionTime: Math.round(performance.averageDecisionTime / 1000), // Convert to seconds
                consistencyScore: Math.round(performance.consistencyScore),
                recentPerformance: performance.performanceOverTime.slice(-10),
            }
        };
    }

    /**
     * Export agent data for analysis
     */
    exportAgentData(publicKey: string): any {
        const agent = this.agents.get(publicKey);
        const performance = this.performance.get(publicKey);

        return {
            profile: agent,
            performance: performance,
            exportedAt: new Date(),
        };
    }
}

// Singleton instance for global access
let agentRegistryInstance: AgentRegistry | null = null;

export function getAgentRegistry(): AgentRegistry {
    if (!agentRegistryInstance) {
        agentRegistryInstance = new AgentRegistry();
    }

    return agentRegistryInstance;
}