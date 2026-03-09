/**
 * PIR8 Battle Arena - Mobile App (Expo)
 * 
 * Native Android app for Solana Mobile Hackathon
 * Built with React Native + Expo + Solana Mobile Stack
 */

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router= useRouter();

 return (
    <LinearGradient
     colors={['#0f172a', '#1e293b', '#0f172a']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.emoji}>🏴‍☠️</Text>
          <Text style={styles.title}>PIR8</Text>
          <Text style={styles.subtitle}>Battle Arena</Text>
          <Text style={styles.description}>
            Strategic naval warfare on Solana
          </Text>
        </View>

        {/* CTA Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
           onPress={() => router.push('/game')}
           activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>⚔️ Play Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
           onPress={() => router.push('/leaderboard')}
           activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>🏆 Leaderboard</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Built with Solana Mobile Stack
          </Text>
          <Text style={styles.footerSubtext}>
            🏆 Monolith Hackathon 2024
          </Text>
        </View>
      </SafeAreaView>
      
      <StatusBar style="light" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 80,
   marginBottom: 16,
   textShadowColor: 'rgba(0, 0, 0, 0.5)',
   textShadowOffset: { width: 0, height: 4 },
   textShadowRadius: 8,
  },
  title: {
    fontSize: 56,
    fontWeight: '900',
    backgroundColor: '#00ffff',
   color: 'transparent',
    paddingHorizontal: 12,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '700',
   color: '#fbbf24',
   marginTop: 8,
  },
  description: {
    fontSize: 16,
   color: '#94a3b8',
   marginTop: 12,
   textAlign: 'center',
  },
  buttonContainer: {
   gap: 16,
   marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#22d3ee',
    paddingVertical: 16,
    paddingHorizontal: 32,
   borderRadius:12,
   shadowColor: '#22d3ee',
   shadowOffset: { width: 0, height: 4 },
   shadowOpacity: 0.5,
   shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 20,
    fontWeight: '800',
   color: '#0f172a',
   textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
   borderRadius:12,
   borderWidth: 2,
   borderColor: '#fbbf24',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
   color: '#fbbf24',
   textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 14,
   color: '#64748b',
   marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
   color: '#475569',
  },
});
