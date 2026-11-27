# PIR8 — Diegetic 3D Direction

Status: **design direction approved, not started.** Supersedes the "polish the dashboard" line of work.

Decision (Nov 27 2026): upgrade **modality** before polishing pixels. Chosen direction: **Full diegetic 3D**, executed as a *captain's chart table* — a top-down-ish 3D scene, not a third-person world.

Reference repos cloned read-only at `~/Dev/pir8-research/` (8 repos, shallow, no installs):

| Repo | Why it's here | What we take |
|---|---|---|
| `whatisjery/atelier-ui-codrops` | Same stack (Next 16 + R3F + Motion + Tailwind v4) | One-canvas portal architecture, DOM→texture text, `use-dom-plane`, single clock |
| `johnpolacek/museum-of-motion` | Motion system + contract | `MOTION.md` template, numbered effect vocabulary |
| `dgreenheck/tidewater` | Browser 3D game, diegetic shell | Loading screen structure, 3-register type system, HUD-as-instruments, `--tw-u` scaling |
| `wass08/under-the-sea` | Staged reveal, light hierarchy | `warm → intro → done` reveal gated on calm frames |
| `thibautlfr/ocarina` | Diegetic title screen | Title-as-a-place, input legend, `Experience` init order |
| `Noniv/web-ocean`, `Aureliengmz/clearwater` | Water surface | Glint/absorption reference for the chart sea |
| `phileeppov/glass` | Material as identity | Refraction/dispersion on UI surfaces |

---

## 1. Why the current build reads as a dashboard, not a game

Not a polish problem. A **modality** problem:

- Current: cards → borders → tabs → badges → emoji → sliders. That is a *product* modality.
- Every frontier reference is a *world*: a camera, a material, a light, a time of day, and UI that floats inside it.

Hard numbers from this repo:

- **478 emoji glyphs** used as iconography vs **6 files** that import `lucide-react`.
- `.text-neon-cyan` (`#00ffff`, `app/globals.css:8`) ≠ `neon-cyan` (`#00D9FF`, `tailwind.config.js:12`). Same token, two values.
- Two hand-written layouts (`DesktopGameLayout`, `MobileGameLayout`) that have already drifted; **two End Turn buttons render simultaneously**.
- No weather in the HUD at all, though it is a core mechanic.
- `PirateMap` renders **7×7 or 8×8 of a 10×10 map on phones** (`useMobileOptimized.ts:119-122`) — cells outside the crop are unclickable.

So: the work below is a re-architecture, not a restyle.

---

## 2. The design: "Captain's Chart Table"

A 10×10 turn-based tactics game should not be a third-person world. It should be **a chart table in a captain's cabin**:

- The board is a **physical chart** on a wooden table, lit by a lantern, seen from ~45–60° above.
- Ships are **cast pewter tokens** with heading; they nudge, slide, and tip — not 8px letters.
- Fog of war is **actual fog** rolling across the chart, plus unlit regions. It is the game's signature visual, because privacy *is* the pitch.
- The HUD is **instruments mounted on the table's edge**: compass rose (heading), brass gauge (resources), sextant (scan charges), barometer (signal leakage), and a **lantern burning down as the turn timer**.
- The lobby is **the cabin**, not a dashboard: you sit down at the table, the chart unrolls, the lantern is lit.

This keeps grid legibility (near-top-down, orthographic-ish camera), keeps the turn-based pacing, and is achievable with one table + one chart plane + ~20 token meshes + fog + one light. It is diegetic 3D at tabletop cost.

**Competitive affordance:** a `chart view` toggle (key `T`) that flattens to a clean 2D tactical overlay for ranked play and replays. Diegesis for feel, flat view for fairness. Do not skip this.

---

## 3. Architecture

### 3.1 One canvas, one clock, DOM is the source of truth

Copy Atelier UI almost verbatim (it is already our stack):

- `src/components/webgl/webgl-provider.tsx` — fixed full-screen `<Canvas frameloop="never">`, `dpr={[1,1.8]}`, `pointerEvents: none`.
- `MotionFrameloop` — Motion's `frame.postRender` drives `advance()`. **One clock** for scene, transitions, and DOM. No competing rAF loops, no `setInterval` cleanups.
- `webgl-portal.tsx` — one WebGL context; effects portal meshes in.
- `use-dom-plane.ts` — bounds measured once in document coords; per frame only subtract scroll. `autoReflow` opt-in for animated parents.

Accessibility is preserved by Atelier's trick: the 100 grid cells stay real DOM at `opacity: 0`, so `aria-label`, keyboard focus, and screen readers keep working. The 3D chart is the *picture*; the DOM is the *interface and the truth*.

```
<ChartStage>            // fixed <Canvas>, one context
  <ChartSurface/>       // table + chart plane + water shader + fog shader
  <FogLayer/>           // driven by visibility.getCoordinateIntel()
  <ShipTokens/>         // instanced, heading, bob
  <TerritoryPins/>      // ports / islands / treasure as tabletop props
  <LanternLight/>       // point light; intensity = turn timer
</ChartStage>
<GridOverlay/>          // 100 DOM cells, opacity 0, aria + hit-test + tooltips
<InstrumentHud/>        // dumb panel, narrow setter API
```

