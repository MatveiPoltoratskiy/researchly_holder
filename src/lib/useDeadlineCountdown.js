import { useEffect, useState } from 'react'
import { daysUntil } from './calendarEvent'

function computeCountdown(iso) {
  const diffDays = daysUntil(iso)
  if (diffDays === null) return { label: 'Not confirmed', diffDays: null, isPast: false, cls: 'is-unknown' }
  if (diffDays < 0) return { label: 'Deadline passed', diffDays, isPast: true, cls: 'is-past' }
  if (diffDays === 0) return { label: 'Today', diffDays, isPast: false, cls: 'is-urgent' }
  if (diffDays === 1) return { label: 'Tomorrow', diffDays, isPast: false, cls: 'is-urgent' }
  if (diffDays <= 7) return { label: `${diffDays} days left`, diffDays, isPast: false, cls: 'is-soon' }
  return { label: `${diffDays} days left`, diffDays, isPast: false, cls: '' }
}

/**
 * Live countdown to a "YYYY-MM-DD" deadline. Deliberately date-only math (see
 * daysUntil/deadlineToDate in calendarEvent.js) so a visitor in a negative UTC offset
 * never sees the deadline read one day earlier than it actually is. Recomputes once a
 * minute — plenty for a label whose smallest unit is a whole day.
 */
export function useDeadlineCountdown(iso) {
  const [countdown, setCountdown] = useState(() => computeCountdown(iso))

  useEffect(() => {
    setCountdown(computeCountdown(iso))
    const id = setInterval(() => setCountdown(computeCountdown(iso)), 60 * 1000)
    return () => clearInterval(id)
  }, [iso])

  return countdown
}
