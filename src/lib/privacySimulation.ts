/**
 * Privacy Simulation System
 *
 * Simulates information leakage and privacy education for practice mode.
 * Demonstrates what opponents can see on transparent blockchains vs. private ones.
 *
 * Features:
 * - Information leakage scoring (0-100%)
 * - AI dossier building (behavioral profiling)
 * - Ghost Fleet privacy mode (Zcash simulation)
 * - Venice AI integration for dynamic content
 */

import { GameState, Player, Coordinate, GameAction } from '@/types/game';
import {
    generateDynamicLesson,
    isVeniceAIEnabled
} from './veniceAI';

// ============================================================================
// TYPES
// ============================================================================

export interface InformationLeakageReport {
    totalLeakageScore: number; // 0-100
    visibleShipPositions: Coordinate[];
    visibleResources: { position: Coordinate; type: string; amount: number }[];
    visibleTerritories: string[];
    visibleActions: GameAction[];
    patternsDetected: string[];
}

// Resource interface for game state
interface GameResource {
    position: Coordinate;
    type: string;
    amount: number;
}

export interface PlayerDossier {
    playerId: string;
    movesAnalyzed: number;
    patternsIdentified: string[];
    predictabilityScore: number; // 0-100
    typicalPlayStyle: 'aggressive' | 'defensive' | 'balanced' | 'resource_focused' | 'territorial' | 'unpredictable';
    lastUpdated: Date;
}

export interface PrivacyLesson {
    id: string;
    title: string;
    content: string;
    turnNumber: number;
    blockchainContext: string;
    callToAction?: string;
    isDynamic: boolean;
}

export interface GhostFleetStatus {
    chargesRemaining: number;
    isActive: boolean;
    activeTurnsRemaining: number;
    totalChargesUsed: number;
}

export interface PrivacySimulationState {
    isPracticeMode: boolean;
    informationLeakage: InformationLeakageReport;
    playerDossier: PlayerDossier;
    lessons: PrivacyLesson[];
    ghostFleet: GhostFleetStatus;
    veniceAIEnabled: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GHOST_FLEET_CHARGES = 3;
const GHOST_FLEET_DURATION = 3; // turns

const PATTERN_THRESHOLDS = {
    AGGRESSIVE: { attackRatio: 0.6 },
    DEFENSIVE: { defendRatio: 0.6 },
    RESOURCE_FOCUSED: { resourceRatio: 0.6 },
    TERRITORIAL: { territoryRatio: 0.6 },
    PREDICTABLE: { patternRepetition: 0.5 },
};

// ============================================================================
// PRIVACY SIMULATOR CLASS
// ============================================================================

export class PrivacySimulator {
    private state: PrivacySimulationState;
    private actionHistory: GameAction[] = [];
    private veniceAIEnabled: boolean;

    constructor(isPracticeMode: boolean = true) {
        this.veniceAIEnabled = isVeniceAIEnabled();
        this.state = {
            isPracticeMode,
            informationLeakage: this.createInitialLeakageReport(),
            playerDossier: this.createInitialDossier(),
            lessons: [],
            ghostFleet: {
                chargesRemaining: GHOST_FLEET_CHARGES,
                isActive: false,
                activeTurnsRemaining: 0,
                totalChargesUsed: 0,
            },
            veniceAIEnabled: this.veniceAIEnabled,
        };
    }

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    private createInitialLeakageReport(): InformationLeakageReport {
        return {
            totalLeakageScore: 100, // Start fully visible
            visibleShipPositions: [],
            visibleResources: [],
            visibleTerritories: [],
            visibleActions: [],
            patternsDetected: [],
        };
    }

    private createInitialDossier(): PlayerDossier {
        return {
            playerId: 'human-player',
            movesAnalyzed: 0,
            patternsIdentified: [],
            predictabilityScore: 0,
            typicalPlayStyle: 'balanced',
            lastUpdated: new Date(),
        };
    }

    // ============================================================================
    // STATE ACCESSORS
    // ============================================================================

    getState(): PrivacySimulationState {
        return { ...this.state };
    }

    isGhostFleetActive(): boolean {
        return this.state.ghostFleet.isActive;
    }

