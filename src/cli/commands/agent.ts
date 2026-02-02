import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { runAutonomousAgent } from '../../agents/pirate-bot';

/**
 * Launch an autonomous agent
 */
export async function launchAgent(_program: Program, _provider: AnchorProvider, gameId: string): Promise<any> {
  const gId = parseInt(gameId, 10);
  if (isNaN(gId)) {
    return { success: false, error: 'Invalid Game ID' };
  }

  const privateKeyRaw = process.env['SOLANA_PRIVATE_KEY'] || process.env['PAYER_SECRET_KEY'];
  if (!privateKeyRaw) {
    return { success: false, error: 'SOLANA_PRIVATE_KEY missing in .env' };
  }

  const pkArray = JSON.parse(privateKeyRaw);

  console.log(`🚀 Starting Autonomous Agent for Game Lobby ${gId}...`);
  
  // This starts the loop
  await runAutonomousAgent(gId, pkArray);

  return { success: true };
}
