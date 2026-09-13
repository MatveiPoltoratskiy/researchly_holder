import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useLocalStorageState } from './storage'
import { getVisitorId } from './visitorId'

const STORAGE_KEY = 'rsly_saved_opportunities'
const SYNC_DEBOUNCE_MS = 1500

/** The pipeline a saved opportunity moves through — order matters, used for display. */
export const SAVE_STATUSES = [
  { id: 'saved', label: 'Saved' },
  { id: 'applied', label: 'Applied' },
]
export const DEFAULT_SAVE_STATUS = 'saved'
const SAVE_STATUS_IDS = new Set(SAVE_STATUSES.map((s) => s.id))

/**
 * Saved opportunities live as a plain { [opportunityId]: status } object in
 * localStorage — a real per-user table once there's a backend, but a flat map is the
 * honest shape for what this actually is today. Every consumer (the card's save
 * control, the My Opportunities page, the roadmap's auto-milestones) reads through this
 * one hook so they can never drift out of sync with each other.
 */
export function useSavedOpportunities() {
  const [savedMap, setSavedMap] = useLocalStorageState(STORAGE_KEY, {})
  const hasMergedServerCopy = useRef(false)
  const syncTimerRef = useRef(null)

  // One-time pull on mount: fold in anything the server has for this visitor_id that
  // isn't already in the local copy (local wins on conflicts — it's the more recent
  // truth for this browser). This is what makes the "durable" part durable, not just
  // localStorage, without ever letting a stale server copy clobber fresh local edits.
  useEffect(() => {
    const visitorId = getVisitorId()
    if (!visitorId) return // localStorage unavailable — sync silently skipped

    let cancelled = false
    fetch(`/api/saved-opportunities?visitorId=${encodeURIComponent(visitorId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.savedMap) return
        setSavedMap((prev) => {
          const merged = { ...data.savedMap, ...prev }
          return merged
        })
      })
      .catch(() => {}) // offline / server hiccup — local copy still works fine on its own
      .finally(() => {
        hasMergedServerCopy.current = true
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Background sync on every change, debounced — fire-and-forget, never blocks the UI
  // and never surfaces a failure (the local copy is what every consumer actually reads).
  useEffect(() => {
    if (!hasMergedServerCopy.current) return // don't push before the initial merge lands
    const visitorId = getVisitorId()
    if (!visitorId) return

    clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      fetch('/api/saved-opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, savedMap }),
      }).catch(() => {})
    }, SYNC_DEBOUNCE_MS)

    return () => clearTimeout(syncTimerRef.current)
  }, [savedMap])

  const save = useCallback(
    (id, status = DEFAULT_SAVE_STATUS) => {
      setSavedMap((prev) => ({ ...prev, [id]: SAVE_STATUS_IDS.has(status) ? status : DEFAULT_SAVE_STATUS }))
    },
    [setSavedMap]
  )

  const setStatus = useCallback(
    (id, status) => {
      if (!SAVE_STATUS_IDS.has(status)) return
      setSavedMap((prev) => (prev[id] ? { ...prev, [id]: status } : prev))
    },
    [setSavedMap]
  )

  const remove = useCallback(
    (id) => {
      setSavedMap((prev) => {
        if (!(id in prev)) return prev
        const next = { ...prev }
        delete next[id]
        return next
      })
    },
    [setSavedMap]
  )

  const toggle = useCallback(
    (id) => {
      setSavedMap((prev) => {
        if (prev[id]) {
          const next = { ...prev }
          delete next[id]
          return next
        }
        return { ...prev, [id]: DEFAULT_SAVE_STATUS }
      })
    },
    [setSavedMap]
  )

  const countsByStatus = useMemo(() => {
    const counts = Object.fromEntries(SAVE_STATUSES.map((s) => [s.id, 0]))
    for (const status of Object.values(savedMap)) {
      if (status in counts) counts[status] += 1
    }
    return counts
  }, [savedMap])

  return {
    savedMap, // { [opportunityId]: statusId }
    save,
    setStatus,
    remove,
    toggle,
    isSaved: (id) => Boolean(savedMap[id]),
    statusOf: (id) => savedMap[id] || null,
    countsByStatus,
    totalSaved: Object.keys(savedMap).length,
  }
}
