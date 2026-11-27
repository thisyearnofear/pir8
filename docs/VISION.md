# PIR8 Vision & Roadmap

## Overview

PIR8 is a **privacy-oriented strategic naval combat platform** combining session key architecture with skill-based competitive gameplay on Solana.

**Core Mission**: Transform Web3 gaming from luck-based speculation to skill-based competition with privacy-aware principles.

**Entertainment Finance framing**: PIR8 turns competitive play into a market-like spectator product: players commit stake, control productive resources, compete for scarce positions, and generate replayable outcomes that other players can watch, share, and react to. The near-term implementation should stay on devnet/test value until prize, gaming, and jurisdiction constraints are deliberately designed.

## Current Product Direction

The next phase of PIR8 is to move from "pirate strategy game on Solana" to a sharper product:

> Private tactical naval warfare where scouting, deception, ambushes, and wallet privacy are part of the game.

Privacy should be visible as gameplay, not only as infrastructure. The fastest route to a memorable product is an instant-play skirmish loop where players scout hidden waters, hide intent, reveal ambushes, and then share a challenge or replay moment.

See [MAGICBLOCK_INTEGRATION.md](./MAGICBLOCK_INTEGRATION.md) for the proposed MagicBlock execution layer and [DEVELOPMENT.md](./DEVELOPMENT.md) for current engineering workflow.

## Core Pillars

### 1. Privacy-Oriented Gaming
- **Session Key Architecture**: Reduced wallet friction and operational pseudonymity via ephemeral session keys (no server signing required)
- **Private Tactical Identity**: Session keys keep routine game actions from requiring the main wallet, but the public delegation transaction means the setup is not strongly unlinkable
- **Privacy as Gameplay**: Fog, scouting, deception, and reveal moments make privacy legible to players
- **Regulatory Compliance**: Privacy without compromising legal requirements

### 2. Skill + Luck Balance (70% Skill / 30% Luck)
- **Hidden-Information Strategy**: Scout, deceive, commit, and reveal
- **Fleet Strategy**: Ship positioning, type selection, resource allocation
- **Economic Depth**: Resource management drives tactical decisions
- **Territory Control**: Strategic map control with competing victory conditions
- **Weather Adaptation**: Dynamic conditions force real-time strategy adjustments

### 3. Tournament Economics
- **Seasonal Competitions**: Monthly/quarterly tournaments with transparent prize accounting
- **Community Tokens**: Tournament-specific incentives backed by explicit liquidity design
- **Performance Rewards**: Top finishers earn rewards based on verifiable competitive outcomes
- **Execution Layer Exploration**: MagicBlock VRF and Ephemeral Rollups are candidate primitives for provably fair randomness and low-friction match sessions; neither is currently implemented

### 4. Viral Growth
- **Challenge Links**: "Beat my fleet in 5 minutes" as the default share object
- **Ambush Replays**: Share the decisive reveal, comeback, or bounty kill
- **Social Proof**: Leaderboards, achievements, reputation systems
- **Spectator Mode**: Watch top players and AI captains compete
- **Creator Economy**: Streamers and content creators can monetize

## The Problem We Solve

### Current Web3 Gaming Issues
1. **Pay-to-Win Dominance**: Whales control outcomes
2. **Ponzi Economics**: Unsustainable token models
3. **No Skill Expression**: Luck-based or trivial mechanics
4. **Poor UX**: Clunky wallets, slow transactions
5. **Identity Exposure and Weak Privacy**: Main-wallet activity is public, and current session keys do not hide match state

### Our Solution
1. **Skill-Based Competition**: Win through strategy, not wallet size
2. **Sustainable Economics**: Tournament pools with transparent accounting and explicit backing policy
3. **Deep Gameplay**: Multiple skill layers and meta-game
4. **Seamless UX**: Instant practice/watch entry before wallet friction
5. **Privacy Options**: Session-key architecture for lower-friction, pseudonymous competitive play (zero server cost)
6. **Viral Moments**: Ambushes, bounties, and challenge links create natural sharing

