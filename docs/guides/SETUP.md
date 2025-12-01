# Helius & Pump Fun Integration Setup Guide

Quick start for immediate testing of both sponsor technologies.

---

## Quick Setup (15 minutes)

### 1. Create Helius Account

```bash
# Go to https://dashboard.helius.dev
# 1. Click "Sign Up"
# 2. Complete email verification
# 3. Go to Dashboard → API Keys
# 4. Copy your free tier API key
```

### 2. Create PumpPortal Account

```bash
# Go to https://pumpportal.fun/
# 1. Join Telegram: https://t.me/PumpPortalAPI
# 2. Request API key in Telegram
# 3. Receive API key
```

### 3. Setup Project

```bash
# Clone repo (if not already done)
cd /Users/udingethe/Dev/pirate-game

# Install dependencies
npm init -y
npm install --save-dev typescript ts-node @types/node
npm install ws dotenv axios @solana/web3.js bs58 form-data

# Create environment file
cat > .env << EOF
HELIUS_API_KEY=your_helius_api_key_here
PUMP_API_KEY=your_pumpportal_api_key_here
GAME_TREASURY=HN7cABqLq46s2NEe1VwNVH5T1axayXfdUpjKAmChqWMb
EOF

# Update .gitignore
echo ".env" >> .gitignore
```

### 4. Install TypeScript Config

```bash
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./tests",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["tests/**/*"],
  "exclude": ["node_modules"]
}
EOF
```

---

## Test 1: Helius Transaction Monitor (5 min)

**What it does:** Monitors real-time transactions to your game treasury address

```bash
# 1. Update GAME_TREASURY in .env with YOUR address
#    (or use default for testing)

# 2. Run the monitor
npx ts-node tests/helius-transaction-monitor.ts

# 3. Expected output:
#    ✅ Connected to Helius WebSocket
#    📡 Subscribed to transactions for: HN7cABqLq46s2NEe1VwNVH5T1axayXfdUpjKAmChqWMb
#    Listening for transactions...

# 4. Open another terminal and send a test transaction:
#    It will appear in the monitor output

# 5. Press Ctrl+C to stop (after 120 seconds auto-stops)
```

**Expected Output When Transaction Detected:**

```
==============================================================
🎮 TRANSACTION DETECTED
==============================================================

📝 Signature: 5Ym...abc123def456...
   View: https://solscan.io/tx/5Ym...?cluster=devnet

⏰ Time: 2:34:56 PM

👥 Accounts involved: 8
   [0] (Signer): Aq7...
   [1]: By8...
   ... and 3 more

⚙️  Instructions: 2

   [0] system
       Type: SOL Transfer
       From: Aq7...
       To: HN7c...
       Amount: 1.500000 SOL
       💰 SOL DEPOSIT DETECTED!

   [1] spl-token
       Type: transfer
```

---

## Test 2: Pump Token Creator (10 min)

**What it does:** Creates pirate-themed tokens for game winners

```bash
# 1. Make sure you have a Devnet SOL-funded wallet
#    (Get free SOL at https://faucet.solana.com)

# 2. Run the token creator
npx ts-node tests/pump-token-creator.ts

# 3. Expected output:
#    ✅ Creator initialized
#    🎲 Generated mint keypair
#    🏴‍☠️  Generated token names
#    📤 Uploading metadata to IPFS...
#    ✅ Metadata uploaded successfully
#    🚀 Creating token via Lightning API...
#    ✅ Token created successfully!

# 4. View your token:
#    https://solscan.io/token/YOUR_MINT?cluster=devnet
```

**Expected Output:**

```
╔════════════════════════════════════════════════════════════╗
║     Pump Fun Token Creator - Winner Token Launch           ║
╚════════════════════════════════════════════════════════════╝

✅ Creator initialized

🎲 Generated mint keypair
   Address: 9xN...

🏴‍☠️  Generated token names
   Name: Shielded Gold
   Symbol: $SHGL

📤 Uploading metadata to IPFS...
   ⚠️  No image provided (optional)
✅ Metadata uploaded successfully
   IPFS URI: https://ipfs.io/ipfs/QmXxxx...

🚀 Creating token via Lightning API...
   Mint: 9xN...
   Dev buy: 0.1 SOL
   Slippage: 10%
   Priority fee: 0.0005 SOL

✅ Token created successfully!

============================================================
🎉 TOKEN CREATED SUCCESSFULLY!
============================================================

📋 Token Details:
   Name: Shielded Gold
   Symbol: $SHGL
   Mint: 9xN...

🔗 Links:
   Solscan: https://solscan.io/token/9xN...?cluster=devnet
   Transaction: https://solscan.io/tx/5Y...?cluster=devnet

💎 Next Steps:
   1. Token is now live on Pump.fun bonding curve
   2. Others can buy/sell tokens immediately
   3. Watch for graduation at $69k market cap → PumpSwap
   4. Creator can claim fees anytime
```

---

## Common Issues & Solutions

### Issue: "HELIUS_API_KEY not found in .env"

**Solution:**
```bash
# Make sure .env file exists
ls -la .env

# If missing, create it:
cat > .env << EOF
HELIUS_API_KEY=your_api_key
PUMP_API_KEY=your_pump_key
GAME_TREASURY=your_address
EOF

# Verify it was created:
cat .env
```

