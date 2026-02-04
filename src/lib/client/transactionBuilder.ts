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

// Helper function to create a wallet adapter compatible object from useWallet hook
export const createWalletAdapter = (wallet: any, publicKey?: any): WalletAdapter => {
    // Handle different wallet object structures
    const actualPublicKey = publicKey || wallet?.publicKey || wallet?.adapter?.publicKey;
    const signTransaction = wallet?.signTransaction || wallet?.adapter?.signTransaction;
    const signAllTransactions = wallet?.signAllTransactions || wallet?.adapter?.signAllTransactions;

    if (!actualPublicKey) {
        throw new Error("Wallet not connected - no public key found");
    }

    if (!signTransaction) {
        throw new Error("Wallet not connected - no signTransaction method found");
    }

    return {
        publicKey: actualPublicKey,
        signTransaction: signTransaction.bind(wallet?.adapter || wallet),
        signAllTransactions: signAllTransactions?.bind(wallet?.adapter || wallet),
    } as WalletAdapter;
};

// Helper function to get the correct game PDA that matches the Rust program
const getGamePDA = (gameId: number): [PublicKey, number] => {
    const gameIdBN = new BN(gameId);
    return PublicKey.findProgramAddressSync(
        [Buffer.from("pirate_game"), gameIdBN.toArrayLike(Buffer, 'le', 8)],
        PROGRAM_ID
    );
};

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

    // Use default devnet RPC for now since Helius is returning 403
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    console.log('Using devnet RPC connection');

    console.log('Creating provider with wallet:', wallet.publicKey.toString());
    const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
    });

    console.log('Loading IDL...');
    const idl = await getIdl();
    console.log('IDL loaded successfully');

    // Use the PROGRAM_ID that's already a PublicKey object
    console.log('Using program ID:', PROGRAM_ID.toString());
    console.log('Program ID type:', typeof PROGRAM_ID, PROGRAM_ID.constructor.name);

    const programIdString = "EeHyY2FQ3A4GLieZbGbmZtz1iLKzLytXkRcXyzGfmePt";
    const programIdFromString = new PublicKey(programIdString);
    
    try {
        // Try creating a fresh PublicKey from the string to see if that works
        console.log('Fresh PublicKey created successfully:', programIdFromString.toString());

        // Transform IDL to Anchor 0.28 format
        // Anchor 0.28 expects address under metadata, not top level
        const rawIdl = idl as any;
        const transformedIdl = {
            version: rawIdl.version,
            name: rawIdl.name,
            instructions: rawIdl.instructions,
            types: rawIdl.types,
            accounts: rawIdl.accounts || [],
            events: rawIdl.events || [],
            errors: rawIdl.errors || [],
            metadata: {
                ...rawIdl.metadata,
                address: programIdString
            }
        };
        
        console.log('Raw IDL types count:', rawIdl.types?.length);

        const program = new Program(transformedIdl as any, programIdFromString, provider);
        console.log('Program created successfully');
        return program;
    } catch (error) {
        console.error('Failed to create Program:', error);
        console.log('IDL structure:', Object.keys(idl));
        console.log('IDL version:', (idl as any).version);
        console.log('IDL name:', (idl as any).name);
        console.log('Provider details:', {
            connection: !!provider.connection,
            wallet: !!provider.wallet,
            publicKey: provider.wallet.publicKey?.toString()
        });

        // Try with a completely minimal IDL to test if it's an IDL issue
        console.log('Trying with minimal IDL...');
        // Anchor 0.28 expects address under metadata
        const minimalIdl = {
            version: "0.1.0",
            name: "pir8_game",
            instructions: [],
            accounts: [],
            types: [],
            metadata: {
                address: programIdString
            }
        };

        try {
            const testProgram = new Program(minimalIdl as any, programIdFromString, provider);
            console.log('Minimal IDL worked - issue is with the full IDL');
            throw new Error('IDL compatibility issue');
        } catch (minimalError) {
            console.log('Even minimal IDL failed:', minimalError);
            throw error;
        }
    }
};

// ============================================================================
// CLIENT-SIDE TRANSACTION BUILDERS
// ============================================================================

