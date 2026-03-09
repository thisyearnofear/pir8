/**
 * Time Utilities
 * 
 * Centralized time formatting and calculation utilities.
 * Used throughout the application for consistent time display.
 * 
 * @module utils/time
 */

/**
 * Format milliseconds to human-readable time string
 * 
 * Automatically chooses appropriate precision:
 * - < 1 minute: shows seconds (e.g., "5s", "45s")
 * - >= 1 minute: shows minutes and seconds (e.g., "1m 30s", "5m")
 * 
 * @param ms - Time in milliseconds
 * @returns Formatted time string
 * 
 * @example
 * formatTime(5000)    // "5s"
 * formatTime(45000)   // "45s"
 * formatTime(90000)   // "1m 30s"
 * formatTime(120000)  // "2m"
 */
export function formatTime(ms: number): string {
  if (ms < 0) {
    return '0s';
  }
  
  const totalSeconds = Math.floor(ms / 1000);
  
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  
  return remainingSeconds > 0
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes}m`;
}

/**
 * Format time with millisecond precision
 * 
 * Useful for performance timing, speedrun-style displays,
 * or any scenario requiring sub-second precision.
 * 
 * @param ms - Time in milliseconds
 * @param decimals - Number of decimal places (default: 3)
 * @returns Formatted time string with milliseconds
 * 
 * @example
 * formatTimePrecise(5234)     // "5.234s"
 * formatTimePrecise(1250, 1)  // "1.3s"
 */
export function formatTimePrecise(ms: number, decimals: number = 3): string {
  if (ms < 0) {
    return '0s';
  }
  
  const seconds = ms / 1000;
  return `${seconds.toFixed(decimals)}s`;
}

/**
 * Check if a time value is within a specified threshold
 * 
 * @param ms - Time in milliseconds to check
 * @param threshold - Threshold in milliseconds
 * @returns boolean - true if time is within threshold
 * 
 * @example
 * isWithinTime(5000, 10000)   // true
 * isWithinTime(15000, 10000)  // false
 */
export function isWithinTime(ms: number, threshold: number): boolean {
  return ms >= 0 && ms <= threshold;
}

/**
 * Calculate speed bonus points based on decision time
 * 
 * Bonus structure:
 * - < 5 seconds:  100 points (excellent)
 * - < 10 seconds: 50 points  (good)
 * - < 15 seconds: 25 points  (acceptable)
 * - >= 15 seconds: 0 points (too slow)
 * 
 * @param decisionTimeMs - Time taken to make decision in milliseconds
 * @returns Bonus points (0-100)
 * 
 * @example
 * calculateSpeedBonus(3000)   // 100
 * calculateSpeedBonus(7000)   // 50
 * calculateSpeedBonus(12000)  // 25
 * calculateSpeedBonus(20000)  // 0
 */
export function calculateSpeedBonus(decisionTimeMs: number): number {
  if (decisionTimeMs < 0) {
    return 0;
  }
  
  if (decisionTimeMs < 5000) {
    return 100;
  }
  
  if (decisionTimeMs < 10000) {
    return 50;
  }
  
  if (decisionTimeMs < 15000) {
    return 25;
  }
  
  return 0;
}

/**
 * Get speed bonus tier label
 * 
 * Returns descriptive label for speed bonus tier.
 * Useful for UI feedback and tooltips.
 * 
 * @param decisionTimeMs - Time taken to make decision in milliseconds
 * @returns Tier label string
 * 
 * @example
 * getSpeedBonusTier(3000)   // "Excellent"
 * getSpeedBonusTier(7000)   // "Good"
 * getSpeedBonusTier(12000)  // "Fair"
 * getSpeedBonusTier(20000)  // "Slow"
 */
export function getSpeedBonusTier(decisionTimeMs: number): string {
  if (decisionTimeMs < 0) {
    return 'Invalid';
  }
  
  if (decisionTimeMs < 5000) {
    return 'Excellent';
  }
  
  if (decisionTimeMs < 10000) {
    return 'Good';
  }
  
  if (decisionTimeMs < 15000) {
    return 'Fair';
  }
  
  return 'Slow';
}

/**
 * Debounce function for rate-limiting time-based operations
 * 
 * Creates a debounced version of a function that delays execution
 * until after wait milliseconds have elapsed since the last time
 * the debounced function was invoked.
 * 
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 * 
 * @example
 * const handleResize = debounce(() => {
 *   // Handle resize
 * }, 250);
 * 
 * window.addEventListener('resize', handleResize);
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for limiting execution frequency
 * 
 * Creates a throttled version of a function that only executes
 * once every specified interval.
 * 
 * @param func - Function to throttle
 * @param limit - Minimum time between executions in milliseconds
 * @returns Throttled function
 * 
 * @example
 * const handleScroll = throttle(() => {
 *   // Handle scroll
 * }, 100);
 * 
 * window.addEventListener('scroll', handleScroll);
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
