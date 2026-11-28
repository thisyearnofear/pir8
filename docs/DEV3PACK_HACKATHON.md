# Dev3pack Global Hackathon — working note

**Status:** candidate entry, assessed 2026-11-28. This is a time-boxed submission note, not durable product strategy. The durable product direction stays in [VISION.md](./VISION.md); this page only records what must be true for a Dev3pack submission.

## Event facts

Verified from the Dev3pack dashboard/email on 2026-11-28:

- Build window: **27–29 Nov 2026**.
- Submission cutoff: **29 Nov 2026, 07:00 UTC**.
- Closing ceremony / winners: **29 Nov 2026, 15:00 UTC**.
- Required submission assets: public GitHub repository, live project URL, and a demo video of **3 minutes maximum**.
- Open source is mandatory.
- Prior work is allowed when the project is Solana-related **and at least one feature is added during the hackathon**.
- Every project competes in the main Solana track by default. Partner tracks should only be claimed when the sponsor technology is actually used.
- Relevant prize context: the main Solana award is a **$5,000 prize split**; Byte gaming is **$500**. Credit/perk awards should not be treated as cash.

## Fit

PIR8 is naturally a Main Solana gaming candidate. Additional tracks are conditional:

| Track | Honest position |
|---|---|
| **Byte gaming** | Only claim if a real Byte-compatible game API ships inside the window. Byte is not a generic gaming badge: the public spec expects public HTTPS endpoints, complete JSON state in responses, discrete enumerable moves, a one-call game start with run/session credentials, and an explicit terminal state. Reference: `https://app.bytearena.fun/api/game-spec`. |
| **Solana Mobile** | Only claim if the mobile app is part of the working demo. Mobile dependencies alone do not qualify. |
| **Main Solana** | The core fit: an on-chain/devnet game with session keys, match state, VRF weather work, challenges, spectators, and replays. |
| **Pollar / Firecrawl / ElevenLabs / Supabase** | Do not claim unless a real integration is added. They are not native to the current product. |

## Current readiness, checked 2026-11-28 (updated in-window)

- Live app: **https://pir8app.netlify.app/** returns HTTP 200.
- Repository: public at `github.com/thisyearnofear/pir8`.
- Canonical devnet program: `2TZwkCc8ffz7NGWYF3koXyRm75DHq9VL9kvHxXZu8kLy`.
- The previous README deployment link to `pir8.vercel.app` was stale and has been corrected.
- No Dev3pack-length demo video was found in the repository.
- Byte-compatible practice-skirmish API implemented in-window (needs deploy proof): `POST /api/byte/start`, `GET /api/byte/state?runId=`, `POST /api/byte/action`, plus read-only spectator `/watch/[runId]` and upload doc `docs/BYTE_MANIFEST.md`.
- The mobile wallet adapter fallback now uses `https://pir8app.netlify.app` (fixed in-window).

## Submission gate

PIR8 should only be submitted if all of these are true before the cutoff:

- [ ] The Netlify deployment loads and the primary game loop is usable by a judge.
- [ ] One feature is demonstrably added after the hackathon start.
- [ ] The demo video is under 3 minutes and shows real gameplay plus honest Solana/devnet evidence.
- [ ] The README gives a judge a direct live URL, setup-free path, and program/verification details.
- [ ] If Byte is claimed, the Byte-compatible API is deployed publicly and proven: start → state → action → completed plus `/watch/[runId]` embeds under `frame-ancestors https://app.bytearena.fun`. Manifest: `docs/BYTE_MANIFEST.md`.
- [ ] No mock transaction success paths are used in the demo.

## Recommended in-window scope

The highest-value feature is a **Byte-compatible practice-skirmish API** if it can be proven quickly:

1. Start a practice run in one public call.
2. Return complete game state as JSON after every action.
3. Expose a finite action list.
4. Accept one discrete action per call.
5. Return an explicit terminal state.

That is a real feature, not a label, because it makes PIR8 machine-playable and spectator/agent-friendly. If the API cannot be proven in a short spike, the fallback should be a smaller product repair: make the live practice/challenge loop reliable enough to record, with a visible devnet transaction and a concise judge path.

## Not doing

- No mainnet value flow for the submission.
- No superficial sponsor integrations.
- No claim that MagicBlock Ephemeral Rollups are implemented; VRF weather status remains exactly as documented in [MAGICBLOCK_INTEGRATION.md](./MAGICBLOCK_INTEGRATION.md).
- No gaming/prize claims beyond what the current devnet implementation can demonstrate.
