# 🏴‍☠️ PIR8

> **Strategic fleet warfare meets privacy-oriented blockchain technology**

**✅ LIVE ON DEVNET**: `2TZwkCc8ffz7NGWYF3koXyRm75DHq9VL9kvHxXZu8kLy`

A multiplayer pirate naval combat game built on Solana with privacy-oriented session key architecture. Command your fleet, dominate territories, and compete in transparent, stake-backed matches on devnet.

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF)](https://solana.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org)
[![Anchor](https://img.shields.io/badge/Anchor-0.32.1-purple)](https://www.anchor-lang.com)
[![Monolith Hackathon](https://img.shields.io/badge/Monolith-Hackathon-orange)](https://devpost.com)

---

## 🎮 What is PIR8?

PIR8 is a **skill-based strategic naval warfare game** where players command pirate fleets across a 10x10 battle map to claim territories, control resources, and eliminate enemy ships. Unlike traditional Web3 games, PIR8 emphasizes **70% strategic skill, 30% tactical luck**, with multiple layers of depth:

- **Fleet Management**: Build and position ships strategically (Sloop, Frigate, Galleon, Flagship)
- **Territorial Control**: Claim ports, islands, and treasure sites for passive resource generation
- **Resource Economics**: Gold, crew, supplies, and cannons drive strategic decision-making
- **Combat Tactics**: Attack range, damage calculations, and defensive positioning matter
- **Weather Systems**: Dynamic weather affects movement speed, visibility, and combat effectiveness

### Tournament Model

The target competitive model is **multi-stage tournaments** with transparent stakes and rewards:
- 50-400 players per tournament
- Performance-based token distribution
- Liquidity-backed rewards as a design goal, subject to implementation and jurisdiction review
- Seasonal championships with escalating prizes

### Entertainment Finance / MagicBlock Fit

PIR8 is a natural fit for **Entertainment Finance**: skill-based competition, stake-backed tournaments, resource ownership, and shareable spectator moments. MagicBlock is a possible execution layer for two specific mechanics:

- **Verifiable randomness** for weather, hazards, and combat variance
- **Ephemeral Rollup match sessions** for low-friction, gasless in-match actions

**Status:** this is a documented integration path, not an implemented MagicBlock integration. See [docs/MAGICBLOCK_INTEGRATION.md](./docs/MAGICBLOCK_INTEGRATION.md).

---

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.local.example .env.local
# Add your Helius RPC URL

# Run development server
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) and connect your Solana wallet!

**Full setup guide**: [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md)

---

## ✨ Key Features

### Game Engine & AI ✅
- ✅ **10x10 Strategic Map** - Territory generation with island/port/treasure placement
- ✅ **Fleet System** - 4 ship types with distinct stats (speed, attack, defense, health)
- ✅ **Movement System** - Grid-consistent Chebyshev distance, anti-backtrack AI movement
- ✅ **Combat System** - Deterministic damage calculation with seeded RNG support
- ✅ **Territory Control** - Claim ports, islands, and treasures
- ✅ **Resource Economy** - Collect resources from controlled territories
- ✅ **Ship Building** - Build new ships at controlled ports
- ✅ **Victory Conditions** - Fleet dominance, territory control, economic victory
- ✅ **AI Opponents** - Four difficulty tiers (novice → admiral) with tuned attack/claim/move heuristics
- ✅ **Seeded Balance Tests** - All 10 simulation balance assertions pass; duel length, attack frequency, and win-rate targets met

### Challenge & Competitive Loop ✅
- ✅ **Challenge Lifecycle** - Open → accepted → started → completed/expired with durable records
- ✅ **On-Chain Join Transaction** - `buildJoinTransaction` wired to Solana devnet program
- ✅ **Shadow Skirmish / Watch Flow** - Spectator and referrer attribution paths
- ✅ **Captain Profiles** - Win/loss stats, win-rate, streaks, and rank derived from match history
- ✅ **Competitive Snapshot** - Live leaderboard data from `computeCaptainProfiles()`
- ✅ **Real-Time Updates** - Helius WebSocket monitoring integration
- ✅ **Multi-Wallet Support** - Phantom, Solflare, Backpack via Wallet Adapter

### UI & Accessibility ✅
- ✅ **Accessible Map** - Every cell has `aria-label`, keyboard navigation, and tactical descriptions
- ✅ **Replay Infrastructure** - Battle moment capture and `/api/moments` endpoints
- ✅ **Focused Controllers** - `useIncomingChallenge`, `usePracticeModeController`, `useMatchFlowController` extracted from GameShell

---

## 🎯 Game Mechanics

### Core Gameplay

**Objective**: Command your pirate fleet to control 60%+ of valuable territories or achieve fleet dominance

**Turn Structure**:
1. **Movement Phase**: Move ships within their speed range
2. **Action Phase**: Attack enemy ships, claim territories, or build new vessels
3. **Resource Phase**: Collect gold/supplies from controlled territories
4. **Weather Phase**: Adapt to changing conditions affecting your fleet
5. **End Turn**: Pass to next player

**Strategic Elements**:
- ⚓ **Ports**: Generate 5 gold + 2 crew per turn
- 🏝️ **Islands**: Produce 3 supplies per turn
- 💰 **Treasure Sites**: Generate 10 gold per turn
- 🌊 **Water**: Safe passage for ship movement
- ⛈️ **Storms**: Damage ships, reduce movement
- 🪨 **Reefs**: Hidden hazards that damage ships
- 🌀 **Whirlpools**: Deadly traps for unwary captains

**Ship Types**:
- ⛵ **Sloop**: Fast scout (Speed 3, 100 HP, 500 gold)
- 🚢 **Frigate**: Balanced warship (Speed 2, 200 HP, 1200 gold)
- 🛳️ **Galleon**: Heavy battleship (Speed 1, 350 HP, 2500 gold)
- 🚤 **Flagship**: Ultimate vessel (Speed 1, 500 HP, 5000 gold)

### Strategic Warfare

**Fleet Management**:
- Build and upgrade ships from controlled ports
- Balance speed, firepower, and resource capacity
- Deploy fleets strategically across the 10x10 battlefield

**Weather Effects**:
- ☀️ **Calm Seas**: +20% resource generation
- 💨 **Trade Winds**: +50% ship movement speed
- ⛈️ **Storms**: -50% movement, +30% combat damage
- 🌫️ **Fog**: Limited visibility, -30% movement

**Victory Conditions**:
- **Fleet Dominance**: Control 65% of total naval power
- **Territory Control**: Own 50% of valuable territories
- **Economic Victory**: Accumulate 10,000+ resource value

**Resource Economy**:
- 💰 **Gold**: Primary currency for ship building
- 👥 **Crew**: Manpower for ships and ports
- 🎯 **Cannons**: Combat equipment and ship armament
- 📦 **Supplies**: Essential for fleet maintenance

---

## 🏆 Tournament Economics

### Economic model status

Tournament economics are still a design surface, not a finalized or audited monetary system. An older draft mixed token-supply percentages with SOL prize-pool backing and did not sum to 100%, so it should not be reused as-is.

Before any real-value tournament, the project needs an explicit published split for:

- gross player entries;
- winner and performance rewards;
- liquidity/treasury backing;
- platform or harbor fees;
- refunds, cancellations, and abandoned matches.

Current development and demonstrations should use Solana devnet/test value only. Real-money prize, gaming, custody, and jurisdiction requirements are not solved by the current contracts.

### Design goals

1. **Transparent accounting**: prize and fee allocation is published before entry
2. **Broad participation**: rewards are not limited to a single winner
3. **Skill-weighted outcomes**: performance matters more than wallet size
4. **Sustainable operations**: fees and treasury usage are explicit
5. **Community formation**: tournaments create repeatable competition and spectator interest

---

## 🛠️ Tech Stack

### Blockchain
- **Solana**: Low-latency confirmation and low transaction fees
- **Anchor Framework 0.32.1**: Type-safe smart contracts in Rust
- **Helius**: Enhanced RPC, real-time WebSocket monitoring
- **Session Keys**: Ephemeral delegated keys for lower-friction, pseudonymous gameplay (using the AgentRegistry delegate pattern)

### Frontend
- **Next.js 16**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Solana Wallet Adapter**: Multi-wallet support

### Infrastructure
- **Vercel**: Frontend hosting
- **Helius WebSocket**: Real-time game updates

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md) | Installation, setup, and quick start |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture and technical details |
| [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) | Development workflow and contributing |
| [docs/VISION.md](./docs/VISION.md) | Project vision and roadmap |
| [docs/MAGICBLOCK_INTEGRATION.md](./docs/MAGICBLOCK_INTEGRATION.md) | Proposed Ephemeral Rollup / VRF integration path |
| [plans/practice-mode-privacy-design.md](./plans/practice-mode-privacy-design.md) | Practice-mode privacy education design |

---

## 🧪 Development

### Smart Contracts

```bash
# Check program configuration before building
pnpm run anchor:check-program

# Build/test when the Anchor program source is present
anchor build
anchor test

# Use the repository deployment workflow
pnpm run anchor:deploy-program
```


### Testing

```bash
# Type checking
pnpm run typecheck

# Linting
pnpm run lint

# Integration tests
pnpm test
```

---

## 🎯 Current Status

### November 2026 documentation refresh

**✅ Deployed to Solana Devnet:**
- **Program ID**: `2TZwkCc8ffz7NGWYF3koXyRm75DHq9VL9kvHxXZu8kLy`
- **Anchor**: 0.32.1 / Solana CLI 3.x
- **IDL instructions**: full game lifecycle + session-key delegate instructions
- **Frontend**: transaction builders consume the checked-in IDL and canonical program ID

**Documented capabilities:**
- Connect wallet → create lobby → join game
- "Play Privately" toggle: generates an ephemeral session key and delegates through AgentRegistry so routine gameplay actions do not require the main wallet
- Real-time updates via Helius WebSocket
- Multi-wallet support (Phantom, Solflare, Backpack)

**Active product directions:**
1. End-to-end session key smoke test with live users
2. Ghost Fleet game design (privacy as a mechanic: ambush bonus, reduced scan range)
3. Lobby split: Public Arena / Shadow Arena
4. Create UI for "Private Entry via Session Key" flow
5. Demo: Player joins game with an ephemeral session identity; document the remaining public delegation link honestly

**Near-term execution priorities:**
1. Prove the challenge → match → replay loop end-to-end
2. Validate whether MagicBlock VRF or Ephemeral Rollups can be integrated without destabilizing the game program
3. Tournament bracket UI
4. Privacy-aware onboarding flow
5. Current demo video and submission-ready explorer evidence

### Phase 2: Skill Depth
- [ ] Advanced fog of war mechanics
- [ ] Intel/reconnaissance system
- [ ] Timing-based bonuses for fast decisions
- [ ] Combo reward system for multi-turn strategies

### Phase 3: Tournaments
- [ ] Tournament smart contracts with bracket management
- [ ] Token distribution (Pump.fun integration)
- [ ] Reputation/ELO system
- [ ] Spectator mode

**See [docs/VISION.md](./docs/VISION.md) for the current roadmap**

---

## 🌟 Why PIR8?

### Problems We Solve

❌ **Web3 Gaming Issues**:
- Pay-to-win dominance
- Unsustainable token economics
- Luck-based gameplay
- Transparent gameplay information leakage
- Poor UX

✅ **Our Solutions**:
- Skill-based competition
- Transparently backed tournament incentives
- Strategic depth (70% skill / 30% luck)
- Pseudonymous session-key delegation (no server signing required)
- Solana speed + familiar UI

### Competitive Advantages

1. **Distinctive privacy-oriented tactical game design**
2. **Tournament model inspired by proven competitive formats**
3. **Sustainable economics as a design constraint**
4. **Working devnet prototype**
5. **Community-Driven** (tournaments build organic growth)

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

**See [GETTING_STARTED.md](./docs/GETTING_STARTED.md) for development workflow**

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](./License.txt) for details.

---

## 🔗 Links

- **Website**: [pir8.vercel.app](https://pir8.vercel.app)
- **GitHub**: [github.com/thisyearnofear/pir8](https://github.com/thisyearnofear/pir8)
- **Twitter**: [@pir8_game](https://twitter.com/pir8_game)
- **Discord**: Coming soon

---

## 🙏 Acknowledgments

- Original Pirate Game concept
- Solana ecosystem and developer tools
- Helius for enhanced RPC infrastructure
- Zero-knowledge proof research for privacy inspiration
- Anchor framework team

---

**Built with ⚡ Solana, 🔥 Helius, 🔑 session keys, and 🏴‍☠️ pirate spirit**

*Join the crew. Master the seas. Earn real treasure.*
