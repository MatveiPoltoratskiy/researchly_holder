import { checkRateLimit, getClientIp, rejectIfOversized, sweepExpired } from './_rateLimit.js'
import { getSupabaseAdmin } from './_supabaseAdmin.js'

// Backs cross-visit sync of a visitor's saved-opportunities map, keyed by the anonymous,
// durable visitor_id from src/lib/visitorId.js (no login). One row per visitor_id in
// saved_opportunities — GET fetches it, POST replaces it wholesale (the client always
// sends its full current map, same as how it already treats localStorage as the source
// of truth). Same sole-write-path-through-service-role pattern as submit-feedback.js,
// see supabase/saved_opportunities_setup.sql for the lockdown + constraints.

export const config = { api: { bodyParser: { sizeLimit: '32kb' } } }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_STATUSES = new Set(['saved', 'applied'])
const MAX_ENTRIES = 500
const MAX_ID_LENGTH = 200
// Must stay <= the `saved_opportunities_map_size` check in
// supabase/saved_opportunities_setup.sql — validating against the same number here means
// a payload that passes this check can never fail as a surprise 500 at the DB constraint.
const MAX_SERIALIZED_MAP_LENGTH = 20000

function isValidVisitorId(value) {
  return typeof value === 'string' && UUID_RE.test(value)
}

function cleanSavedMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const entries = Object.entries(value)
  if (entries.length > MAX_ENTRIES) return null
  const cleaned = {}
  for (const [id, status] of entries) {
    if (typeof id !== 'string' || !id || id.length > MAX_ID_LENGTH) return null
    if (!ALLOWED_STATUSES.has(status)) return null
    cleaned[id] = status
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
    const { limited, retryAfterSeconds } = checkRateLimit(`saved-opps:${ip}`, {
      maxAttempts: 30,
      windowMs: 5 * 60 * 1000,
    })
    if (limited) {
      res.setHeader('Retry-After', String(retryAfterSeconds))
      return res.status(429).json({ error: 'Too many attempts. Try again later.' })
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      console.error('saved-opportunities: Supabase admin client not configured')
      return res.status(500).json({ error: 'Server misconfiguration' })
    }

    if (req.method === 'GET') {
      // Read from a header, not a query param — a query string is the one place this
      // bearer-token-like id could end up sitting in Vercel's access logs or a browser's
      // own history, both wider exposure than a request header for no benefit.
      const visitorId = req.headers['x-visitor-id']
      if (!isValidVisitorId(visitorId)) {
        return res.status(400).json({ error: 'Invalid visitor id' })
      }

      const { data, error } = await admin
        .from('saved_opportunities')
        .select('saved_map')
        .eq('visitor_id', visitorId)
        .maybeSingle()

      if (error) {
        console.error('saved-opportunities: select error', error)
        return res.status(500).json({ error: 'Something went wrong' })
      }
      return res.status(200).json({ savedMap: data?.saved_map || {} })
    }

    // POST — replace this visitor's saved map wholesale
    const visitorId = req.body?.visitorId
    if (!isValidVisitorId(visitorId)) {
      return res.status(400).json({ error: 'Invalid visitor id' })
    }
    const savedMap = cleanSavedMap(req.body?.savedMap)
    if (!savedMap) {
      return res.status(400).json({ error: 'Invalid saved opportunities data' })
    }

    const { error } = await admin
      .from('saved_opportunities')
      .upsert({ visitor_id: visitorId, saved_map: savedMap, updated_at: new Date().toISOString() })

    if (error) {
      console.error('saved-opportunities: upsert error', error)
      return res.status(500).json({ error: 'Something went wrong' })
    }
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('saved-opportunities: unexpected error', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
}
