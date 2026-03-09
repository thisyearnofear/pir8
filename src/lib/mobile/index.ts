/**
 * Mobile Wallet Module
 * 
 * Re-exports all mobile wallet adapter functionality.
 * Import from this module for clean, organized imports.
 * 
 * @module lib/mobile
 */

export {
  APP_IDENTITY,
  createMobileWalletAdapter,
  getPlatformWalletAdapter,
  isSolanaDappStore,
  MobileWalletEvent,
} from './walletAdapter';

export type {
  MobileWalletAdapterConfig,
  MobileWalletEventPayload,
} from './walletAdapter';
