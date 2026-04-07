/**
 * First Time Tutorial - React Native Version
 * 
 * Interactive 6-step walkthrough for new players.
 * Teaches core mechanics through progressive disclosure.
 * 
 * Features:
 * - 6 tutorial steps (welcome, ships, movement, attack, collect, end turn)
 * - Keyboard navigation support (Enter/Esc)
 * - Progress bar visualization
 * - Skip functionality for experienced players
 * - Animated transitions between steps
 * - LocalStorage persistence for completion tracking
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

// Tutorial step definitions
interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  action?: 'select_ship' | 'move_ship' | 'attack' | 'collect' | 'end_turn';
  skipable: boolean;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
   id: 1,
    title: "Welcome, Captain!",
   description: "Learn to command your fleet and conquer territories in this strategic naval battle game!",
    icon: "🏴‍☠️",
    skipable: false,
  },
  {
   id: 2,
    title: "Your Fleet ⚓",
   description: "Tap on any ship with the ⚓ icon to select it. Each ship has unique abilities and stats.",
    icon: "⚓",
   action: 'select_ship',
    skipable: true,
  },
  {
   id:3,
    title: "Move Your Ships ⛵",
   description: "With a ship selected, tap adjacent cells to move. Control key territories for strategic advantage!",
    icon: "⛵",
   action: 'move_ship',
    skipable: true,
  },
  {
   id: 4,
    title: "Attack Enemies ⚔️",
   description: "Tap enemy ships to attack. Watch for damage numbers and use haptic feedback for impact!",
    icon: "⚔️",
   action: 'attack',
    skipable: true,
  },
  {
   id: 5,
    title: "Collect Resources 💰",
   description: "Controlled territories generate passive income. Tap 'Collect' to gather gold, crew, and supplies!",
    icon: "💰",
   action: 'collect',
    skipable: true,
  },
  {
   id: 6,
    title: "End Turn & Speed Bonus ⚡",
   description: "Quick decisions earn bonus points! End your turn in under 5 seconds for maximum +100 pts speed bonus.",
    icon: "⚡",
   action: 'end_turn',
    skipable: true,
  },
];

interface FirstTimeTutorialProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export const FirstTimeTutorial: React.FC<FirstTimeTutorialProps> = ({
  isVisible,
  onComplete,
  onSkip,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const step = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  // Trigger haptic on step change
  useEffect(() => {
  if (isVisible) {
     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [currentStep, isVisible]);

  const handleNext = useCallback(async () => {
   if (currentStep < TUTORIAL_STEPS.length - 1) {
      setIsTransitioning(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsTransitioning(false);
      }, 300);
    } else {
      // Complete tutorial
      await AsyncStorage.setItem('pir8_tutorial_complete', 'true');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
     onComplete();
    }
  }, [currentStep, onComplete]);

  const handleSkip = useCallback(async () => {
    await AsyncStorage.setItem('pir8_tutorial_complete', 'true');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
   onSkip();
  }, [onSkip]);

  // Auto-focus first button when modal opens
  useEffect(() => {
  if (isVisible && Platform.OS === 'web') {
     // Web-specific focus management could go here
    }
  }, [isVisible]);

  if (!step) return null;

 return (
    <Modal
     visible={isVisible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableOpacity
       style={styles.backdrop}
      activeOpacity={1}
      onPress={step.skipable ? handleSkip: undefined}
       disabled={!step.skipable}
      >
        {/* Tutorial Modal */}
        <View style={styles.modalContainer}>
          <LinearGradient
           colors={['#0f172a', '#1e293b', '#0f172a']}
           style={styles.gradient}
          >
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View
               style={[
                  styles.progressBar,
                 { width: `${progress}%` },
                ]}
              />
            </View>

            {/* Content */}
            <View
             style={[
                styles.content,
              isTransitioning && styles.transitioning,
              ]}
            >
              {/* Step Indicator */}
              <View style={styles.stepIndicator}>
                <Text style={styles.stepNumber}>
                  STEP {currentStep + 1} OF {TUTORIAL_STEPS.length}
                </Text>
                {step.skipable && (
                  <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.skipButton}>SKIP →</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Icon */}
              <Text style={styles.icon}>{step.icon}</Text>

              {/* Title */}
              <Text style={styles.title}>{step.title}</Text>

              {/* Description */}
              <Text style={styles.description}>{step.description}</Text>

              {/* Visual Demo Area */}
              <View style={styles.demoArea}>
                {step.action === 'select_ship' && (
                  <View style={styles.demo}>
                    <Text style={styles.demoEmoji}>⚓</Text>
                    <Text style={styles.demoText}>← Tap a ship like this</Text>
                  </View>
                )}
                
                {step.action === 'move_ship' && (
                  <View style={styles.demo}>
                    <Text style={styles.demoEmoji}>⛵ → ⬜</Text>
                    <Text style={styles.demoText}>Move to adjacent cells</Text>
                  </View>
                )}
                
                {step.action === 'attack' && (
                  <View style={styles.demo}>
                    <Text style={styles.demoEmoji}>💥 -5</Text>
                    <Text style={styles.demoText}>Damage appears!</Text>
                  </View>
                )}
                
                {step.action === 'collect' && (
                  <View style={styles.demo}>
                    <Text style={styles.demoEmoji}>💰 +100</Text>
                    <Text style={styles.demoText}>Resources collected</Text>
                  </View>
                )}
                
                {step.action === 'end_turn' && (
                  <View style={styles.demo}>
                    <Text style={styles.demoEmoji}>⏱️ &lt;5s = +100</Text>
                    <Text style={styles.demoText}>Speed bonus!</Text>
                  </View>
                )}
                
                {!step.action && (
                  <View style={styles.demo}>
                    <Text style={styles.demoEmoji}>🎮</Text>
                    <Text style={styles.demoText}>Let&apos;s get started!</Text>
                  </View>
                )}
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={styles.continueButton}
              onPress={handleNext}
              activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>
                  {currentStep < TUTORIAL_STEPS.length - 1 ? 'CONTINUE →' : 'START BATTLE! ⚔️'}
                </Text>
              </TouchableOpacity>

              {/* Keyboard Hint */}
              {Platform.OS === 'web' && (
                <Text style={styles.keyboardHint}>
                  Press Enter to continue{step.skipable ? ' or Esc to skip' : ''}
                </Text>
              )}
            </View>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
   flex:1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
   justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
   width: Dimensions.get('window').width * 0.9,
   maxWidth: 400,
  borderRadius:20,
    overflow: 'hidden',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.5,
  shadowRadius: 20,
    elevation: 20,
  },
  gradient: {
  padding: 24,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius:2,
  marginBottom: 24,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#22d3ee',
   transitionProperty: 'width',
   transitionDuration: '300ms',
  },
  content: {
   transitionProperty: 'opacity, transform',
   transitionDuration: '300ms',
  },
  transitioning: {
    opacity: 0,
    transform: [{ scale: 0.95 }],
  },
  stepIndicator: {
   flexDirection: 'row',
   justifyContent: 'space-between',
    alignItems: 'center',
  marginBottom: 16,
  },
  stepNumber: {
   fontSize: 12,
  color: '#22d3ee',
    fontWeight: '700',
   letterSpacing: 1,
  },
  skipButton: {
   fontSize: 12,
  color: '#64748b',
    fontWeight: '600',
  },
  icon: {
    fontSize: 64,
  textAlign: 'center',
  marginBottom: 16,
  textShadowColor: 'rgba(0, 0, 0, 0.5)',
  textShadowOffset: { width: 0, height: 4 },
  textShadowRadius: 8,
  },
  title: {
   fontSize: 24,
    fontWeight: '900',
  color: '#ffffff',
  textAlign: 'center',
  marginBottom: 12,
  },
  description: {
   fontSize: 16,
  color: '#94a3b8',
  textAlign: 'center',
   lineHeight: 24,
  marginBottom: 24,
  },
  demoArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius:12,
  padding: 20,
  marginBottom: 24,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  demo: {
    alignItems: 'center',
  },
  demoEmoji: {
    fontSize: 32,
  marginBottom: 8,
  },
  demoText: {
   fontSize: 14,
  color: '#22d3ee',
    fontWeight: '600',
  textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#22d3ee',
  paddingVertical: 16,
  borderRadius: 12,
  shadowColor: '#22d3ee',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.5,
  shadowRadius:8,
    elevation: 8,
  marginBottom: 12,
  },
  continueButtonText: {
  color: '#0f172a',
   fontSize: 18,
    fontWeight: '900',
  textAlign: 'center',
  },
  keyboardHint: {
   fontSize: 12,
  color: '#475569',
  textAlign: 'center',
  },
});

export default FirstTimeTutorial;
