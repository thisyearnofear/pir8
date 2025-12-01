/**
 * Helius Transaction Monitor Test
 * 
 * Tests real-time transaction monitoring via Enhanced WebSocket
 * Use this to detect deposits to game treasury address
 * 
 * Setup:
 * 1. npm install ws dotenv
 * 2. Create .env with HELIUS_API_KEY=your_api_key
 * 3. Replace GAME_TREASURY with your address
 * 4. Run: npx ts-node tests/helius-transaction-monitor.ts
 */

import WebSocket from 'ws';
import * as dotenv from 'dotenv';

dotenv.config();

interface TransactionSubscribeFilter {
  vote?: boolean;
  failed?: boolean;
  signature?: string;
  accountInclude?: string[];
  accountExclude?: string[];
  accountRequired?: string[];
}

interface TransactionSubscribeOptions {
  commitment?: 'processed' | 'confirmed' | 'finalized';
  encoding?: 'base58' | 'base64' | 'jsonParsed';
  transactionDetails?: 'full' | 'signatures' | 'accounts' | 'none';
  maxSupportedTransactionVersion?: number;
}

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const GAME_TREASURY = process.env.GAME_TREASURY || 'HN7cABqLq46s2NEe1VwNVH5T1axayXfdUpjKAmChqWMb';

if (!HELIUS_API_KEY) {
  console.error('❌ HELIUS_API_KEY not found in .env file');
  process.exit(1);
}

class HeliusTransactionMonitor {
  private ws: WebSocket | null = null;
  private subscriptionId: number | null = null;
  private keepAliveInterval: NodeJS.Timeout | null = null;

  /**
   * Connect to Helius Enhanced WebSocket
   */
  async connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const wsUrl = `wss://atlas-devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
      
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ Connected to Helius WebSocket');
          this.startKeepAlive();
          this.subscribeToTransactions();
          resolve(true);
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error.message);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = () => {
          console.log('⚠️ WebSocket closed');
          this.stopKeepAlive();
        };

        // 30 second connection timeout
        setTimeout(() => {
          if (!this.subscriptionId) {
            reject(new Error('Subscription timeout'));
          }
        }, 30000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Keep WebSocket alive with ping every 60 seconds
   */
  private startKeepAlive() {
    this.keepAliveInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const ping = {
          jsonrpc: '2.0',
          id: Math.random(),
          method: 'ping',
        };
        this.ws.send(JSON.stringify(ping));
      }
    }, 60000);
  }

  private stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  /**
   * Subscribe to transactions involving game treasury
   */
  private subscribeToTransactions() {
    const filter: TransactionSubscribeFilter = {
      accountInclude: [GAME_TREASURY],
      failed: false,
      vote: false,
    };

    const options: TransactionSubscribeOptions = {
      commitment: 'confirmed',
      encoding: 'jsonParsed',
      transactionDetails: 'full',
      maxSupportedTransactionVersion: 0,
    };

    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'transactionSubscribe',
      params: [filter, options],
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(request));
      console.log(`📡 Subscribed to transactions for: ${GAME_TREASURY}`);
      console.log('   (excluding failed transactions and vote txs)\n');
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);

      // Handle subscription confirmation
      if (message.result && !message.params) {
        this.subscriptionId = message.result;
        console.log(`✅ Subscription confirmed (ID: ${this.subscriptionId})`);
        console.log('   Listening for transactions...\n');
        return;
      }

      // Handle pong response
      if (message.method === 'pong') {
        return; // Silent keep-alive
      }

      // Handle transaction updates
      if (message.params?.result?.value?.transaction) {
        const tx = message.params.result.value.transaction;
        this.handleTransaction(tx);
      }

      // Handle errors
      if (message.error) {
        console.error('❌ Subscription error:', message.error.message);
      }
    } catch (error) {
      console.error('Parse error:', error);
    }
  }

  /**
   * Process detected transaction
   */
  private handleTransaction(tx: any) {
    console.log('\n' + '═'.repeat(60));
    console.log('🎮 TRANSACTION DETECTED');
    console.log('═'.repeat(60));

    // Transaction signature
    const signature = tx.signatures?.[0] || 'N/A';
    console.log(`\n📝 Signature: ${signature}`);
    console.log(`   View: https://solscan.io/tx/${signature}?cluster=devnet`);

