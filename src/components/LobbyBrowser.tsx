/**
 * LobbyBrowser - Component for browsing and joining multi-game lobbies
 * Following: MODULAR, CLEAN, PERFORMANT
 */

'use client';

import { useState, useEffect } from 'react';
import { usePirateGameState } from '@/hooks/usePirateGameState';
import { useSafeWallet } from '@/components/SafeWalletProvider';

export default function LobbyBrowser() {
  const { lobbies, fetchLobbies, isLoading } = usePirateGameState();
  const { publicKey, wallet } = useSafeWallet();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGameId, setNewGameId] = useState<number>(Math.floor(Math.random() * 1000));
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!publicKey) return;
    fetchLobbies();
    const interval = setInterval(fetchLobbies, 10000);
    return () => clearInterval(interval);
  }, [fetchLobbies, publicKey]);

  const handleCreate = async () => {
    if (!publicKey || !wallet) {
      console.warn('Wallet not connected');
      return;
    }

    setIsCreating(true);
    try {
      // Use proper client-side transaction building
      const { initializeGame, joinGame, createWalletAdapter, testProgramConnection } = await import("@/lib/client/transactionBuilder");

      console.log(`Creating game with seed: ${newGameId}`);

      // Create a wallet adapter compatible object
      const walletAdapter = createWalletAdapter({ ...wallet, publicKey });

      // Test program connection first
      console.log('Testing program connection...');
      const programConnected = await testProgramConnection(walletAdapter);
      if (!programConnected) {
        throw new Error('Program not found or not deployed. Please check the program ID and network.');
      }
      console.log('Program connection successful');

      console.log('Step 1: Initializing game...');
      const initTx = await initializeGame(walletAdapter, newGameId, 'Casual');
      console.log('Game initialized successfully:', initTx);

      console.log('Step 2: Joining game...');
      const joinTx = await joinGame(walletAdapter, newGameId);
      console.log('Joined game successfully:', joinTx);

      setShowCreateModal(false);
      console.log('Game creation completed successfully');
      // TODO: Update UI to show the new game state

    } catch (error) {
      console.error('Failed to create game:', error);
      // Show user-friendly error message
      alert(`Failed to create game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinLobby = async (lobbyAddress: string) => {
    if (!publicKey || !wallet) {
      console.warn('Wallet not connected');
      return;
    }

    setIsJoining(true);
    try {
      // Use proper client-side transaction building
      const { joinGame, createWalletAdapter } = await import("@/lib/client/transactionBuilder");

      console.log(`Joining lobby: ${lobbyAddress}`);

      // Create a wallet adapter compatible object
      const walletAdapter = createWalletAdapter({ ...wallet, publicKey });

      const joinTx = await joinGame(walletAdapter);
      console.log('Joined lobby:', joinTx);

      // TODO: Update UI to show the joined game state

    } catch (error) {
      console.error('Failed to join lobby:', error);
    } finally {
      setIsJoining(false);
    }
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
                  onClick={() => handleJoinLobby(lobby.address)}
                  disabled={isJoining}
                  className="bg-neon-cyan hover:bg-neon-blue text-black font-bold py-1.5 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {isJoining ? 'BOARDING...' : 'BOARD SHIP'}
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
                disabled={isCreating}
                className="flex-1 py-3 bg-gradient-to-r from-neon-gold to-neon-orange text-black font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-neon-gold/20 disabled:opacity-50"
              >
                {isCreating ? 'SPAWNING...' : 'START BATTLE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
