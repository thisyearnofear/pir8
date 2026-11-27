'use client';

/**
 * ChartingLoader — "Charting the waters…" (plan §3.6, MOTION.md 10 SOUNDING).
 *
 * The loader is key art + an honest note, not a spinner:
 * - role="status" aria-live="polite", real <progress> semantics
 * - sounding-line progress bar with a travelling glint (uniforms-free CSS)
 * - rotating <kbd> tips about scouting and ambush
 * - reduced motion: static bar, no glint, tips still rotate (text change only)
 *
 * It is a dumb instrument: the parent owns readiness and passes
 * `progress` (0..1) + `status` text. Dismissal is the parent's job —
 * pair with useStagedIntro so the fade-out lands on calm frames.
 *
 * Wiring (one block, wherever the shell gates on readiness):
 *
 *   {phase !== 'done' && (
 *     <ChartingLoader progress={progress} status={statusText} />
 *   )}
 */

import { useEffect, useState } from 'react';
import { curves, prefersReducedMotion } from '@/lib/motion';

const TIPS = [
  'Scout before you sail — fog hides whole fleets',
  'Storms slow every hull but hide your approach',
  'An ambush bonus rewards the patient captain',
  'Stale charts lie — re-scan before you commit',
  'The lantern burns with your turn timer',
] as const;

const TIP_INTERVAL_MS = 4200;

export default function ChartingLoader({
  progress,
  status,
}: {
  /** 0..1 sounding depth. Clamped. */
  progress: number;
  /** Short honest line, e.g. "Compiling shaders…". */
  status: string;
}) {
  const [tipIndex, setTipIndex] = useState(0);
  const [reduced] = useState(() =>
    typeof window === 'undefined' ? false : prefersReducedMotion(),
  );

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(
      () => setTipIndex((i) => (i + 1) % TIPS.length),
      TIP_INTERVAL_MS,
    );
    return () => clearInterval(t);
  }, [reduced]);

  const pct = Math.max(0, Math.min(1, progress));
  const pctLabel = `${Math.round(pct * 100)}%`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Loading: ${status}, ${pctLabel}`}
      className="charting-loader"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'calc(12 * var(--p8-u, 1px))',
        background: 'var(--p8-ink, #0B1418)',
        zIndex: 10,
      }}
    >
      {/* Key art: the sealed order, not a spinner. */}
      <div
        aria-hidden="true"
        style={{
          width: 'calc(64 * var(--p8-u, 1px))',
          height: 'calc(64 * var(--p8-u, 1px))',
          borderRadius: '50%',
          border: '1px solid var(--p8-brass, #9A7B3F)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'calc(28 * var(--p8-u, 1px))',
          color: 'var(--p8-lamp, #F0B24A)',
        }}
      >
        {/* Lucide-only rule applies to shipped UI; this glyph is the wax seal. */}
        <span>◈</span>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 'calc(11 * var(--p8-u, 1px))',
            letterSpacing: '0.22em',
            color: 'var(--p8-brass, #9A7B3F)',
          }}
        >
          PIR8
        </div>
        <h2
          style={{
            margin: 'calc(4 * var(--p8-u, 1px)) 0 0',
            fontSize: 'calc(20 * var(--p8-u, 1px))',
            color: 'var(--p8-vellum, #E8DFC8)',
            fontWeight: 600,
          }}
        >
          Charting the waters…
        </h2>
        <p
          style={{
            margin: 'calc(4 * var(--p8-u, 1px)) 0 0',
            fontSize: 'calc(11 * var(--p8-u, 1px))',
            color: 'var(--p8-vellum, #E8DFC8)',
            opacity: 0.65,
          }}
        >
          First load compiles shaders — about a minute on older phones.
        </p>
      </div>

      {/* Sounding line: status + depth + elapsed feel, one honest bar. */}
      <div style={{ width: 'min(72%, calc(300 * var(--p8-u, 1px)))' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 'calc(11 * var(--p8-u, 1px))',
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--p8-vellum, #E8DFC8)',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          <span>{status}</span>
          <span aria-hidden="true">{pctLabel}</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={Math.round(pct * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Loading progress"
          style={{
            position: 'relative',
            marginTop: 'calc(6 * var(--p8-u, 1px))',
            height: 'calc(6 * var(--p8-u, 1px))',
            borderRadius: 'calc(3 * var(--p8-u, 1px))',
            background: 'color-mix(in srgb, var(--p8-brass, #9A7B3F) 25%, transparent)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct * 100}%`,
              height: '100%',
              borderRadius: 'inherit',
              background: 'var(--p8-lamp, #F0B24A)',
              transition: reduced
                ? undefined
                : `width 300ms ${curves.linear}`,
            }}
          />
          {!reduced && pct > 0 && pct < 1 && (
            <div
              aria-hidden="true"
              className="charting-loader-glint"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '30%',
              }}
            />
          )}
        </div>
      </div>

      <p
        style={{
          fontSize: 'calc(11 * var(--p8-u, 1px))',
          color: 'var(--p8-vellum, #E8DFC8)',
          opacity: 0.6,
          minHeight: 'calc(16 * var(--p8-u, 1px))',
        }}
      >
        Tip: <kbd>{TIPS[tipIndex]}</kbd>
      </p>

      <style>{`
        .charting-loader-glint {
          background: linear-gradient(100deg, transparent, rgba(232,223,200,.55), transparent);
          animation: charting-glint 1.6s ${curves.linear} infinite;
        }
        @keyframes charting-glint {
          from { left: -30%; }
          to { left: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .charting-loader-glint { display: none; }
        }
      `}</style>
    </div>
  );
}
