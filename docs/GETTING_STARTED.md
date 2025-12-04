# Getting Started with PIR8

## ✅ CURRENT STATUS: Phase 1B - Devnet Deployment ✅ COMPLETE

### Current Build
- **Smart Contracts**: ✅ Deployed to Devnet (`5etQW394NUCprU1ikrbDysFeCGGRYY9usChGpaox9oiK`)
- **Core Gameplay**: ✅ Full game loop implemented (create → join → move → claim)
- **Skill Mechanics**: ✅ Timer + scanning system in UI
- **Zcash Privacy**: ✅ Lightwalletd watcher + memo bridge wired
- **UI/UX Rating**: 🟢 **9/10** - All Phase 1A components implemented

### ✅ Completed UI Components
1. **TurnBanner** - "YOUR TURN ⏱️" indicator with timer + speed bonus ✅
2. **OnboardingModal** - 4-slide tutorial for new players ✅
3. **ShipActionModal** - Unified action menu (Move/Attack/Claim/Collect) ✅
4. **TerritoryTooltip** - Hover tooltips for territory effects ✅
5. **useShowOnboarding** - localStorage-based first visit detection ✅

### Next Steps: Phase 1B - Privacy Integration & Testing
1. ✅ **Pre-Deployment Security Review** - All critical issues fixed
2. ✅ **Deploy to Devnet** - Live at slot 425286866
3. **Configure Zcash Integration** - Set up private entry flow
4. **Integration Testing** - Full game loop + privacy features
5. **Zypherpunk Submission** - Privacy-first gameplay demo

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

## UI/UX Improvements (Phase 1A - Getting to 9/10)

### Overview
Current UI is functionally complete but has friction points that confuse new players. Phase 1A adds focused, high-quality components to improve user flow clarity and onboarding.

**Target**: Move from 7/10 (solid foundation) to 9/10 (intuitive & engaging)

**Principle**: HIGH-QUALITY EXECUTION
- Create focused, single-responsibility components (each <150 lines)
- No component should exceed 300 lines
- Avoid "kitchen sink" mega-components
- Small, testable, reusable pieces
- Delete actual dead code (Notification, Preloader, GameCockpit)

### Critical Improvements (MUST IMPLEMENT BEFORE DEVNET)

#### 1. TurnBanner Component ⭐
**Purpose**: Make it immediately obvious when it's the player's turn

**Location**: `src/components/TurnBanner.tsx` (new, ~60 lines)
**Placement**: Insert above game map in `app/page.tsx` (between header and 3-column grid)

**Implementation**:
```typescript
// src/components/TurnBanner.tsx
export default function TurnBanner({ isMyTurn, decisionTimeMs, currentPlayerName }) {
  if (!isMyTurn) {
    return (
      <div className="turn-banner bg-slate-700 text-center py-3 rounded border border-gray-600">
        <p className="text-gray-400">⏳ Waiting for {currentPlayerName}'s turn...</p>
      </div>
    );
  }

  return (
    <div className="turn-banner bg-gradient-to-r from-neon-cyan to-neon-magenta p-4 rounded-lg 
                    border-2 border-neon-cyan animate-pulse text-center mb-4">
      <div className="text-2xl font-bold text-black">
        🏴‍☠️ YOUR TURN ⏱️ {formatTimer(decisionTimeMs)}
      </div>
      <div className="text-sm text-neon-gold mt-2">
        Speed Bonus: {getSpeedBonusLabel(decisionTimeMs)}
      </div>
      <p className="text-xs text-black font-bold mt-1">Select a ship to begin</p>
    </div>
  );
}
```

**Props**:
- `isMyTurn: boolean` - From `usePirateGameState().isMyTurn(wallet)`
- `decisionTimeMs: number` - From game state timer
- `currentPlayerName: string` - Current player username/address

**Benefits**:
- ✅ Immediately clear whose turn it is
- ✅ Pulsing animation draws attention
- ✅ Speed bonus context shown (why timing matters)
- ✅ "Select a ship to begin" hint guides next action
- ✅ Single, focused responsibility

---

#### 2. ShipActionModal Component ⭐
**Purpose**: Unified action menu replaces scattered button controls

