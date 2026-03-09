/**
 * Mobile Wallet Adapter Tests
 * 
 * Tests for src/lib/mobile/walletAdapter.ts
 * Covers platform detection, adapter creation, and configuration
 */

import {
  APP_IDENTITY,
  createMobileWalletAdapter,
  isSolanaDappStore,
  getPlatformWalletAdapter,
  type MobileWalletAdapterConfig,
} from '@/lib/mobile/walletAdapter';

// Mock the Solana Mobile Wallet Adapter
const mockSolanaMobileWalletAdapter = jest.fn();
jest.mock('@solana-mobile/wallet-adapter-mobile', () => ({
  SolanaMobileWalletAdapter: mockSolanaMobileWalletAdapter,
  createDefaultAddressSelector: jest.fn(() => ({})),
  createDefaultAuthorizationResultCache: jest.fn(() => ({})),
  createDefaultWalletNotFoundHandler: jest.fn(() => {}),
}));

describe('APP_IDENTITY', () => {
  it('should have correct app name', () => {
    expect(APP_IDENTITY.name).toBe('PIR8 Battle Arena');
  });

  it('should have URI configured', () => {
    // Should use env var or fallback
    expect(typeof APP_IDENTITY.uri).toBe('string');
    expect(APP_IDENTITY.uri.length).toBeGreaterThan(0);
  });

  it('should have icon path configured', () => {
    expect(APP_IDENTITY.icon).toBe('/icon-192x192.png');
  });

  it('should be immutable', () => {
    expect(Object.isFrozen(APP_IDENTITY)).toBe(true);
  });
});

describe('isSolanaDappStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset globals
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true,
      configurable: true,
    });
    
    Object.defineProperty(global.navigator, 'solana', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  it('should return false during SSR', () => {
    const originalWindow = global.window;
    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    expect(isSolanaDappStore()).toBe(false);

    // Restore
    Object.defineProperty(global, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true,
    });
  });

  it('should return false when no Seed Vault detected', () => {
    Object.defineProperty(global.window, 'solana', {
      value: { isSeedVault: false },
      writable: true,
      configurable: true,
    });

    expect(isSolanaDappStore()).toBe(false);
  });

  it('should return true when Seed Vault detected', () => {
    Object.defineProperty(global.window, 'solana', {
      value: { isSeedVault: true },
      writable: true,
      configurable: true,
    });

    expect(isSolanaDappStore()).toBe(true);
  });

  it('should return true when Mobile Wallet Adapter detected', () => {
    Object.defineProperty(global.navigator, 'solana', {
      value: { isMobileWalletAdapter: true },
      writable: true,
      configurable: true,
    });

    expect(isSolanaDappStore()).toBe(true);
  });

  it('should handle missing navigator gracefully', () => {
    const originalNavigator = global.navigator;
    Object.defineProperty(global, 'navigator', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    expect(() => isSolanaDappStore()).not.toThrow();

    // Restore
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });
});

describe('createMobileWalletAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSolanaMobileWalletAdapter.mockClear();
  });

  it('should create adapter with default config', () => {
    createMobileWalletAdapter();

    expect(mockSolanaMobileWalletAdapter).toHaveBeenCalledWith({
      appIdentity: APP_IDENTITY,
      cluster: 'devnet',
      addressSelector: expect.anything(),
      authorizationResultCache: expect.anything(),
      onWalletNotFound: expect.anything(),
    });
  });

  it('should create adapter with custom cluster', () => {
    createMobileWalletAdapter({ cluster: 'mainnet-beta' });

    expect(mockSolanaMobileWalletAdapter).toHaveBeenCalledWith(
      expect.objectContaining({
        cluster: 'mainnet-beta',
      })
    );
  });

  it('should create adapter with custom identity', () => {
    const customIdentity = {
      name: 'Custom App',
      uri: 'https://custom.app.com',
      icon: '/custom-icon.png',
    };

    createMobileWalletAdapter({ identity: customIdentity });

    expect(mockSolanaMobileWalletAdapter).toHaveBeenCalledWith(
      expect.objectContaining({
        appIdentity: customIdentity,
      })
    );
  });

  it('should use default identity when custom not provided', () => {
    createMobileWalletAdapter();

    expect(mockSolanaMobileWalletAdapter).toHaveBeenCalledWith(
      expect.objectContaining({
        appIdentity: APP_IDENTITY,
      })
    );
  });

  it('should merge custom config with defaults', () => {
    const customConfig: MobileWalletAdapterConfig = {
      cluster: 'testnet',
    };

    createMobileWalletAdapter(customConfig);

    expect(mockSolanaMobileWalletAdapter).toHaveBeenCalledWith(
      expect.objectContaining({
        cluster: 'testnet',
        appIdentity: APP_IDENTITY,
      })
    );
  });

  it('should return SolanaMobileWalletAdapter instance', () => {
    const mockAdapter = { name: 'MockAdapter' };
    mockSolanaMobileWalletAdapter.mockReturnValue(mockAdapter);

    const adapter = createMobileWalletAdapter();

    expect(adapter).toBe(mockAdapter);
  });
});

