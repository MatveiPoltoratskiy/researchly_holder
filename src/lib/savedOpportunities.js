import { useCallback, useMemo } from 'react'
import { useLocalStorageState } from './storage'

const STORAGE_KEY = 'rsly_saved_opportunities'

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