**Location**: `src/components/ShipActionModal.tsx` (new, ~120 lines)
**Trigger**: Click on ship during player's turn

**Implementation**:
```typescript
interface ShipActionModalProps {
  ship: Ship;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: 'move' | 'attack' | 'claim' | 'collect') => void;
}

const actions = [
  { id: 'move', icon: '⛵', label: 'Move', description: 'Navigate to adjacent territory' },
  { id: 'attack', icon: '💥', label: 'Attack', description: 'Engage nearby enemy ships' },
  { id: 'claim', icon: '🏴‍☠️', label: 'Claim', description: 'Claim current territory' },
  { id: 'collect', icon: '💎', label: 'Collect', description: 'Harvest resources' },
];
```

**Layout**:
```
┌────────────────────────────────────────┐
│   ⛵ Frigate (180/200 HP)              │  [X Close]
├────────────────────────────────────────┤
│  [⛵ Move]          [💥 Attack]        │
│  Navigate...        Engage...          │
│  [🏴‍☠️ Claim]         [💎 Collect]       │
│  Claim...           Harvest...         │
└────────────────────────────────────────┘
```

**Benefits**:
- ✅ Single, clear action point (ship click)
- ✅ All actions visible at once
- ✅ Descriptions prevent confusion
- ✅ Responsive (2x2 grid mobile, 4x1 desktop)
- ✅ Testable, reusable component

---

#### 3. OnboardingModal Component ⭐
**Purpose**: First-time players understand core mechanics in 60 seconds

**Location**: `src/components/OnboardingModal.tsx` (new, ~100 lines)
**Hook**: `src/hooks/useShowOnboarding.ts` (manages localStorage)

**Implementation**:
```typescript
// src/hooks/useShowOnboarding.ts
export function useShowOnboarding() {
  const [shown, setShown] = useState(false);
  
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('pir8_onboarding_seen');
    if (!hasSeenOnboarding) {
      setShown(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem('pir8_onboarding_seen', 'true');
    setShown(false);
  };

  return { shown, dismiss };
}

// src/components/OnboardingModal.tsx
const slides = [
  { title: "⏱️ Watch the Timer", content: "Faster moves earn bonus points! <5s = +100, <10s = +50, <15s = +25" },
  { title: "🔍 Scan Territory", content: "Use your 3 scans to reveal territory before claiming" },
  { title: "⛵ Move & Attack", content: "Click a ship, then choose Move, Attack, Claim, or Collect" },
  { title: "🏴‍☠️ Win the Battle", content: "Control territories, build fleets, and outsmart opponents!" }
];
```

**Benefits**:
- ✅ Explains mechanics upfront
- ✅ Skip option respects experienced players
- ✅ 60-second investment prevents frustration
- ✅ Clean separation from game logic

---

#### 4. TerritoryTooltip Component
**Purpose**: Explain territory effects on hover

**Location**: `src/components/TerritoryTooltip.tsx` (new, ~80 lines)
**Triggers**: Hover legend emoji OR map cell

**Implementation**:
```typescript
const territoryInfo = {
  water: { name: 'Water', effect: 'Safe passage', resources: 'None' },
  island: { name: 'Island', effect: 'Supplies generation', resources: '+3/turn' },
  port: { name: 'Port', effect: 'Ship building hub', resources: '+5 gold, +2 crew/turn' },
  treasure: { name: 'Treasure', effect: 'Wealth generator', resources: '+10 gold/turn' },
  storm: { name: 'Storm', effect: 'Dangerous - 50% penalty', resources: '-30 health' },
  reef: { name: 'Reef', effect: 'Hidden hazard', resources: '-20 health if hit' },
  whirlpool: { name: 'Whirlpool', effect: 'Deadly trap', resources: '-100 health' }
};
```

**Benefits**:
- ✅ Clarifies resource generation
- ✅ Warns about hazards
- ✅ Helps strategic planning
- ✅ Minimal UI footprint (hover-only)

---

#### 5. Enhance Existing Components

**PirateControls.tsx**:
- Add copy button for Game ID in waiting state
- Move 7x7 scan grid to collapsible section
- Add axis labels (A-G, 1-7)
- Reorganize: Timer → Ship Select → Actions → Scan → Build → End Turn

