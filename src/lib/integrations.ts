/**
 * Integration utilities for Helius and Pump Fun APIs
 * Consolidates your test implementations from /tests directory
 */

import { SOLANA_CONFIG, API_ENDPOINTS } from '../utils/constants';

// ENHANCED Helius Integration (based on helius-transaction-monitor.ts)
export class HeliusMonitor {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private gameId: string | null = null;

  constructor(private onTransaction: (data: any) => void, gameId?: string) {
    this.gameId = gameId || null;
  }

  connect() {
    if (!API_ENDPOINTS.HELIUS_RPC) {
      throw new Error('Helius RPC URL not configured');
    }

    // Use WebSocket endpoint
    const wsUrl = API_ENDPOINTS.HELIUS_RPC.replace('https://', 'wss://').replace('http://', 'ws://');
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('🔥 Helius WebSocket connected for PIR8');
      this.reconnectAttempts = 0;
      
      // Subscribe to PIR8 game transactions
      this.subscribeToGameTransactions();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Filter and process PIR8 game events
        if (this.isPir8GameTransaction(data)) {
          this.processGameTransaction(data);
          this.onTransaction(data);
        }
      } catch (error) {
        console.error('Failed to parse Helius message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('Helius WebSocket disconnected');
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('Helius WebSocket error:', error);
    };
  }

  private subscribeToGameTransactions() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const subscribeMessage = {
      jsonrpc: '2.0',
      id: 1,
      method: 'transactionSubscribe',
      params: [
        {
          vote: false,
          failed: false,
          signature: null,
          accountInclude: [SOLANA_CONFIG.PROGRAM_ID], // PIR8 program ID
        },
        {
          commitment: 'finalized',
          encoding: 'jsonParsed',
          transactionDetails: 'full',
          showRewards: true,
          maxSupportedTransactionVersion: 0
        }
      ]
    };

    this.ws.send(JSON.stringify(subscribeMessage));
    console.log('🎯 Subscribed to PIR8 game transactions');
  }

  private isPir8GameTransaction(data: any): boolean {
    // Check if transaction involves PIR8 program
    try {
      const transaction = data?.result?.value?.transaction;
      if (!transaction) return false;

      const accountKeys = transaction?.message?.accountKeys;
      if (!accountKeys) return false;

      return accountKeys.some((key: any) => 
        key?.pubkey === SOLANA_CONFIG.PROGRAM_ID || 
        key === SOLANA_CONFIG.PROGRAM_ID
      );
    } catch {
      return false;
    }
  }

  private processGameTransaction(data: any) {
    try {
      const transaction = data.result?.value;
      const logs = transaction?.meta?.logMessages || [];
      
      // Parse PIR8 game events from logs
      for (const log of logs) {
        if (log.includes('GameCreated')) {
          this.handleGameCreated(log);
        } else if (log.includes('PlayerJoined')) {
          this.handlePlayerJoined(log);
        } else if (log.includes('GameStarted')) {
          this.handleGameStarted(log);
        } else if (log.includes('MoveMade')) {
          this.handleMoveMade(log);
        } else if (log.includes('GameCompleted')) {
          this.handleGameCompleted(log);
        }
      }
    } catch (error) {
      console.error('Error processing game transaction:', error);
    }
  }

  private handleGameCreated(log: string) {
    console.log('🎮 Game Created:', log);
    // Extract game details and notify UI
  }

  private handlePlayerJoined(log: string) {
    console.log('👤 Player Joined:', log);
    // Update player count in UI
  }

  private handleGameStarted(log: string) {
    console.log('🚀 Game Started:', log);
    // Switch UI to active game mode
  }

  private handleMoveMade(log: string) {
    console.log('⚡ Move Made:', log);
    // Update game grid and player stats in real-time
  }

  private handleGameCompleted(log: string) {
    console.log('🏆 Game Completed:', log);
    // Show winner and enable claim winnings
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connect();
      }, delay);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Pump Fun Integration (based on pump-token-creator.ts)
export interface TokenCreationParams {
  name: string;
  symbol: string;
  description: string;
  imageUrl?: string;
  initialBuySOL?: number;
}

export class PumpFunCreator {
  private static readonly PUMPPORTAL_API = 'https://pumpportal.fun/api';

  static async createToken(params: TokenCreationParams) {
    try {
      const response = await fetch(`${this.PUMPPORTAL_API}/trade-local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey: '', // Will be set by wallet
          action: 'create',
          tokenMetadata: {
            name: params.name,
            symbol: params.symbol,
            description: params.description,
            image: params.imageUrl || this.getDefaultPirateImage(params.symbol),
          },
          mint: '', // Generated by PumpPortal
          denominatedInSol: 'true',
          amount: params.initialBuySOL || 0,
          slippage: 10,
          priorityFee: 0.0001,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token creation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('PumpFun token creation error:', error);
      throw error;
    }
  }

  static async getTokenInfo(mintAddress: string) {
    try {
      // Implementation based on your test file
      const response = await fetch(`${this.PUMPPORTAL_API}/token/${mintAddress}`);
      
      if (!response.ok) {
        throw new Error(`Token info fetch failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('PumpFun token info error:', error);
      throw error;
    }
  }

  private static getDefaultPirateImage(symbol: string): string {
    // Return default pirate-themed token image based on symbol
    const pirateImages = [
      'https://via.placeholder.com/400x400/FFD700/000000?text=🏴‍☠️',
      'https://via.placeholder.com/400x400/8B4513/FFD700?text=⚔️',
      'https://via.placeholder.com/400x400/DC143C/FFFFFF?text=💰',
    ];
    
    const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return pirateImages[hash % pirateImages.length];
  }

  static generateWinnerTokenMetadata(playerName: string, score: number) {
    const symbols = ['CAPT', 'PLND', 'TRSR', 'SKULL', 'SHIP'];
    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    
    return {
      name: `Captain ${playerName}`,
      symbol: `${randomSymbol}${Date.now().toString().slice(-3)}`,
      description: `🏴‍☠️ Victory token for pirate ${playerName} who scored ${score} points in PIR8 battle! Arrr! 🏴‍☠️`,
      imageUrl: this.getDefaultPirateImage(randomSymbol),
    };
  }
}

// Game Integration Helpers
export function setupGameIntegrations(gameId: string) {
  // Initialize Helius monitoring for game
  const heliusMonitor = new HeliusMonitor((transaction) => {
    // Process game-related transactions
    console.log('Game transaction detected:', transaction);
  });

  heliusMonitor.connect();

  return {
    heliusMonitor,
    cleanup: () => heliusMonitor.disconnect(),
  };
}

export async function createWinnerToken(winner: { name: string; score: number }) {
  const tokenMetadata = PumpFunCreator.generateWinnerTokenMetadata(winner.name, winner.score);
  
  try {
    const result = await PumpFunCreator.createToken({
      ...tokenMetadata,
      initialBuySOL: 0.01, // Small initial purchase
    });
    
    return {
      success: true,
      tokenAddress: result.mint,
      metadata: tokenMetadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token creation failed',
    };
  }
}