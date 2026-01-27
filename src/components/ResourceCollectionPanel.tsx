'use client';

import { useState } from 'react';
import { GameState, Player, Resources } from '../types/game';
import { TERRITORY_RESOURCE_GENERATION } from '../types/game';

interface ResourceCollectionPanelProps {
    gameState: GameState | null;
    currentPlayer: Player | null;
    onCollectResources: () => Promise<boolean>;
    isMyTurn: boolean;
}

export default function ResourceCollectionPanel({
    gameState,
    currentPlayer,
    onCollectResources,
    isMyTurn
}: ResourceCollectionPanelProps) {
    const [isCollecting, setIsCollecting] = useState(false);

    if (!gameState || !currentPlayer || gameState.gameStatus !== 'active') {
        return null;
    }

    // Calculate potential income from controlled territories
    const calculatePotentialIncome = (): Partial<Resources> => {
        const income: Partial<Resources> = { gold: 0, crew: 0, cannons: 0, supplies: 0 };

        for (const coordStr of currentPlayer.controlledTerritories) {
            const coords = coordStr.split(',');
            if (coords.length !== 2 || !coords[0] || !coords[1]) continue;

            const x = parseInt(coords[0]);
            const y = parseInt(coords[1]);

            if (isNaN(x) || isNaN(y)) continue;

            const territory = gameState.gameMap.cells[x]?.[y];

            if (territory && territory.owner === currentPlayer.publicKey) {
                const generation = TERRITORY_RESOURCE_GENERATION[territory.type];
                if (generation) {
                    Object.entries(generation).forEach(([resource, amount]) => {
                        if (typeof amount === 'number' && resource in income) {
                            const resourceKey = resource as keyof Resources;
                            income[resourceKey] = (income[resourceKey] || 0) + amount;
                        }
                    });
                }
            }
        }

        return income;
    };

    const handleCollect = async () => {
        if (!isMyTurn || isCollecting) return;

        setIsCollecting(true);
        try {
            const success = await onCollectResources();
            if (success) {
                // Success feedback handled by parent component
            }
        } catch (error) {
            console.error('Resource collection failed:', error);
        } finally {
            setIsCollecting(false);
        }
    };

    const potentialIncome = calculatePotentialIncome();
    const hasIncome = Object.values(potentialIncome).some(amount => amount && amount > 0);
    const territoryCount = currentPlayer.controlledTerritories.length;

    return (
        <div className="bg-slate-800 rounded-lg border border-neon-cyan border-opacity-30 p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-neon-cyan flex items-center gap-2">
                    💰 Resource Collection
                </h3>
                <div className="text-sm text-gray-400">
                    {territoryCount} territories
                </div>
            </div>

            {territoryCount === 0 ? (
                <div className="text-center py-4">
                    <div className="text-4xl mb-2">🗺️</div>
                    <p className="text-gray-400 text-sm">
                        No territories controlled
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                        Claim territories to generate resources
                    </p>
                </div>
            ) : (
                <>
                    {/* Current Resources */}
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">Current Resources:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-1">
                                <span className="text-yellow-400">🪙</span>
                                <span>{currentPlayer.resources.gold} Gold</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-blue-400">👥</span>
                                <span>{currentPlayer.resources.crew} Crew</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-red-400">💣</span>
                                <span>{currentPlayer.resources.cannons} Cannons</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-green-400">📦</span>
                                <span>{currentPlayer.resources.supplies} Supplies</span>
                            </div>
                        </div>
                    </div>

                    {/* Potential Income */}
                    {hasIncome && (
                        <div className="mb-4 p-3 bg-slate-700 rounded border border-green-500 border-opacity-30">
                            <h4 className="text-sm font-semibold text-green-400 mb-2">Available Income:</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {potentialIncome.gold && potentialIncome.gold > 0 && (
                                    <div className="flex items-center gap-1 text-yellow-400">
                                        <span>🪙</span>
                                        <span>+{potentialIncome.gold}</span>
                                    </div>
                                )}
                                {potentialIncome.crew && potentialIncome.crew > 0 && (
                                    <div className="flex items-center gap-1 text-blue-400">
                                        <span>👥</span>
                                        <span>+{potentialIncome.crew}</span>
                                    </div>
                                )}
                                {potentialIncome.cannons && potentialIncome.cannons > 0 && (
                                    <div className="flex items-center gap-1 text-red-400">
                                        <span>💣</span>
                                        <span>+{potentialIncome.cannons}</span>
                                    </div>
                                )}
                                {potentialIncome.supplies && potentialIncome.supplies > 0 && (
                                    <div className="flex items-center gap-1 text-green-400">
                                        <span>📦</span>
                                        <span>+{potentialIncome.supplies}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Collect Button */}
                    <button
                        onClick={handleCollect}
                        disabled={!isMyTurn || isCollecting || !hasIncome}
                        className={`w-full py-2 px-4 rounded font-semibold transition-all ${!isMyTurn
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : !hasIncome
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : isCollecting
                                    ? 'bg-green-600 text-white cursor-wait'
                                    : 'bg-green-600 hover:bg-green-500 text-white hover:shadow-lg hover:shadow-green-500/20'
                            }`}
                    >
                        {isCollecting ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                Collecting...
                            </div>
                        ) : !isMyTurn ? (
                            'Wait for your turn'
                        ) : !hasIncome ? (
                            'No resources available'
                        ) : (
                            '💰 Collect Resources'
                        )}
                    </button>

                    {!isMyTurn && (
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Resources are collected automatically at turn end
                        </p>
                    )}
                </>
            )}
        </div>
    );
}