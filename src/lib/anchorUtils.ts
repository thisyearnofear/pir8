import { PublicKey } from '@solana/web3.js';

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
