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

## Smart Contract Architecture

### Core Contracts

#### 1. Game Contract (`pir8_game`)
**Location**: `/programs/pir8-game/src/lib.rs`
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
    pub fn make_move(...)          // Move ship within speed range
    pub fn attack_ship(...)        // Deal damage to enemy vessel in range
    pub fn claim_territory(...)    // Claim port/island/treasure at ship location
    pub fn collect_resources(...)  // Harvest resources from controlled territory
    pub fn build_ship(...)         // Build new ship at controlled port (costs resources)
    pub fn complete_game(...)      // Finalize and determine winner
    pub fn claim_winnings(...)     // Winner withdraws prize

    // Skill Mechanics
    pub fn scan_coordinate(...)    // Reveal territory type without claiming
    pub fn make_move_timed(...)    // Move with timing bonus calculation

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
    pub game_map: GameMap,           // 10x10 strategic map
    pub entry_fee: u64,              // Entry cost
    pub total_pot: u64,              // Prize pool
    pub winner: Option<Pubkey>,      // Winner address
    pub turn_number: u64,            // Current turn
    pub current_player_index: u64,   // Index of current player
    // ... metadata and reserved space
}

// Player state within game
pub struct PlayerState {
    pub player_key: Pubkey,          // Player address
    pub resources: Resources,        // Gold, crew, cannons, supplies
    pub ships: Vec<Ship>,            // Player's fleet
    pub controlled_territories: Vec<String>, // Claimed territories
    pub total_score: u64,            // Current score
    pub is_active: bool,             // Active in current game
    pub scan_charges: u8,            // Remaining scan charges
    pub speed_bonus_accumulated: u64, // Accumulated timing bonuses
    pub average_decision_time_ms: u64, // Average decision time
    pub total_moves: u64,            // Total moves made
}
```

**Ship Types**:
```rust
pub struct Ship {
    pub id: String,                  // Unique identifier
    pub ship_type: ShipType,         // Sloop, Frigate, Galleon, Flagship
    pub health: u8,                  // Current health
    pub max_health: u8,              // Maximum health
    pub attack: u8,                  // Attack power
    pub defense: u8,                 // Defense power
    pub speed: u8,                   // Movement speed
    pub position: Coordinate,        // Current position
    pub resources: Resources,        // Carried resources
}

