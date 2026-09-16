import { formatDeadlineLong } from './calendarEvent'

// Single source of truth for "what does the deadline cell say" — used by the opportunity
// card, its detail modal, and the Deadlines tab, so the three never show contradictory text
// for the same record. Mirrors the precedence a human reading the data would use:
//   1. a real deadline always wins (most specific, most actionable fact)
//   2. explicit rolling admissions
//   3. explicitly closed, with whatever the site said about reopening (may be nothing)
//   4. otherwise, we just don't know either way

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function formatMonthName(month) {
  return MONTH_NAMES[month - 1] || ''
}

export function formatMonthYear(month, year) {
  return `${formatMonthName(month)} ${year}`
}

// null when applicationStatus isn't 'closed' (nothing to say here) — callers branch on that
export function nextOpeningLabel(o) {
  if (o.applicationStatus !== 'closed') return null
  switch (o.nextOpeningPrecision) {
    case 'exact':
      return `Opens ${formatDeadlineLong(o.nextOpeningDate)}`
    case 'month':
      return `Expected to open ${formatMonthYear(o.nextOpeningMonth, o.nextOpeningYear)}`
    case 'year':
      return `Expected to reopen in ${o.nextOpeningYear}`
    case 'pattern':
      return `Typically opens ${formatMonthName(o.nextOpeningMonth)}`
    case 'vague':
      return 'Expected to reopen next year'
    default:
      return 'Next opening not confirmed'
  }
}

// the label for the deadline-ish cell on the card/modal/Deadlines tab — always returns a
// non-empty string now (never silently omitted), so a viewer always knows what's known
export function deadlineCellLabel(o) {
  if (o.deadline) return formatDeadlineLong(o.deadline)
  if (o.deadlineStatus === 'rolling') return 'Rolling admissions'
  const opening = nextOpeningLabel(o)
  if (opening) return opening
  return 'Deadline not confirmed'
}

// { url, label } for the small "verified via ___" caption, or null when there's nothing to
// link to — kept separate from deadlineCellLabel so callers can render the caption as a link
export function deadlineCellSource(o) {
  if (o.deadline && o.deadlineStatus === 'confirmed' && o.deadlineSource) {
    return { url: o.deadlineSource, prefix: 'Verified via' }
  }
  if (o.deadlineStatus === 'rolling' && o.deadlineSource) {
    return { url: o.deadlineSource, prefix: 'Rolling admissions — confirmed via' }
  }
  if (o.applicationStatus === 'closed' && o.nextOpeningSource) {
    return { url: o.nextOpeningSource, prefix: 'Per' }
  }
  return null
}
