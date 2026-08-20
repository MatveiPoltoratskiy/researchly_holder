import crypto from 'node:crypto'
import { checkRateLimit, getClientIp, sweepExpired } from './_rateLimit.js'
import { consumeOneTimeCode, sweepExpiredCodes } from './_oneTimeCodes.js'

// Vercel Node.js Serverless Function (zero-config: any file under /api gets deployed as
// one automatically). This is the piece that makes the /interview and /opportunities
// gate real: the passphrase and signing secret live only in Vercel's environment
// variables, never in anything shipped to the browser. Client-side code can request a
// token here, but it can never read or derive the secret needed to forge one.
//
// Requires two environment variables set in the Vercel project (Settings > Environment
// Variables) — NOT prefixed with VITE_, which would bundle them into client JS:
//   DEV_GATE_PASSPHRASE  — the shared passphrase
//   DEV_GATE_SECRET      — a long random string used to sign session tokens
//
// Token format: base64url(JSON payload).base64url(HMAC-SHA256 signature). Verified in
// dev-verify.js — the client only ever sees the token, never the secret.

const MAX_PASSPHRASE_LENGTH = 256

export default function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ error: 'Method not allowed' })
    }

    sweepExpired()
    sweepExpiredCodes()
    const ip = getClientIp(req)
    const { limited, retryAfterSeconds } = checkRateLimit(`unlock:${ip}`)
    if (limited) {
      res.setHeader('Retry-After', String(retryAfterSeconds))
      return res.status(429).json({ error: 'Too many attempts. Try again later.' })
    }

    const secret = process.env.DEV_GATE_SECRET
    const passphrase = process.env.DEV_GATE_PASSPHRASE
    if (!secret || !passphrase) {
      // Deliberately generic — the specific missing-env-var detail is useful in Vercel's
      // function logs (visible only to the project owner), not in a response any caller
      // can read.
      console.error('dev-unlock: DEV_GATE_SECRET or DEV_GATE_PASSPHRASE is not configured')
      return res.status(500).json({ error: 'Server misconfiguration' })
    }

    const rawSubmitted = req.body?.passphrase
    const submitted =
      typeof rawSubmitted === 'string' && rawSubmitted.length <= MAX_PASSPHRASE_LENGTH ? rawSubmitted : ''

    // constant-time comparison — a naive `===` leaks how many leading characters matched
    // via response timing, which matters for a passphrase check like this
    const a = Buffer.from(submitted)
    const b = Buffer.from(passphrase)
    const isPassphraseMatch = a.length === b.length && crypto.timingSafeEqual(a, b)

    // falls back to a minted one-time code (see dev-mint-code.js) only once the real
    // passphrase has already failed to match — consumeOneTimeCode deletes whatever it
    // looked up regardless of outcome, so there's no reason to call it on the success path
    const isOneTimeMatch = !isPassphraseMatch && consumeOneTimeCode(submitted)

    if (!isPassphraseMatch && !isOneTimeMatch) {
      return res.status(401).json({ error: 'Incorrect passphrase' })
    }

    const payload = JSON.stringify({ exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })
    const payloadB64 = Buffer.from(payload).toString('base64url')
    const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url')

    return res.status(200).json({ token: `${payloadB64}.${signature}` })
  } catch (err) {
    // never let an unexpected error's message/stack reach the client
    console.error('dev-unlock: unexpected error', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
}
