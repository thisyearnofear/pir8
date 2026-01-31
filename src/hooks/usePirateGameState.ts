import { create } from "zustand";
import { GameState, Player, GameAction, Ship } from "../types/game";
import { PirateGameManager } from "../lib/pirateGameEngine";
import { GameBalance } from "../lib/gameBalance";

/**
 * Game Mode Types - Progressive Onboarding Architecture
 * - 'on-chain': Full blockchain game (requires wallet)
 * - 'practice': Local AI opponent (no wallet required)
 * - 'spectator': Read-only view of live games (no wallet required)
 */
export type GameMode = 'on-chain' | 'practice' | 'spectator';

interface PirateGameStore {
  // Game State
  gameState: GameState | null;
  gameMode: GameMode;

  // UI State
  isLoading: boolean;
  error: string | null;
  showMessage: string | null;
  selectedShipId: string | null;

  // Skill Mechanics - Timing
  turnStartTime: number | null;
  decisionTime: number;
  timerInterval: NodeJS.Timeout | null;
  speedBonusAccumulated: number;
  averageDecisionTimeMs: number;
  totalMovesCount: number;

  // Skill Mechanics - Scanning
  scannedCoordinates: Set<string>;
  scanChargesRemaining: number;

  // AI vs AI Demo Mode
  playbackSpeed: number;
  isAIvsAIMode: boolean;
  currentAIReasoning: any | null; // AIReasoning from pirateGameEngine
  aiDecisionCallback: ((reasoning: any) => void) | null;

  // Actions - On-chain (require wallet)
  createGame: (
    players: Player[],
    _entryFee: number,
    wallet: any,
  ) => Promise<boolean>;
  joinGame: (gameId: string, player: Player, wallet: any) => Promise<boolean>;
  startGame: (wallet: any) => Promise<boolean>;
  processAction: (action: GameAction) => Promise<boolean>;
  selectShip: (shipId: string | null) => void;
  moveShip: (
    shipId: string,
    toX: number,
    toY: number,
    wallet: any,
    decisionTimeMs?: number,
  ) => Promise<boolean>;
  attackWithShip: (
    shipId: string,
    targetShipId: string,
    wallet: any,
  ) => Promise<boolean>;
  claimTerritory: (shipId: string, wallet: any) => Promise<boolean>;
  collectResources: (wallet: any) => Promise<boolean>;
  buildShip: (
    shipType: string,
    portX: number,
    portY: number,
    wallet: any,
  ) => Promise<boolean>;
  endTurn: () => void;
  setMessage: (message: string | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setGameState: (gameState: GameState) => void;

  // Actions - Practice Mode (no wallet required)
  startPracticeGame: (humanPlayer: Player, difficulty?: 'novice' | 'pirate' | 'captain' | 'admiral') => boolean;
  makePracticeMove: (shipId: string, toX: number, toY: number) => boolean;
  makePracticeAttack: (shipId: string, targetShipId: string) => boolean;
  makePracticeClaim: (shipId: string) => boolean;
  processAITurn: () => void;
  exitPracticeMode: () => void;
  
  // Actions - AI vs AI Demo Mode (no wallet required)
  startAIvsAIGame: (difficulty1: 'novice' | 'pirate' | 'captain' | 'admiral', difficulty2: 'novice' | 'pirate' | 'captain' | 'admiral', speed?: number) => boolean;
  setPlaybackSpeed: (speed: number) => void;
  getPlaybackSpeed: () => number;
  setAIDecisionCallback: (callback: ((reasoning: any) => void) | null) => void;

  // Actions - Mode Management
  setGameMode: (mode: GameMode) => void;

  // Skill Mechanics
  startTurn: () => void;
  stopTurnTimer: () => void;
  scanCoordinate: (
    coordinateX: number,
    coordinateY: number,
  ) => Promise<boolean>;
  moveShipTimed: (shipId: string, toX: number, toY: number) => Promise<boolean>;
  getScannedCoordinates: () => string[];
  isCoordinateScanned: (coordinate: string) => boolean;

  // Getters
  getCurrentPlayer: () => Player | null;
  getMyShips: (playerPK: string) => Ship[];
  isMyTurn: (walletPk?: string) => boolean;
  getAllShips: () => Ship[];
  isPracticeMode: () => boolean;
}

// localStorage key for practice game persistence
const PRACTICE_GAME_STORAGE_KEY = 'pir8_practice_game';

// Load saved practice game from localStorage
const loadSavedPracticeGame = (): GameState | null => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(PRACTICE_GAME_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as GameState;
    }
  } catch (error) {
    console.error('Failed to load saved practice game:', error);
  }
  return null;
};

