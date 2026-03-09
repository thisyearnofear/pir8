/**
 * Solana Mobile Wallet Adapter
 * 
 * Provides mobile-optimized wallet adapter for Solana dApp Store.
 * Uses @solana-mobile/wallet-adapter-mobile for native Android wallet integration.
 * 
 * @see https://docs.solanamobile.com/get-started/mobile-wallet-adapter
 * @module lib/mobile/walletAdapter
 */

import { 
  SolanaMobileWalletAdapter,
  createDefaultAddressSelector,
  createDefaultAuthorizationResultCache,
  createDefaultWalletNotFoundHandler,
} from '@solana-mobile/wallet-adapter-mobile';

/**
 * Solana cluster type
 */
type Cluster = 'devnet' | 'testnet' | 'mainnet-beta';

/**
 * App identity for Solana Mobile Wallet Adapter
 * Used to identify your app to wallets during connection
 */
export const APP_IDENTITY = {
  /** Display name of your application */
  name: 'PIR8 Battle Arena',
  
  /** Public URL of your application */
  uri: process.env['NEXT_PUBLIC_APP_URL'] || 'https://pir8.vercel.app',
  
  /** Icon displayed in wallet connection UI */
  icon: '/icon-192x192.png',
} as const;

/**
 * Configuration options for mobile wallet adapter
 */
export interface MobileWalletAdapterConfig {
  /** Solana network cluster (devnet, mainnet-beta, testnet) */
  cluster?: Cluster;
  
  /** Override default app identity */
  identity?: typeof APP_IDENTITY;
}

/**
 * Create mobile wallet adapter instance
 * 
 * Use this adapter when running in Solana dApp Store (Android).
 * Falls back to standard wallet adapter on web/iOS.
 * 
 * @param config - Adapter configuration
 * @returns Configured mobile wallet adapter
 * 
 * @example
 * ```typescript
 * // In your wallet provider
 * const adapter = createMobileWalletAdapter({
 *   cluster: 'devnet',
 * });
 * ```
 */
export function createMobileWalletAdapter(
  config: MobileWalletAdapterConfig = {}
) {
  const { 
    cluster = 'devnet',
    identity = APP_IDENTITY 
  } = config;
  
  return new SolanaMobileWalletAdapter({
    appIdentity: identity,
    cluster,
    addressSelector: createDefaultAddressSelector(),
    authorizationResultCache: createDefaultAuthorizationResultCache(),
    onWalletNotFound: createDefaultWalletNotFoundHandler(),
  });
}

/**
 * Check if running in Solana dApp Store environment
 * 
 * Detects if the app is running within the Solana dApp Store
 * on Android devices with Seed Vault support.
 * 
 * @returns boolean - true if in dApp Store environment
 * 
 * @example
 * ```typescript
 * if (isSolanaDappStore()) {
 *   // Use mobile wallet adapter
 * } else {
 *   // Use standard wallet adapter
 * }
 * ```
 */
export function isSolanaDappStore(): boolean {
  // Server-side rendering - not in dApp Store
  if (typeof window === 'undefined') {
    return false;
  }
  
  // Check for Solana dApp Store specific APIs
  // @ts-ignore - Check for Android-specific properties
  const hasSeedVault = typeof window.solana !== 'undefined' && 
                       // @ts-ignore
                       window.solana.isSeedVault;
  
  // Check for mobile wallet adapter protocol
  // @ts-ignore
  const hasMWA = typeof navigator !== 'undefined' && 
                 // @ts-ignore
                 navigator.solana?.isMobileWalletAdapter;
  
  return hasSeedVault || hasMWA;
}

/**
 * Get appropriate wallet adapter based on platform
 * 
 * Returns mobile wallet adapter for dApp Store,
 * standard adapter for web/iOS.
 * 
 * @param config - Adapter configuration
 * @returns Wallet adapter instance
 * 
 * @example
 * ```typescript
 * const adapter = getPlatformWalletAdapter({
 *   network: WalletAdapterNetwork.MainnetBeta,
 * });
 * ```
 */
export function getPlatformWalletAdapter(
  config: MobileWalletAdapterConfig = {}
) {
  if (isSolanaDappStore()) {
    return createMobileWalletAdapter(config);
  }
  
  // Return null for standard adapter
  // (will be handled by existing wallet provider)
  return null;
}

/**
 * Mobile wallet adapter events
 * Emitted during connection lifecycle
 */
export enum MobileWalletEvent {
  /** Connection initiated */
  CONNECT_START = 'connect:start',
  /** Connection successful */
  CONNECT_SUCCESS = 'connect:success',
  /** Connection failed */
  CONNECT_ERROR = 'connect:error',
  /** Disconnection initiated */
  DISCONNECT_START = 'disconnect:start',
  /** Disconnection complete */
  DISCONNECT_COMPLETE = 'disconnect:complete',
  /** Transaction signed */
  TRANSACTION_SIGNED = 'transaction:signed',
  /** Transaction signing failed */
  TRANSACTION_ERROR = 'transaction:error',
}

/**
 * Event payload for mobile wallet events
 */
export interface MobileWalletEventPayload {
  /** Event type */
  type: MobileWalletEvent;
  /** Event data */
  data?: any;
  /** Timestamp */
  timestamp: number;
}
