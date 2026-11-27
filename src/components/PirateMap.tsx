"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import type { CSSProperties } from "react";
import { GameMap, Ship, ShipType, TerritoryCellType } from "../types/game";
import { PirateGameManager } from "../lib/pirateGameEngine";
import { GameBalance } from "../lib/gameBalance";
import TerritoryTooltip from "./TerritoryTooltip";
import { useMobileOptimized } from "@/hooks/useMobileOptimized";
import { buildVisibilityProjection } from "@/lib/visibility";
import ChartStage, { type ChartCell, type ChartShip } from "./chart/ChartStage";
import { Icon } from "./ui/Icon";

interface PlayerInfo {
  publicKey: string;
  username?: string;
}

interface PirateMapProps {
  gameMap: GameMap;
  ships: Ship[];
  players?: PlayerInfo[];
  onCellSelect: (coordinate: string) => void;
  onShipClick?: (ship: Ship) => void;
  isMyTurn: boolean;
  selectedShipId?: string;
  currentPlayerPK?: string;
  scannedCoordinates?: string[];
  revealedCoordinates?: string[];
  spectatorMode?: "public" | "omniscient";
  /** 0..1 — how much of the turn remains. Drives the lantern. Defaults to full. */
  turnProgress?: number;
}

const shipLabels: Record<ShipType, string> = {
  sloop: "S",
  frigate: "F",
  galleon: "G",
  flagship: "X",
};

const territoryLabels: Record<TerritoryCellType, string> = {
  water: "",
  island: "IS",
  port: "PT",
  treasure: "$",
  storm: "ST",
  reef: "RF",
  whirlpool: "WP",
};

/** Cell type ids shared with chartShaders.ts. Keep these in the same order. */
const TERRAIN_INDEX: Record<TerritoryCellType, number> = {
  water: 0,
  island: 1,
  port: 2,
  treasure: 3,
  storm: 4,
  reef: 5,
  whirlpool: 6,
};

const CHART_MODE_STORAGE_KEY = "p8-chart-mode";

function ShipToken({
  type,
  color,
  isSelected,
  animationClass,
}: {
  type: ShipType;
  color: string;
  isSelected: boolean;
  animationClass?: { type: "move" | "attack" | "damaged"; timestamp: number };
}) {
  return (
    <span
      className={`ship-token ship-token-${type} ${
        animationClass ? `ship-anim-${animationClass.type}` : ""
      } ${isSelected ? "ship-token-selected" : ""}`}
      style={{ "--ship-color": color } as CSSProperties}
      aria-label={`${type} ship`}
    >
      <span className="ship-token-hull" />
      <span className="ship-token-mast" />
      <span className="ship-token-label">{shipLabels[type]}</span>
    </span>
  );
}

function TerritoryToken({
  type,
  isScanned,
}: {
  type: TerritoryCellType;
  isScanned: boolean;
}) {
  return (
    <div
      className={`territory-token territory-token-${type} ${
        isScanned ? "territory-token-scanned" : "territory-token-unscanned"
      }`}
      aria-label={`${type} territory`}
    >
      <span className="territory-token-mark">{territoryLabels[type]}</span>
    </div>
  );
}

