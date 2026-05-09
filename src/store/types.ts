import { GameState, Player, GameAction, Ship, GameMode, OnChainGameMode } from "../types/game";

export interface GameSlice {
  gameState: GameState | null;
  gameMode: GameMode;
  isLoading: boolean;
  error: string | null;
  showMessage: string | null;
  selectedShipId: string | null;

  setGameState: (gameState: GameState | null) => void;
  setGameMode: (mode: GameMode) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setMessage: (message: string | null) => void;
  clearError: () => void;
  selectShip: (shipId: string | null) => void;

  // Common Getters
  getCurrentPlayer: () => Player | null;
  getMyShips: (playerPK: string) => Ship[];
  isMyTurn: (walletPk?: string) => boolean;
  getAllShips: () => Ship[];
}

export interface OnChainSlice {
  lobbies: any[];
  fetchLobbies: (wallet?: any) => Promise<void>;
  createGame: (
    gameId: number,
    players: Player[],
    _entryFee: number,
    wallet: any,
  ) => Promise<boolean>;
  joinGame: (
    gameId: string | number,
    player: Player,
    wallet: any,
  ) => Promise<boolean>;
  findOrCreateGame: (
    mode: OnChainGameMode,
    player: Player,
    wallet: any,
  ) => Promise<boolean>;
  startGame: (gameId: number, wallet: any) => Promise<boolean>;
  fetchGameState: (gameId: number, wallet: any) => Promise<GameState | null>;
  
  // On-chain game actions
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
  claimTerritory: (
    gameId: number,
    shipId: string,
    wallet: any,
  ) => Promise<boolean>;
  collectResources: (gameId: number, wallet: any) => Promise<boolean>;
  buildShip: (
    gameId: number,
    shipType: string,
    portX: number,
    portY: number,
    wallet: any,
  ) => Promise<boolean>;
  endTurn: (gameId: number, wallet: any) => Promise<void>;
}

export interface PracticeSlice {
  // AI vs AI Demo Mode State
  playbackSpeed: number;
  isAIvsAIMode: boolean;
  currentAIReasoning: any | null;
  aiDecisionCallback: ((reasoning: any) => void) | null;
  aiReasoningHistory: any[];

  // Practice Actions
  startPracticeGame: (
    humanPlayer: Player,
    difficulty?: "novice" | "pirate" | "captain" | "admiral",
  ) => boolean;
  makePracticeMove: (shipId: string, toX: number, toY: number) => boolean;
  makePracticeAttack: (shipId: string, targetShipId: string) => boolean;
  makePracticeClaim: (shipId: string) => boolean;
  processAITurn: () => void;
  exitPracticeMode: () => void;

  // AI vs AI Actions
  startAIvsAIGame: (
    difficulty1: "novice" | "pirate" | "captain" | "admiral",
    difficulty2: "novice" | "pirate" | "captain" | "admiral",
    speed?: number,
  ) => boolean;
  setPlaybackSpeed: (speed: number) => void;
  getPlaybackSpeed: () => number;
  setAIDecisionCallback: (callback: ((reasoning: any) => void) | null) => void;
}

export interface SkillSlice {
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

  // Skill Actions
  startTurn: () => void;
  stopTurnTimer: () => void;
  scanCoordinate: (
    gameId: number,
    coordinateX: number,
    coordinateY: number,
    wallet: any,
  ) => Promise<boolean>;
  moveShipTimed: (
    gameId: number,
    shipId: string,
    toX: number,
    toY: number,
    wallet: any,
  ) => Promise<boolean>;
  getScannedCoordinates: () => string[];
  isCoordinateScanned: (coordinate: string) => boolean;
}

export type PirateGameStore = GameSlice & OnChainSlice & PracticeSlice & SkillSlice;
