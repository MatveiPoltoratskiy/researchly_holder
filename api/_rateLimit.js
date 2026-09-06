// Best-effort, in-memory rate limiting for a Vercel serverless function. Honest
// limitation: each warm instance has its own Map, so a distributed attack spread across
// many concurrent invocations (or one that lands on a fresh cold start) sees a fresh
// limit. This raises the bar against a casual/single-threaded brute-force script; it is
// NOT a substitute for a shared store (Vercel Firewall / Upstash Redis) if this endpoint
// ever needs to resist a serious, sustained attack.

const buckets = new Map()

export function getClientIp(req) {
  // x-real-ip is the single IP Vercel's edge itself observed the connection from — not
  // something a client can override, since Vercel sets it fresh rather than passing
  // through a client-supplied header of the same name. Prefer it.
  //
  // x-forwarded-for is NOT safe to trust at position [0]: that's the earliest hop in the
  // chain, which is exactly the value a client can set to whatever they want in their own
  // request before it ever reaches Vercel's edge (each proxy is only supposed to APPEND
  // its own observed address, never rewrite what's already there) — reading [0] lets
  // every rate limit in this file be bypassed by sending a different fake value on every
  // request. The last entry is the one nearest the actual TCP connection, so it's the
  // one Vercel's own edge appended and the one that's actually trustworthy.
  const realIp = req.headers['x-real-ip']
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim()

  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean)
    if (parts.length > 0) return parts[parts.length - 1]
  }
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

/**
 * Rejects a request whose declared Content-Length exceeds maxBytes, before any rate-limit
 * bookkeeping or JSON parsing happens. None of these endpoints legitimately need more
 * than a few KB — this is a cheap backstop against someone repeatedly sending oversized
 * payloads to burn parse/compute time, on top of each handler's own
 * `export const config = { api: { bodyParser: { sizeLimit } } }` (the mechanism Vercel's
 * Node runtime itself uses to cap how much of the body it will even parse).
 * Honest limitation: a request sent without a Content-Length header (e.g. chunked
 * transfer-encoding) isn't caught by this specific check and relies on the bodyParser
 * config instead.
 */
export function rejectIfOversized(req, res, maxBytes) {
  const len = Number(req.headers['content-length'])
  if (Number.isFinite(len) && len > maxBytes) {
    res.status(413).json({ error: 'Request too large' })
    return true
  }
  return false
}
