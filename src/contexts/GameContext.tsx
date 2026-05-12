'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { usePirateGameStore } from '@/store/gameStore';
import { GameState, Player, Ship } from '@/types/game';

interface GameContextValue {
  // State from store
  gameState: GameState | null;
  gameMode: string;
  isPracticeMode: boolean;
  isLoading: boolean;
  error: string | null;
  showMessage: string | null;
  selectedShipId: string | null;
  
  // Derived state
  currentPlayer: Player | null;
  isMyTurn: boolean;
  myShips: Ship[];
  allShips: Ship[];
  
  // Skill state
  decisionTime: number;
  scanChargesRemaining: number;
  speedBonusAccumulated: number;
  scannedCoordinates: string[];
  
  // Actions
  selectShip: (shipId: string | null) => void;
  endTurn: (gameId: number, wallet: any) => Promise<void>;
  collectResources: (gameId: number, wallet: any) => Promise<boolean>;
  buildShip: (gameId: number, shipType: string, portX: number, portY: number, wallet: any) => Promise<boolean>;
  moveShip: (gameId: number, shipId: string, toX: number, toY: number, wallet: any) => Promise<boolean>;
  attackWithShip: (gameId: number, shipId: string, targetShipId: string, wallet: any) => Promise<boolean>;
  claimTerritory: (gameId: number, shipId: string, wallet: any) => Promise<boolean>;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export function GameProvider({ children, wallet }: { children: React.ReactNode, wallet?: any }) {
  const gameState = usePirateGameStore((state) => state.gameState);
  const gameMode = usePirateGameStore((state) => state.gameMode);
  const isLoading = usePirateGameStore((state) => state.isLoading);
  const error = usePirateGameStore((state) => state.error);
  const showMessage = usePirateGameStore((state) => state.showMessage);
  const selectedShipId = usePirateGameStore((state) => state.selectedShipId);
  const decisionTime = usePirateGameStore((state) => state.decisionTime);
  const scanChargesRemaining = usePirateGameStore((state) => state.scanChargesRemaining);
  const speedBonusAccumulated = usePirateGameStore((state) => state.speedBonusAccumulated);
  const getScannedCoordinates = usePirateGameStore((state) => state.getScannedCoordinates);
  const selectShip = usePirateGameStore((state) => state.selectShip);
  const endTurn = usePirateGameStore((state) => state.endTurn);
  const collectResources = usePirateGameStore((state) => state.collectResources);
  const buildShip = usePirateGameStore((state) => state.buildShip);
  const moveShip = usePirateGameStore((state) => state.moveShip);
  const attackWithShip = usePirateGameStore((state) => state.attackWithShip);
  const claimTerritory = usePirateGameStore((state) => state.claimTerritory);
  const getCurrentPlayer = usePirateGameStore((state) => state.getCurrentPlayer);
  const isMyTurnForWallet = usePirateGameStore((state) => state.isMyTurn);
  const getMyShips = usePirateGameStore((state) => state.getMyShips);
  const getAllShips = usePirateGameStore((state) => state.getAllShips);

  const currentPlayer = useMemo(() => {
    return getCurrentPlayer();
  }, [getCurrentPlayer]);

  const isMyTurn = useMemo(() => {
    return isMyTurnForWallet(wallet?.publicKey?.toBase58());
  }, [isMyTurnForWallet, wallet?.publicKey]);

  const myShips = useMemo(() => {
    return wallet?.publicKey ? getMyShips(wallet.publicKey.toBase58()) : [];
  }, [getMyShips, wallet?.publicKey]);

  const allShips = useMemo(() => {
    return getAllShips();
  }, [getAllShips]);

  const scannedCoordinates = useMemo(() => {
    return getScannedCoordinates();
  }, [getScannedCoordinates]);

  const value = {
    gameState,
    gameMode,
    isPracticeMode: gameMode === 'practice',
    isLoading,
    error,
    showMessage,
    selectedShipId,
    currentPlayer,
    isMyTurn,
    myShips,
    allShips,
    decisionTime,
    scanChargesRemaining,
    speedBonusAccumulated,
    scannedCoordinates,
    selectShip,
    endTurn,
    collectResources,
    buildShip,
    moveShip,
    attackWithShip,
    claimTerritory,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
