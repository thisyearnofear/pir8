import {
  Player,
  GameState,
  ShipType,
  Coordinate,
  GameAction,
  Resources,
  TerritoryCellType,
} from "../../types/game";
import { GAME_CONFIG } from "../../utils/constants";
import { coordinateToString, stringToCoordinate, analyzeGameState, calculateDistance } from "./utils";
import { ResourceEngine } from "./resources";
import { MapEngine } from "./map";
import { GameBalance } from "../gameBalance";

export interface AIOption {
  type: "claim_territory" | "attack" | "move_ship" | "build_ship" | "pass";
  target?: string;
  shipId?: string;
  score: number;
  reason: string;
  details?: any;
}

export interface AIReasoning {
  optionsConsidered: AIOption[];
  chosenOption: AIOption | null;
  gameAnalysis: {
    isWinning: boolean;
    isLosing: boolean;
    territoriesControlled: number;
    totalShips: number;
    resourceAdvantage: boolean;
  };
  difficulty: {
    level: "novice" | "pirate" | "captain" | "admiral";
    name: string;
    aggressiveness: number;
  };
  thinkingTime: number;
}

export interface AIDecision {
  action: GameAction | null;
  reasoning: AIReasoning;
}

export class AIEngine {
  private static aiInstanceCounter = 0;

