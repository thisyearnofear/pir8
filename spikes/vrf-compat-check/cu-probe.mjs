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
const walletPath =
  process.env.WALLET || process.env.HOME + "/.config/solana/id.json";
const walletKeypair = anchor.web3.Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf8")))
);
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

// Seed pending state first so the probe takes the success path.
const state = await program.account.player.fetch(playerPda).catch(() => null);
if (!state || state.pendingSeed === 0) {
  console.log("no pending seed on this wallet; requesting one first...");
  const seed = 1 + Math.floor(Math.random() * 255);
  const tx = await program.methods
    .requestRandomness(seed, false)
    .accounts({ oracleQueue: new PublicKey(process.env.VRF_QUEUE || "Cuj97ggrhhidhbu39TijNVqE74xvKJ69gDervRUXAxGh") })
    .rpc({ skipPreflight: true });
  console.log("request tx:", tx, "seed:", seed);
}

const cur = await program.account.player.fetch(playerPda);
console.log("pending seed:", cur.pendingSeed);
const sim = await program.methods
  .debugSettleDemo(Array.from({ length: 32 }, (_, i) => i), cur.pendingSeed)
  .accounts({ player: playerPda })
  .simulate();
console.log("simulate raw:", JSON.stringify(sim, null, 1).slice(0, 1500));
