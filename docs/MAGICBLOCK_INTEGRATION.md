# MagicBlock Integration Plan

**Status:** PIR8 integrates VRF weather in its game program (devnet `2TZwkCc8ffz7NGWYF3koXyRm75DHq9VL9kvHxXZu8kLy`): `request_weather_randomness` / `callback_weather_randomness` plus a per-game `WeatherState` PDA (`pending_seed`/`request_count`/`fulfilled_count`, stale callbacks ignored). Proven 2026-11-27 end-to-end on devnet: game created, 3 sequential requests accepted on-chain (`2zeXTHpa…`, `4K8Q2SX…`, `ckyZGnt…`), retry state advancing, no false fulfillment — live fulfillment now depends only on the shared devnet oracle (silent at time of writing). Client loop is fully wired (`WeatherControl` widget + store actions) and demoable without the oracle via the authority-only `debug_settle_weather` instruction (game 8840044 settled to fog/2 turns on devnet; remove before competitive use). The pattern was first proven in the isolated spike (`spikes/vrf-compat-check`, devnet program `88YCejHKiTb1psuXt7nWjvf3L36GgQ14sWNWHqNtk2Qd`): Anchor 0.32.1 + `ephemeral-rollups-sdk@0.18` builds, requests are accepted on devnet with correct fees, MagicSVM delivers the callback in-process, and the callback body simulates at 849 CU. Shared-oracle fulfillment on devnet is the remaining ops question; see [VRF request lifecycle](#vrf-request-lifecycle-researched-2026-11-27) and `plans/blitz-vrf-spike-plan.md`.

Last reviewed: 2026-11-27

## Why PIR8 fits Entertainment Finance

PIR8 already has the core Entertainment Finance shape:

- skill-based competitive play rather than pure chance;
- entry fees, prize pools, and tournament economics;
- persistent resources, territory control, and fleet progression;
- weather, reefs, whirlpools, and combat variance that can use verifiable randomness;
- session-key delegation and privacy-themed hidden-information gameplay;
- challenge, spectator, replay, and leaderboard surfaces that make matches shareable.

The important constraint is that MagicBlock must be load-bearing. A superficial “VRF added” note is not a strong integration.

## Recommended first milestone: VRF weather and hazard seed

The smallest meaningful integration is to make weather, hazard, or map-generation randomness provably fair. This is not cosmetic: the current Anchor code derives map-generation entropy from clock/slot/game metadata, which is acceptable for a devnet prototype but not a strong verifiable-randomness design.

### Player-visible loop

1. A match is created, started, or reaches its first weather phase.
2. The program requests randomness through MagicBlock VRF.
3. The VRF callback writes a map/weather seed or outcome to the game account.
4. The frontend derives and displays the map, weather, or hazard result from that committed seed.
5. The demo links the request and callback transactions in Solana Explorer.

### Why this is the best first wedge

- It is small enough to implement without redesigning the whole game.
- Randomness is already part of the game design.
- It gives judges a simple, verifiable transaction trail.
- It does not require changing prize settlement or the full match state machine.

### Implementation notes

- Add a request instruction such as `request_weather_randomness` and a callback instruction such as `callback_weather_randomness`.
- Store enough information on the game account to make the result auditable: randomness seed or derived outcome, request status, and the match/turn it applies to.
- Use the oracle queue constant appropriate to the execution environment instead of hardcoding queue addresses.
- Follow the current MagicBlock VRF quickstart and examples rather than older blog posts.
- Verify compatibility before committing to implementation: PIR8 currently uses Anchor `0.32.1`, while the current MagicBlock quickstart documents newer toolchain versions and warns that Ephemeral Rollups SDK `0.18.x` and `0.20.x` target different validator lines. Proven 2026-11-27: Anchor 0.32.1 + `ephemeral-rollups-sdk@0.18.0` with features `anchor-compat,vrf` compiles, builds to BPF, and produces accepted devnet VRF requests — no Anchor upgrade needed for code. Build quirk: Anchor 0.32.1's bundled cargo 1.84 cannot parse edition2024 deps in current lockfiles; pre-place platform-tools v1.58 and build with `anchor build --no-idl -- --tools-version v1.58`, then `anchor idl build` separately.

### VRF request lifecycle (researched 2026-11-27)

Sources: MagicBlock status API (`vrf_oracle` Operational on all devnet regions, no outage reported Nov 2026), `solana-vrf` repo, fellow Blitz builder BlitzMine, production precedent (Jungle Fun: 1,028 VRF pulls on launch day on the same base queue).

- **Request acceptance ≠ fulfillment.** The oracle picks up requests on its own schedule; acceptance only means the fee was paid and the request entered the queue.
- **Requests expire.** A base-layer request becomes purgeable ~121–124s after creation (TTL 120s, timestamps stored in 4s units). Purged requests are **not refunded**, but can still be fulfilled until the purge runs.
- **Observed devnet behavior (spike `88YCejHK...`, queue `Cuj97...`):** 6 requests (regular + high-priority + fresh wallet) accepted with correct fees but never called back over ~40 min, while another program's callback fulfilled in ~1s in the same window and the queue drained to 0 with expiries. Conclusion: oracle serving selectively under Blitz-week load; client must assume starvation is possible.
- **Required client design:**
  - state machine `idle → requested(request identity/nonce) → fulfilled`, plus explicit timeout (`requested_at` + ~60s) and retry/cancel path;
  - fresh `caller_seed` per attempt; record the current request as the only fulfillable one;
  - callback binds effects to the expected request identity (match stored seed/nonce), rejects superseded requests, and is idempotent (duplicate callbacks must not settle twice);
  - UI exposes `randomness pending` as a first-class state, never a final result.
- **Fast path is inside ER.** Sub-10ms, fee-exempt fulfillment applies to the *delegated* queue (`DEFAULT_EPHEMERAL_QUEUE`) when requesting from inside an Ephemeral Rollup. Base-layer callbacks take seconds when healthy. BlitzMine's proven pattern: delegate the whole game session, request VRF from inside the ER, backend retries/cancels timed-out rounds, commits back to Solana.
- **Local validation decouples code from devnet ops:** proven 2026-11-27 in `spikes/vrf-compat-check`: (1) devnet request accepted by the real VRF program with correct fees; (2) MagicSVM `warp_to_slot` delivers exactly one callback through the `#[vrf_callback]` identity gate (`cargo +stable test --test vrf_retry` passes); (3) the identical callback body simulates at **849 CU on devnet** (`cu-probe.mjs` + `debug_settle_demo` probe instruction), comfortably inside any fulfillment budget. The 197k CU burn seen under MagicSVM is a simulator metering artifact, not program cost. The only unproven link is the shared devnet oracle choosing to fulfill a given request — an ops question, not a code question.

## Deeper milestone: Ephemeral Rollup match sessions

The stronger technical integration is to delegate active match state to an Ephemeral Rollup session.

### Proposed boundary

Delegate only active gameplay state:

- ship positions and health;
- turn state;
- scan/fog/visibility state;
- weather state;
- in-match resource state.

Keep base-layer Solana responsible for durable value and identity:

- entry-fee escrow and prize settlement;
- winner determination and claim records;
- captain/reputation records;
- final committed match result.

### Player-visible loop

1. Players enter a devnet match normally.
2. When the match starts, the active game account is delegated to an ER session.
3. Moves, attacks, scans, and claims execute as gasless/low-friction session actions.
4. The UI shows a clear “real-time session active” state.
5. At match end, the final state is committed and undelegated back to Solana.
6. Prize settlement remains on base-layer Solana.

### Why this is harder

PIR8 is turn-based, so the pitch should not be “we need 10ms block times.” The honest pitch is:

- gasless in-match actions;
- fast session updates;
- fewer wallet interruptions;
- better spectator responsiveness;
- a clean commit boundary for verifiable settlement.

This integration touches the program account model, instruction routing, frontend transaction flow, session lifecycle, and error recovery. It should not be attempted as a same-day bolt-on unless the existing program already compiles cleanly with the MagicBlock SDK.

## Time-boxed hackathon scope

For a short hackathon window, do not attempt the full Ephemeral Rollup migration first. Use this order:

1. restore/build the existing Anchor program and prove the current devnet flow still works;
2. implement the VRF weather milestone only;
3. surface the resulting transaction proof in the match UI;
4. record one complete devnet match loop;
5. mention ER match sessions as future work only if the VRF integration is real.

A practical hard gate is useful: if the MagicBlock SDK does not compile against the existing program quickly, stop rather than weakening the project with a cosmetic or fake integration.

Likely implementation touchpoints:

- `programs/pir8-game` for request/callback instructions and game-account fields;
- `public/idl/pir8_game.json` and generated types after rebuild;
- `src/lib/client/transactionBuilder.ts` for the request transaction;
- weather/hazard UI components for proof display;
- tests or scripts that produce explorer-verifiable devnet transactions.

## Demo evidence checklist

A credible hackathon or ecosystem demo should include:

- canonical program ID: `2TZwkCc8ffz7NGWYF3koXyRm75DHq9VL9kvHxXZu8kLy`;
- public repository with the integration visible in the program diff;
- Solana Explorer links for the VRF request transactions (`2zeXTHpa…`, `4K8Q2SX…`, `ckyZGnt…`) — callback fulfillment pending the shared devnet oracle;
- the dev-settle proof (game 8840044 → fog/2 turns/fulfilled=1) with the dev-only caveat stated on the record;
- a short video showing one complete match loop (see `plans/demo-script-vrf-weather.md`);
- an honest architecture note separating implemented features from design;
- devnet/test-token framing only.

## Product positioning

Use positioning along these lines, then rewrite it in the team’s own words for any submission:

> PIR8 is a skill-based pirate tournament game where players compete in transparent stake-backed matches. MagicBlock VRF drives the weather loop (request path live on devnet; oracle fulfillment pending), and Ephemeral Rollups can later make in-match actions fast and gasless. Final settlement remains anchored to Solana.

Present VRF weather as implemented-with-oracle-pending, ER match sessions as designed-only.

## Risk notes

- Keep all hackathon demonstrations on devnet with test value.
- Avoid real-money gambling language; emphasize skill-based competition and test prizes.
- Session-key privacy and MagicBlock privacy/ER features are separate concepts. Do not conflate them.
- If SDK or Anchor version compatibility cannot be resolved quickly, it is better to skip a rushed submission than ship a non-working integration.

## References

- [Ephemeral Rollups quickstart](https://docs.magicblock.gg/pages/ephemeral-rollups-ers/how-to-guide/quickstart)
- [MagicBlock VRF quickstart](https://docs.magicblock.gg/pages/verifiable-randomness-functions-vrfs/how-to-guide/quickstart)
- [MagicBlock examples](https://github.com/magicblock-labs/magicblock-engine-examples)
- [MagicBlock AI dev skill](https://github.com/magicblock-labs/magicblock-dev-skill)
