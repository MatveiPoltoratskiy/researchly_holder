/**
 * Carries the field picked in ProfessorFieldModal over to the professor directory as a
 * one-shot sessionStorage handoff — same pattern as lib/interviewHandoff.js, since the
 * two live on different routes and the router only tracks a bare pathname (no query
 * string). Set right before navigating away from the shuffle screen, read once on the
 * directory's first render, then cleared — a direct visit to /professor-directory
 * (navbar, back button) should never inherit a stale filter from an earlier session.
 */

const KEY = 'researchly:professor-field'

export function setProfessorFieldHandoff(fieldId) {
  try {
    sessionStorage.setItem(KEY, fieldId)
  } catch {
    // sessionStorage unavailable (private mode, etc) — filter just won't carry over
  }
}

export function peekProfessorFieldHandoff() {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function clearProfessorFieldHandoff() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
