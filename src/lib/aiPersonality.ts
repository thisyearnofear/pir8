/**
 * AI Personality System - Mentor Pirate with Blockchain Teasers
 * 
 * Enhances the AI reasoning with personality-driven dialogue that:
 * 1. Teaches gameplay strategy
 * 2. Introduces Solana/Zcash blockchain concepts
 * 3. Creates an engaging mentor-student relationship
 * 
 * Principles:
 * - Educational: Every message teaches something
 * - Contextual: Messages fit the current game situation
 * - Progressive: Complexity increases as player learns
 * - DRY: Single source for all personality content
 */

import { AIReasoning, AIOption } from './pirateGameEngine';
import { GameState } from '@/types/game';

// ============================================================================
// TYPES
// ============================================================================

export interface PersonalityMessage {
    text: string;
    category: 'strategy' | 'blockchain' | 'tutorial' | 'personality';
    priority: number;
}

export interface EnhancedReasoning {
    originalReason: string;
    personalityMessage: string;
    educationalTip: string;
    blockchainTeaser?: string;
}

// ============================================================================
// PIRATE PERSONALITY VAULT
// ============================================================================

const PIRATE_PERSONALITIES = {
    mentor: {
        name: 'Captain Wisdom',
        greeting: [
            "Ahoy there, swab! Let old Captain Wisdom share some knowledge...",
            "Gather 'round, matey! The seas be treacherous, but knowledge be yer best weapon!",
            "Heave to and listen well! This old sea dog's got wisdom to share...",
        ],
        farewell: [
            "Now go forth and conquer, ye scurvy dog!",
            "Remember: a smart pirate be a rich pirate!",
            "Fair winds and following seas, matey!",
        ],
    },
};

// ============================================================================
// STRATEGY LESSONS - Contextual gameplay advice
// ============================================================================

const STRATEGY_LESSONS: Record<string, string[]> = {
    claim_territory: [
        "Claimin' territory be like markin' yer spot on the blockchain - once it's yers, all can see it!",
        "Ports be the heart of yer empire! Control 'em, and ye control the trade routes, savvy?",
        "Treasure tiles be rare as a sober sailor - grab 'em quick before another pirate does!",
        "Territory be power, matey! The more ye control, the more gold flows into yer coffers.",
    ],
    attack: [
        "A well-timed strike be worth more than a fleet of ships! Wait for the perfect moment.",
        "Attack when they're weak, not when they're strong - even a sloop can sink a flagship if the timing be right!",
        "Cannon fire be final on the blockchain, matey! Make sure yer aim be true before ye fire.",
    ],
    move_ship: [
        "Position be everything! A ship in the right place at the right time wins battles.",
        "The seas be connected, just like the blockchain - every move ye make affects the whole network!",
        "Speed be yer ally! Fast ships can outmaneuver stronger foes.",
    ],
    build_ship: [
        "A diverse fleet be a strong fleet! Don't put all yer gold in one galleon.",
        "Ships be investments, matey! Spend wisely, and they'll bring ye riches beyond measure.",
        "In this game, like in DeFi, diversification be the key to survival!",
    ],
    pass: [
        "Sometimes the smartest move be no move at all - patience be a pirate's virtue!",
        "Waitin' lets ye see what yer opponents be plannin'. Knowledge be power, after all!",
    ],
};

// ============================================================================
// BLOCKCHAIN TEASERS - Solana/Zcash educational content
// ============================================================================

