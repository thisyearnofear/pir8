/**
 * Haptic Feedback Utilities Tests
 * 
 * Tests for src/utils/haptics.ts
 * Covers all exported functions and edge cases
 */

import {
  HAPTIC_PATTERNS,
  hasHapticSupport,
  triggerHaptic,
  Haptic,
  useHaptic,
} from '@/utils/haptics';

// Mock navigator.vibrate
const mockVibrate = jest.fn();
const mockMatchMedia = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  
  // Setup mocks
  Object.defineProperty(global.navigator, 'vibrate', {
    value: mockVibrate,
    writable: true,
    configurable: true,
  });
  
  Object.defineProperty(global.window, 'matchMedia', {
    value: mockMatchMedia,
    writable: true,
    configurable: true,
  });
  
  // Default: no reduced motion preference
  mockMatchMedia.mockReturnValue({ matches: false });
});

describe('HAPTIC_PATTERNS', () => {
  it('should have correct pattern for light intensity', () => {
    expect(HAPTIC_PATTERNS.light).toBe(10);
  });

  it('should have correct pattern for medium intensity', () => {
    expect(HAPTIC_PATTERNS.medium).toBe(25);
  });

  it('should have correct pattern for heavy intensity', () => {
    expect(HAPTIC_PATTERNS.heavy).toEqual([50, 30, 50]);
  });

  it('should have correct pattern for success intensity', () => {
    expect(HAPTIC_PATTERNS.success).toEqual([100, 50, 100]);
  });

  it('should have correct pattern for error intensity', () => {
    expect(HAPTIC_PATTERNS.error).toEqual([200, 50, 200]);
  });

  it('should be immutable (frozen)', () => {
    expect(Object.isFrozen(HAPTIC_PATTERNS)).toBe(true);
  });
});

describe('hasHapticSupport', () => {
  it('should return true when vibrate API is available', () => {
    Object.defineProperty(global.navigator, 'vibrate', {
      value: jest.fn(),
      writable: true,
      configurable: true,
    });

    expect(hasHapticSupport()).toBe(true);
  });

  it('should return false when vibrate API is not available', () => {
    Object.defineProperty(global.navigator, 'vibrate', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    expect(hasHapticSupport()).toBe(false);
  });

  it('should return false when navigator is undefined (SSR)', () => {
    const originalNavigator = global.navigator;
    Object.defineProperty(global, 'navigator', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    expect(hasHapticSupport()).toBe(false);

    // Restore
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });
});

describe('triggerHaptic', () => {
  it('should trigger vibration with default intensity (light)', () => {
    const result = triggerHaptic();
    
    expect(mockVibrate).toHaveBeenCalledWith(10);
    expect(result).toBe(true);
  });

  it('should trigger vibration with specified intensity', () => {
    triggerHaptic('medium');
    
    expect(mockVibrate).toHaveBeenCalledWith(25);
  });

  it('should trigger vibration with heavy pattern', () => {
    triggerHaptic('heavy');
    
    expect(mockVibrate).toHaveBeenCalledWith([50, 30, 50]);
  });

  it('should trigger vibration with success pattern', () => {
    triggerHaptic('success');
    
    expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100]);
  });

  it('should trigger vibration with error pattern', () => {
    triggerHaptic('error');
    
    expect(mockVibrate).toHaveBeenCalledWith([200, 50, 200]);
  });

  it('should return false when vibrate API is not available', () => {
    Object.defineProperty(global.navigator, 'vibrate', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const result = triggerHaptic('light');
    
    expect(result).toBe(false);
    expect(mockVibrate).not.toHaveBeenCalled();
  });

  it('should respect reduced motion preferences', () => {
    mockMatchMedia.mockReturnValue({ matches: true });

    const result = triggerHaptic('light');
    
    expect(result).toBe(false);
    expect(mockVibrate).not.toHaveBeenCalled();
  });

  it('should handle vibrate errors gracefully', () => {
    mockVibrate.mockImplementation(() => {
      throw new Error('Vibration failed');
    });

    const result = triggerHaptic('light');
    
    expect(result).toBe(false);
  });

  it('should work in SSR environment without crashing', () => {
    const originalNavigator = global.navigator;
    Object.defineProperty(global, 'navigator', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const result = triggerHaptic('light');
    
    expect(result).toBe(false);

    // Restore
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });
});

describe('Haptic convenience object', () => {
  it('Haptic.light should trigger light haptic', () => {
    Haptic.light();
    
    expect(mockVibrate).toHaveBeenCalledWith(10);
  });

  it('Haptic.medium should trigger medium haptic', () => {
    Haptic.medium();
    
    expect(mockVibrate).toHaveBeenCalledWith(25);
  });

  it('Haptic.heavy should trigger heavy haptic', () => {
    Haptic.heavy();
    
    expect(mockVibrate).toHaveBeenCalledWith([50, 30, 50]);
  });

  it('Haptic.success should trigger success haptic', () => {
    Haptic.success();
    
    expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100]);
  });

  it('Haptic.error should trigger error haptic', () => {
    Haptic.error();
    
    expect(mockVibrate).toHaveBeenCalledWith([200, 50, 200]);
  });
});

describe('useHaptic hook', () => {
  it('should return trigger function', () => {
    const { trigger } = useHaptic();
    
    expect(typeof trigger).toBe('function');
    trigger('light');
    expect(mockVibrate).toHaveBeenCalledWith(10);
  });

  it('should return hasSupport boolean', () => {
    const { hasSupport } = useHaptic();
    
    expect(typeof hasSupport).toBe('boolean');
  });

  it('should return Haptic object', () => {
    const { Haptic: hookHaptic } = useHaptic();
    
    expect(hookHaptic).toBeDefined();
    expect(typeof hookHaptic.light).toBe('function');
  });
});

describe('Type Safety', () => {
  it('should accept valid intensity types', () => {
    const intensities = [
      'light',
      'medium',
      'heavy',
      'success',
      'error',
    ];

    intensities.forEach((intensity) => {
      expect(() => triggerHaptic(intensity)).not.toThrow();
    });
  });
});
