/**
 * Contextual Hints System - React Native Version
 *
 * Shows helpful tooltips based on game state and user actions.
 * Auto-dismiss with optional countdown timer.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import * as Haptics from "expo-haptics";

export interface Hint {
  id: string;
  text: string;
  duration?: number; // Auto-hide after ms (0 = manual dismiss)
  priority?: "low" | "medium" | "high";
}

interface ContextualHintsProps {
  hints: Hint[];
  onDismiss?: (hintId: string) => void;
  isVisible?: boolean;
}

// Pre-defined hint templates for common scenarios
export const HINT_TEMPLATES: Record<string, Hint> = {
  FIRST_SHIP_SELECT: {
    id: "first_ship_select",
    text: "Tap a ship to select it and see its options",
    priority: "high",
    duration: 5000,
  },
  FIRST_MOVE: {
    id: "first_move",
    text: "With a ship selected, tap an adjacent cell to move",
    priority: "high",
    duration: 6000,
  },
  FIRST_ATTACK: {
    id: "first_attack",
    text: "Tap an enemy ship to attack. Watch for damage numbers!",
    priority: "high",
    duration: 5000,
  },
  FIRST_COLLECT: {
    id: "first_collect",
    text: 'Click "Collect" to gather resources from your territories',
    priority: "medium",
    duration: 5000,
  },
  SPEED_BONUS: {
    id: "speed_bonus",
    text: "Fast decisions earn bonus points! <5s = +100 pts",
    priority: "medium",
    duration: 4000,
  },
  TERRITORY_CONTROL: {
    id: "territory_control",
    text: "Control territories to earn passive income each turn",
    priority: "medium",
    duration: 5000,
  },
  LOW_HEALTH: {
    id: "low_health",
    text: "Your ship is low on health! Consider retreating or repairing",
    priority: "high",
    duration: 4000,
  },
  VICTORY_CONDITION: {
    id: "victory_condition",
    text: "Destroy all enemy ships OR control 60% of the map to win!",
    priority: "low",
    duration: 6000,
  },
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "#f97316", // orange
  medium: "#fbbf24", // gold
  low: "#22d3ee", // cyan
};

export const ContextualHints: React.FC<ContextualHintsProps> = ({
  hints,
  onDismiss,
  isVisible = true,
}) => {
  const [activeHints, setActiveHints] = useState<Hint[]>([]);
  const animations = useRef<Map<string, Animated.Value>>(new Map());

  // Filter and sort hints by priority when hints prop changes
  useEffect(() => {
    if (!isVisible || !hints.length) return;

    // Sort by priority and take top 3
    const sorted = [...hints].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (
        (priorityOrder[b.priority || "low"] || 1) -
        (priorityOrder[a.priority || "low"] || 1)
      );
    });
    setActiveHints(sorted.slice(0, 3));

    // Initialize animations for new hints
    sorted.forEach((hint) => {
      if (!animations.current.has(hint.id)) {
        const anim = new Animated.Value(0);
        animations.current.set(hint.id, anim);
        Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    });

    // Auto-dismiss hints with duration
    sorted.forEach((hint) => {
      if (hint.duration && hint.duration > 0) {
        setTimeout(() => handleDismiss(hint.id), hint.duration);
      }
    });
  }, [hints, isVisible]);

  const handleDismiss = useCallback(
    async (hintId: string) => {
      const anim = animations.current.get(hintId);
      if (anim) {
        Animated.timing(anim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setActiveHints((prev) => prev.filter((h) => h.id !== hintId));
          animations.current.delete(hintId);
        });
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onDismiss?.(hintId);
    },
    [onDismiss],
  );

  if (!isVisible || activeHints.length === 0) return null;

  return (
    <View style={styles.container}>
      {activeHints.map((hint) => (
        <Animated.View
          key={hint.id}
          style={[
            styles.hintContainer,
            {
              opacity: animations.current.get(hint.id) || 1,
              transform: [
                {
                  translateX: (
                    animations.current.get(hint.id) || 1
                  ).interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.hintBox,
              { borderLeftColor: PRIORITY_COLORS[hint.priority || "low"] },
            ]}
          >
            <TouchableOpacity
              onPress={() => handleDismiss(hint.id)}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeButtonText}>x</Text>
            </TouchableOpacity>
            <Text style={styles.hintText}>{hint.text}</Text>
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

// Hook for managing hints programmatically
export function useContextualHints() {
  const [activeHints, setActiveHints] = useState<Hint[]>([]);

  const showHint = useCallback((hint: Hint) => {
    setActiveHints((prev) => {
      if (prev.some((h) => h.id === hint.id)) return prev;
      return [...prev, hint];
    });
  }, []);

  const showHints = useCallback((hints: Hint[]) => {
    setActiveHints((prev) => {
      const existingIds = new Set(prev.map((h) => h.id));
      const newHints = hints.filter((h) => !existingIds.has(h.id));
      return [...prev, ...newHints];
    });
  }, []);

  const dismissHint = useCallback((hintId: string) => {
    setActiveHints((prev) => prev.filter((h) => h.id !== hintId));
  }, []);

  const clearHints = useCallback(() => {
    setActiveHints([]);
  }, []);

  return {
    activeHints,
    showHint,
    showHints,
    dismissHint,
    clearHints,
  };
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    right: 20,
    gap: 12,
    zIndex: 1000,
  },
  hintContainer: {
    maxWidth: 320,
  },
  hintBox: {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
  },
  closeButtonText: {
    color: "#94a3b8",
    fontSize: 16,
  },
  hintText: {
    fontSize: 14,
    color: "#e2e8f0",
    lineHeight: 20,
    paddingRight: 24,
  },
});

export default ContextualHints;
