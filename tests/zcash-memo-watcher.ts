import { ZCASH_CONFIG, API_ENDPOINTS } from '../src/utils/constants';
import { ZcashMemoBridge } from '../src/lib/integrations';

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
    const action: Action = gameId && gameId.startsWith('onchain_') ? 'join' : 'create';
    const ok = await postGame(action, gameId, solanaPubkey);
    console.log(JSON.stringify({ action, ok, gameId, solanaPubkey, amountZEC }));
  });

  await bridge.handleIncomingShieldedMemo(memoArg);
}

main();
