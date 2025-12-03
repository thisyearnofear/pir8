# Getting Started with PIR8

## Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ installed
- Solana wallet (Phantom, Solflare, or Backpack)
- ~0.5 SOL on Devnet for testing

### Installation

```bash
# Clone repository
git clone https://github.com/thisyearnofear/pir8.git
cd pir8

# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Add your Helius RPC URL to .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and connect your wallet!

---

## Development Workflow

### Smart Contract Development

#### Build Contracts
```bash
# Build Anchor program
anchor build

# Generate TypeScript types
anchor build --idl

# View program ID
solana address -k target/deploy/pir8_game-keypair.json
```

#### Test Contracts
```bash
# Run Anchor tests
anchor test

# Run specific test
anchor test --skip-deploy -- --test test_create_game
```

#### Deploy to Devnet
```bash
# Configure Solana CLI for devnet
solana config set --url devnet

# Airdrop SOL for deployment
solana airdrop 2

# Deploy program
anchor deploy --provider.cluster devnet

# Verify deployment
solana program show <PROGRAM_ID>
```

### Frontend Development

#### Run Development Server
```bash
# Start Next.js dev server
npm run dev

# Build production bundle
npm run build

# Start production server
npm start
```

#### Code Quality
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### CLI Tools

#### Initialize Platform
```bash
# Initialize game configuration (one-time)
npm run cli -- init

# View configuration
solana account <CONFIG_PDA>
```

#### Create & Join Games
```bash
# Create new game
npm run cli -- create

# Join existing game
npm run cli -- join 0

# Start game (when enough players)
npm run cli -- start 0
```

#### Monitor Transactions
```bash
# Watch for game events
npm run cli -- monitor

# Create winner token (when game completes)
npm run cli -- token 0
```

#### Zcash Integration
```bash
# Handle shielded memo
npm run cli -- memo --memo '{"v":"1","gameId":"game_0","solanaPubkey":"YOUR_KEY","amountZEC":0.1}'
```

---

## Project Structure

```
pir8/
├── contracts/              # Solana smart contracts
│   └── pir8-game/
│       ├── src/
│       │   └── lib.rs     # Main program (927 lines)
│       ├── Cargo.toml
│       └── Xargo.toml
│
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main game interface
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Styling
│
├── src/
│   ├── components/        # React components
│   │   ├── GameCockpit/  # Main game UI
│   │   ├── GameControls.tsx
│   │   ├── GameGrid.tsx
│   │   └── PlayerStats.tsx
│   │
│   ├── hooks/            # Custom React hooks
│   │   ├── useGameState.ts
│   │   ├── useHeliusMonitor.ts
│   │   └── useErrorHandler.ts
│   │
│   ├── lib/              # Core libraries
│   │   ├── anchor.ts     # Anchor program client
│   │   ├── gameLogic.ts  # Game rules engine
│   │   └── integrations.ts # Helius/Pump/Zcash
│   │
│   ├── cli/              # CLI commands
│   │   └── commands/
│   │       ├── game.ts
│   │       ├── monitor.ts
│   │       └── token.ts
│   │
│   └── types/            # TypeScript types
│       └── game.ts
│
├── docs/                 # Documentation
│   ├── VISION.md        # Strategy & vision
│   ├── ARCHITECTURE.md  # Technical details
│   ├── ROADMAP.md       # Development plan
│   └── GETTING_STARTED.md # This file
│
├── tests/               # Integration tests
│   ├── game.test.ts
│   └── tournament.test.ts
│
├── Anchor.toml          # Anchor configuration
├── package.json         # Node dependencies
└── README.md           # Project overview
```

---

## Key Concepts

### Game Flow

1. **Create Game**
   - Creator sets entry fee and max players
   - Game enters "Waiting" status
   - Grid is generated with random seed

2. **Join Game**
   - Players pay entry fee
   - Entry fee split: 95% to pot, 5% to platform
   - Game starts when min players (2) join

3. **Gameplay**
   - Turn-based coordinate selection (A1-G7)
   - Items revealed when picked
   - Special items trigger actions
   - Game ends when all 49 squares picked

4. **Completion**
   - Winner determined by highest score (points + banked)
   - Winner claims prize from pot
   - Game account closed, rent returned

### Special Items

| Item | Effect | Strategy |
|------|--------|----------|
| **Points** | +200/1000/3000/5000 | Core scoring |
| **GRINCH** | Steal opponent's points | Offensive |
| **PUDDING** | Reset opponent to 0 | Aggressive |
| **PRESENT** | Gift 1000 points | Cooperative |
| **MISTLETOE** | Swap scores | Tactical |
| **TREE** | Choose next coordinate | Control |
| **ELF** | Block one attack | Defensive |
| **BAUBLE** | Reflect one attack | Counter |
| **TURKEY** | Reset self to 0 | Risk |
| **CRACKER** | Double current score | Multiplier |
| **BANK** | Protect points | Safety |

### Skill Mechanics (Phase 2)

**Scanning**:
- Reveal items without claiming
- Limited charges (3 per game)
- Strategic information advantage

**Timing**:
- Fast decisions earn bonus points
- <5s = +100 points
- >30s = -50 points penalty

**Action Points**:
- 3 AP per turn
- Pick (2 AP), Scan (1 AP), Bank (1 AP)
- Tactical resource management

**Combos**:
- Consecutive point picks = 1.5x multiplier
- Special item chains = bonus points
- Territory control = passive income

---

## Common Tasks

### Add New Game Item

1. **Update Smart Contract**:
```rust
// contracts/pir8-game/src/lib.rs
pub enum GameItem {
    // ... existing items
    NewItem,  // Add new variant
}

