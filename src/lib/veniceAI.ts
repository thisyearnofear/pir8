/**
 * Venice AI Integration for Dynamic Educational Content
 * 
 * Provides privacy-focused AI-generated educational content for practice mode.
 * Falls back to static content if Venice API is unavailable.
 * 
 * Principles:
 * - Progressive enhancement: Works without API key (static fallback)
 * - Privacy-aligned: Uses Venice's privacy-focused infrastructure
 * - Performance: Caches responses, minimal API calls
 * - DRY: Single source of truth for educational content generation
 */

import { PlayerDossier, InformationLeakageReport } from './privacySimulation';
import { GameState, Player, GameAction } from '@/types/game';

// ============================================================================
// TYPES
// ============================================================================

export interface VeniceConfig {
    apiKey: string | undefined;
    baseURL: string;
    model: string;
    enabled: boolean;
}

export interface DynamicLessonRequest {
    playerDossier: PlayerDossier;
    leakageReport: InformationLeakageReport;
    gameState: GameState;
    humanPlayer: Player;
    recentActions: GameAction[];
    turnNumber: number;
    lessonType: 'information_leak' | 'pattern_recognition' | 'prediction' | 'counter_strategy' | 'privacy_solution';
}

export interface DynamicLessonResponse {
    title: string;
    content: string;
    blockchainContext: string;
    callToAction?: string;
    isDynamic: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const VENICE_CONFIG: VeniceConfig = {
    apiKey: process.env['VENICE_API_KEY'],
    baseURL: 'https://api.venice.ai/api/v1',
    model: 'llama-3.3-70b', // Balanced performance model
    enabled: !!process.env['VENICE_API_KEY'],
};

// ============================================================================
// CACHE
// ============================================================================

// Simple in-memory cache to avoid redundant API calls
const lessonCache = new Map<string, DynamicLessonResponse>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// STATIC FALLBACK CONTENT (DRY - Single source of truth)
// ============================================================================

const STATIC_LESSONS: Record<string, DynamicLessonResponse> = {
    information_leak: {
        title: 'Your Moves Are Visible',
        content: 'In transparent mode, AI pirates can see your ship positions and predict your next moves. This is what happens on a public blockchain where all transactions are visible.',
        blockchainContext: 'On transparent blockchains like Ethereum, all transactions are public. Anyone can see your wallet balance, transaction history, and smart contract interactions.',
        callToAction: 'Watch how the AI counters your moves based on visible information.',
        isDynamic: false,
    },
    pattern_recognition: {
        title: 'Patterns Emerge',
        content: 'The AI is learning your play style from your visible actions. After just a few moves, it can predict your preferences and counter them effectively.',
        blockchainContext: 'Sophisticated analytics firms and MEV bots analyze on-chain data to build profiles of wallet addresses, identifying whales, traders, and their strategies.',
        callToAction: 'Check the Bounty Board to see what the AI has learned about you.',
        isDynamic: false,
    },
    prediction: {
        title: 'Predictable Moves',
        content: 'With enough data, opponents can predict your next moves before you make them. This gives them a significant strategic advantage.',
        blockchainContext: 'With enough data, opponents can predict your next moves. This is how MEV extraction works - bots see your pending transaction and front-run it.',
        callToAction: 'Try varying your strategy to become less predictable.',
        isDynamic: false,
    },
    counter_strategy: {
        title: 'Counter Strategies',
        content: 'The AI is using your visible information to develop counter-strategies. Every move you make reveals information that can be exploited.',
        blockchainContext: 'In DeFi, this manifests as sandwich attacks and front-running. Your visible transactions become opportunities for others to profit at your expense.',
        callToAction: 'Consider what information you\'re revealing with each action.',
        isDynamic: false,
    },
    privacy_solution: {
        title: 'Ghost Fleet Activated!',
        content: 'For the next 3 moves, your actions are hidden from the AI. Experience what true privacy feels like - the AI can no longer predict your moves!',
        blockchainContext: 'Zcash uses zero-knowledge proofs (zk-SNARKs) to validate transactions without revealing sender, recipient, or amount. This is the power of privacy-preserving technology.',
        callToAction: 'Use your Ghost Fleet charges wisely to gain strategic advantage.',
        isDynamic: false,
    },
};

// ============================================================================
// VENICE AI CLIENT
// ============================================================================

class VeniceAIClient {
    private config: VeniceConfig;

