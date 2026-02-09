/**
 * Simple in-memory rate limiter using sliding window algorithm.
 * For production with multiple instances, use Redis-based solution (e.g., @upstash/ratelimit).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const cache = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (entry.resetAt < now) {
        cache.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given identifier (e.g., userId or IP)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  startCleanup();

  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const key = identifier;

  let entry = cache.get(key);

  // Reset if window has passed
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
  }

  entry.count++;
  cache.set(key, entry);

  const remaining = Math.max(0, config.limit - entry.count);
  const success = entry.count <= config.limit;

  return {
    success,
    limit: config.limit,
    remaining,
    resetAt: entry.resetAt,
  };
}

/**
 * Pre-configured rate limits for different endpoints
 */
export const RATE_LIMITS = {
  // Expensive operations - strict limits
  process: { limit: 10, windowSeconds: 60 }, // 10 uploads per minute
  processStream: { limit: 10, windowSeconds: 60 },

  // Standard API operations - moderate limits
  api: { limit: 100, windowSeconds: 60 }, // 100 requests per minute

  // Read-heavy operations - relaxed limits
  analytics: { limit: 60, windowSeconds: 60 }, // 60 per minute
} as const;
