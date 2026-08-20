import crypto from 'node:crypto'
import { checkRateLimit, getClientIp, sweepExpired } from './_rateLimit.js'
import { mintOneTimeCode, sweepExpiredCodes } from './_oneTimeCodes.js'

// Lets someone who already knows DEV_GATE_PASSPHRASE mint a single-use code to hand off
// (e.g. to a cofounder logging in from a phone) without reading out the real passphrase
// again. Gated by that same passphrase — otherwise anyone who finds this route could
// mint themselves unlimited codes and the whole gate would mean nothing.

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
    const { limited, retryAfterSeconds } = checkRateLimit(`mint:${ip}`, { maxAttempts: 5, windowMs: 5 * 60 * 1000 })
    if (limited) {
      res.setHeader('Retry-After', String(retryAfterSeconds))
      return res.status(429).json({ error: 'Too many attempts. Try again later.' })
    }

    const passphrase = process.env.DEV_GATE_PASSPHRASE
    if (!passphrase) {
      console.error('dev-mint-code: DEV_GATE_PASSPHRASE is not configured')
      return res.status(500).json({ error: 'Server misconfiguration' })
    }

    const rawSubmitted = req.body?.passphrase
    const submitted =
      typeof rawSubmitted === 'string' && rawSubmitted.length <= MAX_PASSPHRASE_LENGTH ? rawSubmitted : ''

    const a = Buffer.from(submitted)
    const b = Buffer.from(passphrase)
    const isMatch = a.length === b.length && crypto.timingSafeEqual(a, b)
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect passphrase' })
    }

    return res.status(200).json({ code: mintOneTimeCode() })
  } catch (err) {
    console.error('dev-mint-code: unexpected error', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
}
