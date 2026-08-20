import crypto from 'node:crypto'

// Best-effort, in-memory one-time-code store — same honest limitation as
// _rateLimit.js's bucket Map: each warm Vercel instance has its own copy, so a code
// minted on one instance won't be recognized by a different concurrent instance, and a
// cold start forgets it entirely. Good enough for "hand a friend a code that dies after
// one login, right now" (this instance is very likely still warm for the next request
// or two); not a substitute for a shared store (Supabase/Redis) if this ever needs a
// harder guarantee.

const CODE_TTL_MS = 30 * 60 * 1000 // 30 minutes — long enough to relay, short enough not to linger

const codes = new Map() // sha256(code) -> expiresAt

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex')
}

/** Mints a fresh one-time code and remembers its hash. Returns the plaintext code. */
export function mintOneTimeCode() {
  const code = crypto.randomBytes(9).toString('base64url') // ~12 url-safe chars
  codes.set(hashCode(code), Date.now() + CODE_TTL_MS)
  return code
}

/**
 * Returns true iff `code` is a valid, unexpired, not-yet-used one-time code — and
 * deletes it in the same synchronous step either way, so a second attempt with the same
 * code (a real reuse, or a guess that happens to collide with an expired entry) always
 * reads as invalid on this instance. No `await` between the lookup and the delete, so
 * nothing else can interleave and redeem it twice within one warm instance.
 */
export function consumeOneTimeCode(code) {
  if (typeof code !== 'string' || !code) return false
  const hash = hashCode(code)
  const expiresAt = codes.get(hash)
  if (expiresAt === undefined) return false
  codes.delete(hash)
  return expiresAt > Date.now()
}

export function sweepExpiredCodes() {
  const now = Date.now()
  for (const [hash, expiresAt] of codes) {
    if (expiresAt <= now) codes.delete(hash)
  }
}
