'use client';

import { useEffect, useState } from 'react';
import { GameState } from '../types/game';

interface VictoryScreenProps {
    gameState: GameState | null;
    currentPlayerPK?: string;
    onNewGame: () => void;
    onReturnToLobby: () => void;
}

export default function VictoryScreen({
    gameState,
    currentPlayerPK,
    onNewGame,
    onReturnToLobby
}: VictoryScreenProps) {
    const [showConfetti, setShowConfetti] = useState(false);
    const [showStats, setShowStats] = useState(false);

    useEffect(() => {
        if (gameState?.gameStatus === 'completed') {
            setShowConfetti(true);
            setTimeout(() => setShowStats(true), 1000);
        }
    }, [gameState?.gameStatus]);

    if (!gameState || gameState.gameStatus !== 'completed') {
        return null;
    }

    const winner = gameState.players.find(p => p.publicKey === gameState.winner);
    const isWinner = winner?.publicKey === currentPlayerPK;
    const currentPlayer = gameState.players.find(p => p.publicKey === currentPlayerPK);

    // Calculate final stats
    const calculateStats = () => {
        const stats = gameState.players.map(player => {
            const fleetPower = player.ships.reduce((total, ship) => total + ship.health, 0);
            const resourceValue =
                player.resources.gold +
                (player.resources.crew * 5) +
                (player.resources.cannons * 10) +
                (player.resources.supplies * 2);

            return {
                ...player,
                fleetPower,
                resourceValue,
                territoryCount: player.controlledTerritories.length
            };
        });

        return stats.sort((a, b) => {
            if (a.publicKey === gameState.winner) return -1;
            if (b.publicKey === gameState.winner) return 1;
            return b.totalScore - a.totalScore;
        });
    };

    const finalStats = calculateStats();
    const playerRank = finalStats.findIndex(p => p.publicKey === currentPlayerPK) + 1;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            {/* Confetti Effect */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-bounce"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${2 + Math.random() * 2}s`
                            }}
                        >
                            {['🎉', '🏆', '⚡', '💰', '🏴‍☠️'][Math.floor(Math.random() * 5)]}
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-slate-900 rounded-lg border-2 border-neon-cyan p-8 max-w-2xl w-full mx-4 relative">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="text-6xl mb-4">
                        {isWinner ? '🏆' : playerRank <= 2 ? '🥈' : playerRank <= 3 ? '🥉' : '⚔️'}
                    </div>

                    <h1 className={`text-4xl font-bold mb-2 ${isWinner ? 'text-yellow-400' : 'text-neon-cyan'
                        }`}>
                        {isWinner ? 'VICTORY!' : 'BATTLE COMPLETE'}
                    </h1>

                    <p className="text-xl text-gray-300">
                        {isWinner
                            ? 'You have conquered the seas!'
                            : `${winner?.username || winner?.publicKey?.slice(0, 8) || 'Unknown'} claims victory!`
                        }
                    </p>

                    {!isWinner && (
                        <p className="text-lg text-gray-400 mt-2">
                            You finished in {playerRank}{playerRank === 1 ? 'st' : playerRank === 2 ? 'nd' : playerRank === 3 ? 'rd' : 'th'} place
                        </p>
                    )}
                </div>

                {/* Victory Reason */}
                {winner && (
                    <div className="mb-6 p-4 bg-slate-800 rounded border border-yellow-500 border-opacity-30">
                        <h3 className="text-lg font-semibold text-yellow-400 mb-2">Victory Condition:</h3>
                        <p className="text-gray-300">
                            {/* This would be determined by the smart contract */}
                            Achieved dominance through strategic conquest
                        </p>
                    </div>
                )}

                {/* Player Stats */}
                {showStats && (
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-neon-cyan mb-3">Final Standings:</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {finalStats.map((player, index) => (
                                <div
                                    key={player.publicKey}
                                    className={`p-3 rounded border ${player.publicKey === currentPlayerPK
                                        ? 'border-neon-cyan bg-neon-cyan bg-opacity-10'
                                        : 'border-gray-600 bg-slate-800'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">
                                                {index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⚔️'}
                                            </span>
                                            <span className="font-semibold">
                                                {player.username || player.publicKey.slice(0, 8)}
                                            </span>
                                            {player.publicKey === currentPlayerPK && (
                                                <span className="text-xs bg-neon-cyan text-black px-2 py-1 rounded">YOU</span>
                                            )}
                                        </div>
                                        <div className="text-lg font-bold text-yellow-400">
                                            {player.totalScore} pts
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-400">
                                        <div>
                                            <div className="text-blue-400">⚓ Territories</div>
                                            <div>{player.territoryCount}</div>
                                        </div>
                                        <div>
                                            <div className="text-red-400">🚢 Fleet Power</div>
                                            <div>{player.fleetPower}</div>
                                        </div>
                                        <div>
                                            <div className="text-green-400">💰 Resources</div>
                                            <div>{player.resourceValue}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Personal Stats */}
                {currentPlayer && showStats && (
                    <div className="mb-6 p-4 bg-slate-800 rounded border border-neon-cyan border-opacity-30">
                        <h3 className="text-lg font-semibold text-neon-cyan mb-3">Your Performance:</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-gray-400">Ships Built</div>
                                <div className="text-lg font-semibold">{currentPlayer.ships.length}</div>
                            </div>
                            <div>
                                <div className="text-gray-400">Territories Claimed</div>
                                <div className="text-lg font-semibold">{currentPlayer.controlledTerritories.length}</div>
                            </div>
                            <div>
                                <div className="text-gray-400">Final Resources</div>
                                <div className="text-lg font-semibold">
                                    {currentPlayer.resources.gold +
                                        currentPlayer.resources.crew +
                                        currentPlayer.resources.cannons +
                                        currentPlayer.resources.supplies}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-400">Speed Bonus</div>
                                <div className="text-lg font-semibold text-green-400">
                                    +{currentPlayer.speedBonusAccumulated || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={onReturnToLobby}
                        className="flex-1 py-3 px-6 rounded bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-all"
                    >
                        Return to Lobby
                    </button>
                    <button
                        onClick={onNewGame}
                        className="flex-1 py-3 px-6 rounded bg-neon-cyan hover:bg-cyan-400 text-black font-semibold transition-all hover:shadow-lg hover:shadow-neon-cyan/20"
                    >
                        Play Again
                    </button>
                </div>

                {/* Game Duration */}
                <div className="text-center mt-4 text-sm text-gray-500">
                    Game Duration: {gameState.turnNumber} turns
                </div>
            </div>
        </div>
    );
}