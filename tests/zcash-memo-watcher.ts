import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { ZCASH_CONFIG, API_ENDPOINTS, GAME_CONFIG } from '../src/utils/constants';
import { ZcashMemoBridge } from '../src/lib/integrations';
import { getAnchorClient } from '../src/lib/server/anchorActions';
import { handleShieldedMemo } from '../src/cli/commands/game';

type Action = 'join' | 'create';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function postGame(action: Action, gameId: string, solanaPubkey: string) {
  const res = await fetch(`${baseUrl}${API_ENDPOINTS.GAME_STATE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, gameId, data: { player: { publicKey: solanaPubkey } } })
  });
  return res.ok;
}

function getArg(name: string) {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return undefined;
}

async function main() {
  const memoArg = getArg('--memo') || process.env.ZCASH_MEMO_TEST;
  if (!memoArg) {
    console.log('No memo provided. Use --memo or set ZCASH_MEMO_TEST');
    process.exit(1);
  }

  const bridge = new ZcashMemoBridge(async ({ gameId, solanaPubkey, amountZEC }) => {
    let onchain = false;
    try {
      const client = await getAnchorClient();
      const result = await handleShieldedMemo(client.program, client.provider, gameId);
      
      if (result.success) {
        onchain = true;
        const action = result.action as Action;
        const resultGameId = typeof result.gameId === 'number' ? `onchain_${result.gameId}` : result.gameId;
        console.log(JSON.stringify({ action, onchain, gameId: resultGameId, solanaPubkey, amountZEC }));
        return;
      }
    } catch (err) {
      console.error('On-chain error:', err instanceof Error ? err.message : String(err));
    }

    // Fallback to API route
    const action: Action = gameId && gameId.startsWith('onchain_') ? 'join' : 'create';
    const ok = await postGame(action, gameId, solanaPubkey);
    console.log(JSON.stringify({ action, ok, gameId, solanaPubkey, amountZEC }));
  });

  await bridge.handleIncomingShieldedMemo(memoArg);
}

main();