const BLOCKCHAIN_TEASERS: Record<string, string[]> = {
    solana: [
        "Ye know, Solana processes transactions faster than a cannonball flies - 65,000 per second! In the real pirate world, that means near-instant trades.",
        "Solana's proof-of-history be like a ship's log - every event recorded in perfect order, no disputin' what happened when!",
        "Low fees on Solana mean ye keep more of yer loot! No more payin' half yer gold just to move it around.",
        "Just like this game has turns, Solana has slots - but they happen every 400 milliseconds! Lightning fast, arr!",
        "In the real world, yer ships would be NFTs on Solana - truly owned by ye, not some centralized port authority!",
    ],
    zcash: [
        "Zcash be like a ghost fleet - transactions happen, but no one knows who sent what to whom! Complete privacy, matey!",
        "Zero-knowledge proofs be magic, I tell ye! Zcash can prove a transaction be valid without revealin' a single doubloon of information!",
        "In transparent mode, all see yer moves - like Ethereum. But with Zcash integration, ye could sail invisible!",
        "Shielded transactions be the ultimate stealth - the blockchain records it happened, but the details be locked in Davy Jones' locker!",
        "Privacy be power, swab! Zcash gives ye the power to choose what ye reveal and what stays secret.",
    ],
    general: [
        "The blockchain be like the seven seas - vast, interconnected, and full of opportunity for those brave enough to explore!",
        "Smart contracts be like havin' a loyal first mate who never sleeps, never drinks, and always follows orders to the letter!",
        "Yer wallet be yer ship - guard the keys well, for they be the only way to access yer treasure!",
        "Decentralized finance (DeFi) be like tradin' at sea without needin' a port authority - peer to peer, free and open!",
        "Every transaction on-chain be permanent as a tattoo - think before ye ink, and verify before ye send!",
    ],
};

// ============================================================================
// TUTORIAL TIPS - Beginner-friendly guidance
// ============================================================================

const TUTORIAL_TIPS: string[] = [
    "Pro tip: Control ports to build more ships. More ships mean more options!",
    "Remember: Ships on treasure tiles collect extra gold every turn!",
    "Keep an eye on the weather - storms can slow ye down or damage yer fleet!",
    "Balance yer resources! Gold builds ships, but crew and cannons win battles!",
    "Don't spread too thin - sometimes defendin' what ye have beats conquerin' more!",
    "Watch yer opponents' moves. Predictable pirates become poor pirates!",
    "Use the speed bonus! Quick decisions earn extra rewards!",
];

// ============================================================================
// PERSONALITY ENGINE
// ============================================================================

export class AIPersonalityEngine {
    private usedMessages: Set<string> = new Set();
    private turnCount: number = 0;

    /**
     * Enhance AI reasoning with personality and educational content
     */
    enhanceReasoning(
        reasoning: AIReasoning,
        gameState: GameState,
        isPracticeMode: boolean
    ): EnhancedReasoning {
        this.turnCount++;
        
        const chosenOption = reasoning.chosenOption;
        if (!chosenOption) {
            return {
                originalReason: reasoning.chosenOption?.reason || "No action taken",
                personalityMessage: this.getRandomGreeting(),
                educationalTip: this.getRandomTutorialTip(),
            };
        }

        // Build the enhanced reasoning
        const originalReason = chosenOption.reason;
        const personalityMessage = this.generatePersonalityMessage(
            chosenOption,
            reasoning,
            gameState,
            isPracticeMode
        );
        const educationalTip = this.getContextualTip(chosenOption.type, reasoning);
        const blockchainTeaser = this.selectBlockchainTeaser(chosenOption.type, this.turnCount);

        return {
            originalReason,
            personalityMessage,
            educationalTip,
            blockchainTeaser,
        };
    }

    /**
     * Generate a personality-rich message for the chosen action
     */
    private generatePersonalityMessage(
        chosenOption: AIOption,
        reasoning: AIReasoning,
        _gameState: GameState,
        isPracticeMode: boolean
    ): string {
        const parts: string[] = [];

        // Add greeting occasionally (20% chance or first turn)
        if (this.turnCount === 1 || Math.random() < 0.2) {
            parts.push(this.getRandomGreeting());
        }

        // Add strategy explanation
        const strategyLesson = this.getStrategyLesson(chosenOption.type);
        parts.push(strategyLesson);

        // Add game analysis insight
        if (reasoning.gameAnalysis.isWinning) {
            parts.push("Yer doin' well, but don't get cocky! The seas turn rough without warnin'.");
        } else if (reasoning.gameAnalysis.isLosing) {
            parts.push("Times be tough, but a true pirate never surrenders! Look for an openin'!");
        }

        // Add practice mode specific guidance
        if (isPracticeMode && Math.random() < 0.3) {
            parts.push("In practice mode, ye can experiment freely - learn from each battle!");
        }

        return parts.join(" ");
    }

