import { create } from 'zustand';
import { GameState, Player, GameAction, Ship, Coordinate } from '../types/game';
import { PirateGameEngine } from '../lib/gameLogic';
import { PirateGameManager } from '../lib/pirateGameEngine';
import { GameBalance } from '../lib/gameBalance';

interface PirateGameStore {
  // Game State
  gameState: GameState | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  showMessage: string | null;
  selectedShipId: string | null;
  
  // Actions
  createGame: (players: Player[], entryFee: number) => Promise<boolean>;
  joinGame: (gameId: string, player: Player) => boolean;
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

  // Create a new pirate game
  createGame: async (players: Player[], entryFee: number): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });
      
      // Generate unique game ID
      const gameId = `pirate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create new pirate game
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

  // Join an existing pirate game
  joinGame: (gameId: string, player: Player): boolean => {
    try {
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
    const action: GameAction = {
      id: `action_${Date.now()}`,
      gameId: gameState.gameId,
      player: currentPlayer.publicKey,
      type: 'build_ship',
      data: {
        shipType,
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