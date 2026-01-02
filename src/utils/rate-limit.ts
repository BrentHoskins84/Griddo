/**
 * In-memory rate limiter using a Map.
 * Note: This is instance-local. In serverless/distributed environments,
 * each instance maintains its own state, so limits won't be strictly
 * enforced across instances. For strict rate limiting, use Redis or
 * a similar external store.
 *
 * @example
 * ```ts
 * const result = checkRateLimit('user-123', { maxRequests: 10, windowMs: 60000 });
 * if (!result.success) {
 *   return new Response('Rate limit exceeded', { status: 429 });
 * }
 * ```
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
  windowMs: number;
}

interface RateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const DEFAULT_MAX_REQUESTS = 10;
const DEFAULT_WINDOW_MS = 60000; // 60 seconds

/**
 * Checks if a request should be rate limited.
 *
 * @param key - Unique identifier for the rate limit (e.g., user ID, IP address)
 * @param options - Rate limit configuration
 * @param options.maxRequests - Maximum number of requests allowed (default: 10)
 * @param options.windowMs - Time window in milliseconds (default: 60000)
 * @returns Rate limit check result with success status, remaining requests, and reset time
 */
export function checkRateLimit(key: string, options?: RateLimitOptions): RateLimitResult {
  if (!key || key.trim().length === 0) {
    throw new Error('Rate limit key must be a non-empty string');
  }

  const maxRequests = options?.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;

  if (maxRequests <= 0) {
    throw new Error('maxRequests must be a positive number');
  }
  if (windowMs <= 0) {
    throw new Error('windowMs must be a positive number');
  }

  const now = Date.now();

  const entry = rateLimitStore.get(key);

  // If no entry or window expired, create/reset entry
  if (!entry || now - entry.windowStart >= entry.windowMs) {
    const newEntry: RateLimitEntry = {
      count: 1,
      windowStart: now,
      windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      success: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  // Increment count
  entry.count += 1;
  const remaining = Math.max(0, maxRequests - entry.count);
  const success = entry.count <= maxRequests;

  // Clean up expired entries periodically (1% chance per check, ~100 checks on average)
  if (rateLimitStore.size > 0 && Math.random() < 0.01) {
    cleanupExpiredEntries();
  }

  return {
    success,
    remaining,
    resetAt: entry.windowStart + entry.windowMs,
  };
}

/**
 * Removes expired entries from the rate limit store to prevent memory leaks.
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart >= entry.windowMs) {
      rateLimitStore.delete(key);
    }
  }
}
