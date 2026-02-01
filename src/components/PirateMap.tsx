'use client';

import { useState, useRef, useEffect } from 'react';
import { GameMap, TerritoryCell, Ship } from '../types/game';
import { TERRITORY_EMOJIS, SHIP_EMOJIS } from '../utils/constants';
import { PirateGameManager } from '../lib/pirateGameEngine';
import TerritoryTooltip from './TerritoryTooltip';

interface PirateMapProps {
  gameMap: GameMap;
  ships: Ship[];
  onCellSelect: (coordinate: string) => void;
  onShipClick?: (ship: Ship) => void;
  isMyTurn: boolean;
  selectedShipId?: string;
  currentPlayerPK?: string;
  scannedCoordinates?: string[];
}

export default function PirateMap({
  gameMap,
  ships,
  onCellSelect,
  onShipClick,
  isMyTurn,
  selectedShipId,
  currentPlayerPK,
  scannedCoordinates = []
}: PirateMapProps) {
  const [hoveredCoordinate, setHoveredCoordinate] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Track ship movements for animations
  const [shipPositions, setShipPositions] = useState<Map<string, string>>(new Map());
  const [animatingShips, setAnimatingShips] = useState<Set<string>>(new Set());
  const [recentActions, setRecentActions] = useState<Map<string, 'move' | 'attack' | 'claim'>>(new Map());

  // Detect ship position changes and trigger animations
  useEffect(() => {
    const newPositions = new Map<string, string>();
    const newAnimatingShips = new Set<string>();
    
    ships.forEach(ship => {
      const currentPos = PirateGameManager.coordinateToString(ship.position);
      const previousPos = shipPositions.get(ship.id);
      
      newPositions.set(ship.id, currentPos);
      
      // If position changed, trigger animation
      if (previousPos && previousPos !== currentPos) {
        newAnimatingShips.add(ship.id);
        
        // Clear animation after it completes
        setTimeout(() => {
          setAnimatingShips(prev => {
            const next = new Set(prev);
            next.delete(ship.id);
            return next;
          });
        }, 600); // Match animation duration
      }
    });
    
    setShipPositions(newPositions);
    if (newAnimatingShips.size > 0) {
      setAnimatingShips(newAnimatingShips);
    }
  }, [ships]);
  
  // Clear recent action indicators after delay
  useEffect(() => {
    if (recentActions.size > 0) {
      const timer = setTimeout(() => {
        setRecentActions(new Map());
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [recentActions]);

  const isCoordinateScanned = (coordinate: string): boolean => {
    return scannedCoordinates.includes(coordinate);
  };

  const handleCellClick = (coordinate: string) => {
    if (!isMyTurn) return;

    // Check if clicking on a ship
    const ship = getShipAtPosition(coordinate);
    if (ship && isMyShip(ship) && onShipClick) {
      onShipClick(ship);
      return;
    }

    onCellSelect(coordinate);
  };

  const handleMouseMove = (e: React.MouseEvent, coordinate: string) => {
    if (mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    setHoveredCoordinate(coordinate);
  };

  const getShipAtPosition = (coordinate: string): Ship | undefined => {
    return ships.find(ship =>
      PirateGameManager.coordinateToString(ship.position) === coordinate && ship.health > 0
    );
  };

  const getCellAtCoordinate = (coordinate: string): TerritoryCell | undefined => {
    const coord = PirateGameManager.stringToCoordinate(coordinate);
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

    const targetCoord = PirateGameManager.stringToCoordinate(coordinate);
    const distance = PirateGameManager.calculateDistance(selectedShip.position, targetCoord);

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
            className += 'bg-amber-500 bg-opacity-70 hover:bg-amber-400 pirate-glow ';
            break;
          case 'storm':
            className += 'bg-purple-600 bg-opacity-70 battle-pulse ';
            break;
          case 'reef':
            className += 'bg-gray-600 bg-opacity-70 hover:bg-gray-500 ';
            break;
          case 'whirlpool':
            className += 'bg-indigo-700 bg-opacity-70 hover:bg-indigo-600 ';
            break;
        }
      }
    }

    // Territory ownership
    if (cell?.owner) {
      className += 'ring-2 ring-neon-orange ';
    }

    // Ship highlighting with visual hierarchy
    if (ship) {
      if (isMyShip(ship)) {
        className += 'ring-4 ring-neon-cyan shadow-lg shadow-neon-cyan/50 ';
      } else {
        className += 'ring-4 ring-red-500 shadow-lg shadow-red-500/50 ';
      }
      
      // Add glow effect for animating ships
      if (animatingShips.has(ship.id)) {
        className += 'ring-offset-2 ring-offset-black ';
      }
    }

    // Selected ship highlighting with enhanced glow
    if (ship?.id === selectedShipId) {
      className += 'ring-4 ring-neon-gold shadow-2xl shadow-neon-gold/60 animate-pulse ';
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

  const renderCellContent = (coordinate: string): React.ReactElement => {
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
          <div 
            className={`ship-icon absolute ${isMyShip(ship) ? 'text-neon-cyan' : 'text-red-400'} ${
              animatingShips.has(ship.id) ? 'ship-animating' : ''
            }`}
            style={{
              fontSize: ship.id === selectedShipId ? '1.8rem' : '1.5rem',
              filter: ship.health < 30 ? 'brightness(0.6) saturate(0.5)' : 'brightness(1)',
              textShadow: isMyShip(ship) 
                ? '0 0 10px rgba(0, 217, 255, 0.8), 0 0 20px rgba(0, 217, 255, 0.4)' 
                : '0 0 10px rgba(239, 68, 68, 0.8), 0 0 20px rgba(239, 68, 68, 0.4)'
            }}
          >
            {SHIP_EMOJIS[ship.type]}
            
            {/* Movement trail effect */}
            {animatingShips.has(ship.id) && (
              <>
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${
                      isMyShip(ship) ? 'rgba(0, 217, 255, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                    } 0%, transparent 70%)`,
                    animation: 'ship-wake 0.6s ease-out'
                  }}
                />
                
                {/* Ripple effect */}
                <div 
                  className="ripple-effect"
                  style={{
                    color: isMyShip(ship) ? 'rgba(0, 217, 255, 0.6)' : 'rgba(239, 68, 68, 0.6)'
                  }}
                />
                
                {/* Particle burst effect */}
                {[...Array(6)].map((_, i) => {
                  const angle = (i * 60) * (Math.PI / 180);
                  const distance = 30;
                  return (
                    <div
                      key={i}
                      className="absolute w-1 h-1 rounded-full"
                      style={{
                        left: '50%',
                        top: '50%',
                        background: isMyShip(ship) ? '#00D9FF' : '#ef4444',
                        boxShadow: `0 0 4px ${isMyShip(ship) ? '#00D9FF' : '#ef4444'}`,
                        animation: 'particle-burst 0.6s ease-out',
                        // @ts-ignore
                        '--tx': `${Math.cos(angle) * distance}px`,
                        '--ty': `${Math.sin(angle) * distance}px`,
                      }}
                    />
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* Health indicator for damaged ships with animation */}
        {ship && ship.health < ship.maxHealth && (
          <div className="health-bar absolute bottom-1 left-1 right-1 h-1.5 bg-gray-800 rounded border border-gray-600">
            <div
              className="h-full rounded transition-all duration-500 ease-out"
              style={{ 
                width: `${(ship.health / ship.maxHealth) * 100}%`,
                background: ship.health < 30 
                  ? 'linear-gradient(90deg, #dc2626, #ef4444)'
                  : ship.health < 60
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  : 'linear-gradient(90deg, #10b981, #34d399)',
                boxShadow: ship.health < 30 
                  ? '0 0 8px rgba(220, 38, 38, 0.6)' 
                  : '0 0 5px rgba(16, 185, 129, 0.4)'
              }}
            ></div>
          </div>
        )}
      </div>
    );
  };

  const renderMapGrid = (): React.ReactElement[] => {
    const cells: React.ReactElement[] = [];

    for (let x = 0; x < gameMap.size; x++) {
      for (let y = 0; y < gameMap.size; y++) {
        const coordinate = `${x},${y}`;

        cells.push(
          <div
            key={coordinate}
            className={getCellClassName(coordinate)}
            onClick={() => handleCellClick(coordinate)}
            onMouseMove={(e) => handleMouseMove(e, coordinate)}
            onMouseLeave={() => setHoveredCoordinate(null)}
          >
            {renderCellContent(coordinate)}
          </div>
        );
      }
    }

    return cells;
  };

  const hoveredCell = hoveredCoordinate ? getCellAtCoordinate(hoveredCoordinate) : null;

  return (
    <div className="pirate-map-container relative w-full h-full flex flex-col items-center justify-center" ref={mapRef}>

      <div
        className="game-map-grid relative"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gameMap.size}, 1fr)`,
          gridTemplateRows: `repeat(${gameMap.size}, 1fr)`,
          gap: '2px',
          aspectRatio: '1',
          width: '100%',
          maxWidth: 'min(85vw, 60vh)',
          margin: '0 auto'
        }}
      >
        {renderMapGrid()}

        {/* Territory Tooltip */}
        {hoveredCell && isCoordinateScanned(hoveredCoordinate!) && (
          <TerritoryTooltip
            type={hoveredCell.type}
            position={tooltipPosition}
            isVisible={true}
          />
        )}
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