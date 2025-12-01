'use client';

import { useState } from 'react';
import { GameItem, COORDINATE_LETTERS } from '../types/game';
import { useGameState } from '../hooks/useGameState';
import { useMobileOptimized } from '../hooks/useMobileOptimized';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ITEM_EMOJIS } from '../utils/constants';

interface GameGridProps {
  grid: GameItem[][];
  chosenCoordinates: string[];
  onCoordinateSelect: (coordinate: string) => void;
  isMyTurn: boolean;
  disabled?: boolean;
}

export default function GameGrid({ 
  grid, 
  chosenCoordinates, 
  onCoordinateSelect, 
  isMyTurn,
  disabled = false 
}: GameGridProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const { handleGameError } = useErrorHandler();
  
  const { isMobile, touchHandlers, triggerHaptic, mobileClasses } = useMobileOptimized({
    onTap: (element) => {
      const coordinate = element.dataset.coordinate;
      if (coordinate) {
        handleCellSelect(coordinate);
      }
    },
    onLongPress: (element) => {
      const coordinate = element.dataset.coordinate;
      if (coordinate && !chosenCoordinates.includes(coordinate)) {
        setSelectedCell(coordinate);
        triggerHaptic('medium');
      }
    },
    hapticFeedback: true,
    preventZoom: true
  });

  const getCellContent = (item: GameItem): JSX.Element => {
    if (typeof item === 'number') {
      return <span className="text-lg font-bold">{item.toString()}</span>;
    }
    
    // Return emoji for special items
    const emoji = ITEM_EMOJIS[item as keyof typeof ITEM_EMOJIS];
    return <span className="text-2xl" aria-label={item}>{emoji || item}</span>;
  };

  const getCellStyles = (row: number, col: number, coordinate: string): string => {
    const baseStyles = `grid-cell-enhanced flex items-center justify-center font-bold transition-all duration-200 ${mobileClasses.text} `;
    
    if (chosenCoordinates.includes(coordinate)) {
      return baseStyles + 'chosen cursor-not-allowed opacity-75';
    }
    
    if (disabled || !isMyTurn) {
      return baseStyles + 'disabled cursor-not-allowed';
    }
    
    if (selectedCell === coordinate) {
      return baseStyles + 'selected cursor-pointer';
    }
    
    if (hoveredCell === coordinate && !isMobile) {
      return baseStyles + 'hover-effect cursor-pointer';
    }
    
    return baseStyles + 'available cursor-pointer';
  };

  const handleCellSelect = (coordinate: string) => {
    try {
      if (disabled || !isMyTurn || chosenCoordinates.includes(coordinate)) {
        if (chosenCoordinates.includes(coordinate)) {
          triggerHaptic('heavy'); // Error feedback
        }
        return;
      }
      
      setSelectedCell(coordinate);
      triggerHaptic('light'); // Success feedback
      onCoordinateSelect(coordinate);
      
      // Clear selection after short delay
      setTimeout(() => setSelectedCell(null), 300);
    } catch (error) {
      handleGameError(error, 'select coordinate');
    }
  };

  const handleCellClick = (row: number, col: number) => {
    const coordinate = `${COORDINATE_LETTERS[col]}${row + 1}`;
    handleCellSelect(coordinate);
  };

  const handleCellHover = (row: number, col: number, isEntering: boolean) => {
    const coordinate = `${COORDINATE_LETTERS[col]}${row + 1}`;
    
    if (disabled || !isMyTurn || chosenCoordinates.includes(coordinate)) {
      return;
    }
    
    setHoveredCell(isEntering ? coordinate : null);
  };

  return (
    <div className="scanner-frame-game transform transition-all hover:shadow-2xl">
      <div className="corner-tl"></div>
      <div className="corner-tr"></div>
      <div className="corner-bl"></div>
      <div className="corner-br"></div>
      
      <div className="mb-6 text-center pb-4 border-b border-neon-cyan border-opacity-30">
        <h3 className="text-2xl font-bold holographic-text font-tech animate-pulse">
          🏴‍☠️ TREASURE MAP 🏴‍☠️
        </h3>
        <p className={`text-sm font-mono mt-2 transition-all ${
          isMyTurn && !disabled 
            ? 'text-neon-cyan animate-glow-pulse' 
            : 'text-neon-magenta'
        }`}>
          {isMyTurn && !disabled ? '▶ AWAITING YOUR.COMMAND' : '▲ STANDBY MODE'}
        </p>
        <div className="scanner-line mt-2"></div>
      </div>
      
      {/* Column headers */}
      <div className="grid grid-cols-8 gap-1 mb-2">
        <div></div> {/* Empty corner */}
        {COORDINATE_LETTERS.map((letter) => (
          <div key={letter} className="text-center font-bold text-pirate-gold text-lg">
            {letter}
          </div>
        ))}
      </div>
      
      {/* Game grid with row headers */}
      <div className={`game-grid-container ${mobileClasses.container}`}>
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className={`grid grid-cols-8 ${mobileClasses.grid} mb-1`}>
            {/* Row header */}
            <div className={`flex items-center justify-center font-bold text-pirate-gold ${mobileClasses.text}`}>
              {rowIndex + 1}
            </div>
            
            {/* Grid cells */}
            {row.map((item, colIndex) => {
              const coordinate = `${COORDINATE_LETTERS[colIndex]}${rowIndex + 1}`;
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={getCellStyles(rowIndex, colIndex, coordinate)}
                  data-coordinate={coordinate}
                  {...touchHandlers}
                  onClick={() => !isMobile && handleCellClick(rowIndex, colIndex)}
                  onMouseEnter={() => !isMobile && handleCellHover(rowIndex, colIndex, true)}
                  onMouseLeave={() => !isMobile && handleCellHover(rowIndex, colIndex, false)}
                  title={`${coordinate}: ${typeof item === 'number' ? `${item} points` : item}`}
                  aria-label={`${coordinate}: ${typeof item === 'number' ? `${item} points` : item}`}
                  role="button"
                  tabIndex={disabled || !isMyTurn ? -1 : 0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCellClick(rowIndex, colIndex);
                    }
                  }}
                >
                  {getCellContent(item)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Enhanced Legend */}
      <div className="mt-6 pt-4 border-t border-neon-cyan border-opacity-30">
        <h4 className="text-xs font-bold text-neon-cyan mb-4 font-mono uppercase tracking-wider">
          ▶ TREASURE LEGEND
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="legend-item">🎁 Gift 1000pts</div>
          <div className="legend-item">👹 Steal points</div>
          <div className="legend-item">🎄 Choose square</div>
          <div className="legend-item">🍮 Kill player</div>
          <div className="legend-item">🌿 Swap scores</div>
          <div className="legend-item">🧝 Block attack</div>
          <div className="legend-item">🔮 Reflect attack</div>
          <div className="legend-item">🏦 Bank points</div>
        </div>
      </div>
    </div>
  );
}