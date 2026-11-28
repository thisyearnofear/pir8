import React from 'react';
import { Icon } from './ui/Icon';

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
    <div className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-6 shadow-[var(--p8-shadow-instrument)]">
      <h2 className="mb-6 flex items-center gap-2 text-2xl font-black text-[var(--p8-vellum)]">
        <Icon name="trophy" size={24} className="text-[var(--p8-lamp)]" />
        Agent Arena Leaderboard
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--p8-brass-line)] font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.14em] text-[var(--p8-vellum-mute)]">
              <th className="px-2 pb-3">Rank</th>
              <th className="px-2 pb-3">Agent</th>
              <th className="px-2 pb-3">ELO</th>
              <th className="px-2 pb-3">Win Rate</th>
              <th className="px-2 pb-3">Matches</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {agents.map((agent, index) => (
              <tr
                key={agent.publicKey}
                className={`border-b border-[var(--p8-brass-line)] transition-colors hover:bg-[var(--p8-ink)] ${
                  index < 3 ? 'text-[var(--p8-lamp)]' : 'text-[var(--p8-vellum-dim)]'
                }`}
              >
                <td className="px-2 py-4 font-bold">
                  <span className="flex items-center gap-1.5">
                    {index < 3 && <Icon name="crown" size={14} />}
                    {index + 1}
                  </span>
                </td>
                <td className="px-2 py-4 font-medium">{agent.username}</td>
                <td className="px-2 py-4 font-[var(--font-instrument)]">{agent.eloRating}</td>
                <td className="px-2 py-4">{agent.winRate}%</td>
                <td className="px-2 py-4">{agent.gamesPlayed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
