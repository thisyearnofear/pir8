/**
 * LobbyBrowser - Component for browsing and joining multi-game lobbies
 * Following: MODULAR, CLEAN, PERFORMANT
 */

'use client';

import { useState, useEffect } from 'react';
import { usePirateGameState } from '@/hooks/usePirateGameState';
import { useSafeWallet } from '@/components/SafeWalletProvider';

export default function LobbyBrowser() {
  const { lobbies, fetchLobbies, isLoading, joinGame, createGame } = usePirateGameState();
  const { publicKey } = useSafeWallet();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGameId, setNewGameId] = useState<number>(Math.floor(Math.random() * 1000));

  useEffect(() => {
    if (publicKey) {
      fetchLobbies();
      const interval = setInterval(fetchLobbies, 10000);
      return () => clearInterval(interval);
    }
  }, [fetchLobbies, publicKey]);

  const handleCreate = async () => {
    if (!publicKey) {
      console.warn('Wallet not connected');
      return;
    }
    const success = await createGame(newGameId, [], 0.1, publicKey);
    if (success) setShowCreateModal(false);
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border-2 border-neon-cyan/30 p-6 w-full max-w-4xl mx-auto shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-blue">
            BATTLE LOBBIES
          </h2>
          <p className="text-gray-400 text-sm">Find an active arena or spawn your own</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-neon-gold to-neon-orange text-black font-bold py-2 px-6 rounded-xl 
                     hover:scale-105 active:scale-95 transition-all shadow-lg shadow-neon-gold/20"
        >
          + NEW ARENA
        </button>
      </div>

      {isLoading && lobbies.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <div className="w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-neon-cyan font-mono animate-pulse">SCANNING SEAS...</p>
        </div>
      ) : lobbies.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
          <p className="text-gray-500 mb-4">No active battles found in your sector.</p>
          <button onClick={() => setShowCreateModal(true)} className="text-neon-cyan hover:underline font-bold">
            Be the first to spawn an arena →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lobbies.map((lobby: any) => (
            <div key={lobby.address} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-neon-cyan/50 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs font-mono text-neon-cyan mb-1">LOBBY ID</div>
                  <div className="text-lg font-bold text-white truncate max-w-[180px]">{lobby.address}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-gray-500 mb-1">STATUS</div>
                  <div className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30 font-bold uppercase tracking-wider">
                    Joinable
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs">🏴‍☠️</div>
                  <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs">👤</div>
                </div>
                <button
                  onClick={() => joinGame(lobby.address, {} as any, {})}
                  className="bg-neon-cyan hover:bg-neon-blue text-black font-bold py-1.5 px-4 rounded-lg text-sm transition-colors"
                >
                  BOARD SHIP
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border-2 border-neon-gold/50 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-neon-gold mb-4 uppercase">SPAWN ARENA</h3>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-mono text-gray-500 mb-2">GAME LOBBY SEED (NUMBER)</label>
                <input
                  type="number"
                  value={newGameId}
                  onChange={(e) => setNewGameId(parseInt(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono focus:border-neon-gold outline-none transition-all"
                />
              </div>
              <p className="text-xs text-gray-400 italic">
                Each seed creates a unique coordinates map on the Solana ledger.
                Share this ID with your crew or agents to join.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 bg-slate-800 text-gray-400 font-bold rounded-xl hover:bg-slate-700 transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 py-3 bg-gradient-to-r from-neon-gold to-neon-orange text-black font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-neon-gold/20"
              >
                START BATTLE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
