'use client';

import { useState } from 'react';
import { GameItem, COORDINATE_LETTERS } from '../types/game';
import { useGameState } from '../hooks/useGameState';

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

  const getCellContent = (item: GameItem): JSX.Element => {
    if (typeof item === 'number') {
      return <span className="text-lg font-bold">{item.toString()}</span>;
    }
    
    // Return SVG icons for special items
    const iconId = item.toLowerCase();
    return (
      <svg className="w-6 h-6" aria-label={item}>
        <use href={`#${iconId}`} />
      </svg>
    );
  };

  const getCellStyles = (row: number, col: number, coordinate: string): string => {
    const baseStyles = 'grid-cell flex items-center justify-center text-lg font-bold transition-all duration-200 ';
    
    if (chosenCoordinates.includes(coordinate)) {
      return baseStyles + 'chosen bg-red-600 text-white cursor-not-allowed opacity-75';
    }
    
    if (disabled || !isMyTurn) {
      return baseStyles + 'cursor-not-allowed opacity-50';
    }
    
    if (hoveredCell === coordinate) {
      return baseStyles + 'available bg-yellow-400 text-black scale-105 shadow-lg cursor-pointer';
    }
    
    return baseStyles + 'available bg-skull-white text-pirate-brown cursor-pointer hover:bg-pirate-gold hover:scale-105';
  };

  const handleCellClick = (row: number, col: number) => {
    const coordinate = `${COORDINATE_LETTERS[col]}${row + 1}`;
    
    if (disabled || !isMyTurn || chosenCoordinates.includes(coordinate)) {
      return;
    }
    
    onCoordinateSelect(coordinate);
  };

  const handleCellHover = (row: number, col: number, isEntering: boolean) => {
    const coordinate = `${COORDINATE_LETTERS[col]}${row + 1}`;
    
    if (disabled || !isMyTurn || chosenCoordinates.includes(coordinate)) {
      return;
    }
    
    setHoveredCell(isEntering ? coordinate : null);
  };

  return (
    <div className="pirate-card">
      <div className="mb-4 text-center">
        <h3 className="text-xl font-bold text-pirate-gold font-maritime">
          🏴‍☠️ Treasure Map 🏴‍☠️
        </h3>
        <p className="text-sm text-gray-300 mt-1">
          {isMyTurn && !disabled ? 'Choose your coordinates, matey!' : 'Wait for your turn...'}
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
      <div className="game-grid-container">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-8 gap-1 mb-1">
            {/* Row header */}
            <div className="flex items-center justify-center font-bold text-pirate-gold text-lg">
              {rowIndex + 1}
            </div>
            
            {/* Grid cells */}
            {row.map((item, colIndex) => {
              const coordinate = `${COORDINATE_LETTERS[colIndex]}${rowIndex + 1}`;
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={getCellStyles(rowIndex, colIndex, coordinate)}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  onMouseEnter={() => handleCellHover(rowIndex, colIndex, true)}
                  onMouseLeave={() => handleCellHover(rowIndex, colIndex, false)}
                  title={`${coordinate}: ${typeof item === 'number' ? `${item} points` : item}`}
                >
                  {getCellContent(item)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="mt-4 p-3 bg-black bg-opacity-30 rounded-lg">
        <h4 className="text-sm font-bold text-pirate-gold mb-2">Legend:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div>🎁 Gift 1000pts</div>
          <div>👹 Steal points</div>
          <div>🎄 Choose square</div>
          <div>🍮 Kill player</div>
          <div>🌿 Swap scores</div>
          <div>🧝 Block attack</div>
          <div>🔮 Reflect attack</div>
          <div>🏦 Bank points</div>
        </div>
      </div>
    </div>
  );
}