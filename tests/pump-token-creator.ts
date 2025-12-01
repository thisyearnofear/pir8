/**
 * Pump Fun Token Creator Test
 * 
 * Creates pirate-themed tokens for game winners via PumpPortal API
 * 
 * Setup:
 * 1. npm install axios bs58 @solana/web3.js dotenv
 * 2. Create .env with PUMP_API_KEY=your_pumpportal_key
 * 3. Prepare a pirate-themed image (PNG/JPEG)
 * 4. Run: npx ts-node tests/pump-token-creator.ts
 */

import axios from 'axios';
import { Keypair, PublicKey } from '@solana/web3.js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import FormData from 'form-data';

dotenv.config();

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

interface IPFSUploadResponse {
  metadataUri: string;
  metadata?: {
    name: string;
    symbol: string;
  };
}

class PumpTokenCreator {
  private apiKey: string;
  private apiUrl = 'https://pumpportal.fun/api/trade';
  private ipfsEndpoint = 'https://pump.fun/api/ipfs';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('PUMP_API_KEY is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Upload token metadata to IPFS
   */
  async uploadMetadata(
    name: string,
    symbol: string,
    description: string,
    imagePath?: string,
    links?: {
      twitter?: string;
      telegram?: string;
      website?: string;
    }
  ): Promise<IPFSUploadResponse> {
    console.log('\n📤 Uploading metadata to IPFS...');

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

    // Add image if provided
    if (imagePath && fs.existsSync(imagePath)) {
      const fileBuffer = fs.readFileSync(imagePath);
      formData.append('file', fileBuffer, 'image.png');
      console.log(`   Added image: ${imagePath}`);
    } else {
      console.log('   ⚠️  No image provided (optional)');
    }

    try {
      const response = await axios.post(this.ipfsEndpoint, formData, {
        headers: formData.getHeaders(),
        timeout: 30000,
      });

      if (response.data?.metadataUri) {
        console.log('✅ Metadata uploaded successfully');
        console.log(`   IPFS URI: ${response.data.metadataUri}`);
        return response.data;
      } else {
        throw new Error('No metadata URI in response');
      }
    } catch (error: any) {
      console.error('❌ Failed to upload metadata:', error.message);
      throw error;
    }
  }

  /**
   * Create token using Lightning API (PumpPortal handles sending)
   * RECOMMENDED: Simpler, no signing required
   */
  async createTokenLightning(
    metadata: TokenMetadata,
    mintKeypair: Keypair,
    devBuyAmount: number = 0.5,
    isMayhem: boolean = false
  ): Promise<{ signature: string; mint: string }> {
    console.log('\n🚀 Creating token via Lightning API...');

    const request: CreateTokenRequest = {
      action: 'create',
      tokenMetadata: metadata,
      mint: mintKeypair.publicKey.toBase58(),
      denominatedInSol: 'true',
      amount: devBuyAmount,
      slippage: 10,
      priorityFee: 0.0005,
      pool: 'pump',
      isMayhemMode: isMayhem ? 'true' : 'false',
    };

    console.log(`   Mint: ${mintKeypair.publicKey.toBase58()}`);
    console.log(`   Dev buy: ${devBuyAmount} SOL`);
    console.log(`   Slippage: 10%`);
    console.log(`   Priority fee: 0.0005 SOL`);

    try {
      const response = await axios.post(
        `${this.apiUrl}?api-key=${this.apiKey}`,
        request,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000,
        }
      );

      if (response.data?.signature) {
        console.log('✅ Token created successfully!');
        console.log(`   Signature: ${response.data.signature}`);
        return {
          signature: response.data.signature,
          mint: mintKeypair.publicKey.toBase58(),
        };
      } else {
        throw new Error('No signature in response');
      }
    } catch (error: any) {
      console.error('❌ Token creation failed:', error.message);
      if (error.response?.data) {
        console.error('   Response:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Get token info (display details after creation)
   */
  async getTokenInfo(mint: string): Promise<any> {
    console.log('\n📊 Fetching token info...');

    try {
      // Try Bitquery API for token data
      const response = await axios.post(
        'https://api.bitquery.io/graphql',
        {
          query: `
            query {
              solana {
                dexTrades(
                  where: { tradedToken: { address: { is: "${mint}" } } }
                  orderBy: { block: { timestamp: descending } }
                  limit: 1
                ) {
                  trade {
                    side
                    price
                  }
                }
              }
            }
          `,
        },
        { timeout: 10000 }
      );

      if (response.data?.data?.solana?.dexTrades?.length > 0) {
        const trade = response.data.data.solana.dexTrades[0];
        console.log('✅ Token is trading!');
        console.log(`   Current price: ${trade.trade.price} SOL`);
        return trade;
      } else {
        console.log('ℹ️  Token not yet on DEX (still on bonding curve)');
        return null;
      }
    } catch (error: any) {
      console.log('ℹ️  Could not fetch token data (may still be initializing)');
      return null;
    }
  }
}

/**
 * Generate pirate-themed token names
 */
function generatePirateTokenName(): { name: string; symbol: string } {
  const prefixes = [
    'Shielded', 'Treasure', 'Pirate', 'Cursed', 'Phantom',
    'Doubloon', 'Plunder', 'Nautical', 'Corsair', 'Buccaneer',
    'Seafarer', 'Galleon', 'Marauder', 'Scallywag', 'Buccaneering'
  ];

  const suffixes = [
    'Gold', 'Bounty', 'Seas', 'Chest', 'Crown',
    'Coin', 'Loot', 'Pearl', 'Kraken', 'Galleon',
    'Anchor', 'Sail', 'Wave', 'Tide', 'Harbor'
  ];

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  const name = `${prefix} ${suffix}`;
  const symbol = `$${prefix.slice(0, 2).toUpperCase()}${suffix.slice(0, 2).toUpperCase()}`;

  return { name, symbol };
}

/**
 * Full token creation flow
 */
async function createWinnerToken() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Pump Fun Token Creator - Winner Token Launch           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const PUMP_API_KEY = process.env.PUMP_API_KEY;

  if (!PUMP_API_KEY) {
    console.error('\n❌ Error: PUMP_API_KEY not found in .env');
    console.error('   Please set: PUMP_API_KEY=your_pumpportal_api_key');
    process.exit(1);
  }

  try {
    // 1. Initialize creator
    const creator = new PumpTokenCreator(PUMP_API_KEY);
    console.log('\n✅ Creator initialized');

    // 2. Generate mint keypair
    const mintKeypair = Keypair.generate();
    console.log(`\n🎲 Generated mint keypair`);
    console.log(`   Address: ${mintKeypair.publicKey.toBase58()}`);

    // 3. Generate pirate-themed names
    const { name, symbol } = generatePirateTokenName();
    console.log(`\n🏴‍☠️  Generated token names`);
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);

    // 4. Upload metadata
    const metadataResult = await creator.uploadMetadata(
      name,
      symbol,
      `Winner token from Shielded Seas pirate game. Created by legendary pirate captain!`,
      undefined, // No image for this test
      {
        twitter: 'https://x.com/shieldedseas',
        telegram: 'https://t.me/shieldedseas',
        website: 'https://shieldedseas.game',
      }
    );

    // 5. Create token
    const tokenMetadata: TokenMetadata = {
      name,
      symbol,
      uri: metadataResult.metadataUri,
    };

    const result = await creator.createTokenLightning(
      tokenMetadata,
      mintKeypair,
      0.1, // Small dev buy for testing
      false // Not using Mayhem mode yet
    );

    // 6. Display results
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 TOKEN CREATED SUCCESSFULLY!');
    console.log('═'.repeat(60));

    console.log(`\n📋 Token Details:`);
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Mint: ${mintKeypair.publicKey.toBase58()}`);

    console.log(`\n🔗 Links:`);
    console.log(`   Solscan: https://solscan.io/token/${mintKeypair.publicKey.toBase58()}?cluster=devnet`);
    console.log(`   Transaction: https://solscan.io/tx/${result.signature}?cluster=devnet`);

    console.log(`\n💎 Next Steps:`);
    console.log(`   1. Token is now live on Pump.fun bonding curve`);
    console.log(`   2. Others can buy/sell tokens immediately`);
    console.log(`   3. Watch for graduation at $69k market cap → PumpSwap`);
    console.log(`   4. Creator can claim fees anytime`);

    // 7. Attempt to get token info
    setTimeout(() => {
      creator.getTokenInfo(mintKeypair.publicKey.toBase58()).catch(() => {
        console.log('\n(Token info will be available once indexed)');
      });
    }, 5000);

  } catch (error) {
    console.error('\n❌ Token creation failed:', error);
    process.exit(1);
  }
}

// Run the creator
createWinnerToken();
