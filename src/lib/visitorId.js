const STORAGE_KEY = 'rsly_visitor_id'

/**
 * A durable, anonymous per-browser identifier — no login, no email. Generated once with
 * crypto.randomUUID() and cached in localStorage forever after (no expiry: unlike the
 * filter-persistence key, losing this would look like your saved opportunities vanished).
 * It's high-entropy but NOT a real access-control mechanism — anyone who obtains this
 * exact value could read/write that visitor's saved-opportunities row, the same tradeoff
 * as any bearer token without an auth layer behind it. Good enough for "remember my
 * saved programs across devices/sessions is not a goal here, across a return visit on
 * the same browser is."
 */
export function getVisitorId() {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, id)
    return id
  } catch {
    return null // localStorage unavailable — caller should just skip server sync
  }
}
