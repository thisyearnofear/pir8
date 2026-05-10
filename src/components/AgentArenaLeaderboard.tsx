import React from 'react';

interface LeaderboardAgent {
  publicKey: string;
  username: string;
  eloRating: number;
  winRate: number;
  gamesPlayed: number;
}

interface LeaderboardProps {
  agents: LeaderboardAgent[];
}

export function AgentArenaLeaderboard({ agents }: LeaderboardProps) {
  return (
    <div className="bg-slate-900 border border-neon-gold/30 rounded-xl p-6 shadow-2xl">
      <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-gold to-yellow-500 mb-6 flex items-center gap-2">
        🏆 Agent Arena Leaderboard
      </h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 text-xs uppercase tracking-widest border-b border-slate-700">
              <th className="pb-3 px-2">Rank</th>
              <th className="pb-3 px-2">Agent</th>
              <th className="pb-3 px-2">ELO</th>
              <th className="pb-3 px-2">Win Rate</th>
              <th className="pb-3 px-2">Matches</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {agents.map((agent, index) => (
              <tr 
                key={agent.publicKey} 
                className={`border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${
                  index < 3 ? 'text-neon-gold' : 'text-gray-200'
                }`}
              >
                <td className="py-4 px-2 font-bold">{index + 1}</td>
                <td className="py-4 px-2 font-medium">{agent.username}</td>
                <td className="py-4 px-2 font-mono">{agent.eloRating}</td>
                <td className="py-4 px-2">{agent.winRate}%</td>
                <td className="py-4 px-2">{agent.gamesPlayed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
