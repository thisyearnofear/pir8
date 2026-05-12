#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROGRAM_NAME="pir8_game"
PROGRAM_SO="$ROOT_DIR/target/deploy/${PROGRAM_NAME}.so"
PROGRAM_KEYPAIR="$ROOT_DIR/target/deploy/${PROGRAM_NAME}-keypair.json"
TARGET_IDL="$ROOT_DIR/target/idl/${PROGRAM_NAME}.json"
PUBLIC_IDL_DIR="$ROOT_DIR/public/idl"
PUBLIC_IDL="$PUBLIC_IDL_DIR/${PROGRAM_NAME}.json"
ENV_LOCAL="$ROOT_DIR/.env.local"

PROGRAM_ID="$(node -e "const fs=require('fs'); const {Keypair}=require('@solana/web3.js'); const kp=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); console.log(Keypair.fromSecretKey(Uint8Array.from(kp)).publicKey.toBase58())" "$PROGRAM_KEYPAIR")"

echo "PIR8 canonical deploy"
echo "Program ID: $PROGRAM_ID"

echo "[1/6] Predeploy consistency check"
node "$ROOT_DIR/scripts/check-program-consistency.js"

echo "[2/6] Anchor build"
anchor build

echo "[3/6] Copy generated IDL to public artifacts"
mkdir -p "$PUBLIC_IDL_DIR"
cp "$TARGET_IDL" "$PUBLIC_IDL"

echo "[4/6] Deploy program with solana CLI (skipping on-chain IDL upload)"
solana program deploy "$PROGRAM_SO" \
  --program-id "$PROGRAM_KEYPAIR" \
  --url devnet

echo "[5/6] Verify deployed program account"
solana program show "$PROGRAM_ID" --url devnet

echo "[6/6] Refresh frontend env hint"
python3 - <<PY
from pathlib import Path
root = Path("$ROOT_DIR")
env_path = root / ".env.local"
program_id = "$PROGRAM_ID"
text = env_path.read_text()
lines = text.splitlines()
out = []
replaced = False
for line in lines:
    if line.startswith("NEXT_PUBLIC_PROGRAM_ID="):
        out.append(f"NEXT_PUBLIC_PROGRAM_ID={program_id}")
        replaced = True
    else:
        out.append(line)
if not replaced:
    out.append(f"NEXT_PUBLIC_PROGRAM_ID={program_id}")
env_path.write_text("\n".join(out) + "\n")
PY

echo "Done. Program deployed without Anchor IDL account publishing."
