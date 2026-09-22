import { useEffect, useState } from 'react'
import { countdownTargetDate } from './deadlineStatus'

const DAY_MS = 24 * 60 * 60 * 1000

function computeCountdown(o) {
  const target = o ? countdownTargetDate(o) : null
  if (!target) return { label: 'Not confirmed', diffDays: null, isPast: false, isEstimate: false, cls: 'is-unknown' }

  const { date, isEstimate, kind, confidence } = target
  const now = new Date()
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.round((date - todayMidnight) / DAY_MS)

  // wording tracks CONFIDENCE (was this reopening stated definitively, or hedged/unverified?),
  // not date precision — a confirmed month-only reopening still reads as "until reopening",
  // not "until expected reopening"; only the underlying day-1-of-month math (isEstimate)
  // differs for that case, and the date label above this one already communicates that it's
  // a month, not an exact day, so the countdown doesn't need its own "~"-style marker on top
  const isDeadline = kind === 'deadline'
  const confirmed = confidence === 'confirmed'
  const suffix = isDeadline ? 'left' : confirmed ? 'until reopening' : 'until expected reopening'

  if (diffDays < 0) {
    const label = isDeadline ? 'Deadline passed' : confirmed ? 'Reopening date has passed' : 'Expected reopening has passed'
    return { label, diffDays, isPast: true, isEstimate, cls: 'is-past' }
  }
  if (diffDays === 0) return { label: isDeadline ? 'Today' : 'Reopens today', diffDays, isPast: false, isEstimate, cls: 'is-urgent' }
  if (diffDays === 1) return { label: isDeadline ? 'Tomorrow' : 'Reopens tomorrow', diffDays, isPast: false, isEstimate, cls: 'is-urgent' }
  if (diffDays <= 7) return { label: `${diffDays} days ${suffix}`, diffDays, isPast: false, isEstimate, cls: 'is-soon' }
  return { label: `${diffDays} days ${suffix}`, diffDays, isPast: false, isEstimate, cls: '' }
}

/**
 * Live countdown for one opportunity — to its real deadline when it has one, otherwise to
 * an ESTIMATED reopening date when only a month/year is known (day 1 of that month; see
 * countdownTargetDate in deadlineStatus.js for exactly which precisions qualify and why).
 * Wording ("until reopening" vs "until expected reopening") tracks confidence, never
 * overstating a hedged/unverified reopening as a settled one.
 * Deliberately date-only math (see deadlineToDate in calendarEvent.js) so a visitor in a
 * negative UTC offset never sees the date read one day earlier than it actually is.
 * Recomputes once a minute — plenty for a label whose smallest unit is a whole day.
 */
export function useDeadlineCountdown(o) {
  const { deadline, applicationStatus, nextOpeningPrecision, nextOpeningDate, nextOpeningMonth, nextOpeningYear, nextOpeningConfidence } = o || {}
  const [countdown, setCountdown] = useState(() => computeCountdown(o))

  useEffect(() => {
    setCountdown(computeCountdown(o))
    const id = setInterval(() => setCountdown(computeCountdown(o)), 60 * 1000)
    return () => clearInterval(id)
    // o itself isn't a stable dependency (callers may pass a fresh object each render), so
    // depend on the actual primitive fields the countdown is derived from instead
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline, applicationStatus, nextOpeningPrecision, nextOpeningDate, nextOpeningMonth, nextOpeningYear, nextOpeningConfidence])

  return countdown
}