export const buildInitializeGameTx = async (
    wallet: WalletAdapter,
    gameId: number = Date.now(),
    mode: 'Casual' | 'Competitive' | 'AgentArena' = 'Casual'
): Promise<Transaction> => {
    const program = await getClientProgram(wallet);
    const [gamePDA] = getGamePDA(gameId);

    console.log('Building initialize game transaction:', {
        gameId,
        mode,
        gamePDA: gamePDA.toString(),
        authority: wallet.publicKey!.toString(),
        programId: program.programId.toString()
    });

    // Try multiple enum formats to find the one that works
    const enumFormats = [
        { [mode.toLowerCase()]: {} },  // { casual: {} }
        { [mode]: {} },                // { Casual: {} }
        mode,                          // "Casual"
        mode.toLowerCase()             // "casual"
    ];

    for (let i = 0; i < enumFormats.length; i++) {
        const gameMode = enumFormats[i];
        console.log(`Trying enum format ${i + 1}:`, gameMode);

        try {
            const tx = await (program as any).methods
                .createGame(new BN(gameId), gameMode)
                .accounts({
                    game: gamePDA,
                    authority: wallet.publicKey!,
                    systemProgram: SystemProgram.programId,
                })
                .transaction();

            console.log(`Success with enum format ${i + 1}:`, gameMode);
            return tx;
        } catch (error: any) {
            console.log(`Failed with enum format ${i + 1}:`, error.message);
            if (i === enumFormats.length - 1) {
                throw error; // Re-throw the last error if all formats fail
            }
        }
    }

    throw new Error('All enum formats failed');
};

export const buildJoinGameTx = async (
    wallet: WalletAdapter,
    gameId: number = Date.now(),
): Promise<Transaction> => {
    const program = await getClientProgram(wallet);
    const [gamePDA] = getGamePDA(gameId);

    return await (program as any).methods
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
    gameId: number = Date.now(),
): Promise<Transaction> => {
    const program = await getClientProgram(wallet);
    const [gamePDA] = getGamePDA(gameId);

    return await (program as any).methods
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

    return await (program as any).methods
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

    return await (program as any).methods
        .attackShip(attackerShipId, targetShipId)
        .accounts({
            game: gamePDA,
            player: wallet.publicKey!,
        })
        .transaction();
};

export const buildClaimTerritoryTx = async (
    wallet: WalletAdapter,
    shipId: string,
): Promise<Transaction> => {
    const program = await getClientProgram(wallet);
    const [gamePDA] = getGlobalGamePDA(PROGRAM_ID);

    return await (program as any).methods
        .claimTerritory(shipId)
        .accounts({
            game: gamePDA,
            player: wallet.publicKey!,
        })
        .transaction();
};

export const buildCollectResourcesTx = async (
    wallet: WalletAdapter,
): Promise<Transaction> => {
    const program = await getClientProgram(wallet);
    const [gamePDA] = getGlobalGamePDA(PROGRAM_ID);

    return await (program as any).methods
        .collectResources()
        .accounts({
            game: gamePDA,
            player: wallet.publicKey!,
        })
        .transaction();
};

export const buildBuildShipTx = async (
    wallet: WalletAdapter,
    shipType: 'sloop' | 'frigate' | 'galleon' | 'flagship',
    portX: number,
    portY: number,
): Promise<Transaction> => {
    const program = await getClientProgram(wallet);
    const [gamePDA] = getGlobalGamePDA(PROGRAM_ID);

    // Convert shipType to the format expected by the program
    const shipTypeEnum = { [shipType]: {} };

    return await (program as any).methods
        .buildShip(shipTypeEnum, portX, portY)
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

    // Try Helius first, fallback to default devnet RPC
    let connection;
    try {
        connection = new Connection(
            SOLANA_CONFIG.RPC_URL || "https://api.devnet.solana.com",
            "confirmed",
        );
    } catch (rpcError) {
        console.warn("Failed to connect to Helius, using default devnet RPC");
        connection = new Connection("https://api.devnet.solana.com", "confirmed");
    }

    try {
        // Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        (transaction as any).recentBlockhash = blockhash;
        (transaction as any).feePayer = wallet.publicKey;

        console.log('Transaction before signing:', {
            feePayer: (transaction as any).feePayer?.toString(),
            recentBlockhash: (transaction as any).recentBlockhash,
            instructions: (transaction as any).instructions?.length || 0
        });

        // Sign transaction with user's wallet
        const signedTx = await wallet.signTransaction!(transaction);

        console.log('Transaction signed successfully');

        // Send the serialized transaction (already signed by wallet)
        const rawTransaction = signedTx.serialize();
        const signature = await (connection as any).sendRawTransaction(rawTransaction);

        console.log('Transaction sent:', signature);

        // Confirm with block height for better reliability
        await connection.confirmTransaction(signature, "confirmed");

        console.log('Transaction confirmed:', signature);
        return signature;
    } catch (error) {
        console.error('Transaction execution failed:', error);
        throw error;
    }
};