---

### Issue: "WebSocket connection timeout"

**Solution:**
```bash
# 1. Check your API key is valid
#    Go to https://dashboard.helius.dev and verify

# 2. Check your internet connection
ping google.com

# 3. Try again (sometimes connection takes 30 seconds)
npx ts-node tests/helius-transaction-monitor.ts

# 4. If still failing, check if you're on Professional plan
#    Enhanced WebSockets require Professional or higher
#    Use Standard WebSockets for free tier
```

---

### Issue: "PUMP_API_KEY is required"

**Solution:**
```bash
# 1. Join Telegram: https://t.me/PumpPortalAPI
# 2. Message bot: /start
# 3. Get your API key
# 4. Add to .env:
#    PUMP_API_KEY=your_key_from_telegram

# 5. Verify file:
grep PUMP_API_KEY .env
```

---

### Issue: "Insufficient balance" (Token creation)

**Solution:**
```bash
# 1. Get free Devnet SOL:
#    https://faucet.solana.com

# 2. Or use Helius faucet:
#    https://www.helius.dev/docs/rpc/devnet-sol

# 3. Check balance:
solana balance -um

# 4. Need at least 1 SOL for token creation + dev buy
```

---

### Issue: TypeScript errors

**Solution:**
```bash
# 1. Install TypeScript globally
npm install -g typescript

# 2. Verify version
tsc --version

# 3. Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# 4. Try again
npx ts-node tests/pump-token-creator.ts
```

---

## Integration Checklist

Before moving to production, verify:

### Helius ✅
- [ ] Free tier account created
- [ ] API key obtained and in .env
- [ ] WebSocket monitor test passes
- [ ] Can detect transactions in real-time
- [ ] Keep-alive (ping) working correctly
- [ ] Understand pricing (free tier may have limits)

### Pump Fun ✅
- [ ] PumpPortal API key obtained
- [ ] Token creator test passes
- [ ] Token creates successfully on devnet
- [ ] Can view created tokens on Solscan
- [ ] Understand $69k graduation mechanic
- [ ] Know about `create_v2` breaking changes

### Project Setup ✅
- [ ] TypeScript compiles without errors
- [ ] .env file configured
- [ ] .gitignore excludes .env
- [ ] All dependencies installed
- [ ] Ready to integrate into Next.js

---

## Next Steps

### 1. Integrate into Next.js Backend

**File:** `pages/api/deposit-monitor.ts`

```typescript
import { HeliusTransactionMonitor } from '@/lib/helius';

export default async function handler(req, res) {
  const monitor = new HeliusTransactionMonitor();
  
  // Listen for deposits
  monitor.on('deposit', async (tx) => {
    // Credit player account
    await creditPlayer(tx.playerAddress, tx.amount);
  });

  return res.status(200).json({ status: 'monitoring' });
}
```

### 2. Integrate Token Creation API

**File:** `pages/api/claim-token.ts`

```typescript
import { PumpTokenCreator } from '@/lib/pump';

export default async function handler(req, res) {
  const { winnerId, winnerWallet } = req.body;
  const creator = new PumpTokenCreator(process.env.PUMP_API_KEY);

  // Create token
  const token = await creator.createTokenLightning(
    generateMetadata(winnerId),
    Keypair.generate(),
    0.5
  );

  // Store token info in database
  await db.tokens.create({
    winnerId,
    mint: token.mint,
    signature: token.signature,
    createdAt: new Date(),
  });

  return res.status(200).json({ token });
}
```

### 3. Frontend: Display Winner Token

**Component:** `components/WinnerToken.tsx`

```typescript
export default function WinnerToken({ token }) {
  return (
    <div>
      <h2>{token.name}</h2>
      <p>You created: {token.symbol}</p>
      <a href={`https://solscan.io/token/${token.mint}`}>
        View on Solscan
      </a>
      <a href={`https://pump.fun/${token.mint}`}>
        Trade on Pump.fun
      </a>
    </div>
  );
}
```

---

## Resources

| Resource | Link |
|----------|------|
| Helius Docs | https://www.helius.dev/docs |
| Helius Dashboard | https://dashboard.helius.dev |
| PumpPortal API | https://pumpportal.fun/ |
| Pump.fun Docs | https://github.com/pump-fun/pump-public-docs |
| Solana Devnet Faucet | https://faucet.solana.com |
| Solscan Explorer | https://solscan.io/?cluster=devnet |

---

## Support

- **Helius Support**: https://discord.com/invite/6GXdee3gBj
- **PumpPortal Support**: https://t.me/PumpPortalAPI
- **Solana Docs**: https://docs.solana.com

---

## Quick Command Reference

```bash
# Setup
npm install
cat > .env << EOF
HELIUS_API_KEY=your_key
PUMP_API_KEY=your_key
EOF

# Run tests
npx ts-node tests/helius-transaction-monitor.ts    # Test 1
npx ts-node tests/pump-token-creator.ts             # Test 2

# Clean up
rm -rf dist node_modules
npm install
```

Done! 🎉 You're ready to integrate Helius and Pump Fun.
