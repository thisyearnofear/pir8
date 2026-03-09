/**
 * Game Map - React Native Version
 * 
 * Interactive territory map with conquest overlay.
 * Displays ships, territories, and handles user interactions.
 * 
 * Features:
 * - Grid-based territory cells
 * - Ship rendering with health bars
 * - Territory control overlay
 * - Touch/click handlers for game actions
 * - Animated contested territories
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { GameMap as GameMapType, Ship } from '@pir8/core';
import TerritoryOverlay from './TerritoryOverlay';

interface GameMapProps {
  gameMap: GameMapType;
  ships: Ship[];
  currentPlayerPK?: string;
  isMyTurn: boolean;
  selectedShipId?: string | null;
  onCellSelect: (coordinate: string) => void;
  onShipClick?: (ship: Ship) => void;
}

interface CellData {
  coordinate: string;
  x: number;
  y: number;
  owner: string | null;
  isContested: boolean;
  ship?: Ship;
}

export const GameMap: React.FC<GameMapProps> = ({
  gameMap,
  ships,
  currentPlayerPK,
  isMyTurn,
  selectedShipId,
  onCellSelect,
  onShipClick,
}) => {
  const [hoveredCoordinate, setHoveredCoordinate] = useState<string | null>(null);

  // Calculate grid size based on screen dimensions
  const gridSize = Math.min(
    Math.floor(Dimensions.get('window').width * 0.9 / 10),
   60
  );

  // Flatten cells and merge with ships for efficient rendering
  const cells: CellData[] = useMemo(() => {
  return gameMap.cells.flatMap((row, y) =>
    row.map((cell, x) => {
      const coordinate = `${x},${y}`;
      const ship = ships.find(s => 
        s.position.x === x && s.position.y === y
       );

      return {
        coordinate,
         x,
         y,
         owner: cell.owner,
       isContested: cell.isContested,
       ship,
      };
     })
   );
  }, [gameMap.cells, ships]);

  const handleCellPress = useCallback((coordinate: string) => {
  if (!isMyTurn) return;
  onCellSelect(coordinate);
  }, [isMyTurn, onCellSelect]);

  const handleShipPress = useCallback((ship: Ship) => {
  if (!isMyTurn) return;
  onShipClick?.(ship);
  }, [isMyTurn, onShipClick]);

  const renderCell = useCallback((cell: CellData) => {
  const isSelected = selectedShipId && cell.ship?.id === selectedShipId;
  const isPlayerControlled = cell.owner === currentPlayerPK;

  return (
     <TouchableOpacity
       key={cell.coordinate}
       style={[
         styles.cell,
         { width: gridSize, height: gridSize },
       isSelected && styles.selectedCell,
       isMyTurn && styles.interactiveCell,
       ]}
      onPress={() => handleCellPress(cell.coordinate)}
      activeOpacity={0.7}
     >
       {/* Territory Overlay Layer */}
       <TerritoryOverlay
        coordinate={cell.coordinate}
         owner={cell.owner}
        isContested={cell.isContested}
        isPlayerControlled={isPlayerControlled}
         currentPlayerPK={currentPlayerPK}
       />

       {/* Ship Layer */}
       {cell.ship && (
         <TouchableOpacity
           style={styles.shipContainer}
          onPress={() => handleShipPress(cell.ship!)}
          activeOpacity={0.8}
         >
           <Text style={styles.shipEmoji}>⚓</Text>
           
           {/* Health Bar */}
           <View style={styles.healthBarBackground}>
             <View
               style={[
                 styles.healthBarFill,
                 {
                   width: `${(cell.ship.health / cell.ship.maxHealth) * 100}%`,
                   backgroundColor: getHealthColor(cell.ship.health / cell.ship.maxHealth),
                 },
               ]}
             />
           </View>
         </TouchableOpacity>
       )}

       {/* Hover Info (optional) */}
       {hoveredCoordinate === cell.coordinate && cell.owner && (
         <View style={styles.hoverInfo}>
           <Text style={styles.hoverText}>
             {isPlayerControlled ? 'Your Territory' : 'Enemy Territory'}
           </Text>
         </View>
       )}
     </TouchableOpacity>
   );
  }, [gridSize, selectedShipId, currentPlayerPK, isMyTurn, hoveredCoordinate, handleCellPress, handleShipPress]);

 return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {cells.map(renderCell)}
      </View>
    </View>
  );
};

// Helper function for health bar colors
function getHealthColor(healthPercent: number): string {
  if (healthPercent> 0.5) return '#22c55e'; // Green
  if (healthPercent> 0.25) return '#eab308'; // Yellow
 return '#ef4444'; // Red
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
   justifyContent: 'center',
  marginVertical: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  borderWidth: 2,
  borderColor: '#334155',
  borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  cell: {
  borderWidth: 1,
  borderColor: '#1e293b',
    position: 'relative',
   justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCell: {
  borderColor: '#fbbf24',
  borderWidth: 2,
  shadowColor: '#fbbf24',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.5,
  shadowRadius: 8,
    elevation: 8,
  },
  interactiveCell: {
   backgroundColor: 'rgba(34, 211, 238, 0.05)',
  },
  shipContainer: {
    alignItems: 'center',
   justifyContent: 'center',
    zIndex:10,
  },
  shipEmoji: {
    fontSize: 28,
  marginBottom: 4,
  textShadowColor: 'rgba(0, 0, 0, 0.5)',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 4,
  },
  healthBarBackground: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 2,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
  borderRadius: 2,
  },
  hoverInfo: {
    position: 'absolute',
   bottom: -30,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 4,
  borderWidth: 1,
  borderColor: '#22d3ee',
    zIndex:100,
  },
  hoverText: {
  color: '#22d3ee',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default GameMap;
