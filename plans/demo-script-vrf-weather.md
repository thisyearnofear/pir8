# Demo script — VRF weather loop (Blitz)

Total: ~2 minutes. Devnet, game authority wallet connected.

## Setup (before recording)

- `NEXT_PUBLIC_ENABLE_WEATHER_DEBUG=true` in `.env.local`, restart dev server.
- Open the game as the **authority** (only the authority can request/settle).

## Beat 1 — The problem (15s)

> "PIR8 turns need fair, unpredictable weather — but on-chain randomness
> can't come from a slot hash players can game. We use MagicBlock's VRF
> oracle: unpredictable, verifiable, delivered by callback."

## Beat 2 — Request (30s)

1. Open a game, point at the 🌊 WEATHER panel: "No weather request yet."
2. Click **"Call for wind"**. Narrate: "The game authority requests
   randomness with a fresh seed. The VRF program accepted it on-chain —
   that part is live on devnet right now."
3. Show the pending state: "Awaiting oracle… attempt 1." Explain retries
   supersede cleanly (stale callbacks are ignored on-chain).

## Beat 3 — Settle (45s)

> "The shared devnet oracle is quiet under Blitz load, so for the demo we
> settle exactly as the oracle callback would — same code path, same state
> transitions."

1. Click **🧪 storm**. Weather flips to Storm, 4 turns.
2. Make a move / show the storm modifier in the UI (slower movement,
   combat effects per `lib/engine/weather.ts`).
3. Optional second take: request again, settle **🧪 fog**, show the
   visibility change; or **🧪 calm** for contrast.

## Beat 4 — The close (15s)

> "Request path is proven on devnet, callback mechanics proven in-process,
> client loop is live. When the oracle answers, no code changes — the
> pending state just resolves itself."

## Fallbacks

- **No fulfillment during a live take:** expected — the pending UI *is*
  the honest state. Cut to a pre-settled take.
- **Devnet hiccup:** the whole flow also runs against the MagicSVM test
  (`tests-magicsvm`); don't demo that on video, just know the code path
  is covered.
- **Wallet drained:** game creation costs ~0.05 SOL rent; keep the demo
  wallet above 0.2 SOL. Faucet via `solana airdrop` or transfer from the
  funded deploy wallet.

## Don't show

- `debug_settle_weather` as anything but a demo stand-in. If scoring or
  competition is involved, it must be removed first.
