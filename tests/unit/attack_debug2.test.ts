import { PirateGameManager } from "@pir8/core/lib/pirateGameEngine";
import { GameBalance } from "@pir8/core/lib/gameBalance";
import type { GameMap, GameState, Player, Ship, ShipType } from "@pir8/core/types/game";

function createMap(size = 10): GameMap {
  return { size, cells: Array.from({ length: size }, (_, x) => Array.from({ length: size }, (_, y) => ({ coordinate: `${x},${y}`, type: "water" as const, owner: null, resources: {}, isContested: false }))) };
}
function createShip(id: string, type: ShipType, x: number, y: number): Ship {
  const base = PirateGameManager.createNewGame([PirateGameManager.createAIPlayer("base","pirate")],"base").players[0]!.ships[0]!;
  return { ...base, id, type, position: {x,y}, health: 100, maxHealth: 100, attack: 20, defense: 10, speed: 3 };
}
function createPlayer(publicKey: string, difficulty: "novice"|"pirate"|"captain"|"admiral", ships: Ship[]): Player {
  const player = PirateGameManager.createAIPlayer("test", difficulty);
  return { ...player, publicKey: `AI_${publicKey}_${difficulty}_${Date.now()}`, ships, controlledTerritories: [], revealedCoordinates: [], scannedCoordinates: [] };
}

test("attack score debug", () => {
  const attacker = createPlayer("attacker", "pirate", [createShip("AI_attacker_pirate_ship_1", "sloop", 3, 2)]);
  const defender = createPlayer("defender", "pirate", [createShip("AI_defender_pirate_ship_1", "sloop", 4, 2)]);
  const state: GameState = { gameId:"ai_test", gameMode:"Casual", players:[attacker,defender], currentPlayerIndex:0, gameMap:createMap(), gameStatus:"active", currentPhase:"action", turnNumber:10, turnTimeRemaining:30, pendingActions:[], eventLog:[], globalWeather:{type:"calm",duration:2,effect:{movementModifier:1}} };
  
  // Manually compute what findBestAttackWithScore should return
  const inState = state.players.find(p => p.publicKey === attacker.publicKey)!;
  const ship = inState.ships[0]!;
  const enemyShip = defender.ships[0]!;
  const dist = PirateGameManager.calculateDistance(ship.position, enemyShip.position);
  const range = GameBalance.SHIP_BALANCE[ship.type].range;
  const aggressiveness = 0.68;
  let score = 320 + aggressiveness * 220;
  score += Math.max(0, Math.round((range*1.5 - dist) * (55 + aggressiveness*55)));
  score += 135 - enemyShip.health;
  score += Math.round(180 + aggressiveness*170 + Math.max(0, (range*1.5-dist)*80));
  console.log(`dist=${dist} range=${range} score=${score}`);
  console.log(`ship pos: ${JSON.stringify(ship.position)}`);
  console.log(`enemy pos: ${JSON.stringify(enemyShip.position)}`);
  
  const decision = PirateGameManager.generateAIDecision(state, attacker, () => 0);
  console.log("options:", decision.reasoning.optionsConsidered.map(o=>`${o.type}:${Math.round(o.score)}`));
});
