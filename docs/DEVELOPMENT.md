# PIR8 Development Guide

## Repository structure

```text
pir8/
├── app/                         # Next.js app routes and API routes
│   ├── api/actions/challenge/   # Solana Action challenge endpoint
│   ├── api/challenges/          # Challenge data endpoints
│   ├── api/competitive/         # Competitive profile/leaderboard endpoints
│   ├── api/moments/             # Replay and battle-moment endpoints
│   └── replay/[id]/             # Replay viewer route
│
├── src/
│   ├── agents/                  # Agent and AI opponent logic
│   ├── components/              # React UI components
│   ├── contexts/                # React providers/context
│   ├── hooks/                   # Game, privacy, challenge, replay, audio hooks
│   ├── lib/
│   │   ├── client/              # Browser transaction construction
│   │   ├── engine/              # Game engine logic
│   │   ├── sdk/                 # Shared SDK helpers
│   │   ├── server/              # Server-side helpers
│   │   ├── solana/              # Solana utilities
│   │   └── anchor.ts            # Program/PDA helpers
│   ├── store/                   # Zustand state slices
│   ├── types/                   # TypeScript types
│   └── utils/                   # Shared utilities
│
├── packages/
│   ├── core/                    # Shared game engine/types/utilities
│   └── mobile/                  # React Native / Expo mobile surface
│
├── programs/pir8-game/          # Canonical Anchor program source
├── public/idl/pir8_game.json    # IDL used by the frontend
├── scripts/                     # Deployment and verification utilities
├── tests/                       # Jest/integration tests
├── docs/                        # Documentation
├── Anchor.toml                  # Anchor workspace configuration
└── package.json                 # pnpm workspace scripts and dependencies
```

## Canonical on-chain deployment

- **Program ID:** `2TZwkCc8ffz7NGWYF3koXyRm75DHq9VL9kvHxXZu8kLy`
- **Network:** Solana devnet
- **Anchor:** `0.32.1`
- **Frontend IDL:** `public/idl/pir8_game.json`

Do not use older devnet program IDs in new documentation, demos, or environment files unless you are intentionally testing a legacy deployment.

## Package scripts

```bash
# Frontend
pnpm run dev
pnpm run build
pnpm start

# Quality checks
pnpm run typecheck
pnpm run lint
pnpm test

# Mobile workspace
pnpm run dev:mobile
pnpm run build:mobile

# Program utilities
pnpm run anchor:check-program
pnpm run anchor:deploy-program

# Cleanup
pnpm run clean
```

There is no root `format`, `cli`, or `type-check` script. Use the exact script names above.

## Frontend development

### Start the app

```bash
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_HELIUS_RPC_URL and NEXT_PUBLIC_PROGRAM_ID
pnpm run dev
```

Required core variables:

```bash
NEXT_PUBLIC_HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_PROGRAM_ID=2TZwkCc8ffz7NGWYF3koXyRm75DHq9VL9kvHxXZu8kLy
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

### State and transaction flow

The expected flow for an on-chain action is:

1. Validate the action in local game state.
2. Build the transaction with the checked-in IDL.
3. Request a wallet or session-key signature.
4. Send the transaction through the configured RPC.
5. Refresh local state from chain or the event/monitoring path.
6. Surface failures honestly in the UI.

Avoid adding mock success paths for failed chain transactions. The competitive and challenge surfaces are only credible if chain state, local state, and UI state can be reconciled.

## Smart-contract development

The canonical Anchor source path is `programs/pir8-game`. If that directory is absent in a local working tree, restore it before attempting program changes.

Before building or deploying:

```bash
pnpm run anchor:check-program
```

Typical workflow:

```bash
anchor build
anchor test
pnpm run anchor:deploy-program
solana program show 2TZwkCc8ffz7NGWYF3koXyRm75DHq9VL9kvHxXZu8kLy --url devnet
```

When program instructions change:

1. Regenerate the IDL.
2. Update `public/idl/pir8_game.json` and any generated types.
3. Update transaction builders in `src/lib/client/`.
4. Update architecture documentation.
5. Run typecheck, lint, and relevant tests.

## MagicBlock development status

VRF weather is **live on devnet** (request path proven, client loop wired — see [MAGICBLOCK_INTEGRATION.md](./MAGICBLOCK_INTEGRATION.md)); Ephemeral Rollup match sessions remain **designed, not implemented**.

Rules that still apply:

- do not claim ER in demos — it is not working;
- live VRF fulfillment depends on the shared devnet oracle; `debug_settle_weather` is a demo stand-in, never a competitive path;
- keep devnet prize/settlement framing explicit.

## Deploying the game program (canonical)

Always deploy with the explicit canonical program ID — the local keypair file (`programs/pir8-game/target/deploy/pir8_game-keypair.json`) does **not** match it, and a bare deploy publishes to the wrong address:

```bash
./scripts/deploy-canonical.sh
# equivalent: solana program deploy <SO> --program-id 2TZwkCc8ffz7NGWYF3koXyRm75DHq9VL9kvHxXZu8kLy --url devnet
```

## Testing

### TypeScript and lint gates

```bash
pnpm run typecheck
pnpm run lint
```

### Jest tests

```bash
pnpm test
```

### Useful manual verification paths

- practice match without wallet;
- wallet connect on devnet;
- challenge creation/joining;
- on-chain create/join transaction construction;
- spectator/replay route;
- mobile responsive surface;
- program ID consistency check.

For any chain-facing change, include at least one explorer transaction or a clear explanation of why the change cannot produce one.

## Debugging

### Solana

```bash
solana confirm -v <SIGNATURE> --url devnet
solana program show 2TZwkCc8ffz7NGWYF3koXyRm75DHq9VL9kvHxXZu8kLy --url devnet
solana logs 2TZwkCc8ffz7NGWYF3koXyRm75DHq9VL9kvHxXZu8kLy --url devnet
```

### Frontend

Use descriptive temporary logs while debugging, but remove noisy logs before committing:

```typescript
console.debug("[PIR8] Game state updated", gameState);
console.warn("[PIR8] Slow transaction detected", durationMs);
console.error("[PIR8] Transaction failed", error);
```

## Git workflow

### Branch naming

- Features: `feature/description`
- Fixes: `fix/description`
- Documentation: `docs/description`

### Commit style

Use conventional commits where possible:

```text
feat: add weather randomness request instruction
fix: correct challenge transaction account ordering
docs: clarify canonical program id
test: cover replay persistence edge case
```

### Pull requests

Before opening a PR:

- run `pnpm run typecheck`;
- run `pnpm run lint`;
- run relevant tests;
- update docs when behavior, scripts, program IDs, or architecture change;
- do not mix unrelated refactors with chain-integration changes.

## Documentation expectations

Keep these facts synchronized across `README.md`, `docs/`, `.env.local.example`, and deployment scripts:

- canonical program ID;
- Anchor version;
- Next.js/package-manager commands;
- implemented versus proposed features;
- whether MagicBlock integration is designed, in progress, or live.
