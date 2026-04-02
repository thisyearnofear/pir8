# PIR8 Architecture

## System Overview

PIR8 is a full-stack Web3 gaming platform built on Solana with privacy features powered by session key architecture. The architecture prioritizes speed, security, and skill-based gameplay.

## Technology Stack

### Blockchain Layer
- **Solana Devnet/Mainnet**: Primary execution layer
- **Anchor Framework 0.30+**: Smart contract development
- **Session Keys**: Ephemeral identity via AgentRegistry delegate pattern
- **Helius RPC**: Enhanced transaction monitoring

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Solana Wallet Adapter**: Multi-wallet support

### Backend Services
- **Node.js**: CLI tools and automation
- **Helius WebSocket**: Real-time game monitoring

## Smart Contract Architecture

### Core Contracts

#### Game Contract (`pir8_game`)
**Location**: `/programs/pir8-game/src/lib.rs`

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
    pub fn attack_ship(...)        // Deal damage to enemy vessel
    pub fn claim_territory(...)    // Claim port/island/treasure
    pub fn collect_resources(...)  // Harvest resources from territory
    pub fn build_ship(...)         // Build new ship at controlled port
    pub fn complete_game(...)      // Finalize and determine winner
    pub fn claim_winnings(...)     // Winner withdraws prize

    // Skill Mechanics
    pub fn scan_coordinate(...)    // Reveal territory type
    pub fn make_move_timed(...)    // Move with timing bonus
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
}

// Player state within game
pub struct PlayerState {
    pub player_key: Pubkey,          // Player address
    pub resources: Resources,        // Gold, crew, cannons, supplies
    pub ships: Vec<Ship>,            // Player's fleet
    pub controlled_territories: Vec<String>,
    pub total_score: u64,
    pub scan_charges: u8,
    pub speed_bonus_accumulated: u64,
}
```

**Ship Types**:
```rust
pub struct Ship {
    pub id: String,
    pub ship_type: ShipType,         // Sloop, Frigate, Galleon, Flagship
    pub health: u8,
    pub max_health: u8,
    pub attack: u8,
    pub defense: u8,
    pub speed: u8,
    pub position: Coordinate,
}

pub enum ShipType {
    Sloop,      // Fast scout (Speed 3, 100 HP, 500 gold)
    Frigate,    // Balanced (Speed 2, 200 HP, 1200 gold)
    Galleon,    // Heavy (Speed 1, 350 HP, 2500 gold)
    Flagship,   // Ultimate (Speed 1, 500 HP, 5000 gold)
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
- PDA-based account derivation
- Signer validation on state-changing instructions
- Authority checks for admin functions

**Economic Security**:
- Entry fee validation (minimum thresholds)
- Platform fee caps (max 10%)
- Overflow protection on all arithmetic

**Game Integrity**:
- Coordinate validation (A1-J10 on 10x10 map)
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
│   ├── GameCockpit/      # Main game UI components
│   ├── PirateControls.tsx
│   ├── PirateMap.tsx
│   ├── PlayerStats.tsx
│   ├── BattleInfoPanel.tsx
│   └── WalletProvider.tsx
│
├── hooks/
│   ├── usePirateGameState.ts
│   ├── useSessionKey.ts      # Privacy via ephemeral wallets
│   ├── useOnChainSync.ts
│   └── useHeliusMonitor.ts
│
├── lib/
│   ├── integrations.ts       # Helius/Pump integrations
│   ├── anchorClient.ts       # Anchor transactions
│   ├── gameLogic.ts          # Core game rules
│   └── pirateGameEngine.ts
│
└── types/
    └── game.ts               # TypeScript interfaces
```

### State Management

**Game State Flow**:
```typescript
interface GameState {
  gameId: string;
  players: Player[];
  gameMap: GameMap;
  currentPlayerIndex: number;
  status: 'waiting' | 'active' | 'completed';
  winner?: string;
  turnNumber: number;
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

**Helius WebSocket Integration**:
```typescript
// Real-time transaction monitoring
const { isConnected } = useHeliusMonitor({
  gameId: 'pirate_5',
  onGameEvent: (event) => {
    switch (event.type) {
      case 'playerJoined':
        setMessage('⚡ Player joined via blockchain!');
        break;
      case 'shipMoved':
        updateShipPosition(event.shipId, event.newPosition);
        break;
      case 'territoryClaimed':
        updateTerritoryOwnership(event.territory, event.player);
        break;
    }
  }
});
```

**On-Chain Synchronization**:
```typescript
// Automatic UI sync with blockchain state
const { heliusConnected, lastSync } = useOnChainSync(gameState?.gameId);

// Features:
// ✅ Real-time player count updates when CLI joins games
// ✅ 30-second polling backup for missed events
// ✅ Visual feedback for sync operations
```

## Privacy Layer

### Session Key Architecture

PIR8 achieves privacy without cross-chain bridges or server-side signing by leveraging the existing `AgentRegistry` delegate pattern already deployed in the Solana program.

**How It Works**:
```
1. Player generates ephemeral keypair in-browser (session key)
   ↓
2. Player calls delegate_agent_control(session_pubkey) from main wallet
   ↓
3. Session key joins and plays the game — main wallet never touches game PDA
   ↓
4. All gameplay transactions signed by session key (user funds it with small SOL amount)
   ↓
5. At game end, rewards claimable back to main wallet via AgentRegistry link
   ↓
6. AgentRegistry PDA can be closed after game — session key becomes unlinkable
```

**Why This Works**:
- **~2 second** join time (vs ~2 minutes with cross-chain bridge)
- **Zero server cost** — user pays their own gas with the session key
- **Real privacy** — session key is unlinkable to main wallet on-chain
- **Self-custody** — user controls both keys, no trust in server

**On-Chain Contract Support** (already deployed):
```rust
// programs/pir8-game/src/instructions/gameplay.rs
pub struct AgentRegistry {
    pub owner: Pubkey,
    pub delegate: Option<Pubkey>,  // ← Session key goes here
    // ...
}

pub fn delegate_agent_control(ctx, delegate: Option<Pubkey>) -> Result<()>
```

**Architecture Components**:
1. **Session Key Generator**: In-browser ephemeral keypair creation
2. **AgentRegistry**: On-chain delegate pattern (already deployed)
3. **PrivacySimulator**: Educational privacy layer for practice mode (Ghost Fleet, Leakage Meter, Bounty Board)

**Future Enhancement**: `JoinGameViaDelegate` and `MakeMoveViaDelegate` instruction variants that accept a session key signer whose `AgentRegistry.delegate` matches are already implemented and deployed. The frontend "Play Privately" toggle wires this flow end-to-end.

## Agentic Infrastructure

- **Multi-Game Factory**: Dynamic PDA derivation for unlimited concurrent games
- **Agent Observation**: Event streams, account snapshots, machine-readable IDL
- **Agent Registry**: On-chain identity tracking for autonomous agents

## Performance Optimization

- **Compute Units**: ~50k per move (well under 200k limit)
- **Account Size**: <10KB optimized for Solana realloc limits
- **Frontend**: Code splitting, debounced re-renders, throttled WebSocket
- **Scalability**: Unlimited concurrent games, 65k TPS capacity
