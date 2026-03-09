/**
 * Time Utilities Tests
 * 
 * Tests for src/utils/time.ts
 * Covers all time formatting and calculation functions
 */

import {
  formatTime,
  formatTimePrecise,
  isWithinTime,
  calculateSpeedBonus,
  getSpeedBonusTier,
  debounce,
  throttle,
} from '@/utils/time';

describe('formatTime', () => {
  it('should format milliseconds to seconds', () => {
    expect(formatTime(5000)).toBe('5s');
    expect(formatTime(1000)).toBe('1s');
  });

  it('should format zero time', () => {
    expect(formatTime(0)).toBe('0s');
  });

  it('should handle negative time', () => {
    expect(formatTime(-5000)).toBe('0s');
  });

  it('should format minutes and seconds', () => {
    expect(formatTime(90000)).toBe('1m 30s');
    expect(formatTime(120000)).toBe('2m');
    expect(formatTime(150000)).toBe('2m 30s');
  });

  it('should round down to whole seconds', () => {
    expect(formatTime(5999)).toBe('5s');
    expect(formatTime(5499)).toBe('5s');
  });

  it('should handle edge cases', () => {
    expect(formatTime(59000)).toBe('59s');
    expect(formatTime(60000)).toBe('1m');
    expect(formatTime(61000)).toBe('1m 1s');
  });
});

describe('formatTimePrecise', () => {
  it('should format with default 3 decimal places', () => {
    expect(formatTimePrecise(5234)).toBe('5.234s');
    expect(formatTimePrecise(1250)).toBe('1.250s');
  });

  it('should format with custom decimal places', () => {
    expect(formatTimePrecise(5234, 1)).toBe('5.2s');
    expect(formatTimePrecise(5234, 2)).toBe('5.23s');
    expect(formatTimePrecise(5234, 4)).toBe('5.2340s');
  });

  it('should handle zero time', () => {
    expect(formatTimePrecise(0)).toBe('0.000s');
  });

  it('should handle negative time', () => {
    expect(formatTimePrecise(-5000)).toBe('0s');
  });

  it('should handle large times', () => {
    expect(formatTimePrecise(120000)).toBe('120.000s');
    expect(formatTimePrecise(3600000)).toBe('3600.000s');
  });
});

describe('isWithinTime', () => {
  it('should return true when time is within threshold', () => {
    expect(isWithinTime(5000, 10000)).toBe(true);
    expect(isWithinTime(9999, 10000)).toBe(true);
  });

  it('should return true when time equals threshold', () => {
    expect(isWithinTime(10000, 10000)).toBe(true);
  });

  it('should return false when time exceeds threshold', () => {
    expect(isWithinTime(10001, 10000)).toBe(false);
    expect(isWithinTime(15000, 10000)).toBe(false);
  });

  it('should return false for negative time', () => {
    expect(isWithinTime(-5000, 10000)).toBe(false);
  });

  it('should handle zero values', () => {
    expect(isWithinTime(0, 0)).toBe(true);
    expect(isWithinTime(0, 10000)).toBe(true);
  });
});

