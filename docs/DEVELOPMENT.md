# Development & Contributing

## Setting Up Your Development Environment

Follow the installation steps in the Getting Started guide to set up your development environment.

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
│   │   ├── PlayerStats.tsx
│   │   └── ...
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── usePirateGameState.ts
│   │   ├── useZcashBridge.ts
│   │   └── ...
│   │
│   ├── lib/                 # Core libraries
│   │   ├── integrations.ts  # Helius/Pump/Zcash
│   │   ├── anchorClient.ts  # Anchor program client
│   │   ├── gameLogic.ts     # Game rules engine
│   │   └── pirateGameEngine.ts
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
├── scripts/                 # Build/deployment scripts
├── Anchor.toml              # Anchor configuration
├── package.json            # Node dependencies
└── README.md              # Project overview
```

## Development Workflow

### Smart Contract Development

#### Adding New Game Items

1. **Update Smart Contract**:
```rust
// programs/pir8-game/src/lib.rs
pub enum TerritoryType {
    // ... existing items
    NewTerritory,  // Add new variant
}

// Add handling in claim_territory instruction
TerritoryType::NewTerritory => {
    // Define effect
    player.resources.gold += 15; // Example effect
}
```

2. **Update Frontend Types**:
```typescript
// src/types/game.ts
export type TerritoryType =
  | 'water'
  | 'island'
  | 'port'
  | 'treasure'
  | 'new_territory'  // Add here
  | ...;
```

3. **Add to Game Map Generation**:
```rust
// Update TERRITORY_DISTRIBUTION constant
pub const TERRITORY_DISTRIBUTION: &[(TerritoryType, u8)] = &[
    // ... existing
    (TerritoryType::NewTerritory, 5), // 5% chance
];
```

#### Adding New Instructions

1. **Define Context**:
```rust
#[derive(Accounts)]
pub struct NewInstruction<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

2. **Implement Handler**:
```rust
pub fn new_instruction(ctx: Context<NewInstruction>) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let player = &ctx.accounts.player;
    
    // Add your business logic here
    // Validate game state, player permissions, etc.
    
    // Emit events for frontend synchronization
    emit!(NewInstructionExecuted {
        player: player.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    Ok(())
}
```

3. **Add to Program**:
```rust
#[program]
pub mod pir8_game {
    use super::*;

    pub fn new_instruction(ctx: Context<NewInstruction>) -> Result<()> {
        // Call handler
        crate::handlers::new_instruction_handler(ctx)
    }
}
```

4. **Update Frontend Client**:
```typescript
// src/lib/anchorClient.ts
async newInstruction() {
  return await this.program.methods
    .newInstruction()
    .accounts({ 
      game: gamePDA,
      player: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}
```

### Frontend Development

#### Adding New UI Components

When adding new components, follow these principles:

1. **Single Responsibility**: Each component should have one clear purpose
2. **Size Limit**: Keep components under 300 lines
3. **Reusability**: Design components to be reusable where possible
4. **Type Safety**: Use TypeScript interfaces for props

Example component structure:
```typescript
// src/components/NewFeatureComponent.tsx
import { useState } from 'react';
import { usePirateGameState } from '@/hooks/usePirateGameState';

interface NewFeatureProps {
  gameId: string;
  onAction: () => void;
}

export function NewFeatureComponent({ gameId, onAction }: NewFeatureProps) {
  const { gameState, player } = usePirateGameState(gameId);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onAction();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-feature-container">
      {/* Component JSX */}
    </div>
  );
}
```

#### Adding New Hooks

When creating custom hooks:

1. **Follow Naming Convention**: `useCustomHookName`
2. **Keep Logic Encapsulated**: Don't expose internal state unnecessarily
3. **Handle Side Effects Properly**: Clean up subscriptions, timers, etc.
4. **Return Consistent Interface**: Always return the same shape

### Agent Development

#### PIR8 Agent Plugin

The `PIR8AgentPlugin` is the universal middleware for autonomous play.

1. **Adding New Tools**:
To add a new autonomous capability (e.g., "Scan Map"), update `src/plugins/PIR8AgentPlugin.ts`:
```typescript
private scanMapTool(): PIR8AgentTool {
  return {
    name: 'pir8_scan_map',
    description: 'Uses radar to reveal hidden tiles.',
    parameters: { ... },
    execute: async (input) => {
      // Implementation
    }
  };
}
```