**PirateMap.tsx**:
- Enhance hover info with territory emoji
- Show effects on hover
- Add ~20 lines to existing hover section (lines 256-277)

---

### Dead Code Cleanup (Pre-Implementation)

**Identify & Delete**:
```bash
grep -r "Notification" src/  # Check if used
grep -r "Preloader" src/     # Check if used
grep -r "GameCockpit" src/   # Not in current flow
grep -r "useGameJoin" src/   # Verify usage
```

**Remove if unused**:
- ❌ `src/components/Notification.tsx` (may duplicate Toast)
- ❌ `src/components/Preloader.tsx` (likely unused)
- ❌ `src/components/GameCockpit/` (entire directory)
- ❌ `src/hooks/useGameJoin.ts` (if not referenced)

---

### Implementation Timeline (Phase 1A - HIGH-QUALITY COMPONENTS) ✅ COMPLETE

**Completed Components**:
- [x] `src/components/TurnBanner.tsx` (~65 lines)
  - "YOUR TURN ⏱️" indicator with pulsing animation
  - Speed bonus display with color coding
  - "Select a ship to begin" hint
  
- [x] `src/components/ShipActionModal.tsx` (~130 lines)
  - Unified action menu: Move, Attack, Claim, Collect
  - Ship health/status display in header
  - Responsive 2x2 grid layout
  
- [x] `src/hooks/useShowOnboarding.ts` (~45 lines)
  - localStorage-based "first visit" detection
  - `shown` state + `dismiss()` function

- [x] `src/components/OnboardingModal.tsx` (~135 lines)
  - 4-slide tutorial carousel
  - Skip button, navigation dots
  - Uses useShowOnboarding hook
  
- [x] `src/components/TerritoryTooltip.tsx` (~95 lines)
  - Hover tooltips for territory effects
  - Uses shared TERRITORY_INFO constants
  
- [x] `app/page.tsx` integration
  - TurnBanner above game grid when game active
  - OnboardingModal on first visit
  - ShipActionModal on ship clicks
  
- [x] `src/components/PirateMap.tsx` enhancement (+30 lines)
  - TerritoryTooltip on hover
  - Ship click handler for action modal

**Result**: **9/10 UI/UX** achieved with focused, testable components

### Validation Checklist

After Phase 1A, verify:
- [ ] New player can complete first game without confusion
- [ ] Turn indicator is always clear (YOUR TURN vs WAITING)
- [ ] All actions accessible from single menu click
- [ ] Onboarding can be completed in <1 minute
- [ ] Tooltips explain territory effects
- [ ] Game ID shareable and copyable
- [ ] No scrolling needed in controls panel during turn
- [ ] Mobile layout responsive on small screens

---

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

## Smart Contract Deployment (Phase 1B Ready)

### Pre-Deployment Checklist ✅

All items below have been completed before deployment:

**Security Hardening** ✅
- [x] Array bounds validation in `join_game()` prevents out-of-bounds panic
- [x] Integer overflow protection on `total_pot` with checked arithmetic
- [x] Safe arithmetic in `update_average_decision_time()` using saturating operations
- [x] Fleet deployment bounds checking prevents index overruns
- [x] Contracts compile cleanly with zero errors
- [x] All instruction validation guards in place

**Build Verification** ✅
```bash
# Verify build status
anchor build

# Output: Compiling pir8-game v0.1.0
#         Finished 0 errors
```

### Deployment Steps

```bash
# 1. Ensure wallet is funded on devnet
solana balance --url devnet

# 2. Deploy program to devnet
anchor deploy --provider.cluster devnet

# 3. Update Program ID in Anchor.toml and frontend
# The new program ID will be displayed after successful deployment

# 4. Verify deployment
solana program show <NEW_PROGRAM_ID> --url devnet

# 5. Update environment variables
# Edit .env.local with:
# NEXT_PUBLIC_PROGRAM_ID=<NEW_PROGRAM_ID>
```

### Testing After Deployment

```bash
# 1. Create a test game
npm run cli -- create

# 2. Join the game
npm run cli -- join 0

# 3. Monitor transactions
npm run cli -- monitor

# 4. Run full test suite
npm run test
```

