# Helius & Pump Fun Integration Testing Guide

## Quick Start

This guide provides practical test implementations for:
1. **Helius Enhanced WebSockets** - Real-time transaction monitoring
2. **Pump Fun Token Creation** - Winner token launches

---

## Part 1: Helius Integration Testing

### Setup

1. **Create Helius Account**
   ```bash
   # Go to https://dashboard.helius.dev
   # Sign up for free account
   # Get your API key from dashboard
   ```

2. **Install Dependencies**
   ```bash
   npm install @helius-labs/helius-sdk ws dotenv
   ```

3. **Create `.env` file**
   ```
   HELIUS_API_KEY=your_api_key_here
   SOLANA_RPC_URL=https://api.devnet.solana.com
   ```

---

### Test 1: Basic Transaction Subscribe (WebSocket)

**Purpose**: Monitor incoming transactions to game treasury address

**File**: `tests/helius-transaction-monitor.ts`

```typescript
import WebSocket from 'ws';

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
const GAME_TREASURY = 'YOUR_GAME_TREASURY_ADDRESS'; // Replace with actual address

class HeliusTransactionMonitor {
  private ws: WebSocket | null = null;
  private subscriptionId: number | null = null;

  async connect() {
    const wsUrl = `wss://atlas-devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ Connected to Helius WebSocket');
        this.subscribeToTransactions();
        resolve(true);
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        console.log('⚠️ WebSocket closed');
      };
    });
  }

  private subscribeToTransactions() {
    // Monitor transactions involving the game treasury
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
      console.log('📡 Transaction subscription sent');
    }
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);

      // Handle subscription confirmation
      if (message.result) {
        this.subscriptionId = message.result;
        console.log(`✅ Subscribed with ID: ${this.subscriptionId}`);
        return;
      }

      // Handle transaction updates
      if (message.params?.result?.value?.transaction) {
        const tx = message.params.result.value.transaction;
        console.log('\n🎮 TRANSACTION DETECTED');
        console.log('Signature:', tx.signatures?.[0]);
        console.log('Instructions:', tx.message?.instructions?.length);
        
        // Parse for game-relevant data
        this.parseGameTransaction(tx);
      }

      // Handle errors
      if (message.error) {
        console.error('❌ Error:', message.error);
      }
    } catch (error) {
      console.error('Parse error:', error);
    }
  }

  private parseGameTransaction(tx: any) {
    // Example: Detect deposit transactions
    const instructions = tx.message?.instructions || [];
    
    instructions.forEach((instruction: any, index: number) => {
      if (instruction.program === 'spl-token' && instruction.parsed?.type === 'transfer') {
        console.log(`  [${index}] Token transfer detected`);
        console.log(`    From: ${instruction.parsed.info.source}`);
        console.log(`    To: ${instruction.parsed.info.destination}`);
        console.log(`    Amount: ${instruction.parsed.info.tokenAmount.uiAmount}`);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      console.log('Disconnected from WebSocket');
    }
  }
}

// Test execution
async function runTest() {
  const monitor = new HeliusTransactionMonitor();
  
  try {
    await monitor.connect();
    
    // Keep connection alive for 60 seconds
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    monitor.disconnect();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTest();
```

**Expected Output:**
```
✅ Connected to Helius WebSocket
📡 Transaction subscription sent
✅ Subscribed with ID: 1

🎮 TRANSACTION DETECTED
Signature: 5Ym...abc
Instructions: 3
  [1] Token transfer detected
    From: player_wallet
    To: game_treasury
    Amount: 1.5
```

---

### Test 2: Account Balance Monitoring

**Purpose**: Track player SOL balance changes

**File**: `tests/helius-account-monitor.ts`

```typescript
import WebSocket from 'ws';

interface AccountNotification {
  lamports: number;
  owner: string;
  executable: boolean;
  rentEpoch: number;
  data?: string;
}

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

class HeliusAccountMonitor {
  private ws: WebSocket | null = null;

  async monitorAccount(publicKey: string) {
    const wsUrl = `wss://atlas-devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log(`✅ Connected to Helius WebSocket`);
        this.subscribeToAccount(publicKey);
        resolve(true);
      };

      this.ws.onerror = (error) => reject(error);

      this.ws.onmessage = (event) => {
        this.handleAccountUpdate(event.data);
      };
    });
  }

  private subscribeToAccount(publicKey: string) {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'accountSubscribe',
      params: [
        publicKey,
        {
          encoding: 'jsonParsed',
          commitment: 'confirmed',
        }
      ],
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(request));
      console.log(`📡 Monitoring account: ${publicKey}`);
    }
  }

  private handleAccountUpdate(data: string) {
    try {
      const message = JSON.parse(data);

      if (message.params?.result?.value) {
        const account: AccountNotification = message.params.result.value;
        const solBalance = account.lamports / 1_000_000_000;
        
        console.log(`\n💰 ACCOUNT UPDATE`);
        console.log(`Balance: ${solBalance.toFixed(4)} SOL`);
        console.log(`Lamports: ${account.lamports}`);
      }
    } catch (error) {
      console.error('Parse error:', error);
    }
  }

  disconnect() {
    if (this.ws) this.ws.close();
  }
}

// Test
async function testAccountMonitoring() {
  const monitor = new HeliusAccountMonitor();
  const playerWallet = 'HN7cABqLq46s2NEe1VwNVH5T1axayXfdUpjKAmChqWMb'; // Example
  
  try {
    await monitor.monitorAccount(playerWallet);
    await new Promise(resolve => setTimeout(resolve, 30000));
    monitor.disconnect();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAccountMonitoring();
```

---

### Test 3: Pump.fun Token Creation Monitoring

**Purpose**: Detect new token launches in real-time

**File**: `tests/helius-pump-monitor.ts`

```typescript
import WebSocket from 'ws';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

// Pump.fun program IDs
const PUMP_PROGRAM_ID = '6EF8rQNwhyC2dgNDVREjLAz3BsnLnuAQVY8videorqE';
const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNBhcpW2kNfZrfKBG8AJkYmRRjZrtzG5P5j';

class PumpTokenMonitor {
  private ws: WebSocket | null = null;

  async monitorPumpTokens() {
    const wsUrl = `wss://atlas-devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ Connected to Helius');
        this.subscribeToPumpProgram();
        resolve(true);
      };

      this.ws.onerror = (error) => reject(error);
      this.ws.onmessage = (event) => this.handlePumpTransaction(event.data);
    });
  }

  private subscribeToPumpProgram() {
    const filter = {
      accountInclude: [PUMP_PROGRAM_ID],
      failed: false,
      vote: false,
    };

    const options = {
      commitment: 'confirmed' as const,
      encoding: 'jsonParsed' as const,
      transactionDetails: 'full' as const,
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
      console.log('📡 Monitoring Pump.fun program for token creations');
    }
  }

  private handlePumpTransaction(data: string) {
    try {
      const message = JSON.parse(data);

      if (message.params?.result?.value?.transaction) {
        const tx = message.params.result.value.transaction;
        const instructions = tx.message?.instructions || [];

        // Look for 'create' or 'create_v2' instruction
        instructions.forEach((instr: any) => {
          if (instr.program === 'bpf-loader' || instr.programId === PUMP_PROGRAM_ID) {
            // Check if this is a token creation
            const data = instr.data || instr.parsed?.data;
            
            if (this.isTokenCreation(data)) {
              console.log('\n🚀 NEW TOKEN CREATED ON PUMP.FUN');
              console.log(`Signature: ${tx.signatures?.[0]}`);
              console.log(`Block time: ${tx.blockTime}`);
              this.parseTokenMetadata(tx);
            }
          }
        });
      }
    } catch (error) {
      console.error('Parse error:', error);
    }
  }

  private isTokenCreation(data: any): boolean {
    if (!data) return false;
    
    // Simplified check - look for create instruction discriminator
    // Real implementation would parse instruction data properly
    return data.includes?.('create') || data.includes?.('create_v2');
  }

  private parseTokenMetadata(tx: any) {
    const message = tx.message || {};
    const accountKeys = message.accountKeys || [];

    console.log(`Accounts involved: ${accountKeys.length}`);
    
    // First account after program is typically the mint
    if (accountKeys.length > 1) {
      console.log(`Mint: ${accountKeys[1]}`);
    }
  }

  disconnect() {
    if (this.ws) this.ws.close();
  }
}

