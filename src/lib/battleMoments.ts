import { GameState } from "@/types/game";

export interface BattleMoment {
  title: string;
  summary: string;
  turnNumber: number;
  shipsDestroyed: number;
  territoriesControlled: number;
  gold: number;
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

  if (shipsDestroyed > 0) {
    return {
      title: "Ambush replay",
      summary: `${shipsDestroyed} ship${shipsDestroyed === 1 ? "" : "s"} sunk after the reveal.`,
      turnNumber: gameState.turnNumber,
      shipsDestroyed,
      territoriesControlled,
      gold,
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
    };
  }

  return {
    title: "Decisive command replay",
    summary: `Victory sealed in ${gameState.turnNumber} turns.`,
    turnNumber: gameState.turnNumber,
    shipsDestroyed,
    territoriesControlled,
    gold,
  };
}
