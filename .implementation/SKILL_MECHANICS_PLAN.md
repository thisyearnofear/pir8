# Skill Mechanics Implementation Plan

## Phase 1: Scanning System (Days 1-2)

### Smart Contract Changes (ENHANCEMENT)
**File**: `contracts/pir8-game/src/lib.rs`

#### Enhance PlayerState (lines 297-325)
```rust
pub struct PlayerState {
    // Existing fields
    pub player_key: Pubkey,
    pub points: u64,
    pub banked_points: u64,
    pub has_elf: bool,
    pub has_bauble: bool,
    pub is_active: bool,
    pub joined_at: i64,
    pub last_move_at: i64,
    
    // NEW: Skill mechanics
    pub scan_charges: u8,              // Remaining scans (default: 3)
    pub scanned_coordinates: Vec<u8>,  // Indices of scanned squares
    pub speed_bonus_accumulated: u64,  // Total timing bonus
    pub average_decision_time_ms: u64, // Running average
    pub total_moves: u8,               // For average calculation
}
```

#### Add New Instruction: scan_coordinate
```rust
#[derive(Accounts)]
pub struct ScanCoordinate<'info> {
    #[account(
        mut,
        constraint = game.status == GameStatus::Active @ PIR8Error::GameNotActive,
        constraint = game.get_current_player().unwrap().player_key == player.key() @ PIR8Error::NotYourTurn
    )]
    pub game: Account<'info, Game>,
    pub player: Signer<'info>,
}

pub fn scan_coordinate(
    ctx: Context<ScanCoordinate>,
    coordinate: String
) -> Result<u8> {
    // Validate coordinate
    // Check scan charges
    // Return item type without claiming
    // Emit event
}
```

#### Add New Event
```rust
#[event]
pub struct CoordinateScanned {
    pub game_id: u64,
    pub player: Pubkey,
    pub coordinate: String,
    pub item_index: u8,  // Don't reveal exact item, just type
    pub timestamp: i64,
}
```

### Frontend Changes (ENHANCEMENT)

#### Enhance Player Type
**File**: `src/types/game.ts`
```typescript
export interface Player {
  publicKey: string;
  points: number;
  bankedPoints: number;
  hasElf: boolean;
  hasBauble: boolean;
  username?: string;
  
  // NEW: Skill mechanics
  scanCharges: number;
  scannedCoordinates: string[];
  speedBonusAccumulated: number;
  averageDecisionTimeMs: number;
}
```

#### Enhance GameControls Component
**File**: `src/components/GameControls.tsx`
- Add "Scan" button (1 AP equivalent)
- Display remaining scan charges
- Show scanned items with special styling
- Visual indicator for scanned vs unscanned squares

---

## Phase 2: Timing Mechanics (Days 3-4)

### Smart Contract Changes (ENHANCEMENT)

#### Enhance make_move instruction
```rust
pub fn make_move_with_timing(
    ctx: Context<MakeMove>,
    coordinate: String,
    decision_time_ms: u64
) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let clock = Clock::get()?;
    
    // Calculate speed bonus
    let speed_bonus = calculate_speed_bonus(decision_time_ms);
    
    // Update player stats
    let player = game.get_current_player_mut()?;
    player.speed_bonus_accumulated += speed_bonus;
    player.total_moves += 1;
    
    // Update running average
    let total_time = player.average_decision_time_ms * (player.total_moves - 1) as u64;
    player.average_decision_time_ms = (total_time + decision_time_ms) / player.total_moves as u64;
    
    // ... existing move logic
    
    // Apply speed bonus to points
    player.points += speed_bonus;
}

fn calculate_speed_bonus(decision_time_ms: u64) -> u64 {
    match decision_time_ms {
        0..=5000 => 100,
        5001..=10000 => 50,
        10001..=15000 => 25,
        15001..=30000 => 0,
        _ => 0  // No penalty for now, just no bonus
    }
}
```

### Frontend Changes (ENHANCEMENT)

#### Enhance useGameState Hook
**File**: `src/hooks/useGameState.ts`
- Track turn start time
- Calculate decision time on move
- Pass decision_time_ms to smart contract

#### Enhance GameControls Component
- Add turn timer display
- Visual feedback for speed bonus earned
- Color-coded timer (green <10s, yellow <20s, red >20s)

---

## File Structure (ORGANIZED)

