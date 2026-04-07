/**
 * Victory Celebration Component - React Native Version
 *
 * Animated confetti celebration for victory screens.
 * Uses React Native Reanimated for smooth 60fps animations.
 */

import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ConfettiPiece {
  id: string;
  x: number;
  color: string;
  delay: number;
}

interface VictoryCelebrationProps {
  isVisible: boolean;
  title?: string;
  subtitle?: string;
  onComplete?: () => void;
  duration?: number;
}

const CONFETTI_COLORS = ["#22d3ee", "#fbbf24", "#ef4444", "#22c55e", "#a855f7"];
const CONFETTI_COUNT = 30;

export const VictoryCelebration: React.FC<VictoryCelebrationProps> = ({
  isVisible,
  title = "Victory!",
  subtitle = "You conquered the seas!",
  onComplete,
  duration = 4000,
}) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const slideY = useSharedValue(50);

  const confetti = useMemo<ConfettiPiece[]>(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        id: `confetti-${i}`,
        x: Math.random() * SCREEN_WIDTH,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 500,
      })),
    [],
  );

  useEffect(() => {
    if (isVisible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      opacity.value = withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
      scale.value = withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
      slideY.value = withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });

      const timer = setTimeout(() => onComplete?.(), duration);
      return () => clearTimeout(timer);
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(0.8, { duration: 300 });
      slideY.value = withTiming(50, { duration: 300 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, onComplete, duration]);

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.confettiContainer}>
        {confetti.map((piece) => (
          <ConfettiPieceView key={piece.id} piece={piece} />
        ))}
      </View>

      <Animated.View
        style={[
          styles.messageContainer,
          { opacity, transform: [{ scale }, { translateY: slideY }] },
        ]}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>
    </View>
  );
};

const ConfettiPieceView: React.FC<{ piece: ConfettiPiece }> = ({ piece }) => {
  const translateY = useSharedValue(-100);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(SCREEN_HEIGHT + 100, {
      duration: 3000 + Math.random() * 1000,
      easing: Easing.in(Easing.cubic),
    });
    rotate.value = withRepeat(
      withTiming(720, { duration: 2000, easing: Easing.linear }),
      -1,
      false,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: piece.x },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        animatedStyle,
        { backgroundColor: piece.color },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  confettiPiece: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  messageContainer: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: "900",
    color: "#fbbf24",
    textShadowColor: "rgba(251, 191, 36, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#e2e8f0",
    textAlign: "center",
  },
});

export default VictoryCelebration;
