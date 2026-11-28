import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Pir8Game } from "../target/types/pir8_game";

// On-chain integration test: needs a local validator + deployed chain.program.
// `anchor test` provides both via ANCHOR_PROVIDER_URL. Under plain `pnpm test`
// the env var is absent, so every test below registers as skipped instead of
// throwing at collection time (AnchorProvider.env() requires the var).
const hasValidator = Boolean(process.env.ANCHOR_PROVIDER_URL);
const itOnChain = hasValidator ? it : it.skip;

describe("PIR8 Core Game Loop", () => {
  let provider: anchor.AnchorProvider | undefined;
  let program: Program<Pir8Game> | undefined;
  let globalGamePda: PublicKey | undefined;

  beforeAll(() => {
    if (!hasValidator) return;
    const p = anchor.AnchorProvider.env();
    anchor.setProvider(p);
    provider = p;
    const prog = anchor.workspace.Pir8Game as Program<Pir8Game>;
    program = prog;
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("global_game")],
      prog.programId
    );
    chain.globalGamePda = pda;
  });

  function needChain() {
    if (!provider || !program || !chain.globalGamePda) {
      console.log("SKIP: on-chain test needs ANCHOR_PROVIDER_URL — run via `anchor test`.");
      return null;
    }
    return { provider, program, globalGamePda };
  }

  itOnChain("Initializes the global game", async () => {
    const chain = needChain();
    if (!chain) return;
    try {
      const tx = await chain.program.methods
        .initializeGame()
        .accounts({
          game: chain.globalGamePda,
          authority: chain.provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      console.log("✅ Game initialized:", tx);
    } catch (e) {
      console.log("Game already initialized or error:", e.message);
    }
  });

  itOnChain("Player 1 joins the game", async () => {
    const chain = needChain();
    if (!chain) return;
    const tx = await chain.program.methods
      .joinGame()
      .accounts({
        game: chain.globalGamePda,
        player: chain.provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log("✅ Player 1 joined:", tx);
    
    const gameState = await chain.program.account.pirateGame.fetch(chain.globalGamePda);
    console.log("Player count:", gameState.playerCount);
  });

  itOnChain("Starts the game", async () => {
    const chain = needChain();
    if (!chain) return;
    const tx = await chain.program.methods
      .startGame()
      .accounts({
        game: chain.globalGamePda,
        authority: chain.provider.wallet.publicKey,
      })
      .rpc();
    
    console.log("✅ Game started:", tx);
    
    const gameState = await chain.program.account.pirateGame.fetch(chain.globalGamePda);
    console.log("Game status:", gameState.status);
    console.log("Map size:", gameState.territoryMap.length);
    console.log("Player 0 ships:", gameState.players[0].ships.length);
  });

  itOnChain("Moves a ship", async () => {
    const chain = needChain();
    if (!chain) return;
    const gameState = await chain.program.account.pirateGame.fetch(chain.globalGamePda);
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

    const tx = await chain.program.methods
      .moveShip(ship.id, newX, newY, new anchor.BN(3000))
      .accounts({
        game: chain.globalGamePda,
        player: chain.provider.wallet.publicKey,
      })
      .rpc();
    
    console.log("✅ Ship moved:", tx);
    
    const updatedState = await chain.program.account.pirateGame.fetch(chain.globalGamePda);
    const updatedShip = updatedState.players[0].ships[0];
    console.log("Ship after move:", {
      position: [updatedShip.positionX, updatedShip.positionY],
      lastActionTurn: updatedShip.lastActionTurn,
    });
  });

  itOnChain("Claims a territory", async () => {
    const chain = needChain();
    if (!chain) return;
    const gameState = await chain.program.account.pirateGame.fetch(chain.globalGamePda);
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
      const tx = await chain.program.methods
        .claimTerritory(ship.id)
        .accounts({
          game: chain.globalGamePda,
          player: chain.provider.wallet.publicKey,
        })
        .rpc();
      
      console.log("✅ Territory claimed:", tx);
      
      const updatedState = await chain.program.account.pirateGame.fetch(chain.globalGamePda);
      const updatedTerritory = updatedState.territoryMap[territoryIndex];
      console.log("Territory after claim:", {
        owner: updatedTerritory.owner?.toString(),
      });
    } catch (e) {
      console.log("Cannot claim this territory type:", e.message);
    }
  });

  itOnChain("Claims winnings", async () => {
    const chain = needChain();
    if (!chain) return;
    try {
      const tx = await chain.program.methods
        .claimWinnings()
        .accounts({
          game: chain.globalGamePda,
          player: chain.provider.wallet.publicKey,
        })
        .rpc();
      
      console.log("✅ Winnings claimed:", tx);
    } catch (e) {
      console.log("Could not claim winnings (likely not winner or no balance):", e.message);
    }
  });

  itOnChain("Resets the game for next test", async () => {
    const chain = needChain();
    if (!chain) return;
    const tx = await chain.program.methods
      .resetGame()
      .accounts({
        game: chain.globalGamePda,
        authority: chain.provider.wallet.publicKey,
      })
      .rpc();
    
    console.log("✅ Game reset:", tx);
    
    const gameState = await chain.program.account.pirateGame.fetch(chain.globalGamePda);
    console.log("Player count after reset:", gameState.playerCount);
  });
});