    getGhostFleetCharges(): number {
        return this.state.ghostFleet.chargesRemaining;
    }

    // ============================================================================
    // INFORMATION LEAKAGE TRACKING
    // ============================================================================

    /**
     * Calculate information leakage based on game state
     * Returns what the AI/opponent can see about the player
     */
    calculateLeakage(
        gameState: GameState,
        humanPlayer: Player,
        recentActions: GameAction[]
    ): InformationLeakageReport {
        // If Ghost Fleet is active, leakage is minimized
        if (this.state.ghostFleet.isActive) {
            return {
                totalLeakageScore: 5, // Minimal leakage (5%)
                visibleShipPositions: [], // Hidden
                visibleResources: [], // Hidden
                visibleTerritories: humanPlayer.controlledTerritories.slice(0, 1), // Only oldest territory visible
                visibleActions: [], // Actions hidden
                patternsDetected: this.state.informationLeakage.patternsDetected, // Patterns still known
            };
        }

        // Calculate visibility based on game mechanics
        const visibleShips = humanPlayer.ships.map(ship => ship.position);

        // Get resources from game map
        const resources: GameResource[] = [];
        gameState.gameMap.cells.forEach(row => {
            row.forEach(cell => {
                if (cell.resources && Object.keys(cell.resources).length > 0) {
                    const resourceType = Object.keys(cell.resources)[0];
                    const amount = cell.resources[resourceType as keyof typeof cell.resources] || 0;
                    if (amount > 0 && resourceType) {
                        const coords = cell.coordinate.split(',').map(Number);
                        const x = coords[0] ?? 0;
                        const y = coords[1] ?? 0;
                        resources.push({
                            position: { x, y },
                            type: resourceType,
                            amount: amount as number,
                        });
                    }
                }
            });
        });

        const visibleResources = resources
            .filter((r: GameResource) => this.isResourceVisible(r.position, humanPlayer))
            .map((r: GameResource) => ({ position: r.position, type: r.type, amount: r.amount }));

        // Calculate leakage score
        const leakageScore = this.computeLeakageScore(
            visibleShips.length,
            visibleResources.length,
            humanPlayer.controlledTerritories.length,
            recentActions.length
        );

        const report: InformationLeakageReport = {
            totalLeakageScore: leakageScore,
            visibleShipPositions: visibleShips,
            visibleResources,
            visibleTerritories: humanPlayer.controlledTerritories,
            visibleActions: recentActions.slice(-5), // Last 5 actions visible
            patternsDetected: this.detectPatterns(recentActions),
        };

        this.state.informationLeakage = report;
        return report;
    }

    private isResourceVisible(resourcePos: Coordinate, player: Player): boolean {
        // Resources are visible if within range of player's ships
        return player.ships.some(ship => {
            const distance = Math.abs(ship.position.x - resourcePos.x) +
                Math.abs(ship.position.y - resourcePos.y);
            return distance <= 3; // Visibility range
        });
    }

    private computeLeakageScore(
        visibleShips: number,
        visibleResources: number,
        visibleTerritories: number,
        visibleActions: number
    ): number {
        // Base leakage from visibility
        const shipLeakage = Math.min(visibleShips * 15, 40);
        const resourceLeakage = Math.min(visibleResources * 5, 20);
        const territoryLeakage = Math.min(visibleTerritories * 5, 20);
        const actionLeakage = Math.min(visibleActions * 3, 20);

        return Math.min(shipLeakage + resourceLeakage + territoryLeakage + actionLeakage, 100);
    }

    // ============================================================================
    // PATTERN DETECTION (AI Dossier Building)
    // ============================================================================

