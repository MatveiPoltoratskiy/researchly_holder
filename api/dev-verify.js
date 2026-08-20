import crypto from 'node:crypto'

// Verifies a token minted by dev-unlock.js. The client cannot forge a valid token
// itself — it never has DEV_GATE_SECRET — so this is a real server-side check, not a
// client-side flag that anyone can flip in devtools.
export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.DEV_GATE_SECRET
  if (!secret) {
    return res.status(500).json({ error: 'Server is missing DEV_GATE_SECRET' })
  }

  const token = typeof req.body?.token === 'string' ? req.body.token : ''
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

  try {
    const { exp } = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
    return res.status(200).json({ valid: typeof exp === 'number' && Date.now() < exp })
  } catch {
    return res.status(200).json({ valid: false })
  }
}
