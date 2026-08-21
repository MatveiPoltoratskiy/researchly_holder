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
