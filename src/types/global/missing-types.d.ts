// Global type declarations for missing modules

// Define the missing modules
declare module 'zustand' {
  export interface StoreApi<T> {
    setState: (partial: Partial<T> | ((state: T) => Partial<T>), replace?: boolean) => void;
    getState: () => T;
    subscribe: (listener: (state: T, prevState: T) => void) => () => void;
    destroy: () => void;
  }

  export function create<T>(initializer: (set: (partial: Partial<T> | ((state: T) => Partial<T>), replace?: boolean) => void, get: () => T, api: StoreApi<T>) => T): StoreApi<T>;

  export default create;
}

declare module '@coral-xyz/anchor' {
  import { Connection, PublicKey, Transaction } from '@solana/web3.js';
  export interface Idl {
    version: string;
    name: string;
    instructions: any[];
    accounts?: any[];
    types?: any[];
    errors?: any[];
    metadata?: {
      address: string;
    };
  }

  export interface WalletAdapter {
    publicKey: PublicKey | null;
    signTransaction(tx: Transaction): Promise<Transaction>;
    signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
  }

  export interface ConfirmOptions {
    commitment?: 'processed' | 'confirmed' | 'finalized';
    preflightCommitment?: 'processed' | 'confirmed' | 'finalized';
    skipPreflight?: boolean;
  }

  export interface MethodBuilder {
    accounts: (accounts: Record<string, PublicKey | any>) => MethodBuilder;
    rpc: (options?: any) => Promise<string>;
    simulate: (options?: any) => Promise<any>;
    view: () => Promise<any>;
  }

  export interface MethodsNamespace {
    [key: string]: (...args: any[]) => MethodBuilder;
  }

  export class Program<T = Idl> {
    constructor(idl: T, programId: PublicKey, provider: AnchorProvider);
    readonly programId: PublicKey;
    readonly idl: T;
    readonly provider: AnchorProvider;
    methods: MethodsNamespace;
  }

  export class AnchorProvider {
    constructor(
      connection: Connection,
      wallet: WalletAdapter,
      opts: ConfirmOptions
    );
    readonly connection: Connection;
    readonly wallet: WalletAdapter;
    readonly opts: ConfirmOptions;
    publicKey: PublicKey;
  }

  export class BN {
    constructor(number: number | string | BN);
    toNumber(): number;
    toString(): string;
    toArrayLike(buffer: any, endian?: string, length?: number): any;
    add(other: BN): BN;
    sub(other: BN): BN;
    mul(other: BN): BN;
    div(other: BN): BN;
  }

  export namespace web3 {
    export { Connection, PublicKey, Transaction };
  }

  export namespace utils {
    export namespace rpc {
      export function confirmTransaction(
        connection: Connection,
        signature: string,
        commitment?: string
      ): Promise<any>;
    }
  }
}

declare module '@solana/web3.js' {
  export type Commitment = 'processed' | 'confirmed' | 'finalized' | 'recent' | 'single' | 'singleGossip' | 'root' | 'max';

  export class Connection {
    constructor(endpoint: string, commitment?: Commitment);
    getBalance(publicKey: PublicKey, commitment?: Commitment): Promise<number>;
    getAccountInfo(publicKey: PublicKey, commitment?: Commitment): Promise<any>;
    getLatestBlockhash(commitment?: Commitment): Promise<{ blockhash: string; lastValidBlockHeight: number }>;
    sendTransaction(transaction: Transaction, signers?: any[], options?: any): Promise<string>;
    confirmTransaction(signature: string, commitment?: Commitment): Promise<any>;
  }

  export class PublicKey {
    constructor(value: string | Uint8Array | number[]);
    static findProgramAddressSync(seeds: (Buffer | Uint8Array)[], programId: PublicKey): [PublicKey, number];
    toBase58(): string;
    toBytes(): Uint8Array;
    equals(other: PublicKey): boolean;
  }