  static createAIPlayer(
    _gameId: string,
    difficulty: "novice" | "pirate" | "captain" | "admiral" = "pirate",
  ): Player {
    const aiNames = [
      "Blackbeard",
      "Calico Jack",
      "Anne Bonny",
      "Bartholomew",
      "Mary Read",
    ];
    const instanceId = ++this.aiInstanceCounter;
    const randomName = aiNames[instanceId % aiNames.length];

    return {
      publicKey: `AI_${randomName}_${difficulty}_${instanceId}`,
      username: `${randomName} (AI)`,
      resources: {
        gold: 1000,
        crew: 50,
        cannons: 10,
        supplies: 100,
        wood: 0,
        rum: 0,
      },
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
  }

  static generateAIMove(
    gameState: GameState,
    aiPlayer: Player,
    randomFn: () => number = Math.random,
  ): GameAction | null {
    const decision = this.generateAIDecision(gameState, aiPlayer, randomFn);
    return decision.action;
  }

  static generateAIDecision(
    gameState: GameState,
    aiPlayer: Player,
    randomFn: () => number = Math.random,
  ): AIDecision {
    const startTime = Date.now();
    const difficulty = this.getAIDifficulty(aiPlayer);
    const debugMode =
      typeof window !== "undefined" && (window as any).PIR8_DEBUG_AI === true;

    if (debugMode) {
      console.log(`🤖 AI Turn: ${difficulty.debugName} evaluating options...`);
    }

    const gameAnalysis = this.analyzeGameState(gameState, aiPlayer);

    const optionsConsidered: AIOption[] = [];

    const claimResult = this.evaluateTerritoryClaim(gameState, aiPlayer);
    if (claimResult) {
      optionsConsidered.push(claimResult);
    }

    const attackResult = this.evaluateAttack(gameState, aiPlayer, gameAnalysis);
    if (attackResult) {
      optionsConsidered.push(attackResult);
    }

    const moveResult = this.evaluateMove(gameState, aiPlayer, { ...gameAnalysis, aggressiveness: difficulty.aggressiveness });
    if (moveResult) {
      optionsConsidered.push(moveResult);
    }

    const buildResult = this.evaluateBuild(gameState, aiPlayer, gameAnalysis);
    if (buildResult) {
      optionsConsidered.push(buildResult);
    }

    let chosenOption: AIOption | null = null;
    let chosenAction: GameAction | null = null;

    if (optionsConsidered.length > 0) {
      optionsConsidered.sort((a, b) => b.score - a.score);

      const bestAttackOption = optionsConsidered.find(
        (option) => option.type === "attack",
      );

      if (bestAttackOption) {
        chosenOption = bestAttackOption;
        chosenAction = this.optionToAction(bestAttackOption, gameState, aiPlayer);
      } else {
        for (const option of optionsConsidered) {
          const selectionChance = this.getSelectionChance(
            option.type,
            difficulty,
            gameAnalysis,
          );
          if (randomFn() < selectionChance) {
            chosenOption = option;
            chosenAction = this.optionToAction(option, gameState, aiPlayer);
            break;
          }
        }

        if (!chosenOption && optionsConsidered.length > 0) {
          chosenOption = optionsConsidered[0] || null;
          if (chosenOption) {
            chosenAction = this.optionToAction(chosenOption, gameState, aiPlayer);
          }
        }
      }
    }

    if (debugMode && chosenOption) {
      console.log(
        `  ✅ AI Decision: ${chosenOption.type} (score: ${chosenOption.score})`,
      );
    } else if (debugMode) {
      console.log("  ⏭️ AI Decision: Pass (no valid actions)");
    }

    const difficultyName = difficulty.debugName || "Pirate";
    const reasoning: AIReasoning = {
      optionsConsidered,
      chosenOption,
      gameAnalysis: {
        isWinning: gameAnalysis.isWinning,
        isLosing: gameAnalysis.isLosing,
        territoriesControlled: gameAnalysis.territoriesControlled,
        totalShips: gameAnalysis.totalShips,
        resourceAdvantage: gameAnalysis.resourceAdvantage,
      },
      difficulty: {
        level: difficultyName.includes("Novice")
          ? "novice"
          : difficultyName.includes("Admiral")
            ? "admiral"
            : difficultyName.includes("Captain")
              ? "captain"
              : "pirate",
        name: difficultyName,
        aggressiveness: difficulty.aggressiveness,
      },
      thinkingTime: Date.now() - startTime,
    };

    return {
      action: chosenAction,
      reasoning,
    };
  }

  static analyzeGameState = analyzeGameState;

  private static getSelectionChance(
    optionType: string,
    difficulty: any,
    gameAnalysis: any,
  ): number {
    switch (optionType) {
      case "claim_territory":
        return difficulty.claimChance;
      case "attack":
        return gameAnalysis.isLosing
          ? difficulty.attackChance * 1.2
          : difficulty.attackChance;
      case "move_ship":
        return difficulty.moveChance;
      case "build_ship":
        return gameAnalysis.isWinning
          ? difficulty.buildChance * 0.8
          : difficulty.buildChance;
      default:
        return 0.5;
    }
  }

  private static optionToAction(
    option: AIOption,
    gameState: GameState,
    aiPlayer: Player,
  ): GameAction {
    return {
      id: `ai_action_${Date.now()}`,
      gameId: gameState.gameId,
      player: aiPlayer.publicKey,
      type: option.type as any,
      data: option.details || {},
      timestamp: Date.now(),
    };
  }

  private static getAIDifficulty(aiPlayer: Player): {
    claimChance: number;
    attackChance: number;
    moveChance: number;
    buildChance: number;
    planningDepth: number;
    aggressiveness: number;
    debugName: string;
  } {
    const difficultyMatch = aiPlayer.publicKey.match(
      /AI_\w+_(novice|pirate|captain|admiral)_\d+/,
    );
    const level =
      (difficultyMatch?.[1] as "novice" | "pirate" | "captain" | "admiral") ||
      "pirate";

    const configs = {
      novice: {
        claimChance: 1.0,
        attackChance: 0.45,
        moveChance: 1.0,
        buildChance: 0.2,
        planningDepth: 1,
        aggressiveness: 0.2,
        debugName: "🐣 Novice",
      },
      pirate: {
        claimChance: 0.75,
        attackChance: 0.92,
        moveChance: 1.0,
        buildChance: 0.35,
        planningDepth: 2,
        aggressiveness: 0.68,
        debugName: "⚔️ Pirate",
      },
      captain: {
        claimChance: 0.6,
        attackChance: 1.0,
        moveChance: 1.0,
        buildChance: 0.5,
        planningDepth: 3,
        aggressiveness: 0.85,
        debugName: "🏴‍☠️ Captain",
      },
      admiral: {
        claimChance: 0.45,
        attackChance: 1.0,
        moveChance: 1.0,
        buildChance: 0.55,
        planningDepth: 4,
        aggressiveness: 1.0,
        debugName: "👑 Admiral",
      },
    };

    return configs[level];
  }

  private static evaluateTerritoryClaim(
    gameState: GameState,
    aiPlayer: Player,
  ): AIOption | null {
    const result = this.findBestTerritoryClaim(gameState, aiPlayer);
    if (!result) return null;

    const { shipId, toCoordinate } = result.data;
    if (!toCoordinate) return null;

    const ship = aiPlayer.ships.find((s) => s.id === shipId);
    if (!ship) return null;

    const coord = stringToCoordinate(toCoordinate);
    const territory = gameState.gameMap.cells[coord.x]?.[coord.y];

    let score = 70;
    let reason = "Claiming territory";

    if (territory) {
      if (territory.type === "treasure") {
        score = 100;
        reason = "High-value treasure - must claim!";
      } else if (territory.type === "port") {
        score = 90;
        reason = "Strategic port for ship building";
      } else if (territory.type === "island") {
        score = 75;
        reason = "Island provides resources";
      }
    }

    let nearestEnemyDistance = Infinity;
    for (const enemy of gameState.players) {
      if (enemy.publicKey === aiPlayer.publicKey) continue;
      for (const enemyShip of enemy.ships.filter((s) => s.health > 0)) {
        const distance = calculateDistance(ship.position, enemyShip.position);
        if (distance < nearestEnemyDistance) {
          nearestEnemyDistance = distance;
        }
      }
    }

    const aggressiveness = this.getAIDifficulty(aiPlayer).aggressiveness;

    if (nearestEnemyDistance <= 4) {
      score -= Math.round(140 * Math.max(0.35, aggressiveness));
      reason = "Enemy nearby - contest position first";
    } else if (nearestEnemyDistance <= 6) {
      score -= Math.round(75 * Math.max(0.3, aggressiveness));
      reason = "Secure combat position before claiming";
    }

    if (
      aggressiveness >= 0.55 &&
      nearestEnemyDistance <= 8 &&
      (territory?.type === "treasure" || territory?.type === "port")
    ) {
      score -= Math.round(35 + aggressiveness * 35);
      reason = "Pressure enemy before securing valuable territory";
    }

    return {
      type: "claim_territory",
      target: toCoordinate,
      shipId,
      score,
      reason,
      details: result.data,
    };
  }

  private static findBestTerritoryClaim(
    gameState: GameState,
    aiPlayer: Player,
  ): GameAction | null {
    const currentPlayerInState = gameState.players.find(p => p.publicKey === aiPlayer.publicKey);
    const activeShips = (currentPlayerInState || aiPlayer).ships.filter((s) => s.health > 0);

    for (const ship of activeShips) {
      const coord = coordinateToString(ship.position);
      const territory =
        gameState.gameMap.cells[ship.position.x]?.[ship.position.y];

      if (
        territory &&
        (territory.type === "treasure" ||
          territory.type === "port" ||
          territory.type === "island") &&
        territory.owner !== aiPlayer.publicKey
      ) {
        return {
          id: `ai_action_${Date.now()}`,
          gameId: gameState.gameId,
          player: aiPlayer.publicKey,
          type: "claim_territory",
          data: { shipId: ship.id, toCoordinate: coord },
          timestamp: Date.now(),
        };
      }
    }
    return null;
  }

  private static evaluateAttack(
    gameState: GameState,
    aiPlayer: Player,
    gameAnalysis: any,
  ): AIOption | null {
    const result = this.findBestAttackWithScore(
      gameState,
      aiPlayer,
      gameAnalysis,
    );
    if (!result) return null;

    return {
      type: "attack",
      target: result.targetShipId,
      shipId: result.shipId,
      score: result.score,
      reason: result.reason,
      details: { shipId: result.shipId, targetShipId: result.targetShipId },
    };
  }

  private static findBestAttackWithScore(
    gameState: GameState,
    aiPlayer: Player,
    gameAnalysis: any,
  ): {
    shipId: string;
    targetShipId: string;
    score: number;
    reason: string;
  } | null {
    const currentPlayerInState = gameState.players.find(p => p.publicKey === aiPlayer.publicKey);
    const activeShips = (currentPlayerInState || aiPlayer).ships.filter((s) => s.health > 0);
    let bestAttack: {
      shipId: string;
      targetShipId: string;
      score: number;
      reason: string;
    } | null = null;

    const isLateGame = gameState.turnNumber > 25;

    const aggressiveness = this.getAIDifficulty(aiPlayer).aggressiveness;

    for (const ship of activeShips) {
      for (const enemy of gameState.players) {
        if (enemy.publicKey === aiPlayer.publicKey) continue;

        for (const enemyShip of enemy.ships.filter((s) => s.health > 0)) {
          const distance = calculateDistance(
            ship.position,
            enemyShip.position,
          );
          const maxRange = GameBalance.SHIP_BALANCE[ship.type].range;

          if (distance <= maxRange * 1.5) {
            let score = 320 + aggressiveness * 220;
            let reason = "Enemy in range";

            score += Math.max(
              0,
              Math.round((maxRange * 1.5 - distance) * (55 + aggressiveness * 55)),
            );
            score += 135 - enemyShip.health;

            const contactBonus = Math.round(
              180 + aggressiveness * 170 + Math.max(0, (maxRange * 1.5 - distance) * 80),
            );
            score += contactBonus;


            if (enemyShip.health < 30) {
              reason = "Finish off weakened enemy";
            }

            if (enemyShip.type === "flagship") {
              score += 50;
              reason = "Eliminate flagship threat";
            } else if (enemyShip.type === "galleon") {
              score += 30;
              reason = "Take down galleon";
            } else if (enemyShip.type === "frigate") {
              score += 20;
            }

            if (gameAnalysis.isLosing) {
              score += 25;
              reason = "Aggressive strike - must turn tide";
            }

            if (isLateGame) {
              score *= 1.5;
              reason += " (late game)";
            }

            if (!bestAttack || score > bestAttack.score) {
              bestAttack = {
                shipId: ship.id,
                targetShipId: enemyShip.id,
                score,
                reason,
              };
            }
          }
        }
      }
    }

    if (typeof process !== 'undefined' && process.env['PIR8_TRACE_AI'] === '1') {
      console.log('findBestAttackWithScore result:', JSON.stringify(bestAttack));
    }
    return bestAttack;
  }

  private static evaluateMove(
    gameState: GameState,
    aiPlayer: Player,
    gameAnalysis: any,
  ): AIOption | null {
    const result = this.findBestMoveWithScore(
      gameState,
      aiPlayer,
      gameAnalysis,
    );
    if (!result) return null;

    return {
      type: "move_ship",
      target: result.toCoordinate,
      shipId: result.shipId,
      score: result.score,
      reason: result.reason,
      details: { shipId: result.shipId, toCoordinate: result.toCoordinate },
    };
  }

  private static findBestMoveWithScore(
    gameState: GameState,
    aiPlayer: Player,
    gameAnalysis: any,
  ): {
    shipId: string;
    toCoordinate: string;
    score: number;
    reason: string;
  } | null {
    const currentPlayerInState = gameState.players.find(p => p.publicKey === aiPlayer.publicKey);
    const activeShips = (currentPlayerInState || aiPlayer).ships.filter((s) => s.health > 0);
    if (activeShips.length === 0) return null;

    let bestMove: {
      shipId: string;
      toCoordinate: string;
      score: number;
      reason: string;
    } | null = null;

    const aggressiveness = (gameAnalysis as any).aggressiveness ?? 0.5;

    for (const ship of activeShips) {
      const speed = ship.speed;
      let bestTarget: { x: number; y: number } | null = null;
      let bestScore = -Infinity;
      let bestReason = "";

      for (let x = 0; x < gameState.gameMap.size; x++) {
        for (let y = 0; y < gameState.gameMap.size; y++) {
          const territory = gameState.gameMap.cells[x]?.[y];
          if (!territory) continue;
          if (territory.owner === aiPlayer.publicKey) continue;
          if (ship.position.x === x && ship.position.y === y) continue;

          const manhattanDist =
            Math.abs(ship.position.x - x) + Math.abs(ship.position.y - y);
          if (manhattanDist > speed) continue;
          if (!this.isNavigable(territory.type)) continue;
          if (this.isPositionOccupied(gameState, { x, y })) continue;
          if (
            !MapEngine.isPathClear(
              gameState.gameMap,
              ship.position,
              { x, y },
            )
          ) {
            continue;
          }

          let score = 0;
          let reason = "";

          if (territory.type === "treasure") {
            score = 100;
            reason = "Move toward treasure";
          } else if (territory.type === "port") {
            score = 70;
            reason = "Advance to strategic port";
          } else if (territory.type === "island") {
            score = 40;
            reason = "Head to resource island";
          } else if (territory.type === "water") {
            score = 15;
            reason = "Navigate toward objective";
          } else {
            score = -50;
            reason = "Avoid hazard";
          }

          if (!territory.owner && territory.type !== "water") {
            score += 30;
            reason = "Claim unclaimed territory";
          }

          score -= manhattanDist * 3;

          if (
            ship.previousPosition &&
            ship.previousPosition.x === x &&
            ship.previousPosition.y === y
          ) {
            score -= 180;
            reason = reason || "Avoid backtracking";
          }

          if (
            gameAnalysis.isLosing &&
            (territory.type === "treasure" || territory.type === "port")
          ) {
            score += 25;
            reason = "Desperate push for valuable tile";
          }

          if (
            gameAnalysis.isWinning &&
            (territory.type === "storm" || territory.type === "whirlpool")
          ) {
            score -= 50;
          }

          let nearestEnemyDist = Infinity;
          let bestCombatGap = Infinity;
          let entersCombatRange = false;
          for (const enemy of gameState.players) {
            if (enemy.publicKey === aiPlayer.publicKey) continue;
            for (const enemyShip of enemy.ships.filter((s) => s.health > 0)) {
              const distanceToEnemy = calculateDistance(
                { x, y },
                enemyShip.position,
              );
              if (distanceToEnemy < nearestEnemyDist) {
                nearestEnemyDist = distanceToEnemy;
              }
              const maxRange = GameBalance.SHIP_BALANCE[ship.type].range * 1.5;
              const combatGap = distanceToEnemy - maxRange;
              if (combatGap < bestCombatGap) {
                bestCombatGap = combatGap;
              }
              if (distanceToEnemy <= maxRange) {
                entersCombatRange = true;
              }
            }
          }

          if (nearestEnemyDist !== Infinity && nearestEnemyDist > 0) {
            if (entersCombatRange) {
              score += 60 + aggressiveness * 40;
              score += ship.attack * 0.2;
              reason = "Close for attack";
            } else {
              const normalizedGap = Math.max(0, bestCombatGap);
              score += Math.max(0, 110 - normalizedGap * 35) * aggressiveness;

              if (nearestEnemyDist <= 2.5) {
                score += 80 + aggressiveness * 90;
                reason = reason || "Pursue enemy";
              } else if (nearestEnemyDist < 5) {
                score += aggressiveness * Math.max(0, 70 - nearestEnemyDist * 10);
                reason = reason || "Pursue enemy";
              }
            }
          }

          if (score > bestScore) {
            bestScore = score;
            bestTarget = { x, y };
            bestReason = reason;
          }
        }
      }

      if (aggressiveness >= 0.5) {
        let nearestEnemy: { x: number; y: number } | null = null;
        let nearestDist = Infinity;
        for (const enemy of gameState.players) {
          if (enemy.publicKey === aiPlayer.publicKey) continue;
          for (const enemyShip of enemy.ships.filter((s) => s.health > 0)) {
            const dist =
              Math.abs(ship.position.x - enemyShip.position.x) +
              Math.abs(ship.position.y - enemyShip.position.y);
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestEnemy = enemyShip.position;
            }
          }
        }

        if (nearestEnemy && nearestDist > 1) {
          let approachTarget: { x: number; y: number } | null = null;
          const currentDistToEnemy = Math.abs(ship.position.x - nearestEnemy.x) + Math.abs(ship.position.y - nearestEnemy.y);
          let approachBest = currentDistToEnemy;

          for (let ax = 0; ax < gameState.gameMap.size; ax++) {
            for (let ay = 0; ay < gameState.gameMap.size; ay++) {
              if (ax === ship.position.x && ay === ship.position.y) continue;
              const stepDist =
                Math.abs(ship.position.x - ax) + Math.abs(ship.position.y - ay);
              if (stepDist > speed) continue;
              const cell = gameState.gameMap.cells[ax]?.[ay];
              if (!cell || !this.isNavigable(cell.type)) continue;
              if (this.isPositionOccupied(gameState, { x: ax, y: ay })) continue;
              if (
                !MapEngine.isPathClear(
                  gameState.gameMap,
                  ship.position,
                  { x: ax, y: ay },
                )
              ) {
                continue;
              }
              const distToEnemy =
                Math.abs(ax - nearestEnemy.x) + Math.abs(ay - nearestEnemy.y);
              if (distToEnemy < approachBest) {
                approachBest = distToEnemy;
                approachTarget = { x: ax, y: ay };
              }
            }
          }

          if (approachTarget) {
            const approachScore = 160 + aggressiveness * 180;
            if (approachScore > bestScore) {
              bestScore = approachScore;
              bestTarget = approachTarget;
              bestReason = "Approach enemy";
            }
          }
        }
      }

      if (bestTarget) {
        const candidateMove = {
          shipId: ship.id,
          toCoordinate: coordinateToString(bestTarget),
          score: bestScore,
          reason: bestReason,
        };

        if (!bestMove || candidateMove.score > bestMove.score) {
          bestMove = candidateMove;
        }
      }
    }

    return bestMove;
  }