### 3.2 HUD must be a dumb instrument panel

Tidewater's HUD (`tidewater/src/ui/AppUI.js`, `UI.js`) is ~4k lines of imperative DOM with a **narrow setter API** driven by one `update(dt)`: `setMode`, `setPrompt(key, text)`, `setBoatGauges`, `setStats`. It never re-renders a tree.

PIR8 should do the same, in React:

```ts
// one tick pushes; instruments only render what they're given
hud.setTurn({ isMine, secondsLeft, playerName })
hud.setPrompt('Space', 'Fire broadside')      // ONE contextual prompt, not six buttons
hud.setResources({ gold, crew, cannons, supplies })
hud.setIntel({ scansLeft, fogPct, leakedPct })
hud.setFleet({ ships, selectedId, hp })
```

`setPrompt` is the antidote to the six competing CTAs. One action hint at a time.

### 3.3 Design tokens — one scaling unit

Adopt Tidewater's `--tw-u` pattern (`tidewater/src/ui/ui.css`):

```css
--pir8-u: clamp(1px, calc(0.7px + 0.04vmin), 1.25px);
--pir8-fs-xs: calc(10.5 * var(--pir8-u));
--pir8-3:     calc(12 * var(--pir8-u));
```

Every metric derives from it, so the HUD is proportionally correct at 720p and 1440p. Replaces `text-[10px]` / `px-2 sm:px-4` drift.

### 3.4 Three type registers

Tidewater's `index.html` loads **Inter + JetBrains Mono + Caveat Brush/Kalam** — three registers, used consistently:

| Register | Face | Used for |
|---|---|---|
| World | a hand/signage face | in-world labels: "JOE'S FISH STAND", chart annotations, log book |
| Interface | Inter (already loaded in `app/layout.tsx`) | HUD, buttons, body |
| Instrument | JetBrains Mono | numbers, coordinates, telemetry, percentages |

Kills Orbitron/JetBrains-vs-Inter ambiguity. `Orbitron` currently loads and is almost unused.

### 3.5 Reveal on readiness, not on a timer

`under-the-sea/src/main.ts:103-122` gates the reveal on **calm frames** (5 consecutive frames faster than 1/30s), not a fixed timeout:

```
warm  → compile shaders hidden, wait for calm frames (max ~4s)
intro → canvas fades in while camera glides 3.4s; UI fades in after
done  → documentElement.dataset.status = 'ready'
```

Adopt exactly. A fixed 1.5s spinner is how you get a black flash on a mid-range Android.

### 3.6 Loading screen is the key art, not a spinner

`tidewater/index.html` is the blueprint:

- `role="status" aria-live="polite"` on the loader
- key art `<img>` preloaded with `srcset`/`fetchpriority="high"` as the backdrop
- kicker / title / tagline
- status row: status text + `%` + elapsed
- bar with a **fill and a travelling glint**
- honest note about first-load shader compilation
- rotating `<kbd>` tips

PIR8 version: *"Charting the waters…"*, sounding-line progress, tips about scouting and ambush.

---

## 4. The design contract (write before any 3D code)

Two files at repo root, both read by agents before touching visuals. `museum-of-motion/MOTION.md` is the model.

**`DESIGN.md`**
- Modality statement: chart table, lantern light, no dashboard chrome
- Palette: one dominant, one accent, one warning. No neon four-way.
- Radius / border / elevation scale. One of each.
- Icon policy: Lucide only. **Emoji count target: 0 in UI.**
- Type registers + the three faces
- Contrast floor: AA at 12px. No `slate-500` on `slate-950`.

**`MOTION.md`** (adapted, not copied)
- Personality: *a captain's hand* — deliberate, weighty, small overshoot; nothing bouncy-cute
- One entrance curve, one exit curve, registered once
- Timing table (turn handoff, attack, claim, reveal)
- Numbered vocabulary so we can name effects in review: `01 RAISE`, `02 UNROLL`, `03 TACK`, `04 BROADSIDE`, `05 ROLL-IN`
- Rules: animate only `transform`/`opacity`/`clip-path`; hover has keyboard-focus parity; reduced motion shows resting state; any loop >5s gets a pause control

---

## 5. Phases

### Phase 0 — Contract + stop the bleeding (½ day, no 3D)
- [x] Write `DESIGN.md` and `MOTION.md`
- [ ] Unify cyan to one value; delete `.text-neon-cyan` duplicates in `globals.css`
- [ ] Delete 478 emoji; replace with Lucide (same set as `EmptyStateView`)
- [ ] One icon set, one radius scale, one border scale
- [ ] Fix `getGridSize()` crop — always render 10×10
- [ ] Remove duplicate End Turn (`QuickActionsBar` vs bottom bar); pick one

