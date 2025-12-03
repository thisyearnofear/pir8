# Getting Started with PIR8

## ✅ CURRENT STATUS: Ready for Devnet Deployment

Smart contracts compile successfully. Ready to deploy and test gameplay.

**Next milestone**: Deploy to Devnet and test basic game flow (create → join → move → claim).

---

## Development Environment Setup

### Prerequisites
- Node.js 18+ installed
- Rust 1.70+ (for Anchor contract development)
- Solana CLI 1.18+ installed
- Anchor CLI 0.29+ installed
- Solana wallet (Phantom, Solflare, or Backpack) - for future testing
- ~1 SOL on Devnet (for when contracts are fixed)

### Installation

```bash
# Clone repository
git clone https://github.com/thisyearnofear/pir8.git
cd pir8

# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Add your Helius RPC URL to .env.local (required for frontend)

# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install 0.29.0
avm use 0.29.0
```

### Build & Test Contracts

**Build the Anchor program**:
```bash
cd contracts/pir8-game
cargo build --release
# ✅ Should complete with only cfg warnings (safe to ignore)
```

**Run the frontend** (without devnet):
```bash
npm run dev
# Opens http://localhost:3000 with wallet connection UI
```

**Deploy to Devnet** (when ready):
```bash
solana config set --url devnet
solana airdrop 2
anchor deploy --provider.cluster devnet
# Updates PROGRAM_ID in Anchor.toml
```

---

## Skill Mechanics (Phase 1 & 2 - Smart Contract Complete)

### Scanning System

**How It Works**:
- Each player starts with 3 scan charges
- Players can scan a coordinate to reveal its territory type
- Scanned tiles remain revealed for the entire game
- Limited scans force strategic decisions

**Usage**:
```bash
# Smart contract instruction
pub fn scan_coordinate(coordinate_x: u8, coordinate_y: u8) -> Result<()>

# Frontend (coming soon)
const tx = await anchor.scanCoordinate(gameId, 5, 7);
// Event: CoordinateScanned { coordinate: (5,7), tile_type: "Port", charges_remaining: 2 }
```

**Benefits**: 
- Transforms blind guessing into information gathering strategy
- Skilled players use scans to plan optimal routes
- Creates "reading the game" as a skill dimension

### Timing Bonuses

**How It Works**:
- Faster moves earn point bonuses
- <5 seconds: +100 points
- <10 seconds: +50 points
- <15 seconds: +25 points
- >15 seconds: 0 bonus

**Usage**:
```bash
# Smart contract instruction
pub fn make_move_timed(ship_id: String, to_x: u8, to_y: u8, decision_time_ms: u64) -> Result<()>

# Frontend (coming soon)
const decisionTime = Date.now() - turnStartTime;
const tx = await anchor.makeMoveTimed(gameId, shipId, x, y, decisionTime);
// Event: MoveExecuted { decision_time_ms: 4200, speed_bonus_awarded: 100 }
```

**Benefits**:
- Rewards confident, knowledgeable decision-making
- Over 20 turns: skilled player gains 300-500 bonus points
- Fast timing + smart scanning = competitive advantage
- Makes the game watchable (spectators see strategy, not RNG)

---

## Smart Contract Instructions (Completed)

### Available Instructions

#### Game Management
- **create_game**: Create new 10x10 game with entry fee
- **join_game**: Add player and manage entry fee distribution
- **start_game**: Transition from Waiting → Active when min players met

#### Fleet Warfare
- **move_ship**: Move ship within speed range
- **attack_ship**: Deal damage to enemy vessel in range
- **claim_territory**: Claim port/island/treasure at ship location
- **collect_resources**: Harvest resources from controlled territory
- **build_ship**: Build new ship at controlled port (costs resources)

#### Game Completion
- **complete_game**: Finalize game and determine winner

### Resource Economy

Ships cost resources to build (at controlled ports):

