# Getting Started with PIR8

## Overview

PIR8 is a privacy-oriented strategic naval combat game on Solana. Players command fleets, contest territory, manage resources, and compete in stake-backed matches and tournaments.

The current frontend uses the canonical devnet program and checked-in IDL. Rebuilding or modifying the on-chain program requires the Anchor/Rust toolchain; running the frontend does not.

## Canonical deployment

- **Devnet program ID:** `2TZwkCc8ffz7NGWYF3koXyRm75DHq9VL9kvHxXZu8kLy`
- **Public IDL:** `public/idl/pir8_game.json`
- **Anchor version:** `0.32.1`
- **Network:** Solana devnet

Older program IDs may still exist on devnet, but they are not the canonical target for this repository.

## Prerequisites

For the frontend:

- Node.js 20+ recommended
- pnpm 10+
- Solana wallet (Phantom, Solflare, or Backpack)
- Helius devnet RPC key

For smart-contract development:

- Rust toolchain compatible with Anchor `0.32.1`
- Solana CLI 3.x
- Anchor CLI `0.32.1`
- Devnet SOL for deployment/testing

## Installation

```bash
git clone https://github.com/thisyearnofear/pir8.git
cd pir8
pnpm install
cp .env.local.example .env.local
```

## Environment configuration

Set these variables in `.env.local`:

```bash
# Helius devnet RPC
NEXT_PUBLIC_HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
HELIUS_API_KEY=YOUR_KEY

# Canonical PIR8 devnet program
NEXT_PUBLIC_PROGRAM_ID=2TZwkCc8ffz7NGWYF3koXyRm75DHq9VL9kvHxXZu8kLy
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

Optional services such as Supabase, Venice AI, and Pump.fun are not required for the core local game loop.

## Run the app

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000), connect a devnet wallet, and use the practice or challenge flow.

## Useful commands

```bash
# Production build
pnpm run build

# TypeScript validation
pnpm run typecheck

# Lint app and src
pnpm run lint

# Jest tests
pnpm test

# Check program ID / IDL / env consistency
pnpm run anchor:check-program

# Build and deploy the program through the repository script
pnpm run anchor:deploy-program
```

There is currently no root `format`, `cli`, or `type-check` package script. Older documentation that references those commands is stale.

## Smart-contract workflow

The canonical Anchor source path is `programs/pir8-game`. The frontend integration uses the deployed program ID plus `public/idl/pir8_game.json`.

Typical contract workflow:

```bash
# Check configuration consistency first
pnpm run anchor:check-program

# Build with Anchor when the program source is present
anchor build

# Or use the repository deployment workflow
pnpm run anchor:deploy-program

# Verify the canonical deployment
solana program show 2TZwkCc8ffz7NGWYF3koXyRm75DHq9VL9kvHxXZu8kLy --url devnet
```

If `programs/pir8-game` is absent in a local working tree, frontend development can still proceed against the checked-in IDL, but program rebuilding cannot. Restore the program source before attempting contract changes.

## Session-key privacy flow

PIR8 uses ephemeral session keys for lower-friction, pseudonymous gameplay rather than a cross-chain bridge or server-side signing service:

1. The player generates an ephemeral keypair in the browser.
2. The main wallet delegates limited control to that session key.
3. The session key signs gameplay transactions.
4. The main wallet does not need to appear directly on routine game actions.
5. Rewards or final outcomes can be linked back through the registry/delegation flow.

The delegation link is public on-chain. Session keys reduce direct main-wallet interaction and improve operational pseudonymity, but they do not provide strong anonymity or unlinkability by themselves. Public match accounts can still reveal gameplay state; stronger privacy would require additional cryptographic or execution-layer design.

This session-key design is separate from MagicBlock Ephemeral Rollups. MagicBlock integration is currently a proposal, not implemented functionality; see [MAGICBLOCK_INTEGRATION.md](./MAGICBLOCK_INTEGRATION.md).

## Game flow

1. **Create or join a match** — a creator configures entry terms and players join through the program.
2. **Command the fleet** — move ships, attack opponents, scan coordinates, claim territories, collect resources, and build ships.
3. **Adapt to the map** — ports, islands, treasure sites, storms, reefs, and whirlpools have different strategic effects.
4. **Win the match** — victory is determined by fleet dominance, territorial control, or economic strength.
5. **Share the outcome** — challenge, replay, leaderboard, and spectator surfaces are intended to turn matches into distribution loops.

## Troubleshooting

### Program ID mismatch

The canonical ID is `2TZwkCc8ffz7NGWYF3koXyRm75DHq9VL9kvHxXZu8kLy`. If the app reports a mismatch, compare:

- `NEXT_PUBLIC_PROGRAM_ID` in `.env.local`
- `public/idl/pir8_game.json`
- `Anchor.toml`
- `src/lib/anchor.ts`
- `src/utils/constants.ts`

Then run:

```bash
pnpm run anchor:check-program
```

### Insufficient devnet funds

```bash
solana airdrop 2 --url devnet
solana balance --url devnet
```

### Wallet connection issues

- Confirm the wallet is on devnet.
- Clear stale wallet adapter state/browser storage.
- Try Phantom, Solflare, or Backpack.
- Check that the Helius RPC URL includes a valid API key.

### Frontend build issues

```bash
pnpm run clean
pnpm install
pnpm run typecheck
pnpm run build
```
