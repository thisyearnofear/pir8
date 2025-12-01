import { create } from 'zustand';
import { GameState, Player, GameItem, GameMove } from '../types/game';
import { PirateGameEngine } from '../lib/gameLogic';
import { useAnchorProgram, PIR8Instructions, getGamePDA } from '../lib/anchor';
import { useConnection } from '@solana/wallet-adapter-react';

interface GameStore {
  // Game State
  gameState: GameState | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  selectedCoordinate: string | null;
  showMessage: string | null;
  
  // Actions
  createGame: (players: Player[], entryFee: number, anchorProgram: any, maxPlayers?: number) => Promise<boolean>;
  joinGame: (gameId: string, player: Player) => void;
  makeMove: (coordinate: string) => Promise<boolean>;
  handlePlayerAction: (action: string, targetPlayerId?: string, amount?: number, coordinate?: string) => Promise<void>;
  setSelectedCoordinate: (coordinate: string | null) => void;
  setMessage: (message: string | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Getters
  getCurrentPlayer: () => Player | null;
  getAvailableCoordinates: () => string[];
  isMyTurn: (walletPk?: string) => boolean;
  getTotalScore: (playerId: string) => number;
}

export const useGameState = create<GameStore>((set, get) => ({
  // Initial state
  gameState: null,
  isLoading: false,
  error: null,
  selectedCoordinate: null,
  showMessage: null,

  // Create a new game (on-chain if program available, otherwise local)
  createGame: async (players: Player[], entryFee: number, anchorProgram: any, maxPlayers: number = 4): Promise<boolean> => {
    console.log("[useGameState.createGame] Starting...", { players, entryFee, maxPlayers, hasProgramProvider: !!anchorProgram?.provider });
    
    if (!anchorProgram?.provider) {
      console.error("[useGameState.createGame] No provider available");
      set({ error: 'Wallet not connected' });
      return false;
    }

    try {
      console.log("[useGameState.createGame] Setting isLoading: true");
      set({ isLoading: true });

      if (anchorProgram.program) {
        console.log("[useGameState.createGame] Using on-chain program");
        const instructions = new PIR8Instructions(anchorProgram.program, anchorProgram.provider);
        console.log("[useGameState.createGame] Calling instructions.createGame with fee:", Math.floor(entryFee * 1e9), "maxPlayers:", maxPlayers);
        
        const signature = await instructions.createGame(Math.floor(entryFee * 1e9), maxPlayers);
        console.log("[useGameState.createGame] Transaction signature:", signature);
        
        await anchorProgram.provider.connection.confirmTransaction(signature);
        console.log("[useGameState.createGame] Transaction confirmed");
        
        const gameId = `onchain_${Date.now()}`;
        const grid = PirateGameEngine.createGrid();
        
        const newGameState: GameState = {
          gameId,
          players,
          currentPlayerIndex: 0,
          grid,
          chosenCoordinates: [],
          gameStatus: 'waiting',
          turnTimeRemaining: 30,
        };
        
        console.log("[useGameState.createGame] Setting game state to waiting:", newGameState);
        set({ gameState: newGameState, isLoading: false, error: null });
        return true;
      }

      console.log("[useGameState.createGame] No program, using local game");
      const localId = `local_${Date.now()}`;
      const localGrid = PirateGameEngine.createGrid();
      const localState: GameState = {
        gameId: localId,
        players,
        currentPlayerIndex: 0,
        grid: localGrid,
        chosenCoordinates: [],
        gameStatus: 'waiting',
        turnTimeRemaining: 30,
      };
      console.log("[useGameState.createGame] Setting local game state:", localState);
      set({ gameState: localState, isLoading: false, error: null });
      return true;
    } catch (error) {
      console.error("[useGameState.createGame] Error:", error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to create game';
      console.error("[useGameState.createGame] Setting error state:", errorMsg);
      set({ 
        isLoading: false, 
        error: errorMsg
      });
      return false;
    }
  },

  // Join an existing game
  joinGame: (gameId: string, player: Player) => {
    const { gameState } = get();
    if (!gameState || gameState.gameId !== gameId) {
      set({ error: 'Game not found' });
      return;
    }

    const updatedPlayers = [...gameState.players, player];
    const updatedGameState: GameState = {
      ...gameState,
      players: updatedPlayers,
      gameStatus: updatedPlayers.length >= 2 ? 'active' : 'waiting',
    };

    set({ gameState: updatedGameState });
  },

  // Make a move (coordinate selection) (ENHANCED: Now uses Anchor program)
  makeMove: async (coordinate: string) => {
    const { gameState } = get();
    if (!gameState || gameState.gameStatus !== 'active') {
      set({ error: 'Game is not active' });
      return false;
    }

    // Validate coordinate
    const validation = PirateGameEngine.validateCoordinate(coordinate, gameState.chosenCoordinates);
    if (!validation.isValid) {
      set({ error: validation.error });
      return false;
    }

    try {
      set({ isLoading: true });
      
      const item = PirateGameEngine.getItemAtCoordinate(gameState.grid, coordinate);
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      
      const effect = PirateGameEngine.applyItemEffect(item, currentPlayer);
      
      const updatedPlayers = [...gameState.players];
      updatedPlayers[gameState.currentPlayerIndex] = effect.updatedPlayer;

      let nextPlayerIndex = gameState.currentPlayerIndex;
      let pendingActionType: string | undefined = undefined;

      if (effect.requiresInput) {
        if (item === 'GRINCH') pendingActionType = 'steal';
        else if (item === 'PUDDING') pendingActionType = 'kill';
        else if (item === 'PRESENT') pendingActionType = 'gift';
        else if (item === 'MISTLETOE') pendingActionType = 'swap';
        else if (item === 'TREE') pendingActionType = 'choose';
      } else {
        nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
      }

      const updatedGameState: GameState = {
        ...gameState,
        players: updatedPlayers,
        chosenCoordinates: [...gameState.chosenCoordinates, coordinate],
        currentCombination: coordinate,
        currentPlayerIndex: nextPlayerIndex,
        pendingActionType,
        gameStatus: PirateGameEngine.isGameOver([...gameState.chosenCoordinates, coordinate]) 
          ? 'completed' 
          : 'active',
      };

      // If game is completed, determine winner
      if (updatedGameState.gameStatus === 'completed') {
        const winner = PirateGameEngine.determineWinner(updatedGameState.players);
        updatedGameState.winner = winner.publicKey;
      }

      set({ 
        gameState: updatedGameState, 
        isLoading: false, 
        showMessage: effect.message,
        selectedCoordinate: null 
      });

      return true;
    } catch (error) {
      console.error('Make move error:', error);
      
      // Enhanced error handling with user-friendly messages
      let errorMessage = 'Failed to make move';
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          errorMessage = '🏴‍☠️ Transaction cancelled by captain\'s orders';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = '💰 Not enough SOL for this move';
        } else if (error.message.includes('Not your turn')) {
          errorMessage = '⏳ Hold your horses! It\'s not your turn yet';
        } else if (error.message.includes('Coordinate already chosen')) {
          errorMessage = '🎯 That treasure spot is already claimed, matey!';
        } else {
          errorMessage = `⚡ ${error.message}`;
        }
      }
      
      set({ 
        isLoading: false, 
        error: errorMessage
      });
      return false;
    }
  },

  // Handle player actions (steal, swap, etc.)
  handlePlayerAction: async (action: string, targetPlayerId?: string, amount?: number, coordinate?: string) => {
    const { gameState } = get();
    if (!gameState) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const targetPlayer = gameState.players.find(p => p.publicKey === targetPlayerId);
    
    if (!targetPlayer && action !== 'choose') {
      set({ error: 'Target player not found' });
      return;
    }

    try {
      if (action === 'choose' && coordinate) {
        const v = PirateGameEngine.validateCoordinate(coordinate, gameState.chosenCoordinates);
        if (!v.isValid) {
          set({ error: v.error || 'Invalid coordinate' });
          return;
        }
        set({ gameState: { ...gameState, pendingActionType: undefined } });
        await get().makeMove(coordinate);
        return;
      }

      if (targetPlayer) {
        const result = PirateGameEngine.handlePlayerAction(action, currentPlayer, targetPlayer, amount);
        const updatedPlayers = gameState.players.map(p => {
          if (p.publicKey === currentPlayer.publicKey) return result.updatedPlayer;
          if (p.publicKey === targetPlayer.publicKey) return result.updatedTargetPlayer;
          return p;
        });
        const nextIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
        const updatedState: GameState = {
          ...gameState,
          players: updatedPlayers,
          currentPlayerIndex: nextIndex,
          pendingActionType: undefined,
        };
        set({ gameState: updatedState, showMessage: result.message });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Action failed' });
    }
  },

  // UI State setters
  setSelectedCoordinate: (coordinate: string | null) => {
    set({ selectedCoordinate: coordinate });
  },

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

  getAvailableCoordinates: () => {
    const { gameState } = get();
    if (!gameState) return [];
    
    return PirateGameEngine.generateAllCoordinates().filter(coord => 
      !gameState.chosenCoordinates.includes(coord)
    );
  },

  isMyTurn: (walletPk?: string) => {
    const { gameState } = get();
    if (!gameState || gameState.gameStatus !== 'active') return false;
    if (!walletPk) return false;
    const current = gameState.players[gameState.currentPlayerIndex];
    return current.publicKey === walletPk;
  },

  getTotalScore: (playerId: string) => {
    const { gameState } = get();
    if (!gameState) return 0;
    
    const player = gameState.players.find(p => p.publicKey === playerId);
    if (!player) return 0;
    
    return player.points + player.bankedPoints;
  },
}));
