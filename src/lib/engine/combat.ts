import { GameState, GameAction } from "../../types/game";
import { GameBalance } from "../gameBalance";
import { calculateDistance } from "./utils";

export class CombatEngine {
  static processAttackAction(gameState: GameState, action: GameAction) {
    const { data, player } = action;
    const { shipId, targetShipId } = data;

    if (!shipId || !targetShipId) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Missing ship IDs for attack",
      };
    }

    const playerIndex = gameState.players.findIndex(
      (p) => p.publicKey === player,
    );
    if (playerIndex === -1) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Player not found",
      };
    }
    const currentPlayer = gameState.players[playerIndex];
    if (!currentPlayer) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Current player not found",
      };
    }
    const attackerShip = currentPlayer.ships.find((s) => s.id === shipId);

    if (!attackerShip) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Attacker ship not found",
      };
    }

    let targetPlayer: import("../../types/game").Player | null = null;
    let targetPlayerIndex = -1;
    let targetShip: import("../../types/game").Ship | null = null;

    for (let i = 0; i < gameState.players.length; i++) {
      const player = gameState.players[i];
      if (player) {
        const ship = player.ships.find((s) => s.id === targetShipId);
        if (ship) {
          targetPlayer = player;
          targetPlayerIndex = i;
          targetShip = ship;
          break;
        }
      }
    }

    if (!targetShip || !targetPlayer) {
      return {
        updatedGameState: gameState,
        success: false,
        message: "Target ship not found",
      };
    }

    const maxRange = GameBalance.SHIP_BALANCE[attackerShip.type].range;
    const distance = calculateDistance(
      attackerShip.position,
      targetShip.position,
    );

    if (distance > maxRange * 1.5) {
      return {
        updatedGameState: gameState,
        success: false,
        message: `Target out of range (Max: ${maxRange}, Dist: ${distance.toFixed(1)})`,
      };
    }

    const isMomentumHit = GameBalance.checkMomentum(
      currentPlayer.consecutiveAttacks,
    );
    const { damage, isCritical } = GameBalance.calculateCombatDamage(
      attackerShip.type,
      targetShip.type,
      attackerShip.health,
      targetShip.defense,
      gameState.turnNumber,
      isMomentumHit,
      distance,
    );

    const newTargetHealth = Math.max(0, targetShip.health - damage);
    const targetDestroyed = newTargetHealth === 0;

    const newConsecutiveAttacks = currentPlayer.lastActionWasAttack
      ? currentPlayer.consecutiveAttacks + 1
      : 1;

    const updatedPlayers = [...gameState.players];
    updatedPlayers[playerIndex] = {
      ...currentPlayer,
      consecutiveAttacks: newConsecutiveAttacks,
      lastActionWasAttack: true,
    };
    updatedPlayers[targetPlayerIndex] = {
      ...targetPlayer,
      publicKey: targetPlayer.publicKey,
      ships: targetPlayer.ships.map((s) =>
        s.id === targetShipId ? { ...s, health: newTargetHealth } : s,
      ),
      consecutiveAttacks: targetDestroyed ? 0 : targetPlayer.consecutiveAttacks,
    };

    let message = `⚔️ ${isCritical ? "💥 CRITICAL! " : ""}${damage} damage!`;
    if (targetDestroyed) message += " Enemy ship destroyed!";
    if (isMomentumHit) message += " (Momentum +25%)";

    const updatedGameState = {
      ...gameState,
      players: updatedPlayers,
    };

    return {
      updatedGameState,
      success: true,
      message,
    };
  }
}
