/**
 * Game Screen - PIR8 Mobile
 *
 * Uses shared game logic from @pir8/core
 * Implements native React Native UI
 */

import { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import shared game logic from core package
import {
  PirateGameManager,
  GameState,
  Ship,
  GameMap as GameMapType,
  calculateSpeedBonus,
} from "@pir8/core";
import GameMap from "@/components/GameMap";
import FirstTimeTutorial from "@/components/FirstTimeTutorial";
import ContextualHints, {
  HINT_TEMPLATES,
  useContextualHints,
} from "@/components/ContextualHints";
import VictoryCelebration from "@/components/VictoryCelebration";
import { useSound } from "@/utils/SoundManager";
import { useMobileWallet } from "@/utils/useMobileWallet";

// Mock data for development (replace with real game state)
const createMockGameMap = (currentPlayerPK: string | null): GameMapType => ({
  cells: Array.from({ length: 10 }, (_, y) =>
    Array.from({ length: 10 }, (_, x) => ({
      coordinate: `${x},${y}`,
      type: x % 3 === 0 ? "port" : x % 3 === 1 ? "island" : "water",
      owner: x > 5 ? "AI_player_1" : x < 3 ? currentPlayerPK || "player" : null,
      isContested: x === 4 || x === 5,
      resources: {},
    })),
  ),
  size: 10,
});

const createMockShips = (): Ship[] => [
  {
    id: "ship-1",
    type: "sloop",
    health: 100,
    maxHealth: 100,
    attack: 25,
    defense: 10,
    speed: 5,
    position: { x: 2, y: 3 },
    resources: { gold: 0, crew: 0, cannons: 0, supplies: 0, wood: 0, rum: 0 },
    ability: {
      name: "Attack",
      description: "Basic attack",
      cooldown: 0,
      currentCooldown: 0,
      isReady: true,
      type: "offensive",
    },
    activeEffects: [],
  },
  {
    id: "ship-2",
    type: "sloop",
    health: 60,
    maxHealth: 60,
    attack: 15,
    defense: 5,
    speed: 8,
    position: { x: 3, y: 4 },
    resources: { gold: 0, crew: 0, cannons: 0, supplies: 0, wood: 0, rum: 0 },
    ability: {
      name: "Scout",
      description: "Reveal area",
      cooldown: 2,
      currentCooldown: 0,
      isReady: true,
      type: "utility",
    },
    activeEffects: [],
  },
];

export default function GameScreen() {
  const router = useRouter();

  // Wallet connection
  const wallet = useMobileWallet();

  // Sound manager hook
  const { playSound } = useSound();

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);

  // Game state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [decisionTime, setDecisionTime] = useState(0);
  const [showVictory, setShowVictory] = useState(false);

  // Contextual hints hook
  const { activeHints, showHint, showHints, dismissHint } =
    useContextualHints();

  // Use wallet address when connected, fallback to mock
  const currentPlayerPK = wallet.isConnected ? wallet.address : "player";
  const mockGameMap = createMockGameMap(currentPlayerPK);
  const mockShips = createMockShips();

  // Check if tutorial should be shown on first launch
  useEffect(() => {
    const checkTutorialStatus = async () => {
      try {
        const tutorialComplete = await AsyncStorage.getItem(
          "pir8_tutorial_complete",
        );
        if (!tutorialComplete) {
          setShowTutorial(true);
        }
      } catch (error) {
        console.error("Error checking tutorial status:", error);
      }
    };

    checkTutorialStatus();

    // Show initial hints for new players
    setTimeout(() => {
      showHints([
        HINT_TEMPLATES.FIRST_SHIP_SELECT,
        HINT_TEMPLATES.TERRITORY_CONTROL,
      ]);
    }, 1000);
  }, []);

  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
  }, []);

  const handleTutorialSkip = useCallback(() => {
    setShowTutorial(false);
  }, []);

  // Haptic feedback using Expo Haptics (native!)
  const triggerHaptic = useCallback(
    async (intensity: "light" | "medium" | "heavy" | "success" | "error") => {
      switch (intensity) {
        case "light":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case "medium":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case "heavy":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case "success":
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
          break;
        case "error":
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error,
          );
          break;
      }
    },
    [],
  );

  // Handle ship selection
  const handleShipSelect = useCallback(
    (ship: Ship) => {
      triggerHaptic("light");
      playSound("select");
      setSelectedShip(ship);

      // Show contextual hint on first ship selection
      showHint(HINT_TEMPLATES.FIRST_MOVE);
    },
    [triggerHaptic, playSound, showHint],
  );

  // Handle action with speed bonus calculation
  const handleAction = useCallback(() => {
    if (!selectedShip) return;

    const bonus = calculateSpeedBonus(decisionTime);

    triggerHaptic(bonus > 0 ? "success" : "medium");
    playSound("attack");

    // Game logic would go here...
    console.log(`Action taken! Speed bonus: ${bonus}`);
  }, [selectedShip, decisionTime, triggerHaptic, playSound]);

  return (
    <>
      <LinearGradient colors={["#0f172a", "#1e293b"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Battle Arena</Text>
            <TouchableOpacity
              onPress={wallet.isConnected ? wallet.disconnect : wallet.connect}
              style={[
                styles.walletButton,
                wallet.isConnected && styles.walletConnected,
              ]}
              disabled={wallet.isLoading}
            >
              <Text style={styles.walletButtonText}>
                {wallet.isLoading
                  ? "..."
                  : wallet.isConnected
                    ? `${wallet.address?.slice(0, 4)}...${wallet.address?.slice(-4)}`
                    : "Connect"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Wallet Error Banner */}
          {wallet.error && (
            <TouchableOpacity
              style={styles.errorBanner}
              onPress={wallet.clearError}
            >
              <Text style={styles.errorText}>{wallet.error}</Text>
              <Text style={styles.errorDismiss}>Dismiss</Text>
            </TouchableOpacity>
          )}

          {/* Game Area */}
          <ScrollView
            style={styles.gameArea}
            showsVerticalScrollIndicator={false}
          >
            {/* Territory Map with Conquest Overlay */}
            <GameMap
              gameMap={mockGameMap}
              ships={mockShips}
              currentPlayerPK={currentPlayerPK}
              isMyTurn={true}
              selectedShipId={selectedShip?.id || null}
              onCellSelect={(coordinate) => {
                triggerHaptic("light");
                console.log(`Selected cell: ${coordinate}`);
              }}
              onShipClick={(ship) => {
                handleShipSelect(ship);
              }}
            />

            {/* Ships Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Fleet</Text>

              {/* Ship Cards */}
              {mockShips.map((ship) => (
                <TouchableOpacity
                  key={ship.id}
                  style={[
                    styles.shipCard,
                    selectedShip?.id === ship.id && styles.shipCardSelected,
                  ]}
                  onPress={() => handleShipSelect(ship)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.shipEmoji}>Ship</Text>
                  <View style={styles.shipInfo}>
                    <Text style={styles.shipName}>
                      {ship.type} {ship.id.split("-")[1]}
                    </Text>
                    <View style={styles.healthBar}>
                      <View
                        style={[
                          styles.healthFill,
                          { width: `${(ship.health / ship.maxHealth) * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.shipStats}>
                      ATK: {ship.attack} | DEF: {ship.defense}
                    </Text>
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
                  {selectedShip ? "Attack" : "Select a Ship"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryAction]}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionButtonText, styles.secondaryText]}>
                  Collect Resources
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Turn Info */}
          <View style={styles.turnInfo}>
            <View style={styles.turnInfoRow}>
              <Text style={styles.turnText}>Your Turn</Text>
              {wallet.isConnected && (
                <Text style={styles.balanceText}>
                  {wallet.balance.toFixed(2)} SOL
                </Text>
              )}
            </View>
            <Text style={styles.speedBonus}>
              Speed Bonus: +{calculateSpeedBonus(decisionTime)} pts
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Tutorial Overlay */}
      <FirstTimeTutorial
        isVisible={showTutorial}
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialSkip}
      />

      {/* Contextual Hints Toast */}
      <ContextualHints
        hints={activeHints}
        onDismiss={dismissHint}
        isVisible={true}
      />

      {/* Victory Celebration */}
      <VictoryCelebration
        isVisible={showVictory}
        onComplete={() => setShowVictory(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "#22d3ee",
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    color: "#fbbf24",
    fontSize: 18,
    fontWeight: "800",
  },
  walletButton: {
    backgroundColor: "rgba(34, 211, 238, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#22d3ee",
  },
  walletConnected: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderColor: "#22c55e",
  },
  walletButtonText: {
    color: "#22d3ee",
    fontSize: 12,
    fontWeight: "600",
  },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderBottomWidth: 1,
    borderBottomColor: "#ef4444",
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    flex: 1,
  },
  errorDismiss: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 12,
  },
  gameArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#fbbf24",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 16,
  },
  shipCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  shipCardSelected: {
    borderColor: "#22d3ee",
    backgroundColor: "rgba(34, 211, 238, 0.1)",
  },
  shipEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  shipInfo: {
    flex: 1,
    justifyContent: "center",
  },
  shipName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  healthBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    marginBottom: 4,
  },
  healthFill: {
    height: "100%",
    backgroundColor: "#22c55e",
    borderRadius: 3,
  },
  shipStats: {
    color: "#94a3b8",
    fontSize: 14,
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: "#22d3ee",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#22d3ee",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonText: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  secondaryAction: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#fbbf24",
    shadowOpacity: 0,
    elevation: 0,
  },
  secondaryText: {
    color: "#fbbf24",
  },
  turnInfo: {
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 2,
    borderTopColor: "rgba(251, 191, 36, 0.3)",
  },
  turnInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  turnText: {
    color: "#fbbf24",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    flex: 1,
  },
  balanceText: {
    color: "#22c55e",
    fontSize: 14,
    fontWeight: "600",
  },
  speedBonus: {
    color: "#22d3ee",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
});
