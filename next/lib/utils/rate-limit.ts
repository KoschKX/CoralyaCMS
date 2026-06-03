/**
 * Simple in-memory rate limiter (token bucket, per key).
 *
 * This is a module-level singleton — it persists for the lifetime of the
 * Node.js worker process. Suitable for self-hosted deployments with a single
 * server process. For multi-instance deployments, replace with a Redis-backed
 * solution.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Check whether `key` (e.g. client IP) has exceeded `maxPerMinute` requests.
 * Returns `true` if the request should be allowed, `false` if it should be
 * rejected with 429 Too Many Requests.
 */
export function checkRateLimit(key: string, maxPerMinute: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (bucket.count >= maxPerMinute) return false;

  bucket.count++;
  return true;
}
