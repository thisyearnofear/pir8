'use client';

/**
 * ChartReveal — reveal on readiness, not on a timer (MOTION.md, plan §3.5).
 *
 * Mounts its children hidden, watches rAF deltas, and fades in once the
 * machine proves it can hold calm frames (5 consecutive frames faster than
 * 1/30s, max ~4s fallback). Under `prefers-reduced-motion` everything
 * appears at resting state immediately.
 *
 * Wiring (one line, in PirateMap where <ChartStage> is mounted):
 *
 *   <ChartReveal ready={chartMode}>
 *     <ChartStage ... active={chartMode} />
 *   </ChartReveal>
 *
 * The `ready` prop re-arms the gate whenever chart mode toggles back on.
 */

import { useEffect, useRef, useState } from 'react';
import { durations, curves, prefersReducedMotion } from '@/lib/motion';

const CALM_FRAMES_REQUIRED = 5;
const CALM_FRAME_BUDGET_MS = 1000 / 30;
const MAX_WAIT_MS = 4000;

export default function ChartReveal({
  ready,
  children,
  className,
}: {
  ready: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const rafRef = useRef(0);
  const armedRef = useRef(false);

  useEffect(() => {
    if (!ready) {
      cancelAnimationFrame(rafRef.current);
      armedRef.current = false;
      setRevealed(false);
      return;
    }
    if (armedRef.current) return;
    armedRef.current = true;

    if (prefersReducedMotion()) {
      setRevealed(true);
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
        setRevealed(true);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [ready]);

  return (
    <div
      className={className}
      data-reveal={revealed ? 'ready' : 'warming'}
      style={{
        opacity: revealed ? 1 : 0,
        transition: `opacity ${durations.instrumentFade}ms ${curves.enter}`,
      }}
    >
      {children}
    </div>
  );
}
