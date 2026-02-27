import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export const getGamePDA = (gameId: number | BN, programId: PublicKey): [PublicKey, number] => {
    const idBuffer = typeof gameId === 'number' 
        ? new BN(gameId).toArrayLike(Buffer, 'le', 8)
        : gameId.toArrayLike(Buffer, 'le', 8);

    return PublicKey.findProgramAddressSync(
        [Buffer.from("pirate_game"), idBuffer],
        programId
    );
};

// Deprecated: kept for backward compatibility if needed during migration
export const getGlobalGamePDA = (programId: PublicKey): [PublicKey, number] => {
    // NOTE: The program uses pirate_game + game_id. 
    // This helper is for the "default" or "lobby" game if it exists (ID 0)
    const idBuffer = new BN(0).toArrayLike(Buffer, 'le', 8);
    return PublicKey.findProgramAddressSync(
        [Buffer.from("pirate_game"), idBuffer],
        programId
    );
};

export const getPlayerPDA = (programId: PublicKey, playerPubkey: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("player"), (playerPubkey as any).toBuffer()],
        programId
    );
};

export const getShipPDA = (programId: PublicKey, shipId: string) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("ship"), Buffer.from(shipId)],
        programId
    );
};
