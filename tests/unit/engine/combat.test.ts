import { PirateGameManager } from "@/lib/pirateGameEngine";
import { Player, GameState, Ship } from "@/types/game";

describe("CombatEngine", () => {
  let gameState: GameState;
  let player1: Player;
  let player2: Player;

  beforeEach(() => {
    player1 = {
      publicKey: "player1",
      username: "Pirate1",
      resources: { gold: 1000, crew: 50, cannons: 10, supplies: 100, wood: 0, rum: 0 },
      ships: [
        {
          id: "p1_ship1",
          type: "sloop",
          health: 100,
          maxHealth: 100,
          attack: 25,
          defense: 10,
          speed: 3,
          position: { x: 0, y: 0 },
          resources: { gold: 0, crew: 0, cannons: 0, supplies: 0, wood: 0, rum: 0 },
          ability: { name: "Rapid Fire", description: "", cooldown: 3, currentCooldown: 0, isReady: true, type: "offensive" },
          activeEffects: []
        }
      ],
      controlledTerritories: [],
      totalScore: 0,
      isActive: true,
      scanCharges: 3,
      scannedCoordinates: [],
      speedBonusAccumulated: 0,
      averageDecisionTimeMs: 0,
      totalMoves: 0,
      consecutiveAttacks: 0,
      lastActionWasAttack: false
    };

    player2 = {
      publicKey: "player2",
      username: "Pirate2",
      resources: { gold: 1000, crew: 50, cannons: 10, supplies: 100, wood: 0, rum: 0 },
      ships: [
        {
          id: "p2_ship1",
          type: "sloop",
          health: 100,
          maxHealth: 100,
          attack: 25,
          defense: 10,
          speed: 3,
          position: { x: 1, y: 1 },
          resources: { gold: 0, crew: 0, cannons: 0, supplies: 0, wood: 0, rum: 0 },
          ability: { name: "Rapid Fire", description: "", cooldown: 3, currentCooldown: 0, isReady: true, type: "offensive" },
          activeEffects: []
        }
      ],
      controlledTerritories: [],
      totalScore: 0,
      isActive: true,
      scanCharges: 3,
      scannedCoordinates: [],
      speedBonusAccumulated: 0,
      averageDecisionTimeMs: 0,
      totalMoves: 0,
      consecutiveAttacks: 0,
      lastActionWasAttack: false
    };

    gameState = {
      gameId: "test_game",
      gameMode: "Casual",
      players: [player1, player2],
      currentPlayerIndex: 0,
      gameMap: PirateGameManager.createGameMap(10),
      gameStatus: "active",
      currentPhase: "combat",
      turnNumber: 1,
      pendingActions: [],
      eventLog: []
    };
  });

  it("should process a successful attack", () => {
    const action = {
      id: "a1",
      gameId: "test_game",
      player: "player1",
      type: "attack" as const,
      data: { shipId: "p1_ship1", targetShipId: "p2_ship1" },
      timestamp: Date.now()
    };

    const result = PirateGameManager.processTurnAction(gameState, action);
    expect(result.success).toBe(true);
    
    const targetShip = result.updatedGameState.players[1]?.ships[0];
    expect(targetShip?.health).toBeLessThan(100);
  });

  it("should fail attack if target ship is not found", () => {
    const action = {
      id: "a2",
      gameId: "test_game",
      player: "player1",
      type: "attack" as const,
      data: { shipId: "p1_ship1", targetShipId: "non_existent" },
      timestamp: Date.now()
    };

    const result = PirateGameManager.processTurnAction(gameState, action);
    expect(result.success).toBe(false);
  });
});
