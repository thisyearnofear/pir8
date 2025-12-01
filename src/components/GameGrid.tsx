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
    const baseStyles = `grid-cell flex items-center justify-center font-bold transition-all duration-200 ${mobileClasses.text} `;
    
    if (chosenCoordinates.includes(coordinate)) {
      return baseStyles + 'chosen bg-red-600 text-white cursor-not-allowed opacity-75';
    }
    
    if (disabled || !isMyTurn) {
      return baseStyles + 'cursor-not-allowed opacity-50 grayscale';
    }
    
    if (selectedCell === coordinate) {
      return baseStyles + 'available bg-pirate-gold text-pirate-brown scale-110 shadow-xl ring-2 ring-yellow-300 cursor-pointer animate-pulse';
    }
    
    if (hoveredCell === coordinate && !isMobile) {
      return baseStyles + 'available bg-yellow-400 text-black scale-105 shadow-lg cursor-pointer';
    }
    
    const hoverStyles = isMobile 
      ? 'active:bg-pirate-gold active:scale-95' 
      : 'hover:bg-pirate-gold hover:scale-105';
    
    return baseStyles + `available bg-skull-white text-pirate-brown cursor-pointer ${hoverStyles}`;
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
    <div className="pirate-card transform transition-all hover:shadow-2xl">
      <div className="mb-6 text-center pb-4 border-b border-neon-cyan border-opacity-30">
        <h3 className="text-2xl font-bold text-pirate-gold font-maritime animate-pulse">
          🏴‍☠️ TREASURE MAP 🏴‍☠️
        </h3>
        <p className={`text-sm font-mono mt-2 transition-all ${
          isMyTurn && !disabled 
            ? 'text-neon-cyan animate-glow-pulse' 
            : 'text-neon-magenta'
        }`}>
          {isMyTurn && !disabled ? '▶ AWAITING YOUR.COMMAND' : '▲ STANDBY MODE'}
        </p>
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
      
      {/* Legend - Enhanced */}
      <div className="mt-6 pt-4 border-t border-neon-cyan border-opacity-30">
        <h4 className="text-xs font-bold text-neon-cyan mb-3 font-mono uppercase">▶ ITEMS LEGEND</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="px-2 py-1 rounded bg-neon-cyan bg-opacity-5 border border-neon-cyan border-opacity-20 hover:bg-opacity-10 transition">🎁 Gift 1000pts</div>
          <div className="px-2 py-1 rounded bg-neon-cyan bg-opacity-5 border border-neon-cyan border-opacity-20 hover:bg-opacity-10 transition">👹 Steal points</div>
          <div className="px-2 py-1 rounded bg-neon-cyan bg-opacity-5 border border-neon-cyan border-opacity-20 hover:bg-opacity-10 transition">🎄 Choose square</div>
          <div className="px-2 py-1 rounded bg-neon-cyan bg-opacity-5 border border-neon-cyan border-opacity-20 hover:bg-opacity-10 transition">🍮 Kill player</div>
          <div className="px-2 py-1 rounded bg-neon-cyan bg-opacity-5 border border-neon-cyan border-opacity-20 hover:bg-opacity-10 transition">🌿 Swap scores</div>
          <div className="px-2 py-1 rounded bg-neon-cyan bg-opacity-5 border border-neon-cyan border-opacity-20 hover:bg-opacity-10 transition">🧝 Block attack</div>
          <div className="px-2 py-1 rounded bg-neon-cyan bg-opacity-5 border border-neon-cyan border-opacity-20 hover:bg-opacity-10 transition">🔮 Reflect attack</div>
          <div className="px-2 py-1 rounded bg-neon-cyan bg-opacity-5 border border-neon-cyan border-opacity-20 hover:bg-opacity-10 transition">🏦 Bank points</div>
        </div>
      </div>
    </div>
  );
}