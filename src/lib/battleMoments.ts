import { GameState, Player, Ship, TerritoryCell } from "@/types/game";

export type BattleMomentType =
  | "first_blood"
  | "ambush_reveal"
  | "high_damage_attack"
  | "territory_swing"
  | "comeback_win"
  | "bounty_claim"
  | "victory";

export interface BattleMomentSnapshot {
  turnNumber: number;
  currentPlayerIndex: number;
  winner?: string;
  players: Array<{
    publicKey: string;
    username?: string;
    totalScore: number;
    controlledTerritories: string[];
    resources: Player["resources"];
    ships: Array<{
      id: string;
      type: Ship["type"];
      health: number;
      maxHealth: number;
      attack: number;
      defense: number;
      speed: number;
      position: Ship["position"];
    }>;
  }>;
  cells: Array<{
    coordinate: string;
    type: TerritoryCell["type"];
    owner: string | null;
    isContested: boolean;
  }>;
}

export interface BattleMomentPublicEvent {
  type:
    | "ship_destroyed"
    | "territory_claimed"
    | "scan_reveal"
    | "ambush_reveal"
    | "victory";
  actor?: string;
  target?: string;
  coordinate?: string;
  amount?: number;
  description: string;
}

export interface BattleMomentReplay {
  id: string;
  type: BattleMomentType;
  title: string;
  summary: string;
  gameId: string;
  turnNumber: number;
  actingPlayer?: string;
  before: BattleMomentSnapshot;
  after: BattleMomentSnapshot;
  publicEvents: BattleMomentPublicEvent[];
  revealMetadata: {
    becameVisibleCoordinates: string[];
    staleCoordinates: string[];
    hiddenCoordinates: string[];
  };
  share: {
    title: string;
    summary: string;
  };
  createdAt: string;
}

export interface BattleMoment {
  title: string;
  summary: string;
  turnNumber: number;
  shipsDestroyed: number;
  territoriesControlled: number;
  gold: number;
  type: BattleMomentType;
}

function buildSnapshot(gameState: GameState): BattleMomentSnapshot {
  return {
    turnNumber: gameState.turnNumber,
    currentPlayerIndex: gameState.currentPlayerIndex,
    winner: gameState.winner,
    players: gameState.players.map((player) => ({
      publicKey: player.publicKey,
      username: player.username,
      totalScore: player.totalScore,
      controlledTerritories: [...player.controlledTerritories],
      resources: { ...player.resources },
      ships: player.ships.map((ship) => ({
        id: ship.id,
        type: ship.type,
        health: ship.health,
        maxHealth: ship.maxHealth,
        attack: ship.attack,
        defense: ship.defense,
        speed: ship.speed,
        position: { ...ship.position },
      })),
    })),
    cells: gameState.gameMap.cells.flat().map((cell) => ({
      coordinate: cell.coordinate,
      type: cell.type,
      owner: cell.owner,
      isContested: cell.isContested,
    })),
  };
}

function inferMomentType(
  shipsDestroyed: number,
  territoriesControlled: number,
): BattleMomentType {
  if (shipsDestroyed >= 3) return "ambush_reveal";
  if (shipsDestroyed > 0) return "high_damage_attack";
  if (territoriesControlled >= 4) return "territory_swing";
  return "victory";
}

export function buildBattleMoment(
  gameState: GameState,
  winnerPublicKey?: string,
): BattleMoment {
  const winner = gameState.players.find(
    (player) => player.publicKey === (winnerPublicKey || gameState.winner),
  );
  const shipsDestroyed = gameState.players.reduce(
    (total, player) => total + player.ships.filter((ship) => ship.health === 0).length,
    0,
  );
  const territoriesControlled = winner?.controlledTerritories.length || 0;
  const gold = winner?.resources.gold || 0;
  const type = inferMomentType(shipsDestroyed, territoriesControlled);

  if (shipsDestroyed > 0) {
    return {
      title: "Ambush replay",
      summary: `${shipsDestroyed} ship${shipsDestroyed === 1 ? "" : "s"} sunk after the reveal.`,
      turnNumber: gameState.turnNumber,
      shipsDestroyed,
      territoriesControlled,
      gold,
      type,
    };
  }

  if (territoriesControlled >= 3) {
    return {
      title: "Map control replay",
      summary: `${territoriesControlled} sectors held when the duel closed.`,
      turnNumber: gameState.turnNumber,
      shipsDestroyed,
      territoriesControlled,
      gold,
      type,
    };
  }

  return {
    title: "Decisive command replay",
    summary: `Victory sealed in ${gameState.turnNumber} turns.`,
    turnNumber: gameState.turnNumber,
    shipsDestroyed,
    territoriesControlled,
    gold,
    type,
  };
}

export function buildBattleMomentReplay(
  gameState: GameState,
  winnerPublicKey?: string,
): BattleMomentReplay {
  const winner = gameState.players.find(
    (player) => player.publicKey === (winnerPublicKey || gameState.winner),
  );
  const moment = buildBattleMoment(gameState, winnerPublicKey);
  const now = new Date().toISOString();
  const before = buildSnapshot(gameState);
  const after = buildSnapshot(gameState);

  return {
    id: `moment_${gameState.gameId}_${moment.turnNumber}_${moment.type}`,
    type: moment.type,
    title: moment.title,
    summary: moment.summary,
    gameId: gameState.gameId,
    turnNumber: moment.turnNumber,
    actingPlayer: winner?.publicKey,
    before,
    after,
    publicEvents: [
      {
        type: moment.shipsDestroyed > 0 ? "ambush_reveal" : "victory",
        actor: winner?.publicKey,
        amount: moment.shipsDestroyed,
        description: moment.summary,
      },
    ],
    revealMetadata: {
      becameVisibleCoordinates: [],
      staleCoordinates: [],
      hiddenCoordinates: [],
    },
    share: {
      title: moment.title,
      summary: moment.summary,
    },
    createdAt: now,
  };
}
