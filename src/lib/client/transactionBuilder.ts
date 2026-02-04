/**
 * Client-side transaction builder for PIR8 game
 * 
 * This is the CORRECT Web3 architecture:
 * - Users sign their own transactions
 * - Users pay their own gas fees
 * - Server only reads blockchain state
 */

import { AnchorProvider, Program, Idl, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { SOLANA_CONFIG } from "@/utils/constants";
import { getGlobalGamePDA } from "../anchorUtils";
import { PROGRAM_ID } from "../anchor";
import type { WalletAdapter } from "@coral-xyz/anchor";

// Import IDL - we'll need to generate this after building the contract
let cachedIdl: Idl | null = null;

async function getIdl(): Promise<Idl> {
    if (cachedIdl) return cachedIdl;

    try {
        // Try to load from public folder first
        const response = await fetch("/idl/pir8_game.json");
        if (response.ok) {
            cachedIdl = await response.json();
            return cachedIdl!;
        }
    } catch (error) {
        console.warn("Could not load IDL from public folder");
    }

    throw new Error("Could not load program IDL. Make sure the program is deployed.");
}

export const getClientProgram = async (
    wallet: WalletAdapter,
): Promise<Program> => {
    if (!wallet.publicKey) {
        throw new Error("Wallet not connected");
    }

    const connection = new Connection(
        SOLANA_CONFIG.RPC_URL || "https://api.devnet.solana.com",
        "confirmed",
    );
    const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
    });
    const idl = await getIdl();
    const programId = new PublicKey(SOLANA_CONFIG.PROGRAM_ID!);

    return new Program(idl, programId, provider);
};

// ============================================================================
// CLIENT-SIDE TRANSACTION BUILDERS
// ============================================================================

export const buildInitializeGameTx = async (
    wallet: WalletAdapter,
): Promise<Transaction> => {
    const program = await getClientProgram(wallet);
    const [gamePDA] = getGlobalGamePDA(PROGRAM_ID);

    return await program.methods
        .initializeGame(new BN(Date.now()))
        .accounts({
            game: gamePDA,
            authority: wallet.publicKey!,
            systemProgram: SystemProgram.programId,
        })
        .transaction();
};

export const buildJoinGameTx = async (
    wallet: WalletAdapter,
): Promise<Transaction> => {
    const program = await getClientProgram(wallet);
    const [gamePDA] = getGlobalGamePDA(PROGRAM_ID);

    return await program.methods
        .joinGame()
        .accounts({
            game: gamePDA,
            player: wallet.publicKey!,
            systemProgram: SystemProgram.programId,
        })
        .transaction();
};

export const buildStartGameTx = async (
    wallet: WalletAdapter,
): Promise<Transaction> => {
    const program = await getClientProgram(wallet);
    const [gamePDA] = getGlobalGamePDA(PROGRAM_ID);

    return await program.methods
        .startGame()
        .accounts({
            game: gamePDA,
            authority: wallet.publicKey!,
        })
        .transaction();
};

export const buildMoveShipTx = async (
    wallet: WalletAdapter,
    shipId: string,
    toX: number,
    toY: number,
): Promise<Transaction> => {
    const program = await getClientProgram(wallet);
    const [gamePDA] = getGlobalGamePDA(PROGRAM_ID);

    return await program.methods
        .moveShip(shipId, toX, toY)
        .accounts({
            game: gamePDA,
            player: wallet.publicKey!,
        })
        .transaction();
};

export const buildAttackShipTx = async (
    wallet: WalletAdapter,
    attackerShipId: string,
    targetShipId: string,
): Promise<Transaction> => {
    const program = await getClientProgram(wallet);
    const [gamePDA] = getGlobalGamePDA(PROGRAM_ID);

    return await program.methods
        .attackShip(attackerShipId, targetShipId)
        .accounts({
            game: gamePDA,
            player: wallet.publicKey!,
        })
        .transaction();
};

