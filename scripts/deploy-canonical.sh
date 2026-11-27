#!/usr/bin/env bash
# Deploy pir8-game to the CANONICAL devnet program ID.
#
# Why this exists: programs/pir8-game/target/deploy/pir8_game-keypair.json
# does NOT match the canonical program (2TZwkCc8ffz...). A bare
# `solana program deploy` / `anchor deploy` would publish to the keypair's
# address instead of upgrading the live program. Always pass --program-id.
set -euo pipefail

CANONICAL_PROGRAM_ID="2TZwkCc8ffz7NGWYF3koXyRm75DHq9VL9kvHxXZu8kLy"
SO="programs/pir8-game/target/deploy/pir8_game.so"
URL="${SOLANA_URL:-devnet}"

if [ ! -f "$SO" ]; then
  echo "Missing $SO — run: anchor build --no-idl -- --tools-version v1.58" >&2
  exit 1
fi

# Grow the program account first if the new binary is larger.
CURRENT_BYTES=$(solana program show "$CANONICAL_PROGRAM_ID" --url "$URL" 2>/dev/null | grep -oE "[0-9]+ bytes" | head -1 | grep -oE "[0-9]+" || echo 0)
SO_BYTES=$(wc -c < "$SO" | tr -d ' ')
if [ "$SO_BYTES" -gt "$CURRENT_BYTES" ]; then
  GROW=$((SO_BYTES - CURRENT_BYTES + 10000))
  echo "Extending program by $GROW bytes..."
  solana program extend "$CANONICAL_PROGRAM_ID" "$GROW" --url "$URL"
fi

solana program deploy "$SO" --program-id "$CANONICAL_PROGRAM_ID" --url "$URL"