    // Block time
    if (tx.blockTime) {
      const date = new Date(tx.blockTime * 1000);
      console.log(`\n⏰ Time: ${date.toLocaleTimeString()}`);
    }

    // Account keys
    const accounts = tx.message?.accountKeys || [];
    console.log(`\n👥 Accounts involved: ${accounts.length}`);
    if (accounts.length > 0) {
      console.log(`   [0] (Signer): ${accounts[0]}`);
      for (let i = 1; i < Math.min(5, accounts.length); i++) {
        console.log(`   [${i}]: ${accounts[i]}`);
      }
      if (accounts.length > 5) {
        console.log(`   ... and ${accounts.length - 5} more`);
      }
    }

    // Instructions
    const instructions = tx.message?.instructions || [];
    console.log(`\n⚙️  Instructions: ${instructions.length}`);

    instructions.forEach((instruction: any, index: number) => {
      const program = instruction.program || instruction.programId || 'unknown';
      
      console.log(`\n   [${index}] ${program}`);

      // Parse token transfers
      if (instruction.program === 'spl-token') {
        const parsed = instruction.parsed;
        if (parsed?.type === 'transfer' || parsed?.type === 'transferChecked') {
          console.log(`       Type: ${parsed.type}`);
          console.log(`       From: ${parsed.info?.source}`);
          console.log(`       To: ${parsed.info?.destination}`);
          
          const amount = parsed.info?.tokenAmount?.uiAmount || parsed.info?.amount;
          const decimals = parsed.info?.tokenAmount?.decimals || 0;
          console.log(`       Amount: ${amount} (${decimals} decimals)`);
          
          // Detect game deposits
          if (parsed.info?.destination === GAME_TREASURY) {
            console.log(`       💰 GAME DEPOSIT DETECTED!`);
          }
        }

        if (parsed?.type === 'initializeMint') {
          console.log(`       Type: Token creation`);
          console.log(`       Mint: ${parsed.info?.mint}`);
        }
      }

      // Parse system transfers (SOL)
      if (instruction.program === 'system') {
        const parsed = instruction.parsed;
        if (parsed?.type === 'transfer') {
          const amount = (parsed.info?.lamports || 0) / 1_000_000_000;
          console.log(`       Type: SOL Transfer`);
          console.log(`       From: ${parsed.info?.source}`);
          console.log(`       To: ${parsed.info?.destination}`);
          console.log(`       Amount: ${amount.toFixed(6)} SOL`);
          
          // Detect SOL deposits
          if (parsed.info?.destination === GAME_TREASURY) {
            console.log(`       💰 SOL DEPOSIT DETECTED!`);
          }
        }
      }

      // Parse Pump.fun program interactions
      if (program === '6EF8rQNwhyC2dgNDVREjLAz3BsnLnuAQVY8videorqE') {
        console.log(`       Type: Pump.fun interaction`);
        // Would need instruction parsing here
      }
    });

    // Summary
    console.log('\n' + '─'.repeat(60) + '\n');
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    this.stopKeepAlive();
    if (this.ws) {
      this.ws.close();
      console.log('\n✅ Disconnected');
    }
  }
}

/**
 * Run the monitor test
 */
async function runMonitor() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Helius Enhanced WebSocket - Transaction Monitor        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const monitor = new HeliusTransactionMonitor();

  try {
    console.log('🔌 Connecting to Helius...\n');
    await monitor.connect();

    console.log('⏱️  Monitoring for 120 seconds...');
    console.log('(Send transactions involving the treasury address to see them here)\n');

    // Run for 2 minutes
    await new Promise((resolve) => setTimeout(resolve, 120000));

    monitor.disconnect();
    console.log('Test completed!');
  } catch (error) {
    console.error('\n❌ Monitor failed:', error);
    monitor.disconnect();
    process.exit(1);
  }
}

runMonitor();
