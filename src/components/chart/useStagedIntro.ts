'use client';

/**
 * useStagedIntro — warm → intro → done (MOTION.md 03 UNROLL, 09 GLIDE).
 *
 * The parent drives readiness however it wants (shader compile, data load,
 * font race); this hook only owns the *gating*: once `signalReady()` fires,
 * it waits for calm frames (5 consecutive rAF deltas under 1/30s, 4s max),
 * then advances warm → intro, holds the intro beat, then done.
 *
 * Reduced motion collapses straight to done — the staged sequence is
 * theatre, and theatre is optional.
 *
 * Wiring:
 *
 *   const intro = useStagedIntro({ introHoldMs: 1400 });
 *   // when everything is loaded: intro.signalReady();
 *   {intro.phase !== 'done' && (
 *     <ChartingLoader progress={loadProgress} status={loadStatus} />
 *   )}
 *   <ChartStage introGlide={intro.phase === 'intro'} ... />
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '@/lib/motion';

export type IntroPhase = 'warm' | 'intro' | 'done';

const CALM_FRAMES_REQUIRED = 5;
const CALM_FRAME_BUDGET_MS = 1000 / 30;
const MAX_WAIT_MS = 4000;

export default function useStagedIntro({
  introHoldMs = 1400,
}: {
  /** How long the intro beat holds before done. Resting state wins under reduced motion. */
  introHoldMs?: number;
} = {}) {
  const [phase, setPhase] = useState<IntroPhase>('warm');
  const [signalled, setSignalled] = useState(false);
  const rafRef = useRef(0);
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const signalReady = useCallback(() => setSignalled(true), []);

  useEffect(() => {
    if (!signalled) return;
    if (prefersReducedMotion()) {
      setPhase('done');
      return;
    }
    let calm = 0;
    let last = performance.now();
    const started = last;
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      calm = dt <= CALM_FRAME_BUDGET_MS ? calm + 1 : 0;
      if (calm >= CALM_FRAMES_REQUIRED || now - started >= MAX_WAIT_MS) {
        setPhase('intro');
        holdRef.current = setTimeout(() => setPhase('done'), introHoldMs);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (holdRef.current) clearTimeout(holdRef.current);
    };
  }, [signalled, introHoldMs]);

  return { phase, signalReady };
}
