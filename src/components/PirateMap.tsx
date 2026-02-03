"use client";

import { useState, useRef, useEffect } from "react";
import { GameMap, Ship } from "../types/game";
import { TERRITORY_EMOJIS, SHIP_EMOJIS } from "../utils/constants";
import { PirateGameManager } from "../lib/pirateGameEngine";
import TerritoryTooltip from "./TerritoryTooltip";
import { useMobileOptimized } from "@/hooks/useMobileOptimized";

interface PlayerInfo {
  publicKey: string;
  username?: string;
}

interface PirateMapProps {
  gameMap: GameMap;
  ships: Ship[];
  players?: PlayerInfo[];
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
  players = [],
  onCellSelect,
  onShipClick,
  isMyTurn,
  selectedShipId,
  currentPlayerPK,
  scannedCoordinates = [],
}: PirateMapProps) {
  const [hoveredCoordinate, setHoveredCoordinate] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);

  // ENHANCED mobile optimization
  const { 
    isMobile, 
    getGridSize,
    shouldReduceAnimations,
    classes,
    touchHandlers,
    triggerHaptic
  } = useMobileOptimized({
    onTap: (element) => {
      const coordinate = element.dataset['coordinate'];
      if (coordinate) handleCellClick(coordinate);
    },
    onLongPress: (element) => {
      const coordinate = element.dataset['coordinate'];
      if (coordinate && isMobile) {
        setHoveredCoordinate(coordinate);
        triggerHaptic('medium');
      }
    }
  });

  // CONSOLIDATED animation state
  const [shipAnimations, setShipAnimations] = useState<Map<string, { type: "move" | "attack" | "damaged"; timestamp: number }>>(new Map());
  const [damageNumbers, setDamageNumbers] = useState<Array<{ id: string; shipId: string; amount: number; position: string; timestamp: number }>>([]);
  const prevShipsRef = useRef<Map<string, { position: string; health: number }>>(new Map());

  // ENHANCED animation detection
  useEffect(() => {
    if (shouldReduceAnimations()) return;

    const now = Date.now();
    const prevShips = prevShipsRef.current;

    ships.forEach((ship) => {
      const currentPos = PirateGameManager.coordinateToString(ship.position);
      const prev = prevShips.get(ship.id);

      if (prev && prev.position !== currentPos) {
        setShipAnimations(prev => new Map(prev.set(ship.id, { type: "move", timestamp: now })));
      }

      if (prev && prev.health > ship.health) {
        const damage = prev.health - ship.health;
        setDamageNumbers(prev => [...prev, { id: `${ship.id}-${now}`, shipId: ship.id, amount: damage, position: currentPos, timestamp: now }]);
        setShipAnimations(prev => new Map(prev.set(ship.id, { type: "damaged", timestamp: now })));
      }
    });

    prevShipsRef.current = new Map(ships.map(s => [s.id, { position: PirateGameManager.coordinateToString(s.position), health: s.health }]));
  }, [ships, shouldReduceAnimations]);

  // CONSOLIDATED cleanup
  useEffect(() => {
    if (damageNumbers.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setDamageNumbers(prev => prev.filter(dmg => now - dmg.timestamp < 1500));
    }, 100);
    return () => clearInterval(timer);
  }, [damageNumbers.length]);

  const handleCellClick = (coordinate: string) => {
    if (!isMyTurn) return;
    const ship = getShipAtPosition(coordinate);
    if (ship && isMyShip(ship) && onShipClick) {
      onShipClick(ship);
      return;
    }
    onCellSelect(coordinate);
  };

  const handleCellHover = (coordinate: string, event: React.MouseEvent) => {
    if (isMobile) return;
    setHoveredCoordinate(coordinate);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const getShipAtPosition = (coordinate: string): Ship | undefined => {
    return ships.find(ship => PirateGameManager.coordinateToString(ship.position) === coordinate);
  };

  const isMyShip = (ship: Ship): boolean => {
    return ship.id.startsWith(currentPlayerPK || '');
  };

  const getPlayerColor = (shipId: string): string => {
    const playerIndex = players.findIndex(p => shipId.startsWith(p.publicKey));
    const colors = ['#00D9FF', '#FFD700', '#FF00FF', '#BC13FE'];
    return colors[playerIndex % colors.length] || "#ffffff";
  };

  const getCellContent = (coordinate: string) => {
    const ship = getShipAtPosition(coordinate);
    const flatCells = gameMap.cells.flat();
    const cell = flatCells.find(c => c.coordinate === coordinate);

    if (ship) {
      const isSelected = selectedShipId === ship.id;
      const playerColor = getPlayerColor(ship.id);
      const animationClass = shipAnimations.get(ship.id);
      
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <span
            className={`ship-icon ${animationClass && !shouldReduceAnimations() ? `ship-anim-${animationClass.type}` : ""} ${isSelected ? "ring-2 ring-neon-gold" : ""}`}
            style={{ color: playerColor }}
          >
            {SHIP_EMOJIS[ship.type as keyof typeof SHIP_EMOJIS]}
          </span>
          
          <div className="health-bar">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${(ship.health / ship.maxHealth) * 100}%`,
                backgroundColor: ship.health > ship.maxHealth * 0.5 ? "#22c55e" : ship.health > ship.maxHealth * 0.25 ? "#eab308" : "#ef4444"
              }}
            />
          </div>

          {damageNumbers.filter(dmg => dmg.shipId === ship.id).map(dmg => (
            <div key={dmg.id} className="damage-number">-{dmg.amount}</div>
          ))}
        </div>
      );
    }

    if (cell) {
      const isScanned = scannedCoordinates.includes(coordinate);
      return (
        <div className={`territory-icon ${isScanned ? "opacity-100" : "opacity-60"}`}>
          {TERRITORY_EMOJIS[cell.type]}
        </div>
      );
    }

    return null;
  };

  const gridSize = getGridSize();
  const totalCells = gridSize * gridSize;
  const flatCells = gameMap.cells.flat();

  return (
    <div className={`relative ${classes.container}`} ref={mapRef}>
      <div 
        className={`grid ${classes.grid} ${isMobile ? 'mobile-map-grid' : 'game-grid'}`}
        style={{ 
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          maxWidth: isMobile ? 'min(98vw, 85vh)' : 'auto',
          aspectRatio: '1',
          margin: '0 auto'
        }}
      >
        {Array.from({ length: totalCells }, (_, index) => {
          const x = index % gridSize;
          const y = Math.floor(index / gridSize);
          const coordinate = PirateGameManager.coordinateToString({ x, y });
          
          return (
            <div
              key={coordinate}
              data-coordinate={coordinate}
              className={`
                territory-cell cursor-pointer
                ${isMyTurn ? "hover:bg-neon-cyan hover:bg-opacity-20" : ""}
                ${selectedShipId && getShipAtPosition(coordinate)?.id === selectedShipId ? "ring-2 ring-neon-gold" : ""}
                ${classes.button}
              `}
              {...(isMobile ? touchHandlers : {
                onClick: () => handleCellClick(coordinate),
                onMouseEnter: (e) => handleCellHover(coordinate, e),
                onMouseLeave: () => setHoveredCoordinate(null)
              })}
            >
              <div className="cell-content">
                {getCellContent(coordinate)}
              </div>
            </div>
          );
        })}
      </div>

        {hoveredCoordinate && (
          <TerritoryTooltip
            type={flatCells.find(c => c.coordinate === hoveredCoordinate)?.type as any}
            position={tooltipPosition}
            isVisible={true}
          />
        )}

        {/* Selection info - Mobile Optimized */}
        {selectedShipId && (
          <div className="mt-2 sm:mt-4 p-2 sm:p-3 bg-neon-cyan bg-opacity-10 border border-neon-cyan rounded-lg text-center w-full max-w-xs">
            <div className="text-xs sm:text-sm text-neon-cyan font-mono truncate">
              Ship: {ships.find((s) => s.id === selectedShipId)?.type}
            </div>
            <div className="text-xs text-gray-300 mt-1">
              Tap highlighted cell to move
            </div>
          </div>
        )}

        {/* Hover info - Mobile Optimized */}
        {hoveredCoordinate && (
          <div className="mt-1 sm:mt-2 p-1.5 sm:p-2 bg-black bg-opacity-50 border border-gray-500 rounded text-center w-full max-w-xs">
            <div className="text-xs text-gray-300 truncate">
              Pos: {hoveredCoordinate}
            </div>
            {flatCells.find(c => c.coordinate === hoveredCoordinate) && (
              <div className="text-xs text-neon-cyan truncate">
                {flatCells.find(c => c.coordinate === hoveredCoordinate)?.type}
                {flatCells.find(c => c.coordinate === hoveredCoordinate)?.owner && (
                  <span className="text-neon-orange"> (Ctrl)</span>
                )}
              </div>
            )}
            {getShipAtPosition(hoveredCoordinate) && (
              <div className="text-xs text-neon-magenta truncate">
                {getShipAtPosition(hoveredCoordinate)!.type} -
                {getShipAtPosition(hoveredCoordinate)!.health}HP
              </div>
            )}
          </div>
        )}

      </div>
    );
}
