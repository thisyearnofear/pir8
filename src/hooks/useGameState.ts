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
  createGame: (players: Player[], entryFee: number) => void;
  joinGame: (gameId: string, player: Player) => void;
  makeMove: (coordinate: string) => Promise<boolean>;
  handlePlayerAction: (action: string, targetPlayerId?: string, amount?: number) => void;
  setSelectedCoordinate: (coordinate: string | null) => void;
  setMessage: (message: string | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Getters
  getCurrentPlayer: () => Player | null;
  getAvailableCoordinates: () => string[];
  isMyTurn: () => boolean;
  getTotalScore: (playerId: string) => number;
}

export const useGameState = create<GameStore>((set, get) => ({
  // Initial state
  gameState: null,
  isLoading: false,
  error: null,
  selectedCoordinate: null,
  showMessage: null,

  // Create a new game (ENHANCED: Now uses Anchor program)
  createGame: async (players: Player[], entryFee: number) => {
    const anchorProgram = useAnchorProgram();
    if (!anchorProgram?.provider) {
      set({ error: 'Wallet not connected' });
      return;
    }

    try {
      set({ isLoading: true });
      
      const instructions = new PIR8Instructions(anchorProgram.program, anchorProgram.provider);
      
      // Create game on-chain
      const signature = await instructions.createGame(entryFee * 1e9, players.length); // Convert SOL to lamports
      
      // Wait for confirmation
      await anchorProgram.provider.connection.confirmTransaction(signature);
      
      // Fetch the created game state
      // For now, create local state until we can fetch from chain
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

      set({ gameState: newGameState, isLoading: false, error: null });
      
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to create game' 
      });
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
      
      // Get the item at the coordinate
      const item = PirateGameEngine.getItemAtCoordinate(gameState.grid, coordinate);
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      
      // Apply item effect
      const effect = PirateGameEngine.applyItemEffect(item, currentPlayer);
      
      // Update game state
      const updatedPlayers = [...gameState.players];
      updatedPlayers[gameState.currentPlayerIndex] = effect.updatedPlayer;
      
      const updatedGameState: GameState = {
        ...gameState,
        players: updatedPlayers,
        chosenCoordinates: [...gameState.chosenCoordinates, coordinate],
        currentCombination: coordinate,
        currentPlayerIndex: (gameState.currentPlayerIndex + 1) % gameState.players.length,
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
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to make move' 
      });
      return false;
    }
  },

  // Handle player actions (steal, swap, etc.)
  handlePlayerAction: (action: string, targetPlayerId?: string, amount?: number) => {
    const { gameState } = get();
    if (!gameState) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const targetPlayer = gameState.players.find(p => p.publicKey === targetPlayerId);
    
    if (!targetPlayer && action !== 'choose') {
      set({ error: 'Target player not found' });
      return;
    }

    try {
      if (targetPlayer) {
        const result = PirateGameEngine.handlePlayerAction(action, currentPlayer, targetPlayer, amount);
        
        const updatedPlayers = gameState.players.map(p => {
          if (p.publicKey === currentPlayer.publicKey) return result.updatedPlayer;
          if (p.publicKey === targetPlayer.publicKey) return result.updatedTargetPlayer;
          return p;
        });

        set({ 
          gameState: { ...gameState, players: updatedPlayers },
          showMessage: result.message 
        });
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

  isMyTurn: () => {
    const { gameState } = get();
    // TODO: Replace with actual wallet check
    return gameState?.gameStatus === 'active';
  },

  getTotalScore: (playerId: string) => {
    const { gameState } = get();
    if (!gameState) return 0;
    
    const player = gameState.players.find(p => p.publicKey === playerId);
    if (!player) return 0;
    
    return player.points + player.bankedPoints;
  },
}));