  private static isNavigable(territoryType: TerritoryCellType): boolean {
    const navigableTypes: TerritoryCellType[] = [
      "water",
      "port",
      "island",
      "treasure",
      "storm",
      "whirlpool",
    ];
    return navigableTypes.includes(territoryType);
  }

  private static isPositionOccupied(
    gameState: GameState,
    position: Coordinate,
  ): boolean {
    for (const player of gameState.players) {
      for (const ship of player.ships) {
        if (
          ship.health > 0 &&
          ship.position.x === position.x &&
          ship.position.y === position.y
        ) {
          return true;
        }
      }
    }
    return false;
  }

  private static evaluateBuild(
    gameState: GameState,
    aiPlayer: Player,
    _gameAnalysis: any,
  ): AIOption | null {
    const result = this.findBestBuildWithScore(gameState, aiPlayer);
    if (!result) return null;

    return {
      type: "build_ship",
      target: result.toCoordinate,
      score: result.score,
      reason: result.reason,
      details: { shipType: result.shipType, toCoordinate: result.toCoordinate },
    };
  }

  private static findBestBuildWithScore(
    gameState: GameState,
    aiPlayer: Player,
  ): {
    shipType: ShipType;
    toCoordinate: string;
    score: number;
    reason: string;
  } | null {
    const currentPlayerInState = gameState.players.find(p => p.publicKey === aiPlayer.publicKey);
    const activeShips = (currentPlayerInState || aiPlayer).ships.filter((s) => s.health > 0);
    if (activeShips.length >= GAME_CONFIG.MAX_SHIPS_PER_PLAYER) return null;

    const shipTypes: ShipType[] = ["flagship", "galleon", "frigate", "sloop"];

    for (const shipType of shipTypes) {
      const costs = ResourceEngine.getShipBuildingCosts(shipType);
      const canAfford = Object.entries(costs).every(
        ([resource, cost]) =>
          aiPlayer.resources[resource as keyof Resources] >= cost,
      );

      if (canAfford) {
        for (const territory of aiPlayer.controlledTerritories) {
          const coords = territory.split(",").map(Number);
          const x = coords[0];
          const y = coords[1];
          if (x === undefined || y === undefined) continue;

          const port = gameState.gameMap.cells[x]?.[y];
          if (port?.type === "port") {
            const adjacent: Coordinate[] = [
              { x: x - 1, y },
              { x: x + 1, y },
              { x, y: y - 1 },
              { x, y: y + 1 },
            ];
            for (const pos of adjacent) {
              const cell = gameState.gameMap.cells[pos.x]?.[pos.y];
              if (cell?.type === "water") {
                let score = 60;
                let reason = `Build ${shipType}`;

                if (shipType === "flagship") {
                  score = 90;
                  reason = "Build powerful flagship";
                } else if (shipType === "galleon") {
                  score = 80;
                  reason = "Build strong galleon";
                } else if (shipType === "frigate") {
                  score = 70;
                  reason = "Build versatile frigate";
                } else {
                  score = 60;
                  reason = "Build fast sloop";
                }

                return {
                  shipType,
                  toCoordinate: coordinateToString(pos),
                  score,
                  reason,
                };
              }
            }
          }
        }
      }
    }

    return null;
  }
}
