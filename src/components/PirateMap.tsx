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

  // CONSOLIDATED animation state - Single source of truth
  const [shipPositions, setShipPositions] = useState<Map<string, string>>(new Map());
  const [shipAnimations, setShipAnimations] = useState<Map<string, {
    type: 'move' | 'attack' | 'claim' | 'damaged';
    timestamp: number;
  }>>(new Map());
  const [shipTrails, setShipTrails] = useState<Map<string, string[]>>(new Map());
  const [damageNumbers, setDamageNumbers] = useState<Array<{
    id: string;
    shipId: string;
    amount: number;
    position: string;
    timestamp: number;
  }>>([]);

  // Track previous ship state with refs to avoid dependency loops
  const prevShipsRef = useRef<Map<string, { position: string; health: number }>>(new Map());

  // Detect changes and determine action type
  useEffect(() => {
    const now = Date.now();
    const prevShips = prevShipsRef.current;
    let hasChanges = false;

    ships.forEach(ship => {
      const currentPos = PirateGameManager.coordinateToString(ship.position);
      const prev = prevShips.get(ship.id);

      // Position changed = movement
      if (prev && prev.position !== currentPos) {
        hasChanges = true;
        setShipAnimations(prevAnims => {
          const next = new Map(prevAnims);
          next.set(ship.id, { type: 'move', timestamp: now });
          return next;
        });

        // Track trail (last 3 positions)
        setShipTrails(prevTrails => {
          const next = new Map(prevTrails);
          const trail = [...(next.get(ship.id) || []), prev.position];
          if (trail.length > 3) trail.shift();
          next.set(ship.id, trail);
          return next;
        });

        // Auto-clear after animation
        setTimeout(() => {
          setShipAnimations(prevAnims => {
            const next = new Map(prevAnims);
            if (next.get(ship.id)?.timestamp === now) next.delete(ship.id);
            return next;
          });
        }, 600);
      }

      // Health decreased = damaged
      if (prev && ship.health < prev.health) {
        hasChanges = true;
        const damage = prev.health - ship.health;
        setShipAnimations(prevAnims => {
          const next = new Map(prevAnims);
          next.set(ship.id, { type: 'damaged', timestamp: now });
          return next;
        });

        setDamageNumbers(prevDmg => [...prevDmg, {
          id: `dmg-${ship.id}-${now}`,
          shipId: ship.id,
          amount: damage,
          position: currentPos,
          timestamp: now
        }]);

        setTimeout(() => {
          setShipAnimations(prevAnims => {
            const next = new Map(prevAnims);
            if (next.get(ship.id)?.timestamp === now) next.delete(ship.id);
            return next;
          });
        }, 500);
      }
    });

    // Update positions ref for next comparison
    const newPositions = new Map<string, { position: string; health: number }>();
    ships.forEach(ship => {
      newPositions.set(ship.id, {
        position: PirateGameManager.coordinateToString(ship.position),
        health: ship.health
      });
    });
    prevShipsRef.current = newPositions;

    // Update position state for rendering
    if (hasChanges || shipPositions.size === 0) {
      setShipPositions(new Map(ships.map(s => [s.id, PirateGameManager.coordinateToString(s.position)])));
    }
  }, [ships]);

  // CONSOLIDATED: Auto-cleanup for damage numbers (PERFORMANT)
  useEffect(() => {
    if (damageNumbers.length > 0) {
      const timer = setInterval(() => {
        const now = Date.now();
        setDamageNumbers(prev => prev.filter(dmg => now - dmg.timestamp < 1500));
      }, 100);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [damageNumbers.length]);

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

  // Determine ship color based on player owner
  const getShipColor = (shipId: string) => {
    const playerId = shipId.split('_')[0] || 'unknown';

    // Me = Cyan
    if (currentPlayerPK && playerId === currentPlayerPK) {
      return { tailwind: 'text-neon-cyan', ring: 'ring-neon-cyan', shadow: 'shadow-neon-cyan/50', hex: '#00D9FF', name: 'cyan' };
    }

    // Hash distinct AI/Enemies to colors
    // Use simple char code sum for deterministic color assignment
    const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const palette = [
      { tailwind: 'text-neon-magenta', ring: 'ring-neon-magenta', shadow: 'shadow-neon-magenta/50', hex: '#FF00FF', name: 'magenta' },
      { tailwind: 'text-neon-gold', ring: 'ring-neon-gold', shadow: 'shadow-neon-gold/50', hex: '#FFD700', name: 'gold' },
      { tailwind: 'text-neon-purple', ring: 'ring-neon-purple', shadow: 'shadow-neon-purple/50', hex: '#BC13FE', name: 'purple' },
      { tailwind: 'text-neon-orange', ring: 'ring-neon-orange', shadow: 'shadow-neon-orange/50', hex: '#FF5F1F', name: 'orange' },
      { tailwind: 'text-green-400', ring: 'ring-green-400', shadow: 'shadow-green-400/50', hex: '#4ade80', name: 'green' },
    ];

    return palette[hash % palette.length]!;
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
            className += 'bg-purple-600 bg-opacity-70 hover:bg-purple-500 ';
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
      // If owner is a player, color ring by player color?
      // For now keep orange to distinguish from ships
      className += 'ring-2 ring-neon-orange ';
    }

    // Ship highlighting with visual hierarchy
    if (ship) {
      const colors = getShipColor(ship.id);
      className += `ring-4 ${colors.ring} shadow-lg ${colors.shadow} `;

      // Add glow effect for animating ships
      const animation = shipAnimations.get(ship.id);
      if (animation) {
        className += 'ring-offset-2 ring-offset-black ';
      }
    }

    // Selected ship highlighting with enhanced glow
    if (ship?.id === selectedShipId) {
      className += 'ring-4 ring-white shadow-2xl shadow-white/60 animate-pulse ';
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
    const animation = ship ? shipAnimations.get(ship.id) : undefined;
    const trail = ship ? shipTrails.get(ship.id) || [] : [];
    const cellDamageNumbers = damageNumbers.filter(dmg => dmg.position === coordinate);

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

        {/* Ship trail markers (ENHANCED) */}
        {trail.map((trailPos, idx) => {
          const trailCoord = PirateGameManager.stringToCoordinate(trailPos);
          const currentCoord = PirateGameManager.stringToCoordinate(coordinate);

          // Only render trail on current cell if it's in the trail path
          if (trailCoord.x === currentCoord.x && trailCoord.y === currentCoord.y) {
            // Determine color from ship if possible (we don't have ship reference here easily unless we find it)
            // But we can approximate since only one ship moves at a time usually
            // For robustness, default to a generic trace or try to find ship that owns this trail
            const ownerShip = ships.find(s => shipTrails.get(s.id)?.includes(trailPos));
            const ownerColor = ownerShip ? getShipColor(ownerShip.id).hex : '#ffffff';

            return (
              <div
                key={`trail-${idx}`}
                className="ship-trail absolute"
                style={{
                  backgroundColor: `${ownerColor}40`, // 25% opacity
                  boxShadow: `0 0 6px ${ownerColor}`,
                  animationDelay: `${idx * 0.15}s`,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              />
            );
          }
          return null;
        })}

        {/* Ship overlay with ACTION-SPECIFIC animations */}
        {ship && (
          <div
            className={`ship-icon absolute ${getShipColor(ship.id).tailwind} ${animation?.type === 'move' ? 'ship-anim-move' : ''
              } ${animation?.type === 'attack' ? 'ship-anim-attack' : ''
              } ${animation?.type === 'claim' ? 'ship-anim-claim' : ''
              } ${animation?.type === 'damaged' ? 'ship-anim-damaged' : ''
              }`}
            style={{
              fontSize: ship.id === selectedShipId ? '1.8rem' : '1.5rem',
              filter: ship.health < 30 ? 'brightness(0.6) saturate(0.5)' : 'brightness(1)',
              textShadow: `0 0 10px ${getShipColor(ship.id).hex}cc, 0 0 20px ${getShipColor(ship.id).hex}66`
            }}
          >
            {SHIP_EMOJIS[ship.type]}

            {/* Visual effects based on action type (MODULAR) */}
            {animation && (
              <>
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${getShipColor(ship.id).hex}4D 0%, transparent 70%)`,
                    animation: 'ship-wake 0.6s ease-out'
                  }}
                />

                {/* Ripple effect */}
                <div
                  className="ripple-effect"
                  style={{
                    color: `${getShipColor(ship.id).hex}99`
                  }}
                />

                {/* Particle burst - customize based on action */}
                {[...Array(animation.type === 'attack' ? 8 : 6)].map((_, i) => {
                  const particleCount = animation.type === 'attack' ? 8 : 6;
                  const angle = (i * (360 / particleCount)) * (Math.PI / 180);
                  const distance = animation.type === 'attack' ? 40 : 30;
                  const particleColor = animation.type === 'attack'
                    ? '#ff4444'
                    : getShipColor(ship.id).hex;

                  return (
                    <div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: animation.type === 'attack' ? '6px' : '4px',
                        height: animation.type === 'attack' ? '6px' : '4px',
                        left: '50%',
                        top: '50%',
                        background: particleColor,
                        boxShadow: `0 0 6px ${particleColor}`,
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

        {/* Damage numbers (ENHANCEMENT) */}
        {cellDamageNumbers.map(dmg => (
          <div
            key={dmg.id}
            className="damage-number"
          >
            -{dmg.amount}
          </div>
        ))}

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