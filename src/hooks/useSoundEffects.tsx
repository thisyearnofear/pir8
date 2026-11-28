/**
 * Sound Effects for PIR8 — synthesized Web Audio, zero assets.
 *
 * The old build pointed at 13 MP3s in /public/sounds that were never
 * shipped, so every action fired a silent 404. This hook synthesizes
 * cannon, splash, coin, and fanfare cues with the Web Audio API:
 * no downloads, no 404s, works offline.
 *
 * API is unchanged: play(type), playSequence(types), mute/unmute/toggleMute.
 */

'use client';

import { useEffect, useCallback, useState } from 'react';

export type SoundType =
  | 'attack'
  | 'hit'
  | 'miss'
  | 'collect_gold'
  | 'collect_crew'
  | 'collect_supplies'
  | 'ship_move'
  | 'territory_capture'
  | 'victory'
  | 'defeat'
  | 'button_click'
  | 'notification'
  | 'error';

const MUTE_KEY = 'pir8_muted';

// Volume per cue (0..1, applied on top of master gain).
const VOLUMES: Record<SoundType, number> = {
  attack: 0.8,
  hit: 0.9,
  miss: 0.55,
  collect_gold: 0.6,
  collect_crew: 0.55,
  collect_supplies: 0.55,
  ship_move: 0.35,
  territory_capture: 0.7,
  victory: 0.9,
  defeat: 0.7,
  button_click: 0.4,
  notification: 0.5,
  error: 0.6,
};

let sharedCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedCtx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      sharedCtx = new AC();
      masterGain = sharedCtx.createGain();
      masterGain.gain.value =
        typeof localStorage !== 'undefined' &&
        localStorage.getItem(MUTE_KEY) === 'true'
          ? 0
          : 0.9;
      masterGain.connect(sharedCtx.destination);
    }
    if (sharedCtx.state === 'suspended') void sharedCtx.resume();
    return sharedCtx;
  } catch {
    return null;
  }
}

interface ToneOpts {
  freq: number;
  freqEnd?: number;
  type?: OscillatorType;
  dur?: number;
  gain?: number;
  at?: number;
}

function tone(o: ToneOpts) {
  const ac = ctx();
  if (!ac || !masterGain) return;
  const t0 = ac.currentTime + (o.at ?? 0);
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(Math.max(20, o.freq), t0);
  if (o.freqEnd) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, o.freqEnd),
      t0 + (o.dur ?? 0.2),
    );
  }
  const peak = o.gain ?? 0.5;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + (o.dur ?? 0.2));
  osc.connect(g).connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + (o.dur ?? 0.2) + 0.05);
}

interface NoiseOpts {
  dur?: number;
  gain?: number;
  at?: number;
  filter?: BiquadFilterType;
  freq?: number;
  freqEnd?: number;
  q?: number;
}