describe('getPlatformWalletAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true,
      configurable: true,
    });
  });

  it('should return null when not in dApp Store', () => {
    Object.defineProperty(global.window, 'solana', {
      value: { isSeedVault: false },
      writable: true,
      configurable: true,
    });

    const adapter = getPlatformWalletAdapter();

    expect(adapter).toBeNull();
  });

  it('should return mobile adapter when in dApp Store', () => {
    Object.defineProperty(global.window, 'solana', {
      value: { isSeedVault: true },
      writable: true,
      configurable: true,
    });

    const mockAdapter = { name: 'MockMobileAdapter' };
    mockSolanaMobileWalletAdapter.mockReturnValue(mockAdapter);

    const adapter = getPlatformWalletAdapter();

    expect(adapter).toBe(mockAdapter);
    expect(mockSolanaMobileWalletAdapter).toHaveBeenCalled();
  });

  it('should pass config to mobile adapter', () => {
    Object.defineProperty(global.window, 'solana', {
      value: { isSeedVault: true },
      writable: true,
      configurable: true,
    });

    getPlatformWalletAdapter({ cluster: 'mainnet-beta' });

    expect(mockSolanaMobileWalletAdapter).toHaveBeenCalledWith(
      expect.objectContaining({
        cluster: 'mainnet-beta',
      })
    );
  });

  it('should use default config when not provided', () => {
    Object.defineProperty(global.window, 'solana', {
      value: { isSeedVault: true },
      writable: true,
      configurable: true,
    });

    getPlatformWalletAdapter();

    expect(mockSolanaMobileWalletAdapter).toHaveBeenCalledWith(
      expect.objectContaining({
        cluster: 'devnet',
      })
    );
  });
});

describe('Type Safety', () => {
  it('should accept valid cluster types', () => {
    const configs: MobileWalletAdapterConfig[] = [
      { cluster: 'devnet' },
      { cluster: 'testnet' },
      { cluster: 'mainnet-beta' },
    ];

    configs.forEach(config => {
      expect(() => createMobileWalletAdapter(config)).not.toThrow();
    });
  });

  it('should accept custom identity with all fields', () => {
    const config: MobileWalletAdapterConfig = {
      cluster: 'devnet',
      identity: {
        name: 'Test App',
        uri: 'https://test.app',
        icon: '/test.png',
      },
    };

    expect(() => createMobileWalletAdapter(config)).not.toThrow();
  });

  it('should accept partial custom identity', () => {
    const config: MobileWalletAdapterConfig = {
      identity: {
        name: 'Partial App',
        // uri and icon should use defaults
      } as any,
    };

    expect(() => createMobileWalletAdapter(config)).not.toThrow();
  });
});

describe('Integration Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true,
      configurable: true,
    });
  });

  it('should work in typical web environment', () => {
    // Not in dApp Store
    Object.defineProperty(global.window, 'solana', {
      value: { isSeedVault: false },
      writable: true,
      configurable: true,
    });

    const adapter = getPlatformWalletAdapter();
    expect(adapter).toBeNull(); // Should use standard adapters
  });

  it('should work in dApp Store environment', () => {
    // In dApp Store
    Object.defineProperty(global.window, 'solana', {
      value: { isSeedVault: true },
      writable: true,
      configurable: true,
    });

    const mockAdapter = { name: 'MobileAdapter' };
    mockSolanaMobileWalletAdapter.mockReturnValue(mockAdapter);

    const adapter = getPlatformWalletAdapter();
    expect(adapter).toBe(mockAdapter); // Should use mobile adapter
  });

  it('should support multi-cluster deployment', () => {
    const devnetAdapter = createMobileWalletAdapter({ cluster: 'devnet' });
    const testnetAdapter = createMobileWalletAdapter({ cluster: 'testnet' });
    const mainnetAdapter = createMobileWalletAdapter({ cluster: 'mainnet-beta' });

    expect(devnetAdapter).toBeDefined();
    expect(testnetAdapter).toBeDefined();
    expect(mainnetAdapter).toBeDefined();
  });
});