2. **Testing Headless Agents**:
Use the integrated test bot to verify on-chain turn monitoring:
```bash
npx tsx src/agents/pirate-bot.ts
```

### Testing

#### Unit Tests

Write unit tests for:
- Game logic functions
- Utility functions
- Component rendering (props, state changes)
- Hook behavior

```typescript
// tests/unit/gameLogic.test.ts
import { calculateShipMovement } from '@/lib/gameLogic';

describe('calculateShipMovement', () => {
  test('should calculate valid move distance', () => {
    const result = calculateShipMovement({ x: 0, y: 0 }, { x: 2, y: 1 });
    expect(result.distance).toBe(3); // Manhattan distance
  });

  test('should reject invalid moves', () => {
    const ship = { speed: 2 };
    const result = calculateShipMovement(ship, { x: 0, y: 0 }, { x: 5, y: 5 });
    expect(result.valid).toBe(false);
  });
});
```

#### Integration Tests

Write integration tests for:
- Full game flows
- Smart contract interactions
- Cross-component interactions
- State synchronization

```typescript
// tests/integration/gameFlow.test.ts
import { initializeGame, joinGame, makeMove } from '@/lib/anchorClient';

describe('Full Game Flow', () => {
  test('should complete a full game from start to finish', async () => {
    const game = await initializeGame();
    const player1 = await joinGame(game.id);
    const player2 = await joinGame(game.id);
    
    // Start game
    await startGame(game.id);
    
    // Play through turns
    await makeMove(player1.shipId, { x: 1, y: 1 });
    await makeMove(player2.shipId, { x: 1, y: 2 });
    
    // Verify game state updates
    const finalState = await getGameState(game.id);
    expect(finalState.currentPlayer).toBe(player2.id);
  });
});
```

### Code Quality Standards

#### TypeScript Best Practices

1. **Use Strict Typing**:
```typescript
// Good
interface Player {
  id: string;
  resources: Resources;
  ships: Ship[];
}

// Avoid
interface Player {
  id: any;
  resources: any;
  ships: any[];
}
```

2. **Use Utility Types**:
```typescript
// Good
type PlayerUpdate = Partial<Player>;

// Instead of
interface PlayerUpdate {
  id?: string;
  resources?: Resources;
  ships?: Ship[];
}
```

3. **Define Clear Interfaces**:
```typescript
// Good
interface GameAction {
  type: 'move' | 'attack' | 'claim';
  payload: any;
}

// Avoid
type GameAction = any;
```

#### Rust Best Practices

1. **Error Handling**:
```rust
// Good
require!(
    player.resources.gold >= SHIP_COST,
    PIR8Error::InsufficientFunds
);

// Avoid
if player.resources.gold < SHIP_COST {
    return Err(ProgramError::InvalidAccountData.into());
}
```

2. **Event Emission**:
```rust
// Good
emit!(ShipMoved {
    player: player.key(),
    ship_id: ship.id,
    from: ship.position,
    to: new_position,
    timestamp: Clock::get()?.unix_timestamp,
});

// Avoid
msg!("Ship moved: {}", ship.id);
```

3. **Security Checks**:
```rust
// Good
#[access_control(check_game_active(&ctx.accounts.game))]
pub fn make_move(ctx: Context<MakeMove>) -> Result<()> {
    // Implementation
}

// Avoid
pub fn make_move(ctx: Context<MakeMove>) -> Result<()> {
    // Security checks mixed with business logic
}
```

### Git Workflow

#### Branch Naming

- Feature branches: `feature/description-of-feature`
- Bug fixes: `fix/description-of-fix`
- Hotfixes: `hotfix/urgent-fix-description`

#### Commit Messages

Follow conventional commits format:
```
feat: add new ship type to game
fix: resolve issue with territory claiming
refactor: optimize game state serialization
docs: update architecture documentation
test: add unit tests for combat system
```

#### Pull Request Process

1. **Create PR early**: Even if work in progress, create PR for visibility
2. **Link to issue**: Reference related issues in PR description
3. **Include screenshots**: For UI changes, include before/after screenshots
4. **Self-review**: Review your own code before requesting others
5. **Request reviews**: Assign to team members for code review
6. **Address feedback**: Make requested changes promptly
7. **Update documentation**: Update relevant docs with code changes

### Debugging

