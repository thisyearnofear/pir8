# Development Roadmap

## Current Status: Phase 1 (Foundation) - 80% Complete

### ✅ Completed
- Solana smart contracts (2,000+ lines of production Rust)
- Core game mechanics (7x7 grid, 12 special items, turn-based play)
- Wallet integration (Phantom, Solflare, Backpack)
- Helius real-time transaction monitoring
- Zcash memo watcher (basic implementation)
- Next.js frontend with responsive UI
- CLI tools for game management

### 🚧 In Progress
- Skill-based mechanics (scanning, timing, combos)
- Tournament smart contracts (design phase)
- Enhanced privacy features

---

## Phase 2: Skill Systems (Weeks 1-2)

### Goal
Transform gameplay from 70% luck / 30% skill → 30% luck / 70% skill

### Week 1: Information & Timing

#### Day 1-2: Scanning System
**Smart Contract**:
```rust
// Add to PlayerState
pub struct PlayerState {
    // ... existing fields
    pub scan_charges: u8,
    pub scanned_coordinates: Vec<String>,
}

// New instruction
pub fn scan_coordinate(
    ctx: Context<ScanCoordinate>,
    coordinate: String
) -> Result<GameItem> {
    // Validate scan charges
    // Reveal item without claiming
    // Emit scan event
}
```

**Frontend**:
- Add "Scan" button to GameControls
- Display scanned items with special styling
- Show remaining scan charges in PlayerStats

**Success Criteria**:
- [ ] Players start with 3 scan charges
- [ ] Scanning reveals item without claiming
- [ ] Scanned items visible only to scanning player
- [ ] Tests pass for scan logic

#### Day 3-4: Timing Mechanics
**Smart Contract**:
```rust
pub struct PlayerState {
    // ... existing fields
    pub speed_bonus_accumulated: u64,
    pub average_decision_time: u64,
}

pub fn make_move_with_timing(
    ctx: Context<MakeMove>,
    coordinate: String,
    decision_time_ms: u64
) -> Result<()> {
    // Calculate speed bonus
    // Update average decision time
    // Apply bonus to score
}
```

**Frontend**:
- Add turn timer to GameControls
- Display speed bonus when earned
- Show average decision time in PlayerStats

**Success Criteria**:
- [ ] Timer starts when turn begins
- [ ] Bonus awarded for fast decisions (<10s)
- [ ] Penalty for slow decisions (>30s)
- [ ] Average time tracked per player

#### Day 5: Testing & Polish
- Integration tests for scanning + timing
- UI/UX refinements
- Performance optimization
- Documentation updates

**Deliverable**: Skill-enhanced gameplay with 50/50 luck/skill balance

---

### Week 2: Advanced Mechanics

#### Day 6-7: Action Points System
**Smart Contract**:
```rust
pub const ACTION_POINTS_PER_TURN: u8 = 3;

pub enum PlayerAction {
    PickCoordinate,  // 2 AP
    ScanSquare,      // 1 AP
    BankPoints,      // 1 AP
    StealIntel,      // 2 AP
}

pub fn execute_actions(
    ctx: Context<ExecuteActions>,
    actions: Vec<PlayerAction>
) -> Result<()> {
    // Validate total AP <= 3
    // Execute each action
    // Advance turn
}
```

**Frontend**:
- Action selection UI with AP counter
- Drag-and-drop action builder
- AP budget visualization

**Success Criteria**:
- [ ] Players can queue multiple actions
- [ ] AP budget enforced on-chain
- [ ] Actions execute in sequence
- [ ] Turn advances after all actions

#### Day 8-9: Combo System
**Smart Contract**:
```rust
pub struct ComboTracker {
    pub consecutive_points: u8,
    pub special_item_chain: Vec<GameItem>,
    pub multiplier: f32,
}

pub fn apply_combo_bonus(
    player: &mut PlayerState,
    item: &GameItem
) -> u64 {
    // Check for combo patterns
    // Apply multiplier
    // Return bonus points
}
```

**Frontend**:
- Combo counter display
- Visual effects for combos
- Combo pattern guide

**Success Criteria**:
- [ ] Consecutive point picks = 1.5x multiplier
- [ ] Special item chains = bonus points
- [ ] Combos tracked per player
- [ ] Visual feedback on combo activation