### Known Issues & Resolutions

**No outstanding security issues** ✅ - All critical vulnerabilities patched

---

## Zcash Privacy Integration (Phase 1B - After Devnet Deployment)

### Overview

PIR8 players can enter tournaments **privately via Zcash shielded transactions**, with memo data automatically wiring to Solana smart contracts. This creates a unique privacy-first gaming experience perfect for Zypherpunk.xyz submission.

**Privacy Guarantee**: Player's Zcash transaction identity never appears on Solana. Only the Solana wallet address is on-chain.

### Architecture Components

**1. ZcashMemoBridge** - Validates and parses shielded memos
- Enforces memo schema version ("v": "1")
- Validates required fields: gameId, action, solanaPubkey
- Checks memo freshness (<5 minutes old, prevents replay)
- Max size: 512 bytes (Zcash memo limit)

**2. LightwalletdWatcher** - Monitors Zcash for incoming transactions
- WebSocket connection to Lightwalletd server
- Auto-reconnects with exponential backoff (max 5 attempts)
- Extracts and decodes memo from shielded outputs
- Triggers Solana transaction on valid memo

**3. joinGamePrivateViaZcash()** - Executes Solana join_game
- Single source of truth for memo-triggered transactions
- Converts gameId string → number
- Derives game PDA and executes join_game instruction
- Logs both Zcash and Solana TX hashes for verification

**4. useZcashBridge hook** - React integration
- Manages Lightwalletd connection lifecycle
- Handles success/error callbacks
- Provides bridge status for UI

### Setup Steps (After Devnet Deployment)

#### 1. Prepare Zcash Infrastructure

```bash
# Option A: Use existing Lightwalletd endpoint
# Recommended: https://mainnet.lightwalletd.com:9067 (mainnet)
#            https://testnet.lightwalletd.com:9067 (testnet)

# Option B: Run your own Lightwalletd server (advanced)
# See: https://github.com/zcash/lightwalletd
```

#### 2. Configure Environment Variables

```bash
# Edit .env.local with:
NEXT_PUBLIC_LIGHTWALLETD_URL=https://mainnet.lightwalletd.com:9067
NEXT_PUBLIC_ZCASH_SHIELDED_ADDR=<your-shielded-address>

# Generate a shielded address if you don't have one:
# 1. Install zcash-cli: https://z.cash/download/
# 2. zcash-cli z_getnewaddress
# This is your NEXT_PUBLIC_ZCASH_SHIELDED_ADDR
```

#### 3. Wire Hook to App Root

The `useZcashBridge` hook needs to be initialized in your app root for auto-connection:

```tsx
// app/layout.tsx or page.tsx (client component wrapper)
import { useZcashBridge } from '@/hooks/useZcashBridge';

export function YourComponent() {
  // Initialize with callbacks
  const { isConnected } = useZcashBridge({
    enabled: true,
    onEntrySuccess: (payload, solanaTx) => {
      console.log(`Player ${payload.solanaPubkey} joined via Zcash`);
      console.log(`Zcash TX: ${payload.zcashTxHash}`);
      console.log(`Solana TX: ${solanaTx}`);
    },
    onEntryError: (error, payload) => {
      console.error('Private entry failed:', error);
    }
  });

  return (
    <div>
      {isConnected && <p>🔒 Zcash bridge active</p>}
      {/* rest of UI */}
    </div>
  );
}
```

#### 4. Display Private Entry Instructions

Show players how to join privately:

```tsx
import { getPrivateEntryInstructions } from '@/hooks/useZcashBridge';

const instructions = getPrivateEntryInstructions(gameId, playerPubkey);
// Returns formatted instructions for CLI or modal display
```

### Complete Private Entry Flow

