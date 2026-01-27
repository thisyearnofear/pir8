'use client';

import { useState } from 'react';
import { GameState, Player, ShipType, Resources } from '../types/game';
import { SHIP_CONFIGS } from '../types/game';

interface ShipBuildingPanelProps {
    gameState: GameState | null;
    currentPlayer: Player | null;
    onBuildShip: (shipType: ShipType, portX: number, portY: number) => Promise<boolean>;
    isMyTurn: boolean;
}

const SHIP_COSTS: Record<ShipType, Partial<Resources>> = {
    sloop: { gold: 500, crew: 10, cannons: 5, supplies: 20 },
    frigate: { gold: 1200, crew: 25, cannons: 15, supplies: 40 },
    galleon: { gold: 2500, crew: 50, cannons: 30, supplies: 80 },
    flagship: { gold: 5000, crew: 100, cannons: 60, supplies: 150 }
};

const SHIP_DESCRIPTIONS = {
    sloop: 'Fast scout ship - High speed, low health',
    frigate: 'Balanced warship - Good all-around stats',
    galleon: 'Heavy battleship - High health, slow speed',
    flagship: 'Ultimate vessel - Maximum firepower'
};

const SHIP_EMOJIS = {
    sloop: '⛵',
    frigate: '🚢',
    galleon: '🛳️',
    flagship: '🚤'
};

