'use client';

import { useState } from 'react';
import { GameMap, TerritoryCell, Ship, Coordinate } from '../types/game';
import { TERRITORY_EMOJIS, SHIP_EMOJIS } from '../utils/constants';
import { PirateGameEngine } from '../lib/gameLogic';

interface PirateMapProps {
  gameMap: GameMap;
  ships: Ship[];
  onCellSelect: (coordinate: string) => void;
  isMyTurn: boolean;
  selectedShipId?: string;
  currentPlayerPK?: string;
  scannedCoordinates?: string[];
}

export default function PirateMap({ 
  gameMap, 
  ships, 
  onCellSelect, 
  isMyTurn,
  selectedShipId,
  currentPlayerPK,
  scannedCoordinates = []
}: PirateMapProps) {
  const [hoveredCoordinate, setHoveredCoordinate] = useState<string | null>(null);

  const isCoordinateScanned = (coordinate: string): boolean => {
    return scannedCoordinates.includes(coordinate);
  };

  const handleCellClick = (coordinate: string) => {
    if (!isMyTurn) return;
    onCellSelect(coordinate);
  };

  const getShipAtPosition = (coordinate: string): Ship | undefined => {
    return ships.find(ship => 
      PirateGameEngine.coordinateToString(ship.position) === coordinate && ship.health > 0
    );
  };

  const getCellAtCoordinate = (coordinate: string): TerritoryCell | undefined => {
    const coord = PirateGameEngine.stringToCoordinate(coordinate);
    return gameMap.cells[coord.x]?.[coord.y];
  };

  const isMyShip = (ship: Ship): boolean => {
    if (!currentPlayerPK) return false;
    return ship.id.startsWith(currentPlayerPK);
  };

  const isValidMoveTarget = (coordinate: string): boolean => {
    if (!selectedShipId || !currentPlayerPK) return false;
    
    const selectedShip = ships.find(s => s.id === selectedShipId);
    if (!selectedShip) return false;
    
    const targetCoord = PirateGameEngine.stringToCoordinate(coordinate);
    const distance = PirateGameEngine.calculateDistance(selectedShip.position, targetCoord);
    
    return distance <= selectedShip.speed;
  };

  const getCellClassName = (coordinate: string): string => {
    const cell = getCellAtCoordinate(coordinate);
    const ship = getShipAtPosition(coordinate);
    const isScanned = isCoordinateScanned(coordinate);
    let className = 'territory-cell ';
    
    // Unscanned tile - show as "?"
    if (!isScanned && cell) {
      className += 'bg-gray-700 bg-opacity-50 hover:bg-gray-600 border border-gray-600 ';
    } else {
      // Scanned tile highlighting with brighter colors
      if (isScanned) {
        className += 'ring-2 ring-neon-magenta ring-opacity-80 shadow-lg ';
      }
      
      // Base cell styling based on territory type
      if (cell) {
        switch (cell.type) {
          case 'water':
            className += 'bg-blue-600 bg-opacity-70 hover:bg-blue-500 ';
            break;
          case 'island':
            className += 'bg-green-600 bg-opacity-70 hover:bg-green-500 pirate-glow ';
            break;
          case 'port':
            className += 'bg-yellow-600 bg-opacity-70 hover:bg-yellow-500 pirate-glow ';
            break;
          case 'treasure':
            className += 'bg-amber-500 bg-opacity-70 hover:bg-amber-400 pirate-glow animate-pulse ';
            break;
          case 'storm':
            className += 'bg-purple-600 bg-opacity-70 animate-pulse battle-pulse ';
            break;
          case 'reef':
            className += 'bg-gray-600 bg-opacity-70 hover:bg-gray-500 ';
            break;
          case 'whirlpool':
            className += 'bg-indigo-700 bg-opacity-70 hover:bg-indigo-600 animate-spin ';
            break;
        }
      }
    }

    // Territory ownership
    if (cell?.owner) {
      className += 'ring-2 ring-neon-orange ';
    }

    // Ship highlighting
    if (ship) {
      if (isMyShip(ship)) {
        className += 'ring-4 ring-neon-cyan ';
      } else {
        className += 'ring-4 ring-red-500 ';
      }
    }

    // Selected ship highlighting
    if (ship?.id === selectedShipId) {
      className += 'ring-4 ring-neon-gold animate-pulse ';
    }

    // Movement target highlighting
    if (selectedShipId && isValidMoveTarget(coordinate)) {
      className += 'ring-2 ring-green-400 ring-opacity-70 ';
    }

    // Hover effect
    if (hoveredCoordinate === coordinate) {
      className += 'bg-white bg-opacity-20 ';
    }

    // Interactive styling
    if (isMyTurn) {
      className += 'cursor-pointer hover:bg-white hover:bg-opacity-10 ';
    }

    return className;
  };

  const renderCellContent = (coordinate: string): JSX.Element => {
    const cell = getCellAtCoordinate(coordinate);
    const ship = getShipAtPosition(coordinate);
    const isScanned = isCoordinateScanned(coordinate);
    
    return (
      <div className="cell-content h-full w-full flex flex-col items-center justify-center text-lg relative">
        {/* Unscanned territory - show question mark */}
        {!isScanned && cell && (
          <div className="territory-icon text-gray-400 text-xl font-bold">
            ?
          </div>
        )}
        
        {/* Territory emoji - only for scanned tiles */}
        {isScanned && cell && (
          <div className="territory-icon">
            {TERRITORY_EMOJIS[cell.type]}
          </div>
        )}
        
        {/* Ship overlay */}
        {ship && (
          <div className={`ship-icon absolute ${isMyShip(ship) ? 'text-neon-cyan' : 'text-red-400'}`}>
            {SHIP_EMOJIS[ship.type]}
          </div>
        )}
        
        {/* Health indicator for damaged ships */}
        {ship && ship.health < ship.maxHealth && (
          <div className="health-bar absolute bottom-1 left-1 right-1 h-1 bg-gray-600 rounded">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-green-500 rounded"
              style={{ width: `${(ship.health / ship.maxHealth) * 100}%` }}
            ></div>
          </div>
        )}
      </div>
    );
  };

  const renderMapGrid = (): JSX.Element[] => {
    const cells: JSX.Element[] = [];
    
    for (let x = 0; x < gameMap.size; x++) {
      for (let y = 0; y < gameMap.size; y++) {
        const coordinate = `${x},${y}`;
        
        cells.push(
          <div
            key={coordinate}
            className={getCellClassName(coordinate)}
            onClick={() => handleCellClick(coordinate)}
            onMouseEnter={() => setHoveredCoordinate(coordinate)}
            onMouseLeave={() => setHoveredCoordinate(null)}
            title={`Territory: ${getCellAtCoordinate(coordinate)?.type || 'unknown'} | Position: ${coordinate}`}
          >
            {renderCellContent(coordinate)}
          </div>
        );
      }
    }
    
    return cells;
  };

  return (
    <div className="pirate-map-container">
      <div className="map-header mb-4 text-center">
        <h3 className="text-xl font-bold font-tech text-neon-cyan">
          🗺️ BATTLE MAP
        </h3>
        <div className="map-legend flex justify-center gap-4 mt-2 text-xs">
          <span>🌊 Water</span>
          <span>🏝️ Island</span>
          <span>⚓ Port</span>
          <span>💰 Treasure</span>
          <span>⛈️ Storm</span>
          <span>🪨 Reef</span>
          <span>🌀 Whirlpool</span>
        </div>
      </div>
      
      <div 
        className="game-map-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gameMap.size}, 1fr)`,
          gridTemplateRows: `repeat(${gameMap.size}, 1fr)`,
          gap: '2px',
          aspectRatio: '1',
          maxWidth: '600px',
          margin: '0 auto'
        }}
      >
        {renderMapGrid()}
      </div>
      
      {/* Selection info */}
      {selectedShipId && (
        <div className="mt-4 p-3 bg-neon-cyan bg-opacity-10 border border-neon-cyan rounded-lg text-center">
          <div className="text-sm text-neon-cyan font-mono">
            Ship selected: {ships.find(s => s.id === selectedShipId)?.type}
          </div>
          <div className="text-xs text-gray-300 mt-1">
            Click on a highlighted cell to move
          </div>
        </div>
      )}
      
      {/* Hover info */}
      {hoveredCoordinate && (
        <div className="mt-2 p-2 bg-black bg-opacity-50 border border-gray-500 rounded text-center">
          <div className="text-xs text-gray-300">
            Position: {hoveredCoordinate}
          </div>
          {getCellAtCoordinate(hoveredCoordinate) && (
            <div className="text-xs text-neon-cyan">
              {getCellAtCoordinate(hoveredCoordinate)!.type}
              {getCellAtCoordinate(hoveredCoordinate)!.owner && (
                <span className="text-neon-orange"> (Controlled)</span>
              )}
            </div>
          )}
          {getShipAtPosition(hoveredCoordinate) && (
            <div className="text-xs text-neon-magenta">
              {getShipAtPosition(hoveredCoordinate)!.type} - 
              {getShipAtPosition(hoveredCoordinate)!.health}HP
            </div>
          )}
        </div>
      )}
    </div>
  );
}