# 🚢 PIR8 Smart Contract Deployment Guide

## 🔐 **Security First: Private Key Setup**

### **Option A: Environment Variable (Recommended)**
1. **Create `.env.local`** (never commit to git):
```bash
# Copy from example
cp .env.local.example .env.local

# Add your private key as JSON array
SOLANA_PRIVATE_KEY=[1,2,3,4,5,6,7,8...64_numbers_total]
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

### **Option B: Keypair File (Alternative)**
```bash
# Use existing Solana CLI keypair
SOLANA_KEYPAIR_PATH=~/.config/solana/id.json
```

### **⚠️ Security Checklist:**
- ✅ `.env.local` is in `.gitignore` (already done)
- ✅ Never share or commit private keys
- ✅ Use devnet for testing only
- ✅ Backup your keypair securely

## 🛠️ **Deployment Steps**

### **1. Install Dependencies**
```bash
# Make sure you have Anchor CLI
anchor --version

# If not installed:
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### **2. Configure Solana CLI**
```bash
# Set to devnet
solana config set --url devnet

# Verify your wallet has SOL for deployment
solana balance

# If needed, airdrop some SOL for deployment
solana airdrop 2
```

### **3. Build Smart Contracts**
```bash
# Build the Anchor program
anchor build

# This generates:
# - target/deploy/pir8_game.so (program binary)
# - target/idl/pir8_game.json (interface definition)
```

### **4. Deploy to Devnet**
```bash
# Deploy the program
anchor deploy --provider.cluster devnet

# Expected output:
# Program Id: [NEW_PROGRAM_ID_HERE]
```

### **5. Update Frontend Configuration**
```bash
# Update your .env.local with the new program ID
NEXT_PUBLIC_PROGRAM_ID=[NEW_PROGRAM_ID_FROM_DEPLOYMENT]

# Rebuild frontend
npm run build
```

### **6. Initialize Game Configuration**
```bash
# Run initialization script (we'll create this next)
npm run init-game-config
```

## 🧪 **Testing Deployment**

### **Verify Smart Contract**
```bash
# Check program exists on devnet
solana program show [YOUR_PROGRAM_ID] --url devnet

# Test with Anchor
anchor test --provider.cluster devnet
```

### **Test Frontend Connection**
```bash
# Start development server
npm run dev

# Navigate to http://localhost:3000
# Try creating a game (should work on-chain now!)
```

## 🎯 **Post-Deployment Checklist**

- [ ] **Smart contract deployed** to devnet successfully
- [ ] **Program ID updated** in frontend environment
- [ ] **IDL generated** and accessible to frontend
- [ ] **Game creation works** end-to-end
- [ ] **Helius monitoring** detects transactions
- [ ] **Wallet connection** and moves work on-chain

## 🚨 **Troubleshooting**

### **Common Issues:**
```bash
# Issue: Insufficient funds
solana airdrop 2

# Issue: Program already deployed
anchor deploy --program-id [EXISTING_ID] --provider.cluster devnet

# Issue: IDL not found
anchor build && anchor deploy --provider.cluster devnet

# Issue: Network errors
solana config set --url devnet
```

### **Verification Commands:**
```bash
# Check Solana config
solana config get

# Check wallet balance
solana balance

# Check program deployment
solana program show [PROGRAM_ID]

# View recent transactions
solana transaction-history [YOUR_WALLET_ADDRESS]
```

## ⚡ **Next Steps After Successful Deployment**

1. **🧪 Test full game flow** - Create game, join, play, complete
2. **🔄 Update documentation** with live program ID
3. **🪙 Integrate Pump Fun** winner token creation
4. **✨ Add user delight features** per enhancement plan
5. **📹 Record demo video** for hackathon submission

---

**🏴‍☠️ Ready to launch PIR8 onto the Solana seas!** ⚡