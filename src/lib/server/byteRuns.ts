import { PirateGameManager } from "@/lib/pirateGameEngine";
import type { GameState, Player } from "@/types/game";

export type ByteDifficulty = "novice" | "pirate" | "captain" | "admiral";

export interface ByteRun {
  runId: string;
  agentName: string;
  humanKey: string;
  difficulty: ByteDifficulty;
  gameState: GameState;
  moves: number;
  createdAt: number;
  updatedAt: number;
  lastMessage: string;
  seenKeys: Set<string>;
}

const globalStore = globalThis as unknown as {
  __pir8ByteRuns?: Map<string, ByteRun>;
};

function runs(): Map<string, ByteRun> {
  if (!globalStore.__pir8ByteRuns) globalStore.__pir8ByteRuns = new Map();
  return globalStore.__pir8ByteRuns;
}

function newRunId(): string {
  return `byte_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createByteRun(agentName: string, difficulty: ByteDifficulty): ByteRun {
  const runId = newRunId();
  const humanKey = `byte_${runId}`;
  const human: Player = {
    publicKey: humanKey,
    username: agentName.slice(0, 32) || "ByteAgent",
    resources: { gold: 1000, crew: 50, cannons: 10, supplies: 100, wood: 0, rum: 0 },
    ships: [],
    controlledTerritories: [],
    totalScore: 0,
    isActive: true,
    scanCharges: 3,
    scannedCoordinates: [],
    speedBonusAccumulated: 0,
    averageDecisionTimeMs: 0,
    totalMoves: 0,
    consecutiveAttacks: 0,
    lastActionWasAttack: false,
  };
  const gameState = PirateGameManager.createPracticeGame(human, difficulty);
  const run: ByteRun = {
    runId,
    agentName: human.username || "ByteAgent",
    humanKey,
    difficulty,
    gameState,
    moves: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastMessage: `Skirmish started vs ${difficulty} AI. Sink or claim to win.`,
    seenKeys: new Set(),
  };
  runs().set(runId, run);
  return run;
}

export function getByteRun(runId: string): ByteRun | null {
  return runs().get(runId) || null;
}

/** Advance AI turns until the human is to move or the game ends. Pure loop, no timers. */
export function settleAiTurns(run: ByteRun, maxSteps = 20): void {
  let guard = 0;
  while (guard++ < maxSteps) {
    const gs = run.gameState;
    if (!gs || gs.gameStatus === "completed") return;
    const current = gs.players[gs.currentPlayerIndex];
    if (!current || !current.publicKey.startsWith("AI_")) return;
    run.gameState = PirateGameManager.processAITurn(gs);
    run.updatedAt = Date.now();
  }
}

function currentHuman(run: ByteRun) {
  return run.gameState.players.find((p) => p.publicKey === run.humanKey) || null;
}

export interface ByteActionParams {
  shipId?: string;
  toX?: number;
  toY?: number;
  targetShipId?: string;
  shipType?: string;
  portX?: number;
  portY?: number;
  idempotencyKey?: string;
}

export function applyByteAction(
  run: ByteRun,
  action: string,
  params: ByteActionParams,
): { ok: boolean; message: string } {
  if (run.gameState.gameStatus === "completed") {
    return { ok: false, message: "Run is already completed. No further actions accepted." };
  }
  if (params.idempotencyKey) {
    if (run.seenKeys.has(params.idempotencyKey)) {
      return { ok: true, message: "Duplicate action ignored (idempotent replay)." };
    }
    run.seenKeys.add(params.idempotencyKey);
  }

  const gs = run.gameState;
  const current = gs.players[gs.currentPlayerIndex];
  if (!current || current.publicKey !== run.humanKey) {
    // If it is the AI's turn (agent polled mid-settle), settle first.
    settleAiTurns(run);
    const after = run.gameState.players[run.gameState.currentPlayerIndex];
    if (!after || after.publicKey !== run.humanKey) {
      return { ok: false, message: "Not your turn yet. Read state again." };
    }
  }

  const ts = Date.now();
  const base = {
    id: `byte_${ts}_${Math.random().toString(36).slice(2, 6)}`,
    gameId: gs.gameId,
    player: run.humanKey,
    timestamp: ts,
  } as const;

  let result: { updatedGameState: GameState; success: boolean; message: string } | null = null;

  switch (action) {
    case "move": {
      if (!params.shipId || params.toX === undefined || params.toY === undefined) {
        return { ok: false, message: "move requires shipId, toX, toY." };
      }
      result = PirateGameManager.processTurnAction(gs, {
        ...base,
        type: "move_ship",
        data: { shipId: params.shipId, toCoordinate: `${params.toX},${params.toY}` },
      });
      break;
    }
    case "attack": {
      if (!params.shipId || !params.targetShipId) {
        return { ok: false, message: "attack requires shipId and targetShipId." };
      }
      result = PirateGameManager.processTurnAction(gs, {
        ...base,
        type: "attack",
        data: { shipId: params.shipId, targetShipId: params.targetShipId },
      });
      break;
    }
    case "claim": {
      if (!params.shipId) return { ok: false, message: "claim requires shipId." };
      result = PirateGameManager.processTurnAction(gs, {
        ...base,
        type: "claim_territory",
        data: { shipId: params.shipId },
      });
      break;
    }
    case "collect": {
      result = PirateGameManager.processTurnAction(gs, {
        ...base,
        type: "collect_resources",
        data: {},
      });
      break;
    }
    case "build": {
      if (!params.shipType || params.portX === undefined || params.portY === undefined) {
        return { ok: false, message: "build requires shipType, portX, portY." };
      }
      result = PirateGameManager.processTurnAction(gs, {
        ...base,
        type: "build_ship",
        data: {
          shipType: params.shipType as "sloop" | "frigate" | "galleon" | "flagship",
          toCoordinate: `${params.portX},${params.portY}`,
        },
      });
      break;
    }
    case "end_turn": {
      run.gameState = PirateGameManager.advanceTurn(gs);
      run.moves += 1;
      run.updatedAt = Date.now();
      run.lastMessage = "Turn passed.";
      settleAiTurns(run);
      run.moves += 0;
      return { ok: true, message: run.lastMessage };
    }
    case "quit": {
      run.gameState = { ...gs, gameStatus: "completed", winner: gs.winner || "ai_win_by_quit" };
      // Attribute quit as a loss for the agent unless already won.
      const human = currentHuman(run);
      if (human && run.gameState.winner !== run.humanKey) {
        run.gameState.winner =
          run.gameState.players.find((p) => p.publicKey !== run.humanKey)?.publicKey;
      }
      run.updatedAt = Date.now();
      run.lastMessage = "Agent quit the skirmish.";
      return { ok: true, message: run.lastMessage };
    }
    default:
      return { ok: false, message: `Unknown action \"${action}\". Valid: move, attack, claim, collect, build, end_turn, quit.` };
  }

  if (!result) return { ok: false, message: "Action failed to execute." };
  if (!result.success) {
    return { ok: false, message: result.message || "Illegal move." };
  }
  // Human action landed: advance past human, then let AI answer.
  run.gameState = PirateGameManager.advanceTurn(result.updatedGameState);
  settleAiTurns(run);
  run.moves += 1;
  run.updatedAt = Date.now();
  run.lastMessage = result.message;
  return { ok: true, message: result.message };
}