export default function PirateMap({
  gameMap,
  ships,
  players = [],
  onCellSelect,
  onShipClick,
  isMyTurn,
  selectedShipId,
  currentPlayerPK,
  scannedCoordinates = [],
  revealedCoordinates = [],
  spectatorMode = "public",
  turnProgress = 1,
}: PirateMapProps) {
  const [hoveredCoordinate, setHoveredCoordinate] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [focusedCoordinate, setFocusedCoordinate] = useState<string>("A1");
  const mapRef = useRef<HTMLDivElement>(null);

  // ENHANCED mobile optimization
  const {
    isMobile,
    getGridSize,
    shouldReduceAnimations,
    classes,
    touchHandlers,
    triggerHaptic,
  } = useMobileOptimized({
    onTap: (element) => {
      const coordinate = element.dataset['coordinate'];
      if (coordinate) handleCellClick(coordinate);
    },
    onLongPress: (element) => {
      const coordinate = element.dataset['coordinate'];
      if (coordinate && isMobile) {
        setHoveredCoordinate(coordinate);
        triggerHaptic('medium');
      }
    },
  });

  // ---------------------------------------------------------------------------
  // Chart view (DESIGN.md §1). Diegetic by default on capable devices, flat on
  // demand with `T`. The flat view is the fairness mode, not a fallback.
  // ---------------------------------------------------------------------------
  const [chartMode, setChartMode] = useState(false);
  // Once opened, keep the GL context alive but stopped. Toggling back is then a
  // fade, not a shader-compile hitch; before the first opening mobile/flat users
  // never pay for WebGL at all.
  const [chartBooted, setChartBooted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(CHART_MODE_STORAGE_KEY);
    if (stored !== null) {
      setChartMode(stored === "1");
      return;
    }
    // Default on where we can afford it. Reduced-motion users get the flat view.
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setChartMode(!isMobile && !reduced);
  }, [isMobile]);

  useEffect(() => {
    if (chartMode) setChartBooted(true);
  }, [chartMode]);

  const toggleChartMode = useCallback(() => {
    setChartMode((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(CHART_MODE_STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* private mode — the preference just won't persist */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        toggleChartMode();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleChartMode]);

  // CONSOLIDATED animation state
  const [shipAnimations, setShipAnimations] = useState<Map<string, { type: "move" | "attack" | "damaged"; timestamp: number }>>(new Map());
  const [damageNumbers, setDamageNumbers] = useState<Array<{ id: string; shipId: string; amount: number; position: string; timestamp: number }>>([]);
  const prevShipsRef = useRef<Map<string, { position: string; health: number }>>(new Map());

  // ENHANCED animation detection
  useEffect(() => {
    if (shouldReduceAnimations()) return;

    const now = Date.now();
    const prevShips = prevShipsRef.current;

    ships.forEach((ship) => {
      const currentPos = PirateGameManager.coordinateToString(ship.position);
      const prev = prevShips.get(ship.id);

      if (prev && prev.position !== currentPos) {
        setShipAnimations(prev => new Map(prev.set(ship.id, { type: "move", timestamp: now })));
      }

      if (prev && prev.health > ship.health) {
        const damage = prev.health - ship.health;
        setDamageNumbers(prev => [...prev, { id: `${ship.id}-${now}`, shipId: ship.id, amount: damage, position: currentPos, timestamp: now }]);
        setShipAnimations(prev => new Map(prev.set(ship.id, { type: "damaged", timestamp: now })));
      }
    });

    prevShipsRef.current = new Map(ships.map(s => [s.id, { position: PirateGameManager.coordinateToString(s.position), health: s.health }]));
  }, [ships, shouldReduceAnimations]);

  // Damage numbers expire once, at their own deadline — no polling interval.
  useEffect(() => {
    if (damageNumbers.length === 0) return;
    const oldest = damageNumbers[0]?.timestamp ?? Date.now();
    const remaining = Math.max(0, 1500 - (Date.now() - oldest)) + 20;
    const timer = setTimeout(() => {
      const now = Date.now();
      setDamageNumbers((prev) => prev.filter((dmg) => now - dmg.timestamp < 1500));
    }, remaining);
    return () => clearTimeout(timer);
  }, [damageNumbers]);

  const visibility = useMemo(
    () =>
      buildVisibilityProjection({
        gameMap,
        ships,
        currentPlayerPK,
        scannedCoordinates,
        revealedCoordinates,
        spectatorMode,
      }),
    [gameMap, ships, currentPlayerPK, scannedCoordinates, revealedCoordinates, spectatorMode],
  );
  const visibleShips = visibility.visibleShips;

  const handleCellClick = (coordinate: string) => {
    if (!isMyTurn) return;
    const ship = getShipAtPosition(coordinate);
    if (ship && isMyShip(ship) && onShipClick) {
      onShipClick(ship);
      return;
    }
    onCellSelect(coordinate);
  };

  const handleCellHover = (coordinate: string, event: React.MouseEvent) => {
    if (isMobile) return;
    setHoveredCoordinate(coordinate);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const getShipAtPosition = (coordinate: string): Ship | undefined => {
    return visibleShips.find(ship => PirateGameManager.coordinateToString(ship.position) === coordinate);
  };

  const isMyShip = (ship: Ship): boolean => {
    return ship.id.startsWith(currentPlayerPK || '');
  };

  const getPlayerColor = (shipId: string): string => {
    const playerIndex = players.findIndex(p => shipId.startsWith(p.publicKey));
    const colors = ['#00D9FF', '#FFD700', '#FF00FF', '#BC13FE'];
    return colors[playerIndex % colors.length] || "#ffffff";
  };

  const selectedShip = selectedShipId
    ? visibleShips.find((ship) => ship.id === selectedShipId)
    : undefined;

  const isEnemyShip = (ship: Ship): boolean => {
    if (!currentPlayerPK) return false;
    return !ship.id.startsWith(currentPlayerPK);
  };

  const getDistanceFromSelected = (coordinate: string): number | null => {
    if (!selectedShip) return null;
    return PirateGameManager.calculateDistance(
      selectedShip.position,
      PirateGameManager.stringToCoordinate(coordinate),
    );
  };

  const isCoordinateThreatened = (coordinate: string): boolean => {
    if (!currentPlayerPK) return false;
    return visibleShips.some((ship) => {
      if (!isEnemyShip(ship) || ship.health <= 0) return false;
      const enemyRange = GameBalance.SHIP_BALANCE[ship.type].range;
      const enemyDistance = PirateGameManager.calculateDistance(
        ship.position,
        PirateGameManager.stringToCoordinate(coordinate),
      );
      return enemyDistance <= enemyRange;
    });
  };

  const getTacticalState = (coordinate: string) => {
    const targetShip = getShipAtPosition(coordinate);
    const isThreatened = isCoordinateThreatened(coordinate);

    if (!selectedShip) {
      return {
        isMoveOption: false,
        isAttackOption: false,
        isThreatened,
        targetShip,
      };
    }

    const distance = getDistanceFromSelected(coordinate) ?? Infinity;
    const selectedRange = GameBalance.SHIP_BALANCE[selectedShip.type].range;
    const isSelectedPosition =
      PirateGameManager.coordinateToString(selectedShip.position) === coordinate;

    const isMoveOption =
      !isSelectedPosition &&
      !targetShip &&
      distance <= selectedShip.speed;

    const isAttackOption =
      !!targetShip &&
      isEnemyShip(targetShip) &&
      distance <= selectedRange;

    return { isMoveOption, isAttackOption, isThreatened, targetShip };
  };

  const getDamagePreview = (targetShip?: Ship): number | null => {
    if (!selectedShip || !targetShip) return null;
    const distance = PirateGameManager.calculateDistance(
      selectedShip.position,
      targetShip.position,
    );
    const attackerStrength = GameBalance.SHIP_BALANCE[selectedShip.type].strength;
    const defenderStrength = GameBalance.SHIP_BALANCE[targetShip.type].strength;
    const healthMultiplier = selectedShip.health / 100;
    const distancePenalty = Math.max(0, (distance - 1) * 0.2);
    const distanceMultiplier = Math.max(0.1, 1.0 - distancePenalty);
    const baseDamage = attackerStrength * 40 * healthMultiplier * distanceMultiplier;
    const defenseReduction = targetShip.defense * (defenderStrength / 10);
    return Math.max(5, Math.floor(baseDamage - defenseReduction));
  };

  const getCellContent = (coordinate: string) => {
    const ship = getShipAtPosition(coordinate);
    const cell = visibility.getVisibleCell(coordinate);
    const intelState = visibility.getCoordinateIntel(coordinate);
    const isScanned = intelState === "current";

    if (ship) {
      const isSelected = selectedShipId === ship.id;
      const playerColor = getPlayerColor(ship.id);
      const animationClass = shipAnimations.get(ship.id);

      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <ShipToken
            type={ship.type}
            color={playerColor}
            isSelected={isSelected}
            animationClass={animationClass && !shouldReduceAnimations() ? animationClass : undefined}
          />

          <div className="health-bar">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${(ship.health / ship.maxHealth) * 100}%`,
                backgroundColor: ship.health > ship.maxHealth * 0.5 ? "#22c55e" : ship.health > ship.maxHealth * 0.25 ? "#eab308" : "#ef4444"
              }}
            />
          </div>

          {damageNumbers.filter(dmg => dmg.shipId === ship.id).map(dmg => (
            <div key={dmg.id} className="damage-number">-{dmg.amount}</div>
          ))}
        </div>
      );
    }

    if (cell) {
      return <TerritoryToken type={cell.type} isScanned={isScanned} />;
    }

    return null;
  };

  const gridSize = getGridSize();
  const totalCells = gridSize * gridSize;

  // Indexed once per map change instead of `flatCells.find` inside the cell loop.
  const cellIndex = useMemo(() => {
    const map = new Map<string, (typeof gameMap.cells)[number][number]>();
    for (const row of gameMap.cells) for (const cell of row) map.set(cell.coordinate, cell);
    return map;
  }, [gameMap]);

  const getCellAt = (coordinate: string) => cellIndex.get(coordinate);

  // ---------------------------------------------------------------------------
  // Chart data — the same projection the DOM reads, so the picture cannot lie.
  // ---------------------------------------------------------------------------
  const chartCells = useMemo<ChartCell[]>(() => {
    const out: ChartCell[] = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const coordinate = PirateGameManager.coordinateToString({ x, y });
        const cell = cellIndex.get(coordinate);
        const intelState = visibility.getCoordinateIntel(coordinate);
        const owner = cell?.owner;
        out.push({
          // Hidden sectors upload as open, unowned water. The fog shader is a
          // privacy boundary, not a translucent tint over secret terrain.
          type: intelState !== "hidden" && cell?.type ? TERRAIN_INDEX[cell.type] : 0,
          owner: intelState === "hidden" || !owner
            ? "none"
            : currentPlayerPK && owner === currentPlayerPK
              ? "me"
              : currentPlayerPK
                ? "enemy"
                : "other",
          intel: intelState === "current" ? 2 : intelState === "stale" ? 1 : 0,
        });
      }
    }
    return out;
  }, [gridSize, cellIndex, visibility, currentPlayerPK]);

  const chartShips = useMemo<ChartShip[]>(
    () =>
      visibleShips
        .filter((ship) => ship.health > 0)
        .map((ship) => ({
          id: ship.id,
          x: ship.position.x,
          y: ship.position.y,
          kind: ship.type,
          owner: isMyShip(ship) ? ("me" as const) : ("enemy" as const),
          healthPct: Math.max(0, Math.min(1, ship.health / (ship.maxHealth || 1))),
          selected: ship.id === selectedShipId,
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleShips, selectedShipId, currentPlayerPK],
  );

  // Roving tabindex: one tab stop for the whole board, arrows move within it.
  // 100 tab stops made the map a keyboard trap.
  const focusCell = useCallback((coordinate: string) => {
    setFocusedCoordinate(coordinate);
    const el = mapRef.current?.querySelector<HTMLElement>(
      `[data-coordinate="${coordinate}"]`,
    );
    el?.focus();
  }, []);

  const handleCellKeyDown = useCallback(
    (e: React.KeyboardEvent, coordinate: string) => {
      const { x, y } = PirateGameManager.stringToCoordinate(coordinate);
      const moves: Record<string, [number, number]> = {
        ArrowUp: [x, y - 1],
        ArrowDown: [x, y + 1],
        ArrowLeft: [x - 1, y],
        ArrowRight: [x + 1, y],
      };
      const next = moves[e.key];
      if (next) {
        e.preventDefault();
        const [nx, ny] = next;
        if (nx >= 0 && ny >= 0 && nx < gridSize && ny < gridSize) {
          focusCell(PirateGameManager.coordinateToString({ x: nx, y: ny }));
        }
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleCellClick(coordinate);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gridSize, focusCell, isMyTurn, selectedShipId, visibleShips],
  );

  const initialFocus = useMemo(() => {
    const mine = visibleShips.find((s) => isMyShip(s));
    return mine ? PirateGameManager.coordinateToString(mine.position) : "A1";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleShips, currentPlayerPK]);

  useEffect(() => {
    setFocusedCoordinate((prev) => (prev === "A1" ? initialFocus : prev));
  }, [initialFocus]);

  return (
    <div className={`relative ${classes.container}`} ref={mapRef}>
      {/* The board box. The canvas and the DOM grid share this exact rectangle,
          which is what keeps the 3D picture aligned with the hit targets. */}
      <div
        className={`relative ${chartMode ? "chart-mode" : ""}`}
        style={{
          maxWidth: isMobile ? "min(98vw, 85vh)" : "auto",
          aspectRatio: "1",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {chartBooted && (
          <ChartStage
            gridSize={gridSize}
            cells={chartCells}
            ships={chartShips}
            selected={selectedShip ? { x: selectedShip.position.x, y: selectedShip.position.y } : null}
            turnProgress={turnProgress}
            active={chartMode}
            glideKey="match-intro"
            className="rounded-[3px]"
          />
        )}

        <div
          className={`grid relative ${classes.grid} ${isMobile ? "mobile-map-grid" : "game-grid"} ${
            chartMode ? "w-full h-full" : ""
          }`}
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            aspectRatio: chartMode ? undefined : "1",
          }}
        >
          {Array.from({ length: totalCells }, (_, index) => {
            const x = index % gridSize;
            const y = Math.floor(index / gridSize);
            const coordinate = PirateGameManager.coordinateToString({ x, y });
            const tacticalState = getTacticalState(coordinate);
            const damagePreview = getDamagePreview(tacticalState.targetShip);
            const intelState = visibility.getCoordinateIntel(coordinate);
            const isScanned = intelState === "current";
            const isStale = intelState === "stale";
            const isFogged = intelState === "hidden";
            const cellData = getCellAt(coordinate);

            const cellAriaLabel = (() => {
              const parts: string[] = [`Cell ${coordinate}`];
              const shipHere = getShipAtPosition(coordinate);
              if (shipHere) {
                const owner = isMyShip(shipHere) ? "your" : "enemy";
                parts.push(`${owner} ${shipHere.type}, ${shipHere.health} of ${shipHere.maxHealth} HP`);
              }
              if (cellData?.type && cellData.type !== "water") parts.push(cellData.type);
              if (cellData?.owner) parts.push(cellData.owner === currentPlayerPK ? "controlled by you" : "enemy controlled");
              if (isFogged) parts.push("hidden");
              else if (isStale) parts.push("stale intel");
              else if (isScanned) parts.push("scanned");
              if (tacticalState.isMoveOption) parts.push("move available");
              if (tacticalState.isAttackOption) parts.push(`attack available${damagePreview ? `, estimated damage ${damagePreview}` : ""}`);
              if (tacticalState.isThreatened && !tacticalState.isMoveOption && !tacticalState.isAttackOption) parts.push("threatened");
              return parts.join(", ");
            })();

            return (
              <div
                key={coordinate}
                data-coordinate={coordinate}
                aria-label={cellAriaLabel}
                role="button"
                tabIndex={isMyTurn ? (coordinate === focusedCoordinate ? 0 : -1) : -1}
                onFocus={() => setFocusedCoordinate(coordinate)}
                onKeyDown={(e) => handleCellKeyDown(e, coordinate)}
                className={`
                  territory-cell cursor-pointer
                  ${isMyTurn ? "hover:bg-neon-cyan hover:bg-opacity-20" : ""}
                  ${selectedShipId && getShipAtPosition(coordinate)?.id === selectedShipId ? "ring-2 ring-neon-gold" : ""}
                  ${tacticalState.isMoveOption ? "ring-1 ring-cyan-300/70 bg-cyan-300/10" : ""}
                  ${tacticalState.isAttackOption ? "ring-2 ring-red-400/90 bg-red-500/15" : ""}
                  ${!tacticalState.isMoveOption && !tacticalState.isAttackOption && tacticalState.isThreatened ? "threat-zone-cell" : ""}
                  ${isFogged ? "fogged-sector" : isStale ? "stale-sector" : isScanned ? "scanned-sector" : ""}
                  ${classes.button}
                `}
                {...(isMobile ? touchHandlers : {
                  onClick: () => handleCellClick(coordinate),
                  onMouseEnter: (e) => handleCellHover(coordinate, e),
                  onMouseLeave: () => setHoveredCoordinate(null)
                })}
              >
                <div className="cell-content">
                  {getCellContent(coordinate)}
                </div>

                {/* Ownership label — the non-colour signal for territory control. */}
                {chartMode && cellData?.owner && !isFogged && (
                  <span className="territory-control-flag">
                    {cellData.isContested
                      ? "HOT"
                      : cellData.owner === currentPlayerPK
                        ? "YOU"
                        : cellData.owner.startsWith("AI_")
                          ? "AI"
                          : "CAP"}
                  </span>
                )}

                {selectedShip && tacticalState.isMoveOption && (
                  <div className="move-range-marker" />
                )}

                {selectedShip && tacticalState.isAttackOption && (
                  <>
                    <div className="attack-range-arc" />
                    <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
                      <div className="rounded-b bg-red-500 px-1.5 py-0.5 text-[10px] font-black leading-none text-white shadow-lg">
                        {damagePreview ? `~${damagePreview}` : "HIT"}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Conquest overlay — only in flat view. The shader owns the ownership
            wash in chart view, and the per-cell flag above carries the label. */}
        {!chartMode && (
          <div
            className="grid absolute inset-0 pointer-events-none"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: totalCells }, (_, index) => {
              const x = index % gridSize;
              const y = Math.floor(index / gridSize);
              const coordinate = PirateGameManager.coordinateToString({ x, y });
              const cell = getCellAt(coordinate);
              const intelState = visibility.getCoordinateIntel(coordinate);

              if (!cell?.owner || intelState === "hidden") return <div key={`overlay-${coordinate}`} />;

              const isPlayerControlled = cell.owner === currentPlayerPK;
              const isAIControlled = cell.owner.startsWith('AI_');

              return (
                <div
                  key={`conquest-${coordinate}`}
                  className={`relative transition-all duration-500 rounded ${cell.isContested ? 'animate-pulse' : ''}`}
                  style={{
                    backgroundColor: isPlayerControlled
                      ? 'rgba(34, 211, 238, 0.15)'
                      : isAIControlled
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(251, 191, 36, 0.15)',
                    border: `2px solid ${
                      isPlayerControlled ? '#22d3ee' :
                      isAIControlled ? '#ef4444' : '#fbbf24'
                    }`,
                  }}
                >
                  <div className="territory-control-flag">
                    {cell.isContested ? "HOT" : isPlayerControlled ? "YOU" : isAIControlled ? "AI" : "CAP"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View toggle + the one contextual hint. */}
      <div className="mt-2 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={toggleChartMode}
          aria-pressed={chartMode}
          className="p8-instrument inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-cyan-100/80 hover:text-white transition-colors"
        >
          <Icon name="palette" size={13} />
          {chartMode ? "Chart table" : "Flat chart"}
          <kbd className="ml-1 rounded bg-slate-800 px-1 text-[10px] text-cyan-200/70">T</kbd>
        </button>
      </div>

      {hoveredCoordinate && (
        <TerritoryTooltip
          type={getCellAt(hoveredCoordinate)?.type as any}
          position={tooltipPosition}
          isVisible={true}
        />
      )}

      {/* Selection info - Mobile Optimized */}
      {selectedShipId && (
        <div className="mt-2 sm:mt-4 p-2 sm:p-3 bg-slate-950/80 border border-cyan-300/50 rounded-lg text-center w-full max-w-xs mx-auto">
          <div className="text-xs sm:text-sm text-cyan-100 font-mono truncate">
            {selectedShip?.type ?? "Ship"} selected
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] uppercase tracking-wide">
            <span className="rounded border border-cyan-300/30 bg-cyan-300/10 px-1.5 py-1 text-cyan-100">
              Move {selectedShip?.speed ?? "-"}
            </span>
            <span className="rounded border border-red-300/30 bg-red-500/10 px-1.5 py-1 text-red-100">
              Range {selectedShip ? GameBalance.SHIP_BALANCE[selectedShip.type].range : "-"}
            </span>
            <span className="rounded border border-amber-300/30 bg-amber-300/10 px-1.5 py-1 text-amber-100">
              Threat map
            </span>
          </div>
        </div>
      )}

      {/* Hover info - Mobile Optimized */}
      {hoveredCoordinate && (
        <div className="mt-1 sm:mt-2 p-1.5 sm:p-2 bg-black bg-opacity-50 border border-gray-500 rounded text-center w-full max-w-xs mx-auto">
          <div className="text-xs text-gray-300 truncate">
            Pos: {hoveredCoordinate}
          </div>
          {getCellAt(hoveredCoordinate) && (
            <div className="text-xs text-neon-cyan truncate">
              {getCellAt(hoveredCoordinate)?.type}
              {getCellAt(hoveredCoordinate)?.owner && (
                <span className="text-neon-orange"> (Ctrl)</span>
              )}
            </div>
          )}
          {getShipAtPosition(hoveredCoordinate) && (
            <div className="text-xs text-neon-magenta truncate">
              {getShipAtPosition(hoveredCoordinate)!.type} -
              {getShipAtPosition(hoveredCoordinate)!.health}HP
            </div>
          )}
        </div>
      )}
    </div>
  );
}
