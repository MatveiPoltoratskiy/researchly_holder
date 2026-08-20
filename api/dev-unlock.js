import crypto from 'node:crypto'

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
export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.DEV_GATE_SECRET
  const passphrase = process.env.DEV_GATE_PASSPHRASE
  if (!secret || !passphrase) {
    return res.status(500).json({ error: 'Server is missing DEV_GATE_SECRET or DEV_GATE_PASSPHRASE' })
  }

  const submitted = typeof req.body?.passphrase === 'string' ? req.body.passphrase : ''

  // constant-time comparison — a naive `===` leaks how many leading characters matched
  // via response timing, which matters for a passphrase check like this
  const a = Buffer.from(submitted)
  const b = Buffer.from(passphrase)
  const isMatch = a.length === b.length && crypto.timingSafeEqual(a, b)

  if (!isMatch) {
    return res.status(401).json({ error: 'Incorrect passphrase' })
  }

  const payload = JSON.stringify({ exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })
  const payloadB64 = Buffer.from(payload).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url')

  return res.status(200).json({ token: `${payloadB64}.${signature}` })
}
