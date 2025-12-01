# Pump Fun API Specification & Winner Token Flow

## Overview

This document details how to integrate Pump Fun token creation into the Pirate Game as rewards for winners.

---

## Part 1: Token Creation Flow for Game Winners

### Scenario: Winner Creates Pirate Coin

```
Winner Plays Game → Wins SOL
    ↓
Winner Claims Prize → Triggers Token Creation
    ↓
Backend API receives request
    ↓
Upload token metadata (name, symbol, description, image) → IPFS
    ↓
Call Pump Fun API to create token
    ↓
Token deployed on bonding curve
    ↓
Winner receives minted tokens
    ↓
Token shown in leaderboard
    ↓
Token can graduate to PumpSwap at $69k market cap
```

---

## Part 2: API Options Comparison

### Option A: PumpPortal (RECOMMENDED FOR MVP)

**Pros:**
- Simple HTTP API
- No wallet signing required (we handle it)
- Fast token creation (2-3 seconds)
- Built-in error handling

**Cons:**
- Third-party API (but battle-tested)
- Less control over transaction details

**Best for:** Game winners, quick launches

---

### Option B: Direct Pump.fun Contract (RECOMMENDED FOR ADVANCED)

**Pros:**
- Full control over transaction
- Can use Mayhem mode
- Direct contract interaction
- Lower latency

**Cons:**
- Requires keypair signing
- More complex implementation
- Need to parse contract errors

**Best for:** Advanced features, creator fee management

---

### Option C: Bitquery Data API (DATA ONLY)

**Pros:**
- Real-time token prices
- Historical data
- No token creation (just monitoring)

**Cons:**
- Requires GraphQL knowledge
- Separate from creation

**Best for:** Leaderboards, price tracking

---

## Part 3: Pump Fun Breaking Changes (November 2025)

### Critical Update: `create_v2` Instruction

**What Changed:**
1. New instruction `create_v2` replaces deprecated `create`
2. Uses Token2022 program (not Metaplex)
3. Introduces `isMayhemMode` boolean parameter

**Migration Path:**

```typescript
// OLD (deprecated)
const createIx = {
  program: 'pump',
  instruction: 'create',
  accounts: [/* old accounts */],
};

// NEW (required for future)
const createV2Ix = {
  program: 'pump',
  instruction: 'create_v2',
  accounts: [/* new accounts including Token2022 */],
  data: {
    isMayhemMode: false, // or true for Mayhem mode
  },
};
```

**Account Changes:**

| Index | Account | OLD | NEW | Required |
|-------|---------|-----|-----|----------|
| 8 | Token Program | Legacy Token | Token2022 | Yes |
| 10 | Mayhem Program | N/A | NEW | Yes if create_v2 |
| 11 | Global Params | N/A | NEW | Yes if create_v2 |
| 12 | Sol Vault | N/A | NEW | Yes if create_v2 |
| 13 | Mayhem State | N/A | NEW | Yes if create_v2 |

**Data Structure Changes:**

```
BondingCurve: 81 bytes → 82 bytes (added is_mayhem_mode: bool)
Pool: 243 bytes → 244 bytes (added is_mayhem_mode: bool)
```

---

## Part 4: Recommended Implementation Strategy

### For MVP (Weeks 1-3)

Use **PumpPortal Lightning API**:
- Simple HTTP requests
- No contract knowledge needed
- Focus on game integration

```typescript
// Simple MVP approach
async createWinnerToken(winner: Player, tokenName: string) {
  const response = await fetch('https://pumpportal.fun/api/trade?api-key=YOUR_KEY', {
    method: 'POST',
    body: JSON.stringify({
      action: 'create',
      tokenMetadata: {
        name: tokenName,
        symbol: generateSymbol(winner),
        uri: metadataUri,
      },
      mint: generateMint(),
      denominatedInSol: 'true',
      amount: 0.5, // Dev buy amount
      slippage: 10,
      priorityFee: 0.0005,
      pool: 'pump',
    }),
  });
  
  return response.json();
}
```

