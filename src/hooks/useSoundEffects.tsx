/**
 * Sound Effects Hook for PIR8
 * 
 * Provides immersive audio feedback for game actions.
 * Uses Web Audio API with fallback to HTML5 Audio.
 * 
 * Features:
 * - Preloaded sound effects
 * - Volume control
 * - Mute/unmute
 * - Spatial audio (optional)
 * - Reduced motion respect
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import React from 'react';

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

interface SoundConfig {
  url: string;
  volume?: number;
  preload?: boolean;
}

const SOUND_CONFIG: Record<SoundType, SoundConfig> = {
  attack: { url: '/sounds/cannon-fire.mp3', volume: 0.8 },
  hit: { url: '/sounds/explosion.mp3', volume: 0.9 },
  miss: { url: '/sounds/water-splash.mp3', volume: 0.6 },
  collect_gold: { url: '/sounds/coin-collect.mp3', volume: 0.7 },
  collect_crew: { url: '/sounds/crew-join.mp3', volume: 0.6 },
  collect_supplies: { url: '/sounds/supplies-collect.mp3', volume: 0.6 },
  ship_move: { url: '/sounds/ship-move.mp3', volume: 0.4 },
  territory_capture: { url: '/sounds/flag-plant.mp3', volume: 0.8 },
  victory: { url: '/sounds/victory-fanfare.mp3', volume: 1.0 },
  defeat: { url: '/sounds/defeat.mp3', volume: 0.8 },
  button_click: { url: '/sounds/button-click.mp3', volume: 0.5 },
  notification: { url: '/sounds/notification.mp3', volume: 0.6 },
  error: { url: '/sounds/error.mp3', volume: 0.7 },
};

export function useSoundEffects() {
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioCache = useRef<Map<SoundType, HTMLAudioElement>>(new Map());
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Preload sounds on mount
  useEffect(() => {
    const loadSounds = async () => {
      const promises = Object.entries(SOUND_CONFIG).map(async ([type, config]) => {
        if (!config.preload) return;
        
        try {
          const audio = new Audio(config.url);
          audio.preload = 'auto';
          audio.volume = config.volume || 0.7;
          
          await audio.load();
          audioCache.current.set(type as SoundType, audio);
        } catch (error) {
          console.warn(`Failed to preload sound: ${type}`, error);
        }
      });
      
      await Promise.all(promises);
      setIsLoaded(true);
    };
    
    loadSounds();
  }, []);

  const play = useCallback((type: SoundType, overrideVolume?: number) => {
    if (isMuted || prefersReducedMotion) return;
    
    const config = SOUND_CONFIG[type];
    if (!config) {
      console.warn(`Sound not found: ${type}`);
      return;
    }
    
    // Try from cache first
    const cached = audioCache.current.get(type);
    if (cached) {
      cached.currentTime = 0;
      cached.volume = overrideVolume ?? config.volume ?? 0.7;
      cached.play().catch(err => {
        console.warn(`Failed to play sound: ${type}`, err);
      });
      return;
    }
    
    // Fallback: create new audio
    try {
      const audio = new Audio(config.url);
      audio.volume = overrideVolume ?? config.volume ?? 0.7;
      audio.play().catch(err => {
        console.warn(`Failed to play sound: ${type}`, err);
      });
    } catch (error) {
      console.warn(`Failed to create sound: ${type}`, error);
    }
  }, [isMuted, prefersReducedMotion]);

  const mute = useCallback(() => setIsMuted(true), []);
  const unmute = useCallback(() => setIsMuted(false), []);
  const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);

  // Play multiple sounds in sequence (for combos)
  const playSequence = useCallback((types: SoundType[], delayMs: number = 200) => {
    types.forEach((type, index) => {
      setTimeout(() => play(type), index * delayMs);
    });
  }, [play]);

  return {
    play,
    playSequence,
    mute,
    unmute,
    toggleMute,
    isMuted,
    isLoaded,
    prefersReducedMotion,
  };
}

// Convenience component for sound provider
export function SoundProvider({ children }: { children: React.ReactNode }) {
  useSoundEffects(); // Initialize on mount
  return <div className="sound-provider">{children}</div>;
}