## Product Strategy

### Phase 1: Foundation
**Status**: Core devnet mechanics implemented; product hardening still in progress

**Completed**:
- ✅ Solana smart contracts (deployed to devnet)
- ✅ 10x10 strategic map with territory types
- ✅ Fleet system (4 ship types with distinct roles)
- ✅ Core instructions (move, attack, claim, build)
- ✅ Wallet integration (Phantom, Solflare, Backpack)
- ✅ Helius real-time monitoring
- ✅ Session-key delegation (using the existing AgentRegistry delegate pattern)
- ✅ Resource economy (framework ready)
- ✅ Skill mechanics (scanning system, timing bonuses)

### Phase 2: Tactical Privacy Loop (In Progress)
**Goal**: Make scouting, deception, and reveal moments the core skill loop

- 🔧 **Fog of War**: Hidden ship positions until adjacent/detected
- 🔧 **Intel System**: Reconnaissance missions, map scouting
- 🔧 **Deception System**: Ghost fleets, decoys, and masked intent
- 🔧 **Threat Previews**: Movement range, attack range, and expected damage
- 🔧 **Advanced Tactics**: Multi-turn strategy rewards, combo bonuses
- 🔧 **Economic Leverage**: Resource control → power projection

### Phase 3A: Verifiable Match Infrastructure
**Goal**: Make randomness, session execution, and settlement evidence credible before scaling stakes

- 🔲 **VRF evaluation**: Determine whether MagicBlock VRF can drive weather/hazard outcomes without destabilizing the current Anchor program
- 🔲 **ER evaluation**: Prototype delegation of active match state only if SDK/version compatibility is proven
- 🔲 **Explorer evidence**: Every competitive demo should link the relevant program transactions
- 🔲 **Honest boundaries**: Document what is implemented versus designed; do not market planned cryptography as shipped privacy or randomness

### Phase 3: Shareable Challenge Platform
**Goal**: Turn every match into a playable or watchable acquisition surface

- 🔲 **Challenge Links**: Accept, join, or spectate a match from a shared URL
- 🔲 **Ambush Replay Cards**: Auto-generated battle summaries and decisive-turn visuals
- 🔲 **Bounty Board**: Public targets and social pressure around top captains
- 🔲 **Solana Actions/Blinks Prototype**: Challenge and spectate actions outside the app

### Phase 4: Tournament Platform
**Goal**: Launch competitive tournament system after the duel loop is proven

- 🔲 **Bracket Management**: Multi-stage elimination
- 🔲 **Leader Seeding**: Performance-based tournament entry
- 🔲 **Token Distribution**: Fair, liquidity-backed rewards
- 🔲 **Reputation System**: Player rankings and history
- 🔲 **Spectator Mode**: Watch live tournament matches

### Phase 5: Scale & Monetize
**Goal**: Sustainable growth and revenue

- 🔲 **Seasonal Championships**: Quarterly mega-tournaments
- 🔲 **Sponsorships**: Brand partnerships for prize pools
- 🔲 **Creator Tools**: Streaming, content creation, coaching
- 🔲 **Mobile App**: Cross-platform accessibility
- 🔲 **Advanced Privacy**: ZK-proof integration for session key ↔ main wallet reward claiming

## Competitive Advantages

### 1. Technology Stack
- **Solana**: Fast finality and low fees
- **Anchor Framework**: Type-safe, auditable contracts
- **Helius**: Enhanced RPC, real-time monitoring
- **Session Keys**: Lower-friction delegated identity, no cross-chain dependency
- **Next.js**: Modern, performant frontend

### 2. Game Design
- **Proven Mechanics**: Based on classic Pirate Game
- **Skill Depth**: Multiple layers of mastery
- **Economic Design Goal**: Entry fees, backing policy, and rewards must be explicit and sustainable
- **Social Dynamics**: Tournaments create community

