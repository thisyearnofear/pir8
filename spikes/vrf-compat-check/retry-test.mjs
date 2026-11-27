import anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import fs from "fs";

// Retry-tolerant VRF fulfillment probe.
// Each attempt uses a fresh caller_seed; the program records the latest seed
// as pending and rejects stale callbacks, so attempts are safe to overlap.
// First fulfillment wins; attempts stop once last_result is set.

const IDL = JSON.parse(
  fs.readFileSync(
    new URL("./target/idl/vrf_compat_check.json", import.meta.url),
    "utf8"
  )
);
const PROGRAM_ID = new PublicKey(IDL.address);
const QUEUE = new PublicKey(
  process.env.VRF_QUEUE || "Cuj97ggrhhidhbu39TijNVqE74xvKJ69gDervRUXAxGh"
);

const walletPath =
  process.env.WALLET || process.env.HOME + "/.config/solana/id.json";
const walletKeypair = anchor.web3.Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf8")))
);
console.log("wallet:", walletPath, walletKeypair.publicKey.toBase58());

const connection = new anchor.web3.Connection(
  "https://api.devnet.solana.com",
  "confirmed"
);
const provider = new anchor.AnchorProvider(
  connection,
  new anchor.Wallet(walletKeypair),
  { commitment: "confirmed" }
);
anchor.setProvider(provider);
const program = new anchor.Program(IDL, provider);

const [playerPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("player"), walletKeypair.publicKey.toBytes()],
  PROGRAM_ID
);
console.log("player PDA:", playerPda.toBase58());

try {
  await program.methods.initialize().rpc({ skipPreflight: true });
  console.log("initialized");
} catch (e) {
  console.log("initialize skipped (exists):", String(e.message).slice(0, 80));
}

const MAX_ATTEMPTS = parseInt(process.env.ATTEMPTS || "5", 10);
const ATTEMPT_TIMEOUT_MS = parseInt(
  process.env.ATTEMPT_TIMEOUT_MS || "60000",
  10
);
const highPriority = process.argv[2] === "priority";

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  // Fresh seed per attempt (avoid 0 = \"no pending\" sentinel).
  const clientSeed = 1 + Math.floor(Math.random() * 255);
  // Reset observable state so this attempt's fulfillment is detectable.
  const cur = await program.account.player.fetch(playerPda);
  console.log(
    `attempt ${attempt}/${MAX_ATTEMPTS} seed=${clientSeed} ` +
      `(requests=${cur.requestCount} fulfilled=${cur.fulfilledCount} last=${cur.lastResult})`
  );
  const fulfilledBefore = Number(cur.fulfilledCount);
  const tx = await program.methods
    .requestRandomness(clientSeed, highPriority)
    .accounts({ oracleQueue: QUEUE })
    .rpc({ skipPreflight: true, commitment: "confirmed" });
  console.log(`  request tx: ${tx} (priority=${highPriority})`);

  const deadline = Date.now() + ATTEMPT_TIMEOUT_MS;
  let done = false;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5000));
    const state = await program.account.player.fetch(playerPda, "processed");
    if (Number(state.fulfilledCount) > fulfilledBefore) {
      console.log(
        `  FULFILLED on attempt ${attempt}: dice=${state.lastResult} tx-state(requests=${state.requestCount} fulfilled=${state.fulfilledCount})`
      );
      console.log("VRF RETRY END-TO-END: SUCCESS");
      process.exit(0);
    }
  }
  console.log(`  attempt ${attempt} timed out after ${ATTEMPT_TIMEOUT_MS}ms`);
}

console.log("VRF RETRY END-TO-END: TIMEOUT — no fulfillment observed");
console.log(
  "Next: local-oracle e2e to prove code path, + Telegram Q with request sigs."
);
process.exitCode = 1;
