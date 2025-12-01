# 🏴‍☠️ PIR8 Tournament System

## Overview

The PIR8 Tournament System introduces a multi-stage competitive format where players compete in bracket-style tournaments with progressive elimination, culminating in token distribution based on performance.

## Tournament Structure

### Registration Phase
- **Max Players**: 400 participants
- **Entry Fee**: 0.1 SOL per player
- **Total Pool**: Up to 40 SOL for liquidity
- **Registration Cap**: Once 200 players register, countdown begins
- **Countdown Period**: 24 hours to reach maximum capacity

### Bracket Progression
```
Stage 1: 400 players → 200 winners (4-player games)
Stage 2: 200 players → 100 winners (2-player games)
Stage 3: 100 players → 50 winners (2-player games)
Stage 4: 50 players → 25 winners (2-player games)
Quarterfinals: 25 players → Top 8 advance
Semifinals: 8 players compete in groups
Finals: Top 4 compete for championship
```

## Leader-Seeded Tournaments

### Seeding Model
Leaders can seed tournaments by depositing capital:
- **Seed Capital**: 1-5 SOL to start tournament
- **Time Limit**: 72 hours to fill the bracket
- **Success Threshold**: Minimum 200 participants to qualify

### Seeding Rewards/Risks
```
Successful Seed (≥200 players):
- Keep seed capital
- Receive 2% of final token supply
- Reputation boost for future tournaments
- Priority placement in platform listings

Failed Seed (<200 players):
- Lose seed capital (goes to platform treasury)
- Temporary cooldown on seeding new tournaments
- Reduced rewards in future successful seeds
```

## Token Distribution Model

### Performance-Based Allocation
```
Tournament Winner: 5% of token supply
Top 5 Finishers: 15% (3% each)
Top 25 Finishers: 20% (0.8% each)
Top 100 Finishers: 25% (0.25% each)
Active Participants (played ≥3 rounds): 15% (0.1% each)
Liquidity Pool: 50% (increases with participation)
Platform/Treasury: 10%
```

## Dynamic Entry Fee Structure
```
Early Bird (0-100 players): 0.05 SOL
Standard (101-200 players): 0.1 SOL
Late Rush (201-300 players): 0.15 SOL
Premium (301-400 players): 0.2 SOL
```

## Implementation Roadmap

### Phase 1: Basic Tournament Contracts
- Tournament registration and player management
- Bracket progression logic
- Entry fee collection and escrow

### Phase 2: Advanced Tournament Features
- Leader seeding mechanism
- Dynamic fee structure implementation
- Progressive liquidity model

### Phase 3: Token Distribution System
- Performance-based token allocation
- Integration with Pump Fun for token creation
- Automated reward distribution

### Phase 4: Analytics and Reputation
- Player performance tracking
- Reputation system for leaders
- Tournament history and statistics

## Solo Development & Testing

### Local Development Setup
1. Use Solana test validator for local blockchain
2. Mock tournament progression with test accounts
3. Simulate different player counts and behaviors
4. Test edge cases like failed seeds and timeout scenarios

### Testing Scenarios
- Single player tournament (solo testing)
- Multi-account testing (different wallets)
- Edge case testing (early termination, timeouts)
- Token distribution verification