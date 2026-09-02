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

/**
 * Same shape as useLocalStorageState, but backed by sessionStorage — survives a page
 * refresh/reload in the same tab (so a filter selection isn't lost by an accidental F5),
 * but clears once the tab/window actually closes, unlike localStorage which would keep
 * a filter selection around indefinitely. Takes optional serialize/deserialize for state
 * that isn't plain-JSON-safe (e.g. a Set, which JSON has no native representation for).
 */
export function useSessionStorageState(key, initialValue, { serialize = JSON.stringify, deserialize = JSON.parse } = {}) {
  const [value, setValue] = useState(() => {
    try {
      const raw = sessionStorage.getItem(key)
      if (raw != null) return deserialize(raw)
    } catch {
      // fall through to initialValue below — a corrupt/foreign value shouldn't crash the page
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue
  })

  useEffect(() => {
    try {
      sessionStorage.setItem(key, serialize(value))
    } catch {
      // sessionStorage unavailable — state still works for the current page load, it
      // just won't survive a refresh
    }
    // serialize deliberately excluded — callers often pass an inline function, and it's
    // conceptually static for a given key, not something that should re-trigger the write
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value])

  return [value, setValue]
}
