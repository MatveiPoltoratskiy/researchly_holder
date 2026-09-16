import { formatDeadlineLong, deadlineToDate } from './calendarEvent'

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

// null when applicationStatus isn't 'closed' (nothing to say here) — callers branch on that.
// 'exact'/'month' get their own wording per nextOpeningConfidence: a definitive official
// statement reads as "Reopens ..."; a hedged, contingent, or snippet-only-and-unverified one
// reads as "Expected to ..." instead, so the same precision never overstates how sure this is.
// Year-only precision always reads as "Expected" regardless of confidence — a bare year is
// inherently less actionable than a month, so it never gets the more confident phrasing.
export function nextOpeningLabel(o) {
  if (o.applicationStatus !== 'closed') return null
  const confirmed = o.nextOpeningConfidence === 'confirmed'
  switch (o.nextOpeningPrecision) {
    case 'exact':
      return confirmed
        ? `Reopens ${formatDeadlineLong(o.nextOpeningDate)}`
        : `Expected to open ${formatDeadlineLong(o.nextOpeningDate)}`
    case 'month':
      return confirmed
        ? `Reopens ${formatMonthYear(o.nextOpeningMonth, o.nextOpeningYear)}`
        : `Expected to reopen ${formatMonthYear(o.nextOpeningMonth, o.nextOpeningYear)}`
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

// The date a live countdown should count down to, if any, and whether that date is a real
// known day or an ESTIMATE derived from month-only information (a countdown built from one
// of these must say so — see useDeadlineCountdown.js, which is the only consumer of this).
// Deliberately conservative about which precisions even get a number: 'exact' (a real date)
// and 'month' (day 1 of that month — bounded ~30-day error, hedgeable with "~") both do;
// 'year' alone does NOT, because its error margin (up to 365 days) is wide enough that any
// day-count would read as far more precise than the source actually said — a bare year stays
// label-only, same as 'pattern'/'vague'/no-info. Same reasoning either way: never manufacture
// false precision the underlying fact doesn't support.
export function countdownTargetDate(o) {
  if (o.deadline) return { date: deadlineToDate(o.deadline), isEstimate: false }
  if (o.applicationStatus === 'closed') {
    if (o.nextOpeningPrecision === 'exact' && o.nextOpeningDate) {
      return { date: deadlineToDate(o.nextOpeningDate), isEstimate: false }
    }
    if (o.nextOpeningPrecision === 'month' && o.nextOpeningMonth && o.nextOpeningYear) {
      return { date: new Date(o.nextOpeningYear, o.nextOpeningMonth - 1, 1), isEstimate: true }
    }
  }
  return null
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
    return { url: o.nextOpeningSource, prefix: o.nextOpeningConfidence === 'confirmed' ? 'Per' : 'Anticipated per' }
  }
  return null
}