  export class SystemProgram {
    static programId: PublicKey;
  }

  export class Transaction {
    constructor(options?: { feePayer?: PublicKey; recentBlockhash?: string });
    add(...instructions: TransactionInstruction[]): Transaction;
    sign(...signers: any[]): void;
    serialize(): Buffer;
  }

  export class TransactionInstruction {
    constructor(options: { keys: any[]; programId: PublicKey; data?: Buffer });
  }

  export class Keypair {
    static fromSecretKey(secretKey: Uint8Array): Keypair;
    publicKey: PublicKey;
    secretKey: Uint8Array;
  }

  export function clusterApiUrl(cluster: 'devnet' | 'testnet' | 'mainnet-beta'): string;
}

declare module '@solana/wallet-adapter-react' {
  export function useConnection(): any;
  export function useWallet(): any;
}

declare module 'fs' {
  export function readFileSync(path: string, options: string): string;
  export function existsSync(path: string): boolean;
  export function writeFileSync(path: string, data: any, options?: any): void;
  export function mkdirSync(path: string, options?: any): void;
}

declare module 'path' {
  export function join(...paths: string[]): string;
  export function resolve(...pathSegments: string[]): string;
  export function dirname(path: string): string;
  export function basename(path: string, ext?: string): string;
  export function extname(path: string): string;
  export function normalize(path: string): string;
  export function isAbsolute(path: string): boolean;
  export function relative(from: string, to: string): string;
}

// Declare global variables
declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
    NEXT_PUBLIC_SOLANA_NETWORK?: string;
    NEXT_PUBLIC_HELIUS_RPC_URL?: string;
    NEXT_PUBLIC_PROGRAM_ID?: string;
    NEXT_PUBLIC_TREASURY_ADDRESS?: string;
    NEXT_PUBLIC_LOG_LEVEL?: string;
    NEXT_PUBLIC_LIGHTWALLETD_URL?: string;
    NEXT_PUBLIC_ZCASH_SHIELDED_ADDR?: string;
    PIR8_IDL_PATH?: string;
    NEXT_PUBLIC_PROGAM_ID?: string;
  }
}

declare var process: {
  env: NodeJS.ProcessEnv;
};

declare var Buffer: {
  new(str: string, encoding?: string): Uint8Array;
  from(input: string | Uint8Array, encoding?: string): Uint8Array;
  alloc(size: number): Uint8Array;
  allocUnsafe(size: number): Uint8Array;
  isBuffer(obj: any): obj is Uint8Array;
  concat(list: Uint8Array[], totalLength?: number): Uint8Array;
  byteLength(string: string, encoding?: string): number;
};

// Add missing ES2015+ features if not detected
interface Array<T> {
  fill(value: T, start?: number, end?: number): this;
  find(predicate: (value: T, index: number, obj: T[]) => boolean, thisArg?: any): T | undefined;
  findIndex(predicate: (value: T, index: number, obj: T[]) => boolean, thisArg?: any): number;
}

interface String {
  startsWith(searchString: string, position?: number): boolean;
  includes(searchString: string, position?: number): boolean;
}

interface ObjectConstructor {
  entries<T>(obj: T): [keyof T, T[keyof T]][];
}

interface ArrayConstructor {
  from<T, U = T>(arrayLike: ArrayLike<T>, mapfn?: (v: T, k: number) => U, thisArg?: any): U[];
}

// Add missing global types
declare var Set: {
  new <T>(): Set<T>;
  prototype: Set<any>;
};

declare var Promise: {
  prototype: Promise<any>;
  new <T>(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void): Promise<T>;
  all<T>(values: Iterable<T | PromiseLike<T>>): Promise<Awaited<T>[]>;
  race<T>(values: Iterable<T | PromiseLike<T>>): Promise<Awaited<T>>;
  reject<T = never>(reason?: any): Promise<T>;
  resolve<T>(value: T | PromiseLike<T>): Promise<Awaited<T>>;
};