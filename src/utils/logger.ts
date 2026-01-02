import * as Sentry from '@sentry/nextjs';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Only show warnings and errors in production
const MIN_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (shouldLog('debug')) console.debug(`[DEBUG] ${message}`, ...args);
  },
  info: (context: string, message: string, metadata?: Record<string, unknown>): void => {
    if (shouldLog('info')) {
      console.info(`[INFO] ${context}:`, message);
      if (metadata) console.info(metadata);
    }
  },
  warn: (context: string, message: string, metadata?: Record<string, unknown>): void => {
    if (shouldLog('warn')) {
      console.warn(`[WARN] ${context}:`, message);
      if (metadata) console.warn(metadata);
    }
  },
  error: (context: string, error: unknown, metadata?: Record<string, unknown>): void => {
    if (shouldLog('error')) {
      console.error(`[ERROR] ${context}:`, error);
      if (metadata) console.error(metadata);
    }
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error, {
        extra: {
          context,
          ...metadata,
        },
      });
    }
  },
};