export const testProgramConnection = async (wallet: WalletAdapter): Promise<boolean> => {
    try {
        console.log('Testing program connection...');
        console.log('Program ID:', PROGRAM_ID.toString());
        console.log('Environment PROGRAM_ID:', process.env.NEXT_PUBLIC_PROGRAM_ID);

        const program = await getClientProgram(wallet);
        console.log('Program loaded successfully:', program.programId.toString());

        // Try to get the program account info
        const connection = new Connection(
            SOLANA_CONFIG.RPC_URL || "https://api.devnet.solana.com",
            "confirmed",
        );
        const programInfo = await connection.getAccountInfo(program.programId);
        console.log('Program account info:', {
            exists: !!programInfo,
            executable: programInfo?.executable,
            owner: programInfo?.owner?.toString(),
            dataLength: programInfo?.data?.length
        });

        if (!programInfo) {
            console.error('Program account not found on-chain. Check if program is deployed.');
            return false;
        }

        if (!programInfo.executable) {
            console.error('Program account exists but is not executable.');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Program connection test failed:', error);
        return false;
    }
};

export const initializeGame = async (
    wallet: WalletAdapter,
    gameId?: number,
    mode?: 'Casual' | 'Competitive' | 'AgentArena'
): Promise<string> => {
    try {
        const tx = await buildInitializeGameTx(wallet, gameId, mode);
        return await executeTransaction(wallet, tx);
    } catch (error) {
        console.error('Failed to initialize game:', error);
        throw new Error(`Failed to initialize game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const joinGame = async (
    wallet: WalletAdapter,
    gameId?: number
): Promise<string> => {
    try {
        const tx = await buildJoinGameTx(wallet, gameId);
        return await executeTransaction(wallet, tx);
    } catch (error) {
        console.error('Failed to join game:', error);
        throw new Error(`Failed to join game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const startGame = async (
    wallet: WalletAdapter,
    gameId?: number
): Promise<string> => {
    try {
        const tx = await buildStartGameTx(wallet, gameId);
        return await executeTransaction(wallet, tx);
    } catch (error) {
        console.error('Failed to start game:', error);
        throw new Error(`Failed to start game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    shipId: string,
): Promise<string> => {
    const tx = await buildClaimTerritoryTx(wallet, shipId);
    return await executeTransaction(wallet, tx);
};

export const collectResources = async (
    wallet: WalletAdapter,
): Promise<string> => {
    const tx = await buildCollectResourcesTx(wallet);
    return await executeTransaction(wallet, tx);
};

export const buildShip = async (
    wallet: WalletAdapter,
    shipType: 'sloop' | 'frigate' | 'galleon' | 'flagship',
    portX: number,
    portY: number,
): Promise<string> => {
    const tx = await buildBuildShipTx(wallet, shipType, portX, portY);
    return await executeTransaction(wallet, tx);
};

// ============================================================================
// ADDITIONAL GAME FUNCTIONS (for compatibility with existing game state)
// ============================================================================

export const endTurn = async (wallet: WalletAdapter): Promise<string> => {
    const program = await getClientProgram(wallet);
    const [gamePDA] = getGlobalGamePDA(PROGRAM_ID);

    const tx = await (program as any).methods
        .endTurn()
        .accounts({
            game: gamePDA,
            player: wallet.publicKey!,
        })
        .transaction();

    return await executeTransaction(wallet, tx);
};

export const scanCoordinate = async (
    wallet: WalletAdapter,
    x: number,
    y: number,
): Promise<string> => {
    const program = await getClientProgram(wallet);
    const [gamePDA] = getGlobalGamePDA(PROGRAM_ID);

    const tx = await (program as any).methods
        .scanCoordinate(x, y)
        .accounts({
            game: gamePDA,
            player: wallet.publicKey!,
        })
        .transaction();

    return await executeTransaction(wallet, tx);
};

// ============================================================================
// READ-ONLY FUNCTIONS (for fetching game state)
// ============================================================================

export const fetchGameState = async (wallet: WalletAdapter): Promise<any> => {
    const program = await getClientProgram(wallet);
    const [gamePDA] = getGlobalGamePDA(PROGRAM_ID);

    try {
        const gameState = await (program as any).account.pirateGame.fetch(gamePDA);
        return gameState;
    } catch (error) {
        console.log('Game not initialized yet');
        return null;
    }
};

export const fetchLobbies = async (wallet: WalletAdapter): Promise<any[]> => {
    try {
        const program = await getClientProgram(wallet);
        const games = await (program as any).account.pirateGame.all();
        return games;
    } catch (e) {
        console.warn('Error fetching lobbies:', e);
        return [];
    }
};