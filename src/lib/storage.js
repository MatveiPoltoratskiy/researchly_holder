import { useEffect, useState } from 'react'

/**
 * Shared localStorage-backed state hook for everything in the retention-features layer
 * (roadmap progress, saved-opportunities pipeline, goal, interests). All client-side for
 * now — no backend exists for this prototype yet — but every consumer only ever sees a
 * plain `[value, setValue]` pair, so swapping the underlying persistence for a real
 * per-account API later is a one-file change, not a rewrite of every feature that reads
 * this data.
 */
export function useLocalStorageState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw != null ? JSON.parse(raw) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // localStorage unavailable (private browsing, storage full, etc) — state still
      // works for the current page load, it just won't persist across a reload
    }
  }, [key, value])

  return [value, setValue]
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Same shape as useLocalStorageState, but the stored value carries its own save
 * timestamp and is treated as expired (silently falling back to initialValue, and
 * deleting the stale entry) once older than ttlMs — a self-enforced retention cap, so
 * "remember this visitor's filters for next time" has a built-in expiry instead of
 * quietly meaning "forever." Every entry is wrapped as {v: <serialized value>, t: <saved-
 * at ms>} under the hood; callers still only ever see the plain value, same as
 * useLocalStorageState. Used for the opportunity explorer's own filter selections (the
 * one thing this app currently persists across a visitor's actual return visits, not just
 * a reload) — everything else already using useLocalStorageState (saved opportunities,
 * roadmap progress) is deliberately left on the no-expiry hook, since discarding someone's
 * bookmarked programs after a month would be a much worse surprise than re-defaulting a
 * filter checkbox.
 */
export function useLocalStorageStateWithExpiry(
  key,
  initialValue,
  { serialize = JSON.stringify, deserialize = JSON.parse, ttlMs = THIRTY_DAYS_MS } = {}
) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw != null) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed.t === 'number' && Date.now() - parsed.t <= ttlMs) {
          return deserialize(parsed.v)
        }
        localStorage.removeItem(key) // expired or malformed — don't leave it sitting around
      }
    } catch {
      // corrupt/foreign value or localStorage unavailable — fall through to initialValue
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify({ v: serialize(value), t: Date.now() }))
    } catch {
      // localStorage unavailable (private browsing, storage full, etc) — state still
      // works for the current page load, it just won't persist
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value])

  return [value, setValue]
}