describe('calculateSpeedBonus', () => {
  it('should return 100 points for excellent speed (<5s)', () => {
    expect(calculateSpeedBonus(0)).toBe(100);
    expect(calculateSpeedBonus(3000)).toBe(100);
    expect(calculateSpeedBonus(4999)).toBe(100);
  });

  it('should return 50 points for good speed (5-10s)', () => {
    expect(calculateSpeedBonus(5000)).toBe(50);
    expect(calculateSpeedBonus(7000)).toBe(50);
    expect(calculateSpeedBonus(9999)).toBe(50);
  });

  it('should return 25 points for fair speed (10-15s)', () => {
    expect(calculateSpeedBonus(10000)).toBe(25);
    expect(calculateSpeedBonus(12000)).toBe(25);
    expect(calculateSpeedBonus(14999)).toBe(25);
  });

  it('should return 0 points for slow speed (>=15s)', () => {
    expect(calculateSpeedBonus(15000)).toBe(0);
    expect(calculateSpeedBonus(20000)).toBe(0);
    expect(calculateSpeedBonus(60000)).toBe(0);
  });

  it('should return 0 for negative time', () => {
    expect(calculateSpeedBonus(-5000)).toBe(0);
  });

  it('should handle boundary conditions precisely', () => {
    expect(calculateSpeedBonus(4999)).toBe(100); // Just under 5s
    expect(calculateSpeedBonus(5000)).toBe(50);  // Exactly 5s
    expect(calculateSpeedBonus(9999)).toBe(50);  // Just under 10s
    expect(calculateSpeedBonus(10000)).toBe(25); // Exactly 10s
    expect(calculateSpeedBonus(14999)).toBe(25); // Just under 15s
    expect(calculateSpeedBonus(15000)).toBe(0);  // Exactly 15s
  });
});

describe('getSpeedBonusTier', () => {
  it('should return "Excellent" for <5s', () => {
    expect(getSpeedBonusTier(0)).toBe('Excellent');
    expect(getSpeedBonusTier(3000)).toBe('Excellent');
    expect(getSpeedBonusTier(4999)).toBe('Excellent');
  });

  it('should return "Good" for 5-10s', () => {
    expect(getSpeedBonusTier(5000)).toBe('Good');
    expect(getSpeedBonusTier(7000)).toBe('Good');
    expect(getSpeedBonusTier(9999)).toBe('Good');
  });

  it('should return "Fair" for 10-15s', () => {
    expect(getSpeedBonusTier(10000)).toBe('Fair');
    expect(getSpeedBonusTier(12000)).toBe('Fair');
    expect(getSpeedBonusTier(14999)).toBe('Fair');
  });

  it('should return "Slow" for >=15s', () => {
    expect(getSpeedBonusTier(15000)).toBe('Slow');
    expect(getSpeedBonusTier(20000)).toBe('Slow');
  });

  it('should return "Invalid" for negative time', () => {
    expect(getSpeedBonusTier(-5000)).toBe('Invalid');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should delay function execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous calls if called again within wait time', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments to debounced function', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('arg1', 'arg2');
    jest.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should allow function to be called again after delay', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);

    debouncedFn();
    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});

describe('throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should limit function execution frequency', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    throttledFn();
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should execute immediately on first call', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn();
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments to throttled function', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn('arg1', 'arg2');
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should allow execution after limit period', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn();
    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(50);
    throttledFn();
    expect(mockFn).toHaveBeenCalledTimes(1); // Still throttled

    jest.advanceTimersByTime(50);
    throttledFn();
    expect(mockFn).toHaveBeenCalledTimes(2); // Now allowed
  });
});

describe('Integration Tests', () => {
  it('should work together for speed bonus calculation', () => {
    const decisionTime = 7500;
    
    const bonus = calculateSpeedBonus(decisionTime);
    const tier = getSpeedBonusTier(decisionTime);
    const formatted = formatTime(decisionTime);
    
    expect(bonus).toBe(50);
    expect(tier).toBe('Good');
    expect(formatted).toBe('7s');
  });

  it('should format speed bonus feedback', () => {
    const testCases = [
      { time: 3000, expected: 'Excellent (100 pts) - 3s' },
      { time: 7000, expected: 'Good (50 pts) - 7s' },
      { time: 12000, expected: 'Fair (25 pts) - 12s' },
      { time: 20000, expected: 'Slow (0 pts) - 20s' },
    ];

    testCases.forEach(({ time, expected }) => {
      const bonus = calculateSpeedBonus(time);
      const tier = getSpeedBonusTier(time);
      const formatted = formatTime(time);
      const message = `${tier} (${bonus} pts) - ${formatted}`;
      
      expect(message).toBe(expected);
    });
  });
});
