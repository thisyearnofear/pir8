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

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Blockchain**: Solana, Anchor Framework, Web3.js
- **Infrastructure**: Helius RPC, WebSocket subscriptions
- **Token Creation**: Pump Fun (PumpPortal API)
- **State Management**: Zustand
- **Styling**: Custom pirate theme with animations

## 📱 Features

### ✅ **Implemented**
- Complete game logic conversion from original Python version
- Responsive pirate-themed UI with animations
- Solana wallet integration (Phantom, Solflare, Backpack)
- Game state management and validation
- Error handling and user feedback
- Mobile-optimized interface

### 🚧 **In Development** 
- Anchor smart contracts for on-chain game state
- Helius WebSocket integration for real-time updates
- Multiplayer synchronization
- PumpPortal token creation for winners
- Zero-knowledge privacy features

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

### **For Developers**
- 🏗️ [Architecture Guide](docs/guides/SETUP.md)
- 🔌 [API Reference](docs/integration/PUMP_FUN.md)
- 🎯 [Quick Reference](docs/reference/QUICK_REFERENCE.md)

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

Run the integration tests for our sponsor APIs:

```bash
# Test Helius WebSocket monitoring
npx tsx tests/helius-transaction-monitor.ts

# Test Pump Fun token creation
npx tsx tests/pump-token-creator.ts
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