import { checkRateLimit, getClientIp, rejectIfOversized, sweepExpired } from './_rateLimit.js'
import { getSupabaseAdmin } from './_supabaseAdmin.js'

// Backs the anonymous "How are we doing?" prompt on the opportunities page. No email or
// name collected by design — just an optional rating and an optional note. Same
// sole-write-path pattern as submit-contact.js once supabase/feedback_setup.sql has run.

export const config = { api: { bodyParser: { sizeLimit: '8kb' } } }

const ALLOWED_RATINGS = new Set(['very-bad', 'bad', 'okay', 'good', 'great'])
const MAX_NOTE_LENGTH = 2000

function cleanNote(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.length <= MAX_NOTE_LENGTH ? trimmed : trimmed.slice(0, MAX_NOTE_LENGTH)
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ error: 'Method not allowed' })
    }
    if (rejectIfOversized(req, res, 8 * 1024)) return

    sweepExpired()
    const ip = getClientIp(req)
    const { limited, retryAfterSeconds } = checkRateLimit(`feedback:${ip}`, { maxAttempts: 5, windowMs: 10 * 60 * 1000 })
    if (limited) {
      res.setHeader('Retry-After', String(retryAfterSeconds))
      return res.status(429).json({ error: 'Too many attempts. Try again later.' })
    }

    const rawRating = req.body?.rating
    const rating = typeof rawRating === 'string' && ALLOWED_RATINGS.has(rawRating) ? rawRating : null
    const note = cleanNote(req.body?.note)

    if (!rating && !note) {
      return res.status(400).json({ error: 'Add a rating or a note first.' })
    }

    // honeypot — see .hp-field in index.css for the full explanation
    const hp = req.body?.hp
    if (typeof hp === 'string' && hp.trim()) {
      return res.status(200).json({ ok: true })
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      console.error('submit-feedback: Supabase admin client not configured')
      return res.status(500).json({ error: 'Server misconfiguration' })
    }

    const { error } = await admin.from('feedback').insert({ rating, note })

    if (!error) {
      return res.status(200).json({ ok: true })
    }

    console.error('submit-feedback: insert error', error)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  } catch (err) {
    console.error('submit-feedback: unexpected error', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
}
