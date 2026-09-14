import { useCallback, useEffect, useRef } from 'react'
import { useLocalStorageState } from './storage'
import { getVisitorId } from './visitorId'

const STORAGE_KEY = 'rsly_deadline_reminders'
const SYNC_DEBOUNCE_MS = 1500

/** Which calendar a reminder was added through — purely informational, never used to
 *  reach back into a real calendar account (there is no OAuth integration here). */
export const REMINDER_CALENDARS = new Set(['google', 'apple', 'outlook', 'ics'])

/**
 * Deadline reminders live as a plain { [opportunityId]: { calendar, addedAt } } object in
 * localStorage, synced the same way as useSavedOpportunities (same anonymous, durable
 * visitor_id, same local-wins-on-conflict merge, same debounced background push) — a
 * second instance of the identical pattern for a second kind of per-visitor data, not a
 * new state-management system. The deadline DATE itself is never stored here: it's always
 * read live off CANADA_OPPORTUNITIES by id, so a corrected/changed deadline in the data
 * is reflected immediately everywhere a reminder is shown, with nothing to go stale.
 */
export function useDeadlineReminders() {
  const [remindersMap, setRemindersMap] = useLocalStorageState(STORAGE_KEY, {})
  const hasMergedServerCopy = useRef(false)
  const syncTimerRef = useRef(null)

  useEffect(() => {
    const visitorId = getVisitorId()
    if (!visitorId) return // localStorage unavailable — sync silently skipped

    let cancelled = false
    fetch('/api/deadline-reminders', { headers: { 'X-Visitor-Id': visitorId } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.remindersMap) return
        setRemindersMap((prev) => ({ ...data.remindersMap, ...prev }))
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

  useEffect(() => {
    if (!hasMergedServerCopy.current) return // don't push before the initial merge lands
    const visitorId = getVisitorId()
    if (!visitorId) return

    clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      fetch('/api/deadline-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, remindersMap }),
      }).catch(() => {})
    }, SYNC_DEBOUNCE_MS)

    return () => clearTimeout(syncTimerRef.current)
  }, [remindersMap])

  // idempotent by construction: adding an already-active id just overwrites its one
  // entry, so a duplicate click can never create a second reminder for the same id
  const add = useCallback(
    (id, calendar) => {
      setRemindersMap((prev) => ({
        ...prev,
        [id]: {
          calendar: REMINDER_CALENDARS.has(calendar) ? calendar : 'ics',
          addedAt: new Date().toISOString(),
        },
      }))
    },
    [setRemindersMap]
  )

  const remove = useCallback(
    (id) => {
      setRemindersMap((prev) => {
        if (!(id in prev)) return prev
        const next = { ...prev }
        delete next[id]
        return next
      })
    },
    [setRemindersMap]
  )

  return {
    remindersMap, // { [opportunityId]: { calendar, addedAt } }
    add,
    remove,
    has: (id) => Boolean(remindersMap[id]),
    totalReminders: Object.keys(remindersMap).length,
  }
}
