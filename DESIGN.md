# PIR8 — Design Contract

Read this before changing anything a player can see.
If a change contradicts this file, change this file first, deliberately.

---

## 1. Modality

**PIR8 is a chart table in a captain's cabin.**

The player is not using a dashboard. They are leaning over a lit chart on a wooden
table at night, moving pewter tokens, with brass instruments at the table's edge.

That single sentence resolves most design arguments:

| Question | Answer |
|---|---|
| Does this belong? | Would a captain's cabin contain it? |
| Cards, panels, tabs? | No. Instruments, drawers, ledgers. |
| Neon glow? | No. Lantern light, ink, brass, sea. |
| Emoji? | No. Never. |
| Glassmorphism blur? | No. Vellum and patina. |

The one deliberate exception is the **flat chart view** (key `T`): a clean,
high-contrast 2D tactical overlay for ranked play, replays, and low-end devices.
Diegesis for feel; flat view for fairness. Both must be equally playable.

---

## 2. Palette

Three roles, not seven colours. Every surface is one of these or a neutral.

| Token | Value | Role |
|---|---|---|
| `--p8-ink` | `#0B1418` | The sea at night. Dominant background. |
| `--p8-deep` | `#12232B` | Raised surfaces, table felt. |
| `--p8-vellum` | `#E8DFC8` | Chart paper, primary text on dark. |
| `--p8-lamp` | `#F0B24A` | Lantern light. **The** accent. Selection, active, gold. |
| `--p8-brass` | `#9A7B3F` | Instrument housings, dividers, borders. |
| `--p8-signal` | `#4FB3A8` | Your fleet / current intel. Verdigris. |
| `--p8-threat` | `#C2453C` | Enemy, damage, danger. Oxide red. |

Rules:
- `--p8-lamp` is the only thing that glows, and only where light would actually fall.
- Nothing is pure white and nothing is pure black.
- **Hue is never the only signal.** Ownership, threat, and intel state each need a
  second channel: shape, texture, position, or a text label.
- Retire `neon-cyan` / `neon-magenta` / `neon-orange` / `neon-gold` as *brand* colours.
  They may survive only inside the flat chart view, where maximum contrast wins.

---

## 3. Type

Three registers. Three faces. No exceptions.

| Register | Face | Use |
|---|---|---|
| **World** | `IM Fell English` (or `Caveat Brush`) | In-world labels: port names, chart annotations, the log book, hand-written notes |
| **Interface** | `Inter` | HUD, buttons, body copy, anything the player operates |
| **Instrument** | `JetBrains Mono` | Numbers, coordinates, percentages, telemetry, timers |

- `Orbitron` is retired. It is loaded and almost unused; it reads as 2010s sci-fi, not 1720s sail.
- Numbers are always mono and always tabular (`font-variant-numeric: tabular-nums`),
  so a changing value never reflows its neighbours.
- Minimum readable size is **12px** at the interface register, **11px** for instrument
  labels, **10px** only for non-essential decoration.

---

## 4. Scale

One scaling unit. Every metric derives from it, so the HUD is proportionally correct
from a 720p laptop to a 1440p display without a single breakpoint.

```css
--p8-u: clamp(1px, calc(0.7px + 0.04vmin), 1.25px);
```

```css
--p8-space-1: calc(4  * var(--p8-u));
--p8-space-2: calc(8  * var(--p8-u));
--p8-space-3: calc(12 * var(--p8-u));
--p8-space-4: calc(16 * var(--p8-u));
--p8-radius:  calc(3  * var(--p8-u));   /* one radius. ships and instruments only. */
--p8-hairline: max(1px, calc(0.75 * var(--p8-u)));
```

No `text-[10px]`. No `px-2 sm:px-4` drift. If a size is needed, it comes from here.

---

## 5. Icons

- **Lucide only.** `src/components/ui/Icon.tsx` is the single entry point.
- Emoji count in UI: **0**. Emoji in *content strings* (event log copy, AI chatter)
  is a separate, lower-priority cleanup — but no emoji may act as an icon.
- Icons are `strokeWidth={1.5}` at the interface register, `2` at instrument scale.
- An icon never appears without either a text label or an `aria-label`.

---

## 6. Elevation and borders

Two elevations. That's it.

| Level | Treatment |
|---|---|
| Table (base) | `--p8-ink`, no border, no shadow |
| Instrument (raised) | `--p8-deep`, `1px solid color-mix(in srgb, var(--p8-brass) 35%, transparent)`, `0 2px 8px rgba(0,0,0,.45)` |

No glass blur. No `backdrop-filter`. No 5-stop gradients. No glowing borders on
containers — light comes from the lantern, not from the box.

---

## 7. Contrast floor

- Body text ≥ **4.5:1**. Large text and instrument numerals ≥ **3:1**.
- `slate-500` on `slate-950` (≈4.0:1 at 12px) is **not allowed**.
- Every interactive element has a visible `:focus-visible` ring in `--p8-lamp`.
- Every state conveyed by colour is also conveyed by shape, texture, or text.

---

## 8. The seven things "finished" means

1. The first frame is a **place**, not a page.
2. Loading is **narrated** and gated on machine readiness, not a fixed timer.
3. Exactly **one** primary action is offered at a time.
4. Every animation belongs to a **named, timed, documented** vocabulary (`MOTION.md`).
5. The signature material — fog on water — is the thing people screenshot.
6. It holds 60fps at 1080p on integrated graphics.
7. It is fully operable by keyboard and screen reader.

---

## 9. Banned

`emoji-as-icon` · `backdrop-blur` · `neon` glows · `Orbitron` ·
`text-[10px]` · `slate-500` on dark · per-component hex colours ·
desktop/mobile layout forks · a second End Turn button · fake live data without a
visible `DEMO` marker.
