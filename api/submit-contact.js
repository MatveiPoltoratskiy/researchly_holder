import { checkRateLimit, getClientIp, rejectIfOversized, sweepExpired } from './_rateLimit.js'
import { getSupabaseAdmin } from './_supabaseAdmin.js'

// The sole write path for contact_messages once supabase/lockdown.sql has been run (see
// that file) — the anon key can no longer INSERT directly, so this rate-limited,
// server-validated endpoint, using the service-role key (_supabaseAdmin.js), is it.

// Caps how much of the body Vercel's Node runtime will even parse. Generous relative to
// the actual field limits below (name/email/subject/message add up to well under this)
// to leave room for multi-byte UTF-8 text, while still far below the platform default.
export const config = { api: { bodyParser: { sizeLimit: '32kb' } } }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_EMAIL_LENGTH = 320
const MAX_NAME_LENGTH = 200
const MAX_SUBJECT_LENGTH = 200
const MAX_MESSAGE_LENGTH = 5000

function cleanString(value, maxLength) {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  return trimmed.length <= maxLength ? trimmed : ''
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ error: 'Method not allowed' })
    }
    if (rejectIfOversized(req, res, 32 * 1024)) return

    sweepExpired()
    const ip = getClientIp(req)
    const { limited, retryAfterSeconds } = checkRateLimit(`contact:${ip}`, { maxAttempts: 5, windowMs: 10 * 60 * 1000 })
    if (limited) {
      res.setHeader('Retry-After', String(retryAfterSeconds))
      return res.status(429).json({ error: 'Too many attempts. Try again later.' })
    }

    const name = cleanString(req.body?.name, MAX_NAME_LENGTH)
    const email = cleanString(req.body?.email, MAX_EMAIL_LENGTH)
    const subject = cleanString(req.body?.subject, MAX_SUBJECT_LENGTH)
    const message = cleanString(req.body?.message, MAX_MESSAGE_LENGTH)

    if (!name || !subject || !message) {
      return res.status(400).json({ error: 'Please fill out every field.' })
    }
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' })
    }

    const hp = req.body?.hp
    if (typeof hp === 'string' && hp.trim()) {
      return res.status(200).json({ ok: true })
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      console.error('submit-contact: Supabase admin client not configured')
      return res.status(500).json({ error: 'Server misconfiguration' })
    }

    const { error } = await admin.from('contact_messages').insert({ name, email, subject, message })

    if (!error) {
      return res.status(200).json({ ok: true })
    }

    console.error('submit-contact: insert error', error)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  } catch (err) {
    console.error('submit-contact: unexpected error', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
}
