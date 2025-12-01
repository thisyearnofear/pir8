# 🏴‍☠️ PIR8

> **Fast battles, private moves, viral wins**

A privacy-first gaming platform built on Solana, featuring real-time multiplayer pirate battles with Helius infrastructure and Pump Fun token creation for winners.

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF)]()
[![Next.js](https://img.shields.io/badge/Next.js-14-black)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)]()
[![Helius](https://img.shields.io/badge/Helius-RPC-orange)]()

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

## 🎮 Game Features

### **Core Gameplay**
- 🗺️ **7x7 treasure map** with randomized rewards
- ⚔️ **Turn-based multiplayer** battles (2-4 players)
- 💰 **Dynamic scoring** with special item effects
- 🏦 **Banking system** for protected points
- 🏆 **Winner determination** based on total score

### **Special Items & Effects**
- 🎁 **Present**: Gift 1000 points to another player
- 👹 **Grinch**: Steal points from opponents
- 🍮 **Pudding**: Reset target player to 0 points
- 🌿 **Mistletoe**: Swap scores with another player
- 🎄 **Tree**: Choose the next coordinate
- 🧝 **Elf**: Block incoming attacks
- 🔮 **Bauble**: Reflect attacks back to sender
- 🦃 **Turkey**: Your score resets to 0
- 🎊 **Cracker**: Double your current score
- 🏦 **Bank**: Move points to protected vault

### **Blockchain Features**
- ⚡ **Lightning-fast transactions** via Helius enhanced RPC
- 🔒 **Private move verification** using zero-knowledge proofs
- 🪙 **Winner token creation** via Pump Fun integration
- 📊 **Real-time game state** with WebSocket updates

## 🛠️ Tech Stack

- **Smart Contracts**: Anchor Framework (Rust) - 2,000+ lines of production-ready code
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Blockchain**: Solana Web3.js with type-safe Anchor integration
- **Real-time**: Helius WebSocket monitoring for live game updates
- **Token Creation**: PumpPortal API for winner meme tokens
- **State Management**: Zustand with on-chain synchronization
- **Styling**: Custom pirate theme with real-time animations

## 📱 Features

### ✅ **Implemented**
- ✅ **Complete Anchor smart contracts** - Full game logic on Solana blockchain
- ✅ **Real-time multiplayer** - Live updates via Helius WebSocket monitoring
- ✅ **Economic model** - Entry fees, platform fees, winner payouts
- ✅ **Game state validation** - On-chain turn validation and item effects
- ✅ **Responsive pirate-themed UI** with animations and real-time feedback
- ✅ **Solana wallet integration** (Phantom, Solflare, Backpack)
- ✅ **Type-safe blockchain integration** with Anchor program calls
- ✅ **Mobile-optimized interface** for seamless gameplay

### 🚧 **In Development** 
- PumpPortal token creation for winners (API integration ready)
- Zero-knowledge privacy features for private moves
- Tournament modes and advanced game mechanics

### 🔮 **Planned**
- Tournament modes with entry fees
- Achievement NFTs and leaderboards
- Cross-platform mobile app
- Advanced privacy features with Zcash

## 📚 Documentation

### **Quick Links**
- 🚀 [Getting Started](docs/GETTING_STARTED.md) - 5-minute setup guide
- 📖 [Full Documentation](docs/) - Complete guides and references
- 🧪 [Integration Testing](docs/integration/TESTING.md) - API test implementations
- 📋 [Development Roadmap](ROADMAP.md) - 14-day sprint plan
- ✅ [Day 2 Complete](DAY_2_COMPLETE.md) - Smart contracts ready for deployment

### **For Developers**
- 🏗️ [Architecture Guide](docs/guides/SETUP.md)
- 🔌 [API Reference](docs/integration/PUMP_FUN.md)
- 🎯 [Quick Reference](docs/reference/QUICK_REFERENCE.md)
- 🦀 [Smart Contracts](programs/pir8-game/src/) - Anchor program source code

## 🎯 Hackathon Strategy

This project targets multiple bounties in the Zcash privacy hackathon:

### **Primary Targets**
- 🥇 **Helius Bounty** ($10k) - Solana ↔ Zcash solutions
- 🥈 **Pump Fun Bounty** ($5k) - Meme coin integration
- 🥉 **Gaming Innovation** ($3-7k) - Creative privacy applications

### **Technical Differentiators**
- First blockchain implementation of classic Pirate Game
- Real-time multiplayer with sub-second response times
- Novel combination of gaming + DeFi + privacy + viral mechanics
- Professional UI/UX that rivals traditional games

## 🧪 Testing

### **Smart Contract Testing**
```bash
# Build and test Anchor programs
anchor build
anchor test

# Deploy to Devnet for testing
anchor deploy --provider.cluster devnet
```

### **Integration Testing**
```bash
# Test Helius WebSocket monitoring
npx tsx tests/helius-transaction-monitor.ts

# Test Pump Fun token creation
npx tsx tests/pump-token-creator.ts

# Run frontend with real-time features
npm run dev
```

## 🌟 Game Economics

- **Entry Fee**: 0.1 SOL per game
- **Platform Fee**: 5% of pot
- **Winner Prize**: 85% of total pot
- **Bonus Rewards**: Pirate-themed meme tokens via Pump Fun

## 🏴‍☠️ Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](License.txt) file for details.

## 🙏 Acknowledgments

- Original Pirate Game concept and Python implementation
- Solana ecosystem and developer tools
- Helius for enhanced RPC infrastructure
- Pump Fun for token creation capabilities

---

**Built with ⚡ Solana, 🔥 Helius, and 🏴‍☠️ Pirate Spirit**

[Website](https://pir8.vercel.app) • [GitHub](https://github.com/thisyearnofear/pir8) • [Discord](https://discord.gg/pir8) • [Twitter](https://twitter.com/pir8_game)