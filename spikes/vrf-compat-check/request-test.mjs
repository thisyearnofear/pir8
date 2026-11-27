import anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import fs from "fs";

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

const walletPath = process.env.WALLET || process.env.HOME + "/.config/solana/id.json";
console.log("wallet:", walletPath);
const walletKeypair = anchor.web3.Keypair.fromSecretKey(
  Uint8Array.from(
    JSON.parse(fs.readFileSync(walletPath, "utf8"))
  )
);
const connection = new anchor.web3.Connection(
  "https://api.devnet.solana.com",
  "confirmed"
);
const wallet = new anchor.Wallet(walletKeypair);
const provider = new anchor.AnchorProvider(connection, wallet, {
  commitment: "confirmed",
});
anchor.setProvider(provider);
const program = new anchor.Program(IDL, provider);

const [playerPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("player"), walletKeypair.publicKey.toBytes()],
  PROGRAM_ID
);
console.log("player PDA:", playerPda.toBase58());

try {
  const tx = await program.methods.initialize().rpc({ skipPreflight: true });
  console.log("initialize tx:", tx);
} catch (e) {
  console.log("initialize (may already exist):", e.message.slice(0, 120));
}

const clientSeed = Math.floor(Math.random() * 256);
const seedTag = `client_seed=${clientSeed}`;
console.log("client seed:", clientSeed);

let resolveSig;
const sigPromise = new Promise((r) => (resolveSig = r));
const subId = connection.onLogs(
  PROGRAM_ID,
  (info) => {
    if (
      !info.err &&
      info.logs.some((l) => l.includes("CallbackRollDice")) &&
      info.logs.some((l) => l.includes(seedTag))
    ) {
      resolveSig(info.signature);
    }
  },
  "confirmed"
);

try {
  const method = process.argv[2] === "priority" ? "rollDicePriority" : "rollDice";
  const tx = await program.methods[method](clientSeed)
    .accounts({ oracleQueue: QUEUE })
    .rpc({ skipPreflight: true, commitment: "confirmed" });
  console.log("rollDice tx:", tx, "method:", process.argv[2] || "rollDice");
  // Callback updates player.last_result; poll until it changes (log-listener
  // can't match client_seed because the program doesn't log it).
  const before = (await program.account.player.fetch(playerPda)).lastResult;
  console.log("last_result before:", before);
  let after = before;
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5000));
    after = (await program.account.player.fetch(playerPda, "processed")).lastResult;
    console.log("poll last_result:", after);
    if (after !== before && after >= 1 && after <= 6) break;
  }
  if (after >= 1 && after <= 6 && after !== before) {
    console.log("VRF END-TO-END: SUCCESS, dice =", after);
  } else {
    console.log("TIMEOUT: callback did not update state within 90s");
    process.exitCode = 1;
  }
} finally {
  await connection.removeOnLogsListener(subId);
}
