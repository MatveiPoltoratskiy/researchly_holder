// Best-effort, in-memory rate limiting for a Vercel serverless function. Honest
// limitation: each warm instance has its own Map, so a distributed attack spread across
// many concurrent invocations (or one that lands on a fresh cold start) sees a fresh
// limit. This raises the bar against a casual/single-threaded brute-force script; it is
// NOT a substitute for a shared store (Vercel Firewall / Upstash Redis) if this endpoint
// ever needs to resist a serious, sustained attack.

const buckets = new Map()

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) return forwarded.split(',')[0].trim()
  return req.socket?.remoteAddress || 'unknown'
}

/**
 * Returns { limited, retryAfterSeconds } and records this attempt.
 * `maxAttempts`/`windowMs` are per-caller so a strict limit on a guessable-secret
 * endpoint (dev-unlock) doesn't also lock out a legitimately unlocked visitor's routine
 * per-page-load verify calls (dev-verify).
 */
export function checkRateLimit(key, { maxAttempts = 8, windowMs = 5 * 60 * 1000 } = {}) {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { windowStart: now, count: 1, windowMs })
    return { limited: false }
  }

  bucket.count += 1
  if (bucket.count > maxAttempts) {
    const retryAfterSeconds = Math.ceil((bucket.windowStart + bucket.windowMs - now) / 1000)
    return { limited: true, retryAfterSeconds }
  }
  return { limited: false }
}

// keeps the map from growing unbounded across a long-lived warm instance
export function sweepExpired() {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > bucket.windowMs) buckets.delete(key)
  }
}
