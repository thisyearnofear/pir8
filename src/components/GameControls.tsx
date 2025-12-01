'use client';

import { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { PirateGameEngine } from '../lib/gameLogic';

interface GameControlsProps {
  gameId: string;
  isMyTurn: boolean;
  disabled?: boolean;
}

export default function GameControls({ gameId, isMyTurn, disabled = false }: GameControlsProps) {
  const { gameState, makeMove, clearError } = useGameState();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCoordinate, setSelectedCoordinate] = useState<string>('');
  const [coordinateInput, setCoordinateInput] = useState<string>('');

  const handleGenerateCoordinate = async () => {
    if (!gameState || disabled || !isMyTurn) return;

    setIsGenerating(true);
    clearError();

    try {
      const coordinate = PirateGameEngine.generateRandomCoordinate(gameState.chosenCoordinates);
      setSelectedCoordinate(coordinate);
      
      // Auto-make the move after a short delay for dramatic effect
      setTimeout(async () => {
        await makeMove(coordinate);
        setIsGenerating(false);
        setSelectedCoordinate('');
      }, 1000);
    } catch (error) {
      setIsGenerating(false);
      console.error('Failed to generate coordinate:', error);
    }
  };

  const handleManualCoordinate = async () => {
    if (!coordinateInput || disabled || !isMyTurn) return;

    const coordinate = coordinateInput.toUpperCase();
    const validation = PirateGameEngine.validateCoordinate(
      coordinate, 
      gameState?.chosenCoordinates || []
    );

    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    await makeMove(coordinate);
    setCoordinateInput('');
  };

  const getAvailableCoordinates = (): string[] => {
    if (!gameState) return [];
    return PirateGameEngine.generateAllCoordinates().filter(coord => 
      !gameState.chosenCoordinates.includes(coord)
    );
  };

  const remainingCoordinates = getAvailableCoordinates().length;

  return (
    <div className="pirate-card">
      <div className="mb-4 text-center">
        <h3 className="text-xl font-bold text-pirate-gold font-maritime">
          🎯 Battle Controls 🎯
        </h3>
        <p className="text-sm text-gray-300 mt-1">
          {remainingCoordinates} coordinates remaining
        </p>
      </div>

      {/* Current coordinate display */}
      {selectedCoordinate && (
        <div className="mb-4 p-3 bg-pirate-gold bg-opacity-20 rounded-lg text-center">
          <div className="text-sm text-gray-300">Selected Coordinate:</div>
          <div className="text-2xl font-bold text-pirate-gold animate-treasure-glow">
            {selectedCoordinate}
          </div>
        </div>
      )}

      {/* Generate Random Coordinate */}
      <div className="mb-6">
        <button
          onClick={handleGenerateCoordinate}
          disabled={disabled || !isMyTurn || isGenerating}
          className={`pirate-button w-full ${
            disabled || !isMyTurn || isGenerating
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-opacity-80'
          }`}
        >
          {isGenerating ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="pirate-spinner w-4 h-4"></div>
              <span>Generating...</span>
            </div>
          ) : (
            '🎲 Generate Random Coordinate'
          )}
        </button>
      </div>

      {/* Manual Coordinate Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Or choose manually (e.g., A1, B3, G7):
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={coordinateInput}
            onChange={(e) => setCoordinateInput(e.target.value)}
            placeholder="A1"
            maxLength={2}
            disabled={disabled || !isMyTurn}
            className="flex-1 px-3 py-2 bg-black bg-opacity-50 border border-pirate-gold rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pirate-gold"
          />
          <button
            onClick={handleManualCoordinate}
            disabled={disabled || !isMyTurn || !coordinateInput}
            className="pirate-button px-6 py-2 text-sm"
          >
            ⚡ Fire!
          </button>
        </div>
      </div>

      {/* Quick coordinate buttons for mobile */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(letter => (
          <button
            key={letter}
            onClick={() => setCoordinateInput(coordinateInput[0] === letter ? '' : letter)}
            disabled={disabled || !isMyTurn}
            className={`aspect-square text-xs font-bold rounded border ${
              coordinateInput[0] === letter
                ? 'bg-pirate-gold text-pirate-brown border-pirate-brown'
                : 'bg-black bg-opacity-50 text-white border-gray-600 hover:bg-pirate-gold hover:text-pirate-brown'
            }`}
          >
            {letter}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {[1, 2, 3, 4, 5, 6, 7].map(number => (
          <button
            key={number}
            onClick={() => setCoordinateInput(coordinateInput[1] === number.toString() ? coordinateInput[0] || '' : (coordinateInput[0] || '') + number)}
            disabled={disabled || !isMyTurn}
            className={`aspect-square text-xs font-bold rounded border ${
              coordinateInput[1] === number.toString()
                ? 'bg-pirate-gold text-pirate-brown border-pirate-brown'
                : 'bg-black bg-opacity-50 text-white border-gray-600 hover:bg-pirate-gold hover:text-pirate-brown'
            }`}
          >
            {number}
          </button>
        ))}
      </div>

      {/* Turn indicator */}
      <div className="mt-4 p-2 rounded text-center text-sm">
        {isMyTurn ? (
          <span className="text-green-400 font-bold">🎯 Your turn to fire!</span>
        ) : (
          <span className="text-gray-400">⏳ Waiting for other players...</span>
        )}
      </div>

      {/* Game progress */}
      {gameState && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          <div className="text-xs text-gray-400 mb-1">Battle Progress:</div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-pirate-gold to-treasure-gold h-2 rounded-full transition-all duration-500"
              style={{
                width: `${(gameState.chosenCoordinates.length / 49) * 100}%`
              }}
            ></div>
          </div>
          <div className="text-xs text-gray-400 mt-1 text-center">
            {gameState.chosenCoordinates.length} / 49 squares revealed
          </div>
        </div>
      )}
    </div>
  );
}