// Test
async function monitorPumpCreations() {
  const monitor = new PumpTokenMonitor();
  
  try {
    await monitor.monitorPumpTokens();
    console.log('Monitoring for 120 seconds...');
    await new Promise(resolve => setTimeout(resolve, 120000));
    monitor.disconnect();
  } catch (error) {
    console.error('Monitoring failed:', error);
  }
}

monitorPumpCreations();
```

---

## Part 2: Pump Fun Token Creation Testing

### Setup

```bash
npm install axios bs58 @solana/web3.js @solana/spl-token
```

---

### Test 4: Token Creation via PumpPortal (Recommended)

**Purpose**: Create pirate-themed tokens for game winners

**File**: `tests/pump-token-creation.ts`

```typescript
import axios from 'axios';
import { Keypair } from '@solana/web3.js';
import * as bs58 from 'bs58';
import fs from 'fs';
import FormData from 'form-data';

interface TokenMetadata {
  name: string;
  symbol: string;
  uri: string;
}

interface CreateTokenRequest {
  action: 'create';
  tokenMetadata: TokenMetadata;
  mint: string;
  denominatedInSol: 'true' | 'false';
  amount: number;
  slippage: number;
  priorityFee: number;
  pool: 'pump' | 'raydium';
  isMayhemMode?: 'true' | 'false';
}

