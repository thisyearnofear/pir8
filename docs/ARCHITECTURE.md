# Technical Architecture

## System Overview

PIR8 is a full-stack Web3 gaming platform built on Solana with privacy features powered by Zcash. The architecture prioritizes speed, security, and skill-based gameplay.

## Technology Stack

### Blockchain Layer
- **Solana Devnet/Mainnet**: Primary execution layer
- **Anchor Framework 0.29+**: Smart contract development
- **Zcash**: Privacy-preserving tournament entry
- **Helius RPC**: Enhanced transaction monitoring

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Solana Wallet Adapter**: Multi-wallet support

### Backend Services
- **Node.js**: CLI tools and automation
- **Helius WebSocket**: Real-time game monitoring
- **Zcash Lightwalletd**: Shielded memo watching

## ✅ Smart Contract Status

**Compilation**: Successfully compiles with Anchor 0.29+  
**Next step**: Deploy to Solana Devnet and test gameplay

---

## Smart Contract Architecture

### Core Contracts

#### 1. Game Contract (`pir8_game`)
**Location**: `/contracts/pir8-game/src/lib.rs`
**Size**: 1,017 lines (lib.rs) + 302 lines (instructions.rs) + 537 lines (pirate_lib.rs) = 1,856 total
**Program ID**: `5etQW394NUCprU1ikrbDysFeCGGRYY9usChGpaox9oiK` (devnet deployment pending)
**Status**: ✅ **Compiled successfully** - Ready for deployment

**Key Instructions**:
```rust
pub mod pir8_game {
    // Configuration
    pub fn initialize_config(...)  // One-time platform setup
    
    // Game Lifecycle
    pub fn create_game(...)        // Create new game instance
    pub fn join_game(...)          // Player joins with entry fee
    pub fn start_game(...)         // Begin gameplay
    pub fn make_move(...)          // Pick coordinate, reveal item
    pub fn execute_item_effect(...) // Use special items
    pub fn complete_game(...)      // Finalize and determine winner
    pub fn claim_winnings(...)     // Winner withdraws prize
    
    // Admin
    pub fn set_game_status(...)    // Pause/unpause platform
}
```

**Account Structures**:
```rust
// Platform configuration (PDA)
pub struct GameConfig {
    pub authority: Pubkey,           // Admin key
    pub default_entry_fee: u64,      // Base entry (0.1 SOL)
    pub platform_fee_bps: u16,       // Fee in basis points (500 = 5%)
    pub treasury: Pubkey,            // Fee recipient
    pub total_games: u64,            // Game counter
    // ... 128 bytes reserved for upgrades
}

// Individual game state (PDA)
pub struct Game {
    pub game_id: u64,                // Unique identifier
    pub creator: Pubkey,             // Game creator
    pub status: GameStatus,          // Waiting/Active/Completed
    pub players: Vec<PlayerState>,   // Up to 4 players
    pub grid: Vec<GameItem>,         // 49 items (7x7)
    pub chosen_coordinates: Vec<String>, // Picked squares
    pub entry_fee: u64,              // Entry cost
    pub total_pot: u64,              // Prize pool
    pub winner: Option<Pubkey>,      // Winner address
    pub random_seed: u64,            // Grid generation seed
    // ... metadata and reserved space
}

// Player state within game
pub struct PlayerState {
    pub player_key: Pubkey,          // Player address
    pub points: u64,                 // Current score
    pub banked_points: u64,          // Protected score
    pub has_elf: bool,               // Defensive item
    pub has_bauble: bool,            // Reflect item
    pub last_move_at: i64,           // Timestamp
}
```

**Game Items**:
```rust
pub enum GameItem {
    Points(u16),      // 200, 1000, 3000, 5000
    Grinch,           // Steal points
    Pudding,          // Reset target to 0
    Present,          // Gift 1000 points
    Snowball,         // (Reserved for multiplayer)
    Mistletoe,        // Swap scores
    Tree,             // Choose next coordinate
    Elf,              // Block one attack
    Bauble,           // Reflect one attack
    Turkey,           // Reset self to 0
    Cracker,          // Double current score
    Bank,             // Move points to safe storage
}
```

#### 2. Tournament Contract (Planned)
**Status**: Design phase
**Target**: Phase 3 implementation

**Planned Instructions**:
```rust
pub mod pir8_tournament {
    // Tournament Management
    pub fn initialize_tournament_manager(...)
    pub fn create_tournament(...)
    pub fn register_for_tournament(...)
    pub fn seed_tournament(...)  // Leader seeding
    
    // Bracket Progression
    pub fn advance_bracket(...)
    pub fn report_match_result(...)
    pub fn complete_tournament(...)
    
    // Rewards
    pub fn distribute_tokens(...)
    pub fn claim_tournament_rewards(...)
}
```

### Security Features

**Access Control**:
- PDA-based account derivation (prevents unauthorized access)
- Signer validation on all state-changing instructions
- Authority checks for admin functions

**Economic Security**:
- Entry fee validation (minimum thresholds)
- Platform fee caps (max 10%)
- Overflow protection on all arithmetic
- Pot calculation with checked math

