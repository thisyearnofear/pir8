#!/bin/bash

# PIR8 Build and Deploy Script
set -e

echo "🏴‍☠️ PIR8 Build and Deploy Script"
echo "=================================="

# Step 1: Build the Anchor program
echo "📦 Building Anchor program..."
cd programs/pir8-game
cargo build --release
cd ../..

# Step 2: Generate IDL
echo "📝 Generating IDL..."
if [ -f "programs/pir8-game/target/idl/pir8_game.json" ]; then
    cp programs/pir8-game/target/idl/pir8_game.json public/idl/
    echo "✅ IDL copied to public folder"
else
    echo "⚠️  IDL not found, using placeholder"
fi

# Step 3: Type check
echo "🔍 Running type check..."
npm run type-check

# Step 4: Build frontend
echo "🏗️  Building frontend..."
npm run build

echo "✅ Build complete!"
echo ""
echo "Next steps:"
echo "1. Deploy to Solana devnet: anchor deploy --provider.cluster devnet"
echo "2. Update NEXT_PUBLIC_PROGRAM_ID in .env.local"
echo "3. Deploy frontend to Vercel"