class PumpTokenCreator {
  private apiKey: string;
  private apiUrl = 'https://pumpportal.fun/api/trade';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Step 1: Upload metadata to IPFS
   */
  async uploadMetadata(
    name: string,
    symbol: string,
    description: string,
    imagePath: string,
    links?: {
      twitter?: string;
      telegram?: string;
      website?: string;
    }
  ): Promise<{ metadataUri: string }> {
    const formData = new FormData();
    
    // Add metadata fields
    formData.append('name', name);
    formData.append('symbol', symbol);
    formData.append('description', description);
    formData.append('showName', 'true');

    // Add optional links
    if (links?.twitter) formData.append('twitter', links.twitter);
    if (links?.telegram) formData.append('telegram', links.telegram);
    if (links?.website) formData.append('website', links.website);

    // Add image
    const fileStream = fs.createReadStream(imagePath);
    formData.append('file', fileStream, 'image.png');

    try {
      const response = await axios.post(
        'https://pump.fun/api/ipfs',
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 30000,
        }
      );

      console.log('✅ Metadata uploaded to IPFS');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to upload metadata:', error);
      throw error;
    }
  }

  /**
   * Step 2: Create token (Lightning API - we handle sending)
   */
  async createTokenLightning(
    metadata: TokenMetadata,
    mintKeypair: Keypair,
    devBuyAmount: number = 1.0
  ): Promise<{ signature: string }> {
    const request: CreateTokenRequest = {
      action: 'create',
      tokenMetadata: metadata,
      mint: mintKeypair.publicKey.toBase58(),
      denominatedInSol: 'true',
      amount: devBuyAmount,
      slippage: 10,
      priorityFee: 0.0005,
      pool: 'pump',
      isMayhemMode: 'false', // Set to true only for Mayhem mode coins
    };

    try {
      const response = await axios.post(
        `${this.apiUrl}?api-key=${this.apiKey}`,
        request,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      );

      console.log('✅ Token created successfully');
      console.log(`Signature: ${response.data.signature}`);
      return response.data;
    } catch (error) {
      console.error('❌ Token creation failed:', error);
      throw error;
    }
  }

  /**
   * Step 3: Create token (Local API - you sign)
   * Use this for more control over signing
   */
  async createTokenLocal(
    publicKey: string,
    metadata: TokenMetadata,
    mintKeypair: Keypair,
    devBuyAmount: number = 1.0
  ): Promise<{ transactions: string[] }> {
    const request = {
      publicKey,
      action: 'create',
      tokenMetadata: metadata,
      mint: mintKeypair.publicKey.toBase58(),
      denominatedInSol: 'true',
      amount: devBuyAmount,
      slippage: 10,
      priorityFee: 0.0005,
      pool: 'pump',
    };

    try {
      const response = await axios.post(
        'https://pumpportal.fun/api/trade-local',
        request,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      console.log('✅ Transaction generated');
      return response.data;
    } catch (error) {
      console.error('❌ Transaction generation failed:', error);
      throw error;
    }
  }
}

