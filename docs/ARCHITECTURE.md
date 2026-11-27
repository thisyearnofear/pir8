# PIR8 Architecture

## System overview

PIR8 is a full-stack Solana game with a Next.js web client, shared TypeScript game logic, an Anchor program for match state and value flow, and session-key delegation for privacy-oriented gameplay.

The current canonical deployment is:

- **Program ID:** `2TZwkCc8ffz7NGWYF3koXyRm75DHq9VL9kvHxXZu8kLy`
- **Network:** Solana devnet
- **IDL:** `public/idl/pir8_game.json`
- **Anchor:** `0.32.1`

Older devnet deployments may still exist, but they are legacy artifacts and should not be used by the frontend.

## Technology stack

### On-chain and blockchain-adjacent

- Solana devnet
- Anchor `0.32.1`
- `@coral-xyz/anchor` `0.32.x`
- `@solana/web3.js`
- Helius RPC/WebSocket monitoring
- Session keys through the program's `AgentRegistry` delegate pattern

### Web application

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Zustand
- Solana Wallet Adapter

### Shared/mobile surfaces

- `packages/core`: shared game engine, types, validation, balance utilities
- `packages/mobile`: React Native/Expo mobile client surface

## High-level runtime flow

```text
Player action in web/mobile UI
  → local game-rule validation
  → transaction builder / Anchor client
  → wallet or session-key signature
  → Solana devnet program
  → chain account refresh + Helius/event monitoring
  → UI, replay, challenge, leaderboard state update
```

Practice mode can run locally without a wallet. On-chain competitive and challenge flows must reconcile against program state.

## Program architecture

The canonical Anchor source path is `programs/pir8-game`. The frontend consumes the generated IDL rather than duplicating instruction layouts manually. If the program source is absent in a local working tree, restore it before making program changes.

### Current IDL instructions

The checked-in IDL exposes these instructions:

- `create_game`
- `join_game`
- `join_game_via_delegate`
- `start_game`
- `move_ship`
- `move_ship_via_delegate`
- `attack_ship`
- `claim_territory`
- `collect_resources`
- `build_ship`
- `scan_coordinate`
- `end_turn`
- `check_and_complete_game`
- `claim_winnings`
- `reset_game`
- `activate_ghost_fleet`
- `register_agent`
- `delegate_agent_control`

### Core accounts and state

#### `PirateGame`

Represents one match. Important fields include:

- `game_id`
- `authority`
- `status` (`Waiting`, `Active`, `Completed`)
- `mode` (`Casual`, `Competitive`, `AgentArena`)
- `players`
- `current_player_index`
- `turn_number`
- `winner`
- `weather_type` and `weather_duration`
- flattened `territory_map`

#### `PlayerData`

Per-player state inside a match:

- resources: gold, crew, cannons, supplies
- fleet: ships with health, attack, defense, speed, position, and last action turn
- controlled territories
- scan charges and scanned-coordinate bookkeeping
- Ghost Fleet state
- timing/speed bonus metrics

#### `AgentRegistry`

Tracks identity/delegation metadata:

- owner wallet
- optional delegate/session key
- public profile metadata
- games played and wins
- activity timestamp

This registry is the basis for the current session-key privacy flow.

## PDA layout

The frontend derives the core program accounts in `src/lib/anchor.ts`:

- config PDA from `["config"]`
- game PDA from `["pirate_game", game_id]`
- agent registry PDA from `["agent", owner]`

Keep TypeScript PDA derivation synchronized with the program whenever seeds change.

## Frontend architecture

```text
app/
├── page.tsx                      # primary game entry
├── api/actions/challenge/        # Solana Action challenge endpoint
├── api/challenges/               # challenge APIs
├── api/competitive/              # competitive/leaderboard APIs
├── api/moments/                  # battle-moment/replay APIs
└── replay/[id]/                  # replay viewer

src/
├── components/                   # cockpit, map, onboarding, privacy, mobile UI
├── hooks/                        # game lifecycle, challenge, session key, replay, sound
├── lib/
│   ├── client/transactionBuilder # Anchor transaction construction
│   ├── engine/                   # gameplay engine helpers
│   ├── solana/                   # Solana helpers
│   ├── anchor.ts                 # program IDs and PDA derivation
│   └── privacySimulation.ts      # practice-mode privacy education
├── store/                        # Zustand state slices
└── types/                        # TypeScript domain types
```