```
1. Player creates game normally on-chain
   ↓
2. System generates private entry instructions
   Instructions include:
   - Zcash shielded address to send ZEC to
   - JSON memo schema to include
   ↓
3. Player sends Zcash transaction with memo
   Memo format:
   {
     "v": "1",
     "gameId": "game_123",
     "action": "join",
     "solanaPubkey": "ABC...",
     "timestamp": 1704067200000
   }
   ↓
4. LightwalletdWatcher detects incoming transaction
   Extracts memo from vShieldedOutput
   ↓
5. ZcashMemoBridge validates memo
   Checks schema, fields, freshness, format
   ↓
6. joinGamePrivateViaZcash() executes
   Constructs join_game instruction
   Uses solanaPubkey from memo as player
   Submits to Solana
   ↓
7. Player appears in game
   Solana address on-chain (public)
   Zcash identity private (stays in shielded pool)
   ↓
8. Player can now move ships, claim territories, etc.
   All game moves are public Solana transactions
   But tournament entry was private via Zcash
```

### Testing the Integration

#### Manual Testing (CLI)

```bash
# 1. Create a test game
npm run cli -- create
# Output: Game created with ID [timestamp]

# 2. Generate memo for private entry
npm run cli -- memo <game_id> <solana_pubkey>
# Output: JSON memo to include in Zcash transaction

# 3. (Manually) Send Zcash to shielded address with memo
# zcash-cli z_sendmany \
#   "from_address" \
#   '[{"address":"SHIELDED_ADDR","amount":0.01}]' \
#   1 \
#   0.0001 \
#   "memotext:<your_memo_json>"

# 4. Monitor Solana transactions
npm run cli -- monitor
# Watch for join_game instruction with your wallet
```

#### E2E Testing (Frontend)

```bash
# 1. Start dev server
npm run dev
# Visit: http://localhost:3000

# 2. Create game (normal public flow)
# Click "Create New Battle"

# 3. Show private entry instructions
# Click "Private Entry via Zcash" button
# Copy memo instructions

# 4. (Manually) Send Zcash with memo
# Use Zcash wallet to send to shielded address

# 5. Watch game update automatically
# LightwalletdWatcher detects memo → join_game executes
# Player appears in game (automatically)
```

### Troubleshooting

**Problem**: LightwalletdWatcher not connecting
```
Solution: 
1. Check NEXT_PUBLIC_LIGHTWALLETD_URL is correct
2. Verify network connectivity to Lightwalletd server
3. Check browser console for WebSocket errors
4. Try testnet endpoint if mainnet unreliable
```

**Problem**: Memo not being detected
```
Solution:
1. Verify memo is valid JSON (no extra whitespace)
2. Check memo size < 512 bytes
3. Ensure memo schema version is "v": "1"
4. Verify all required fields present: gameId, action, solanaPubkey
5. Check memo timestamp is recent (<5 minutes old)
```

**Problem**: join_game instruction fails
```
Solution:
1. Verify gameId matches existing game on-chain
2. Check solanaPubkey is valid base58 (44 characters)
3. Ensure game is in "WaitingForPlayers" status
4. Verify player count < max_players
```

### Security Considerations

**Memo Privacy**:
- Zcash memos are encrypted end-to-end
- Only sender and receiver can read
- Private entries don't reveal identity to other players

**Replay Protection**:
- Memo timestamp checked (<5 minutes old)
- Prevents reusing old memos to rejoin tournaments

**Rate Limiting**:
- Lightwalletd can detect flooding (DOS protection built-in)
- Memo size capped at 512 bytes
- Game join already validated on-chain

### Advanced: Custom Memo Handling

If you need custom memo fields:

```tsx
// In ZcashMemoBridge.createMemo()
const memo = {
  v: ZCASH_CONFIG.MEMO_SCHEMA_VERSION,
  gameId: payload.gameId,
  action: payload.action,
  solanaPubkey: payload.solanaPubkey,
  timestamp: Date.now(),
  metadata: {
    // Add custom fields here
    tournament_season: "winter_2024",
    player_name: "Captain Redbeard",
    referral_code: "abc123"
  }
};
```

The metadata object can contain any JSON and is included in onMemoEntry callback.

### Documentation

- **ARCHITECTURE.md** - Technical deep dive into Zcash architecture
- **src/lib/integrations.ts** - ZcashMemoBridge & LightwalletdWatcher implementation
- **src/hooks/useZcashBridge.ts** - React hook for bridge lifecycle
- **src/lib/anchorClient.ts** - joinGamePrivateViaZcash() transaction handler

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
