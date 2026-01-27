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
  export interface Idl {}
  export class Program<T = Idl> {
    constructor(idl: T, programId: any, provider?: any);
  }
  export class AnchorProvider {
    constructor(connection: any, wallet: any, opts: any);
  }
  export class BN {
    constructor(number: number | string);
    toNumber(): number;
    toString(): string;
    toArrayLike(buffer: any, endian?: string, length?: number): any;
  }
  export function web3(): any;
}

declare module '@solana/web3.js' {
  export class Connection {
    constructor(endpoint: string, commitment?: any);
  }
  export class PublicKey {
    constructor(value: string | Uint8Array | number[]);
    static findProgramAddressSync(seeds: (Uint8Array)[], programId: PublicKey): [PublicKey, number];
    toBase58(): string;
  }
  export class SystemProgram {}
  export class Transaction {}
  export class Keypair {
    static fromSecretKey(secretKey: Uint8Array): Keypair;
  }
  export function clusterApiUrl(cluster: string): string;
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
    PAYER_SECRET_KEY?: string;
    PIR8_IDL_PATH?: string;
    NEXT_PUBLIC_PROGAM_ID?: string;
  }
}

declare var process: {
  env: NodeJS.ProcessEnv;
};

declare var Buffer: {
  new (str: string, encoding?: string): Uint8Array;
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