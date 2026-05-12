import { PirateGameManager } from "@pir8/core/lib/pirateGameEngine";
import type { GameState } from "@pir8/core/types/game";
import { createSeededRandom } from "@/lib/random";

test("seeded pirate mirror trace", () => {
  const random = createSeededRandom(1);
  const shouldLog = process.env.PIR8_TRACE_AI === "1";
  const p1 = PirateGameManager.createAIPlayer("sim1", "pirate");
  const p2 = PirateGameManager.createAIPlayer("sim2", "pirate");
  let state: GameState = PirateGameManager.createNewGame([p1, p2], "diag_seeded_1");
  state = { ...state, gameStatus: "active", currentPhase: "action" };

  let firstAttackTurn: number | null = null;
  let executedAttacks = 0;
  const attackFailures: Array<{ turn: number; message: string; action: unknown }> = [];

  for (let i = 0; i < 80; i++) {
    const currentPlayer = state.players[state.currentPlayerIndex]!;
    const decision = PirateGameManager.generateAIDecision(state, currentPlayer, random);
    const action = decision.action;

    const combatSummary = state.players.map((player, playerIndex) => {
      const enemies = state.players.filter((_, idx) => idx !== playerIndex);
      return {
        player: player.publicKey,
        ships: player.ships.map((ship) => {
          let nearestEnemyDistance = Infinity;
          for (const enemy of enemies) {
            for (const enemyShip of enemy.ships.filter((s) => s.health > 0)) {
              const distance = PirateGameManager.calculateDistance(
                ship.position,
                enemyShip.position,
              );
              if (distance < nearestEnemyDistance) nearestEnemyDistance = distance;
            }
          }
          return {
            id: ship.id,
            type: ship.type,
            hp: ship.health,
            pos: ship.position,
            nearestEnemyDistance,
          };
        }),
      };
    });

    const attackOption = decision.reasoning.optionsConsidered.find(
      (option) => option.type === "attack",
    );
    const moveOption = decision.reasoning.optionsConsidered.find(
      (option) => option.type === "move_ship",
    );
    const claimOption = decision.reasoning.optionsConsidered.find(
      (option) => option.type === "claim_territory",
    );

    if (shouldLog) {
      console.log(
        JSON.stringify({
          turn: i,
          turnNumber: state.turnNumber,
          currentPlayerIndex: state.currentPlayerIndex,
          chosenAction: action?.type ?? null,
          actionData: action?.data ?? null,
          attackScore: attackOption?.score ?? null,
          moveScore: moveOption?.score ?? null,
          claimScore: claimOption?.score ?? null,
          combatSummary,
        }),
      );
    }

    if (action) {
      const result = PirateGameManager.processTurnAction(state, action, random);
      if (action.type === "attack") {
        if (result.success) {
          executedAttacks++;
          if (firstAttackTurn === null) {
            firstAttackTurn = i;
          }
        } else {
          attackFailures.push({
            turn: i,
            message: result.message,
            action,
          });
        }
      }
      state = result.success
        ? PirateGameManager.advanceTurn(result.updatedGameState)
        : PirateGameManager.advanceTurn(state);
    } else {
      state = PirateGameManager.advanceTurn(state);
    }
  }

  if (shouldLog) {
    console.log(JSON.stringify({ firstAttackTurn, executedAttacks, attackFailures }));
  }
  expect(executedAttacks).toBeGreaterThan(0);
});

