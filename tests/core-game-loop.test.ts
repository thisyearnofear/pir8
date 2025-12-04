import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Pir8Game } from "../target/types/pir8_game";

describe("PIR8 Core Game Loop", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Pir8Game as Program<Pir8Game>;
  
  const [globalGamePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("global_game")],
    program.programId
  );

  it("Initializes the global game", async () => {
    try {
      const tx = await program.methods
        .initializeGame()
        .accounts({
          game: globalGamePda,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      console.log("✅ Game initialized:", tx);
    } catch (e) {
      console.log("Game already initialized or error:", e.message);
    }
  });

  it("Player 1 joins the game", async () => {
    const tx = await program.methods
      .joinGame()
      .accounts({
        game: globalGamePda,
        player: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log("✅ Player 1 joined:", tx);
    
    const gameState = await program.account.pirateGame.fetch(globalGamePda);
    console.log("Player count:", gameState.playerCount);
  });

  it("Starts the game", async () => {
    const tx = await program.methods
      .startGame()
      .accounts({
        game: globalGamePda,
        authority: provider.wallet.publicKey,
      })
      .rpc();
    
    console.log("✅ Game started:", tx);
    
    const gameState = await program.account.pirateGame.fetch(globalGamePda);
    console.log("Game status:", gameState.status);
    console.log("Map size:", gameState.territoryMap.length);
    console.log("Player 0 ships:", gameState.players[0].ships.length);
  });

  it("Moves a ship", async () => {
    const gameState = await program.account.pirateGame.fetch(globalGamePda);
    const player = gameState.players[0];
    const ship = player.ships[0];
    
    console.log("Ship before move:", {
      id: ship.id,
      position: [ship.positionX, ship.positionY],
      speed: ship.speed,
    });

    // Move ship 1 space (within speed limit)
    const newX = ship.positionX + 1;
    const newY = ship.positionY;

    const tx = await program.methods
      .moveShip(ship.id, newX, newY, new anchor.BN(3000))
      .accounts({
        game: globalGamePda,
        player: provider.wallet.publicKey,
      })
      .rpc();
    
    console.log("✅ Ship moved:", tx);
    
    const updatedState = await program.account.pirateGame.fetch(globalGamePda);
    const updatedShip = updatedState.players[0].ships[0];
    console.log("Ship after move:", {
      position: [updatedShip.positionX, updatedShip.positionY],
      lastActionTurn: updatedShip.lastActionTurn,
    });
  });

  it("Claims a territory", async () => {
    const gameState = await program.account.pirateGame.fetch(globalGamePda);
    const player = gameState.players[0];
    const ship = player.ships[0];
    
    // Find a claimable territory near the ship
    const shipX = ship.positionX;
    const shipY = ship.positionY;
    const territoryIndex = shipX * 5 + shipY;
    const territory = gameState.territoryMap[territoryIndex];
    
    console.log("Territory at ship position:", {
      type: Object.keys(territory.cellType)[0],
      owner: territory.owner,
    });

    try {
      const tx = await program.methods
        .claimTerritory(ship.id)
        .accounts({
          game: globalGamePda,
          player: provider.wallet.publicKey,
        })
        .rpc();
      
      console.log("✅ Territory claimed:", tx);
      
      const updatedState = await program.account.pirateGame.fetch(globalGamePda);
      const updatedTerritory = updatedState.territoryMap[territoryIndex];
      console.log("Territory after claim:", {
        owner: updatedTerritory.owner?.toString(),
      });
    } catch (e) {
      console.log("Cannot claim this territory type:", e.message);
    }
  });

  it("Resets the game for next test", async () => {
    const tx = await program.methods
      .resetGame()
      .accounts({
        game: globalGamePda,
        authority: provider.wallet.publicKey,
      })
      .rpc();
    
    console.log("✅ Game reset:", tx);
    
    const gameState = await program.account.pirateGame.fetch(globalGamePda);
    console.log("Player count after reset:", gameState.playerCount);
  });
});
