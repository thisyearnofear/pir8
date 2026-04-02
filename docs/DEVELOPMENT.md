# PIR8 Development Guide

## Project Structure

```
pir8/
├── programs/                 # Solana smart contracts
│   └── pir8-game/
│       ├── src/
│       │   └── lib.rs       # Main program logic
│       ├── Cargo.toml
│       └── Anchor.toml
│
├── app/                      # Next.js app directory
│   ├── page.tsx             # Main game interface
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Styling
│
├── src/
│   ├── components/          # React components
│   │   ├── GameCockpit/     # Main game UI components
│   │   ├── PirateControls.tsx
│   │   ├── PirateMap.tsx
│   │   └── ...
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── usePirateGameState.ts
│   │   ├── useSessionKey.ts     # Privacy via ephemeral wallets
│   │   └── ...
│   │
│   ├── lib/                 # Core libraries
│   │   ├── integrations.ts  # Helius/Pump integrations
│   │   ├── anchorClient.ts  # Blockchain interactions
│   │   ├── gameLogic.ts     # Game rules engine
│   │   └── ...
│   │
│   ├── cli/                 # CLI commands
│   │   └── commands/
│   │       ├── game.ts
│   │       ├── monitor.ts
│   │       └── token.ts
│   │
│   └── types/               # TypeScript types
│       └── game.ts
│
├── docs/                    # Documentation
├── tests/                   # Integration tests
├── Anchor.toml              # Anchor configuration
├── package.json             # Node dependencies
└── README.md               # Project overview
```

## Development Workflow

### Smart Contract Development

#### Build Contracts
```bash
# Build Anchor program
anchor build

# Generate TypeScript types
anchor build --idl

# View program ID
solana address -k target/deploy/pir8_game-keypair.json
```

#### Test Contracts
```bash
# Run Anchor tests
anchor test

# Run specific test
anchor test --skip-deploy -- --test test_create_game
```

#### Deploy to Devnet
```bash
# Install Solana CLI (if not already installed)
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Configure for devnet
solana config set --url devnet

# Build program binary
cd programs/pir8-game
cargo build-sbf

# Deploy (note: use cargo build-sbf + solana program deploy, not anchor deploy)
solana program deploy target/deploy/pir8_game.so

# Verify deployment
solana program show DkkuBQySAxKTADdxQVyx8rjxudZVSwA7ZjRCqRquH5FU
```

> **Note**: `anchor build` IDL generation has a known incompatibility between `anchor-syn 0.30.1` and the Rust edition 2024 toolchain bundled with Solana CLI 3.x. Use `cargo build-sbf` directly to build the program binary.

### Frontend Development

#### Run Development Server
```bash
# Start Next.js dev server
pnpm run dev

# Build production bundle
pnpm run build

# Start production server
pnpm start
```

#### Code Quality
```bash
# Type checking
pnpm run type-check

# Linting
pnpm run lint

# Format code
pnpm run format
```

### CLI Tools

#### Initialize Platform
```bash
# Initialize game configuration (one-time)
pnpm run cli -- init

# View configuration
solana account <CONFIG_PDA>
```

#### Create & Join Games
```bash
# Create new game
pnpm run cli -- create

# Join existing game
pnpm run cli -- join 0

# Start game (when enough players)
pnpm run cli -- start 0
```

#### Monitor Transactions
```bash
# Watch for game events
pnpm run cli -- monitor

# Create winner token (when game completes)
pnpm run cli -- token 0
```

## Code Quality Standards

### TypeScript Best Practices

**Use Strict Typing**:
```typescript
interface Player {
  id: string;
  resources: Resources;
  ships: Ship[];
}
```

**Use Utility Types**:
```typescript
type PlayerUpdate = Partial<Player>;
```

### Rust Best Practices

**Error Handling**:
```rust
require!(
    player.resources.gold >= SHIP_COST,
    PIR8Error::InsufficientFunds
);
```

**Event Emission**:
```rust
emit!(ShipMoved {
    player: player.key(),
    ship_id: ship.id,
    from: ship.position,
    to: new_position,
    timestamp: Clock::get()?.unix_timestamp,
});
```

**Security Checks**:
```rust
#[access_control(check_game_active(&ctx.accounts.game))]
pub fn make_move(ctx: Context<MakeMove>) -> Result<()> {
    // Implementation
}
```

## Git Workflow

### Branch Naming
- Feature branches: `feature/description-of-feature`
- Bug fixes: `fix/description-of-fix`
- Hotfixes: `hotfix/urgent-fix-description`

### Commit Messages

Follow conventional commits format:
```
feat: add new ship type to game
fix: resolve issue with territory claiming
refactor: optimize game state serialization
docs: update architecture documentation
test: add unit tests for combat system
```

### Pull Request Process

1. Create PR early, link to issues
2. Include screenshots for UI changes
3. Self-review, then request team reviews
4. Address feedback promptly
5. Update documentation with code changes

## Testing

### Unit Tests

Test game logic, utilities, components, and hooks:

```typescript
import { calculateShipMovement } from '@/lib/gameLogic';

describe('calculateShipMovement', () => {
  test('should calculate valid move distance', () => {
    const result = calculateShipMovement({ x: 0, y: 0 }, { x: 2, y: 1 });
    expect(result.distance).toBe(3);
  });
});
```

### Integration Tests

Test full game flows and blockchain interactions:

```typescript
import { initializeGame, joinGame, moveShip } from '@/lib/client/transactionBuilder';

describe('Full Game Flow', () => {
  test('should complete a full game', async () => {
    const wallet1 = mockWallet();
    const wallet2 = mockWallet();

    await initializeGame(wallet1);
    await joinGame(wallet1);
    await joinGame(wallet2);
    await startGame(wallet1);
    await moveShip(wallet1, 'ship1', 1, 1);

    const finalState = await fetchGlobalGameState();
    expect(finalState.currentPlayerIndex).toBe(1);
  });
});
```

## Debugging

**Smart Contracts**:
```bash
solana-test-validator              # Start local validator
solana confirm -v <SIGNATURE>      # Get transaction logs
solana logs <PROGRAM_ID>           # View program logs
solana account <ACCOUNT_ADDRESS>   # Check account data
```

**Frontend**:
```typescript
console.debug('[PIR8] Game state updated:', gameState);
console.warn('[PIR8] Slow transaction detected:', duration);
console.error('[PIR8] Critical error:', error);
```

## Deployment

**Pre-deployment Checklist**:
- [ ] All tests pass
- [ ] Code reviewed
- [ ] Documentation updated

**Deploy to Devnet**:
```bash
anchor deploy --provider.cluster devnet
solana program show <PROGRAM_ID>
anchor test --skip-local-validator
```

## Contributing

**Code Review**: Be constructive, specific, and test assumptions.

**Documentation**: Keep current, be clear, include examples, link related pages.