// Add handling in make_move
GameItem::NewItem => {
    // Define effect
}
```

2. **Update Frontend Types**:
```typescript
// src/types/game.ts
export type GameItem = 
  | 'GRINCH' 
  | 'NEW_ITEM'  // Add here
  | ...;
```

3. **Add to Distribution**:
```rust
// Update ITEM_DISTRIBUTION constant
pub const ITEM_DISTRIBUTION: &[(u8, u16)] = &[
    // ... existing
    (1, 0), // NewItem (special)
];
```

### Add New Instruction

1. **Define Context**:
```rust
#[derive(Accounts)]
pub struct NewInstruction<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    pub player: Signer<'info>,
}
```

2. **Implement Handler**:
```rust
pub fn new_instruction(ctx: Context<NewInstruction>) -> Result<()> {
    let game = &mut ctx.accounts.game;
    // Logic here
    Ok(())
}
```

3. **Add to Program**:
```rust
#[program]
pub mod pir8_game {
    pub fn new_instruction(ctx: Context<NewInstruction>) -> Result<()> {
        // Call handler
    }
}
```

4. **Update Frontend Client**:
```typescript
// src/lib/anchor.ts
async newInstruction() {
  return await this.program.methods
    .newInstruction()
    .accounts({ /* ... */ })
    .rpc();
}
```

### Debug Transaction Failures

```bash
# Get transaction logs
solana confirm -v <SIGNATURE>

# View program logs
solana logs <PROGRAM_ID>

# Check account data
solana account <ACCOUNT_ADDRESS>

# Decode base64 error
echo "<ERROR_DATA>" | base64 -d
```

### Test Locally

```bash
# Start local validator
solana-test-validator

# Deploy to local
anchor deploy --provider.cluster localnet

# Run tests against local
anchor test --skip-local-validator
```

---

## Environment Variables

### Required
```bash
# Helius RPC URL (get from helius.dev)
NEXT_PUBLIC_HELIUS_RPC=https://devnet.helius-rpc.com/?api-key=YOUR_KEY

# Program ID (from deployment)
NEXT_PUBLIC_PROGRAM_ID=5etQW394NUCprU1ikrbDysFeCGGRYY9usChGpaox9oiK

# Solana network
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

### Optional
```bash
# Zcash configuration
ZCASH_LIGHTWALLETD_URL=https://zcash.example.com

# Pump Fun API
PUMPPORTAL_API_KEY=your_key_here

# Analytics
NEXT_PUBLIC_LOG_LEVEL=info
```

---

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
- Try different wallet (Phantom vs Solflare)
- Check network setting (should be Devnet)
- Disable browser extensions that might interfere

### Transaction Timeout
- Increase Solana CLI timeout: `solana config set --commitment confirmed`
- Use Helius RPC for better reliability
- Check Solana network status: https://status.solana.com

### Build Failures
```bash
# Clear build cache
anchor clean
rm -rf target/

# Rebuild
anchor build

# Update dependencies
cargo update
```

---

## Testing Checklist

### Smart Contract Tests
- [ ] Initialize config
- [ ] Create game
- [ ] Join game (multiple players)
- [ ] Start game
- [ ] Make moves
- [ ] Use special items
- [ ] Complete game
- [ ] Claim winnings

### Frontend Tests
- [ ] Wallet connection
- [ ] Create game UI
- [ ] Join game UI
- [ ] Coordinate selection
- [ ] Real-time updates
- [ ] Error handling
- [ ] Mobile responsiveness

### Integration Tests
- [ ] Helius monitoring
- [ ] Zcash memo parsing
- [ ] Token creation
- [ ] End-to-end game flow

---

## Resources

### Documentation
- [Solana Docs](https://docs.solana.com)
- [Anchor Book](https://book.anchor-lang.com)
- [Helius Docs](https://docs.helius.dev)
- [Next.js Docs](https://nextjs.org/docs)

### Tools
- [Solana Explorer](https://explorer.solana.com/?cluster=devnet)
- [Anchor Playground](https://beta.solpg.io)
- [Helius Dashboard](https://dashboard.helius.dev)

### Community
- [Discord](https://discord.gg/pir8) (coming soon)
- [Twitter](https://twitter.com/pir8_game)
- [GitHub Issues](https://github.com/thisyearnofear/pir8/issues)

---

## Next Steps

1. **Run the game locally** - Follow Quick Start above
2. **Read the architecture** - See [ARCHITECTURE.md](./ARCHITECTURE.md)
3. **Review the roadmap** - See [ROADMAP.md](./ROADMAP.md)
4. **Start contributing** - Pick an issue or feature to implement

**Welcome aboard, pirate! 🏴‍☠️**