    /**
     * Get a random pirate greeting
     */
    private getRandomGreeting(): string {
        const greetings = PIRATE_PERSONALITIES.mentor.greeting;
        return greetings[Math.floor(Math.random() * greetings.length)] || greetings[0]!;
    }

    /**
     * Get strategy lesson for action type
     */
    private getStrategyLesson(actionType: AIOption["type"]): string {
        const lessons = STRATEGY_LESSONS[actionType];
        if (!lessons || lessons.length === 0) {
            return "Every move be a lesson, matey!";
        }

        // Try to get an unused lesson
        const availableLessons = lessons.filter(l => !this.usedMessages.has(l));
        const lessonPool = availableLessons.length > 0 ? availableLessons : lessons;
        
        const lesson = lessonPool[Math.floor(Math.random() * lessonPool.length)] || lessons[0]!;
        this.usedMessages.add(lesson);
        
        return lesson;
    }

    /**
     * Get contextual educational tip
     */
    private getContextualTip(
        _actionType: AIOption["type"],
        reasoning: AIReasoning
    ): string {
        // Prioritize tips based on game state
        if (reasoning.gameAnalysis.totalShips < 2) {
            return "Tip: Ye need more ships! Control a port and build a fleet!";
        }
        if (reasoning.gameAnalysis.territoriesControlled === 0) {
            return "Tip: Claim some territory! Empty islands be free for the takin'!";
        }

        return this.getRandomTutorialTip();
    }

    /**
     * Get random tutorial tip
     */
    private getRandomTutorialTip(): string {
        const tip = TUTORIAL_TIPS[Math.floor(Math.random() * TUTORIAL_TIPS.length)];
        return tip || "Keep learnin', keep growin', keep plunderin'!";
    }

    /**
     * Select appropriate blockchain teaser based on context
     */
    private selectBlockchainTeaser(
        _actionType: AIOption["type"],
        turnNumber: number
    ): string {
        // Alternate between Solana and Zcash teasers
        const isEvenTurn = turnNumber % 2 === 0;
        const category = isEvenTurn ? 'solana' : 'zcash';
        
        const teasers = BLOCKCHAIN_TEASERS[category];
        if (!teasers || teasers.length === 0) {
            const generalTeasers = BLOCKCHAIN_TEASERS['general'];
            return generalTeasers && generalTeasers.length > 0 ? generalTeasers[0]! : "";
        }

        // Try to get unused teaser
        const availableTeasers = teasers.filter(t => !this.usedMessages.has(t));
        const teaserPool = availableTeasers.length > 0 ? availableTeasers : teasers;
        
        const teaser = teaserPool[Math.floor(Math.random() * teaserPool.length)] || teasers[0]!;
        this.usedMessages.add(teaser);

        // Occasionally add general blockchain wisdom
        if (Math.random() < 0.2) {
            const general = BLOCKCHAIN_TEASERS['general'];
            if (general && general.length > 0) {
                const generalTeaser = general[Math.floor(Math.random() * general.length)];
                return `${teaser} ${generalTeaser}`;
            }
        }

        return teaser;
    }

    /**
     * Reset used messages (call when starting new game)
     */
    reset(): void {
        this.usedMessages.clear();
        this.turnCount = 0;
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const aiPersonality = new AIPersonalityEngine();

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Quick enhancement function for use in components
 */
export function enhanceAIReasoning(
    reasoning: AIReasoning,
    gameState: GameState,
    isPracticeMode: boolean = false
): EnhancedReasoning {
    return aiPersonality.enhanceReasoning(reasoning, gameState, isPracticeMode);
}

/**
 * Get a random blockchain teaser for loading screens or idle moments
 */
export function getRandomBlockchainTeaser(): string {
    const allTeasers = [
        ...(BLOCKCHAIN_TEASERS['solana'] || []),
        ...(BLOCKCHAIN_TEASERS['zcash'] || []),
        ...(BLOCKCHAIN_TEASERS['general'] || []),
    ];
    return allTeasers[Math.floor(Math.random() * allTeasers.length)] || "";
}

export default aiPersonality;
