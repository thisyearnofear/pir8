'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { usePirateGameState } from '@/hooks/usePirateGameState';
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
  const store = usePirateGameState();
  
  const currentPlayer = useMemo(() => {
    return store.getCurrentPlayer();
  }, [store.gameState, store.currentPlayerIndex]);

  const isMyTurn = useMemo(() => {
    return store.isMyTurn(wallet?.publicKey?.toBase58());
  }, [store.gameState, wallet?.publicKey]);

  const myShips = useMemo(() => {
    return wallet?.publicKey ? store.getMyShips(wallet.publicKey.toBase58()) : [];
  }, [store.gameState, wallet?.publicKey]);

  const allShips = useMemo(() => {
    return store.getAllShips();
  }, [store.gameState]);

  // Handle ship action logic (abstracted from page.tsx)
  const handleShipAction = async (
    shipId: string,
    action: 'move' | 'attack' | 'claim' | 'collect' | 'build'
  ) => {
    if (!isMyTurn || !wallet) return false;

    if (store.isPracticeMode()) {
      switch (action) {
        case 'move': return true; // Handled by map click
        case 'attack':
          // logic from page.tsx
          return store.makePracticeAttack(shipId, ''); // simplified for now
        case 'claim':
          return store.makePracticeClaim(shipId);
        default: return false;
      }
    } else {
      switch (action) {
        case 'move': return true;
        case 'attack':
          return store.attackWithShip(parseInt(store.gameState?.gameId || '0'), shipId, '', wallet);
        case 'claim':
          return store.claimTerritory(parseInt(store.gameState?.gameId || '0'), shipId, wallet);
        case 'collect':
          return store.collectResources(parseInt(store.gameState?.gameId || '0'), wallet);
        default: return false;
      }
    }
  };

  const value = {
    ...store,
    currentPlayer,
    isMyTurn,
    myShips,
    allShips,
    handleShipAction,
  };

  return (
    <GameContext.Provider value={value as any}>
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
