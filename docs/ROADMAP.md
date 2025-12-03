# Development Roadmap

## ⚠️ CURRENT STATUS: Phase 1 (Foundation) - 40% Complete

**ZYPHERPUNK HACKATHON FOCUS** - Privacy-first fleet warfare built on Solana + Zcash

### ✅ Completed
- 10x10 strategic map generation with biome distribution
- Fleet system with 4 ship types (Sloop, Frigate, Galleon, Flagship)
- Core game instructions: create_game, join_game, move_ship, attack_ship, claim_territory
- Weather system framework (Calm, TradeWinds, Storm, Fog)
- Wallet integration (Phantom, Solflare, Backpack)
- Helius WebSocket transaction monitoring
- Zcash memo parser (ready to integrate)

### 🔴 CRITICAL BLOCKERS - MUST FIX FIRST
1. **Smart Contract Compilation**
   - Deleted conflicting lib.rs
   - Need to verify instructions.rs + pirate_lib.rs compile cleanly
   - Status: Ready to test `anchor build`
   
2. **Devnet Deployment**
   - Contracts not yet deployed
   - Blocks all gameplay testing
   - Timeline: 1 day after compilation verified
   
3. **Zcash Bridge Integration**
   - Memo parser exists but not connected to join_game instruction
   - Goal: Players enter tournaments via Zcash shielded memos
   - Timeline: 2 days after deployment

### 🚧 In Progress (Priority Order for Zypherpunk)
- Test smart contract compilation
- Deploy to Devnet
- Implement resource generation system
- Wire Zcash memo to tournament entry

---

## 🔧 ZYPHERPUNK SUBMISSION PLAN (7 Days)

### Days 1-2: Compilation & Deployment

**Task 1.1: Verify Contract Compilation**
- [ ] Run `anchor build` in contracts/pir8-game
- [ ] Verify no module conflicts (lib.rs deleted, instructions.rs + pirate_lib.rs only)
- [ ] Confirm binary generated at target/deploy/pir8_game.so

**Task 1.2: Deploy to Devnet**
- [ ] Configure Anchor.toml for devnet RPC (Helius)
- [ ] Run `anchor deploy --provider.cluster devnet`
- [ ] Record program ID
- [ ] Update frontend with new program ID

**Task 1.3: Test Core Flow**
- [ ] Test create_game instruction
- [ ] Test join_game instruction
- [ ] Test move_ship instruction
- [ ] Verify events emit correctly

**Success Criteria**:
```bash
$ anchor build
# ✅ Compiled successfully
$ anchor deploy --provider.cluster devnet
# ✅ Deployed to devnet
```

### Days 3-4: MVP Playability

**Task 2.1: Resource Generation**
- [ ] Implement resource collection from controlled territories
- [ ] Add ship building instruction with resource costs
- [ ] Test resource economy (gold/crew/supplies/cannons)

**Task 2.2: Game Loop**
- [ ] Implement game completion conditions
- [ ] Add winner determination logic
- [ ] Test full 2-4 player game flow

**Task 2.3: Frontend Updates**
- [ ] Display fleet status UI
- [ ] Show controlled territories
- [ ] Implement move/attack/claim UI buttons

**Success Criteria**:
- Complete 2-player game from start to finish
- Resources generate and deplete correctly
- UI shows game state accurately

### Days 5-6: Privacy Integration (Zypherpunk Core)

**Task 3.1: Zcash Bridge Completion**
- [ ] Wire memo parser to join_game instruction
- [ ] Implement tournament entry via shielded memo
- [ ] Create Zcash → Solana payment flow

**Task 3.2: Private Move Tracking** 
- [ ] Implement encrypted move storage (optional, Phase 2)
- [ ] Add shielded memo field to game events
- [ ] Document privacy guarantees

**Task 3.3: Demo Preparation**
- [ ] Create walkthrough: "Enter tournament privately via Zcash"
- [ ] Record demo video
- [ ] Document integration

**Success Criteria**:
- Players can enter tournament via Zcash shielded memo
- Move history shielded from public blockchain
- Clear privacy narrative for judges

### Days 7+: Polish & Documentation

**Task 4.1: Documentation**
- [ ] Update GETTING_STARTED.md with actual steps
- [ ] Write Zcash integration guide
- [ ] Create architecture doc explaining privacy approach
- [ ] Add demo instructions

**Task 4.2: Zypherpunk Submission**
- [ ] Prepare submission narrative (70% skill, privacy-first)
- [ ] Create architecture diagram
- [ ] Record final demo video
- [ ] Submit before deadline

**Success Criteria**:
- Clear, compelling submission story
- Working product demo
- Privacy + skill narrative aligned with Zypherpunk values

---

## Phase 2: Skill Systems (After Phase 1 Fixed - Weeks 1-2)

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

## Hackathon Implications (ZYPHERPUNK)

**Current State**: ⚠️ **NOT READY** - Contracts don't compile, can't be deployed

**What's Needed for Submission**:
1. ✅ Zcash integration (conceptually strong, partially implemented)
2. ✅ Privacy-first narrative (matches hackathon theme perfectly)
3. ❌ **Working contracts (BLOCKER)**
4. ❌ **Deployed product (BLOCKER)**

**Recommendation**: Fix Phase 1 blockers (Days 1-2) first, then:
- Deploy contracts to devnet
- Show working game + Zcash privacy flow
- Submit with "foundation deployed, skill systems coming" narrative

**Timeline**: 
- Day 1-2: Fix compilation + deploy
- Day 3: Polish demo + documentation
- Day 4+: Can start Phase 2 (skill mechanics) if time permits

Without fixing the compilation errors, the project cannot be deployed and will not be a viable hackathon submission.

---

**Prioritized Roadmap**: Fix compilation → Deploy → Demo → Polish (in that order)
