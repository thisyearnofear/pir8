# Getting Started with PIR8

## Overview

PIR8 is a privacy-first strategic naval combat platform combining Zcash shielded transactions with skill-based competitive gameplay on Solana.

## Prerequisites

- Node.js 18+ installed
- Rust 1.70+ (for Anchor contract development)
- Solana CLI 1.18+ installed
- Anchor CLI 0.29+ installed
- Solana wallet (Phantom, Solflare, or Backpack)
- ~1 SOL on Devnet (for testing)

## Installation

```bash
# Clone repository
git clone https://github.com/thisyearnofear/pir8.git
cd pir8

# Install dependencies
pnpm install

# Set up environment
cp .env.local.example .env.local
```

## Environment Configuration

Add these variables to your `.env.local` file:

```bash
# Helius RPC URL (get from helius.dev)
NEXT_PUBLIC_HELIUS_RPC=https://devnet.helius-rpc.com/?api-key=YOUR_KEY

# Program ID (from deployment)
NEXT_PUBLIC_PROGRAM_ID=EeHyY2FQ3A4GLieZbGbmZtz1iLKzLytXkRcXyzGfmePt

# Solana network
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Zcash Privacy Integration
NEXT_PUBLIC_LIGHTWALLETD_URL=https://lightwalletd.com:9067
NEXT_PUBLIC_ZCASH_SHIELDED_ADDR=zs1your_shielded_address_here
NEXT_PUBLIC_ZCASH_ENABLED=true
NEXT_PUBLIC_LOG_LEVEL=info
```

## Quick Start

### Build & Test Contracts

```bash
# Build Anchor program
cd contracts/pir8-game
cargo build --release

# Run the frontend
pnpm run dev
# Opens http://localhost:3000 with wallet connection UI
```

### Deploy to Devnet

```bash
# Configure Solana CLI for devnet
solana config set --url devnet

# Airdrop SOL for deployment
solana airdrop 2

# Deploy program
anchor deploy --provider.cluster devnet
```

## Development Commands

### Smart Contract Development

```bash
# Build Anchor program
anchor build

# Generate TypeScript types
anchor build --idl

# Run Anchor tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Verify deployment
solana program show <PROGRAM_ID>
```

### Frontend Development

```bash
# Start Next.js dev server
pnpm run dev

# Build production bundle
pnpm run build

# Start production server
pnpm start

# Type checking
pnpm run type-check

# Linting
pnpm run lint

# Format code
pnpm run format
```

### CLI Tools

```bash
# Initialize game configuration (one-time)
pnpm run cli -- init

# Create new game
pnpm run cli -- create

# Join existing game
pnpm run cli -- join 0

# Start game (when enough players)
pnpm run cli -- start 0

# Watch for game events
pnpm run cli -- monitor
```

## Zcash Privacy Integration

### Overview

PIR8 uses Zcash shielded transactions for **private tournament entry**:

1. Player creates memo with game entry data
2. Sends ZEC to PIR8 shielded address with memo
3. Memo gets parsed on Solana side
4. `join_game` instruction executes automatically
5. **Privacy preserved**: Zcash tx identity never appears on Solana

### Creating a Tournament Entry Memo

```typescript
import { ZcashMemoBridge } from '@/lib/integrations';

const gameId = 'game_0';
const playerPubkey = 'your_solana_pubkey';

// Create memo for Zcash transaction
const memo = ZcashMemoBridge.createMemo({
  gameId,
  action: 'join',
  solanaPubkey: playerPubkey,
});

// Output:
// {"v":1,"gameId":"game_0","action":"join","solanaPubkey":"...","timestamp":1234567890}
```

### Manual Tournament Entry

```bash
# 1. Generate memo for your wallet
pnpm run cli -- memo --game game_0 --action join

# 2. Send ZEC to PIR8 shielded address with the memo
#    Address: zs1m2n3o4p5... (see ZCASH_CONFIG)

# 3. Monitor entry
pnpm run cli -- monitor
```

## Key Concepts

### Game Flow

1. **Create Game**
   - Creator sets entry fee and max players (2-4)
   - Game enters "Waiting" status
   - 10x10 strategic map generated with biomes
   - Starting fleets deployed at player corners

2. **Join Game**
   - Players pay entry fee
   - Entry fee split: 95% to pot, 5% to platform
   - Each player gets 2 starting ships (Sloop + Frigate)
   - Game auto-starts when min players (2) join

3. **Gameplay** (Turn-based, 10x10 map)
   - Players move ships within speed range
   - Attack enemy ships within adjacent range
   - Claim territories (ports, islands, treasures)
   - Collect resources from controlled territories
   - Build new ships at controlled ports
   - Dynamic weather affects movement and combat

4. **Victory Conditions** (First to achieve wins)
   - **Fleet Dominance**: Control 65% of naval power
   - **Territory Control**: Own 50% of valuable territories
   - **Economic Victory**: Accumulate 10,000+ resource value

5. **Completion**
   - Winner determined by victory condition achieved
   - Winner claims prize from pot (85% of total)
   - Game account closed, rent returned

### Territory Types

| Territory | Resources | Strategic Value |
|-----------|-----------|-----------------|
| **Port** | 5 gold/2 crew | Ship building hub |
| **Island** | 3 supplies | Supply line |
| **Treasure** | 10 gold | Wealth generator |
| **Water** | None | Safe passage |
| **Storm** | Damage | Hazard (-50% movement) |
| **Reef** | Damage | Hidden hazard |
| **Whirlpool** | Deadly | Extreme danger |

### Ship Types

| Ship | Speed | HP | Cost | Role |
|------|-------|----|----|----|
| **Sloop** | 3 | 100 | 500 | Fast scout |
| **Frigate** | 2 | 200 | 1200 | Balanced warship |
| **Galleon** | 1 | 350 | 2500 | Heavy battleship |
| **Flagship** | 1 | 500 | 5000 | Ultimate vessel |

### Skill Mechanics (70% Skill / 30% Luck)

**Fleet Management** (Strategic):
- Choose ship types based on role (scout, fighter, heavy)
- Balance speed vs. durability
- Position for optimal attack/defense

**Economic Depth** (Strategic):
- Resource allocation for ship building
- Territory control for passive income
- Supply chain management

**Tactical Combat** (Strategic):
- Range management (adjacent only)
- Damage calculation (attack - defense)
- Weather advantage timing

**Timing Bonuses**:
- Fast decisions earn experience
- <5s: +100 points, <10s: +50 points, <15s: +25 points

## Troubleshooting

### "Insufficient funds" Error
```bash
# Airdrop SOL on devnet
solana airdrop 2

# Check balance
solana balance
```

### "Program not found" Error
```bash
# Verify program is deployed
solana program show <PROGRAM_ID>

# Redeploy if needed
anchor deploy --provider.cluster devnet
```

### Wallet Connection Issues
- Clear browser cache
- Try different wallet (Phantom vs Solflare vs Backpack)
- Check network settings (devnet vs mainnet)

### Build Errors
```bash
# Clean and reinstall
rm -rf node_modules .next
pnpm install
pnpm run build
```
