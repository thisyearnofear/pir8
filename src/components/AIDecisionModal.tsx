/**
 * AIDecisionModal - Shows AI's decision-making process for educational purposes
 * ENHANCEMENT: Makes AI vs AI battles more engaging and teachable
 */

'use client';

import { AIReasoning } from '@/lib/pirateGameEngine';

interface AIDecisionModalProps {
  reasoning: AIReasoning | null;
  isVisible: boolean;
  playerName: string;
  onClose: () => void;
}

export default function AIDecisionModal({
  reasoning,
  isVisible,
  playerName,
  onClose
}: AIDecisionModalProps) {
  if (!isVisible || !reasoning) return null;

  const { chosenOption, optionsConsidered = [], gameAnalysis, difficulty, thinkingTime } = reasoning || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-neon-cyan/50 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl shadow-neon-cyan/20 max-h-[80vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-black text-neon-cyan flex items-center gap-2">
              <span>🤖</span>
              <span>{playerName}'s Turn</span>
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {difficulty.name} • Thinking time: {thinkingTime}ms
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Game Analysis */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-bold text-neon-gold uppercase mb-3 flex items-center gap-2">
            <span>📊</span>
            <span>Situation Analysis</span>
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={`p-2 rounded ${gameAnalysis.isWinning ? 'bg-green-500/20 border border-green-500/30' : 'bg-slate-700/50'}`}>
              <div className="text-gray-400">Position</div>
              <div className="font-bold text-white">
                {gameAnalysis.isWinning ? '✅ Winning' : gameAnalysis.isLosing ? '⚠️ Losing' : '⚔️ Even'}
              </div>
            </div>
            <div className="bg-slate-700/50 p-2 rounded">
              <div className="text-gray-400">Territories</div>
              <div className="font-bold text-white">{gameAnalysis.territoriesControlled}</div>
            </div>
            <div className="bg-slate-700/50 p-2 rounded">
              <div className="text-gray-400">Ships</div>
              <div className="font-bold text-white">{gameAnalysis.totalShips}</div>
            </div>
            <div className={`p-2 rounded ${gameAnalysis.resourceAdvantage ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-slate-700/50'}`}>
              <div className="text-gray-400">Resources</div>
              <div className="font-bold text-white">
                {gameAnalysis.resourceAdvantage ? '💰 Rich' : '💸 Average'}
              </div>
            </div>
          </div>
        </div>

        {/* Options Considered */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-neon-magenta uppercase mb-3 flex items-center gap-2">
            <span>🎯</span>
            <span>Options Evaluated ({(optionsConsidered || []).length})</span>
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(optionsConsidered || []).slice(0, 5).map((option, idx) => {
              const isChosen = chosenOption?.type === option.type &&
                chosenOption?.shipId === option.shipId &&
                chosenOption?.target === option.target;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-2 transition-all ${isChosen
                      ? 'border-neon-cyan bg-neon-cyan/20 scale-105'
                      : 'border-slate-600 bg-slate-800/50'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {option.type === 'attack' && '⚔️'}
                        {option.type === 'move_ship' && '🚢'}
                        {option.type === 'claim_territory' && '🏴‍☠️'}
                        {option.type === 'build_ship' && '🛠️'}
                        {option.type === 'pass' && '⏭️'}
                      </span>
                      <span className="font-bold text-white capitalize">
                        {option.type.replace('_', ' ')}
                      </span>
                      {isChosen && (
                        <span className="text-xs bg-neon-cyan text-black px-2 py-0.5 rounded-full font-bold">
                          CHOSEN
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Score:</span>
                      <span className={`font-bold ${option.score >= 80 ? 'text-green-400' :
                          option.score >= 60 ? 'text-yellow-400' :
                            'text-gray-400'
                        }`}>
                        {option.score}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300">{option.reason}</p>
                  {option.target && (
                    <p className="text-xs text-gray-500 mt-1">Target: {option.target}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chosen Action */}
        {chosenOption && (
          <div className="bg-gradient-to-r from-neon-cyan/20 to-neon-gold/20 border-2 border-neon-cyan rounded-xl p-4 mb-4">
            <h3 className="text-sm font-bold text-neon-cyan uppercase mb-2 flex items-center gap-2">
              <span>✨</span>
              <span>Final Decision</span>
            </h3>
            <div className="flex items-start gap-3">
              <span className="text-3xl">
                {chosenOption.type === 'attack' && '⚔️'}
                {chosenOption.type === 'move_ship' && '🚢'}
                {chosenOption.type === 'claim_territory' && '🏴‍☠️'}
                {chosenOption.type === 'build_ship' && '🛠️'}
              </span>
              <div className="flex-1">
                <div className="font-bold text-white text-lg capitalize mb-1">
                  {chosenOption.type.replace('_', ' ')}
                </div>
                <p className="text-gray-300 text-sm mb-2">{chosenOption.reason}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-neon-gold/20 text-neon-gold px-2 py-1 rounded">
                    Score: {chosenOption.score}
                  </span>
                  <span className="text-xs bg-neon-magenta/20 text-neon-magenta px-2 py-1 rounded">
                    {difficulty.level} AI • {(difficulty.aggressiveness * 100).toFixed(0)}% aggressive
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Educational Note */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-400 italic">
            💡 <strong>Learning Moment:</strong> The AI evaluates multiple options and scores them based on
            the game situation. Higher difficulty AIs consider more factors and make smarter decisions.
            {gameAnalysis.isLosing && " Notice how the AI becomes more aggressive when losing!"}
          </p>
        </div>

        {/* Continue Button */}
        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-gold 
                     text-black font-bold hover:shadow-lg hover:shadow-neon-cyan/50 
                     hover:scale-105 active:scale-95 transition-all"
        >
          Continue Watching
        </button>
      </div>
    </div>
  );
}
