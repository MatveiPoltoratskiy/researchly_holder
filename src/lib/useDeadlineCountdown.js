import { useEffect, useState } from 'react'
import { countdownTargetDate } from './deadlineStatus'

const DAY_MS = 24 * 60 * 60 * 1000

function computeCountdown(o) {
  const target = o ? countdownTargetDate(o) : null
  if (!target) return { label: 'Not confirmed', diffDays: null, isPast: false, isEstimate: false, cls: 'is-unknown' }

  const { date, isEstimate } = target
  const now = new Date()
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.round((date - todayMidnight) / DAY_MS)
  const tilde = isEstimate ? '~' : ''
  const suffix = isEstimate ? 'until expected reopening' : 'left'

  if (diffDays < 0) {
    return {
      label: isEstimate ? 'Expected reopening has passed' : 'Deadline passed',
      diffDays, isPast: true, isEstimate, cls: 'is-past',
    }
  }
  if (diffDays === 0) return { label: `${tilde}Today`, diffDays, isPast: false, isEstimate, cls: 'is-urgent' }
  if (diffDays === 1) return { label: `${tilde}Tomorrow`, diffDays, isPast: false, isEstimate, cls: 'is-urgent' }
  if (diffDays <= 7) return { label: `${tilde}${diffDays} days ${suffix}`, diffDays, isPast: false, isEstimate, cls: 'is-soon' }
  return { label: `${tilde}${diffDays} days ${suffix}`, diffDays, isPast: false, isEstimate, cls: '' }
}

/**
 * Live countdown for one opportunity — to its real deadline when it has one, otherwise to
 * an ESTIMATED reopening date when only a month/year is known (day 1 of that month; see
 * countdownTargetDate in deadlineStatus.js for exactly which precisions qualify and why).
 * The "~" prefix and "until expected reopening" wording only ever appear on an estimate —
 * never on a real deadline — so an approximation can't be mistaken for a confirmed date.
 * Deliberately date-only math (see deadlineToDate in calendarEvent.js) so a visitor in a
 * negative UTC offset never sees the date read one day earlier than it actually is.
 * Recomputes once a minute — plenty for a label whose smallest unit is a whole day.
 */
export function useDeadlineCountdown(o) {
  const { deadline, applicationStatus, nextOpeningPrecision, nextOpeningDate, nextOpeningMonth, nextOpeningYear } = o || {}
  const [countdown, setCountdown] = useState(() => computeCountdown(o))

  useEffect(() => {
    setCountdown(computeCountdown(o))
    const id = setInterval(() => setCountdown(computeCountdown(o)), 60 * 1000)
    return () => clearInterval(id)
    // o itself isn't a stable dependency (callers may pass a fresh object each render), so
    // depend on the actual primitive fields the countdown is derived from instead
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline, applicationStatus, nextOpeningPrecision, nextOpeningDate, nextOpeningMonth, nextOpeningYear])

  return countdown
}