#### Day 10: Territory Control
**Smart Contract**:
```rust
pub struct Territory {
    pub rows_controlled: [Option<Pubkey>; 7],
    pub columns_controlled: [Option<Pubkey>; 7],
}

pub fn check_territory_control(
    game: &Game
) -> Vec<(Pubkey, u64)> {
    // Calculate row/column control
    // Award bonuses
}
```

**Success Criteria**:
- [ ] Row control = +1000 points
- [ ] Column control = +1000 points
- [ ] Center control = +200/turn
- [ ] Territory displayed on grid

#### Day 11-12: Integration & Testing
- Full skill system integration
- Comprehensive testing
- Balance adjustments
- Documentation

**Deliverable**: Complete skill system with 70% skill / 30% luck balance

---

## Phase 3: Tournament Platform (Weeks 3-8)

### Week 3-4: Tournament Smart Contracts

#### Tournament Manager
```rust
#[account]
pub struct TournamentManager {
    pub authority: Pubkey,
    pub total_tournaments: u64,
    pub active_tournaments: Vec<u64>,
}

#[account]
pub struct Tournament {
    pub tournament_id: u64,
    pub status: TournamentStatus,
    pub max_players: u16,
    pub entry_fee: u64,
    pub prize_pool: u64,
    pub registered_players: Vec<Pubkey>,
    pub bracket: Vec<BracketStage>,
    pub token_mint: Option<Pubkey>,
}
```

**Instructions**:
- `initialize_tournament_manager`
- `create_tournament`
- `register_for_tournament`
- `seed_tournament` (leader seeding)
- `start_tournament`
- `advance_bracket`
- `complete_tournament`

**Timeline**: 10 days
- Days 1-3: Account structures
- Days 4-6: Core instructions
- Days 7-8: Bracket logic
- Days 9-10: Testing

### Week 5-6: Bracket & Progression

#### Bracket System
```rust
pub struct BracketStage {
    pub stage_number: u8,
    pub matches: Vec<Match>,
    pub winners: Vec<Pubkey>,
}

pub struct Match {
    pub match_id: u64,
    pub game_id: Option<u64>,
    pub player1: Pubkey,
    pub player2: Pubkey,
    pub winner: Option<Pubkey>,
    pub status: MatchStatus,
}
```

**Features**:
- Automatic bracket generation
- Match scheduling
- Winner advancement
- Bye handling (odd player counts)

**Timeline**: 10 days
- Days 1-4: Bracket generation algorithm
- Days 5-7: Match progression logic
- Days 8-10: Edge case handling & tests

### Week 7: Token Distribution

