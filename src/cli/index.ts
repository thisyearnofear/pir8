#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { getAnchorClient } from '../lib/server/anchorActions';
import { createGame, joinGame, handleShieldedMemo, GameCommandResult } from './commands/game';
import { monitorHelius, HeliusMonitorResult } from './commands/monitoring';
import { createWinnerToken, TokenCreateResult } from './commands/token';
import { SOLANA_CONFIG } from '../utils/constants';

interface CliArgs {
  command?: string;
  positional: string[];
  memo?: string;
  gameId?: string;
  help?: boolean;
}

function parseArgs(): CliArgs {
  const args: CliArgs = { positional: [] };
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--memo' && argv[i + 1]) {
      args.memo = argv[i + 1];
      i++;
    } else if (arg === '--game-id' && argv[i + 1]) {
      args.gameId = argv[i + 1];
      i++;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (!arg.startsWith('--')) {
      if (!args.command) {
        args.command = arg;
      } else {
        args.positional.push(arg);
      }
    }
  }

  return args;
}

function printHelp() {
  console.log(`
PIR8 Game CLI

Usage: pir8-cli <command> [options]

Commands:
  Game Operations:
    init              Initialize game config (required before create/join)
    create            Create a new game on-chain
    join <gameId>     Join an existing game (gameId format: number or onchain_<number>)
    memo              Handle Zcash shielded memo (requires --memo flag)

  Monitoring & Tokens:
    monitor           Monitor Helius for treasury transactions
    token <gameId>    Create winner token for game

Options:
  --memo <json>     Zcash memo JSON (e.g., '{"v":"1","gameId":"demo_game",...}')
  --game-id <id>    Game ID for join command
  --help, -h        Show this help message

Examples:
  pir8-cli init
  pir8-cli create
  pir8-cli join 0
  pir8-cli memo --memo '{"v":"1","gameId":"demo_game","solanaPubkey":"...","amountZEC":0.1}'
  pir8-cli monitor
  pir8-cli token 0
`);
}

async function main() {
  const args = parseArgs();

  if (args.help || !args.command) {
    printHelp();
    process.exit(0);
  }

  try {
    let result: GameCommandResult | HeliusMonitorResult | TokenCreateResult;

    switch (args.command) {
      case 'create': {
        const { program, provider } = await getAnchorClient();
        result = await createGame(program, provider);
        break;
      }

      case 'join': {
        const { program, provider } = await getAnchorClient();
        const gameId = args.gameId || args.positional[0];
        if (!gameId) {
          console.error('Error: join requires a game ID (PublicKey address)');
          console.log('Usage: pir8-cli join <gameAddress>');
          process.exit(1);
        }
        // Handle onchain_ prefix or raw address
        const gameAddress = gameId.startsWith('onchain_') 
          ? gameId.replace('onchain_', '') 
          : gameId;
        result = await joinGame(program, provider, gameAddress);
        break;
      }

      case 'memo': {
        if (!args.memo) {
          console.error('Error: memo command requires --memo flag');
          console.log('Example: pir8-cli memo --memo \'{"v":"1","gameId":"pirate_7","action":"join","solanaPubkey":"...","timestamp":1234567890000}\'');
          process.exit(1);
        }
        try {
          console.log('Parsing memo data:', args.memo);
          const memoData = JSON.parse(args.memo);

          // Validate required fields
          if (!memoData.gameId || !memoData.solanaPubkey) {
            console.error('Error: memo JSON must contain "gameId" and "solanaPubkey" fields');
            process.exit(1);
          }

          const { program, provider } = await getAnchorClient();
          result = await handleShieldedMemo(program, provider, memoData.gameId);
          // Add Zcash-specific fields to result
          result = { ...result, ...memoData };
        } catch (e) {
          console.error('Error: invalid memo JSON');
          console.error('Details:', e instanceof Error ? e.message : String(e));
          console.log('Please ensure your JSON is properly escaped and formatted');
          process.exit(1);
        }
        break;
      }

      case 'monitor': {
        const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
        const treasury = process.env.NEXT_PUBLIC_TREASURY_ADDRESS;
        if (!apiKey || !treasury) {
          console.error('Error: NEXT_PUBLIC_HELIUS_API_KEY and NEXT_PUBLIC_TREASURY_ADDRESS required');
          process.exit(1);
        }
        result = await monitorHelius(apiKey, treasury);
        break;
      }

      case 'token': {
        const gameId = args.positional[0];
        if (!gameId) {
          console.error('Error: token command requires a game ID');
          process.exit(1);
        }
        const gidNum = parseInt(gameId, 10);
        if (isNaN(gidNum)) {
          console.error('Error: invalid game ID');
          process.exit(1);
        }
        // TODO: Get winner pubkey from game state
        result = await createWinnerToken(gidNum, 'WINNER_PUBKEY');
        break;
      }

      default:
        console.error(`Unknown command: ${args.command}`);
        printHelp();
        process.exit(1);
    }

    // Output result as JSON for scripting and logging
    console.log(JSON.stringify(result, null, 2));

    // Exit with error code if failed
    if (!result.success) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
