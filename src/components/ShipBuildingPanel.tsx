'use client';

/**
 * ShipBuildingPanel — the shipwright's page of the captain's ledger.
 *
 * Token-native rewrite. The flow is unchanged (type -> cost check -> port ->
 * build); the surface is brass and ink. Affordability is written in numbers
 * (have / need) and tone — never hue alone. The final build is the page's
 * one lever, since commissioning a ship is why this page exists.
 */

import { useState } from 'react';
import { GameState, Player, ShipType, Resources } from '../types/game';
import { SHIP_CONFIGS } from '../types/game';
import { Icon, type IconName } from './ui/Icon';

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
    sloop: 'Fast scout ship — high speed, low health',
    frigate: 'Balanced warship — good all-around stats',
    galleon: 'Heavy battleship — high health, slow speed',
    flagship: 'Ultimate vessel — maximum firepower'
};

const SHIP_ICON: Record<ShipType, IconName> = {
    sloop: 'ship-scout',
    frigate: 'ship',
    galleon: 'ship-heavy',
    flagship: 'ship-heavy',
};

const RESOURCE_ICON: Record<string, IconName> = {
    gold: 'gold',
    crew: 'crew',
    cannons: 'cannons',
    supplies: 'supplies',
    wood: 'wood',
    rum: 'rum',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--p8-space-3)' }}>
            <div className="p8-cell-row" style={{ justifyContent: 'space-between' }}>
                <span className="p8-cell-row">
                    <Icon name="build" size={13} className="p8-text-dim" />
                    <span className="p8-label">Shipwright</span>
                </span>
                <span className="p8-value p8-text-dim" style={{ fontSize: 'var(--p8-fs-xs)' }}>
                    {controlledPorts.length} port{controlledPorts.length === 1 ? '' : 's'}
                </span>
            </div>

            {controlledPorts.length === 0 ? (
                <div className="p8-instrument" style={{ padding: 'var(--p8-space-3)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--p8-space-1)' }}>
                        <Icon name="anchor" size={20} className="p8-text-mute" />
                    </div>
                    <p className="p8-text-dim" style={{ fontSize: 'var(--p8-fs-sm)', fontFamily: 'var(--p8-font-ui)' }}>
                        No ports controlled
                    </p>
                    <p className="p8-text-mute" style={{ fontSize: 'var(--p8-fs-xs)', fontFamily: 'var(--p8-font-ui)', marginTop: 'calc(2 * var(--p8-u))' }}>
                        Claim ports to build ships
                    </p>
                </div>
            ) : (
                <>
                    {/* Ship type — the vessel to commission */}
                    <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)' }}>
                        <span className="p8-label">Vessel</span>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: 'var(--p8-space-1)',
                                marginTop: 'var(--p8-space-1)',
                            }}
                        >
                            {(Object.keys(SHIP_COSTS) as ShipType[]).map((shipType) => {
                                const sel = selectedShipType === shipType;
                                const affordable = canAffordShip(shipType);
                                return (
                                    <button
                                        key={shipType}
                                        onClick={() => setSelectedShipType(shipType)}
                                        aria-pressed={sel}
                                        style={{
                                            padding: 'var(--p8-space-1)',
                                            borderRadius: 'var(--p8-radius)',
                                            border: `${sel ? 'calc(1.5 * var(--p8-u))' : 'var(--p8-hairline)'} solid ${
                                                sel ? 'var(--p8-lamp)' : 'var(--p8-brass-line)'
                                            }`,
                                            background: sel
                                                ? 'color-mix(in srgb, var(--p8-lamp) 10%, var(--p8-depth))'
                                                : 'color-mix(in srgb, var(--p8-brass) 8%, var(--p8-depth))',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            opacity: affordable ? 1 : 0.55,
                                            transition: 'border-color 120ms ease, background 120ms ease',
                                        }}
                                    >
                                        <div className="p8-cell-row">
                                            <Icon
                                                name={SHIP_ICON[shipType]}
                                                size={14}
                                                className={sel ? 'p8-text-lamp' : 'p8-text-dim'}
                                            />
                                            <span className="p8-label" style={sel ? { color: 'var(--p8-lamp)' } : undefined}>
                                                {shipType}
                                            </span>
                                        </div>
                                        <p
                                            className="p8-text-mute"
                                            style={{
                                                fontSize: 'var(--p8-fs-xs)',
                                                fontFamily: 'var(--p8-font-ui)',
                                                marginTop: 'calc(3 * var(--p8-u))',
                                                lineHeight: 1.35,
                                            }}
                                        >
                                            {SHIP_DESCRIPTIONS[shipType]}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Measurements + cost — mono tabular throughout */}
                    <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)' }}>
                        <span className="p8-label">Measurements</span>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: 'calc(3 * var(--p8-u))',
                                marginTop: 'var(--p8-space-1)',
                            }}
                        >
                            {(['maxHealth', 'attack', 'defense', 'speed'] as const).map((stat) => (
                                <div key={stat} className="p8-cell-row" style={{ justifyContent: 'space-between' }}>
                                    <span className="p8-label">{stat === 'maxHealth' ? 'health' : stat}</span>
                                    <span className="p8-value" style={{ fontSize: 'var(--p8-fs-sm)' }}>
                                        {SHIP_CONFIGS[selectedShipType][stat]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)' }}>
                        <span className="p8-label">Cost — have / need</span>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'calc(3 * var(--p8-u))',
                                marginTop: 'var(--p8-space-1)',
                            }}
                        >
                            {Object.entries(selectedCost).map(([resource, cost]) => {
                                const playerAmount = currentPlayer.resources[resource as keyof Resources] || 0;
                                const canAffordThis = playerAmount >= (cost || 0);

                                return (
                                    <div key={resource} className="p8-cell-row" style={{ justifyContent: 'space-between' }}>
                                        <span className="p8-cell-row">
                                            <Icon
                                                name={RESOURCE_ICON[resource] ?? 'supplies'}
                                                size={12}
                                                className={canAffordThis ? 'p8-text-dim' : 'p8-text-threat'}
                                            />
                                            <span className="p8-label">{resource}</span>
                                        </span>
                                        <span
                                            className={`p8-value ${canAffordThis ? '' : 'p8-text-threat'}`}
                                            style={{ fontSize: 'var(--p8-fs-sm)' }}
                                            aria-label={`${playerAmount} of ${cost} ${resource} available${canAffordThis ? '' : ' — insufficient'}`}
                                        >
                                            {playerAmount}/{cost}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Port selection + commission */}
                    {!showPortSelector ? (
                        <button
                            onClick={() => setShowPortSelector(true)}
                            disabled={!canAfford}
                            className="p8-btn"
                            style={{ width: '100%' }}
                        >
                            <Icon name="port" size={14} />
                            {canAfford ? 'Select port' : 'Insufficient resources'}
                        </button>
                    ) : (
                        <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)' }}>
                            <span className="p8-label">Port</span>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'calc(3 * var(--p8-u))',
                                    marginTop: 'var(--p8-space-1)',
                                    maxHeight: 'calc(120 * var(--p8-u))',
                                    overflowY: 'auto',
                                }}
                            >
                                {controlledPorts.map((port) => {
                                    const sel = selectedPort?.x === port.x && selectedPort?.y === port.y;
                                    return (
                                        <button
                                            key={port.coordinate}
                                            onClick={() => setSelectedPort(port)}
                                            aria-pressed={sel}
                                            className="p8-btn"
                                            style={{
                                                justifyContent: 'flex-start',
                                                borderColor: sel ? 'var(--p8-lamp)' : undefined,
                                                color: sel ? 'var(--p8-lamp)' : undefined,
                                            }}
                                        >
                                            <Icon name="anchor" size={13} />
                                            <span className="p8-value" style={{ fontSize: 'var(--p8-fs-sm)' }}>
                                                ({port.x}, {port.y})
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--p8-space-1)', marginTop: 'var(--p8-space-2)' }}>
                                <button
                                    onClick={() => setShowPortSelector(false)}
                                    className="p8-btn"
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBuildShip}
                                    disabled={!selectedPort || !isMyTurn || isBuilding}
                                    className="p8-lever"
                                    style={{ flex: 2, minWidth: 0, opacity: !selectedPort || !isMyTurn || isBuilding ? 0.5 : 1 }}
                                >
                                    <Icon name="build" size={15} />
                                    {isBuilding ? 'Building…' : 'Commission ship'}
                                </button>
                            </div>
                        </div>
                    )}

                    {!isMyTurn && (
                        <p
                            className="p8-text-mute"
                            style={{ fontSize: 'var(--p8-fs-xs)', fontFamily: 'var(--p8-font-ui)', textAlign: 'center' }}
                        >
                            The shipwright waits for your watch
                        </p>
                    )}
                </>
            )}
        </div>
    );
}
