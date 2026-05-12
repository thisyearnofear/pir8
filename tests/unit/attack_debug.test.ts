import { PirateGameManager } from "@pir8/core/lib/pirateGameEngine";

test("attack option generated when ships adjacent", () => {
  const p1 = PirateGameManager.createAIPlayer("sim1", "pirate");
  const p2 = PirateGameManager.createAIPlayer("sim2", "pirate");
  let state = PirateGameManager.createNewGame([p1, p2], "test1");
  state = { ...state, gameStatus: "active", currentPhase: "action" };

  state = {
    ...state,
    players: state.players.map((p, i) => ({
      ...p,
      ships: p.ships.map((s, j) => 
        i === 0 && j === 0 ? { ...s, position: { x: 3, y: 3 } } :
        i === 1 && j === 0 ? { ...s, position: { x: 4, y: 3 } } : s
      )
    }))
  };

  const player0 = state.players[0]!;
  const player1 = state.players[1]!;
  
  console.log("p0 key:", player0.publicKey);
  console.log("p1 key:", player1.publicKey);
  console.log("p0 ship:", player0.ships[0]?.type, player0.ships[0]?.position);
  console.log("p1 ship:", player1.ships[0]?.type, player1.ships[0]?.position);
  
  const decision = PirateGameManager.generateAIDecision(state, player0);
  console.log("options:", JSON.stringify(decision.reasoning.optionsConsidered.map(o => ({type: o.type, score: o.score}))));
  expect(decision.reasoning.optionsConsidered.some(o => o.type === "attack")).toBe(true);
});
