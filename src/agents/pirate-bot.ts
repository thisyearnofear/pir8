/**
 * Sample Autonomous Pirate Agent
 *
 * Demonstrates how to use the PIR8AgentPlugin to play the game autonomously.
 * Following: MODULAR, CLEAN, PERFORMANT
 */

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { PIR8AgentPlugin } from "../lib/sdk/PIR8AgentPlugin";
import fs from "fs";
import path from "path";

function getResolvedProgramId(idl: { address?: unknown }): PublicKey {
  const idlAddress = typeof idl.address === "string" ? idl.address : null;
  const configuredAddress = process.env.NEXT_PUBLIC_PROGRAM_ID || null;

  if (idlAddress && configuredAddress && idlAddress !== configuredAddress) {
    throw new Error(
      `Program ID mismatch: NEXT_PUBLIC_PROGRAM_ID=${configuredAddress} but IDL address=${idlAddress}. Regenerate or replace the stale configuration so both point to the deployed PIR8 program.`,
    );
  }

  const resolvedAddress = idlAddress || configuredAddress;
  if (!resolvedAddress) {
    throw new Error("Program ID is missing from both NEXT_PUBLIC_PROGRAM_ID and public/idl/pir8_game.json");
  }

  return new PublicKey(resolvedAddress);
}

export async function runAutonomousAgent(
  gameId: number,
  privateKeyArray: number[],
) {
  const connection = new Connection(
    process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://api.devnet.solana.com",
    "confirmed",
  );
  const keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));

  // Create a simple wallet-like object for Anchor
  const wallet = {
    publicKey: keypair.publicKey,
    signTransaction: async (tx: any) => {
      tx.sign(keypair);
      return tx;
    },
    signAllTransactions: async (txs: any[]) => {
      txs.forEach((t) => t.sign(keypair));
      return txs;
    },
  };

  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });

  // Load IDL
  const idlPath = path.join(process.cwd(), "public/idl/pir8_game.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  const programId = getResolvedProgramId(idl);

  // Modern Anchor IDLs (0.30+) include an "address" field. Try the 2-arg
  // constructor first; fall back to explicit 3-arg if it fails.
  let program: Program;
  try {
    program = new (Program as any)(idl, provider) as Program;
  } catch {
    console.warn("[pir8] 2-arg Program constructor failed in pirate-bot, trying 3-arg");
    program = new (Program as any)(idl, programId, provider) as Program;
  }

  // Initialize Plugin
  const pir8Plugin = new PIR8AgentPlugin(program, connection);
  const tools = pir8Plugin.getTools();

  console.log(
    `🏴‍☠️ Agent "${keypair.publicKey.toBase58()}" entering the arena...`,
  );

  // 1. Register Agent (if not already done)
  try {
    const registerTool = tools.find((t) => t.name === "pir8_register_agent");
    if (registerTool) {
      console.log("📝 Registering identity...");
      await registerTool.execute({ name: "DreadBot", version: "1.0.0" });
    }
  } catch (e) {
    console.log("ℹ️ Agent already registered or registration skipped.");
  }

  // 2. Join Game
  const joinTool = tools.find((t) => t.name === "pir8_join_game")!;
  console.log(`🔗 Joining game lobby ${gameId}...`);
  await joinTool.execute({ gameId });

  // 3. Autonomous Loop
  console.log("🚀 Entering autonomous loop. Monitoring for turns...");

  const autoMoveTool = tools.find((t) => t.name === "pir8_auto_move")!;
  const getStatusTool = tools.find((t) => t.name === "pir8_get_status")!;

  while (true) {
    try {
      const statusRes = await getStatusTool.execute({ gameId });
      const state = statusRes.state;

      if (Object.keys(state.status)[0] === "Completed") {
        console.log("🏆 Battle concluded! Agent shutting down.");
        break;
      }

      const currentPlayer =
        state.players[state.currentPlayerIndex].pubkey.toBase58();
      const isMyTurn = currentPlayer === keypair.publicKey.toBase58();

      if (isMyTurn) {
        console.log("⚔️ It is my turn! Calculating strategic move...");
        const moveRes = await autoMoveTool.execute({ gameId });

        if (moveRes.success) {
          console.log(
            `✅ Action executed: ${moveRes.action} | Reason: ${moveRes.reason}`,
          );
          console.log(
            `🔗 Tx: https://solscan.io/tx/${moveRes.signature}?cluster=devnet`,
          );
        } else {
          console.log(`⚠️ Turn skipped: ${moveRes.message}`);
        }
      } else {
        process.stdout.write("."); // Waiting indicator
      }
    } catch (error) {
      console.error("❌ Loop Error:", error);
    }

    // Wait 5 seconds before next check (to respect RPC limits and game pace)
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
