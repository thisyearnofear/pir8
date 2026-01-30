'use client';

import { useEffect, useState } from 'react';
import { GameState } from '../types/game';

interface VictoryScreenProps {
    gameState: GameState | null;
    currentPlayerPK?: string;
    onNewGame: () => void;
    onReturnToLobby: () => void;
    isPracticeMode?: boolean;
}

export default function VictoryScreen({
    gameState,
    currentPlayerPK,
    onNewGame,
    onReturnToLobby,
    isPracticeMode = false
}: VictoryScreenProps) {
    const [showConfetti, setShowConfetti] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareText, setShareText] = useState('');
    const [epicMoment, setEpicMoment] = useState('');
    const [showEpicAnimation, setShowEpicAnimation] = useState(false);

    useEffect(() => {
        if (gameState?.gameStatus === 'completed') {
            setShowConfetti(true);
            setShowEpicAnimation(true);
            setTimeout(() => setShowStats(true), 1500);
            setTimeout(() => setShowConfetti(false), 8000);

            // Generate epic moment and share text
            generateEpicContent();
        }
    }, [gameState?.gameStatus]);

    const generateEpicContent = () => {
        if (!gameState) return;

        const winner = gameState.players.find(p => p.publicKey === gameState.winner);
        const isWinner = winner?.publicKey === currentPlayerPK;
        const winnerName = winner?.username || 'Anonymous Pirate';
        const totalGold = winner?.resources.gold || 0;
        const shipsDestroyed = gameState.players.reduce((total, p) =>
            total + p.ships.filter(s => s.health === 0).length, 0
        );
        const territoriesControlled = winner?.controlledTerritories.length || 0;

        // Generate epic moment description
        const epicMoments = [
            `⚔️ ${shipsDestroyed} enemy ships sent to Davy Jones' locker!`,
            `🏴‍☠️ Conquered ${territoriesControlled} territories across the seven seas!`,
            `💰 Plundered ${totalGold.toLocaleString()} pieces of gold!`,
            `⚡ Victory achieved in just ${gameState.turnNumber} strategic turns!`,
            `🌊 Dominated the battlefield with tactical supremacy!`
        ];

        setEpicMoment(epicMoments[Math.floor(Math.random() * epicMoments.length)] || 'Epic victory achieved!');

        // Generate viral share text
        const gameUrl = `${window.location.origin}?join=${gameState.gameId}`;

        if (isWinner) {
            setShareText(
                `🏴‍☠️ PIRATE KING CROWNED! 👑\n\n` +
                `Just dominated the seven seas in @PIR8Game!\n` +
                `💰 Plundered ${totalGold.toLocaleString()} gold\n` +
                `⚔️ Sunk ${shipsDestroyed} enemy ships\n` +
                `🏆 Victory in ${gameState.turnNumber} turns\n` +
                `🌊 Controlled ${territoriesControlled} territories\n\n` +
                `Think you can challenge the new Pirate King? ⚓\n` +
                `🎮 ${gameUrl}\n\n` +
                `#PIR8Game #PirateKing #Web3Gaming #Solana #NavalWarfare`
            );
        } else {
            setShareText(
                `🏴‍☠️ Epic naval battle just ended!\n\n` +
                `${winnerName} claimed the Pirate King crown in @PIR8Game\n` +
                `💀 ${shipsDestroyed} ships sent to Davy Jones' locker\n` +
                `⚔️ ${gameState.turnNumber} turns of strategic warfare\n` +
                `🌊 ${territoriesControlled} territories conquered\n\n` +
                `Ready to challenge for the crown? ⚓\n` +
                `🎮 ${gameUrl}\n\n` +
                `#PIR8Game #NavalWarfare #Web3Gaming #ChallengeAccepted`
            );
        }
    };

    const handleShare = async (platform: 'twitter' | 'discord' | 'copy' | 'screenshot') => {
        switch (platform) {
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
                break;
            case 'discord':
                navigator.clipboard.writeText(shareText);
                // Show success toast
                break;
            case 'copy':
                navigator.clipboard.writeText(shareText);
                break;
            case 'screenshot':
                // Trigger screenshot functionality (would need html2canvas or similar)
                break;
        }
        setShowShareModal(false);
    };

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
        <div className="fixed inset-0 bg-black/95 backdrop-blur-lg flex items-center justify-center z-modal"
             role="dialog" aria-modal="true">
            {/* Epic Confetti & Particle Effects */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Confetti */}
                    {[...Array(100)].map((_, i) => (
                        <div
                            key={`confetti-${i}`}
                            className="absolute animate-bounce"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 3}s`,
                                animationDuration: `${2 + Math.random() * 3}s`,
                                fontSize: `${12 + Math.random() * 20}px`,
                                transform: `rotate(${Math.random() * 360}deg)`
                            }}
                        >
                            {['🎉', '🏆', '⚡', '💰', '🏴‍☠️', '⚔️', '🌊', '💎', '👑', '🔥'][Math.floor(Math.random() * 10)]}
                        </div>
                    ))}

                    {/* Fireworks Effect */}
                    {isWinner && [...Array(20)].map((_, i) => (
                        <div
                            key={`firework-${i}`}
                            className="absolute w-2 h-2 bg-neon-gold rounded-full animate-ping"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${1 + Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Main Victory Modal */}
            <div className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 
                            rounded-3xl border-2 ${isWinner ? 'border-neon-gold' : 'border-neon-cyan'} 
                            p-8 max-w-4xl w-full mx-4 relative overflow-hidden
                            shadow-2xl ${isWinner ? 'shadow-neon-gold/30' : 'shadow-neon-cyan/30'}
                            ${showEpicAnimation ? 'animate-in slide-in-from-bottom-8 duration-700' : ''}`}>

                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl">
                    <div className={`absolute -top-20 -right-20 w-40 h-40 ${isWinner ? 'bg-neon-gold/10' : 'bg-neon-cyan/10'} 
                                    rounded-full blur-3xl animate-pulse`}></div>
                    <div className={`absolute -bottom-20 -left-20 w-40 h-40 ${isWinner ? 'bg-neon-orange/10' : 'bg-neon-magenta/10'} 
                                    rounded-full blur-3xl animate-pulse delay-1000`}></div>
                </div>

                {/* Epic Header */}
                <div className="relative text-center mb-8">
                    <div className={`text-8xl mb-4 animate-bounce filter drop-shadow-2xl ${showEpicAnimation ? 'animate-in zoom-in duration-1000 delay-300' : ''}`}>
                        {isWinner ? '👑' : playerRank <= 2 ? '🥈' : playerRank <= 3 ? '🥉' : '⚔️'}
                    </div>

                    <h1 className={`text-6xl font-black mb-4 drop-shadow-2xl
                                   ${isWinner ? 'text-transparent bg-clip-text bg-gradient-to-r from-neon-gold via-neon-orange to-neon-gold animate-pulse'
                            : 'text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-cyan'}
                                   ${showEpicAnimation ? 'animate-in slide-in-from-top duration-1000 delay-500' : ''}`}>
                        {isWinner ? 'PIRATE KING!' : 'BATTLE COMPLETE'}
                    </h1>

                    <p className={`text-2xl font-bold mb-2 ${isWinner ? 'text-neon-gold' : 'text-neon-cyan'}
                                  ${showEpicAnimation ? 'animate-in fade-in duration-1000 delay-700' : ''}`}>
                        {isWinner
                            ? 'You have conquered the seven seas!'
                            : `${winner?.username || winner?.publicKey?.slice(0, 8) || 'Unknown'} claims the crown!`
                        }
                    </p>

                    {!isWinner && (
                        <p className={`text-lg text-gray-300 font-semibold
                                      ${showEpicAnimation ? 'animate-in fade-in duration-1000 delay-900' : ''}`}>
                            You finished in {playerRank}{playerRank === 1 ? 'st' : playerRank === 2 ? 'nd' : playerRank === 3 ? 'rd' : 'th'} place
                        </p>
                    )}

                    {/* Epic Moment Display */}
                    {epicMoment && (
                        <div className={`mt-4 p-4 bg-gradient-to-r ${isWinner ? 'from-neon-gold/20 to-neon-orange/20 border-neon-gold'
                            : 'from-neon-cyan/20 to-neon-blue/20 border-neon-cyan'} 
                                        border-2 rounded-xl backdrop-blur-sm
                                        ${showEpicAnimation ? 'animate-in slide-in-from-bottom duration-1000 delay-1100' : ''}`}>
                            <p className="text-xl font-bold text-white drop-shadow-lg">{epicMoment}</p>
                        </div>
                    )}
                </div>

                {/* Share Button - Prominent Placement */}
                <div className={`text-center mb-6 ${showEpicAnimation ? 'animate-in fade-in duration-1000 delay-1300' : ''}`}>
                    <button
                        onClick={() => setShowShareModal(true)}
                        className="group relative overflow-hidden bg-gradient-to-r from-neon-magenta via-neon-orange to-neon-gold 
                                   text-black font-black py-4 px-8 rounded-xl border-2 border-neon-gold
                                   hover:shadow-2xl hover:shadow-neon-gold/50 hover:scale-105 
                                   active:scale-95 transition-all duration-300 text-lg"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                        translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <div className="relative flex items-center justify-center gap-3">
                            <span className="text-2xl animate-pulse">🚀</span>
                            <span>SHARE EPIC VICTORY</span>
                            <span className="text-2xl animate-pulse">🏆</span>
                        </div>
                    </button>
                </div>

                {/* Victory Reason & Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Victory Details */}
                    {winner && (
                        <div className={`p-6 bg-gradient-to-br from-slate-800/90 to-slate-700/90 
                                        rounded-xl border border-neon-gold/50 backdrop-blur-sm
                                        ${showEpicAnimation ? 'animate-in slide-in-from-left duration-1000 delay-800' : ''}`}>
                            <h3 className="text-xl font-black text-neon-gold mb-4 flex items-center gap-2">
                                <span className="text-2xl">🏆</span>
                                Victory Achieved
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300">Dominance Score:</span>
                                    <span className="text-xl font-bold text-neon-gold">{winner.totalScore}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300">Territories:</span>
                                    <span className="text-lg font-bold text-neon-cyan">{winner.controlledTerritories.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300">Gold Plundered:</span>
                                    <span className="text-lg font-bold text-neon-gold">{winner.resources.gold.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300">Fleet Power:</span>
                                    <span className="text-lg font-bold text-neon-orange">
                                        {winner.ships.reduce((total, ship) => total + ship.health, 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Personal Performance */}
                    {currentPlayer && (
                        <div className={`p-6 bg-gradient-to-br from-slate-800/90 to-slate-700/90 
                                        rounded-xl border border-neon-cyan/50 backdrop-blur-sm
                                        ${showEpicAnimation ? 'animate-in slide-in-from-right duration-1000 delay-1000' : ''}`}>
                            <h3 className="text-xl font-black text-neon-cyan mb-4 flex items-center gap-2">
                                <span className="text-2xl">📊</span>
                                Your Performance
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300">Final Rank:</span>
                                    <span className="text-xl font-bold text-neon-orange">#{playerRank}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300">Ships Built:</span>
                                    <span className="text-lg font-bold text-neon-blue">{currentPlayer.ships.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300">Territories:</span>
                                    <span className="text-lg font-bold text-neon-magenta">{currentPlayer.controlledTerritories.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300">Speed Bonus:</span>
                                    <span className="text-lg font-bold text-neon-green">+{currentPlayer.speedBonusAccumulated || 0}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Final Standings */}
                {showStats && (
                    <div className={`mb-6 ${showEpicAnimation ? 'animate-in fade-in duration-1000 delay-1200' : ''}`}>
                        <h3 className="text-2xl font-black text-neon-cyan mb-4 text-center flex items-center justify-center gap-2">
                            <span className="text-3xl">🏴‍☠️</span>
                            FINAL STANDINGS
                            <span className="text-3xl">🏴‍☠️</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto custom-scrollbar">
                            {finalStats.map((player, index) => (
                                <div
                                    key={player.publicKey}
                                    className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105
                                               ${player.publicKey === currentPlayerPK
                                            ? 'border-neon-orange bg-neon-orange/10 shadow-lg shadow-neon-orange/20'
                                            : index === 0
                                                ? 'border-neon-gold bg-neon-gold/10 shadow-lg shadow-neon-gold/20'
                                                : 'border-slate-600 bg-slate-800/50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">
                                                {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⚔️'}
                                            </span>
                                            <div>
                                                <div className="font-black text-lg">
                                                    {player.username || `${player.publicKey.slice(0, 6)}...${player.publicKey.slice(-4)}`}
                                                </div>
                                                {player.publicKey === currentPlayerPK && (
                                                    <span className="text-xs bg-neon-orange text-black px-2 py-1 rounded-full font-bold">YOU</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-xl font-black text-neon-gold">
                                            {player.totalScore}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        <div className="text-center">
                                            <div className="text-neon-cyan font-bold">🏴‍☠️</div>
                                            <div className="text-xs text-gray-400">Territories</div>
                                            <div className="font-bold">{player.territoryCount}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-neon-orange font-bold">🚢</div>
                                            <div className="text-xs text-gray-400">Fleet</div>
                                            <div className="font-bold">{player.fleetPower}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-neon-gold font-bold">💰</div>
                                            <div className="text-xs text-gray-400">Resources</div>
                                            <div className="font-bold">{player.resourceValue}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Practice Mode Upsell */}
                {isPracticeMode && (
                    <div className={`bg-gradient-to-r from-neon-gold/20 to-neon-orange/20 border border-neon-gold/50 
                                    rounded-xl p-4 mb-4 ${showEpicAnimation ? 'animate-in slide-in-from-bottom duration-1000 delay-1300' : ''}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">⛓️</span>
                            <h4 className="font-bold text-neon-gold">Ready for Real Battles?</h4>
                        </div>
                        <p className="text-sm text-gray-300 mb-3">
                            Connect a Solana wallet to compete on-chain for real rankings, rewards, and glory!
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                            <span className="bg-slate-700/50 px-2 py-1 rounded">🏆 Leaderboard ranking</span>
                            <span className="bg-slate-700/50 px-2 py-1 rounded">💰 SOL rewards</span>
                            <span className="bg-slate-700/50 px-2 py-1 rounded">🔒 Private entry via Zcash</span>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className={`flex flex-col sm:flex-row gap-4 ${showEpicAnimation ? 'animate-in slide-in-from-bottom duration-1000 delay-1400' : ''}`}>
                    <button
                        onClick={onReturnToLobby}
                        className="flex-1 py-4 px-6 rounded-xl bg-slate-600/80 hover:bg-slate-500/80 
                                   text-white font-bold transition-all duration-300 border border-slate-500
                                   hover:scale-105 active:scale-95"
                    >
                        🏠 Return to Harbor
                    </button>
                    <button
                        onClick={onNewGame}
                        className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-blue 
                                   hover:from-neon-blue hover:to-neon-cyan text-black font-black transition-all duration-300
                                   hover:shadow-2xl hover:shadow-neon-cyan/50 hover:scale-105 active:scale-95
                                   border-2 border-neon-cyan"
                    >
                        ⚔️ Battle Again!
                    </button>
                </div>

                {/* Game Duration */}
                <div className={`text-center mt-6 text-sm text-gray-400 font-mono
                                ${showEpicAnimation ? 'animate-in fade-in duration-1000 delay-1600' : ''}`}>
                    ⏱️ Epic Battle Duration: {gameState.turnNumber} strategic turns
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border-2 border-neon-magenta 
                                    p-8 max-w-md w-full mx-4 shadow-2xl shadow-neon-magenta/30 animate-in zoom-in duration-300">
                        <h3 className="text-2xl font-black text-neon-magenta mb-6 text-center flex items-center justify-center gap-2">
                            <span className="text-3xl">🚀</span>
                            Share Your Victory
                        </h3>

                        <div className="space-y-4">
                            <button
                                onClick={() => handleShare('twitter')}
                                className="w-full p-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl 
                                           transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                            >
                                <span className="text-xl">🐦</span>
                                Share on Twitter
                            </button>

                            <button
                                onClick={() => handleShare('discord')}
                                className="w-full p-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl 
                                           transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                            >
                                <span className="text-xl">💬</span>
                                Copy for Discord
                            </button>

                            <button
                                onClick={() => handleShare('copy')}
                                className="w-full p-4 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-xl 
                                           transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                            >
                                <span className="text-xl">📋</span>
                                Copy to Clipboard
                            </button>
                        </div>

                        <button
                            onClick={() => setShowShareModal(false)}
                            className="w-full mt-6 p-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl 
                                       transition-all duration-300"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}