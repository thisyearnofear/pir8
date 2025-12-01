# Quick Reference: Helius & Pump Fun APIs

One-page cheat sheet for both integrations.

---

## Zcash: Shielded Memo Schema (for Private Entry)

Schema (JSON in memo):

```
{
  "v": "1",
  "gameId": "onchain_...",
  "solanaPubkey": "...",
  "amountZEC": 0.1
}
```

Watcher responsibilities:

- Consume shielded memo via lightwalletd
- Validate schema version and fields
- Trigger Solana join/create for `gameId`
- Credit off-chain record with `amountZEC`

Environment:

- `NEXT_PUBLIC_LIGHTWALLETD_URL`
- `NEXT_PUBLIC_ZCASH_SHIELDED_ADDR`
- `NEXT_PUBLIC_TREASURY_ADDRESS`

Operator Instructions:

```bash
npx tsx tests/zcash-memo-watcher.ts --memo '{"v":"1","gameId":"onchain_1","solanaPubkey":"YOUR_KEY","amountZEC":0.1}'
```

Parsing helper exists in `src/lib/integrations.ts:268`.

---

## Helius: Real-Time Deposit Monitoring

### Connection

```typescript
const ws = new WebSocket("wss://atlas-devnet.helius-rpc.com/?api-key=YOUR_KEY");
```

### Subscribe to Transactions

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "transactionSubscribe",
  "params": [
    {
      "accountInclude": ["GAME_TREASURY_ADDRESS"],
      "failed": false,
      "vote": false
    },
    {
      "commitment": "confirmed",
      "encoding": "jsonParsed",
      "transactionDetails": "full",
      "maxSupportedTransactionVersion": 0
    }
  ]
}
```

### Handle Deposit

```typescript
// In onmessage handler:
const tx = message.params.result.value.transaction;
const instructions = tx.message.instructions;

instructions.forEach((instr) => {
  if (
    instr.program === "spl-token" &&
    instr.parsed.type === "transfer" &&
    instr.parsed.info.destination === GAME_TREASURY
  ) {
    const amount = instr.parsed.info.tokenAmount.uiAmount;
    console.log(`Deposit: ${amount} tokens`);
  }

  if (
    instr.program === "system" &&
    instr.parsed.type === "transfer" &&
    instr.parsed.info.destination === GAME_TREASURY
  ) {
    const amount = instr.parsed.info.lamports / 1e9;
    console.log(`Deposit: ${amount} SOL`);
  }
});
```

### Keep WebSocket Alive

```typescript
// Send ping every 60 seconds
setInterval(() => {
  ws.send(
    JSON.stringify({
      jsonrpc: "2.0",
      id: Math.random(),
      method: "ping",
    })
  );
}, 60000);
```

### Pricing

- **Free Tier**: 1M credits/month (~100k WebSocket calls)
- **WebSocket usage**: No additional cost
- **Enhanced Transactions**: 1 credit per event

---

## Pump Fun: Winner Token Creation

### Option A: Lightning API (Recommended)

```typescript
const response = await fetch(
  "https://pumpportal.fun/api/trade?api-key=YOUR_KEY",
  {
    method: "POST",
    body: JSON.stringify({
      action: "create",
      tokenMetadata: {
        name: "Shielded Gold",
        symbol: "$SGLD",
        uri: "https://ipfs.io/ipfs/QmXxxx...",
      },
      mint: "NEW_MINT_ADDRESS",
      denominatedInSol: "true",
      amount: 0.5, // Dev buy amount
      slippage: 10,
      priorityFee: 0.0005,
      pool: "pump",
      isMayhemMode: "false",
    }),
  }
);

const { signature, mint } = await response.json();
```

### Option B: Upload Metadata to IPFS

```typescript
const formData = new FormData();
formData.append("name", "Shielded Gold");
formData.append("symbol", "$SGLD");
formData.append("description", "Winner token");
formData.append("file", imageBuffer, "image.png");
formData.append("twitter", "https://twitter.com/...");

const result = await fetch("https://pump.fun/api/ipfs", {
  method: "POST",
  body: formData,
});

const { metadataUri } = await result.json();
```

### Query Token Info

```graphql
query {
  solana {
    dexTrades(
      where: { tradedToken: { address: { is: "MINT_ADDRESS" } } }
      orderBy: { block: { timestamp: descending } }
      limit: 1
    ) {
      trade {
        price
      }
      block {
        timestamp
      }
    }
  }
}
```

### Monitoring Graduation

```typescript
// Check periodically for $69k market cap
const interval = setInterval(async () => {
  const { marketCap } = await getTokenMetadata(mint);

  if (marketCap >= 69000) {
    console.log("🎓 Graduated to PumpSwap!");
    clearInterval(interval);
  }
}, 30000); // Check every 30 seconds
```

### Pricing

- **Token Creation**: FREE (1% platform fee on dev buy)
- **API Calls**: FREE (for Lightning & Local APIs)
- **Data API**: Varies by provider (Bitquery, etc)

### Token Lifecycle

```
Created (Bonding Curve)
    ↓ (as people buy)
