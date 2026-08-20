import { checkRateLimit, getClientIp, sweepExpired } from './_rateLimit.js'
import { getSupabaseAdmin } from './_supabaseAdmin.js'

// The waitlist form's only write path once supabase/lockdown.sql has been run (see that
// file) — the anon key can no longer INSERT into `waitlist` directly, so this endpoint,
// with its rate limit and server-side validation, is the sole way a row gets created.
// Generous limit (10 / 10 min per IP): a real visitor submits once, maybe retries after a
// typo; a script trying to flood the table with fake signups hits the wall almost
// immediately instead.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_EMAIL_LENGTH = 320 // RFC 5321 upper bound

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ error: 'Method not allowed' })
    }

    sweepExpired()
    const ip = getClientIp(req)
    const { limited, retryAfterSeconds } = checkRateLimit(`waitlist:${ip}`, { maxAttempts: 10, windowMs: 10 * 60 * 1000 })
    if (limited) {
      res.setHeader('Retry-After', String(retryAfterSeconds))
      return res.status(429).json({ error: 'Too many attempts. Try again later.' })
    }

    const rawEmail = req.body?.email
    const email = typeof rawEmail === 'string' ? rawEmail.trim() : ''
    if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' })
    }

    // honeypot — a real visitor never sees or fills this field (see Waitlist.jsx). A
    // non-empty value means "pretend it worked" so a bot doesn't learn to adapt, but skip
    // the actual write. Checked server-side now (not just client-side) since this is the
    // endpoint a bot would have to hit directly to bypass the UI at all.
    const hp = req.body?.hp
    if (typeof hp === 'string' && hp.trim()) {
      return res.status(200).json({ ok: true, alreadyRegistered: false })
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      console.error('submit-waitlist: Supabase admin client not configured')
      return res.status(500).json({ error: 'Server misconfiguration' })
    }

    const { error } = await admin.from('waitlist').insert({ email })

    if (!error) {
      return res.status(200).json({ ok: true, alreadyRegistered: false })
    }
    if (error.code === '23505') {
      return res.status(200).json({ ok: true, alreadyRegistered: true })
    }

    console.error('submit-waitlist: insert error', error)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  } catch (err) {
    console.error('submit-waitlist: unexpected error', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
}
