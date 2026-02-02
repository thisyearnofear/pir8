/**
 * PIR8 Agent Plugin - Universal Middleware for Solana AI Agents
 * 
 * Provides high-level tools for autonomous agents to participate in PIR8 battles.
 * Compatible with: Solana Agent Kit (SendAI), ElizaOS (ai16z), and custom LLM loops.
 * 
 * Principles: MODULAR, CLEAN, ENHANCEMENT FIRST
 */

import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, BN } from '@coral-xyz/anchor';
import { PirateGameManager } from '../pirateGameEngine';
import { getGamePDA } from '../anchor';
import { GameState } from '../../types/game';

// Define the tool interfaces for agent frameworks
export interface PIR8AgentTool {
  name: string;
  description: string;
  parameters: any;
  execute: (input: any) => Promise<any>;
}

export class PIR8AgentPlugin {
  private program: Program;

  constructor(program: Program, _connection: Connection) {
    this.program = program;
  }

  /**
   * Returns all available tools for the agent
   */
  getTools(): PIR8AgentTool[] {
    return [
      this.registerAgentTool(),
      this.createGameTool(),
      this.joinGameTool(),
      this.getGameStateTool(),
      this.strategicMoveTool(),
    ];
  }

  /**
   * Tool: Register the agent on-chain to track performance
   */
  private registerAgentTool(): PIR8AgentTool {
    return {
      name: 'pir8_register_agent',
      description: 'Registers your identity as an autonomous pirate agent. Required for leaderboards.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The name of your agent (e.g. "DreadBot")' },
          version: { type: 'string', description: 'Agent version (e.g. "1.0.0")' },
        },
        required: ['name', 'version'],
      },
      execute: async ({ name, version }) => {
        const owner = this.program.provider.publicKey!;
        const [agentPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from('agent'), (owner as any).toBuffer()],
          this.program.programId
        );

        const tx = await (this.program as any).methods
          .registerAgent(name, version)
          .accounts({
            agent: agentPDA,
            owner,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        return { success: true, message: `Agent ${name} registered successfully`, signature: tx };
      }
    };
  }

  /**
   * Tool: Create a new game instance
   */
  private createGameTool(): PIR8AgentTool {
    return {
      name: 'pir8_create_game',
      description: 'Creates a new pirate battle arena. Generates a unique game ID.',
      parameters: {
        type: 'object',
        properties: {
          gameId: { type: 'number', description: 'A unique 64-bit number for the game lobby' },
        },
        required: ['gameId'],
      },
      execute: async ({ gameId }) => {
        const [gamePDA] = getGamePDA(gameId);
        
        const tx = await (this.program as any).methods
          .createGame(new BN(gameId))
          .accounts({
            game: gamePDA,
            authority: this.program.provider.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        return { success: true, gameId, gameAddress: gamePDA.toBase58(), signature: tx };
      }
    };
  }

  /**
   * Tool: Join an existing game
   */
  private joinGameTool(): PIR8AgentTool {
    return {
      name: 'pir8_join_game',
      description: 'Joins a specific game lobby. Requires 0.1 SOL entry fee.',
      parameters: {
        type: 'object',
        properties: {
          gameId: { type: 'number', description: 'The ID of the game to join' },
        },
        required: ['gameId'],
      },
      execute: async ({ gameId }) => {
        const [gamePDA] = getGamePDA(gameId);
        
        const tx = await (this.program as any).methods
          .joinGame()
          .accounts({
            game: gamePDA,
            player: this.program.provider.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        return { success: true, message: 'Joined game successfully', signature: tx };
      }
    };
  }

  /**
   * Tool: Fetch and parse current game state
   */
  private getGameStateTool(): PIR8AgentTool {
    return {
      name: 'pir8_get_status',
      description: 'Gets the current map, ship positions, and turn info for a game.',
      parameters: {
        type: 'object',
        properties: {
          gameId: { type: 'number', description: 'The ID of the game' },
        },
        required: ['gameId'],
      },
      execute: async ({ gameId }) => {
        const [gamePDA] = getGamePDA(gameId);
        const account = await (this.program as any).account.pirateGame.fetch(gamePDA);
        return { success: true, state: account };
      }
    };
  }

  /**
   * Tool: Strategic Move - The agent "Brain"
   * ENHANCEMENT: Uses our existing PirateGameManager logic to suggest moves
   */
  private strategicMoveTool(): PIR8AgentTool {
    return {
      name: 'pir8_auto_move',
      description: 'Analyzes the game state and executes the mathematically best move/attack.',
      parameters: {
        type: 'object',
        properties: {
          gameId: { type: 'number', description: 'The ID of the current game' },
        },
        required: ['gameId'],
      },
      execute: async ({ gameId }) => {
        const [gamePDA] = getGamePDA(gameId);
        const rawState = await (this.program as any).account.pirateGame.fetch(gamePDA);
        
        // Transform on-chain state to Engine-compatible state
        const gameState = this.mapOnChainToLocal(rawState as any, gameId.toString());
        const myPK = this.program.provider.publicKey!.toBase58();
        const me = gameState.players.find(p => p.publicKey === myPK);

        if (!me) throw new Error("Agent not in this game");
        if (gameState.players[gameState.currentPlayerIndex]?.publicKey !== myPK) {
          return { success: false, message: "It is not your turn yet." };
        }

        // Use our battle-tested engine to decide
        const decision = PirateGameManager.generateAIDecision(gameState, me);
        
        if (!decision.action) {
          return { success: true, action: 'pass', reason: "No advantageous moves found." };
        }

        // Execute the decided action on-chain
        let tx = '';
        const { type, data } = decision.action;

        if (type === 'move_ship') {
          const [x, y] = (data.toCoordinate || '0,0').split(',').map(Number);
          tx = await (this.program as any).methods
            .moveShip(data.shipId, x, y, new BN(decision.reasoning.thinkingTime))
            .accounts({ game: gamePDA, player: myPK })
            .rpc();
        } else if (type === 'attack') {
          tx = await (this.program as any).methods
            .attackShip(data.shipId, data.targetShipId)
            .accounts({ game: gamePDA, player: myPK })
            .rpc();
        }

        return { 
          success: true, 
          action: type, 
          reasoning: decision.reasoning.chosenOption?.reason,
          signature: tx 
        };
      }
    };
  }

  /**
   * Private helper to map Anchor account data to our Game Engine types
   */
  private mapOnChainToLocal(onChain: any, gameId: string): GameState {
    return {
      gameId,
      players: onChain.players.map((p: any) => ({
        publicKey: p.pubkey.toBase58(),
        resources: p.resources,
        ships: p.ships.map((s: any) => ({
          id: s.id,
          type: Object.keys(s.shipType || {})[0]?.toLowerCase() || 'sloop',
          health: s.health,
          maxHealth: s.maxHealth,
          attack: s.attack,
          defense: s.defense,
          speed: s.speed,
          position: { x: s.positionX, y: s.positionY },
        })),
        controlledTerritories: p.controlledTerritories,
        totalScore: p.totalScore,
        isActive: p.isActive,
      })),
      currentPlayerIndex: onChain.currentPlayerIndex,
      gameMap: PirateGameManager.createGameMap(5), // Placeholder for map sync
      gameStatus: Object.keys(onChain.status || {})[0]?.toLowerCase() as any || 'waiting',
      turnNumber: onChain.turnNumber,
      currentPhase: 'deployment', // Default for engine
      pendingActions: [],
      eventLog: [],
    };
  }
}