# 🏴‍☠️ PIR8

> **Skill-based competitive gaming meets privacy-first blockchain technology**

A multiplayer pirate treasure hunt game built on Solana with Zcash privacy integration. Compete in tournaments, master strategic gameplay, and earn real rewards.

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF)](https://solana.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org)
[![Anchor](https://img.shields.io/badge/Anchor-0.29-purple)](https://www.anchor-lang.com)

---

## 🎮 What is PIR8?

PIR8 is a **skill-based competitive game** where players navigate a 7x7 treasure map, collecting points and using special items to outmaneuver opponents. Unlike traditional Web3 games, PIR8 emphasizes **strategic depth** over luck, with multiple skill layers including:

- **Information Management**: Scan squares to reveal items before committing
- **Timing Mechanics**: Fast decisions earn bonus points
- **Tactical Resource Management**: Spend action points wisely
- **Territory Control**: Dominate rows and columns for passive income
- **Combo Systems**: Chain moves for multipliers

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

### Current (Phase 1 - 80% Complete)
- ✅ **Solana Smart Contracts** - 2,000+ lines of production Rust
- ✅ **Turn-Based Gameplay** - 7x7 grid with 12 special items
- ✅ **Real-Time Updates** - Helius WebSocket monitoring
- ✅ **Multi-Wallet Support** - Phantom, Solflare, Backpack
- ✅ **Privacy Entry** - Zcash shielded memo integration
- ✅ **Responsive UI** - Mobile-optimized Next.js frontend

### Coming Soon (Phase 2-3)
- 🚧 **Skill Mechanics** - Scanning, timing, combos (2 weeks)
- 🚧 **Tournament System** - Brackets, seeding, rewards (6 weeks)
- 🚧 **Token Distribution** - Performance-based allocation
- 🚧 **Reputation System** - ELO ratings, achievements
- 🚧 **Spectator Mode** - Watch live tournament matches

---

## 🎯 Game Mechanics

### Core Gameplay

**Objective**: Command your pirate fleet to dominate the seven seas through strategic warfare

**Turn Flow**:
1. Move ships across the 10x10 battlefield
2. Attack enemy vessels or claim territories  
3. Collect resources from controlled territories
4. Build new ships to expand your fleet
5. Adapt strategy to changing weather conditions

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
- **Solana**: Sub-second finality, low fees
- **Anchor Framework**: Type-safe smart contracts
- **Helius**: Enhanced RPC, real-time monitoring
- **Zcash**: Privacy-preserving entry

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

| Document | Description | Lines |
|----------|-------------|-------|
| [VISION.md](./docs/VISION.md) | Strategy, economics, competitive advantages | 250 |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Technical details, smart contracts, APIs | 380 |
| [ROADMAP.md](./docs/ROADMAP.md) | Development phases, timelines, milestones | 350 |
| [GETTING_STARTED.md](./docs/GETTING_STARTED.md) | Setup, workflow, troubleshooting | 390 |

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

### Phase 1: Foundation (80% Complete)
- [x] Solana smart contracts deployed
- [x] Core game mechanics working
- [x] Wallet integration complete
- [x] Real-time monitoring active
- [ ] Skill mechanics (in progress)

### Phase 2: Skill Systems (Next 2 Weeks)
- [ ] Scanning system
- [ ] Timing mechanics
- [ ] Action points
- [ ] Combo system
- [ ] Territory control

### Phase 3: Tournaments (Weeks 3-8)
- [ ] Tournament smart contracts
- [ ] Bracket management
- [ ] Token distribution
- [ ] Reputation system
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