Growing (Still Bonding Curve)
    ↓ (at 800M tokens sold)
Graduating (moving to PumpSwap)
    ↓ (at $69k market cap)
Graduated (Live on PumpSwap AMM)
    ↓ (if strong community)
Moon 🌙
```

---

## Create_v2 Breaking Change (Nov 2025)

### Old (Deprecated)

```typescript
const ix = new TransactionInstruction({
  programId: PUMP_PROGRAM_ID,
  keys: [...accounts],
  data: Buffer.from([0, ...otherData]), // create instruction
});
```

### New (Required)

```typescript
const ix = new TransactionInstruction({
  programId: PUMP_PROGRAM_ID,
  keys: [
    ...oldAccounts,
    new AccountMeta(MAYHEM_PROGRAM_ID, false, false),
    new AccountMeta(GLOBAL_PARAMS, false, true),
    new AccountMeta(SOL_VAULT, false, false),
    new AccountMeta(MAYHEM_STATE, false, false),
    new AccountMeta(MAYHEM_TOKEN_VAULT, false, false),
  ],
  data: Buffer.from([1, ...otherData, isMayhemMode ? 1 : 0]), // create_v2
});
```

### Account Addresses (Static)

```
Mayhem Program: MAyhSmzXzV1pTf7LsNkrNwkWKTo4ougAJ1PPg47MD4e
Global Params: 13ec7XdrjF3h3YcqBTFDSReRcUFwbCnJaAQspM4j6DDJ
Sol Vault: BwWK17cbHxwWBKZkUYvzxLcNQ1YVyaFezduWbtm2de6s
```

### MVP Recommendation

**Don't use Mayhem mode yet.** Use `isMayhemMode: false` and defer this complexity.

---

## Helius vs Webhooks

| Helius WebSocket       | Helius Webhooks               |
| ---------------------- | ----------------------------- |
| ✅ Real-time streaming | ✅ Event-driven               |
| ✅ Low latency         | ✅ Fire & forget              |
| ✅ Full control        | ❌ Less control               |
| ❌ Need to keep alive  | ✅ Auto-managed               |
| ✅ Free tier available | ❌ Paid only (1 credit/event) |

**For gaming:** Use WebSockets (real-time needed)

---

## PumpPortal vs Direct Contracts

| PumpPortal             | Direct Contracts    |
| ---------------------- | ------------------- |
| ✅ Simple HTTP API     | ❌ Complex Anchor   |
| ✅ No signing needed   | ❌ Requires keypair |
| ✅ 2-3 second creation | ❌ 5-10 seconds     |
| ✅ Error handling      | ⚠️ Manual handling  |
| ❌ Less control        | ✅ Full control     |

**For gaming:** Use PumpPortal (simpler, faster)

---

---

## Integration Flow Chart

```
Player Plays Game
    ↓
Player Wins → Helius detects deposit via WebSocket
    ↓
Backend credits player account
    ↓
Player clicks "Claim Token"
    ↓
Backend calls PumpPortal API
    ↓
Token created on bonding curve
    ↓
Player redirected to Pump.fun
    ↓
Token visible in game leaderboard
    ↓
Token graduates at $69k
    ↓
Token migrates to PumpSwap
```

---

## Code Snippets

### Deposit Handler

```typescript
function onTransactionDetected(tx) {
  const deposits = [];

  tx.message.instructions.forEach((ix) => {
    if (
      ix.parsed?.type === "transfer" &&
      ix.parsed?.info?.destination === GAME_TREASURY
    ) {
      deposits.push({
        from: ix.parsed.info.source,
        amount: ix.parsed.info.tokenAmount.uiAmount,
        mint: ix.parsed.info.mint,
        timestamp: tx.blockTime,
      });
    }
  });

  return deposits;
}
```

### Token Generator

```typescript
function generatePirateToken() {
  const prefixes = ["Shielded", "Treasure", "Pirate", "Cursed"];
  const suffixes = ["Gold", "Bounty", "Seas", "Chest"];

  const prefix = prefixes[Math.random() * prefixes.length];
  const suffix = suffixes[Math.random() * suffixes.length];

  return {
    name: `${prefix} ${suffix}`,
    symbol: `$${prefix.slice(0, 2)}${suffix.slice(0, 2)}`,
  };
}
```

---

---

## Quick Test Commands

```bash
npx tsx tests/zcash-memo-watcher.ts --memo '{"v":"1","gameId":"onchain_1","solanaPubkey":"YOUR_KEY","amountZEC":0.1}'
npx tsx tests/helius-transaction-monitor.ts
npx tsx tests/pump-token-creator.ts
```

### Anchor (On-Chain) Env Keys

- `NEXT_PUBLIC_PROGRAM_ID`
- `PIR8_IDL_PATH`
- `PAYER_SECRET_KEY` (JSON array)

---

**Print this page for reference! 🎉**