**Game Integrity**:
- Coordinate validation (A1-G7 only)
- Duplicate move prevention
- Turn order enforcement
- Winner determination on-chain

## Frontend Architecture

### Component Structure
```
app/
├── page.tsx              # Main game interface
├── layout.tsx            # Root layout with providers
└── globals.css           # Pirate-themed styling

src/
├── components/
│   ├── GameCockpit/      # Main game UI container
│   ├── GameControls.tsx  # Coordinate selection
│   ├── GameGrid.tsx      # 7x7 visual grid
│   ├── PlayerStats.tsx   # Score display
│   └── WalletProvider.tsx # Wallet integration
│
├── hooks/
│   ├── useGameState.ts   # Game state management
│   ├── useGameJoin.ts    # Join game logic
│   ├── useHeliusMonitor.ts # Real-time updates
│   └── useErrorHandler.ts  # Error management
│
├── lib/
│   ├── anchor.ts         # Anchor program client
│   ├── gameLogic.ts      # Core game rules
│   └── integrations.ts   # Helius/Pump/Zcash
│
└── types/
    └── game.ts           # TypeScript interfaces
```

### State Management

**Game State Flow**:
```typescript
// Zustand store (client-side)
interface GameState {
  gameId: string;
  players: Player[];
  grid: GameItem[][];
  chosenCoordinates: string[];
  currentPlayerIndex: number;
  status: 'waiting' | 'active' | 'completed';
}

// Sync with on-chain state
1. User action (pick coordinate)
2. Frontend validation
3. Submit transaction to Solana
4. Helius monitors transaction
5. Update local state on confirmation
6. Emit events to other players
```

### Real-Time Updates

**Helius WebSocket Integration**:
```typescript
class HeliusMonitor {
  // Subscribe to program transactions
  connect() {
    const wsUrl = HELIUS_RPC.replace('https', 'wss');
    this.ws = new WebSocket(wsUrl);
    
    // Filter for PIR8 program
    this.ws.send({
      method: 'transactionSubscribe',
      params: [{
        accountInclude: [PROGRAM_ID],
        commitment: 'finalized'
      }]
    });
  }
  
  // Parse game events from logs
  processGameTransaction(data) {
    const logs = data.meta?.logMessages || [];
    
    if (logs.includes('GameCreated')) {
      this.handleGameCreated(log);
    } else if (logs.includes('MoveMade')) {
      this.handleMoveMade(log);
    }
    // ... other events
  }
}
```

## Privacy Layer

### Zcash Integration - 🟡 PARTIAL IMPLEMENTATION

**Status**: Memo parser functional. Bridge connection to contracts ready for Phase 1 completion.

**Shielded Memo Schema** (Defined):
```json
{
  "v": "1",                    // Schema version
  "gameId": "game_123",        // Target game
  "solanaPubkey": "ABC...",    // Player Solana address
  "amountZEC": 0.1             // Entry fee in ZEC
}
```

**What Exists** (`src/lib/integrations.ts`):
- ✅ `ZcashMemoBridge` class with `parseMemo()` method (lines 317-335)
- ✅ Memo JSON schema validation
- ✅ TypeScript bridge structure

**What's Missing** (Blocks Privacy Entry Feature):
- ❌ **Lightwalletd Watcher**: No implementation to monitor Zcash transactions
  - Not watching for incoming shielded transactions
  - No connection to Zcash network
  - Empty: `handleIncomingShieldedMemo()` exists but has no watcher logic
  
- ❌ **Contract Integration**: Bridge doesn't call Solana
  - Parser validates memo but doesn't trigger `join_game` instruction
  - No transaction construction from parsed memo
  - Missing: `await joinGame(parsed.gameId, parsed.solanaPubkey)`
  
- ❌ **CLI Support**: Memo command stubbed but not connected
  - `npm run cli -- memo --memo '{...}'` parses but doesn't submit to contract
  - No Helius transaction monitoring after submission

**Intended Entry Flow** (Currently Broken):
```
1. Player sends shielded ZEC to zcash_address with JSON memo  [USER DOES]
2. Lightwalletd monitors and detects memo  [NOT IMPLEMENTED]
3. Memo bridge parses JSON  [EXISTS]
4. Validates: gameId, solanaPubkey, amountZEC  [EXISTS]
5. Call join_game on Solana with player's pubkey  [NOT CONNECTED]
6. Player joins game anonymously  [NOT WORKING]
```

**Current Code** (Incomplete):
```typescript
export class ZcashMemoBridge {
  parseMemo(memo: string) {  // ✅ WORKS
    const data = JSON.parse(memo);
    if (data.v !== ZCASH_CONFIG.MEMO_SCHEMA_VERSION) return null;
    if (!data.gameId || !data.solanaPubkey || typeof data.amountZEC !== 'number') return null;
    return { gameId: data.gameId, solanaPubkey: data.solanaPubkey, amountZEC: data.amountZEC };
  }

  async handleIncomingShieldedMemo(memo: string) {  // ❌ NO WATCHER
    const parsed = this.parseMemo(memo);
    if (parsed) this.onEntry(parsed);  // Callback exists but never called
    // Missing: Actually watch for Zcash transactions
  }
}
```

