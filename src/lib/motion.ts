/**
 * The one motion vocabulary for PIR8. See MOTION.md.
 *
 * Nothing in this codebase should inline a cubic-bezier or a duration for a
 * player-facing animation. If a value is missing, add it here deliberately and
 * update MOTION.md in the same commit.
 */

export const curves = {
  /** Anything arriving. */
  enter: 'cubic-bezier(.16, 1, .3, 1)',
  /** Anything leaving. Faster than enter, never overshoots. */
  exit: 'cubic-bezier(.4, 0, 1, 1)',
  /** Tokens being set down. The 2% overshoot is the only permitted bounce. */
  settle: 'cubic-bezier(.2, .9, .25, 1.02)',
  /** Continuous readouts, water, lantern flicker. */
  linear: 'linear',
} as const;

export type CurveName = keyof typeof curves;

/** Durations in ms. Keys mirror the timing table in MOTION.md. */
export const durations = {
  hover: 120,
  select: 160,
  move: 320,
  damage: 900,
  impact: 240,
  claim: 480,
  handoffOut: 260,
  handoffIn: 380,
  unroll: 1200,
  glide: 3400,
  instrumentFade: 600,
  flatToggle: 400,
} as const;

export type DurationName = keyof typeof durations;

/** Stagger between sequential elements. MOTION.md rule 5: 40–80ms, max 6 at once. */
export const stagger = {
  tight: 40,
  normal: 60,
  loose: 80,
  maxSequential: 6,
} as const;

/** Motion budget per player action, excluding intro sequences. */
export const ACTION_MOTION_BUDGET_MS = 400;

/** The numbered effect vocabulary. Use these names in code and review. */
export const effects = {
  RAISE: '01 RAISE',
  SET_DOWN: '02 SET-DOWN',
  UNROLL: '03 UNROLL',
  BROADSIDE: '04 BROADSIDE',
  INK: '05 INK',
  BURN_DOWN: '06 BURN-DOWN',
  FOG_ROLL: '07 FOG-ROLL',
  HANDOFF: '08 HANDOFF',
  GLIDE: '09 GLIDE',
  SOUNDING: '10 SOUNDING',
} as const;

/** CSS shorthand helper so components never hand-write a transition string. */
export function transition(
  properties: string[],
  duration: DurationName,
  curve: CurveName = 'enter',
  delayMs = 0,
): string {
  const d = `${durations[duration]}ms`;
  const delay = delayMs ? ` ${delayMs}ms` : '';
  return properties.map((p) => `${p} ${d} ${curves[curve]}${delay}`).join(', ');
}

/** Respect the user's motion preference. Callers should render resting state. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