### Phase 1 — ChartStage vertical slice (3–5 days) ← **the de-risk step**
Goal: one screen, real game state, no new rules. If this doesn't feel better, stop.

- [x] `three` only — R3F/drei/motion deliberately not added; one canvas, raw WebGL, no new deps
- [x] `ChartSurface`: table, chart plane, ink-wash + lantern-glint shader, torn vellum edge
- [x] `FogLayer`: noise-bank shader driven by `visibility.getCoordinateIntel()` — scanned / stale / hidden
- [x] Ship tokens: 4 silhouettes, heading-from-nearest-enemy, bob, selection ring
- [x] Camera: orthographic top-down (affine-stable under the DOM hit grid; tilted orbit rejected — trapezoid can't align)
- [x] DOM grid stays the interface — canvas is picture-only, hit-test/aria/tooltips never left the DOM
- [x] Lantern as the turn timer (`turnProgress` → intensity + flicker decay)
- [x] `T` toggles flat chart view (persisted; reduced-motion defaults to flat)

**Exit criteria:** a stranger can look at the slice and read *where they can move, what they can hit, what is hidden* — and it looks like a place. (Pending a formal stranger pass before judging.)

### Phase 2 — Diegetic shell (2–3 days)
- [ ] Cabin lobby replaces `EmptyStateView` dashboard (open — owned by the UI pass)
- [x] "Charting the waters…" loader with key art + calm-frame-gated reveal (`ChartingLoader` + `useStagedIntro`; mount where the shell gates on readiness)
- [x] Staged intro sequencing table → unroll → tokens (`ChartStage glideKey` self-sequences: 03 UNROLL wipe + 02 SET-DOWN drop; parent only passes the key; instruments stay DOM-side)
- [x] Camera glide on match start (`ChartStage glideKey` — pass a fresh match id; skipped under reduced motion)

### Phase 3 — Instruments (3–4 days)
- [x] **Slice 1 — Instrument strip** (`src/components/hud/InstrumentStrip.tsx`):
      brass rail replacing both layouts' neon top bars — helm (turn state,
      lamp-lit only on your watch), decision clock with speed bonus as digits
      not hue, weather named in text with duration, six stores mono/tabular,
      turn + fleet count, practice chip, one menu button. One component for all
      widths; density stows responsively (`.p8-stow-*`), no fork. Fixed
      `.p8-label` contrast (~3.2:1 → ~5.9:1) contract-wide.
- [ ] **Slice 2 — Primary-action rail**: bottom bar rebuilt as instruments —
      End Turn the single brass lever, selected-ship readout as a plaque,
      quick-stats as instruments not emoji stacks
- [ ] Compass rose, brass gauge, sextant, barometer replace panels
- [ ] `setPrompt` single contextual action
- [ ] Turn handoff: out → in, two-phase, overlapping, **locked** (Wide's discipline)
- [ ] Attack: hit-frame feedback wired to the single clock (reuse `ScreenShake`, `DamageNumber`, `ConfettiCelebration`)

### Phase 4 — Enforcement (ongoing)
- [ ] Lint/pre-commit: no raw hex in components, no emoji in `src/components`
- [ ] Motion review checklist derived from `MOTION.md`
- [ ] Perf budget: 60fps at 1080p on integrated GPU; `dpr` cap 1.8; shader off in flat view

---

## 6. Risks and what we must not lose

| Risk | Mitigation |
|---|---|
| **Grid legibility dies in 3D** — the single biggest failure mode | Near-top-down camera, clamped orbit, `T` flat view, DOM overlay drives all hit-testing |
| Scope explodes into an art pipeline we don't have | Tokens are primitive-extruded silhouettes + one shader; no character art, no rigs |
| Mobile GPU can't hold 60fps | Chart is 1 plane + fog + ~20 instances; no post FX chain; `dpr` cap; quality tier by device |
| Turn-based feels sluggish when animated | Motion budget per action ≤ 400ms; input never blocked; skip-on-input |
| Accessibility regresses | DOM stays the source of truth; contrast floor in `DESIGN.md`; keyboard grid roving focus |
| We rebuild the HUD twice (desktop/mobile) again | One `InstrumentHud` + `--pir8-u` scaling; responsive by scale, not by fork |

**Do not lose:** the damage-preview `~N` badge (best UX decision in the current build), the rich per-cell `aria-label`, the speed-bonus tooltip, haptics, reduced-motion respect.

---

## 7. What "frontier" means here, concretely

Not "add a shader." The bar is:

1. The first frame is a **place**, not a page.
2. Loading is **narrated** and gated on machine readiness.
3. Exactly **one** primary action is offered at a time.
4. Every animation belongs to a **named, timed, documented** vocabulary.
5. The signature material (fog) is the thing people screenshot.
6. It holds 60fps on a mid-range Android.
7. It is fully operable by keyboard and screen reader.

Hit those seven and PIR8 stops looking like a Tailwind prototype with a pirate skin.
