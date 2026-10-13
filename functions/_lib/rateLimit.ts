/**
 * CENNA.live Edge Runtime Rate Limiter
 * 
 * Provides in-memory token bucket / sliding window rate limiting for Cloudflare Pages Functions.
 * Enforces request throttling on authentication-adjacent, email-triggering, 
 * quiz submission, and AI generation endpoints.
 */

import { errorResponse } from './cors';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-isolate LRU-style memory cache for rate limiting
const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean expired records periodically to prevent unbounded memory growth in warm isolates
function purgeExpired(now: number) {
  if (rateLimitMap.size > 2000) {
    for (const [key, record] of rateLimitMap.entries()) {
      if (record.resetAt <= now) {
        rateLimitMap.delete(key);
      }
    }
  }
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix: string;
}

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}

export function checkRateLimit(
  request: Request,
  config: RateLimitConfig,
  userId?: string
): RateLimitResult {
  const now = Date.now();
  purgeExpired(now);

  const clientIp = request.headers.get('cf-connecting-ip') || 
                   request.headers.get('x-real-ip') || 
                   request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                   '127.0.0.1';

  const identifier = userId ? `user:${userId}` : `ip:${clientIp}`;
  const bucketKey = `${config.keyPrefix}:${identifier}`;

  const record = rateLimitMap.get(bucketKey);

  if (!record || record.resetAt <= now) {
    // New rate limit window
    const resetAt = now + config.windowMs;
    rateLimitMap.set(bucketKey, { count: 1, resetAt });
    return {
      allowed: true,
      current: 1,
      remaining: config.maxRequests - 1,
      resetAt,
      retryAfterSec: Math.ceil(config.windowMs / 1000),
    };
  }

  if (record.count >= config.maxRequests) {
    const retryAfterSec = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: false,
      current: record.count,
      remaining: 0,
      resetAt: record.resetAt,
      retryAfterSec,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    current: record.count,
    remaining: config.maxRequests - record.count,
    resetAt: record.resetAt,
    retryAfterSec: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
  };
}

export function rateLimitResponse(result: RateLimitResult): Response {
  const resp = errorResponse(
    'RATE_LIMIT_EXCEEDED',
    `İstek limiti aşıldı. Lütfen ${result.retryAfterSec} saniye sonra tekrar deneyiniz.`,
    429
  );
  resp.headers.set('Retry-After', String(result.retryAfterSec));
  resp.headers.set('X-RateLimit-Limit', '30');
  resp.headers.set('X-RateLimit-Remaining', String(result.remaining));
  resp.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
  return resp;
}