/**
 * Full example: Create a pirate-themed token for a game winner
 */
async function createWinnerToken() {
  // Step 1: Setup
  const PUMP_API_KEY = process.env.PUMP_API_KEY || 'demo-key';
  const creator = new PumpTokenCreator(PUMP_API_KEY);

  // Step 2: Generate mint keypair
  const mintKeypair = Keypair.generate();
  console.log(`🎲 Generated mint: ${mintKeypair.publicKey.toBase58()}`);

  // Step 3: Prepare metadata
  const metadata = {
    name: 'Pirate Gold',
    symbol: '$PGOLD',
    description: 'Winner token from Shielded Seas pirate game',
  };

  // Step 4: Upload metadata (requires image)
  let metadataUri: string;
  try {
    // Note: This requires an actual image file
    const result = await creator.uploadMetadata(
      metadata.name,
      metadata.symbol,
      metadata.description,
      './assets/pirate-icon.png', // Path to your image
      {
        twitter: 'https://twitter.com/shieldedseas',
        telegram: 'https://t.me/shieldedseas',
        website: 'https://shieldedseas.game',
      }
    );
    metadataUri = result.metadataUri;
  } catch (error) {
    console.warn('⚠️ Skipping image upload in test');
    // Use placeholder URI for testing
    metadataUri = 'https://bafkreid4bw4oirw3vfwvbkk...'; // Example
  }

  // Step 5: Create token
  const tokenMetadata: TokenMetadata = {
    name: metadata.name,
    symbol: metadata.symbol,
    uri: metadataUri,
  };

  try {
    const result = await creator.createTokenLightning(tokenMetadata, mintKeypair, 0.5);
    
    console.log('\n🎉 TOKEN CREATED SUCCESSFULLY');
    console.log(`Mint: ${mintKeypair.publicKey.toBase58()}`);
    console.log(`Signature: ${result.signature}`);
    console.log(`View on Solscan: https://solscan.io/tx/${result.signature}?cluster=devnet`);
  } catch (error) {
    console.error('Failed to create token:', error);
  }
}

// Run test
createWinnerToken();
```

---

### Test 5: Verify Token Creation + Get Price

**Purpose**: Confirm token was created and monitor price

**File**: `tests/pump-token-verify.ts`

```typescript
import axios from 'axios';

class PumpTokenVerifier {
  /**
   * Get token info from Bitquery
   */
  async getTokenInfo(mintAddress: string) {
    const query = `
      query {
        solana {
          dexTrades(
            where: {
              tradedToken: { address: { is: "${mintAddress}" } }
              trade: { side: buy }
            }
            orderBy: { block: { timestamp: descending } }
            limit: 1
          ) {
            trade {
              side
              price
            }
            block {
              timestamp
            }
          }
        }
      }
    `;

    try {
      const response = await axios.post('https://api.bitquery.io/graphql', {
        query,
      });

      if (response.data.data?.solana?.dexTrades?.length > 0) {
        const trade = response.data.data.solana.dexTrades[0];
        console.log('✅ Token found on DEX');
        console.log(`Current price: ${trade.trade.price} SOL`);
        return trade;
      } else {
        console.log('⏳ Token not yet tradeable (still on bonding curve)');
        return null;
      }
    } catch (error) {
      console.error('Error fetching token info:', error);
      return null;
    }
  }

  /**
   * Get token metadata from Pump.fun
   */
  async getTokenMetadata(mintAddress: string) {
    try {
      // Note: Official Pump.fun API endpoints may vary
      // This is a common pattern
      const response = await axios.get(
        `https://api.pump.fun/v1/tokens/${mintAddress}`
      );

      console.log('✅ Token metadata:');
      console.log(`Name: ${response.data.name}`);
      console.log(`Symbol: ${response.data.symbol}`);
      console.log(`Holders: ${response.data.holders}`);
      console.log(`Market cap: ${response.data.marketCap}`);

      return response.data;
    } catch (error) {
      console.log('ℹ️ Could not fetch metadata (API endpoint may vary)');
      return null;
    }
  }

