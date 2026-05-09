import { GameState, Player } from "../../types/game";

export class VictoryEngine {
  static checkGameEnd(gameState: GameState): {
    isGameOver: boolean;
    winner: Player | null;
    updatedGameState: GameState;
  } {
    const MAX_TURNS = 35;
    const activePlayers = gameState.players.filter(
      (p) => p.isActive && p.ships.some((s) => s.health > 0),
    );

    if (activePlayers.length === 1) {
      const winner = activePlayers[0] || null;
      const updatedGameState: GameState = {
        ...gameState,
        gameStatus: "completed" as const,
        winner: winner?.publicKey,
      };
      return { isGameOver: true, winner, updatedGameState };
    }

    if (activePlayers.length === 0) {
      const updatedGameState: GameState = {
        ...gameState,
        gameStatus: "completed" as const,
        winner: undefined,
      };
      return { isGameOver: true, winner: null, updatedGameState };
    }

    if (gameState.turnNumber >= MAX_TURNS) {
      const winner = this.determineWinnerByScore(gameState.players, gameState);
      const updatedGameState: GameState = {
        ...gameState,
        gameStatus: "completed" as const,
        winner: winner?.publicKey,
      };
      return { isGameOver: true, winner, updatedGameState };
    }

    const totalTerritories = gameState.players.reduce(
      (sum, p) => sum + p.controlledTerritories.length,
      0,
    );

    if (totalTerritories > 0) {
      for (const player of gameState.players) {
        const territoryPercent =
          player.controlledTerritories.length / totalTerritories;
        if (
          territoryPercent >= 0.75 &&
          player.ships.some((s) => s.health > 0)
        ) {
          const updatedGameState: GameState = {
            ...gameState,
            gameStatus: "completed" as const,
            winner: player.publicKey,
          };
          return { isGameOver: true, winner: player, updatedGameState };
        }
      }
    }

    return { isGameOver: false, winner: null, updatedGameState: gameState };
  }

  static determineWinnerByScore(
    players: Player[],
    gameState?: GameState,
  ): Player | null {
    if (players.length === 0) return null;

    const turnNumber = gameState?.turnNumber || 0;
    const isSuddenDeath = turnNumber >= 40;
    const avgTerritories =
      players.reduce((sum, p) => sum + p.controlledTerritories.length, 0) /
      players.length;
    const avgShips =
      players.reduce(
        (sum, p) => sum + p.ships.filter((s) => s.health > 0).length,
        0,
      ) / players.length;

    const scoredPlayers = players.map((player) => {
      const activeShips = player.ships.filter((s) => s.health > 0).length;
      const totalShipHealth = player.ships.reduce(
        (sum, s) => sum + s.health,
        0,
      );
      const territories = player.controlledTerritories.length;
      const resources =
        player.resources.gold +
        player.resources.crew * 2 +
        player.resources.cannons * 5;

      let score =
        activeShips * 100 +
        totalShipHealth * 2 +
        territories * 150 +
        resources * 0.5 +
        player.totalScore;

      const territoryGap = avgTerritories - territories;
      const shipGap = avgShips - activeShips;
      if (territoryGap > 0 || shipGap > 0) {
        score += territoryGap * 50 + shipGap * 100;
      }

      if (isSuddenDeath) {
        score =
          activeShips * 150 +
          totalShipHealth * 3 +
          territories * 100 +
          resources;
      }

      return { player, score };
    });

    scoredPlayers.sort((a, b) => b.score - a.score);

    return scoredPlayers[0]?.player || null;
  }

  static resign(gameState: GameState, player: string): GameState {
    const playerIndex = gameState.players.findIndex(
      (p) => p.publicKey === player,
    );
    if (playerIndex === -1) return gameState;

    const updatedPlayers = [...gameState.players];
    const resigningPlayer = updatedPlayers[playerIndex];
    if (!resigningPlayer) return gameState;

    updatedPlayers[playerIndex] = {
      ...resigningPlayer,
      isActive: false,
    };

    const activePlayers = updatedPlayers.filter((p) => p.isActive);

    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      if (winner) {
        return {
          ...gameState,
          gameStatus: "completed",
          winner: winner.publicKey,
          players: updatedPlayers,
        };
      }
    }

    return {
      ...gameState,
      players: updatedPlayers,
    };
  }

  static shouldResign(player: Player, gameState: GameState): boolean {
    const activePlayers = gameState.players.filter(
      (p) => p.isActive && p.ships.some((s) => s.health > 0),
    );
    if (activePlayers.length < 2) return false;

    const playerShips = player.ships.filter((s) => s.health > 0).length;
    const avgShips =
      activePlayers.reduce(
        (sum, p) => sum + p.ships.filter((s) => s.health > 0).length,
        0,
      ) / activePlayers.length;
    const playerTerritories = player.controlledTerritories.length;
    const avgTerritories =
      activePlayers.reduce(
        (sum, p) => sum + p.controlledTerritories.length,
        0,
      ) / activePlayers.length;

    return (
      playerShips < avgShips * 0.25 && playerTerritories < avgTerritories * 0.25
    );
  }
}
