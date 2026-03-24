/**
 * Sound Manager - React Native Version
 *
 * Manages game sound effects using expo-av.
 * Provides a simple API for playing SFX with volume control.
 */

import { Audio, AVPlaybackStatus } from "expo-av";
import { Platform } from "react-native";

export type SoundEffect =
  | "select"
  | "move"
  | "attack"
  | "collect"
  | "victory"
  | "defeat"
  | "tutorial_complete"
  | "hint_dismiss";

// Sound file mappings - using try/catch for require to handle missing files
const SOUND_FILES: Record<SoundEffect, any> = {
  select: null,
  move: null,
  attack: null,
  collect: null,
  victory: null,
  defeat: null,
  tutorial_complete: null,
  hint_dismiss: null,
};

// Try to load sound files, fall back to null if not found
try {
  SOUND_FILES.select = require("@/assets/sounds/select.mp3");
} catch {}
try {
  SOUND_FILES.move = require("@/assets/sounds/move.mp3");
} catch {}
try {
  SOUND_FILES.attack = require("@/assets/sounds/attack.mp3");
} catch {}
try {
  SOUND_FILES.collect = require("@/assets/sounds/collect.mp3");
} catch {}
try {
  SOUND_FILES.victory = require("@/assets/sounds/victory.mp3");
} catch {}
try {
  SOUND_FILES.defeat = require("@/assets/sounds/defeat.mp3");
} catch {}
try {
  SOUND_FILES.tutorial_complete = require("@/assets/sounds/tutorial_complete.mp3");
} catch {}
try {
  SOUND_FILES.hint_dismiss = require("@/assets/sounds/hint_dismiss.mp3");
} catch {}

class SoundManagerClass {
  private sounds: Map<string, Audio.Sound> = new Map();
  private isMuted = false;
  private volume = 0.5;
  private isInitialized = false;

  /**
   * Initialize the sound manager
   * Loads all sound effects into memory
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Set audio mode for mobile
      if (Platform.OS !== "web") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      }

      // Load all sounds
      for (const [key, source] of Object.entries(SOUND_FILES)) {
        if (source) {
          try {
            const { sound } = await Audio.Sound.createAsync(source);
            this.sounds.set(key, sound);
          } catch (error) {
            console.warn(`Failed to load sound ${key}:`, error);
          }
        }
      }

      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize sound manager:", error);
    }
  }

  /**
   * Play a sound effect
   */
  async play(sound: SoundEffect) {
    if (this.isMuted) {
      return;
    }

    const soundObj = this.sounds.get(sound);
    if (!soundObj) {
      // Sound not loaded, skip silently
      return;
    }

    try {
      // Stop and rewind if already playing
      await soundObj.stopAsync();
      await soundObj.setPositionAsync(0);

      // Set volume and play
      await soundObj.setVolumeAsync(this.volume);
      await soundObj.playAsync();
    } catch (error) {
      console.error(`Failed to play sound ${sound}:`, error);
    }
  }

  /**
   * Mute all sounds
   */
  mute() {
    this.isMuted = true;
  }

  /**
   * Unmute all sounds
   */
  unmute() {
    this.isMuted = false;
  }

  /**
   * Toggle mute state
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Check if muted
   */
  getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Set volume (0.0 - 1.0)
   */
  setVolume(level: number) {
    this.volume = Math.max(0, Math.min(1, level));
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Cleanup - unload all sounds
   */
  async cleanup() {
    for (const sound of this.sounds.values()) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error("Failed to unload sound:", error);
      }
    }
    this.sounds.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const SoundManager = new SoundManagerClass();

// Hook for using sound manager in components
export function useSound() {
  const playSound = async (sound: SoundEffect) => {
    await SoundManager.play(sound);
  };

  const mute = () => SoundManager.mute();
  const unmute = () => SoundManager.unmute();
  const toggleMute = () => SoundManager.toggleMute();

  return {
    playSound,
    mute,
    unmute,
    toggleMute,
    isMuted: SoundManager.getIsMuted(),
    volume: SoundManager.getVolume(),
    setVolume: SoundManager.setVolume.bind(SoundManager),
  };
}

export default SoundManager;
