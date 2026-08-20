import crypto from 'node:crypto'
import { checkRateLimit, getClientIp, sweepExpired } from './_rateLimit.js'

// Verifies a token minted by dev-unlock.js. The client cannot forge a valid token
// itself — it never has DEV_GATE_SECRET — so this is a real server-side check, not a
// client-side flag that anyone can flip in devtools.

const MAX_TOKEN_LENGTH = 512

export default function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ error: 'Method not allowed' })
    }

    sweepExpired()
    const ip = getClientIp(req)
    // much looser than dev-unlock's limit — this fires on every page load of a gated
    // route for a legitimately unlocked visitor, not just on explicit unlock attempts,
    // so it only needs to catch genuine abuse (e.g. a scripted hammering loop), not slow
    // down normal navigation between /interview and /opportunities
    const { limited, retryAfterSeconds } = checkRateLimit(`verify:${ip}`, { maxAttempts: 60, windowMs: 5 * 60 * 1000 })
    if (limited) {
      res.setHeader('Retry-After', String(retryAfterSeconds))
      return res.status(429).json({ valid: false })
    }

    const secret = process.env.DEV_GATE_SECRET
    if (!secret) {
      console.error('dev-verify: DEV_GATE_SECRET is not configured')
      return res.status(200).json({ valid: false })
    }

    const rawToken = req.body?.token
    const token = typeof rawToken === 'string' && rawToken.length <= MAX_TOKEN_LENGTH ? rawToken : ''
    const [payloadB64, signature] = token.split('.')
    if (!payloadB64 || !signature) {
      return res.status(200).json({ valid: false })
    }

    const expectedSignature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url')
    const a = Buffer.from(signature)
    const b = Buffer.from(expectedSignature)
    const signatureOk = a.length === b.length && crypto.timingSafeEqual(a, b)
    if (!signatureOk) {
      return res.status(200).json({ valid: false })
    }

    const { exp } = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
    return res.status(200).json({ valid: typeof exp === 'number' && Date.now() < exp })
  } catch (err) {
    console.error('dev-verify: unexpected error', err)
    return res.status(200).json({ valid: false })
  }
}
