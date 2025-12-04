#!/usr/bin/env node

/**
 * Direct test of blockchain sync functionality
 * Tests if on-chain player counts match expected counts
 */

const { execSync } = require('child_process');

async function testBlockchainSync() {
    console.log('🧪 Testing blockchain sync...\n');

    try {
        // Test 1: Check latest game on-chain
        console.log('1. Checking latest game on-chain...');
        const games = execSync('npx tsx -e "import { getAnchorClient } from \\"./src/lib/server/anchorActions\\"; import { getGamePDA, getConfigPDA } from \\"./src/lib/anchor\\"; (async () => { const { program } = await getAnchorClient(); const [configPDA] = getConfigPDA(); const configAccount = await program.account.gameConfig.fetch(configPDA); const totalGames = configAccount.totalGames.toNumber(); console.log(\\`Total games: \\${totalGames}\\`); for (let i = Math.max(0, totalGames - 3); i < totalGames; i++) { const [gamePDA] = getGamePDA(i); try { const gameAccount = await program.account.game.fetch(gamePDA); const activePlayers = gameAccount.players.filter(p => p.key.toString() !== \\"11111111111111111111111111111111\\").length; console.log(\\`Game \\${i}: \\${activePlayers} players\\`); } catch (e) { console.log(\\`Game \\${i}: Error - \\${e.message}\\`); } } })()"', { encoding: 'utf8' });
        console.log(games);

        // Test 2: Test direct memo processing
        console.log('\n2. Testing memo processing for game 15...');
        const timestamp = Date.now();
        const memo = JSON.stringify({
            v: "1",
            gameId: "pirate_15",
            action: "join",
            solanaPubkey: "BpHqwwKRqhNRzyZHT5U4un9vfyivcbvcgrmFRfboGJsK",
            timestamp: timestamp
        });

        console.log('Memo payload:', memo);
        
        const result = execSync(`npx tsx src/cli/index.ts memo --memo '${memo}'`, { 
            encoding: 'utf8',
            timeout: 30000 
        });
        
        console.log('Memo result:');
        console.log(result);

        // Test 3: Check game 15 again
        console.log('\n3. Checking game 15 after memo processing...');
        const finalCheck = execSync('npx tsx -e "import { getAnchorClient } from \\"./src/lib/server/anchorActions\\"; import { getGamePDA } from \\"./src/lib/anchor\\"; (async () => { const { program } = await getAnchorClient(); const [gamePDA] = getGamePDA(15); try { const gameAccount = await program.account.game.fetch(gamePDA); const activePlayers = gameAccount.players.filter(p => p.key.toString() !== \\"11111111111111111111111111111111\\").length; console.log(\\`Game 15 after sync: \\${activePlayers} players\\`); gameAccount.players.forEach((p, i) => { if (p.key.toString() !== \\"11111111111111111111111111111111\\") { console.log(\\`Player \\${i}: \\${p.key.toString()}\\`); } }); } catch (e) { console.log(\\`Error checking game 15: \\${e.message}\\`); } })()"', { encoding: 'utf8' });
        console.log(finalCheck);

        console.log('\n✅ Blockchain sync test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stdout);
        console.error(error.stderr);
    }
}

testBlockchainSync();