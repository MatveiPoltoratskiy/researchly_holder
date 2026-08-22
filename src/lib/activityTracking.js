/**
 * Small, honest activity flags used only to auto-check roadmap milestones that have a
 * real, unambiguous corresponding action elsewhere in the app. Deliberately NOT a
 * general analytics/event system — two specific facts, nothing more:
 *   - has the student ever finished the interview
 *   - have they ever reached the opportunities list
 * Plain localStorage read/write (no React hook needed — these are set once from a
 * plain event handler, not rendered live anywhere on their own).
 */

const INTERVIEW_DONE_KEY = 'rsly_activity_interview_done'
const BROWSED_KEY = 'rsly_activity_browsed_opportunities'

export function markInterviewDone() {
  try {
    localStorage.setItem(INTERVIEW_DONE_KEY, '1')
  } catch {
    // best-effort only
  }
}

export function hasCompletedInterview() {
  try {
    return localStorage.getItem(INTERVIEW_DONE_KEY) === '1'
  } catch {
    return false
  }
}

export function markBrowsedOpportunities() {
  try {
    localStorage.setItem(BROWSED_KEY, '1')
  } catch {
    // best-effort only
  }
}

export function hasBrowsedOpportunities() {
  try {
    return localStorage.getItem(BROWSED_KEY) === '1'
  } catch {
    return false
  }
}