| Ship Type | Gold | Crew | Cannons | Supplies | Stats |
|-----------|------|------|---------|----------|-------|
| **Sloop** | 500 | 10 | 5 | 20 | 100HP, 20ATK, 10DEF, 3SPD |
| **Frigate** | 1200 | 25 | 15 | 40 | 200HP, 40ATK, 25DEF, 2SPD |
| **Galleon** | 2500 | 50 | 30 | 80 | 350HP, 60ATK, 40DEF, 1SPD |
| **Flagship** | 5000 | 100 | 60 | 150 | 500HP, 80ATK, 60DEF, 1SPD |

Territory yields per turn:

| Territory | Gold | Crew | Supplies |
|-----------|------|------|----------|
| Port | 5 | 2 | 0 |
| Island | 0 | 0 | 3 |
| Treasure | 10 | 0 | 0 |

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

console.log(memo);
// Output:
// {"v":1,"gameId":"game_0","action":"join","solanaPubkey":"...","timestamp":1234567890,"metadata":{}}
```

### Memo Specification

```json
{
  "v": 1,
  "gameId": "<game_id>",
  "action": "join|create",
  "solanaPubkey": "<base58_encoded_pubkey>",
  "timestamp": 1234567890,
  "metadata": {}
}
```

**Constraints**:
- Max size: 512 bytes (Zcash memo limit)
- Version: Must be 1
- Action: Either "join" (existing game) or "create" (new tournament)
- Timestamp: Must be within 5 minutes of memo processing
- Pubkey: 44 character base58 string

### Memo Validation

```typescript
const bridge = new ZcashMemoBridge((payload) => {
  // This callback triggers when valid memo received
  console.log('Player joined:', payload.solanaPubkey);
});

// Parse and validate
const parsed = bridge.parseMemo(memoJson);
if (parsed) {
  console.log('Valid memo:', parsed);
  // {
  //   version: 1,
  //   gameId: 'game_0',
  //   action: 'join',
  //   solanaPubkey: '...',
  //   timestamp: 1234567890,
  //   metadata: {}
  // }
}
```

### Manual Tournament Entry (via Zcash)

```bash
# 1. Generate memo for your wallet
npm run cli -- memo --game game_0 --action join

# 2. Send ZEC to PIR8 shielded address:
#    z1m2n3o4p5... (address in ZCASH_CONFIG)
#
# 3. Include the memo from step 1 in the transaction
#
# 4. Monitor entry:
#    npm run cli -- monitor
#    # Watches for your join_game transaction
```

### Getting Entry Instructions

```typescript
const instructions = ZcashMemoBridge.getPrivateEntryInstructions(
  'game_0',
  playerPubkey
);

console.log(instructions);
// Prints step-by-step guide for player
```

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
   - Creator sets entry fee and max players (2-4)
   - Game enters "Waiting" status
   - 10x10 strategic map generated with biomes
   - Starting fleets deployed at player corners

2. **Join Game**
   - Players pay entry fee
   - Entry fee split: 95% to pot, 5% to platform
   - Starting resources: 1000 gold, 50 crew, 20 cannons, 100 supplies
   - Each player gets 2 starting ships (Sloop + Frigate)
   - Game auto-starts when min players (2) join

3. **Gameplay** (Turn-based, 10x10 map)
   - Players move ships within speed range
   - Attack enemy ships within adjacent range
   - Claim territories (ports, islands, treasures)
   - Collect resources from controlled territories
   - Build new ships at controlled ports (costs resources)
   - Dynamic weather affects movement and combat
   - Turns cycle through all players

4. **Victory Conditions** (First to achieve wins)
   - **Fleet Dominance**: Control 80% of naval power
   - **Territory Control**: Own 60% of valuable territories
   - **Economic Victory**: Accumulate 15,000+ resource value

5. **Completion**
   - Winner determined by victory condition achieved first
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

**Fog of War** (Phase 2 - Competitive):
- Ship positions hidden until adjacent/detected
- Intel gathering missions
- Reconnaissance advantage

**Timing Bonuses** (Phase 2 - Skill):
- Fast decisions earn experience
- Combo rewards for multi-turn strategies
- Territory bonus accumulation

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
