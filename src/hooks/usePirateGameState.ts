import { create } from "zustand";
import { GameState, Player, GameAction, Ship } from "../types/game";
import { PirateGameManager } from "../lib/pirateGameEngine";

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
  lobbies: any[];

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
  aiReasoningHistory: any[];

  // Actions - On-chain (require wallet)
  fetchLobbies: () => Promise<void>;
  createGame: (
    gameId: number,
    players: Player[],
    _entryFee: number,
    wallet: any,
  ) => Promise<boolean>;
  joinGame: (gameId: string | number, player: Player, wallet: any) => Promise<boolean>;
  startGame: (gameId: number, wallet: any) => Promise<boolean>;
  processAction: (action: GameAction) => Promise<boolean>;
  selectShip: (shipId: string | null) => void;
  moveShip: (
    gameId: number,
    shipId: string,
    toX: number,
    toY: number,
    wallet: any,
    decisionTimeMs?: number,
  ) => Promise<boolean>;
  attackWithShip: (
    gameId: number,
    shipId: string,
    targetShipId: string,
    wallet: any,
  ) => Promise<boolean>;
  claimTerritory: (gameId: number, shipId: string, wallet: any) => Promise<boolean>;
  collectResources: (gameId: number, wallet: any) => Promise<boolean>;
  buildShip: (
    gameId: number,
    shipType: string,
    portX: number,
    portY: number,
    wallet: any,
  ) => Promise<boolean>;
  endTurn: (gameId: number, wallet: any) => Promise<void>;
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
    gameId: number,
    coordinateX: number,
    coordinateY: number,
    wallet: any,
  ) => Promise<boolean>;
  moveShipTimed: (gameId: number, shipId: string, toX: number, toY: number, wallet: any) => Promise<boolean>;
  getScannedCoordinates: () => string[];
  isCoordinateScanned: (coordinate: string) => boolean;

  // Getters
  getCurrentPlayer: () => Player | null;
  getMyShips: (playerPK: string) => Ship[];
  isMyTurn: (walletPk?: string) => boolean;
  getAllShips: () => Ship[];
  isPracticeMode: () => boolean;
  fetchGameState: (gameId: number, wallet: any) => Promise<GameState | null>;
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
  lobbies: [],
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
  aiReasoningHistory: [] as any[],

  fetchLobbies: async () => {
    try {
      set({ isLoading: true });
      const { Connection, PublicKey } = await import('@solana/web3.js');
      const { SOLANA_CONFIG } = await import('../utils/constants');
      const connection = new Connection(SOLANA_CONFIG.RPC_URL || 'https://api.devnet.solana.com');
      const programId = new PublicKey(SOLANA_CONFIG.PROGRAM_ID!);

      // Fetch all PirateGame accounts
      const accounts = await (connection as any).getProgramAccounts(programId, {
        filters: [
          { dataSize: 10240 } // PirateGame::SPACE
        ]
      });

      const lobbies = accounts.map((acc: any) => ({
        address: acc.pubkey.toBase58(),
        // Metadata can be parsed here once IDL is fully compiled
      }));

      set({ lobbies, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch lobbies:', error);
      set({ isLoading: false });
    }
  },

  fetchGameState: async (gameId: number, wallet: any): Promise<GameState | null> => {
    try {
      const { fetchGameStateClient } = await import("../lib/client/solanaClient");
      const onChainState = await fetchGameStateClient(wallet, gameId);
      if (!onChainState) return null;

      // Transform on-chain to local (Aggressive Consolidation: use shared mapper)
      const { mapOnChainToLocal } = await import('../utils/helpers');
      return mapOnChainToLocal(onChainState, gameId.toString());
    } catch (e) {
      return null;
    }
  },

  // Start the game
  startGame: async (gameId: number, wallet: any): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });
      const { startGameClient } = await import("../lib/client/solanaClient");
      await startGameClient(wallet, gameId);

      const state = await get().fetchGameState(gameId, wallet);
      if (state) set({ gameState: state });

      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: 'Failed to start game', isLoading: false });
      return false;
    }
  },

  // Join/Enter a game
  createGame: async (
    gameId: number,
    _players: Player[],
    _entryFee: number,
    wallet: any,
  ): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });
      const { createGameClient } = await import("../lib/client/solanaClient");
      await createGameClient(wallet, gameId);

      const state = await get().fetchGameState(gameId, wallet);
      if (state) set({ gameState: state });

      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: 'Failed to create game', isLoading: false });
      return false;
    }
  },

  // Join a game
  joinGame: async (
    gameId: string | number,
    _player: Player,
    wallet: any,
  ): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });
      const gId = typeof gameId === 'string' ? parseInt(gameId.replace('onchain_', ''), 10) : gameId;

      const { joinGameClient } = await import("../lib/client/solanaClient");
      await joinGameClient(wallet, gId);

      const state = await get().fetchGameState(gId, wallet);
      if (state) set({ gameState: state });

      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: 'Failed to join game', isLoading: false });
      return false;
    }
  },

  // Move a ship
  moveShip: async (
    gameId: number,
    shipId: string,
    toX: number,
    toY: number,
    wallet: any,
    decisionTimeMs?: number,
  ): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });
      const { moveShipClient } = await import("../lib/client/solanaClient");
      await moveShipClient(wallet, gameId, shipId, toX, toY, decisionTimeMs);

      const state = await get().fetchGameState(gameId, wallet);
      if (state) set({ gameState: state });
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: 'Move failed', isLoading: false });
      return false;
    }
  },

  // Attack with a ship
  attackWithShip: async (
    gameId: number,
    shipId: string,
    targetShipId: string,
    wallet: any,
  ): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });
      const { attackShipClient } = await import("../lib/client/solanaClient");
      await attackShipClient(wallet, gameId, shipId, targetShipId);

      const state = await get().fetchGameState(gameId, wallet);
      if (state) set({ gameState: state });
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: 'Attack failed', isLoading: false });
      return false;
    }
  },

  // Claim territory
  claimTerritory: async (gameId: number, shipId: string, wallet: any): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });
      const { claimTerritoryClient } = await import("../lib/client/solanaClient");
      await claimTerritoryClient(wallet, gameId, shipId);

      const state = await get().fetchGameState(gameId, wallet);
      if (state) set({ gameState: state });
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: 'Claim failed', isLoading: false });
      return false;
    }
  },

  // Collect resources
  collectResources: async (gameId: number, wallet: any): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });
      const { collectResourcesClient } = await import("../lib/client/solanaClient");
      await collectResourcesClient(wallet, gameId);

      const state = await get().fetchGameState(gameId, wallet);
      if (state) set({ gameState: state });
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: 'Collection failed', isLoading: false });
      return false;
    }
  },

  // Build ship
  buildShip: async (
    gameId: number,
    shipType: string,
    portX: number,
    portY: number,
    wallet: any,
  ): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });
      const { buildShipClient } = await import("../lib/client/solanaClient");
      await buildShipClient(wallet, gameId, shipType, portX, portY);

      const state = await get().fetchGameState(gameId, wallet);
      if (state) set({ gameState: state });
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: 'Build failed', isLoading: false });
      return false;
    }
  },

  // End current player's turn
  endTurn: async (gameId: number, wallet: any) => {
    try {
      const { endTurnClient } = await import("../lib/client/solanaClient");
      await endTurnClient(wallet, gameId);
      const state = await get().fetchGameState(gameId, wallet);
      if (state) set({ gameState: state });
    } catch (e) { }
  },

  // Skill Mechanics: Scan coordinate
  scanCoordinate: async (
    gameId: number,
    coordinateX: number,
    coordinateY: number,
    wallet: any,
  ): Promise<boolean> => {
    try {
      const { scanCoordinateClient } = await import("../lib/client/solanaClient");
      await scanCoordinateClient(wallet, gameId, coordinateX, coordinateY);
      const state = await get().fetchGameState(gameId, wallet);
      if (state) set({ gameState: state });
      return true;
    } catch (e) { return false; }
  },

  // Skill Mechanics: Move ship with timing bonus
  moveShipTimed: async (
    gameId: number,
    shipId: string,
    toX: number,
    toY: number,
    wallet: any,
  ): Promise<boolean> => {
    return await get().moveShip(gameId, shipId, toX, toY, wallet, 5000); // Placeholder timing
  },

  processAction: async (_action: GameAction): Promise<boolean> => {
    return true; // Managed by on-chain state sync
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

          // Update reasoning history (keep last 20 entries)
          const prevHistory = get().aiReasoningHistory || [];
          const newHistory = [decision.reasoning, ...prevHistory].slice(0, 20);
          set({ gameState: newState, currentAIReasoning: decision.reasoning, aiReasoningHistory: newHistory });

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

      // Ensure players have required arrays initialized
      [aiPlayer1, aiPlayer2].forEach(player => {
        player.ships = player.ships || [];
        player.controlledTerritories = player.controlledTerritories || [];
        player.scannedCoordinates = player.scannedCoordinates || [];
      });

      // Create game with both AI players
      const demoGame = PirateGameManager.createNewGame([aiPlayer1, aiPlayer2], `ai_demo_${Date.now()}`);

      // Ensure game state has required arrays
      const activeGame = {
        ...demoGame,
        gameStatus: 'active' as const,
        players: demoGame.players.map(player => ({
          ...player,
          ships: player.ships || [],
          controlledTerritories: player.controlledTerritories || [],
          scannedCoordinates: player.scannedCoordinates || []
        })),
        pendingActions: demoGame.pendingActions || [],
        eventLog: demoGame.eventLog || []
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
        aiReasoningHistory: [], // Clear history for new game
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
