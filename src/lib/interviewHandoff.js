/**
 * Carries the interview's answers over to the opportunity explorer as a one-shot
 * sessionStorage handoff, since the two live on different routes/components and the
 * router itself only tracks a bare pathname (no query string parsing). Set right before
 * navigating away from the matches screen, read once on the explorer's first render,
 * then cleared — a direct visit to /opportunities (navbar, back button) should never
 * inherit a stale filter set from an earlier interview.
 */

const KEY = 'researchly:interview-filters'

export function setInterviewFilters(filters) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(filters))
  } catch {
    // sessionStorage unavailable (private mode, etc) — filters just won't carry over
  }
}

export function peekInterviewFilters() {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearInterviewFilters() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
