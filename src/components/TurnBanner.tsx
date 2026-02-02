'use client';

interface TurnBannerProps {
  isMyTurn: boolean;
  decisionTimeMs: number;
  currentPlayerName?: string;
  isPracticeMode?: boolean; // kept for API compatibility
}

export default function TurnBanner({ 
  isMyTurn, 
  decisionTimeMs, 
  currentPlayerName = 'opponent',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isPracticeMode: _isPracticeMode = false 
}: TurnBannerProps) {
  
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    return `${seconds}.${String(Math.floor(milliseconds / 100)).padStart(1, '0')}s`;
  };

  const getTimerColor = (ms: number) => {
    if (ms < 5000) return 'text-neon-green';
    if (ms < 10000) return 'text-neon-cyan';
    if (ms < 15000) return 'text-neon-gold';
    return 'text-red-500';
  };

  const getSpeedBonusLabel = (ms: number) => {
    if (ms < 5000) return { text: '+100 pts', color: 'text-neon-green' };
    if (ms < 10000) return { text: '+50 pts', color: 'text-neon-cyan' };
    if (ms < 15000) return { text: '+25 pts', color: 'text-neon-gold' };
    return { text: 'No bonus', color: 'text-gray-400' };
  };

  if (!isMyTurn) {
    return (
      <div className="turn-banner bg-slate-700/80 backdrop-blur-sm text-center py-3 px-4 rounded-lg border border-gray-600">
        <p className="text-gray-300 flex items-center justify-center gap-2">
          <span>⏳</span>
          Waiting for {currentPlayerName}&apos;s turn...
        </p>
      </div>
    );
  }

  const bonus = getSpeedBonusLabel(decisionTimeMs);

  return (
    <div className="turn-banner bg-gradient-to-r from-neon-cyan/20 to-neon-magenta/20 
                    p-4 rounded-lg border-2 border-neon-cyan text-center">
      <div className="flex items-center justify-center gap-3">
        <span className="text-2xl">🏴‍☠️</span>
        <span className="text-xl font-bold text-white">YOUR TURN</span>
        <span className={`font-mono text-lg font-bold ${getTimerColor(decisionTimeMs)}`}>
          ⏱️ {formatTime(decisionTimeMs)}
        </span>
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-2">
        <span className={`text-sm font-mono ${bonus.color}`}>
          Speed Bonus: {bonus.text}
        </span>
      </div>
      
      <p className="text-xs text-gray-300 mt-2">
        Select a ship to begin your action
      </p>
    </div>
  );
}
