import anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import fs from "fs";

const IDL = JSON.parse(
  fs.readFileSync(new URL("../public/idl/pir8_game.json", import.meta.url), "utf8")
);
const PROGRAM_ID = new PublicKey(IDL.address);
const QUEUE = new PublicKey(
  process.env.VRF_QUEUE || "Cuj97ggrhhidhbu39TijNVqE74xvKJ69gDervRUXAxGh"
);
const wallet = anchor.web3.Keypair.fromSecretKey(
  Uint8Array.from(
    JSON.parse(
      fs.readFileSync(
        process.env.WALLET || process.env.HOME + "/.config/solana/id.json",
        "utf8"
      )
    )
  )
);
const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(wallet), {
  commitment: "confirmed",
});
anchor.setProvider(provider);
const program = new anchor.Program(IDL, provider);

const gameId = new anchor.BN(Date.now() % 1_000_000_000);
const [gamePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("pirate_game"), gameId.toArrayLike(Buffer, "le", 8)],
  PROGRAM_ID
);
const [weatherPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("weather"), gamePda.toBytes()],
  PROGRAM_ID
);
console.log("game:", gamePda.toBase58(), "id:", gameId.toString());

await program.methods
  .createGame(gameId, { casual: {} })
  .accounts({
    game: gamePda,
    authority: wallet.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .rpc({ skipPreflight: true });
console.log("game created");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ATTEMPTS = parseInt(process.env.ATTEMPTS || "4", 10);
const WAIT_S = parseInt(process.env.WAIT_S || "70", 10);

for (let a = 0; a < ATTEMPTS; a++) {
  const seed = 1 + Math.floor(Math.random() * 255);
  // Anchor method name is camelCased by the client: requestWeatherRandomness
  const tx = await program.methods
    .requestWeatherRandomness(seed, false)
    .accounts({
      game: gamePda,
      weather: weatherPda,
      authority: wallet.publicKey,
      oracleQueue: QUEUE,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc({ skipPreflight: true });
  console.log(`attempt ${a + 1}: seed=${seed} tx=${tx}`);
  console.log(`  https://explorer.solana.com/tx/${tx}?cluster=devnet`);

  for (let s = 0; s < WAIT_S; s += 5) {
    await sleep(5000);
    try {
      const w = await program.account.weatherState.fetch(weatherPda);
      if (w.fulfilledCount.toNumber() > 0) {
        const g = await program.account.pirateGame.fetch(gamePda);
        console.log("FULFILLED:", JSON.stringify({
          weather: g.weatherType, duration: g.weatherDuration,
          requests: w.requestCount, fulfilled: w.fulfilledCount,
        }));
        process.exit(0);
      }
    } catch { /* PDA not yet created */ }
  }
  const w = await program.account.weatherState.fetch(weatherPda).catch(() => null);
  console.log(`  still pending (requests=${w ? w.requestCount : "?"})`);
}
console.log("no fulfillment within window — retry state advanced, oracle silent");
const w = await program.account.weatherState.fetch(weatherPda).catch(() => null);
console.log("final weather state:", w ? `requests=${w.requestCount} fulfilled=${w.fulfilledCount} pending=${w.pendingSeed}` : "none");