    /**
     * Detect patterns in player behavior
     * This simulates what sophisticated analytics can learn from on-chain data
     */
    private detectPatterns(actions: GameAction[]): string[] {
        if (actions.length < 3) return [];

        const patterns: string[] = [];
        const recentActions = actions.slice(-10);

        // Count action types
        const actionCounts = recentActions.reduce((acc, action) => {
            acc[action.type] = (acc[action.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const totalActions = recentActions.length;

        // Detect play styles
        if ((actionCounts['attack'] || 0) / totalActions > PATTERN_THRESHOLDS.AGGRESSIVE.attackRatio) {
            patterns.push('Aggressive attacker - favors combat over resource gathering');
        }

        if ((actionCounts['defend'] || 0) / totalActions > PATTERN_THRESHOLDS.DEFENSIVE.defendRatio) {
            patterns.push('Defensive player - prioritizes ship protection');
        }

        if ((actionCounts['collect'] || 0) / totalActions > PATTERN_THRESHOLDS.RESOURCE_FOCUSED.resourceRatio) {
            patterns.push('Resource focused - prioritizes economic advantage');
        }

        if ((actionCounts['claim_territory'] || 0) / totalActions > PATTERN_THRESHOLDS.TERRITORIAL.territoryRatio) {
            patterns.push('Territorial - aggressively expands control area');
        }

        // Detect repetition patterns
        const actionSequence = recentActions.map(a => a.type).join(',');
        const repeatedSequences = this.findRepeatedSequences(actionSequence);
        if (repeatedSequences.length > 0) {
            patterns.push(`Predictable patterns: ${repeatedSequences.join(', ')}`);
        }

        // Detect timing patterns
        const timingPattern = this.analyzeTimingPatterns(recentActions);
        if (timingPattern) {
            patterns.push(timingPattern);
        }

        return patterns;
    }

    private findRepeatedSequences(sequence: string): string[] {
        const patterns: string[] = [];
        const actions = sequence.split(',');

        // Check for 2-action repeats
        for (let i = 0; i < actions.length - 3; i++) {
            const pair = `${actions[i]},${actions[i + 1]}`;
            const rest = actions.slice(i + 2).join(',');
            if (rest.includes(pair)) {
                patterns.push(`${actions[i]}→${actions[i + 1]}`);
            }
        }

        return [...new Set(patterns)]; // Remove duplicates
    }

    private analyzeTimingPatterns(actions: GameAction[]): string | null {
        if (actions.length < 5) return null;

        // Check for consistent timing between actions
        const timestamps = actions.map(a => a.timestamp ? new Date(a.timestamp).getTime() : Date.now());
        const intervals: number[] = [];

        for (let i = 1; i < timestamps.length; i++) {
            const current = timestamps[i];
            const previous = timestamps[i - 1];
            if (current !== undefined && previous !== undefined) {
                intervals.push(current - previous);
            }
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) =>
            sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;

        // Low variance indicates robotic/consistent timing
        if (variance < 1000) {
            return 'Consistent timing - may indicate scripted behavior';
        }

        return null;
    }

    // ============================================================================
    // DOSSIER MANAGEMENT
    // ============================================================================

    /**
     * Update player dossier based on new actions
     */
    updateDossier(actions: GameAction[]): PlayerDossier {
        this.actionHistory.push(...actions);

        const patterns = this.detectPatterns(this.actionHistory);
        const predictability = this.calculatePredictability(patterns, this.actionHistory.length);
        const playStyle = this.determinePlayStyle(patterns);

        this.state.playerDossier = {
            playerId: 'human-player',
            movesAnalyzed: this.actionHistory.length,
            patternsIdentified: patterns,
            predictabilityScore: predictability,
            typicalPlayStyle: playStyle,
            lastUpdated: new Date(),
        };

        return this.state.playerDossier;
    }

    private calculatePredictability(patterns: string[], totalMoves: number): number {
        if (totalMoves < 5) return 0;

        // More patterns = more predictable
        const patternScore = Math.min(patterns.length * 15, 50);

        // More moves analyzed = more confident in prediction
        const confidenceScore = Math.min(totalMoves * 2, 30);

        return Math.min(patternScore + confidenceScore, 100);
    }

    private determinePlayStyle(
        patterns: string[]
    ): PlayerDossier['typicalPlayStyle'] {
        if (patterns.some(p => p.includes('Aggressive'))) return 'aggressive';
        if (patterns.some(p => p.includes('Defensive'))) return 'defensive';
        if (patterns.some(p => p.includes('Resource'))) return 'resource_focused';
        if (patterns.some(p => p.includes('Territorial'))) return 'territorial';
        if (patterns.some(p => p.includes('Predictable'))) return 'unpredictable';
        return 'balanced';
    }

    /**
     * Get AI prediction of next move based on dossier
     */
    predictNextMove(): { action: string; confidence: number; reasoning: string } | null {
        const dossier = this.state.playerDossier;

        if (dossier.movesAnalyzed < 5) {
            return null; // Not enough data
        }

        // Simple prediction based on most common action
        const actionCounts = this.actionHistory.reduce((acc, action) => {
            acc[action.type] = (acc[action.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const mostCommon = Object.entries(actionCounts)
            .sort(([, a], [, b]) => b - a)[0];

        if (!mostCommon) return null;

        const confidence = dossier.predictabilityScore;

        return {
            action: mostCommon[0],
            confidence,
            reasoning: `Based on ${dossier.movesAnalyzed} moves analyzed. Player shows ${dossier.typicalPlayStyle} tendencies with ${confidence}% predictability.`,
        };
    }

    // ============================================================================
    // GHOST FLEET (PRIVACY MODE)
    // ============================================================================

    /**
     * Activate Ghost Fleet - simulates Zcash privacy
     */
    activateGhostFleet(): boolean {
        if (this.state.ghostFleet.chargesRemaining <= 0) {
            return false;
        }

        this.state.ghostFleet.chargesRemaining--;
        this.state.ghostFleet.isActive = true;
        this.state.ghostFleet.activeTurnsRemaining = GHOST_FLEET_DURATION;
        this.state.ghostFleet.totalChargesUsed++;

        return true;
    }

    /**
     * Process turn end - decrement Ghost Fleet duration
     */
    processTurnEnd(): void {
        if (this.state.ghostFleet.isActive) {
            this.state.ghostFleet.activeTurnsRemaining--;

            if (this.state.ghostFleet.activeTurnsRemaining <= 0) {
                this.state.ghostFleet.isActive = false;
            }
        }
    }

    /**
     * Get Ghost Fleet status for UI display
     */
    getGhostFleetStatus(): GhostFleetStatus {
        return { ...this.state.ghostFleet };
    }

    // ============================================================================
    // LESSON GENERATION
    // ============================================================================

    /**
     * Generate a privacy lesson based on current state
     */
    async generateLesson(
        turnNumber: number,
        gameState: GameState,
        humanPlayer: Player
    ): Promise<PrivacyLesson | null> {
        // Determine lesson type based on turn and state
        let lessonType: 'information_leak' | 'pattern_recognition' | 'prediction' | 'counter_strategy' | 'privacy_solution';

        switch (turnNumber) {
            case 3:
                lessonType = 'information_leak';
                break;
            case 5:
                lessonType = 'pattern_recognition';
                break;
            case 7:
                lessonType = 'prediction';
                break;
            case 9:
                lessonType = 'counter_strategy';
                break;
            case 12:
                lessonType = 'privacy_solution';
                break;
            default:
                return null; // No lesson this turn
        }

        // Try Venice AI first if enabled
        if (this.veniceAIEnabled) {
            try {
                const dynamicLesson = await generateDynamicLesson({
                    playerDossier: this.state.playerDossier,
                    leakageReport: this.state.informationLeakage,
                    gameState,
                    humanPlayer,
                    recentActions: this.actionHistory.slice(-5),
                    turnNumber,
                    lessonType,
                });

                const lesson: PrivacyLesson = {
                    id: `lesson-${turnNumber}-${Date.now()}`,
                    title: dynamicLesson.title,
                    content: dynamicLesson.content,
                    turnNumber,
                    blockchainContext: dynamicLesson.blockchainContext,
                    callToAction: dynamicLesson.callToAction,
                    isDynamic: true,
                };

                this.state.lessons.push(lesson);
                return lesson;
            } catch (error) {
                console.warn('[PrivacySimulator] Venice AI failed, using static lesson:', error);
            }
        }

        // Fall back to static lesson
        return this.generateStaticLesson(turnNumber, lessonType);
    }

    private generateStaticLesson(
        turnNumber: number,
        lessonType: string
    ): PrivacyLesson | null {
        const staticLessons: Record<string, Omit<PrivacyLesson, 'id' | 'turnNumber' | 'isDynamic'>> = {
            information_leak: {
                title: 'Your Moves Are Visible',
                content: 'In transparent mode, AI pirates can see your ship positions and predict your next moves. This is what happens on a public blockchain where all transactions are visible.',
                blockchainContext: 'On transparent blockchains like Ethereum, all transactions are public. Anyone can see your wallet balance, transaction history, and smart contract interactions.',
                callToAction: 'Watch how the AI counters your moves based on visible information.',
            },
            pattern_recognition: {
                title: 'Patterns Emerge',
                content: 'The AI is learning your play style from your visible actions. After just a few moves, it can predict your preferences and counter them effectively.',
                blockchainContext: 'Sophisticated analytics firms and MEV bots analyze on-chain data to build profiles of wallet addresses, identifying whales, traders, and their strategies.',
                callToAction: 'Check the Bounty Board to see what the AI has learned about you.',
            },
            prediction: {
                title: 'Predictable Moves',
                content: 'With enough data, opponents can predict your next moves before you make them. This gives them a significant strategic advantage.',
                blockchainContext: 'With enough data, opponents can predict your next moves. This is how MEV extraction works - bots see your pending transaction and front-run it.',
                callToAction: 'Try varying your strategy to become less predictable.',
            },
            counter_strategy: {
                title: 'Counter Strategies',
                content: 'The AI is using your visible information to develop counter-strategies. Every move you make reveals information that can be exploited.',
                blockchainContext: 'In DeFi, this manifests as sandwich attacks and front-running. Your visible transactions become opportunities for others to profit at your expense.',
                callToAction: 'Consider what information you\'re revealing with each action.',
            },
            privacy_solution: {
                title: 'Ghost Fleet Activated!',
                content: 'For the next 3 moves, your actions are hidden from the AI. Experience what true privacy feels like - the AI can no longer predict your moves!',
                blockchainContext: 'Zcash uses zero-knowledge proofs (zk-SNARKs) to validate transactions without revealing sender, recipient, or amount. This is the power of privacy-preserving technology.',
                callToAction: 'Use your Ghost Fleet charges wisely to gain strategic advantage.',
            },
        };

        const lessonData = staticLessons[lessonType];
        if (!lessonData) return null;

        const lesson: PrivacyLesson = {
            id: `lesson-${turnNumber}-${Date.now()}`,
            ...lessonData,
            turnNumber,
            isDynamic: false,
        };

        this.state.lessons.push(lesson);
        return lesson;
    }

    /**
     * Get all lessons
     */
    getLessons(): PrivacyLesson[] {
        return [...this.state.lessons];
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    /**
     * Reset simulation state
     */
    reset(): void {
        this.actionHistory = [];
        this.state = {
            isPracticeMode: true,
            informationLeakage: this.createInitialLeakageReport(),
            playerDossier: this.createInitialDossier(),
            lessons: [],
            ghostFleet: {
                chargesRemaining: GHOST_FLEET_CHARGES,
                isActive: false,
                activeTurnsRemaining: 0,
                totalChargesUsed: 0,
            },
            veniceAIEnabled: this.veniceAIEnabled,
        };
    }

    /**
     * Export privacy report for end-of-game summary
     */
    generatePrivacyReport(): {
        totalLessons: number;
        patternsDetected: number;
        predictabilityScore: number;
        ghostFleetChargesUsed: number;
        privacyTips: string[];
    } {
        return {
            totalLessons: this.state.lessons.length,
            patternsDetected: this.state.playerDossier.patternsIdentified.length,
            predictabilityScore: this.state.playerDossier.predictabilityScore,
            ghostFleetChargesUsed: this.state.ghostFleet.totalChargesUsed,
            privacyTips: [
                'Vary your opening moves to reduce pattern detection',
                'Use Ghost Fleet charges during critical turns',
                'Consider what information each action reveals',
                'Private blockchains like Zcash prevent this type of analysis',
            ],
        };
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let simulatorInstance: PrivacySimulator | null = null;

export function getPrivacySimulator(isPracticeMode: boolean = true): PrivacySimulator {
    if (!simulatorInstance) {
        simulatorInstance = new PrivacySimulator(isPracticeMode);
    }
    return simulatorInstance;
}

export function resetPrivacySimulator(): void {
    simulatorInstance = null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default PrivacySimulator;
