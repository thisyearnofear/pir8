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

  // Test new API route
  try {
    const response = await fetch(`${baseUrl}/api/zcash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memo: memoArg,
        zcashTxHash: 'test-tx-hash',
        blockHeight: 12345,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ API route test successful:', result);
    } else {
      console.log('❌ API route test failed:', result.error);
    }
  } catch (error) {
    console.error('❌ API route test error:', error);
  }

  // Test direct bridge parsing
  const bridge = new ZcashMemoBridge(async (payload) => {
    console.log('📝 Memo parsed successfully:', {
      gameId: payload.gameId,
      action: payload.action,
      solanaPubkey: payload.solanaPubkey,
      zcashTx: payload.zcashTxHash,
    });
  });

  await bridge.handleIncomingShieldedMemo(memoArg, 'test-tx-hash', 12345);
}

main();