### For Production (Weeks 4+)

Use **Direct Contract + create_v2**:
- Full control
- Mayhem mode support
- Creator fee management

```typescript
// Advanced production approach
async createTokenWithV2(
  winner: Player,
  tokenName: string,
  isMayhem: boolean
) {
  // Build create_v2 instruction
  const ix = await buildCreateV2Instruction({
    mint: generateMint(),
    name: tokenName,
    symbol: generateSymbol(winner),
    uri: metadataUri,
    isMayhemMode: isMayhem,
    initialBuy: 0.5,
  });

  // Sign and send
  const tx = await signAndSendTransaction(ix);
  return tx;
}
```

---

## Part 5: Token Metadata Strategy

### Pirate-Themed Token Names

For immersive gameplay, generate pirate-themed token names:

```typescript
const piratePrefixes = [
  'Shielded', 'Treasure', 'Pirate', 'Cursed', 'Phantom',
  'Doubloon', 'Plunder', 'Nautical', 'Corsair', 'Buccaneer'
];

const pirateSuffixes = [
  'Gold', 'Bounty', 'Seas', 'Chest', 'Crown',
  'Coin', 'Loot', 'Pearl', 'Kraken', 'Galleon'
];

function generateTokenName(winner: Player): string {
  const prefix = piratePrefixes[Math.random() * piratePrefixes.length];
  const suffix = pirateSuffixes[Math.random() * pirateSuffixes.length];
  return `${prefix} ${suffix}`;
}

function generateSymbol(winner: Player): string {
  // First 2 letters of winner + random 2 chars
  const prefix = winner.name.slice(0, 2).toUpperCase();
  const random = Math.random().toString(36).slice(2, 4).toUpperCase();
  return `$${prefix}${random}`;
}
```

### Metadata JSON Structure

```json
{
  "name": "Shielded Gold",
  "symbol": "$SHG1",
  "description": "Winner token from Shielded Seas pirate game. Launched by @winner_username after epic gameplay.",
  "image": "ipfs://QmXxxx...",
  "twitter": "https://twitter.com/shieldedseas",
  "telegram": "https://t.me/shieldedseas",
  "website": "https://shieldedseas.game"
}
```

---

## Part 6: Fee Structure & Economics

### Pump Fun Fees

**Creation Fee:** FREE (included in trading fees)

**Trading Fees:**
- **Platform fee:** 1% on buy/sell
- **Creator fee:** Varies (configurable via `create_v2`)
- **SOL network fee:** ~$0.001

### Example Scenario

```
Winner claims prize:
  - Dev buy amount: 1 SOL
  - Platform fee (1%): 0.01 SOL
  - Network fee: 0.001 SOL
  - Winner receives: Tokens at bonding curve price
  
Total cost to game: ~1.01 SOL per winner token
```

### Bonding Curve Economics

```
Tokens 0 → 500M: Bonding curve active
  - Price increases as more tokens bought
  - All trades go to bonding curve smart contract
  
Tokens 500M → 800M: Final bonding curve phase
  - Price approaching peak
  - ~99% of trading volume here

Tokens 800M+ : GRADUATION TRIGGERED
  - Token "graduates" to PumpSwap
  - Liquidity pool created automatically
  - Price now determined by AMM (constant product formula)
```

**Key Milestone:** $69,000 market cap = 800M tokens sold

---

## Part 7: Monitoring Token Performance

### Post-Creation Checklist

```typescript
interface TokenMonitoring {
  // 1. Verify creation
  confirmCreation(signature: string): Promise<{
    mint: string;
    initialPrice: number;
  }>;

  // 2. Track price
  getTokenPrice(mint: string): Promise<{
    currentPrice: number;
    marketCap: number;
    volume24h: number;
  }>;

  // 3. Monitor graduation
  watchForGraduation(mint: string): Promise<{
    graduated: boolean;
    pumpswapLink?: string;
    timestamp?: number;
  }>;

  // 4. Get holder info
  getHolders(mint: string): Promise<{
    totalHolders: number;
    topHolder: string;
    winnerHolding: number;
  }>;
}
```