export default function ShipBuildingPanel({
    gameState,
    currentPlayer,
    onBuildShip,
    isMyTurn
}: ShipBuildingPanelProps) {
    const [selectedShipType, setSelectedShipType] = useState<ShipType>('sloop');
    const [selectedPort, setSelectedPort] = useState<{ x: number; y: number } | null>(null);
    const [isBuilding, setIsBuilding] = useState(false);
    const [showPortSelector, setShowPortSelector] = useState(false);

    if (!gameState || !currentPlayer || gameState.gameStatus !== 'active') {
        return null;
    }

    // Find controlled ports
    const getControlledPorts = () => {
        const ports: Array<{ x: number; y: number; coordinate: string }> = [];

        for (const coordStr of currentPlayer.controlledTerritories) {
            const coords = coordStr.split(',');
            if (coords.length !== 2 || !coords[0] || !coords[1]) continue;

            const x = parseInt(coords[0]);
            const y = parseInt(coords[1]);

            if (isNaN(x) || isNaN(y)) continue;

            const territory = gameState.gameMap.cells[x]?.[y];

            if (territory && territory.type === 'port' && territory.owner === currentPlayer.publicKey) {
                ports.push({ x, y, coordinate: coordStr });
            }
        }

        return ports;
    };

    const canAffordShip = (shipType: ShipType): boolean => {
        const cost = SHIP_COSTS[shipType];
        return Object.entries(cost).every(([resource, amount]) => {
            const playerAmount = currentPlayer.resources[resource as keyof Resources] || 0;
            return playerAmount >= (amount || 0);
        });
    };

    const handleBuildShip = async () => {
        if (!selectedPort || !isMyTurn || isBuilding) return;

        setIsBuilding(true);
        try {
            const success = await onBuildShip(selectedShipType, selectedPort.x, selectedPort.y);
            if (success) {
                setSelectedPort(null);
                setShowPortSelector(false);
            }
        } catch (error) {
            console.error('Ship building failed:', error);
        } finally {
            setIsBuilding(false);
        }
    };

    const controlledPorts = getControlledPorts();
    const canAfford = canAffordShip(selectedShipType);
    const selectedCost = SHIP_COSTS[selectedShipType];

    return (
        <div className="bg-slate-800 rounded-lg border border-neon-cyan border-opacity-30 p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-neon-cyan flex items-center gap-2">
                    🛠️ Ship Building
                </h3>
                <div className="text-sm text-gray-400">
                    {controlledPorts.length} ports
                </div>
            </div>

            {controlledPorts.length === 0 ? (
                <div className="text-center py-4">
                    <div className="text-4xl mb-2">⚓</div>
                    <p className="text-gray-400 text-sm">
                        No ports controlled
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                        Claim ports to build ships
                    </p>
                </div>
            ) : (
                <>
                    {/* Ship Type Selection */}
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">Select Ship Type:</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {(Object.keys(SHIP_COSTS) as ShipType[]).map((shipType) => (
                                <button
                                    key={shipType}
                                    onClick={() => setSelectedShipType(shipType)}
                                    className={`p-2 rounded border text-sm transition-all ${selectedShipType === shipType
                                        ? 'border-neon-cyan bg-neon-cyan bg-opacity-20 text-neon-cyan'
                                        : 'border-gray-600 hover:border-gray-500 text-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-1 mb-1">
                                        <span className="text-lg">{SHIP_EMOJIS[shipType]}</span>
                                        <span className="font-semibold capitalize">{shipType}</span>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {SHIP_DESCRIPTIONS[shipType]}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ship Stats */}
                    <div className="mb-4 p-3 bg-slate-700 rounded">
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">
                            {SHIP_EMOJIS[selectedShipType]} {selectedShipType.charAt(0).toUpperCase() + selectedShipType.slice(1)} Stats:
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>Health: {SHIP_CONFIGS[selectedShipType].maxHealth}</div>
                            <div>Attack: {SHIP_CONFIGS[selectedShipType].attack}</div>
                            <div>Defense: {SHIP_CONFIGS[selectedShipType].defense}</div>
                            <div>Speed: {SHIP_CONFIGS[selectedShipType].speed}</div>
                        </div>
                    </div>

                    {/* Cost Display */}
                    <div className="mb-4 p-3 bg-slate-700 rounded">
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">Cost:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(selectedCost).map(([resource, cost]) => {
                                const playerAmount = currentPlayer.resources[resource as keyof Resources] || 0;
                                const canAffordThis = playerAmount >= (cost || 0);

                                return (
                                    <div
                                        key={resource}
                                        className={`flex items-center gap-1 ${canAffordThis ? 'text-green-400' : 'text-red-400'
                                            }`}
                                    >
                                        <span>
                                            {resource === 'gold' ? '🪙' :
                                                resource === 'crew' ? '👥' :
                                                    resource === 'cannons' ? '💣' : '📦'}
                                        </span>
                                        <span>{cost} {resource}</span>
                                        <span className="text-xs text-gray-500">
                                            ({playerAmount} available)
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Port Selection */}
                    {!showPortSelector ? (
                        <button
                            onClick={() => setShowPortSelector(true)}
                            disabled={!canAfford}
                            className={`w-full py-2 px-4 rounded font-semibold transition-all mb-2 ${!canAfford
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/20'
                                }`}
                        >
                            {canAfford ? 'Select Port Location' : 'Insufficient Resources'}
                        </button>
                    ) : (
                        <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">Select Port:</h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {controlledPorts.map((port) => (
                                    <button
                                        key={port.coordinate}
                                        onClick={() => setSelectedPort(port)}
                                        className={`w-full p-2 rounded text-sm transition-all ${selectedPort?.x === port.x && selectedPort?.y === port.y
                                            ? 'border border-neon-cyan bg-neon-cyan bg-opacity-20 text-neon-cyan'
                                            : 'border border-gray-600 hover:border-gray-500 text-gray-300'
                                            }`}
                                    >
                                        ⚓ Port at ({port.x}, {port.y})
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => setShowPortSelector(false)}
                                    className="flex-1 py-2 px-4 rounded bg-gray-600 hover:bg-gray-500 text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBuildShip}
                                    disabled={!selectedPort || !isMyTurn || isBuilding}
                                    className={`flex-1 py-2 px-4 rounded font-semibold transition-all ${!selectedPort || !isMyTurn
                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        : isBuilding
                                            ? 'bg-blue-600 text-white cursor-wait'
                                            : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/20'
                                        }`}
                                >
                                    {isBuilding ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                            Building...
                                        </div>
                                    ) : (
                                        '🛠️ Build Ship'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {!isMyTurn && (
                        <p className="text-xs text-gray-500 text-center">
                            Wait for your turn to build ships
                        </p>
                    )}
                </>
            )}
        </div>
    );
}