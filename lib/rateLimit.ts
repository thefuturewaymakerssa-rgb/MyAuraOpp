import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Upstash Redis Rate Limiters for Future WayMakers API endpoints.
 *
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local.
 * All limiters use sliding windows for accurate per-user enforcement.
 */
const redis = Redis.fromEnv();

// Upload endpoint: 8 video uploads per hour per user
export const uploadRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(8, '1 h'),
  analytics: true,
  prefix: 'ratelimit:upload',
});

// Payments endpoint: 20 payment actions per hour per user
export const paymentsRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  analytics: true,
  prefix: 'ratelimit:payments',
});

// Role switching: 5 switches per 24 hours per user (abuse prevention)
export const roleSwitchRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '24 h'),
  analytics: true,
  prefix: 'ratelimit:role-switch',
});

