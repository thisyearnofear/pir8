/**
 * Raw transaction builder using solana/web3.js directly
 * Bypasses Anchor IDL serialization issues
 */

import { 
    Connection, 
    PublicKey, 
    SystemProgram, 
    Transaction, 
    TransactionInstruction,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { SOLANA_CONFIG } from "@/utils/constants";
import { PROGRAM_ID } from "../anchor";
import type { WalletAdapter } from "@coral-xyz/anchor";

// GameMode enum values matching Rust definition
const GAME_MODE_VALUES = {
    Casual: 0,
    Competitive: 1,
    AgentArena: 2
} as const;

// Helper to serialize u64 as little-endian 8 bytes
const serializeU64 = (value: number | BN): Uint8Array => {
    const bn = value instanceof BN ? value : new BN(value);
    return new Uint8Array(bn.toArrayLike(Buffer, 'le', 8));
};

// Helper to serialize u8
const serializeU8 = (value: number): Uint8Array => {
    return new Uint8Array([value]);
};

// Get game PDA
const getGamePDA = (gameId: number): [PublicKey, number] => {
    const gameIdBN = new BN(gameId);
    return PublicKey.findProgramAddressSync(
        [Buffer.from("pirate_game"), gameIdBN.toArrayLike(Buffer, 'le', 8)],
        PROGRAM_ID
    );
};

// Build raw createGame instruction
export const buildRawCreateGameTx = async (
    wallet: WalletAdapter,
    gameId: number,
    mode: 'Casual' | 'Competitive' | 'AgentArena' = 'Casual'
): Promise<Transaction> => {
    if (!wallet.publicKey) {
        throw new Error("Wallet not connected");
    }

    const [gamePDA] = getGamePDA(gameId);
    
    // Build instruction data manually
    // Anchor instruction layout: [discriminator (8)] + [args...]
    // createGame args: gameId (u64), mode (enum u8)
    
    // createGame discriminator: sha256("global:createGame")[:8]
    const discriminator = new Uint8Array([178, 185, 167, 97, 39, 32, 141, 39]);
    
    const gameIdBytes = serializeU64(gameId);
    const modeBytes = serializeU8(GAME_MODE_VALUES[mode]);
    
    // Concatenate all bytes
    const data = new Uint8Array(discriminator.length + gameIdBytes.length + modeBytes.length);
    data.set(discriminator, 0);
    data.set(gameIdBytes, discriminator.length);
    data.set(modeBytes, discriminator.length + gameIdBytes.length);

    const instruction = new TransactionInstruction({
        keys: [
            { pubkey: gamePDA, isSigner: false, isWritable: true },
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.from(data) as any
    });

    const transaction = new Transaction().add(instruction);
    
    // Get recent blockhash
    const connection = new Connection(
        SOLANA_CONFIG.RPC_URL || "https://api.devnet.solana.com",
        "confirmed"
    );
    const { blockhash } = await connection.getLatestBlockhash();
    (transaction as any).recentBlockhash = blockhash;
    (transaction as any).feePayer = wallet.publicKey;

    return transaction;
};

// Build raw joinGame instruction
export const buildRawJoinGameTx = async (
    wallet: WalletAdapter,
    gameId: number
): Promise<Transaction> => {
    if (!wallet.publicKey) {
        throw new Error("Wallet not connected");
    }

    const [gamePDA] = getGamePDA(gameId);
    
    // joinGame discriminator: sha256("global:joinGame")[:8]
    const discriminator = new Uint8Array([103, 188, 6, 52, 209, 229, 112, 184]);
    
    const instruction = new TransactionInstruction({
        keys: [
            { pubkey: gamePDA, isSigner: false, isWritable: true },
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.from(discriminator) as any
    });

    const transaction = new Transaction().add(instruction);
    
    const connection = new Connection(
        SOLANA_CONFIG.RPC_URL || "https://api.devnet.solana.com",
        "confirmed"
    );
    const { blockhash } = await connection.getLatestBlockhash();
    (transaction as any).recentBlockhash = blockhash;
    (transaction as any).feePayer = wallet.publicKey;

    return transaction;
};

// Execute raw transaction
export const executeRawTransaction = async (
    wallet: WalletAdapter,
    transaction: Transaction
): Promise<string> => {
    if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error("Wallet not connected");
    }

    const connection = new Connection(
        SOLANA_CONFIG.RPC_URL || "https://api.devnet.solana.com",
        "confirmed"
    );

    const signedTx = await wallet.signTransaction(transaction);
    const signature = await connection.sendTransaction(signedTx);
    await connection.confirmTransaction(signature, "confirmed");
    
    return signature;
};

// Convenience function
export const createGameRaw = async (
    wallet: WalletAdapter,
    gameId?: number,
    mode?: 'Casual' | 'Competitive' | 'AgentArena'
): Promise<string> => {
    const id = gameId || Date.now();
    const tx = await buildRawCreateGameTx(wallet, id, mode);
    return executeRawTransaction(wallet, tx);
};

export const joinGameRaw = async (
    wallet: WalletAdapter,
    gameId?: number
): Promise<string> => {
    const id = gameId || Date.now();
    const tx = await buildRawJoinGameTx(wallet, id);
    return executeRawTransaction(wallet, tx);
};
