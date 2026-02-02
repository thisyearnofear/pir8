import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export const getGamePDA = (gameId: number | BN, programId: PublicKey): [PublicKey, number] => {
    const idBuffer = typeof gameId === 'number' 
        ? new BN(gameId).toArrayLike(Buffer, 'le', 8)
        : gameId.toArrayLike(Buffer, 'le', 8);

    return PublicKey.findProgramAddressSync(
        [Buffer.from("game"), idBuffer],
        programId
    );
};

// Deprecated: kept for backward compatibility if needed during migration
export const getGlobalGamePDA = (programId: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("global_game")],
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