pub enum ShipType {
    Sloop,      // Fast scout (low health, moderate attack)
    Frigate,    // Balanced (moderate everything)
    Galleon,    // Heavy (high health, high attack)
    Flagship,   // Commander (highest stats)
}
```

**Resource System**:
```rust
pub struct Resources {
    pub gold: u64,       // Currency for building
    pub crew: u64,       // Manpower for ships
    pub cannons: u64,    // Weaponry for combat
    pub supplies: u64,   // Materials for maintenance
}
```

**Territory Types**:
```rust
pub enum TerritoryType {
    Water,      // Safe passage
    Island,     // Supplies generation (+3/turn)
    Port,       // Ship building hub (+5 gold, +2 crew/turn)
    Treasure,   // Wealth generator (+10 gold/turn)
    Storm,      // Hazard (-50% movement)
    Reef,       // Hidden hazard (-20 health if hit)
    Whirlpool,  // Deadly trap (-100 health)
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
- Coordinate validation (A1-J10 only on 10x10 map)
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
│   ├── GameCockpit/     # Main game UI components
│   ├── PirateControls.tsx     # Game controls (ship select, actions, scan)
│   ├── PirateMap.tsx          # 10x10 game map with territory/ships
│   ├── PlayerStats.tsx        # Player scores + skill metrics
│   ├── BattleInfoPanel.tsx    # Weather, phase, turn info
│   ├── TurnBanner.tsx         # YOUR TURN indicator
│   ├── OnboardingModal.tsx    # First-game tutorial
│   ├── ShipActionModal.tsx    # Action menu for ships
│   ├── TerritoryTooltip.tsx   # Territory effect tooltips
│   ├── ErrorBoundary.tsx      # Error handling
│   ├── Toast.tsx              # Notifications
│   └── WalletProvider.tsx     # Wallet integration
│
├── hooks/
│   ├── usePirateGameState.ts     # Game state + skill mechanics
│   ├── useZcashBridge.ts         # Zcash integration
│   ├── useErrorHandler.ts        # Error management
│   ├── useShowOnboarding.ts      # Onboarding state
│   └── useTurnIndicator.ts       # Turn status
│
├── lib/
│   ├── integrations.ts       # Helius/Pump/Zcash
│   ├── anchorClient.ts       # Anchor transactions
│   ├── gameLogic.ts          # Core game rules
│   ├── pirateGameEngine.ts   # Game state logic
│   └── anchorUtils.ts        # PDA utilities
│
└── types/
    └── game.ts               # TypeScript interfaces
```

### State Management

**Game State Flow**:
```typescript
// Zustand store (client-side)
interface GameState {
  gameId: string;
  players: Player[];
  gameMap: GameMap;
  currentPlayerIndex: number;
  status: 'waiting' | 'active' | 'completed';
  winner?: string;
  currentPhase: 'deployment' | 'movement' | 'combat' | 'resource_collection';
  turnNumber: number;
  turnTimeRemaining: number;
  pendingActions: GameAction[];
  eventLog: GameEvent[];
  globalWeather: WeatherEffect;
}

// Sync with on-chain state
1. User action (move ship, attack, claim)
2. Frontend validation
3. Submit transaction to Solana
4. Helius monitors transaction
5. Update local state on confirmation
6. Emit events to other players
```

### Real-Time Updates

**Helius WebSocket Integration + On-Chain Sync**:

PIR8 uses a dual approach for real-time synchronization:

**1. Helius WebSocket Events** (`useHeliusMonitor.ts`):
```typescript
// Real-time transaction monitoring
const { isConnected } = useHeliusMonitor({
  gameId: 'pirate_5',
  onGameEvent: (event) => {
    switch (event.type) {
      case 'playerJoined':
        setMessage('⚡ Player joined via blockchain!');
        break;
      case 'gameStarted':
        setMessage('🚀 Battle commenced!');
        break;
      case 'shipMoved':
        updateShipPosition(event.shipId, event.newPosition);
        break;
      case 'shipAttacked':
        updateShipHealth(event.targetShipId, event.newHealth);
        break;
      case 'territoryClaimed':
        updateTerritoryOwnership(event.territory, event.player);
        break;
    }
  }
});
```

**2. On-Chain State Synchronization** (`useOnChainSync.ts`):
```typescript
// Automatic UI sync with blockchain state
const { heliusConnected, lastSync } = useOnChainSync(gameState?.gameId);

// Features:
// ✅ Real-time player count updates when CLI joins games
// ✅ 30-second polling backup for missed events
// ✅ Visual feedback for sync operations
// ✅ Smart change detection (only updates when needed)
```

**Sync Flow**: CLI joins → On-chain update → Helius WebSocket → UI state sync → Player count updates

## Privacy Layer

### Zcash Integration

**Shielded Memo Schema**:
```json
{
  "v": "1",                    // Schema version
  "gameId": "game_123",        // Target game ID
  "action": "join",            // Action: join or create
  "solanaPubkey": "ABC...",    // Player Solana address (base58, 44 chars)
  "timestamp": 1704067200000   // Memo creation time (freshness check)
}
```

**Architecture Components**:

1. **ZcashMemoBridge** (`src/lib/integrations.ts`):
   - `parseMemo()`: Validates schema version, required fields, pubkey format
   - `validateMemoFreshness()`: Ensures memo <5 minutes old (prevents replay)
   - `handleIncomingShieldedMemo()`: Processes incoming Zcash transactions from watcher
   - `createMemo()`: Static helper for CLI/frontend memo construction
   - `getPrivateEntryInstructions()`: Async user-facing guide for private entry

2. **LightwalletdWatcher** (`src/lib/integrations.ts`):
   - WebSocket connection to Lightwalletd server
   - Subscribes to shielded transactions for our address
   - `processZcashTransaction()`: Extracts memo from vShieldedOutput
   - `decodeMemo()`: Handles hex/base64 encoding
   - Exponential backoff reconnection (max 5 attempts)
   - Integrated logging and error handling

3. **joinGamePrivateViaZcash()** (`src/lib/anchorClient.ts`):
   - Single source of truth for memo-triggered Solana transactions
   - Constructs join_game instruction with player pubkey from memo
   - Validates gameId, fetches config PDA, executes transaction
   - Logs both Zcash TX hash and Solana TX hash for verification
   - Error handling with descriptive messages

4. **useZcashBridge hook** (`src/hooks/useZcashBridge.ts`):
   - React integration for automatic bridge lifecycle
   - Handles Lightwalletd connection on mount, cleanup on unmount
   - Wires memo callbacks to Anchor client
   - Provides bridge status for conditional UI rendering
   - Callback hooks for success/error handling

**Complete Entry Flow**:
```
1. Player sends shielded ZEC to ZCASH_CONFIG.SHIELDED_ADDRESS with JSON memo
   ↓
2. LightwalletdWatcher (WebSocket) detects incoming tx
   ↓
3. Extracts and decodes memo from vShieldedOutput[].memo
   ↓
4. ZcashMemoBridge.handleIncomingShieldedMemo() validates:
   - Schema version matches MEMO_SCHEMA_VERSION
   - Required fields: gameId, action, solanaPubkey
   - Memo timestamp <5 minutes old
   ↓
5. onMemoEntry callback invoked with MemoPayload
   ↓
6. joinGamePrivateViaZcash() executes join_game instruction:
   - Converts gameId string → number
   - Derives game PDA: getGamePDA(gameId)
   - Constructs accounts with player pubkey from memo
   - Submits transaction to Solana
   ↓
7. Player joins game (Solana address on-chain, Zcash identity stays private)
```

**Zypherpunk Value Proposition**:
- First privacy-first competitive gaming platform
- Zcash shielded memos create fully private tournament entry
- Player identity stays in Zcash shielded pool
- On-chain gameplay is transparent (verifiable fairness)
- Hybrid privacy: Private entry + Public gameplay

## Skill Mechanics Implementation

### Scanning System

**How It Works**:
- Each player starts with 3 scan charges
- Players can scan a coordinate to reveal its territory type
- Scanned tiles remain revealed for the entire game
- Limited scans force strategic decisions

**Smart Contract Addition**:
```rust
pub fn scan_coordinate(
    ctx: Context<ScanCoordinate>,
    coordinate_x: u8,
    coordinate_y: u8
) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let player = &mut game.get_current_player_mut()?;