#### Smart Contract Debugging

1. **Local Validator**:
```bash
# Start local validator
solana-test-validator

# Deploy to local
anchor deploy --provider.cluster localnet

# Run tests against local
anchor test --skip-local-validator
```

2. **Transaction Logs**:
```bash
# Get transaction logs
solana confirm -v <SIGNATURE>

# View program logs
solana logs <PROGRAM_ID>

# Check account data
solana account <ACCOUNT_ADDRESS>

# Decode base64 error
echo "<ERROR_DATA>" | base64 -d
```

#### Frontend Debugging

1. **Console Logging**:
```typescript
// Use structured logging
console.debug('[PIR8] Game state updated:', gameState);
console.warn('[PIR8] Slow transaction detected:', duration);
console.error('[PIR8] Critical error:', error);
```

2. **Network Tab**:
- Monitor RPC requests
- Check transaction confirmations
- Verify WebSocket connections

3. **React Developer Tools**:
- Inspect component state
- Track re-renders
- Monitor hook dependencies

### Performance Optimization

#### Smart Contract Optimization

1. **Account Size**:
- Keep accounts under 10KB (Solana realloc limit)
- Use bit packing for flags
- Store large data off-chain when possible

2. **Compute Budget**:
- Keep instructions under 200k compute units
- Minimize loops and recursion
- Cache expensive calculations

3. **Rent Exemption**:
- Calculate rent costs for accounts
- Consider rent-exempt minimums
- Plan for account closure

#### Frontend Optimization

1. **Bundle Size**:
- Use dynamic imports for heavy components
- Lazy load non-critical features
- Audit bundle with `npm run analyze`

2. **State Management**:
- Use memoization for expensive calculations
- Optimize re-renders with React.memo
- Implement virtual scrolling for large lists

3. **Network Requests**:
- Batch multiple requests when possible
- Implement caching strategies
- Use WebSocket for real-time updates

### Security Considerations

#### Smart Contract Security

1. **Input Validation**:
- Validate all external inputs
- Check array bounds
- Validate public keys

2. **Reentrancy Protection**:
- Update state before external calls
- Use checks-effects-interactions pattern
- Consider reentrancy guards

3. **Arithmetic Safety**:
- Use checked arithmetic operations
- Prevent integer overflow/underflow
- Validate division operations

#### Frontend Security

1. **Input Sanitization**:
- Sanitize user inputs before sending to blockchain
- Validate data from blockchain before displaying
- Prevent XSS attacks

2. **Wallet Integration**:
- Verify wallet connections
- Handle disconnections gracefully
- Protect against phishing

### Deployment Process

#### Pre-deployment Checklist

- [ ] All tests pass (unit, integration, e2e)
- [ ] Code reviewed by at least one team member
- [ ] Security audit completed (if applicable)
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Backup strategy verified

#### Deployment Steps

1. **Testnet Deployment**:
```bash
# Deploy to testnet
anchor deploy --provider.cluster devnet

# Verify deployment
solana program show <PROGRAM_ID>

# Run integration tests against testnet
anchor test --skip-local-validator
```

2. **Mainnet Deployment**:
```bash
# Update Anchor.toml for mainnet
# Deploy to mainnet
anchor deploy --provider.cluster mainnet

# Verify deployment
solana program show <PROGRAM_ID>

# Update frontend with new program ID
```

### Contribution Guidelines

#### Code Review Process

1. **Be Constructive**: Focus on improving code quality, not criticizing
2. **Be Specific**: Point to specific lines and suggest concrete improvements
3. **Consider Context**: Understand the broader impact of changes
4. **Test Assumptions**: Verify that suggested changes work as expected
5. **Document Decisions**: Explain reasoning behind suggestions

#### Issue Tracking

1. **Use Templates**: Follow issue templates when creating new issues
2. **Provide Context**: Include reproduction steps, expected vs actual behavior
3. **Tag Appropriately**: Use labels to categorize issues
4. **Assign Priority**: Help prioritize work with priority labels
5. **Update Status**: Keep issue status updated as work progresses

#### Documentation Updates

1. **Keep Current**: Update docs when code changes
2. **Be Clear**: Write for developers unfamiliar with the codebase
3. **Include Examples**: Provide code examples where helpful
4. **Link Related**: Connect related documentation pages
5. **Review Regularly**: Periodically review docs for accuracy