# 🏴‍☠️ PIR8

> **Strategic fleet warfare meets privacy-first blockchain technology**

A multiplayer pirate naval combat game built on Solana with Zcash shielded transactions. Command your fleet, dominate territories, and earn real rewards through skill-based competitive play.

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF)](https://solana.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org)
[![Anchor](https://img.shields.io/badge/Anchor-0.29-purple)](https://www.anchor-lang.com)

---

## 🎮 What is PIR8?

PIR8 is a **skill-based strategic naval warfare game** where players command pirate fleets across a 5x5 battle map to claim territories, control resources, and eliminate enemy ships. Unlike traditional Web3 games, PIR8 emphasizes **70% strategic skill, 30% tactical luck**, with multiple layers of depth:

- **Fleet Management**: Build and position ships strategically (Sloop, Frigate, Galleon, Flagship)
- **Territorial Control**: Claim ports, islands, and treasure sites for passive resource generation
- **Resource Economics**: Gold, crew, supplies, and cannons drive strategic decision-making
- **Combat Tactics**: Attack range, damage calculations, and defensive positioning matter
- **Weather Systems**: Dynamic weather affects movement speed, visibility, and combat effectiveness

### Tournament Model

Players compete in **multi-stage tournaments** with real stakes:
- 50-400 players per tournament
- Performance-based token distribution
- Liquidity-backed rewards (not worthless meme coins)
- Seasonal championships with escalating prizes

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Add your Helius RPC URL

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and connect your Solana wallet!

**Full setup guide**: [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md)

---

## ✨ Key Features

### Current (Phase 1B - Core Game Loop - 90% Complete) 🎯
- ✅ **10x10 Strategic Map** - Territory generation with island/port/treasure placement
- ✅ **Fleet System** - 4 ship types with distinct stats (speed, attack, defense, health)
- ✅ **Core Instructions** - Create game, join game, start game, reset game
- ✅ **Movement System** - Move ships within speed range with timing bonuses
- ✅ **Combat System** - Attack ships with damage calculation and destruction
- ✅ **Territory Control** - Claim ports, islands, and treasures
- ✅ **Resource Economy** - Collect resources from controlled territories
- ✅ **Ship Building** - Build new ships at controlled ports
- ✅ **Victory Conditions** - Fleet dominance, territory control, economic victory
- ✅ **Real-Time Updates** - Helius WebSocket monitoring integration
- ✅ **Multi-Wallet Support** - Phantom, Solflare, Backpack via Wallet Adapter
- 🏗️ **Zcash Privacy Bridge** - Shielded memo integration for private tournament entry (design ready)

### In Progress (Phase 1B - Final Polish)
- 🔧 **Contract Deployment** - Deploy updated contract to devnet
- 🔧 **Frontend Integration** - Wire all 9 instructions to UI
- 🏗️ **Auto Victory Check** - Call check_and_complete_game after each turn
- 🏗️ **UI Polish** - Display resources, ship building interface, victory screen

### Ready for Testing
- ⏳ Full gameplay loop with 2+ players
- ⏳ Resource generation and ship building
- ⏳ Victory condition triggers

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
- **Fleet Dominance**: Control 80% of total naval power
- **Territory Control**: Own 60% of valuable territories
- **Economic Victory**: Accumulate 15,000+ resource value

**Resource Economy**:
- 💰 **Gold**: Primary currency for ship building
- 👥 **Crew**: Manpower for ships and ports
- 🎯 **Cannons**: Combat equipment and ship armament
- 📦 **Supplies**: Essential for fleet maintenance

---

## 🏆 Tournament Economics

### How It Works

```
400 Captains × 0.1 SOL Entry = 40 SOL Prize Pool

Token Distribution:
├─ Pirate King (1st):   5% supply  (~2 SOL value)
├─ Admiral Fleet:      15% supply  (~6 SOL value)
├─ Captain's Circle:   20% supply  (~8 SOL value)
├─ Crew Members:       25% supply (~10 SOL value)
├─ Active Pirates:     15% supply  (~6 SOL value)
├─ Treasure Vault:     50% supply (20 SOL backing)
└─ Harbor Fees:        10% supply  (~4 SOL revenue)
```

### Why This Model Works

1. **Real Liquidity**: 50% of pool backs token value
2. **Broad Distribution**: 100+ players earn rewards
3. **Skill-Based**: Top performers get most value
4. **Sustainable**: Platform fees cover operations
5. **Community**: Shared tournament creates token holders

---

## 🛠️ Tech Stack

### Blockchain
- **Solana**: Sub-second finality, low fees, 65k TPS capacity
- **Anchor Framework**: Type-safe smart contracts in Rust
- **Helius**: Enhanced RPC, real-time WebSocket monitoring
- **Zcash**: Shielded transactions for private tournament entry (Zypherpunk focus)

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Solana Wallet Adapter**: Multi-wallet support

### Infrastructure
- **Vercel**: Frontend hosting
- **Helius WebSocket**: Real-time game updates
- **Zcash Lightwalletd**: Shielded memo watching

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [GETTING_STARTED.md](./docs/GETTING_STARTED.md) | Installation, setup, and basic usage |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture, technology stack, and implementation details |
| [DEVELOPMENT.md](./docs/DEVELOPMENT.md) | Development workflow, testing, and contribution guidelines |
| [VISION.md](./docs/VISION.md) | Project vision, roadmap, and strategic direction |

---

## 🧪 Development

### Smart Contracts

```bash
# Build Anchor program
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### CLI Tools

```bash
# Initialize platform config
npm run cli -- init

# Create game
npm run cli -- create

# Join game
npm run cli -- join 0

# Monitor transactions
npm run cli -- monitor
```

### Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Integration tests
npm run test
```

---

## 🎯 Current Status

### Phase 1B: MVP Deployed & Working (December 2024)

**✅ Deployed to Solana Devnet:**
- **Program ID**: `54S7Pw6cDQKWqW4JkdTGb3vEQqtnHsZ3SvB3LB1fST2V`
- **Architecture**: Single global game (simplified for iterative testing)
- **Working Instructions**: `initializeGame`, `joinGame`, `startGame`, `resetGame`
- **Frontend**: Auto-initialization, join flow, error handling
- **Account Size**: 10KB (optimized for Solana realloc limits)

**✅ What Works Right Now:**
- Connect wallet and join the global game
- Auto-initialization on first use
- Multiple players can join
- Ready for gameplay implementation

**🚧 In Progress (Next 7 Days):**
1. **Core Game Instructions** (Days 1-3)
   - Implement `move_ship`, `attack_ship`, `claim_territory`
   - Test full gameplay loop with 2+ players
   
2. **State Synchronization** (Days 4-5)
   - Fetch on-chain game state
   - Display map, ships, and territories
   - Real-time updates via Helius

3. **Victory & Reset** (Days 6-7)
   - Implement victory conditions
   - Polish reset flow for testing
   - Complete MVP game loop

**📋 Architecture Decisions:**
- **Single Global Game**: Simplified from multi-game to single game for MVP
  - Easier testing and iteration
  - Can expand to multiple games later
  - Reset capability for development
  
- **10KB Account Size**: Optimized for Solana's realloc limits
  - Supports 4 players with ships and territories
  - 5x5 map (25 cells)
  - Can expand with account versioning if needed

**🔮 Future Enhancements (Post-MVP):**
- Multiple concurrent games
- Zcash privacy integration
- Tournament system
- Resource generation and ship building
- Weather effects
- Fog of war

### Immediate Next Steps (Zypherpunk Timeline)

**Days 1-2**: Deploy & Secure
1. ✅ Fix & deploy contracts to Devnet
2. ✅ Update Program ID in config
3. Test create_game → join_game → move_ship flow

**Days 3-4**: Privacy Configuration
1. Set up Zcash infrastructure (Lightwalletd endpoint)
2. Generate shielded address for memo receiving
3. Configure NEXT_PUBLIC_LIGHTWALLETD_URL and NEXT_PUBLIC_ZCASH_SHIELDED_ADDR
4. Wire useZcashBridge hook to app
5. Test private entry: memo → join_game execution

**Days 5-6**: MVP Playability + Privacy Demo
1. Implement resource generation from territories
2. Complete ship building system
3. Create UI for "Private Entry via Zcash" flow
4. Demo: Player joins game privately, then plays publicly

**Days 7+**: Polish & Zypherpunk Submission
1. Tournament bracket UI
2. Privacy-first onboarding flow
3. Zypherpunk submission docs: Privacy narrative + gameplay video
4. Security audit report (contract hardening already complete)

### Phase 2: Skill Depth (After Zypherpunk - Weeks 2-3)
- [ ] Advanced fog of war mechanics
- [ ] Intel/reconnaissance system
- [ ] Timing-based bonuses for fast decisions
- [ ] Combo reward system for multi-turn strategies

### Phase 3: Tournaments (After Phase 1 & 2)
- [ ] Tournament smart contracts with bracket management
- [ ] Token distribution (Pump.fun integration)
- [ ] Reputation/ELO system
- [ ] Spectator mode

**See [ROADMAP.md](./docs/ROADMAP.md) for detailed timeline**

---

## 🌟 Why PIR8?

### Problems We Solve

❌ **Web3 Gaming Issues**:
- Pay-to-win dominance
- Unsustainable token economics
- Luck-based gameplay
- No privacy
- Poor UX

✅ **Our Solutions**:
- Skill-based competition
- Liquidity-backed tokens
- Strategic depth (70% skill / 30% luck)
- Zcash privacy integration
- Solana speed + familiar UI

### Competitive Advantages

1. **First Privacy-Focused Competitive Game**
2. **Proven Tournament Model** (poker, esports)
3. **Sustainable Economics** (no ponzi mechanics)
4. **Production-Ready Code** (not vaporware)
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
- Zcash for privacy technology
- Anchor framework team

---

**Built with ⚡ Solana, 🔥 Helius, 🔒 Zcash, and 🏴‍☠️ Pirate Spirit**

*Join the crew. Master the seas. Earn real treasure.*