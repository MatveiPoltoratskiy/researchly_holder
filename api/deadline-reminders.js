import { checkRateLimit, getClientIp, rejectIfOversized, sweepExpired } from './_rateLimit.js'
import { getSupabaseAdmin } from './_supabaseAdmin.js'

// Backs cross-visit sync of a visitor's deadline-reminder map, keyed by the same
// anonymous, durable visitor_id used for saved_opportunities (src/lib/visitorId.js). One
// row per visitor_id in deadline_reminders — GET fetches it, POST replaces it wholesale.
// Same sole-write-path-through-service-role pattern as saved-opportunities.js, see
// supabase/deadline_reminders_setup.sql for the lockdown + constraints.

export const config = { api: { bodyParser: { sizeLimit: '32kb' } } }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ISO_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/
const ALLOWED_CALENDARS = new Set(['google', 'apple', 'outlook', 'ics'])
const MAX_ENTRIES = 500
const MAX_ID_LENGTH = 200
// Must stay <= the `deadline_reminders_map_size` check in
// supabase/deadline_reminders_setup.sql — same reasoning as saved-opportunities.js.
const MAX_SERIALIZED_MAP_LENGTH = 20000

function isValidVisitorId(value) {
  return typeof value === 'string' && UUID_RE.test(value)
}

function cleanRemindersMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const entries = Object.entries(value)
  if (entries.length > MAX_ENTRIES) return null
  const cleaned = {}
  for (const [id, entry] of entries) {
    if (typeof id !== 'string' || !id || id.length > MAX_ID_LENGTH) return null
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null
    if (entry.calendar !== null && !ALLOWED_CALENDARS.has(entry.calendar)) return null
    if (typeof entry.addedAt !== 'string' || !ISO_TIMESTAMP_RE.test(entry.addedAt)) return null
    cleaned[id] = { calendar: entry.calendar, addedAt: entry.addedAt }
  }
  if (JSON.stringify(cleaned).length > MAX_SERIALIZED_MAP_LENGTH) return null
  return cleaned
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST')
      return res.status(405).json({ error: 'Method not allowed' })
    }
    if (rejectIfOversized(req, res, 32 * 1024)) return

    sweepExpired()
    const ip = getClientIp(req)
    const { limited, retryAfterSeconds } = checkRateLimit(`deadline-reminders:${ip}`, {
      maxAttempts: 30,
      windowMs: 5 * 60 * 1000,
    })
    if (limited) {
      res.setHeader('Retry-After', String(retryAfterSeconds))
      return res.status(429).json({ error: 'Too many attempts. Try again later.' })
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      console.error('deadline-reminders: Supabase admin client not configured')
      return res.status(500).json({ error: 'Server misconfiguration' })
    }

    if (req.method === 'GET') {
      const visitorId = req.headers['x-visitor-id']
      if (!isValidVisitorId(visitorId)) {
        return res.status(400).json({ error: 'Invalid visitor id' })
      }

      const { data, error } = await admin
        .from('deadline_reminders')
        .select('reminder_map')
        .eq('visitor_id', visitorId)
        .maybeSingle()

      if (error) {
        console.error('deadline-reminders: select error', error)
        return res.status(500).json({ error: 'Something went wrong' })
      }
      return res.status(200).json({ remindersMap: data?.reminder_map || {} })
    }

    // POST — replace this visitor's reminder map wholesale
    const visitorId = req.body?.visitorId
    if (!isValidVisitorId(visitorId)) {
      return res.status(400).json({ error: 'Invalid visitor id' })
    }
    const remindersMap = cleanRemindersMap(req.body?.remindersMap)
    if (!remindersMap) {
      return res.status(400).json({ error: 'Invalid deadline reminders data' })
    }

    const { error } = await admin
      .from('deadline_reminders')
      .upsert({ visitor_id: visitorId, reminder_map: remindersMap, updated_at: new Date().toISOString() })

    if (error) {
      console.error('deadline-reminders: upsert error', error)
      return res.status(500).json({ error: 'Something went wrong' })
    }
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('deadline-reminders: unexpected error', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
}