#### Pump Fun Integration
```typescript
async function createTournamentToken(
  tournamentId: number,
  prizePool: number
) {
  const metadata = {
    name: `PIR8 Tournament #${tournamentId}`,
    symbol: `TOUR${tournamentId}`,
    description: `Victory token for PIR8 Tournament #${tournamentId}`,
    image: generateTournamentImage(tournamentId)
  };
  
  // Create token with liquidity pool
  const result = await PumpFunCreator.createToken({
    ...metadata,
    initialBuySOL: prizePool * 0.5 // 50% to liquidity
  });
  
  return result.mint;
}
```

**Distribution Logic**:
```rust
pub fn distribute_tournament_rewards(
    ctx: Context<DistributeRewards>
) -> Result<()> {
    let tournament = &ctx.accounts.tournament;
    
    // Calculate allocations
    let winner = tournament.bracket.get_final_winner()?;
    let top5 = tournament.bracket.get_top_finishers(5)?;
    let top25 = tournament.bracket.get_top_finishers(25)?;
    
    // Distribute tokens
    transfer_tokens(winner, supply * 0.05)?;
    transfer_tokens(top5, supply * 0.15)?;
    transfer_tokens(top25, supply * 0.20)?;
    
    Ok(())
}
```

**Timeline**: 5 days

### Week 8: Frontend & Testing

#### Tournament UI
- Tournament lobby (registration)
- Bracket visualization
- Live match tracking
- Leaderboard
- Reward claiming interface

**Timeline**: 5 days

**Phase 3 Deliverable**: Functional tournament system with 50-100 player capacity

---

## Phase 4: Scale & Polish (Weeks 9-12)

### Week 9: Reputation System

**Features**:
- Player ELO ratings
- Tournament history
- Achievement badges
- Leaderboard rankings

**Smart Contract**:
```rust
#[account]
pub struct PlayerProfile {
    pub player: Pubkey,
    pub elo_rating: u16,
    pub tournaments_entered: u32,
    pub tournaments_won: u32,
    pub total_earnings: u64,
    pub achievements: Vec<Achievement>,
}
```

### Week 10: Spectator Mode

**Features**:
- Watch live games
- Tournament bracket view
- Player statistics
- Replay system (future)

**Implementation**:
- WebSocket streaming
- Read-only game state access
- Real-time updates

### Week 11: Mobile Optimization

**Tasks**:
- Responsive design improvements
- Touch gesture controls
- Mobile wallet integration
- Performance optimization

### Week 12: Launch Preparation

**Tasks**:
- Security audit
- Mainnet deployment
- Marketing materials
- Community building
- First tournament announcement

**Deliverable**: Production-ready tournament platform

---

## Phase 5: Growth & Expansion (Months 4-6)

### Month 4: First Tournaments
- Weekly 50-player tournaments
- $500-1000 prize pools
- Community building
- Streamer partnerships

### Month 5: Scale Operations
- Daily tournaments
- 200+ player capacity
- Sponsored tournaments
- Creator tools launch

### Month 6: Advanced Features
- Mobile app (React Native)
- Advanced privacy (ZK-proofs)
- Cross-chain expansion
- DAO governance (future)

---

## Success Metrics by Phase

### Phase 2 (Skill Systems)
- [ ] 70% skill / 30% luck balance achieved
- [ ] Player retention >60% (return for 2nd game)
- [ ] Average game duration 10-15 minutes
- [ ] Positive player feedback on skill depth

### Phase 3 (Tournaments)
- [ ] First 50-player tournament completed
- [ ] 50%+ tournament retention
- [ ] Token trading volume >$5k
- [ ] Zero critical bugs in tournament flow

### Phase 4 (Scale)
- [ ] 100+ players per tournament
- [ ] $5k+ prize pools
- [ ] 5+ active streamers
- [ ] 1000+ registered players

### Phase 5 (Growth)
- [ ] Weekly tournaments with 200+ players
- [ ] $50k+ quarterly championship
- [ ] 10,000+ player base
- [ ] Revenue positive

---

## Risk Management

### Technical Risks
| Risk | Mitigation | Timeline |
|------|------------|----------|
| Smart contract bugs | Extensive testing + audit | Before mainnet |
| Scalability issues | Load testing, Solana handles it | Ongoing |
| Privacy complexity | Start simple, iterate | Phase 4 |

### Market Risks
| Risk | Mitigation | Timeline |
|------|------------|----------|
| Low player acquisition | Focus on crypto communities | Phase 3-4 |
| Competition | Differentiate via privacy + skill | Ongoing |
| Token value collapse | Liquidity pools prevent death spiral | Phase 3 |

### Execution Risks
| Risk | Mitigation | Timeline |
|------|------------|----------|
| Scope creep | Strict phase boundaries | All phases |
| Timeline delays | Buffer time in each phase | All phases |
| Resource constraints | Focus on core features first | All phases |

---

## Resource Requirements

### Development
- **Smart Contracts**: 40 hours/week (Weeks 1-8)
- **Frontend**: 30 hours/week (Weeks 1-12)
- **Testing**: 10 hours/week (Ongoing)

### Infrastructure
- **Solana RPC**: Helius Pro ($50/month)
- **Hosting**: Vercel Pro ($20/month)
- **Monitoring**: Sentry ($26/month)

### Marketing (Phase 4+)
- **Community**: Discord, Twitter management
- **Content**: Tutorial videos, documentation
- **Partnerships**: Streamer outreach

---

## Next Immediate Steps (This Week)

### Day 1-2 (Now)
1. ✅ Consolidate documentation
2. ✅ Define skill mechanics
3. [ ] Begin scanning system implementation

### Day 3-4
4. [ ] Complete scanning smart contract
5. [ ] Build scanning UI
6. [ ] Write tests

### Day 5-7
7. [ ] Implement timing mechanics
8. [ ] Integration testing
9. [ ] Deploy to devnet
10. [ ] User testing with skill mechanics

**Goal**: Have skill-enhanced gameplay working by end of week

---

**Roadmap is aggressive but achievable. Focus on core mechanics, ship iteratively, gather feedback.**
