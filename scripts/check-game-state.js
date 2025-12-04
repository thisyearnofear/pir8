#!/usr/bin/env node

/**
 * PIR8 Game State Inspector
 * Quick script to check the current game state on devnet
 */

const anchor = require("@coral-xyz/anchor");
const { PublicKey } = require("@solana/web3.js");

async function main() {
    // Setup connection
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    // Load program
    const programId = new PublicKey("54S7Pw6cDQKWqW4JkdTGb3vEQqtnHsZ3SvB3LB1fST2V");
    const idl = require("../target/idl/pir8_game.json");
    const program = new anchor.Program(idl, programId, provider);

    // Get global game PDA
    const [globalGamePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("global_game")],
        programId
    );

    console.log("🏴‍☠️ PIR8 Game State Inspector");
    console.log("================================");
    console.log("Program ID:", programId.toString());
    console.log("Global Game PDA:", globalGamePda.toString());
    console.log("");

    try {
        const gameState = await program.account.pirateGame.fetch(globalGamePda);

        console.log("📊 GAME STATUS");
        console.log("--------------------------------");
        console.log("Status:", Object.keys(gameState.status)[0]);
        console.log("Player Count:", gameState.playerCount);
        console.log("Current Turn:", gameState.turnNumber);
        console.log("Current Player Index:", gameState.currentPlayerIndex);
        console.log("Weather:", Object.keys(gameState.weatherType)[0]);
        console.log("");

        if (gameState.players.length > 0) {
            console.log("👥 PLAYERS");
            console.log("--------------------------------");
            gameState.players.forEach((player, idx) => {
                console.log(`\nPlayer ${idx}: ${player.pubkey.toString().slice(0, 8)}...`);
                console.log(`  Active: ${player.isActive}`);
                console.log(`  Score: ${player.totalScore}`);
                console.log(`  Resources: ${player.resources.gold} gold, ${player.resources.crew} crew`);
                console.log(`  Ships: ${player.ships.length}`);
                console.log(`  Territories: ${player.controlledTerritories.length}`);
                console.log(`  Scan Charges: ${player.scanCharges}`);
                console.log(`  Speed Bonus: ${player.speedBonusAccumulated.toString()}`);

                if (player.ships.length > 0) {
                    console.log(`  Ship Details:`);
                    player.ships.forEach((ship, shipIdx) => {
                        console.log(`    ${shipIdx + 1}. ${Object.keys(ship.shipType)[0]} at (${ship.positionX}, ${ship.positionY})`);
                        console.log(`       HP: ${ship.health}/${ship.maxHealth}, ATK: ${ship.attack}, DEF: ${ship.defense}, SPD: ${ship.speed}`);
                    });
                }
            });
        }

        if (gameState.territoryMap.length > 0) {
            console.log("\n🗺️  TERRITORY MAP (5x5)");
            console.log("--------------------------------");

            const typeSymbols = {
                water: "🌊",
                island: "🏝️",
                port: "⚓",
                treasure: "💰",
                storm: "⛈️",
                reef: "🪨",
                whirlpool: "🌀"
            };

            for (let x = 0; x < 5; x++) {
                let row = "";
                for (let y = 0; y < 5; y++) {
                    const index = x * 5 + y;
                    const cell = gameState.territoryMap[index];
                    const type = Object.keys(cell.cellType)[0];
                    const symbol = typeSymbols[type] || "❓";
                    const owned = cell.owner ? "✓" : " ";
                    row += `${symbol}${owned} `;
                }
                console.log(row);
            }

            console.log("\nLegend: ✓ = claimed");
        }

        console.log("\n✅ Game state fetched successfully!");

    } catch (error) {
        if (error.message.includes("Account does not exist")) {
            console.log("❌ Game not initialized yet!");
            console.log("\nTo initialize:");
            console.log("  anchor test --skip-deploy");
            console.log("  or");
            console.log("  npm run cli -- init");
        } else {
            console.log("❌ Error fetching game state:");
            console.log(error.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
