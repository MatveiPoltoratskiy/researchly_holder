// Thin wrapper around Serper.dev's Google-search API (google.serper.dev) — chosen over
// SerpAPI mainly because its REST shape is a single POST with no query-string juggling,
// and it has a usable free tier for occasional maintainer-run research passes like this.
// Swapping providers later only means rewriting this one function; nothing else in
// scripts/enrich-next-opening.mjs knows or cares which API backs `searchGoogle`.
//
// Needs SERPER_API_KEY in the environment (get one at https://serper.dev — free tier is
// enough for occasional runs). NEVER put this key in frontend code or commit it: it's read
// from process.env here, in a script that only ever runs on a maintainer's own machine or
// CI, the same trust boundary as the service-role key in api/_supabaseAdmin.js.
//
// Two guardrails so a research run can't quietly hammer the API or bill unexpectedly:
//   - an on-disk cache (scripts/.cache/search/), so re-running the enrichment script (e.g.
//     after fixing a bug) never re-spends a query on something already answered recently
//   - a fixed delay between live calls, well under Serper's documented rate limit

import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE_DIR = path.join(__dirname, '..', '.cache', 'search')
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // a week — long enough to make re-runs free, short enough not to work off stale search results for months
const MIN_DELAY_MS = 500

let lastCallAt = 0

function cacheKeyFor(query) {
  return createHash('sha256').update(query).digest('hex')
}

async function readCache(query) {
  try {
    const raw = await readFile(path.join(CACHE_DIR, `${cacheKeyFor(query)}.json`), 'utf8')
    const entry = JSON.parse(raw)
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) return null
    return entry.result
  } catch {
    return null // no cache entry, or unreadable — fall through to a live call
  }
}

async function writeCache(query, result) {
  await mkdir(CACHE_DIR, { recursive: true })
  const entry = { query, cachedAt: Date.now(), result }
  await writeFile(path.join(CACHE_DIR, `${cacheKeyFor(query)}.json`), JSON.stringify(entry, null, 2), 'utf8')
}

async function throttle() {
  const wait = MIN_DELAY_MS - (Date.now() - lastCallAt)
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
  lastCallAt = Date.now()
}

/**
 * Runs one Google search via Serper.dev. Returns { organic: [{ title, link, snippet }] } —
 * the caller (enrich-next-opening.mjs) is responsible for reading and judging the snippets;
 * this function's only job is "get me the results," not "decide what they mean."
 */
export async function searchGoogle(query) {
  const cached = await readCache(query)
  if (cached) return cached

  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) {
    throw new Error(
      'SERPER_API_KEY is not set. Get a key at https://serper.dev and run with ' +
        'SERPER_API_KEY=... node scripts/enrich-next-opening.mjs (or export it in your shell first).'
    )
  }

  await throttle()

  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: query }),
  })
  if (!res.ok) {
    throw new Error(`Serper search failed (${res.status} ${res.statusText}) for query: ${query}`)
  }
  const data = await res.json()
  const result = { organic: (data.organic || []).map((r) => ({ title: r.title, link: r.link, snippet: r.snippet })) }

  await writeCache(query, result)
  return result
}