### State management

Zustand slices coordinate UI and chain state. Chain-backed actions should follow this order:

1. local validation;
2. transaction construction;
3. explicit wallet/session-key signature;
4. submission through configured RPC;
5. refresh from chain;
6. UI update.

Do not treat a locally successful game-engine transition as proof that an on-chain transaction succeeded.

## Privacy architecture

### Implemented session-key pattern

The current privacy design uses ephemeral session keys:

1. Player generates an ephemeral keypair in the browser.
2. Main wallet calls the delegation instruction for that key.
3. Session key signs supported gameplay actions.
4. Main wallet is not required to sign every routine move.
5. Registry state links delegated identity back for controlled reward/reputation flows.

This reduces wallet friction and can provide weak operational pseudonymity, but it is not a zero-knowledge system and should not be described as one. Because the delegation transaction, registry, and match account are public, the current design does not provide strong anonymity or unlinkability. Likewise, Ghost Fleet should be treated as a gameplay/visibility abstraction unless hidden positions are actually kept out of public account data.

### Privacy as gameplay

Practice mode intentionally teaches information leakage through systems such as:

- Ghost Fleet;
- leakage-meter concepts;
- transparent-versus-private play comparison;
- bounty/replay moments.

These are product/education mechanics, not independent cryptographic privacy guarantees.

## Challenge, replay, and competitive surfaces

The repo includes API and UI surfaces for:

- challenge creation and acceptance;
- spectator/watch flows;
- battle-moment capture;
- replay persistence and replay viewing;
- captain/competitive profiles;
- leaderboard-style aggregation.

These surfaces are important to the Entertainment Finance positioning because they convert matches into watchable and shareable market events rather than isolated games.

## MagicBlock integration status

MagicBlock is **not currently integrated**.

The documented proposal is in [MAGICBLOCK_INTEGRATION.md](./MAGICBLOCK_INTEGRATION.md). The two candidate integration layers are:

### 1. MagicBlock VRF

Use verifiable randomness for weather, hazard, or combat-variance seeds.

Recommended first milestone because it is bounded and produces clear explorer evidence.

### 2. Ephemeral Rollup match sessions

Delegate active match state during gameplay, execute low-friction session actions, then commit/undelegate final state back to Solana.

This is architecturally deeper but significantly more invasive. If pursued, delegate active gameplay state only; keep entry-fee escrow, winner settlement, and durable reputation on base-layer Solana.

### Important framing constraint

PIR8 is turn-based. Do not claim that it inherently requires 10ms block times. The credible ER argument is gasless/low-friction session play, fewer wallet interruptions, fast UI feedback, and improved spectator responsiveness.

## Security and integrity considerations

- Validate signer authority for all state-changing instructions.
- Enforce turn order and player membership on-chain.
- Keep arithmetic bounded and checked.
- Treat frontend validation as UX only; program validation is authoritative.
- Do not expose or log private keys/session keys.
- Clearly separate devnet test value from any future real-value tournament design.

## Performance considerations

- Keep transaction construction narrow and avoid unnecessary account passing.
- Debounce high-frequency UI updates.
- Use event/WebSocket updates where available, with polling fallback.
- Keep replay/moment storage bounded.
- Measure mobile performance separately from desktop.

## Documentation invariant

When any of these change, update `README.md`, `docs/GETTING_STARTED.md`, `docs/DEVELOPMENT.md`, this file, and `.env.local.example` together:

- canonical program ID;
- Anchor/SDK versions;
- transaction scripts;
- implemented versus proposed privacy/randomness features;
- deployment network.