### Recommended Monitoring Queries

**Bitquery Example:**

```graphql
query GetTokenMetrics($mint: String!) {
  solana {
    # Get current price
    dexTrades(
      where: { tradedToken: { address: { is: $mint } } }
      orderBy: { block: { timestamp: descending } }
      limit: 1
    ) {
      trade { price }
    }

    # Get market cap
    tokens(where: { address: { is: $mint } }) {
      address
      supply
      decimals
    }

    # Get volume
    dexTrades(
      where: { 
        tradedToken: { address: { is: $mint } }
        block: { timestamp: { after: "now-24h" } }
      }
    ) {
      tradeAmount(in: USD)
    }
  }
}
```

---

## Part 8: Mayhem Mode Consideration

### What is Mayhem Mode?

New feature allowing tokens to have special characteristics:
- Different fee recipient
- Optional autonomous trading (AI)
- Enhanced metadata

### Current Status for Game

**Recommendation:** ❌ **DON'T USE for MVP**

Reasons:
- Recently added (November 2025)
- Requires Mayhem program interaction
- Additional complexity for launch
- Use simple `isMayhemMode: false` for MVP

### Future Enhancement

After MVP launch, evaluate Mayhem mode for:
- Advanced token features
- AI-powered trading bots
- Community-managed tokens

```typescript
// FUTURE: Mayhem mode implementation
const mayhemFeeRecipients = [
  'GesfTA3X2arioaHp8bbKdjG9vJtskViWACZoYvxp4twS',
  '4budycTjhs9fD6xw62VBducVTNgMgJJ5BgtKq7mAZwn6',
  // ... more recipients
];

async function createMayhemToken(winner: Player) {
  const feeRecipient = mayhemFeeRecipients[
    Math.floor(Math.random() * mayhemFeeRecipients.length)
  ];

  return createToken({
    ...tokenData,
    isMayhemMode: true,
    feeRecipient,
  });
}
```

---

## Part 9: Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid metadata URI" | Image upload failed | Retry IPFS upload |
| "Insufficient balance" | No SOL for dev buy | Fund game treasury |
| "Token already exists" | Duplicate mint | Generate new keypair |
| "Invalid account" | Wrong Token2022 setup | Use create_v2 accounts |
| "Signature failed" | Bad transaction | Retry with higher priority fee |

### Retry Logic

```typescript
async function createTokenWithRetry(
  metadata: TokenMetadata,
  maxRetries: number = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await createToken(metadata);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Increase priority fee on retry
      const delayMs = 1000 * (i + 1);
      await sleep(delayMs);
    }
  }
}
```

---

## Part 10: Integration Checklist

### Before Launch

- [ ] PumpPortal API key obtained
- [ ] Test token creation on devnet
- [ ] Image upload to IPFS verified
- [ ] Metadata structure validated
- [ ] Winner claiming flow tested
- [ ] Token appears in leaderboard
- [ ] Price monitoring works
- [ ] Graduation detection implemented
- [ ] Error handling tested
- [ ] Production API keys configured

### Post-Launch Monitoring

- [ ] Track token creation success rate
- [ ] Monitor failed creations
- [ ] Log all token mints
- [ ] Track graduation events
- [ ] Measure winner satisfaction
- [ ] Monitor gas/network costs

---

## References

- PumpPortal API: https://pumpportal.fun/
- Pump.fun Docs: https://github.com/pump-fun/pump-public-docs
- Bitquery Pump.fun API: https://docs.bitquery.io/docs/blockchain/Solana/Pumpfun/Pump-Fun-API/
- create_v2 Breaking Changes: https://github.com/pump-fun/pump-public-docs/blob/main/docs/PUMP_PROGRAM_README.md

---

## Questions?

For specific integration help, refer to:
1. `INTEGRATION_TESTING.md` - Test implementations
2. `tests/pump-token-creation.ts` - Code examples
3. Discord: https://t.me/PumpPortalAPI