// Save practice game to localStorage
const savePracticeGame = (gameState: GameState | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (gameState) {
      localStorage.setItem(PRACTICE_GAME_STORAGE_KEY, JSON.stringify(gameState));
    } else {
      localStorage.removeItem(PRACTICE_GAME_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to save practice game:', error);
  }
};

export const usePirateGameState = create<PirateGameStore>((set, get) => ({
  // Initial state
  gameState: null,
  gameMode: 'on-chain' as GameMode,
  isLoading: false,
  error: null,
  showMessage: null,
  selectedShipId: null,

  // Skill Mechanics - Timing
  turnStartTime: null,
  decisionTime: 0,
  timerInterval: null,
  speedBonusAccumulated: 0,
  averageDecisionTimeMs: 0,
  totalMovesCount: 0,

  // Skill Mechanics - Scanning
  scannedCoordinates: new Set(),
  scanChargesRemaining: 3,

  // AI vs AI Demo Mode
  playbackSpeed: 1,
  isAIvsAIMode: false,
  currentAIReasoning: null,
  aiDecisionCallback: null,

  // Start the game (transition from Waiting to Active)
  startGame: async (wallet: any): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });
      console.log("🚀 Starting global game...");

      const { startGameClient } = await import("../lib/client/solanaClient");
      await startGameClient(wallet);

      // Refresh state to get the new map and active status
      const { createGame } = get();
      // We pass empty players array as createGame will fetch them from chain
      await createGame([], 0, wallet);

      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error("Failed to start game:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to start game",
        isLoading: false,
      });
      return false;
    }
  },

  // Join/Enter the global game
  createGame: async (
    players: Player[],
    _entryFee: number,
    wallet: any,
  ): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });

      console.log("🚀 Connecting to global game...");

      // 1. Fetch real on-chain state (still use server for reading as it's faster/easier)
      const { fetchGlobalGameState } = await import(
        "../lib/server/anchorActions"
      );
      let onChainState = await fetchGlobalGameState();

      // 2. If game doesn't exist, initialize it
      if (!onChainState) {
        try {
          console.log("🎮 Game not initialized, initializing now...");
          const { initializeGameClient } = await import(
            "../lib/client/solanaClient"
          );
          await initializeGameClient(wallet);
          onChainState = await fetchGlobalGameState();
        } catch (initError) {
          console.error("Failed to initialize:", initError);
          // Fallback to local only if chain fails completely (shouldn't happen in prod)
        }
      }

      // 3. Check if player is joined
      const walletPubkey = wallet?.publicKey?.toString();
      let isJoined = false;

      if (onChainState && walletPubkey) {
        isJoined = onChainState.players.some(
          (p: any) => p.pubkey.toString() === walletPubkey,
        );
      }

      // 4. Join if not already joined
      if (!isJoined && wallet) {
        try {
          console.log("➕ Joining game on-chain...");
          const { joinGameClient } = await import("../lib/client/solanaClient");
          await joinGameClient(wallet);
          // Fetch updated state after joining
          onChainState = await fetchGlobalGameState();
        } catch (joinError: any) {
          if (joinError?.message?.includes("GameNotJoinable")) {
            console.log(
              "✅ Player already in game (race condition), continuing...",
            );
          } else {
            throw joinError;
          }
        }
      } else {
        console.log("✅ Player already joined, syncing state...");
      }

      // 5. Convert on-chain state to local GameState format
      // This ensures we see the REAL map, REAL players, and REAL status
      if (onChainState) {
        // Map on-chain players to local Player type
        const mappedPlayers: Player[] = onChainState.players.map((p: any) => ({
          id: p.pubkey.toString(),
          name: `Pirate ${p.pubkey.toString().slice(0, 4)}`,
          publicKey: p.pubkey.toString(),
          avatar: "/avatars/pirate1.png", // Placeholder
          resources: {
            gold: p.resources.gold,
            wood: p.resources.wood || 0,
            supplies: p.resources.supplies || 0,
            cannons: p.resources.cannons,
            crew: p.resources.crew,
            rum: 0,
          },
          ships: p.ships.map((s: any) => ({
            id: s.id,
            name: `${Object.keys(s.shipType)[0]}`,
            type: Object.keys(s.shipType)[0],
            stats: {
              health: s.health,
              maxHealth: s.maxHealth,
              attack: s.attack,
              defense: s.defense,
              speed: s.speed,
              range: 1,
              cargoCapacity: 100,
            },
            position: { x: s.positionX, y: s.positionY },
            ownerId: p.pubkey.toString(),
          })),
          controlledTerritories: p.controlledTerritories,
          totalScore: p.totalScore,
          isActive: p.isActive,
        }));

        // Map on-chain map to local Map type
        // We need to convert the flat array to a 2D grid or Map object depending on GameState
        // Assuming GameState uses a Map<string, Tile> or similar.
        // For now, let's use the helper to generate a fresh map if we can't parse fully,
        // BUT ideally we parse onChainState.territoryMap

        // Let's use the manager to create a base state and then overlay on-chain data
        const gameId = "global_game";
        const baseState = PirateGameManager.createNewGame(
          mappedPlayers,
          gameId,
        );

        // Update status
        const rawStatus = onChainState.status ? Object.keys(onChainState.status)[0] : "waiting";
        const statusKey = (rawStatus || "waiting").toLowerCase(); // 'waiting', 'active', 'completed'

        const syncedState: GameState = {
          ...baseState,
          players: mappedPlayers,
          gameStatus: statusKey as "waiting" | "active" | "completed",
          currentPlayerIndex: onChainState.currentPlayerIndex,
          turnNumber: onChainState.turnNumber,
          // We should ideally sync the map here too.
          // For MVP, if map generation is deterministic based on seed, we are good.
          // But on-chain map has ownership data we need.
        };

        set({
          gameState: syncedState,
          isLoading: false,
          selectedShipId: null,
        });
        return true;
      }

      // Fallback if no on-chain state (shouldn't happen)
      const gameId = "global_game";
      const localGameState = PirateGameManager.createNewGame(players, gameId);
      set({
        gameState: localGameState,
        isLoading: false,
        selectedShipId: null,
      });
      return true;
    } catch (error) {
      console.error("Failed to enter game:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to enter game",
        isLoading: false,
      });
      return false;
    }
  },

  // Join the global pirate game on-chain
  joinGame: async (
    gameId: string,
    player: Player,
    wallet: any,
  ): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });

      // Check if AI player
      const isAI = player.publicKey.startsWith("AI_");

      if (!isAI && wallet) {
        console.log("🚀 Joining global game on Solana...");
        const { joinGameClient } = await import("../lib/client/solanaClient");
        await joinGameClient(wallet);
        console.log("✅ Successfully joined global game");
      } else {
        console.log("🤖 AI/Local player joining locally only");
      }

      // Update local game state
      const { gameState } = get();

      if (gameState && gameState.gameId === gameId) {
        // Add player to existing game
        const enhancedPlayer: Player = {
          ...player,
          resources: PirateGameManager.generateStartingResources(),
          ships: [],
          controlledTerritories: [],
          totalScore: 0,
          isActive: true,
        };

        const updatedPlayers = [...gameState.players, enhancedPlayer];

        // Assign starting fleet to new player
        const startingPositions = PirateGameManager.generateStartingPositions(
          updatedPlayers.length,
          gameState.gameMap.size,
        );

        const playerStartingPosition =
          startingPositions[updatedPlayers.length - 1];
        if (playerStartingPosition && playerStartingPosition[0]) {
          enhancedPlayer.ships = PirateGameManager.createStartingFleet(
            player.publicKey,
            playerStartingPosition[0], // Take the first position
          );
        }

        const updatedState: GameState = {
          ...gameState,
          players: updatedPlayers,
          gameStatus: updatedPlayers.length >= 2 ? "active" : "waiting",
        };

        set({ gameState: updatedState });
        return true;
      } else {
        // Create new game if not found
        const enhancedPlayer: Player = {
          ...player,
          resources: PirateGameManager.generateStartingResources(),
          ships: [],
          controlledTerritories: [],
          totalScore: 0,
          isActive: true,
        };

        const newGameState = PirateGameManager.createNewGame(
          [enhancedPlayer],
          gameId,
        );
        set({ gameState: newGameState });
        return true;
      }
    } catch (error) {
      console.error("Failed to join game:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to join game",
      });
      return false;
    }
  },

  // Process a game action
  processAction: async (action: GameAction): Promise<boolean> => {
    const { gameState } = get();
    if (!gameState) return false;

    try {
      set({ isLoading: true });

      const result = PirateGameManager.processTurnAction(gameState, action);

      if (result.success) {
        // Check for game end
        const gameEndCheck = PirateGameManager.checkGameEnd(
          result.updatedGameState,
        );

        let finalGameState = gameEndCheck.updatedGameState;

        if (!gameEndCheck.isGameOver) {
          // Advance to next turn if game continues
          finalGameState = PirateGameManager.advanceTurn(finalGameState);
        }

        set({
          gameState: finalGameState,
          showMessage: result.message,
          isLoading: false,
          selectedShipId: null,
        });
      } else {
        set({
          error: result.message,
          isLoading: false,
        });
      }

      return result.success;
    } catch (error) {
      console.error("Action processing failed:", error);
      set({
        error: error instanceof Error ? error.message : "Action failed",
        isLoading: false,
      });
      return false;
    }
  },

  // Move a ship
  moveShip: async (
    shipId: string,
    toX: number,
    toY: number,
    wallet: any,
    decisionTimeMs?: number,
  ): Promise<boolean> => {
    const { gameState } = get();
    if (!gameState) return false;

    try {
      set({ isLoading: true, error: null });

      // Call on-chain instruction
      const { moveShipClient } = await import("../lib/client/solanaClient");
      await moveShipClient(wallet, shipId, toX, toY, decisionTimeMs);

      // Also update local state for immediate feedback
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (!currentPlayer) {
        throw new Error("No current player found");
      }

      const action: GameAction = {
        id: `action_${Date.now()}`,
        gameId: gameState.gameId,
        player: currentPlayer.publicKey,
        type: "move_ship",
        data: { shipId, toCoordinate: `${toX},${toY}` },
        timestamp: Date.now(),
        decisionTimeMs,
      };

      const result = await get().processAction(action);
      set({ isLoading: false });
      return result;
    } catch (error) {
      console.error("Move ship failed:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to move ship",
        isLoading: false,
      });
      return false;
    }
  },

  // Attack with a ship
  attackWithShip: async (
    shipId: string,
    targetShipId: string,
    wallet: any,
  ): Promise<boolean> => {
    const { gameState } = get();
    if (!gameState) return false;

    try {
      set({ isLoading: true, error: null });

      // Call on-chain instruction
      const { attackShipClient } = await import("../lib/client/solanaClient");
      await attackShipClient(wallet, shipId, targetShipId);

      // Update local state
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (!currentPlayer) {
        throw new Error("No current player found");
      }

      const action: GameAction = {
        id: `action_${Date.now()}`,
        gameId: gameState.gameId,
        player: currentPlayer.publicKey,
        type: "attack",
        data: { shipId, targetShipId },
        timestamp: Date.now(),
      };

      const result = await get().processAction(action);
      set({ isLoading: false });
      return result;
    } catch (error) {
      console.error("Attack failed:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to attack",
        isLoading: false,
      });
      return false;
    }
  },

  // Claim territory
  claimTerritory: async (shipId: string, wallet: any): Promise<boolean> => {
    const { gameState } = get();
    if (!gameState) return false;

    try {
      set({ isLoading: true, error: null });

      // Call on-chain instruction
      const { claimTerritoryClient } = await import(
        "../lib/client/solanaClient"
      );
      await claimTerritoryClient(wallet, shipId);

      // Update local state
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (!currentPlayer) {
        throw new Error("No current player found");
      }

      const action: GameAction = {
        id: `action_${Date.now()}`,
        gameId: gameState.gameId,
        player: currentPlayer.publicKey,
        type: "claim_territory",
        data: { shipId },
        timestamp: Date.now(),
      };

      const result = await get().processAction(action);
      set({ isLoading: false });
      return result;
    } catch (error) {
      console.error("Claim territory failed:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to claim territory",
        isLoading: false,
      });
      return false;
    }
  },

  // Collect resources
  collectResources: async (wallet: any): Promise<boolean> => {
    const { gameState } = get();
    if (!gameState) return false;

    try {
      set({ isLoading: true, error: null });

      // Call on-chain instruction
      const { collectResourcesClient } = await import(
        "../lib/client/solanaClient"
      );
      await collectResourcesClient(wallet);

      // Update local state
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (!currentPlayer) {
        throw new Error("No current player found");
      }

      const action: GameAction = {
        id: `action_${Date.now()}`,
        gameId: gameState.gameId,
        player: currentPlayer.publicKey,
        type: "collect_resources",
        data: {},
        timestamp: Date.now(),
      };

      const result = await get().processAction(action);
      set({ isLoading: false });
      return result;
    } catch (error) {
      console.error("Collect resources failed:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to collect resources",
        isLoading: false,
      });
      return false;
    }
  },

  // Build ship
  buildShip: async (
    shipType: string,
    portX: number,
    portY: number,
    wallet: any,
  ): Promise<boolean> => {
    const { gameState } = get();
    if (!gameState) return false;

    try {
      set({ isLoading: true, error: null });

      const validShipType = shipType as
        | "sloop"
        | "frigate"
        | "galleon"
        | "flagship";

      // Call on-chain instruction
      const { buildShipClient } = await import("../lib/client/solanaClient");
      await buildShipClient(wallet, validShipType, portX, portY);

      // Update local state
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (!currentPlayer) {
        throw new Error("No current player found");
      }

      const action: GameAction = {
        id: `action_${Date.now()}`,
        gameId: gameState.gameId,
        player: currentPlayer.publicKey,
        type: "build_ship",
        data: {
          shipType: validShipType,
          toCoordinate: `${portX},${portY}`,
        },
        timestamp: Date.now(),
      };

      const result = await get().processAction(action);
      set({ isLoading: false });
      return result;
    } catch (error) {
      console.error("Build ship failed:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to build ship",
        isLoading: false,
      });
      return false;
    }
  },

  // End current player's turn
  endTurn: async () => {
    const { gameState } = get();
    if (!gameState) return;

    // Generate resources for current player before ending turn
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer) return;

    const income = GameBalance.generateTurnIncome(
      currentPlayer,
      gameState.gameMap,
    );

    // Update player resources
    const updatedPlayers = [...gameState.players];
    updatedPlayers[gameState.currentPlayerIndex] = {
      ...currentPlayer,
      resources: {
        gold: currentPlayer.resources.gold + (income.gold || 0),
        crew: currentPlayer.resources.crew + (income.crew || 0),
        cannons: currentPlayer.resources.cannons + (income.cannons || 0),
        supplies: currentPlayer.resources.supplies + (income.supplies || 0),
        wood: currentPlayer.resources.wood + (income.wood || 0),
        rum: currentPlayer.resources.rum || 0,
      },
    };

    // Check for victory conditions
    const victoryCheck = GameBalance.checkVictoryConditions(
      updatedPlayers[gameState.currentPlayerIndex],
      updatedPlayers,
      gameState.gameMap,
    );

    let stateWithResources = { ...gameState, players: updatedPlayers };

    if (victoryCheck.hasWon) {
      stateWithResources = {
        ...stateWithResources,
        gameStatus: "completed" as const,
        winner: currentPlayer.publicKey,
      };
    }

    const updatedGameState = PirateGameManager.advanceTurn(stateWithResources);
    const gameEndCheck = PirateGameManager.checkGameEnd(updatedGameState);

    // Show income message
    const incomeMessage = Object.entries(income)
      .filter(([_, amount]) => amount && amount > 0)
      .map(([resource, amount]) => `+${amount} ${resource}`)
      .join(", ");

    const message = victoryCheck.hasWon
      ? `🏆 Victory by ${victoryCheck.reason}!`
      : incomeMessage
        ? `💰 Turn income: ${incomeMessage}`
        : gameEndCheck.isGameOver
          ? "Battle Complete!"
          : null;

    set({
      gameState: gameEndCheck.updatedGameState,
      selectedShipId: null,
      showMessage: message,
    });

    if (message) {
      setTimeout(() => set({ showMessage: null }), 4000);
    }

    // Call on-chain victory check
    try {
      // We'll need a wallet here - this should be called from the UI with wallet context
      // const { endTurnClient } = await import("../lib/client/solanaClient");
      // await endTurnClient(wallet);
    } catch (error) {
      console.log("End turn on-chain call failed:", error);
      // Non-critical, game continues locally
    }
  },

  // Ship selection
  selectShip: (shipId: string | null) => {
    set({ selectedShipId: shipId });
  },

  // UI State management
  setMessage: (message: string | null) => {
    set({ showMessage: message });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  setGameState: (gameState: GameState) => {
    set({ gameState });
  },

  // Skill Mechanics: Start turn timer with auto-update (debounced 100ms)
  startTurn: () => {
    const { timerInterval } = get();
    // Clear any existing interval
    if (timerInterval) clearInterval(timerInterval);

    const startTime = Date.now();
    set({ turnStartTime: startTime, decisionTime: 0 });

    // Update decision time every 100ms (debounced for performance)
    const interval = setInterval(() => {
      const { turnStartTime: ts } = get();
      if (ts) {
        const elapsed = Date.now() - ts;
        set({ decisionTime: elapsed });
      }
    }, 100);

    set({ timerInterval: interval });
  },

  // Skill Mechanics: Stop turn timer and cleanup
  stopTurnTimer: () => {
    const { timerInterval } = get();
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    set({ timerInterval: null, turnStartTime: null, decisionTime: 0 });
  },

  // Skill Mechanics: Scan coordinate
  scanCoordinate: async (
    coordinateX: number,
    coordinateY: number,
  ): Promise<boolean> => {
    const {
      gameState,
      turnStartTime,
      scanChargesRemaining,
      scannedCoordinates,
    } = get();
    if (!gameState || !turnStartTime || scanChargesRemaining <= 0) return false;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer) return false;

    const decisionTimeMs = Date.now() - turnStartTime;
    const coordinate = `${coordinateX},${coordinateY}`;

    const action: GameAction = {
      id: `action_${Date.now()}`,
      gameId: gameState.gameId,
      player: currentPlayer.publicKey,
      type: "scan_coordinate",
      data: {
        coordinate,
      },
      timestamp: Date.now(),
      decisionTimeMs,
    };

    const result = await get().processAction(action);
    if (result) {
      // Update scanned coordinates and reduce charges
      const updated = new Set(scannedCoordinates);
      updated.add(coordinate);
      set({
        scannedCoordinates: updated,
        scanChargesRemaining: scanChargesRemaining - 1,
        showMessage: `🔍 Scanned ${coordinate}! (${scanChargesRemaining - 1} scans remaining)`,
      });
      setTimeout(() => set({ showMessage: null }), 2000);
    }
    return result;
  },

  // Skill Mechanics: Move ship with timing bonus
  moveShipTimed: async (
    shipId: string,
    toX: number,
    toY: number,
  ): Promise<boolean> => {
    const {
      gameState,
      turnStartTime,
      speedBonusAccumulated,
      averageDecisionTimeMs,
      totalMovesCount,
    } = get();
    if (!gameState || !turnStartTime) return false;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer) return false;

    const decisionTimeMs = Date.now() - turnStartTime;

    // Calculate speed bonus based on decision time thresholds
    const getSpeedBonus = (ms: number) => {
      if (ms < 5000) return 100;
      if (ms < 10000) return 50;
      if (ms < 15000) return 25;
      return 0;
    };

    const bonus = getSpeedBonus(decisionTimeMs);

    // Update average decision time
    const newTotalMoves = totalMovesCount + 1;
    const newAverageDecisionTime =
      (averageDecisionTimeMs * totalMovesCount + decisionTimeMs) /
      newTotalMoves;

    if (bonus > 0) {
      set({
        showMessage: `⚡ Speed bonus: +${bonus} points!`,
        speedBonusAccumulated: speedBonusAccumulated + bonus,
        averageDecisionTimeMs: newAverageDecisionTime,
        totalMovesCount: newTotalMoves,
      });
      setTimeout(() => set({ showMessage: null }), 2000);
    } else {
      set({
        averageDecisionTimeMs: newAverageDecisionTime,
        totalMovesCount: newTotalMoves,
      });
    }

    const action: GameAction = {
      id: `action_${Date.now()}`,
      gameId: gameState.gameId,
      player: currentPlayer.publicKey,
      type: "move_ship",
      data: {
        shipId,
        toCoordinate: `${toX},${toY}`,
      },
      timestamp: Date.now(),
      decisionTimeMs,
    };

    const result = await get().processAction(action);
    if (result) {
      get().stopTurnTimer();
    }
    return result;
  },

  // Getters for scanned coordinates
  getScannedCoordinates: () => {
    const { scannedCoordinates } = get();
    return Array.from(scannedCoordinates);
  },

  isCoordinateScanned: (coordinate: string) => {
    const { scannedCoordinates } = get();
    return scannedCoordinates.has(coordinate);
  },

  // Getters
  getCurrentPlayer: () => {
    const { gameState } = get();
    if (!gameState || gameState.players.length === 0) return null;
    return gameState.players[gameState.currentPlayerIndex] || null;
  },

  getMyShips: (playerPK: string) => {
    const { gameState } = get();
    if (!gameState) return [];

    const player = gameState.players.find((p) => p.publicKey === playerPK);
    return player?.ships.filter((ship) => ship.health > 0) || [];
  },

  isMyTurn: (walletPk?: string) => {
    const { gameState } = get();
    if (!gameState || gameState.gameStatus !== "active") return false;
    if (!walletPk) return false;
    const current = gameState.players[gameState.currentPlayerIndex];
    return current?.publicKey === walletPk;
  },

  getAllShips: () => {
    const { gameState } = get();
    if (!gameState) return [];

    return gameState.players
      .flatMap((player) => player.ships)
      .filter((ship) => ship.health > 0);
  },

  isPracticeMode: () => {
    const { gameMode } = get();
    return gameMode === 'practice';
  },

  // ===== PRACTICE MODE METHODS =====

  setGameMode: (mode: GameMode) => {
    set({ gameMode: mode });
  },

  startPracticeGame: (humanPlayer: Player, difficulty: 'novice' | 'pirate' | 'captain' | 'admiral' = 'pirate') => {
    try {
      // Check for saved game
      const savedGame = loadSavedPracticeGame();
      if (savedGame && savedGame.gameStatus !== 'completed') {
        set({
          gameState: savedGame,
          gameMode: 'practice',
          selectedShipId: null,
          scannedCoordinates: new Set(),
          scanChargesRemaining: 3,
          showMessage: '⚔️ Resumed your practice battle!',
        });
        setTimeout(() => set({ showMessage: null }), 3000);
        return true;
      }

      const practiceGame = PirateGameManager.createPracticeGame(humanPlayer, difficulty);
      savePracticeGame(practiceGame);
      set({
        gameState: practiceGame,
        gameMode: 'practice',
        selectedShipId: null,
        scannedCoordinates: new Set(),
        scanChargesRemaining: 3,
        showMessage: `⚔️ Practice mode started! Defeat ${difficulty} AI opponent!`,
      });
      setTimeout(() => set({ showMessage: null }), 3000);
      return true;
    } catch (error) {
      console.error('Failed to start practice game:', error);
      set({ error: 'Failed to start practice game' });
      return false;
    }
  },

  makePracticeMove: (shipId: string, toX: number, toY: number) => {
    const { gameState } = get();
    if (!gameState) return false;

    const action: GameAction = {
      id: `practice_${Date.now()}`,
      gameId: gameState.gameId,
      player: gameState.players[gameState.currentPlayerIndex]?.publicKey || '',
      type: 'move_ship',
      data: { shipId, toCoordinate: `${toX},${toY}` },
      timestamp: Date.now(),
    };

    const result = PirateGameManager.processTurnAction(gameState, action);
    if (result.success) {
      const advancedState = PirateGameManager.advanceTurn(result.updatedGameState);
      savePracticeGame(advancedState);
      set({ gameState: advancedState, selectedShipId: null });
      
      // Process AI turn after a delay
      setTimeout(() => get().processAITurn(), 1000);
      return true;
    }
    return false;
  },

  makePracticeAttack: (shipId: string, targetShipId: string) => {
    const { gameState } = get();
    if (!gameState) return false;

    const action: GameAction = {
      id: `practice_${Date.now()}`,
      gameId: gameState.gameId,
      player: gameState.players[gameState.currentPlayerIndex]?.publicKey || '',
      type: 'attack',
      data: { shipId, targetShipId },
      timestamp: Date.now(),
    };

    const result = PirateGameManager.processTurnAction(gameState, action);
    if (result.success) {
      const advancedState = PirateGameManager.advanceTurn(result.updatedGameState);
      savePracticeGame(advancedState);
      set({ gameState: advancedState });
      
      setTimeout(() => get().processAITurn(), 1000);
      return true;
    }
    return false;
  },

  makePracticeClaim: (shipId: string) => {
    const { gameState } = get();
    if (!gameState) return false;

    const action: GameAction = {
      id: `practice_${Date.now()}`,
      gameId: gameState.gameId,
      player: gameState.players[gameState.currentPlayerIndex]?.publicKey || '',
      type: 'claim_territory',
      data: { shipId },
      timestamp: Date.now(),
    };

    const result = PirateGameManager.processTurnAction(gameState, action);
    if (result.success) {
      const advancedState = PirateGameManager.advanceTurn(result.updatedGameState);
      savePracticeGame(advancedState);
      set({ gameState: advancedState });
      
      setTimeout(() => get().processAITurn(), 1000);
      return true;
    }
    return false;
  },

  processAITurn: () => {
    const { gameState, gameMode, isAIvsAIMode, playbackSpeed, aiDecisionCallback } = get();
    if (!gameState || gameMode !== 'practice') return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer?.publicKey.startsWith('AI_')) return;

    // Generate AI decision with reasoning (for AI vs AI educational mode)
    if (isAIvsAIMode && aiDecisionCallback) {
      const decision = PirateGameManager.generateAIDecision(gameState, currentPlayer);
      
      // Notify callback with reasoning
      aiDecisionCallback(decision.reasoning);
      
      // Process the action
      if (decision.action) {
        const result = PirateGameManager.processTurnAction(gameState, decision.action);
        if (result.success) {
          const advancedState = PirateGameManager.advanceTurn(result.updatedGameState);
          
          // Force a new object reference to trigger React re-renders
          const newState = {
            ...advancedState,
            players: advancedState.players.map(p => ({ ...p, ships: [...p.ships] })),
            turnNumber: advancedState.turnNumber,
          };
          
          set({ gameState: newState, currentAIReasoning: decision.reasoning });

          // Check for game end
          if (newState.gameStatus === 'completed') {
            const winner = newState.players.find(p => p.publicKey === newState.winner);
            set({ 
              showMessage: winner 
                ? `🏆 ${winner.username || 'AI'} wins the battle!`
                : '🏴‍☠️ Battle concluded!'
            });
            return;
          }

          // Continue processing if still AI's turn
          const nextPlayer = newState.players[newState.currentPlayerIndex];
          if (nextPlayer?.publicKey.startsWith('AI_')) {
            const baseDelay = 2000; // 2 seconds to show decision modal
            const adjustedDelay = baseDelay / playbackSpeed;
            setTimeout(() => get().processAITurn(), adjustedDelay);
          }
        } else {
          // Action failed, advance turn anyway
          const advancedState = PirateGameManager.advanceTurn(gameState);
          const newState = {
            ...advancedState,
            players: advancedState.players.map(p => ({ ...p, ships: [...p.ships] })),
            turnNumber: advancedState.turnNumber,
          };
          set({ gameState: newState });
          setTimeout(() => get().processAITurn(), 1000 / playbackSpeed);
        }
      } else {
        // No action, just pass turn
        const advancedState = PirateGameManager.advanceTurn(gameState);
        const newState = {
          ...advancedState,
          players: advancedState.players.map(p => ({ ...p, ships: [...p.ships] })),
          turnNumber: advancedState.turnNumber,
        };
        set({ gameState: newState });
        setTimeout(() => get().processAITurn(), 1000 / playbackSpeed);
      }
    } else {
      // Original flow for practice mode (no reasoning display)
      const updatedState = PirateGameManager.processAITurn(gameState);
      
      // Only save to localStorage if not in AI vs AI mode
      if (!isAIvsAIMode) {
        savePracticeGame(updatedState);
      }
      
      // Force a new object reference to trigger React re-renders
      const newState = {
        ...updatedState,
        players: updatedState.players.map(p => ({ ...p, ships: [...p.ships] })),
        turnNumber: updatedState.turnNumber,
      };
      
      set({ gameState: newState });

      // Check for game end
      if (newState.gameStatus === 'completed') {
        const winner = newState.players.find(p => p.publicKey === newState.winner);
        set({ 
          showMessage: winner 
            ? `🏆 ${winner.username || 'AI'} wins the battle!`
            : '🏴‍☠️ Battle concluded!'
        });
        return;
      }

      // Continue processing if still AI's turn
      const nextPlayer = newState.players[newState.currentPlayerIndex];
      if (nextPlayer?.publicKey.startsWith('AI_')) {
        const baseDelay = isAIvsAIMode ? 800 : 1500;
        const adjustedDelay = baseDelay / playbackSpeed;
        setTimeout(() => get().processAITurn(), adjustedDelay);
      }
    }
  },

  exitPracticeMode: () => {
    savePracticeGame(null); // Clear saved practice game
    set({
      gameState: null,
      gameMode: 'on-chain',
      selectedShipId: null,
      scannedCoordinates: new Set(),
      scanChargesRemaining: 3,
      isAIvsAIMode: false,
      playbackSpeed: 1,
      showMessage: 'Practice session ended. Ready for real battles!',
    });
    setTimeout(() => set({ showMessage: null }), 3000);
  },

  // ===== AI vs AI DEMO MODE =====

  startAIvsAIGame: (difficulty1: 'novice' | 'pirate' | 'captain' | 'admiral', difficulty2: 'novice' | 'pirate' | 'captain' | 'admiral', speed: number = 1) => {
    try {
      // Create two AI players
      const aiPlayer1 = PirateGameManager.createAIPlayer('demo', difficulty1);
      const aiPlayer2 = PirateGameManager.createAIPlayer('demo', difficulty2);

      // Create game with both AI players
      const demoGame = PirateGameManager.createNewGame([aiPlayer1, aiPlayer2], `ai_demo_${Date.now()}`);
      
      // Set game to active status
      const activeGame = {
        ...demoGame,
        gameStatus: 'active' as const,
      };

      set({
        gameState: activeGame,
        gameMode: 'practice',
        isAIvsAIMode: true,
        playbackSpeed: speed,
        selectedShipId: null,
        scannedCoordinates: new Set(),
        scanChargesRemaining: 3,
        showMessage: `⚔️ AI Battle: ${difficulty1} vs ${difficulty2}!`,
      });

      setTimeout(() => set({ showMessage: null }), 3000);

      // Start AI turns after a brief delay
      setTimeout(() => {
        const currentState = get().gameState;
        if (currentState && get().isAIvsAIMode) {
          get().processAITurn();
        }
      }, 1000);

      return true;
    } catch (error) {
      console.error('Failed to start AI vs AI game:', error);
      set({ error: 'Failed to start AI vs AI game' });
      return false;
    }
  },

  setPlaybackSpeed: (speed: number) => {
    set({ playbackSpeed: Math.max(0.5, Math.min(8, speed)) }); // Clamp between 0.5x and 8x
  },

  getPlaybackSpeed: () => {
    return get().playbackSpeed;
  },

  setAIDecisionCallback: (callback: ((reasoning: any) => void) | null) => {
    set({ aiDecisionCallback: callback });
  },
})) as any;

export const pirateGameStore = usePirateGameState;