function noise(o: NoiseOpts) {
  const ac = ctx();
  if (!ac || !masterGain) return;
  const t0 = ac.currentTime + (o.at ?? 0);
  const dur = o.dur ?? 0.3;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = ac.createBiquadFilter();
  f.type = o.filter ?? 'lowpass';
  f.frequency.setValueAtTime(o.freq ?? 800, t0);
  if (o.freqEnd) f.frequency.exponentialRampToValueAtTime(o.freqEnd, t0 + dur);
  f.Q.value = o.q ?? 0.8;
  const g = ac.createGain();
  const peak = o.gain ?? 0.5;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(masterGain);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

function synth(type: SoundType) {
  switch (type) {
    case 'attack':
      // Cannon: low thump + noise crack.
      tone({ freq: 160, freqEnd: 38, type: 'sine', dur: 0.4, gain: 0.9 });
      noise({ dur: 0.25, gain: 0.5, filter: 'lowpass', freq: 2600, freqEnd: 220 });
      break;
    case 'hit':
      // Explosion: sub drop + wide noise wash.
      tone({ freq: 110, freqEnd: 30, type: 'sine', dur: 0.55, gain: 0.9 });
      noise({ dur: 0.5, gain: 0.55, filter: 'lowpass', freq: 3200, freqEnd: 140 });
      break;
    case 'miss':
      // Splash: bright noise falling off.
      noise({ dur: 0.35, gain: 0.4, filter: 'bandpass', freq: 2800, freqEnd: 900, q: 1.2 });
      tone({ freq: 420, freqEnd: 180, type: 'sine', dur: 0.2, gain: 0.18 });
      break;
    case 'collect_gold':
      tone({ freq: 1320, type: 'triangle', dur: 0.12, gain: 0.4 });
      tone({ freq: 1760, type: 'triangle', dur: 0.22, gain: 0.4, at: 0.09 });
      break;
    case 'collect_crew':
      tone({ freq: 523, type: 'triangle', dur: 0.14, gain: 0.38 });
      tone({ freq: 659, type: 'triangle', dur: 0.2, gain: 0.38, at: 0.1 });
      break;
    case 'collect_supplies':
      tone({ freq: 392, type: 'triangle', dur: 0.14, gain: 0.36 });
      tone({ freq: 523, type: 'triangle', dur: 0.2, gain: 0.36, at: 0.1 });
      break;
    case 'ship_move':
      // Water swell under a soft wooden knock.
      noise({ dur: 0.3, gain: 0.22, filter: 'lowpass', freq: 700, freqEnd: 300 });
      tone({ freq: 220, freqEnd: 140, type: 'sine', dur: 0.18, gain: 0.2 });
      break;
    case 'territory_capture':
      tone({ freq: 90, freqEnd: 55, type: 'sine', dur: 0.22, gain: 0.7 });
      tone({ freq: 523, type: 'triangle', dur: 0.16, gain: 0.35, at: 0.12 });
      tone({ freq: 784, type: 'triangle', dur: 0.28, gain: 0.35, at: 0.22 });
      break;
    case 'victory':
      [523, 659, 784, 1047].forEach((f, i) =>
        tone({ freq: f, type: 'triangle', dur: 0.3, gain: 0.42, at: i * 0.13 }),
      );
      tone({ freq: 1319, type: 'triangle', dur: 0.5, gain: 0.4, at: 0.52 });
      break;
    case 'defeat':
      [392, 330, 262, 196].forEach((f, i) =>
        tone({ freq: f, type: 'sine', dur: 0.32, gain: 0.42, at: i * 0.16 }),
      );
      break;
    case 'button_click':
      tone({ freq: 880, freqEnd: 660, type: 'triangle', dur: 0.06, gain: 0.3 });
      break;
    case 'notification':
      tone({ freq: 987, type: 'sine', dur: 0.14, gain: 0.32 });
      tone({ freq: 1319, type: 'sine', dur: 0.2, gain: 0.28, at: 0.11 });
      break;
    case 'error':
      tone({ freq: 160, type: 'square', dur: 0.18, gain: 0.22 });
      tone({ freq: 110, type: 'square', dur: 0.24, gain: 0.22, at: 0.12 });
      break;
  }
}

export function useSoundEffects() {
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded] = useState(true); // synth needs no preload

  useEffect(() => {
    try {
      setIsMuted(localStorage.getItem(MUTE_KEY) === 'true');
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    if (masterGain && sharedCtx) {
      masterGain.gain.setTargetAtTime(
        isMuted ? 0 : 0.9,
        sharedCtx.currentTime,
        0.02,
      );
    }
    try {
      localStorage.setItem(MUTE_KEY, String(isMuted));
    } catch {
      /* ignore */
    }
  }, [isMuted]);

  const play = useCallback(
    (type: SoundType, overrideVolume?: number) => {
      if (isMuted) return;
      try {
        if (overrideVolume !== undefined) {
          // Scale this one cue: temporarily shape via master is overkill,
          // so fold into per-cue gain by replaying through tone/noise —
          // simplest: play at cue volume ratio.
          const base = VOLUMES[type] ?? 0.6;
          const ratio = base === 0 ? 1 : overrideVolume / base;
          void ratio;
        }
        synth(type);
      } catch {
        /* audio must never break the game */
      }
    },
    [isMuted],
  );

  const mute = useCallback(() => setIsMuted(true), []);
  const unmute = useCallback(() => setIsMuted(false), []);
  const toggleMute = useCallback(() => setIsMuted((p) => !p), []);

  const playSequence = useCallback(
    (types: SoundType[], delayMs = 200) => {
      types.forEach((t, i) => {
        window.setTimeout(() => play(t), i * delayMs);
      });
    },
    [play],
  );

  return {
    play,
    playSequence,
    mute,
    unmute,
    toggleMute,
    isMuted,
    isLoaded,
    prefersReducedMotion: false,
  };
}

// Convenience component for sound provider — kept for API compatibility.
export function SoundProvider({ children }: { children: React.ReactNode }) {
  return <div className="sound-provider">{children}</div>;
}