    // Deduct scan charge
    require!(player.scan_charges > 0, PIR8Error::NoScansRemaining);
    player.scan_charges -= 1;

    // Reveal territory type without claiming
    let territory = game.game_map.get_territory(coordinate_x, coordinate_y)?;
    let territory_type = territory.territory_type.clone();

    emit!(CoordinateScanned {
        player: player.player_key,
        coordinate: format!("{}{}", coordinate_x, coordinate_y),
        territory_type: format!("{:?}", territory_type),
        charges_remaining: player.scan_charges,
    });

    Ok(())
}
```

### Timing System

**Speed Bonus Calculation**:
```rust
pub fn make_move_timed(
    ctx: Context<MakeMoveTimed>,
    ship_id: String,
    to_x: u8,
    to_y: u8,
    decision_time_ms: u64
) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let player = &mut game.get_current_player_mut()?;

    // Calculate bonus
    let bonus = match decision_time_ms {
        0..=5000 => 100,   // <5s: +100 points
        5001..=10000 => 50, // <10s: +50 points
        10001..=15000 => 25, // <15s: +25 points
        _ => 0
    };

    // Apply to player score
    player.speed_bonus_accumulated += bonus;
    player.average_decision_time_ms = calculate_new_average(
        player.average_decision_time_ms,
        player.total_moves,
        decision_time_ms
    );
    player.total_moves += 1;

    // Execute the move
    // ... rest of move logic

    Ok(())
}
```

### Game Balance Impact
- Information gathering: 3 scans per player enable strategic advantage
- Timing rewards: Fast decisions (<10s) yield +100 bonus per move
- Over 20 turns: Skilled player can accumulate 500+ speed bonus vs unskilled +0
- Shifts game from 70% luck / 30% skill → 30% luck / 70% skill

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
- **Performance Monitoring**: Transaction timing and success rates