  /**
   * Track token graduation (when it hits $69k market cap)
   */
  async monitorGraduation(mintAddress: string, pollIntervalSeconds = 60) {
    console.log(`📊 Monitoring ${mintAddress} for graduation...`);
    console.log(`Target: $69,000 market cap for graduation to PumpSwap`);

    let isGraduated = false;
    let pollCount = 0;
    const maxPolls = 60; // 1 hour at 60 second intervals

    while (!isGraduated && pollCount < maxPolls) {
      try {
        const metadata = await this.getTokenMetadata(mintAddress);
        
        if (metadata && metadata.marketCap) {
          const marketCap = parseFloat(metadata.marketCap);
          console.log(`\n[${new Date().toLocaleTimeString()}] Market cap: $${marketCap.toFixed(0)}`);

          if (marketCap >= 69000) {
            isGraduated = true;
            console.log('🎓 TOKEN GRADUATED TO PUMPSWAP!');
            console.log(`🔗 PumpSwap link: https://pumpswap.xyz/${mintAddress}`);
          }
        }
      } catch (error) {
        console.error('Error checking graduation status:', error);
      }

      if (!isGraduated) {
        await new Promise(resolve => 
          setTimeout(resolve, pollIntervalSeconds * 1000)
        );
        pollCount++;
      }
    }

    if (!isGraduated) {
      console.log('⏰ Monitoring timeout reached');
    }
  }
}

// Test
async function verifyToken() {
  const verifier = new PumpTokenVerifier();
  
  // Example: Use a real token or your created token
  const testMint = 'TOKEN_MINT_ADDRESS'; // Replace with actual mint
  
  // Get basic info
  await verifier.getTokenInfo(testMint);
  
  // Get metadata
  await verifier.getTokenMetadata(testMint);
  
  // Monitor graduation (runs until $69k or timeout)
  // await verifier.monitorGraduation(testMint, 30);
}

verifyToken();
```

---

## Part 3: Integration Checklist

### Helius Setup ✅

- [ ] Create free Helius account: https://dashboard.helius.dev
- [ ] Get API key from dashboard
- [ ] Add API key to `.env` file
- [ ] Test basic WebSocket connection
- [ ] Verify transaction filtering works
- [ ] Set up account monitoring for game treasury
- [ ] Implement 1-minute ping to keep WebSocket alive

### Pump Fun Setup ✅

- [ ] Get PumpPortal API key (or use Pump.fun directly)
- [ ] Prepare pirate-themed token image (logo)
- [ ] Test token creation on devnet
- [ ] Verify metadata upload to IPFS
- [ ] Test token creation with `isMayhemMode: false`
- [ ] Test token price monitoring
- [ ] Set up graduation detection (at $69k)

### Game Integration Points 🎮

| Component | Helius | Pump Fun |
|-----------|--------|----------|
| **Deposit Detection** | ✅ Transaction Subscribe | ❌ Not needed |
| **Player Balance** | ✅ Account Subscribe | ❌ Not needed |
| **Winner Rewards** | ❌ Not needed | ✅ Token Creation |
| **Real-time Updates** | ✅ WebSocket | ✅ Query API |
| **Security** | ✅ Verified on-chain | ✅ Immutable smart contract |

---

## Part 4: Running Tests

```bash
# Install all dependencies
npm install

# Test Helius transaction monitoring (30 seconds)
npx ts-node tests/helius-transaction-monitor.ts

# Test Helius account monitoring (30 seconds)
npx ts-node tests/helius-account-monitor.ts

# Test Pump.fun token creation
npx ts-node tests/pump-token-creation.ts

# Verify token was created
npx ts-node tests/pump-token-verify.ts
```

---

## Part 5: Troubleshooting

| Issue | Solution |
|-------|----------|
| WebSocket connection timeout | Check API key, verify HELIUS_API_KEY in .env |
| Transaction not detected | Ensure game treasury address is correct |
| Token creation fails | Verify PumpPortal API key, check SOL balance for dev buy |
| Image upload fails | Ensure image file exists and is PNG/JPEG |
| No metadata | Check IPFS upload response, verify URI format |

---

## Next Steps

1. ✅ Complete all 5 tests
2. ✅ Document real game treasury address
3. ✅ Create token image asset
4. ✅ Set up production API keys
5. ✅ Integrate into Next.js frontend
6. ✅ Connect to Solana smart contract

See `INTEGRATION_TESTING.md` for more details.