**To Complete This Feature**:
1. Implement Lightwalletd watcher connection
2. Add memo parsing on incoming shielded transactions
3. Call Solana `join_game` instruction from bridge
4. Test: Zcash memo → Solana transaction → Player joins game
5. Document privacy flow for users

## Skill Mechanics (Phase 2)

### Information System

**Scanning Mechanism**:
```typescript
interface PlayerIntel {
  scannedCoordinates: Map<string, GameItem>; // Revealed items
  scanCharges: number;                        // Remaining scans
  adjacentVision: boolean;                    // See neighbors
}

// Smart contract addition
pub fn scan_coordinate(
    ctx: Context<ScanCoordinate>,
    coordinate: String
) -> Result<GameItem> {
    let game = &mut ctx.accounts.game;
    let player = &ctx.accounts.player;
    
    // Deduct scan charge
    require!(player.scan_charges > 0, PIR8Error::NoScansRemaining);
    player.scan_charges -= 1;
    
    // Reveal item without claiming
    let index = coordinate_to_index(&coordinate)?;
    let item = game.grid[index].clone();
    
    emit!(CoordinateScanned {
        player: player.key(),
        coordinate,
        item: format!("{:?}", item),
    });
    
    Ok(item)
}
```

### Timing System

**Speed Bonus Calculation**:
```typescript
interface TurnTimer {
  startTime: i64;
  decisionTime: i64;
  speedBonus: u64;
}

pub fn make_move_with_timing(
    ctx: Context<MakeMove>,
    coordinate: String,
    decision_time_ms: u64
) -> Result<()> {
    // Calculate bonus
    let bonus = match decision_time_ms {
        0..=5000 => 100,   // <5s: +100 points
        5001..=10000 => 50, // <10s: +50 points
        10001..=15000 => 25, // <15s: +25 points
        _ => 0
    };
    
    // Apply to player score
    let player = game.get_current_player_mut()?;
    player.speed_bonus_accumulated += bonus;
    
    // ... rest of move logic
}
```

## Performance Optimization

### Transaction Efficiency
- **Compute Units**: ~50k per move (well under 200k limit)
- **Account Size**: Game accounts <10KB (optimized for rent)
- **Batch Operations**: Multiple moves in single transaction (future)

### Frontend Performance
- **Code Splitting**: Dynamic imports for heavy components
- **State Updates**: Debounced re-renders
- **WebSocket**: Throttled event processing (max 10/sec)

### Scalability
- **Concurrent Games**: Unlimited (each game is separate PDA)
- **Players per Game**: 4 (current), expandable to 8
- **Transactions per Second**: Solana handles 65k TPS, we need <100

## Monitoring & Analytics

### Helius Enhanced Transactions
```typescript
// Get detailed transaction info
const tx = await helius.getTransaction(signature);

// Parse game events
const events = tx.meta.logMessages
  .filter(log => log.includes('PIR8'))
  .map(parseGameEvent);

// Track metrics
analytics.track('game_completed', {
  gameId: events.gameId,
  winner: events.winner,
  duration: events.completedAt - events.startedAt,
  totalMoves: events.moveCount
});
```

### Error Tracking
- **On-chain Errors**: Captured from transaction logs
- **Frontend Errors**: Sentry integration (planned)
- **Performance**: Helius latency monitoring

## Deployment

### Smart Contracts
```bash
# Build program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Verify deployment
solana program show <PROGRAM_ID>
```

### Frontend
```bash
# Build production bundle
npm run build

# Deploy to Vercel
vercel --prod

# Environment variables
NEXT_PUBLIC_SOLANA_RPC=<helius-url>
NEXT_PUBLIC_PROGRAM_ID=<deployed-program>
```

### CLI Tools
```bash
# Initialize platform config
npm run cli -- init

# Create test game
npm run cli -- create

# Monitor transactions
npm run cli -- monitor
```

## Security Considerations

### Smart Contract Audits
- **Pre-mainnet**: Full security audit required
- **Scope**: All game logic, economic calculations, access control
- **Timeline**: 2-3 weeks before mainnet launch

### Frontend Security
- **Wallet Integration**: Never request private keys
- **RPC Calls**: Rate limiting, error handling
- **User Input**: Sanitize all coordinate inputs

### Privacy Considerations
- **Zcash Memos**: Encrypted, only sender/receiver can read
- **On-chain Data**: Player addresses visible, moves visible
- **Future**: ZK-proofs for private moves (Phase 4)

## Testing Strategy

### Smart Contract Tests
```bash
# Unit tests
anchor test

# Integration tests
npm run test:integration

# Devnet testing
npm run cli -- create
npm run cli -- join 0
```

### Frontend Tests
```bash
# Component tests
npm run test

# E2E tests (planned)
npm run test:e2e
```

---

**Architecture designed for speed, security, and scalability.**
