import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { runAutonomousAgent } from '../../agents/pirate-bot';

/**
 * Launch an autonomous agent
 * 
 * NOTE: This is different from server-side user transactions.
 * Autonomous agents need their own keypairs to play as independent players.
 * This is legitimate because the agent owns its own wallet and pays its own fees.
 */
export async function launchAgent(_program: Program, _provider: AnchorProvider, gameId: string): Promise<any> {
  const gId = parseInt(gameId, 10);
  if (isNaN(gId)) {
    return { success: false, error: 'Invalid Game ID' };
  }

  // Agent needs its own keypair to play as an independent player
  const privateKeyRaw = process.env['SOLANA_PRIVATE_KEY'] || process.env['PAYER_SECRET_KEY'];
  if (!privateKeyRaw) {
    return { success: false, error: 'Agent keypair missing - autonomous agents need their own wallets' };
  }

  const pkArray = JSON.parse(privateKeyRaw);

  console.log(`🚀 Starting Autonomous Agent for Game Lobby ${gId}...`);

  // This starts the loop
  await runAutonomousAgent(gId, pkArray);

  return { success: true };
}
