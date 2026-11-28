'use client';

import { useState } from 'react';
import { GameState, Player, Resources } from '../types/game';
import { TERRITORY_RESOURCE_GENERATION } from '../types/game';
import { Icon, type IconName } from './ui/Icon';

interface ResourceCollectionPanelProps {
    gameState: GameState | null;
    currentPlayer: Player | null;
    onCollectResources: () => Promise<boolean>;
    isMyTurn: boolean;
}

const RESOURCE_ICONS: Record<keyof Resources, IconName> = {
    gold: 'gold',
    crew: 'crew',
    cannons: 'cannons',
    supplies: 'supplies',
    wood: 'wood',
    rum: 'rum',
};

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
        <div className="rounded-[var(--p8-radius)] border border-[var(--p8-brass-line)] bg-[var(--p8-deep)] p-4 shadow-[var(--p8-shadow-instrument)]">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.14em] text-[var(--p8-signal)]">
                    <Icon name="collect" size={14} />
                    Resource Collection
                </h3>
                <div className="text-sm text-[var(--p8-vellum-dim)]">
                    {territoryCount} territories
                </div>
            </div>

            {territoryCount === 0 ? (
                <div className="py-4 text-center">
                    <div className="mb-2 flex justify-center text-[var(--p8-vellum-mute)]">
                        <Icon name="island" size={36} />
                    </div>
                    <p className="text-sm text-[var(--p8-vellum-dim)]">
                        No territories controlled
                    </p>
                    <p className="mt-1 text-xs text-[var(--p8-vellum-mute)]">
                        Claim territories to generate resources
                    </p>
                </div>
            ) : (
                <>
                    {/* Current Resources */}
                    <div className="mb-4">
                        <h4 className="mb-2 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.14em] text-[var(--p8-vellum-dim)]">Current Resources:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm text-[var(--p8-vellum)]">
                            {(Object.keys(RESOURCE_ICONS) as (keyof Resources)[])
                                .filter((key) => key in currentPlayer.resources)
                                .slice(0, 4)
                                .map((key) => (
                                    <div key={key} className="flex items-center gap-1.5">
                                        <Icon name={RESOURCE_ICONS[key]} size={14} className="text-[var(--p8-lamp)]" />
                                        <span>{currentPlayer.resources[key]} {key[0]?.toUpperCase()}{key.slice(1)}</span>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Potential Income */}
                    {hasIncome && (
                        <div className="mb-4 rounded-[var(--p8-radius)] border border-[var(--p8-signal)] bg-[var(--p8-ink)] p-3">
                            <h4 className="mb-2 font-[var(--font-instrument)] text-[11px] uppercase tracking-[0.14em] text-[var(--p8-signal)]">Available Income:</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm text-[var(--p8-vellum)]">
                                {(Object.entries(potentialIncome) as [keyof Resources, number | undefined][])
                                    .filter((entry): entry is [keyof Resources, number] => typeof entry[1] === 'number' && entry[1] > 0)
                                    .map(([resource, amount]) => (
                                        <div key={resource} className="flex items-center gap-1.5 text-[var(--p8-lamp)]">
                                            <Icon name={RESOURCE_ICONS[resource]} size={14} />
                                            <span>+{amount}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Collect Button */}
                    <button
                        onClick={handleCollect}
                        disabled={!isMyTurn || isCollecting || !hasIncome}
                        className={`flex w-full items-center justify-center gap-2 rounded-[var(--p8-radius)] px-4 py-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${!isMyTurn || !hasIncome
                            ? 'border border-[var(--p8-brass-line)] bg-[var(--p8-ink)] text-[var(--p8-vellum-mute)]'
                            : 'border border-[var(--p8-lamp)] bg-[var(--p8-lamp)] text-[var(--p8-ink)] hover:bg-[var(--p8-lamp-glow)]'
                            }`}
                    >
                        {isCollecting ? (
                            <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Collecting...
                            </>
                        ) : !isMyTurn ? (
                            'Wait for your turn'
                        ) : !hasIncome ? (
                            'No resources available'
                        ) : (
                            <>
                                <Icon name="collect" size={15} />
                                Collect Resources
                            </>
                        )}
                    </button>

                    {!isMyTurn && (
                        <p className="mt-2 text-center text-xs text-[var(--p8-vellum-mute)]">
                            Resources are collected automatically at turn end
                        </p>
                    )}
                </>
            )}
        </div>
    );
}