```
contracts/pir8-game/src/
└── lib.rs                    # ENHANCE existing (don't split)

src/
├── types/
│   └── game.ts              # ENHANCE Player interface
│
├── hooks/
│   └── useGameState.ts      # ENHANCE with timing logic
│
├── components/
│   ├── GameControls.tsx     # ENHANCE with scan + timer
│   └── PlayerStats.tsx      # ENHANCE with new stats display
│
└── lib/
    └── anchor.ts            # ENHANCE with new instructions
```

---

## Implementation Checklist

### Day 1: Smart Contract - Scanning
- [ ] Enhance PlayerState struct with scan fields
- [ ] Add ScanCoordinate account context
- [ ] Implement scan_coordinate instruction
- [ ] Add CoordinateScanned event
- [ ] Update PlayerState::new() to initialize scan_charges = 3
- [ ] Write unit tests for scanning
- [ ] Deploy to devnet

### Day 2: Frontend - Scanning
- [ ] Enhance Player type in game.ts
- [ ] Add scan instruction to anchor.ts client
- [ ] Add "Scan" button to GameControls
- [ ] Display scan charges in PlayerStats
- [ ] Visual styling for scanned coordinates
- [ ] Handle scan events from Helius
- [ ] Test end-to-end scanning flow

### Day 3: Smart Contract - Timing
- [ ] Enhance make_move to accept decision_time_ms
- [ ] Implement calculate_speed_bonus helper
- [ ] Update player stats with timing data
- [ ] Add timing info to MoveMade event
- [ ] Write unit tests for timing bonuses
- [ ] Deploy to devnet

### Day 4: Frontend - Timing
- [ ] Add turn timer to useGameState
- [ ] Calculate decision time on move
- [ ] Pass timing to make_move instruction
- [ ] Display timer in GameControls
- [ ] Show speed bonus notification
- [ ] Display average decision time in PlayerStats
- [ ] Test end-to-end timing flow

---

## Testing Strategy (MODULAR)

### Unit Tests (Anchor)
```bash
# Test scanning
anchor test -- --test test_scan_coordinate

# Test timing
anchor test -- --test test_timing_bonus

# Test integration
anchor test -- --test test_scan_and_move
```

### Integration Tests (Frontend)
```typescript
describe('Skill Mechanics', () => {
  it('should allow scanning coordinates', async () => {
    // Create game, join, start
    // Scan coordinate
    // Verify scan charge decremented
    // Verify item revealed
  });
  
  it('should award speed bonuses', async () => {
    // Make move in <5s
    // Verify +100 bonus
    // Check average time updated
  });
});
```

---

## Performance Considerations (PERFORMANT)

### Smart Contract
- Scan charges stored as u8 (1 byte vs 8 bytes for u64)
- Scanned coordinates as Vec<u8> (indices, not strings)
- Speed bonus calculation is O(1)
- Average time uses running average (no array storage)

### Frontend
- Debounce timer updates (100ms intervals)
- Cache scanned items locally
- Lazy load scan visualization
- Minimize re-renders on timer tick

---

## Rollout Strategy

### Week 1: Devnet Testing
- Deploy enhanced contracts
- Internal testing with 2-4 players
- Gather feedback on balance

### Week 2: Balance Adjustments
- Tune scan charges (3 vs 5?)
- Adjust speed bonus values
- Test with larger groups (8+ players)

### Week 3: Mainnet Preparation
- Security audit of new code
- Performance testing under load
- Documentation updates

---

## Success Metrics

### Technical
- [ ] Scan instruction <30k compute units
- [ ] Timing calculation <5k compute units
- [ ] No increase in account size >100 bytes
- [ ] All tests passing

### Gameplay
- [ ] Players use scans strategically (not all at once)
- [ ] Average decision time <15s
- [ ] Speed bonuses affect 30%+ of games
- [ ] Positive player feedback on skill depth

---

**Following Core Principles:**
- ✅ ENHANCEMENT FIRST: Extending PlayerState, not creating new structs
- ✅ DRY: Single PlayerState definition, shared across contract
- ✅ CLEAN: Clear separation of scan vs move logic
- ✅ MODULAR: Each skill mechanic is independent
- ✅ PERFORMANT: Minimal storage, O(1) calculations
- ✅ ORGANIZED: Existing file structure maintained