export const buildClaimTerritoryTx = async (
    wallet: WalletAdapter,
    x: number,
    y: number,
): Promise<Transaction> => {
    const program = await getClientProgram(wallet);
    const [gamePDA] = getGlobalGamePDA(PROGRAM_ID);

    return await program.methods
        .claimTerritory(x, y)
        .accounts({
            game: gamePDA,
            player: wallet.publicKey!,
        })
        .transaction();
};

export const buildCollectResourcesTx = async (
    wallet: WalletAdapter,
    x: number,
    y: number,
): Promise<Transaction> => {
    const program = await getClientProgram(wallet);
    const [gamePDA] = getGlobalGamePDA(PROGRAM_ID);

    return await program.methods
        .collectResources(x, y)
        .accounts({
            game: gamePDA,
            player: wallet.publicKey!,
        })
        .transaction();
};

export const buildBuildShipTx = async (
    wallet: WalletAdapter,
    shipType: 'sloop' | 'frigate' | 'galleon' | 'flagship',
): Promise<Transaction> => {
    const program = await getClientProgram(wallet);
    const [gamePDA] = getGlobalGamePDA(PROGRAM_ID);

    return await program.methods
        .buildShip(shipType)
        .accounts({
            game: gamePDA,
            player: wallet.publicKey!,
        })
        .transaction();
};

// ============================================================================
// TRANSACTION EXECUTION HELPERS
// ============================================================================

export const executeTransaction = async (
    wallet: WalletAdapter,
    transaction: Transaction,
): Promise<string> => {
    if (!wallet.publicKey) {
        throw new Error("Wallet not connected");
    }

    const connection = new Connection(
        SOLANA_CONFIG.RPC_URL || "https://api.devnet.solana.com",
        "confirmed",
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Sign transaction with user's wallet
    const signedTx = await wallet.signTransaction!(transaction);

    // Send and confirm transaction
    const signature = await connection.sendRawTransaction(signedTx.serialize());
    await connection.confirmTransaction(signature, "confirmed");

    return signature;
};

// ============================================================================
// HIGH-LEVEL GAME ACTIONS (Client-side)
// ============================================================================

export const initializeGame = async (wallet: WalletAdapter): Promise<string> => {
    const tx = await buildInitializeGameTx(wallet);
    return await executeTransaction(wallet, tx);
};

export const joinGame = async (wallet: WalletAdapter): Promise<string> => {
    const tx = await buildJoinGameTx(wallet);
    return await executeTransaction(wallet, tx);
};

export const startGame = async (wallet: WalletAdapter): Promise<string> => {
    const tx = await buildStartGameTx(wallet);
    return await executeTransaction(wallet, tx);
};

export const moveShip = async (
    wallet: WalletAdapter,
    shipId: string,
    toX: number,
    toY: number,
): Promise<string> => {
    const tx = await buildMoveShipTx(wallet, shipId, toX, toY);
    return await executeTransaction(wallet, tx);
};

export const attackShip = async (
    wallet: WalletAdapter,
    attackerShipId: string,
    targetShipId: string,
): Promise<string> => {
    const tx = await buildAttackShipTx(wallet, attackerShipId, targetShipId);
    return await executeTransaction(wallet, tx);
};

export const claimTerritory = async (
    wallet: WalletAdapter,
    x: number,
    y: number,
): Promise<string> => {
    const tx = await buildClaimTerritoryTx(wallet, x, y);
    return await executeTransaction(wallet, tx);
};

export const collectResources = async (
    wallet: WalletAdapter,
    x: number,
    y: number,
): Promise<string> => {
    const tx = await buildCollectResourcesTx(wallet, x, y);
    return await executeTransaction(wallet, tx);
};

export const buildShip = async (
    wallet: WalletAdapter,
    shipType: 'sloop' | 'frigate' | 'galleon' | 'flagship',
): Promise<string> => {
    const tx = await buildBuildShipTx(wallet, shipType);
    return await executeTransaction(wallet, tx);
};