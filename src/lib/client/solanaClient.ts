import { AnchorProvider, Program, Idl, BN } from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { SOLANA_CONFIG } from '@/utils/constants';
import { PROGRAM_ID } from '../anchor';
import { getGlobalGamePDA } from '../anchorUtils';

// Re-use the IDL from the server side or import it directly
import idl from '../../../target/idl/pir8_game.json';

export const getClientProgram = (wallet: any) => {
    const connection = new Connection(SOLANA_CONFIG.RPC_URL || 'https://api.devnet.solana.com', 'confirmed');
    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    return new Program(idl as Idl, new PublicKey(PROGRAM_ID), provider);
};

export const joinGameClient = async (wallet: any) => {
    if (!wallet) throw new Error("Wallet not connected");

    const program = getClientProgram(wallet);
    const [gamePDA] = getGlobalGamePDA(new PublicKey(PROGRAM_ID));

    console.log("Creating join transaction...");

    const tx = await program.methods
        .joinGame()
        .accountsStrict({
            game: gamePDA,
            player: wallet.publicKey,
            systemProgram: SystemProgram.programId,
        })
        .rpc();

    console.log("Joined game with tx:", tx);
    return tx;
};

export const initializeGameClient = async (wallet: any) => {
    if (!wallet) throw new Error("Wallet not connected");

    const program = getClientProgram(wallet);
    const [gamePDA] = getGlobalGamePDA(new PublicKey(PROGRAM_ID));

    const tx = await program.methods
        .initializeGame(new BN(Date.now()))
        .accounts({
            game: gamePDA,
            authority: wallet.publicKey,
            systemProgram: SystemProgram.programId,
        })
        .rpc();

    return tx;
};

export const startGameClient = async (wallet: any) => {
    if (!wallet) throw new Error("Wallet not connected");

    const program = getClientProgram(wallet);
    const [gamePDA] = getGlobalGamePDA(new PublicKey(PROGRAM_ID));

    const tx = await program.methods
        .startGame()
        .accounts({
            game: gamePDA,
            authority: wallet.publicKey,
        })
        .rpc();

    return tx;
};

export const moveShipClient = async (wallet: any, shipId: string, x: number, y: number, decisionTimeMs?: number) => {
    const program = getClientProgram(wallet);
    const [gamePDA] = getGlobalGamePDA(new PublicKey(PROGRAM_ID));

    const tx = await program.methods
        .moveShip(shipId, x, y)
        .accounts({
            game: gamePDA,
            player: wallet.publicKey,
        })
        .rpc();
    return tx;
};

export const attackShipClient = async (wallet: any, attackerId: string, targetId: string) => {
    const program = getClientProgram(wallet);
    const [gamePDA] = getGlobalGamePDA(new PublicKey(PROGRAM_ID));

    const tx = await program.methods
        .attackShip(attackerId, targetId)
        .accounts({
            game: gamePDA,
            player: wallet.publicKey,
        })
        .rpc();
    return tx;
};

export const claimTerritoryClient = async (wallet: any, x: number, y: number) => {
    const program = getClientProgram(wallet);
    const [gamePDA] = getGlobalGamePDA(new PublicKey(PROGRAM_ID));

    const tx = await program.methods
        .claimTerritory(x, y)
        .accounts({
            game: gamePDA,
            player: wallet.publicKey,
        })
        .rpc();
    return tx;
};

export const collectResourcesClient = async (wallet: any, x: number, y: number) => {
    const program = getClientProgram(wallet);
    const [gamePDA] = getGlobalGamePDA(new PublicKey(PROGRAM_ID));

    const tx = await program.methods
        .collectResources(x, y)
        .accounts({
            game: gamePDA,
            player: wallet.publicKey,
        })
        .rpc();
    return tx;
};

export const buildShipClient = async (wallet: any, shipType: string) => {
    const program = getClientProgram(wallet);
    const [gamePDA] = getGlobalGamePDA(new PublicKey(PROGRAM_ID));

    const tx = await program.methods
        .buildShip(shipType)
        .accounts({
            game: gamePDA,
            player: wallet.publicKey,
        })
        .rpc();
    return tx;
};
