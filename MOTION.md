# MOTION.md — Motion Contract

Read this before adding or changing any animation in PIR8.

Companion to `DESIGN.md`. If a motion contradicts this file, change this file first.

---

## Personality: a captain's hand

Deliberate. Weighty. Small overshoot, never a bounce.
Things are placed, not popped. Charts unroll. Tokens are set down and settle.
Nothing is cute, nothing is springy, nothing wobbles for decoration.

The one place we allow theatre is the **lantern** — it is a real flame, so it
flickers. That is the only ambient loop in the product.

---

## The one clock

All motion runs on a **single animation clock**: one `requestAnimationFrame` loop
that drives the 3D scene, DOM transitions, and timers together.

- No `setInterval` for visual cleanup.
- No competing rAF loops in sibling components.
- No CSS transition racing a JS animation on the same property.
- Anything that needs a duration reads it from the timing table below, not from
  a literal written at the call site.

React state changes are *not* a clock. If a visual needs to move over time, it is
driven by the loop.

---

## Curves

Registered once, in `src/lib/motion.ts`. Never inline a cubic-bezier.

| Name | Value | Use |
|---|---|---|
| `enter` | `cubic-bezier(.16, 1, .3, 1)` | Anything arriving |
| `exit` | `cubic-bezier(.4, 0, 1, 1)` | Anything leaving |
| `settle` | `cubic-bezier(.2, .9, .25, 1.02)` | Tokens being set down (the 2% overshoot) |
| `linear` | `linear` | Continuous readouts, lantern flicker, water |

**Arrive with weight, leave clean.** Exits are always faster than entrances and
never overshoot.

---

## Timing table

| Event | Duration | Curve | Notes |
|---|---|---|---|
| Hover / focus | 120ms | `linear` | Colour and outline only |
| Token select | 160ms | `settle` | Lift 2px, ring fades in |
| Token move | 320ms | `settle` | Arc, not straight line; one hop |
| Damage number | 900ms | `enter` out | Rise + fade; never blocks input |
| Attack impact | 240ms | `exit` | Shake ≤ 6px, ≤ 3 cycles |
| Territory claim | 480ms | `settle` | Flag plants, ink spreads |
| Turn handoff out | 260ms | `exit` | |
| Turn handoff in | 380ms | `enter` | Overlaps out by 80ms, then **locks** |
| Chart unroll (intro) | 1200ms | `enter` | Once, on match start |
| Camera glide (intro) | 3400ms | `linear` | Matches the reference reveal |
| Instrument fade-in | 600ms | `enter` | Staggered 80ms, after the glide |
| Flat-view toggle | 400ms | `enter` | Camera drops to orthographic |

Motion budget per player action: **≤ 400ms**, except intro sequences. Input is
never blocked by an animation. Any input during a transition completes it instantly.

---

## Numbered vocabulary

Name effects in review and in code comments with these. Add a number when you add
an effect; never reuse one for a different motion.

| # | Name | What it is |
|---|---|---|
| 01 | `RAISE` | A token lifts toward the lantern on selection |
| 02 | `SET-DOWN` | A token is placed and settles (settle curve, 2% overshoot) |
| 03 | `UNROLL` | The chart paper opens from the centre outward |
| 04 | `BROADSIDE` | Impact: shake + flash + damage number, one beat |
| 05 | `INK` | Territory ownership spreads from the claimed cell |
| 06 | `BURN-DOWN` | The lantern wick shortens; light dims with the turn timer |
| 07 | `FOG-ROLL` | Fog drifts across hidden cells, continuous and slow |
| 08 | `HANDOFF` | Turn change: out → in, overlapping, then locked |
| 09 | `GLIDE` | Camera travel between two framings |
| 10 | `SOUNDING` | The loading line drops and reports depth (progress) |

---

## Rules

1. **Animate only `transform`, `opacity`, `clip-path`, and shader uniforms.**
   Never `width`, `height`, `top`, `left`, `background-position`, or colour.
2. **Every hover effect has a matching `:focus-visible` state.** Touch never gets
   stuck in hover.
3. **`prefers-reduced-motion`:** every element appears at its resting state. No
   splitting, no ambient loops, no camera glide, no shake. Fog holds still. The
   lantern stops flickering but keeps its brightness.
4. **Any loop longer than 5 seconds gets a pause control** — or is removed.
5. **Stagger, don't smear.** Sequential elements offset by 40–80ms, never more
   than 6 at once.
6. **One primary motion per moment.** If two things want to move, one waits.
7. **Nothing moves while the player is reading a number.** Instrument values are
   static between updates; they cross-fade, they never count up.

---

## Review checklist

Before shipping a visual change:

- [ ] Does every duration come from the timing table?
- [ ] Is every curve from `motion.ts`?
- [ ] Does it run on the single clock?
- [ ] Does keyboard focus get the same treatment as hover?
- [ ] Does it hold at resting state under `prefers-reduced-motion`?
- [ ] Is it named from the vocabulary, or does the vocabulary need a new entry?
- [ ] Does input stay live throughout?
