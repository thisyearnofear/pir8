#!/usr/bin/env node

/**
 * Test script for AI vs AI mode initialization
 * Verifies that the game state is properly initialized without undefined arrays
 */

const { PirateGameManager } = require('../src/lib/pirateGameEngine');

console.log('🏴‍☠️ Testing AI vs AI Mode Initialization...\n');

try {
  // Create two AI players
  const aiPlayer1 = PirateGameManager.createAIPlayer('test', 'pirate');
  const aiPlayer2 = PirateGameManager.createAIPlayer('test', 'captain');

  console.log('✅ AI Players created successfully');
  console.log(`   Player 1: ${aiPlayer1.username} (${aiPlayer1.publicKey})`);
  console.log(`   Player 2: ${aiPlayer2.username} (${aiPlayer2.publicKey})`);

  // Verify players have required arrays
  const requiredArrays = ['ships', 'controlledTerritories', 'scannedCoordinates'];
  
  [aiPlayer1, aiPlayer2].forEach((player, index) => {
    requiredArrays.forEach(arrayName => {
      if (!Array.isArray(player[arrayName])) {
        throw new Error(`Player ${index + 1} missing ${arrayName} array`);
      }
    });
  });

  console.log('✅ Player arrays properly initialized');

  // Create game
  const gameState = PirateGameManager.createNewGame([aiPlayer1, aiPlayer2], 'test_game');

  console.log('✅ Game state created successfully');
  console.log(`   Game ID: ${gameState.gameId}`);
  console.log(`   Players: ${gameState.players.length}`);
  console.log(`   Status: ${gameState.gameStatus}`);

  // Verify game state arrays
  const requiredGameArrays = ['players', 'pendingActions', 'eventLog'];
  
  requiredGameArrays.forEach(arrayName => {
    if (!Array.isArray(gameState[arrayName])) {
      throw new Error(`Game state missing ${arrayName} array`);
    }
  });

  console.log('✅ Game state arrays properly initialized');

  // Verify each player in game state has required arrays
  gameState.players.forEach((player, index) => {
    requiredArrays.forEach(arrayName => {
      if (!Array.isArray(player[arrayName])) {
        throw new Error(`Game player ${index + 1} missing ${arrayName} array`);
      }
    });
  });

  console.log('✅ All player arrays in game state properly initialized');

  // Test AI decision generation
  const aiDecision = PirateGameManager.generateAIDecision(gameState, gameState.players[0]);
  
  if (!aiDecision.reasoning) {
    throw new Error('AI decision missing reasoning');
  }

  if (!Array.isArray(aiDecision.reasoning.optionsConsidered)) {
    throw new Error('AI reasoning missing optionsConsidered array');
  }

  console.log('✅ AI decision generation working');
  console.log(`   Options considered: ${aiDecision.reasoning.optionsConsidered.length}`);
  console.log(`   Chosen action: ${aiDecision.action ? aiDecision.action.type : 'none'}`);

  console.log('\n🎉 All tests passed! AI vs AI mode should work correctly.');

} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}