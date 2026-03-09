/**
 * Game Screen - PIR8 Mobile
 * 
 * Uses shared game logic from @pir8/core
 * Implements native React Native UI
 */

import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

// Import shared game logic from core package
import { 
  PirateGameManager, 
  GameState,
  Ship,
  calculateSpeedBonus 
} from '@pir8/core';

export default function GameScreen() {
  const router= useRouter();
  
 // Game state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [decisionTime, setDecisionTime] = useState(0);

 // Haptic feedback using Expo Haptics (native!)
  const triggerHaptic = useCallback(async (intensity: 'light' | 'medium' | 'heavy' | 'success' | 'error') => {
    switch (intensity) {
     case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
     case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
     case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
     case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
     case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
    }
  }, []);

 // Handle ship selection
  const handleShipSelect = useCallback((ship: Ship) => {
   triggerHaptic('light');
   setSelectedShip(ship);
  }, [triggerHaptic]);

 // Handle action with speed bonus calculation
  const handleAction = useCallback(() => {
  if (!selectedShip) return;
    
  const bonus = calculateSpeedBonus(decisionTime);
    
   triggerHaptic(bonus > 0 ? 'success' : 'medium');
    
   // Game logic would go here...
  console.log(`Action taken! Speed bonus: ${bonus}`);
  }, [selectedShip, decisionTime, triggerHaptic]);

 return (
    <LinearGradient
    colors={['#0f172a', '#1e293b']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>⚔️ Battle Arena</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Game Area */}
        <ScrollView style={styles.gameArea} showsVerticalScrollIndicator={false}>
         {/* Territory Map would go here */}
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapText}>🗺️ Interactive Map</Text>
            <Text style={styles.mapSubtext}>Territory control visualization</Text>
          </View>

         {/* Ships Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚓ Your Fleet</Text>
            
           {/* Ship Cards */}
            {[1, 2, 3].map((i) => (
              <TouchableOpacity
               key={i}
                style={[
                  styles.shipCard,
                 selectedShip?.id === `ship-${i}` && styles.shipCardSelected
                ]}
              onPress={() => handleShipSelect({ 
                 id: `ship-${i}`, 
                  type: 'warship',
                  health: 100,
                 maxHealth: 100,
                 attack: 25,
                 defense: 10,
                  speed: 5,
                  position: { x: i, y: i },
                 resources: { gold: 0, crew: 0, cannons: 0, supplies: 0 },
                  ability: { name: 'Attack', description: 'Basic attack', cooldown: 0 },
                 activeEffects: []
                })}
              activeOpacity={0.7}
              >
                <Text style={styles.shipEmoji}>🚢</Text>
                <View style={styles.shipInfo}>
                  <Text style={styles.shipName}>Warship {i}</Text>
                  <View style={styles.healthBar}>
                    <View style={[styles.healthFill, { width: '100%' }]} />
                  </View>
                  <Text style={styles.shipStats}>ATK: 25 | DEF: 10</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

         {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
             style={styles.actionButton}
            onPress={handleAction}
             disabled={!selectedShip}
            activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>
                {selectedShip ? '⚔️ Attack' : 'Select a Ship'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
             style={[styles.actionButton, styles.secondaryAction]}
            activeOpacity={0.7}
            >
              <Text style={[styles.actionButtonText, styles.secondaryText]}>
                💰 Collect Resources
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Turn Info */}
        <View style={styles.turnInfo}>
          <Text style={styles.turnText}>Your Turn</Text>
          <Text style={styles.speedBonus}>
            ⚡ Speed Bonus: +{calculateSpeedBonus(decisionTime)} pts
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1,
  },
  safeArea: {
    flex:1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
   color: '#22d3ee',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
   color: '#fbbf24',
    fontSize: 18,
    fontWeight: '800',
  },
  placeholder: {
    width: 60,
  },
  gameArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mapPlaceholder: {
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
   borderRadius: 16,
    padding: 32,
    alignItems: 'center',
   marginBottom: 24,
   borderWidth: 2,
   borderColor: 'rgba(34, 211,238, 0.3)',
  },
  mapText: {
   color: '#22d3ee',
    fontSize: 24,
    fontWeight: '700',
  },
  mapSubtext: {
   color: '#64748b',
    fontSize: 14,
   marginTop: 8,
  },
  section: {
   marginBottom: 24,
  },
  sectionTitle: {
   color: '#fbbf24',
    fontSize: 20,
    fontWeight: '800',
   marginBottom: 16,
  },
  shipCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
   borderRadius: 12,
    padding: 16,
   marginBottom: 12,
   borderWidth: 2,
   borderColor: 'transparent',
  },
  shipCardSelected: {
   borderColor: '#22d3ee',
    backgroundColor: 'rgba(34, 211,238, 0.1)',
  },
  shipEmoji: {
    fontSize: 40,
   marginRight: 16,
  },
  shipInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  shipName: {
   color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
   marginBottom: 8,
  },
  healthBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
   borderRadius: 3,
   marginBottom: 4,
  },
  healthFill: {
    height: '100%',
    backgroundColor: '#22c55e',
   borderRadius:3,
  },
  shipStats: {
   color: '#94a3b8',
    fontSize: 14,
  },
  actions: {
   gap: 12,
   marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#22d3ee',
    paddingVertical: 16,
   borderRadius: 12,
   shadowColor: '#22d3ee',
   shadowOffset: { width: 0, height: 4 },
   shadowOpacity: 0.5,
   shadowRadius: 8,
    elevation: 8,
  },
  actionButtonText: {
   color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
   textAlign: 'center',
  },
  secondaryAction: {
    backgroundColor: 'transparent',
   borderWidth: 2,
   borderColor: '#fbbf24',
   shadowOpacity: 0,
    elevation: 0,
  },
  secondaryText: {
   color: '#fbbf24',
  },
  turnInfo: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 20,
   borderTopWidth: 2,
   borderTopColor: 'rgba(251, 191, 36, 0.3)',
  },
  turnText: {
   color: '#fbbf24',
    fontSize: 18,
    fontWeight: '800',
   textAlign: 'center',
   marginBottom: 4,
  },
  speedBonus: {
   color: '#22d3ee',
    fontSize: 14,
   textAlign: 'center',
    fontWeight: '600',
  },
});
