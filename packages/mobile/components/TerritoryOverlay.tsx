/**
 * Territory Conquest Overlay - React Native Version
 * 
 * Visual indicator of territory control for the game map.
 * Shows player-controlled (cyan), AI-controlled (red), and contested territories.
 * 
 * Features:
 * - Color-coded ownership borders
 * - Income indicators (💰) for controlled territories
 * - Contested warnings (⚔️) with pulse animation
 * - Optimized for performance with memoization
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface TerritoryOverlayProps {
  coordinate: string;
  owner: string | null;
  isContested: boolean;
  isPlayerControlled: boolean;
  currentPlayerPK?: string;
}

export const TerritoryOverlay: React.FC<TerritoryOverlayProps> = React.memo(({
  owner,
  isContested,
  isPlayerControlled,
}) => {
  // Pulse animation for contested territories
  const scale = useSharedValue(1);
  
  React.useEffect(() => {
   if (isContested) {
      scale.value = withRepeat(
        withTiming(1.15, {
          duration: 600,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true // Reverse on each repeat
      );
    } else {
      scale.value = 1;
    }
  }, [isContested]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Determine colors based on ownership
  const colors = useMemo(() => {
   if (!owner) {
     return {
        backgroundColor: 'transparent',
       borderColor: 'transparent',
      };
    }

   if (isPlayerControlled) {
     return {
        backgroundColor: 'rgba(34, 211, 238, 0.15)', // cyan
       borderColor: '#22d3ee',
      };
    }

    // Check if AI-controlled (starts with 'AI_')
   if (owner.startsWith('AI_')) {
     return {
        backgroundColor: 'rgba(239, 68, 68, 0.15)', // red
       borderColor: '#ef4444',
      };
    }

    // Other players
   return {
      backgroundColor: 'rgba(251, 191, 36, 0.15)', // amber
     borderColor: '#fbbf24',
    };
  }, [owner, isPlayerControlled]);

  if (!owner) {
   return null;
  }

 return (
    <View style={StyleSheet.absoluteFill}>
      {/* Territory Background & Border */}
      <Animated.View
        style={[
          styles.overlay,
          {
            backgroundColor: colors.backgroundColor,
           borderColor: colors.borderColor,
          },
         isContested && animatedStyle,
        ]}
      >
        {/* Income Indicator - Only show for player-controlled, non-contested */}
        {isPlayerControlled && !isContested && (
          <Text style={styles.incomeIcon}>💰</Text>
        )}

        {/* Contested Territory Warning */}
        {isContested && (
          <Text style={styles.contestedIcon}>⚔️</Text>
        )}
      </Animated.View>
    </View>
  );
});

TerritoryOverlay.displayName = 'TerritoryOverlay';

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
   bottom: 0,
   borderWidth: 2,
   borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    transitionProperty: 'background-color, border-color',
    transitionDuration: '500ms',
  },
  incomeIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
    fontSize: 14,
   textShadowColor: 'rgba(0, 0, 0, 0.5)',
   textShadowOffset: { width: 0, height: 2 },
   textShadowRadius: 4,
  },
  contestedIcon: {
    position: 'absolute',
    top: -4,
    left: -4,
    fontSize: 14,
   textShadowColor: 'rgba(0, 0, 0, 0.5)',
   textShadowOffset: { width: 0, height: 2 },
   textShadowRadius: 4,
  },
});

export default TerritoryOverlay;
