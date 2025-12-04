import { create } from 'zustand';
import { useEffect } from 'react';
import { GameState, Player, GameAction, Ship, Coordinate } from '../types/game';
import { PirateGameEngine } from '../lib/gameLogic';
import { PirateGameManager } from '../lib/pirateGameEngine';
import { GameBalance } from '../lib/gameBalance';
import { createNewGameFlow, joinGameFlow } from '../lib/server/anchorActions';

interface PirateGameStore {
  // Game State
  gameState: GameState | null;
  
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
  
  // Actions
  createGame: (players: Player[], entryFee: number) => Promise<boolean>;
  joinGame: (gameId: string, player: Player) => Promise<boolean>;
  processAction: (action: GameAction) => Promise<boolean>;
  selectShip: (shipId: string | null) => void;
  moveShip: (shipId: string, toCoordinate: string) => Promise<boolean>;
  attackWithShip: (shipId: string, targetShipId: string) => Promise<boolean>;
  claimTerritory: (shipId: string, coordinate: string) => Promise<boolean>;
  collectResources: (shipId: string) => Promise<boolean>;
  buildShip: (shipType: string, coordinate: string) => Promise<boolean>;
  endTurn: () => void;
  setMessage: (message: string | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Skill Mechanics
  startTurn: () => void;
  stopTurnTimer: () => void;
  scanCoordinate: (coordinateX: number, coordinateY: number) => Promise<boolean>;
  moveShipTimed: (shipId: string, toCoordinate: string) => Promise<boolean>;
  getScannedCoordinates: () => string[];
  isCoordinateScanned: (coordinate: string) => boolean;
  
  // Getters
  getCurrentPlayer: () => Player | null;
  getMyShips: (playerPK: string) => Ship[];
  isMyTurn: (walletPk?: string) => boolean;
  getAllShips: () => Ship[];
}

export const usePirateGameState = create<PirateGameStore>((set, get) => ({
  // Initial state
  gameState: null,
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

  // Create a new pirate game on-chain
  createGame: async (players: Player[], entryFee: number): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });
      
      // Create game on-chain via server action
      console.log('🚀 Creating game on Solana blockchain...');
      const gameIdNumber = await createNewGameFlow();
      console.log('✅ Game created on-chain with ID:', gameIdNumber);
      
      // Create corresponding local game state with on-chain game ID
      const gameId = `pirate_${gameIdNumber}`;
      const gameState = PirateGameManager.createNewGame(players, gameId);
      
      set({ 
        gameState, 
        isLoading: false, 
        selectedShipId: null 
      });
      return true;
      
    } catch (error) {
      console.error("Failed to create pirate game:", error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create pirate game',
        isLoading: false
      });
      return false;
    }
  },

  // Join an existing pirate game on-chain
  joinGame: async (gameId: string, player: Player): Promise<boolean> => {
    try {
      // Parse game ID - expects format like "pirate_123" or just "123"
      let gameIdNumber: number;
      if (gameId.startsWith('pirate_')) {
        gameIdNumber = parseInt(gameId.split('_')[1], 10);
      } else {
        gameIdNumber = parseInt(gameId, 10);
      }
      
      if (isNaN(gameIdNumber)) {
        throw new Error(`Invalid game ID format: ${gameId}`);
      }
      
      // Join game on-chain via server action
      console.log('🚀 Joining game on Solana blockchain...', gameIdNumber);
      await joinGameFlow(gameIdNumber);
      console.log('✅ Successfully joined game on-chain');
      
      // Update local game state
      const { gameState } = get();
      
      if (gameState && gameState.gameId === gameId) {
        // Add player to existing game
        const enhancedPlayer: Player = {
          ...player,
          resources: PirateGameEngine.generateStartingResources(),
          ships: [],
          controlledTerritories: [],
          totalScore: 0,
          isActive: true,
        };
        
        const updatedPlayers = [...gameState.players, enhancedPlayer];
        
        // Assign starting fleet to new player
        const startingPositions = PirateGameManager.generateStartingPositions(
          updatedPlayers.length, 
          gameState.gameMap.size
        );
        
        if (startingPositions[updatedPlayers.length - 1]) {
          enhancedPlayer.ships = PirateGameEngine.createStartingFleet(
            player.publicKey,
            startingPositions[updatedPlayers.length - 1]
          );
        }
        
        const updatedState: GameState = {
          ...gameState,
          players: updatedPlayers,
          gameStatus: updatedPlayers.length >= 2 ? 'active' : 'waiting'
        };
        
        set({ gameState: updatedState });
        return true;
      } else {
        // Create new game if not found
        const enhancedPlayer: Player = {
          ...player,
          resources: PirateGameEngine.generateStartingResources(),
          ships: [],
          controlledTerritories: [],
          totalScore: 0,
          isActive: true,
        };
        
        const newGameState = PirateGameManager.createNewGame([enhancedPlayer], gameId);
        set({ gameState: newGameState });
        return true;
      }
    } catch (error) {
      console.error("Failed to join game:", error);
      set({ error: error instanceof Error ? error.message : 'Failed to join game' });
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
        const gameEndCheck = PirateGameManager.checkGameEnd(result.updatedGameState);
        
        let finalGameState = gameEndCheck.updatedGameState;
        
        if (!gameEndCheck.isGameOver) {
          // Advance to next turn if game continues
          finalGameState = PirateGameManager.advanceTurn(finalGameState);
        }
        
        set({ 
          gameState: finalGameState,
          showMessage: result.message,
          isLoading: false,
          selectedShipId: null
        });
      } else {
        set({ 
          error: result.message,
          isLoading: false
        });
      }
      
      return result.success;
      
    } catch (error) {
      console.error("Action processing failed:", error);
      set({ 
        error: error instanceof Error ? error.message : 'Action failed',
        isLoading: false
      });
      return false;
    }
  },

  // Move a ship
  moveShip: async (shipId: string, toCoordinate: string): Promise<boolean> => {
    const { gameState } = get();
    if (!gameState) return false;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const action: GameAction = {
      id: `action_${Date.now()}`,
      gameId: gameState.gameId,
      player: currentPlayer.publicKey,
      type: 'move_ship',
      data: {
        shipId,
        toCoordinate
      },
      timestamp: Date.now()
    };

    return get().processAction(action);
  },

  // Attack with a ship
  attackWithShip: async (shipId: string, targetShipId: string): Promise<boolean> => {
    const { gameState } = get();
    if (!gameState) return false;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const action: GameAction = {
      id: `action_${Date.now()}`,
      gameId: gameState.gameId,
      player: currentPlayer.publicKey,
      type: 'attack',
      data: {
        shipId,
        targetShipId
      },
      timestamp: Date.now()
    };

    return get().processAction(action);
  },

  // Claim territory
  claimTerritory: async (shipId: string, coordinate: string): Promise<boolean> => {
    const { gameState } = get();
    if (!gameState) return false;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const action: GameAction = {
      id: `action_${Date.now()}`,
      gameId: gameState.gameId,
      player: currentPlayer.publicKey,
      type: 'claim_territory',
      data: {
        shipId,
        toCoordinate: coordinate
      },
      timestamp: Date.now()
    };

    return get().processAction(action);
  },

  // Collect resources
  collectResources: async (shipId: string): Promise<boolean> => {
    const { gameState } = get();
    if (!gameState) return false;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const action: GameAction = {
      id: `action_${Date.now()}`,
      gameId: gameState.gameId,
      player: currentPlayer.publicKey,
      type: 'collect_resources',
      data: {
        shipId
      },
      timestamp: Date.now()
    };

    return get().processAction(action);
  },

  // Build ship
  buildShip: async (shipType: string, coordinate: string): Promise<boolean> => {
    const { gameState } = get();
    if (!gameState) return false;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const validShipType = shipType as 'sloop' | 'frigate' | 'galleon' | 'flagship';
    const action: GameAction = {
      id: `action_${Date.now()}`,
      gameId: gameState.gameId,
      player: currentPlayer.publicKey,
      type: 'build_ship',
      data: {
        shipType: validShipType,
        toCoordinate: coordinate
      },
      timestamp: Date.now()
    };

    return get().processAction(action);
  },

  // End current player's turn
  endTurn: () => {
    const { gameState } = get();
    if (!gameState) return;

    // Generate resources for current player before ending turn
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const income = GameBalance.generateTurnIncome(currentPlayer, gameState.gameMap);
    
    // Update player resources
    const updatedPlayers = [...gameState.players];
    updatedPlayers[gameState.currentPlayerIndex] = {
      ...currentPlayer,
      resources: {
        gold: currentPlayer.resources.gold + (income.gold || 0),
        crew: currentPlayer.resources.crew + (income.crew || 0),
        cannons: currentPlayer.resources.cannons + (income.cannons || 0),
        supplies: currentPlayer.resources.supplies + (income.supplies || 0),
      }
    };

    // Check for victory conditions
    const victoryCheck = GameBalance.checkVictoryConditions(
      updatedPlayers[gameState.currentPlayerIndex], 
      updatedPlayers, 
      gameState.gameMap
    );

    let stateWithResources = { ...gameState, players: updatedPlayers };
    
    if (victoryCheck.hasWon) {
      stateWithResources = {
        ...stateWithResources,
        gameStatus: 'completed' as const,
        winner: currentPlayer.publicKey
      };
    }

    const updatedGameState = PirateGameManager.advanceTurn(stateWithResources);
    const gameEndCheck = PirateGameManager.checkGameEnd(updatedGameState);
    
    // Show income message
    const incomeMessage = Object.entries(income)
      .filter(([_, amount]) => amount && amount > 0)
      .map(([resource, amount]) => `+${amount} ${resource}`)
      .join(', ');
    
    const message = victoryCheck.hasWon 
      ? `🏆 Victory by ${victoryCheck.reason}!`
      : incomeMessage 
      ? `💰 Turn income: ${incomeMessage}`
      : gameEndCheck.isGameOver 
      ? 'Battle Complete!' 
      : null;
    
    set({ 
      gameState: gameEndCheck.updatedGameState,
      selectedShipId: null,
      showMessage: message
    });

    if (message) {
      setTimeout(() => set({ showMessage: null }), 4000);
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
  scanCoordinate: async (coordinateX: number, coordinateY: number): Promise<boolean> => {
    const { gameState, turnStartTime, scanChargesRemaining, scannedCoordinates } = get();
    if (!gameState || !turnStartTime || scanChargesRemaining <= 0) return false;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const decisionTimeMs = Date.now() - turnStartTime;
    const coordinate = `${coordinateX},${coordinateY}`;
    
    const action: GameAction = {
      id: `action_${Date.now()}`,
      gameId: gameState.gameId,
      player: currentPlayer.publicKey,
      type: 'scan_coordinate',
      data: {
        coordinate
      },
      timestamp: Date.now(),
      decisionTimeMs
    };

    const result = await get().processAction(action);
    if (result) {
      // Update scanned coordinates and reduce charges
      const updated = new Set(scannedCoordinates);
      updated.add(coordinate);
      set({ 
        scannedCoordinates: updated,
        scanChargesRemaining: scanChargesRemaining - 1,
        showMessage: `🔍 Scanned ${coordinate}! (${scanChargesRemaining - 1} scans remaining)`
      });
      setTimeout(() => set({ showMessage: null }), 2000);
    }
    return result;
  },

  // Skill Mechanics: Move ship with timing bonus
  moveShipTimed: async (shipId: string, toCoordinate: string): Promise<boolean> => {
    const { gameState, turnStartTime, speedBonusAccumulated, averageDecisionTimeMs, totalMovesCount } = get();
    if (!gameState || !turnStartTime) return false;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
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
      (averageDecisionTimeMs * totalMovesCount + decisionTimeMs) / newTotalMoves;
    
    if (bonus > 0) {
      set({ 
        showMessage: `⚡ Speed bonus: +${bonus} points!`,
        speedBonusAccumulated: speedBonusAccumulated + bonus,
        averageDecisionTimeMs: newAverageDecisionTime,
        totalMovesCount: newTotalMoves
      });
      setTimeout(() => set({ showMessage: null }), 2000);
    } else {
      set({
        averageDecisionTimeMs: newAverageDecisionTime,
        totalMovesCount: newTotalMoves
      });
    }
    
    const action: GameAction = {
      id: `action_${Date.now()}`,
      gameId: gameState.gameId,
      player: currentPlayer.publicKey,
      type: 'move_ship',
      data: {
        shipId,
        toCoordinate
      },
      timestamp: Date.now(),
      decisionTimeMs
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
    if (!gameState) return null;
    return gameState.players[gameState.currentPlayerIndex];
  },

  getMyShips: (playerPK: string) => {
    const { gameState } = get();
    if (!gameState) return [];
    
    const player = gameState.players.find(p => p.publicKey === playerPK);
    return player?.ships.filter(ship => ship.health > 0) || [];
  },

  isMyTurn: (walletPk?: string) => {
    const { gameState } = get();
    if (!gameState || gameState.gameStatus !== 'active') return false;
    if (!walletPk) return false;
    const current = gameState.players[gameState.currentPlayerIndex];
    return current.publicKey === walletPk;
  },

  getAllShips: () => {
    const { gameState } = get();
    if (!gameState) return [];
    
    return gameState.players.flatMap(player => player.ships).filter(ship => ship.health > 0);
  },
}));