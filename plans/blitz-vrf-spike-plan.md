# Blitz VRF Spike Plan — Trackable

Goal: prove smallest verifiable MagicBlock integration (VRF weather seed) without destabilizing PIR8, or stop honestly if toolchain blocks.

Canonical: program `2TZwkCc8ffz7NGWYF3koXyRm75DHq9VL9kvHxXZu8kLy`, devnet, Anchor 0.32.1 baseline.

## Phase 0 — Baseline (DONE, verify)
- [x] Restore `programs/pir8-game/` + `target/idl/pir8_game.json` from HEAD
- [x] `pnpm install` clean
- [x] `pnpm run typecheck` passes
- [x] Fix `.env.local.example` — verified fine (canonical ID 2TZw... already, plus optional Pump/Supabase/Venice)
- [x] Fix `anchor:check-program` missing `target/deploy/pir8_game-keypair.json` — now WARN, exits 0; Anchor CLI missing also WARN
- [x] Record toolchain: Rust 1.99.1 / Solana 2.3.0 / Node 26.13 (nvm has 24.22.2) / no anchor CLI vs MagicBlock want Solana 3.1.9 / Rust 1.89 / Anchor 1.0.2 / Node 24.10

## Phase 1 — Isolated VRF spike (branch `feat/magicblock-vrf-spike`, 40-min gate)
- [ ] Create branch from clean tree
- [ ] Install side-by-side: Solana 3.1.9, Rust 1.89 (rustup toolchain), Anchor 1.0.2, Node 24 via nvm — do NOT overwrite system toolchain
- [ ] `npx skills add https://github.com/magicblock-labs/magicblock-dev-skill`
- [x] Compile gate PASSED: `spikes/vrf-compat-check` (Anchor 0.32.1 + `ephemeral-rollups-sdk@0.18.0` with `anchor-compat,vrf`) passes `cargo check` — `#[vrf]`/`#[vrf_callback]`/`create_request_randomness_ix_const` all resolve. No Anchor 1.x upgrade needed for code.
- [x] Install Anchor CLI 0.32.1 (via avm). NOTE: anchor 0.32.1 bundles cargo 1.84 which cannot parse edition2024 deps in current lockfiles. Fix: pre-place platform-tools v1.58 (rustc/cargo 1.95) in ~/.cache/solana/v1.58 + build with `anchor build --no-idl -- --tools-version v1.58`, then `anchor idl build -p <name> -o target/idl/<name>.json` separately (passthrough args break the idl test step). Same recipe applies to the main program.
- [x] Deploy spike to devnet: `88YCejHKiTb1psuXt7nWjvf3L36GgQ14sWNWHqNtk2Qd` (deploy sig `Myqvqn...`). Program too big on upgrade → `solana program extend <id> 20000` first.
- [x] Request path PROVEN on devnet: `initialize` + `rollDice`/`rollDicePriority` accepted by VRF program (`Idx` logged, correct 500k/800k fees to queue `Cuj97...`). Request tx e.g. `41Tromay...`.
- [x] Fulfillment BLOCKED externally (research 2026-11-27): 6 requests (regular + high-priority + fresh wallet/player) accepted but never called back over ~40 min; queue drains to 0 and other programs (battle game `Gp7wZB...` → `SettleBattle` in ~1s) DO get fulfilled. Structure 1:1 with fulfilled request. No devnet VRF outage (status API: all `vrf_oracle` Operational). Lifecycle: purgeable ~121-124s, no refund; <10ms SLA is ER-delegated-queue only. Full notes in `docs/MAGICBLOCK_INTEGRATION.md` → VRF request lifecycle. Telegram Q ready: `41Tromay...` (unfulfilled) vs `bdYPqo...` (fulfilled), queue `Cuj97...`.
- [x] GATE (compile+deploy+request): PASSED — spike builds, deploys, requests accepted. Fulfillment pending oracle-side; proceeding with retry-tolerant design.
- [x] Retry loop in spike: `retry-test.mjs` (fresh `caller_seed` per attempt, 60s timeout, `request_randomness(seed, high_priority)` + stale-seed-rejecting callback + `pending_seed/request_count/fulfilled_count` state). 5 attempts, no false fulfillment — mechanics proven, oracle silent.
- [x] Local-oracle validation PASSED: MagicSVM test green (`tests-magicsvm/tests/vrf_retry.rs`), warp delivers exactly 1 callback through the identity gate; callback body = 849 CU on devnet via `debug_settle_demo` probe. Code path proven; devnet fulfillment is ops-only.
- [ ] Ask Telegram engineers with both sigs (`41Tromay...` unfulfilled vs `bdYPqo...` fulfilled, queue `Cuj97...`)

## Phase 2 — PIR8 VRF wedge (only if Phase 1 passes)
- [ ] Add `request_weather_randomness` / `callback_weather_randomness` + seed/status/turn fields to `PirateGame`
- [ ] Use `vrf::consts` queue addresses, not hardcoded; `#[vrf]` / `#[vrf_callback]` macros
- [ ] `anchor build`, regen IDL → `public/idl/pir8_game.json`, update `src/lib/client/transactionBuilder.ts`
- [ ] Weather UI: "Seed with VRF" button + request status + Explorer links
- [ ] One devnet match loop: create → join → start → VRF seed → move/attack → complete; save signatures

## Phase 3 — Submission assets
- [ ] 60-90s video: full match + VRF Explorer clicks
- [ ] README top: program ID, what VRF does, what stays on base Solana, devnet-only
- [ ] Copy: "skill-based pirate tournaments, VRF-fair weather/tactics, Solana settlement"
- [ ] Links: repo diff, 2 Explorer txs, live URL, video
- [ ] Explicit non-goals: no full ER migration, no real-money language, no session-key = Private ER conflation

## Non-goals / risks
- No `@solana/web3.js 1.x → 3.x`, `tailwind 3→4`, `eslint 8→10`, `TS 5→7` during spike
- No ER delegation until VRF is real
- Pin `ephemeral-rollups-sdk@0.18`; 0.20 is Validator v2-only (devnet-us) + breaks `#[vrf]`