export interface ByteStateJson {
  runId: string;
  agentName: string;
  status: string;
  turnNumber: number;
  moves: number;
  finished: boolean;
  winner: string | null;
  agentWon: boolean;
  score: number;
  gold: number;
  crew: number;
  supplies: number;
  cannons: number;
  territoriesControlled: number;
  yourShips: Array<{
    id: string; type: string; health: number; maxHealth: number;
    attack: number; speed: number; x: number; y: number;
  }>;
  enemyShips: Array<{ id: string; type: string; health: number; x: number; y: number }>;
  board: Array<{ coord: string; type: string; owner: string | null }>;
  weather: string;
  yourTurn: boolean;
  canAct: { move: boolean; attack: boolean; claim: boolean; collect: boolean; build: boolean };
  attackTargets: Array<{ from: string; to: string }>;
  lastMessage: string;
  error?: string;
  pausedWhenIdle: boolean;
  watchHint: string;
}

export function toByteState(run: ByteRun, error?: string): ByteStateJson {
  const gs = run.gameState;
  const human = currentHuman(run);
  const ai = gs.players.find((p) => p.publicKey !== run.humanKey) || null;
  const finished = gs.gameStatus === "completed";
  const winner = (gs.winner as string | null) || null;

  // Compact board: only non-water or owned cells + ship positions stay readable.
  const board: ByteStateJson["board"] = [];
  const size = gs.gameMap?.size || 10;
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const cell = gs.gameMap?.cells?.[x]?.[y];
      if (!cell) continue;
      if (cell.type !== "water" || cell.owner) {
        board.push({ coord: `${x},${y}`, type: cell.type, owner: cell.owner });
      }
    }
  }

  const yourShips = (human?.ships || []).map((s) => ({
    id: s.id, type: s.type, health: s.health, maxHealth: s.maxHealth,
    attack: s.attack, speed: s.speed, x: s.position.x, y: s.position.y,
  }));
  const enemyShips = (ai?.ships || [])
    .filter((s) => s.health > 0)
    .map((s) => ({ id: s.id, type: s.type, health: s.health, x: s.position.x, y: s.position.y }));

  // Attack adjacency hint (Chebyshev range 2): cheap, legible, no pathing promise.
  const attackTargets: ByteStateJson["attackTargets"] = [];
  for (const mine of yourShips) {
    for (const foe of enemyShips) {
      const d = Math.max(Math.abs(mine.x - foe.x), Math.abs(mine.y - foe.y));
      if (d <= 2 && d > 0) attackTargets.push({ from: mine.id, to: foe.id });
    }
  }

  const yourTurn =
    !finished && gs.players[gs.currentPlayerIndex]?.publicKey === run.humanKey;

  return {
    runId: run.runId,
    agentName: run.agentName,
    status: finished ? "completed" : "active",
    turnNumber: gs.turnNumber,
    moves: run.moves,
    finished,
    winner,
    agentWon: winner === run.humanKey,
    score: human?.totalScore || 0,
    gold: human?.resources?.gold || 0,
    crew: human?.resources?.crew || 0,
    supplies: human?.resources?.supplies || 0,
    cannons: human?.resources?.cannons || 0,
    territoriesControlled: human?.controlledTerritories?.length || 0,
    yourShips,
    enemyShips,
    board,
    weather: (gs.globalWeather as unknown as { type?: string })?.type || "clear",
    yourTurn,
    canAct: {
      move: yourTurn && yourShips.length > 0,
      attack: yourTurn && attackTargets.length > 0,
      claim: yourTurn && yourShips.length > 0,
      collect: yourTurn,
      build: yourTurn && (human?.resources?.gold || 0) >= 500,
    },
    attackTargets: attackTargets.slice(0, 24),
    lastMessage: error || run.lastMessage,
    ...(error ? { error } : {}),
    pausedWhenIdle: true,
    watchHint: `Spectate at /watch/${run.runId}`,
  };
}
