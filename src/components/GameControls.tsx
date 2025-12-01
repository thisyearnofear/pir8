'use client';

import { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useMobileOptimized } from '../hooks/useMobileOptimized';
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
  const { handleGameError } = useErrorHandler();
  const { isMobile, mobileClasses, triggerHaptic } = useMobileOptimized();

  const handleGenerateCoordinate = async () => {
    if (!gameState || disabled || !isMyTurn) return;

    setIsGenerating(true);
    clearError();

    try {
      const coordinate = PirateGameEngine.generateRandomCoordinate(gameState.chosenCoordinates);
      setSelectedCoordinate(coordinate);
      triggerHaptic('medium');
      
      // Auto-make the move after a short delay for dramatic effect
      setTimeout(async () => {
        try {
          await makeMove(coordinate);
          triggerHaptic('light');
        } catch (error) {
          handleGameError(error, 'make move');
          triggerHaptic('heavy');
        } finally {
          setIsGenerating(false);
          setSelectedCoordinate('');
        }
      }, 1000);
    } catch (error) {
      handleGameError(error, 'generate coordinate');
      triggerHaptic('heavy');
      setIsGenerating(false);
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
      handleGameError(new Error(validation.error || 'Invalid coordinate'), 'validate coordinate');
      triggerHaptic('heavy');
      return;
    }

    try {
      await makeMove(coordinate);
      triggerHaptic('medium');
      setCoordinateInput('');
    } catch (error) {
      handleGameError(error, 'make move');
      triggerHaptic('heavy');
    }
  };

  const getAvailableCoordinates = (): string[] => {
    if (!gameState) return [];
    return PirateGameEngine.generateAllCoordinates().filter(coord => 
      !gameState.chosenCoordinates.includes(coord)
    );
  };

  const remainingCoordinates = getAvailableCoordinates().length;

  return (
    <div className="game-controls-scanner">
      <div className="corner-tl"></div>
      <div className="corner-tr"></div>
      <div className="corner-bl"></div>
      <div className="corner-br"></div>
      <div className="mb-6 text-center border-b border-neon-cyan border-opacity-30 pb-4">
        <h3 className="text-xl font-bold font-tech holographic-text">
          ▶ TARGET.SYSTEM
        </h3>
        <p className="text-sm text-neon-cyan font-mono mt-2 animate-glow-pulse">
          &gt; {remainingCoordinates} / 49 COORDINATES AVAILABLE
        </p>
        <div className="scanner-line mt-2"></div>
      </div>

      {/* Turn indicator - PROMINENT */}
      <div className={`mb-6 p-4 rounded-lg border-2 font-mono text-center transition-all ${
        isMyTurn
          ? 'border-neon-cyan bg-neon-cyan bg-opacity-10 animate-glow-pulse'
          : 'border-neon-magenta border-opacity-50 bg-neon-magenta bg-opacity-5'
      }`}>
        {isMyTurn ? (
          <div>
            <div className="text-neon-cyan font-bold text-lg mb-1">◆ YOUR TURN ◆</div>
            <div className="text-neon-cyan text-xs">SELECT TARGET COORDINATE</div>
          </div>
        ) : (
          <div>
            <div className="text-neon-magenta font-bold">▲ AWAITING INPUT</div>
            <div className="text-neon-magenta text-xs">OTHER PILOTS EXECUTING</div>
          </div>
        )}
      </div>

      {/* Current coordinate display */}
      {selectedCoordinate && (
        <div className="mb-6 p-4 bg-neon-cyan bg-opacity-10 rounded-lg text-center border border-neon-cyan border-opacity-50">
          <div className="text-xs text-neon-cyan font-mono mb-2">TARGET LOCKED:</div>
          <div className="text-3xl font-bold text-neon-cyan font-tech animate-glow-pulse">
            {selectedCoordinate}
          </div>
        </div>
      )}

      {/* Manual Coordinate Input */}
      <div className="mb-6">
        <label className="block text-xs font-tech text-neon-orange font-bold mb-3 uppercase">
          &gt; MANUAL TARGET INPUT
        </label>
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={coordinateInput}
            onChange={(e) => setCoordinateInput(e.target.value.toUpperCase())}
            placeholder="A1"
            maxLength={2}
            disabled={disabled || !isMyTurn}
            className="coordinate-input-enhanced flex-1"
          />
          <button
            onClick={handleManualCoordinate}
            disabled={disabled || !isMyTurn || !coordinateInput}
            className="pirate-button px-6 py-2 text-sm font-tech"
          >
            FIRE
          </button>
        </div>
      </div>

      {/* Quick coordinate buttons for mobile - optimized touch targets */}
      <div className="mb-4">
        <div className="text-xs text-neon-orange font-tech font-bold mb-2 uppercase">&gt; COLUMN SELECT</div>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(letter => (
            <button
              key={letter}
              onClick={() => setCoordinateInput(coordinateInput[0] === letter ? '' : letter)}
              disabled={disabled || !isMyTurn}
              className={`h-10 text-sm font-bold font-tech rounded border transition-all ${
                coordinateInput[0] === letter
                  ? 'bg-neon-cyan border-neon-cyan text-bg-dark-0'
                  : 'bg-transparent border-neon-cyan border-opacity-30 text-neon-cyan hover:border-opacity-60 active:bg-neon-cyan active:text-bg-dark-0'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="text-xs text-neon-orange font-tech font-bold mb-2 uppercase">&gt; ROW SELECT</div>
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map(number => (
            <button
              key={number}
              onClick={() => setCoordinateInput(coordinateInput[1] === number.toString() ? coordinateInput[0] || '' : (coordinateInput[0] || '') + number)}
              disabled={disabled || !isMyTurn}
              className={`h-10 text-sm font-bold font-tech rounded border transition-all ${
                coordinateInput[1] === number.toString()
                  ? 'bg-neon-magenta border-neon-magenta text-bg-dark-0'
                  : 'bg-transparent border-neon-magenta border-opacity-30 text-neon-magenta hover:border-opacity-60 active:bg-neon-magenta active:text-bg-dark-0'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {number}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Random Coordinate */}
      <div className="mb-6">
        <button
          onClick={handleGenerateCoordinate}
          disabled={disabled || !isMyTurn || isGenerating}
          className="pirate-button w-full"
        >
          {isGenerating ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="pirate-spinner w-4 h-4"></div>
              <span className="font-mono">RANDOMIZE...</span>
            </div>
          ) : (
            '▶ AUTO.TARGET'
          )}
        </button>
      </div>

      {/* Game progress */}
      {gameState && (
        <div className="pt-4 border-t border-neon-cyan border-opacity-30">
          <div className="text-xs text-neon-cyan font-mono font-bold mb-2 uppercase">
            &gt; SCAN.PROGRESS
          </div>
          <div className="w-full bg-bg-dark-3 rounded-full h-2 overflow-hidden border border-neon-cyan border-opacity-30">
            <div
              className="h-2 rounded-full transition-all duration-500 bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-orange"
              style={{
                width: `${(gameState.chosenCoordinates.length / 49) * 100}%`
              }}
            ></div>
          </div>
          <div className="text-xs text-neon-cyan font-mono mt-2 text-center">
            {gameState.chosenCoordinates.length} / 49 SCANNED | {Math.round((gameState.chosenCoordinates.length / 49) * 100)}%
          </div>
        </div>
      )}
    </div>
  );
}