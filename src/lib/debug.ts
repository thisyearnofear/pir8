/**
 * Debug utility - Only logs in development mode
 * Reduces console noise in production
 */

const isDev = process.env.NODE_ENV === 'development';

export const debug = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    // Always log errors, but could be sent to error tracking in production
    console.error(...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },
};

export default debug;