    constructor(config: VeniceConfig = VENICE_CONFIG) {
        this.config = config;
    }

    /**
     * Check if Venice AI is available
     */
    isAvailable(): boolean {
        return this.config.enabled && !!this.config.apiKey;
    }

    /**
     * Generate a dynamic lesson using Venice AI
     */
    async generateLesson(request: DynamicLessonRequest): Promise<DynamicLessonResponse> {
        // Return static content if Venice is not available
        if (!this.isAvailable()) {
            return this.getStaticLesson(request.lessonType);
        }

        // Check cache first
        const cacheKey = this.generateCacheKey(request);
        const cached = lessonCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const response = await this.callVeniceAPI(request);

            // Cache the response
            lessonCache.set(cacheKey, response);
            setTimeout(() => lessonCache.delete(cacheKey), CACHE_TTL);

            return response;
        } catch (error) {
            console.warn('[VeniceAI] Failed to generate dynamic lesson, using fallback:', error);
            return this.getStaticLesson(request.lessonType);
        }
    }

    /**
     * Generate personalized privacy tips based on player behavior
     */
    async generatePrivacyTip(
        dossier: PlayerDossier,
        leakageReport: InformationLeakageReport
    ): Promise<string> {
        if (!this.isAvailable()) {
            return this.getStaticPrivacyTip(leakageReport.totalLeakageScore);
        }

        try {
            const prompt = this.buildPrivacyTipPrompt(dossier, leakageReport);
            const response = await fetch(`${this.config.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a privacy educator for a blockchain gaming platform. Provide concise, actionable privacy tips based on player behavior. Keep responses under 100 words.',
                        },
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                    max_tokens: 150,
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                throw new Error(`Venice API error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || this.getStaticPrivacyTip(leakageReport.totalLeakageScore);
        } catch (error) {
            console.warn('[VeniceAI] Failed to generate privacy tip:', error);
            return this.getStaticPrivacyTip(leakageReport.totalLeakageScore);
        }
    }

    /**
     * Generate a personalized dossier analysis
     */
    async generateDossierAnalysis(dossier: PlayerDossier): Promise<string> {
        if (!this.isAvailable()) {
            return this.getStaticDossierAnalysis(dossier);
        }

        try {
            const prompt = this.buildDossierAnalysisPrompt(dossier);
            const response = await fetch(`${this.config.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are analyzing a player\'s gaming behavior for privacy education purposes. Explain what patterns were detected and how they could be exploited on a transparent blockchain. Be educational but not alarmist. Keep under 150 words.',
                        },
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                    max_tokens: 200,
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                throw new Error(`Venice API error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || this.getStaticDossierAnalysis(dossier);
        } catch (error) {
            console.warn('[VeniceAI] Failed to generate dossier analysis:', error);
            return this.getStaticDossierAnalysis(dossier);
        }
    }

    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================

    private async callVeniceAPI(request: DynamicLessonRequest): Promise<DynamicLessonResponse> {
        const prompt = this.buildLessonPrompt(request);

        const response = await fetch(`${this.config.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: [
                    {
                        role: 'system',
                        content: `You are an educational AI for a pirate-themed blockchain game. Create engaging, informative content about blockchain privacy. 
            
Your responses must be JSON formatted with these fields:
- title: A catchy, pirate-themed title (max 50 chars)
- content: The main educational message (max 200 chars)
- blockchainContext: How this relates to real blockchain privacy (max 150 chars)
- callToAction: What the player should do next (max 100 chars)

Be educational, engaging, and maintain the pirate theme while teaching about privacy.`,
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: 400,
                temperature: 0.8,
            }),
        });

        if (!response.ok) {
            throw new Error(`Venice API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('Empty response from Venice API');
        }

        // Parse JSON response
        try {
            const parsed = JSON.parse(content);
            return {
                title: parsed.title || 'Privacy Lesson',
                content: parsed.content || 'Learn about blockchain privacy.',
                blockchainContext: parsed.blockchainContext || '',
                callToAction: parsed.callToAction,
                isDynamic: true,
            };
        } catch {
            // If not valid JSON, treat as plain text
            return {
                title: 'Privacy Lesson',
                content: content.slice(0, 200),
                blockchainContext: '',
                isDynamic: true,
            };
        }
    }

    private buildLessonPrompt(request: DynamicLessonRequest): string {
        return `
Generate a privacy education lesson for a pirate blockchain game.

Lesson Type: ${request.lessonType}
Turn Number: ${request.turnNumber}
Player Predictability Score: ${request.playerDossier.predictabilityScore}%
Detected Patterns: ${request.playerDossier.patternsIdentified.join(', ') || 'None yet'}
Information Leakage: ${request.leakageReport.totalLeakageScore}%

Recent Player Actions:
${request.recentActions.slice(-3).map(a => `- ${a.type}: ${JSON.stringify(a.data)}`).join('\n')}

Create an engaging lesson that:
1. Explains the privacy concept in pirate-themed terms
2. Connects it to real blockchain privacy issues
3. Suggests what the player should do next

Respond in JSON format with title, content, blockchainContext, and callToAction fields.
`;
    }

    private buildPrivacyTipPrompt(dossier: PlayerDossier, leakageReport: InformationLeakageReport): string {
        return `
Generate a privacy tip for a blockchain gamer.

Current Leakage Score: ${leakageReport.totalLeakageScore}%
Play Style: ${dossier.typicalPlayStyle}
Predictability: ${dossier.predictabilityScore}%
Patterns Detected: ${dossier.patternsIdentified.length}

Provide a specific, actionable tip to improve their privacy in the game.
`;
    }

    private buildDossierAnalysisPrompt(dossier: PlayerDossier): string {
        return `
Analyze this player's gaming behavior from a privacy perspective:

Play Style: ${dossier.typicalPlayStyle}
Moves Analyzed: ${dossier.movesAnalyzed}
Predictability Score: ${dossier.predictabilityScore}%
Detected Patterns:
${dossier.patternsIdentified.map(p => `- ${p}`).join('\n')}

Explain:
1. What these patterns reveal about their strategy
2. How an opponent could exploit this information
3. What they can do to become less predictable
`;
    }

    private generateCacheKey(request: DynamicLessonRequest): string {
        return `${request.lessonType}-${request.turnNumber}-${request.playerDossier.movesAnalyzed}`;
    }

    private getStaticLesson(lessonType: string): DynamicLessonResponse {
        return STATIC_LESSONS[lessonType] || STATIC_LESSONS['information_leak'] || {
            title: 'Privacy Lesson',
            content: 'Learn about blockchain privacy.',
            blockchainContext: '',
            isDynamic: false,
        };
    }

    private getStaticPrivacyTip(leakageScore: number): string {
        if (leakageScore === 0) {
            return 'Perfect privacy! Your moves are completely hidden. This is the power of zero-knowledge technology.';
        }
        if (leakageScore < 30) {
            return 'Good privacy hygiene. Consider varying your strategy to reduce pattern detection.';
        }
        if (leakageScore < 60) {
            return 'Moderate leakage detected. Try unpredictable moves and avoid repeating patterns.';
        }
        return 'High information leakage! Your strategy is very predictable. Consider using privacy features.';
    }

    private getStaticDossierAnalysis(dossier: PlayerDossier): string {
        if (dossier.patternsIdentified.length === 0) {
            return 'Not enough data collected yet. Keep playing to see your behavioral patterns.';
        }

        return `Analysis of ${dossier.movesAnalyzed} moves reveals a ${dossier.typicalPlayStyle} playstyle with ${dossier.predictabilityScore}% predictability. 

The AI has identified ${dossier.patternsIdentified.length} behavioral patterns that could be exploited by opponents. On a transparent blockchain, this information would be permanently visible to sophisticated attackers.

To improve privacy: vary your opening moves, avoid predictable resource collection patterns, and use privacy features when available.`;
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const veniceAI = new VeniceAIClient();

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export function isVeniceAIEnabled(): boolean {
    return veniceAI.isAvailable();
}

export async function generateDynamicLesson(
    request: DynamicLessonRequest
): Promise<DynamicLessonResponse> {
    return veniceAI.generateLesson(request);
}

export async function generatePrivacyTip(
    dossier: PlayerDossier,
    leakageReport: InformationLeakageReport
): Promise<string> {
    return veniceAI.generatePrivacyTip(dossier, leakageReport);
}

export async function generateDossierAnalysis(dossier: PlayerDossier): Promise<string> {
    return veniceAI.generateDossierAnalysis(dossier);
}

export { STATIC_LESSONS };
export default veniceAI;