### 3. Go-to-Market
- **Privacy Narrative**: Distinctive privacy-oriented tactical game design
- **Tournament Model**: Inspired by proven competitive formats such as poker and esports
- **Viral Mechanics**: Leaderboards, achievements, social sharing
- **Creator Friendly**: Built for streamers and content creators

## Economic Model

Tournament economics are not finalized. An older draft mixed token-supply percentages with SOL pool backing and did not sum to 100%; treat that draft as deprecated rather than as a usable model.

Any future real-value tournament must publish, before entry:

- gross entry amount and recipient account;
- exact winner/performance reward split;
- liquidity or treasury backing policy;
- platform/harbor fee;
- cancellation, refund, and abandoned-match behavior;
- jurisdiction and eligibility constraints.

Design goals:

1. **Transparent accounting** — players can inspect where value goes
2. **Broad participation** — rewards are not concentrated only in first place
3. **Skill-weighted outcomes** — competitive performance matters more than wallet size
4. **Sustainable operations** — fees and treasury policy cover infrastructure without hidden emissions
5. **Community formation** — repeated tournaments create spectators, rivals, and returning players

Possible revenue streams, after the core loop is proven:

1. clearly disclosed tournament fees;
2. premium analytics or coaching tools;
3. sponsorships for devnet/test competitions;
4. creator tools and revenue share;
5. collectible achievement badges.

## Success Metrics

The older dated targets in this document were planning assumptions, not verified outcomes. Current success should be measured with evidence that can be inspected:

### Foundation quality

- Canonical devnet program and IDL are consistent across repository configuration
- Challenge creation/join flow can be demonstrated end-to-end
- A complete practice or competitive match can be replayed
- Core typecheck/lint/test gates pass

### Competitive loop validation

- 10+ complete test matches with recorded outcomes
- 3+ independent wallets or testers completing the loop
- At least one shareable challenge or replay artifact per match
- Measured drop-off points in onboarding and wallet signature flow

### Verifiable-infrastructure validation

- If MagicBlock is attempted: working explorer proof for VRF request/callback or ER delegate/commit/undelegate
- No claims of implemented VRF/ER without corresponding transaction evidence
- Clear separation of devnet test stakes from any future real-value tournament design

### Growth validation

- Challenge-link acceptance rate
- Replay view rate
- Return match rate within 7 days
- Spectator-to-player conversion

## Risk Mitigation

### Technical Risks
- **Smart Contract Bugs**: Extensive testing, audits before mainnet
- **Scalability**: Solana capacity is sufficient for the current match scale, but real-time UX still needs careful RPC/session design
- **Privacy Complexity**: Current session keys are not strong privacy; stronger privacy requires additional cryptographic or execution-layer design

### Market Risks
- **Player Acquisition**: Focus on crypto-native communities first
- **Competition**: Differentiate through privacy + skill depth
- **Regulation**: Privacy features designed for compliance

### Economic Risks
- **Token Value**: Liquidity pools prevent death spirals
- **Sustainability**: Platform fees cover operational costs
- **Whale Dominance**: Skill-based design limits pay-to-win

## Why We'll Win

### 1. Timing
- Web3 gaming is maturing beyond ponzis
- Privacy is becoming a competitive advantage
- Solana ecosystem is thriving

### 2. Team Execution
- Working devnet prototype rather than a concept-only pitch
- Clear roadmap with achievable milestones
- Focus on core mechanics before scaling

### 3. Community First
- Tournament model builds organic community
- Skill-based gameplay retains competitive players
- Privacy attracts users tired of transparent blockchains

### 4. Sustainable Economics
- Avoid infinite token minting as a design constraint
- Prefer revenue from explicit fees rather than opaque token emissions
- Liquidity/backing policy must be designed to reduce collapse risk

---

**PIR8 is building a competitive Web3 game that treats information, identity, and verifiable outcomes as first-order design constraints.**

🏴‍☠️ **Join the crew.**
