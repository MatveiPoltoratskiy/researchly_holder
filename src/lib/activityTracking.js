/**
 * Small, honest activity flags used only to auto-check roadmap milestones that have a
 * real, unambiguous corresponding action elsewhere in the app. Deliberately NOT a
 * general analytics/event system — three specific facts, nothing more:
 *   - has the student ever finished the interview
 *   - have they ever reached the opportunities list
 *   - which individual opportunities have they actually opened the detail view for
 * Plain localStorage read/write (no React hook needed — these are set once from a
 * plain event handler, not rendered live anywhere on their own).
 */

const INTERVIEW_DONE_KEY = 'rsly_activity_interview_done'
const BROWSED_KEY = 'rsly_activity_browsed_opportunities'
const VIEWED_KEY = 'rsly_activity_viewed_opportunity_ids'

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

export function markOpportunityViewed(id) {
  try {
    const raw = localStorage.getItem(VIEWED_KEY)
    const ids = raw ? JSON.parse(raw) : []
    if (!ids.includes(id)) {
      ids.push(id)
      localStorage.setItem(VIEWED_KEY, JSON.stringify(ids))
    }
  } catch {
    // best-effort only
  }
}

export function viewedOpportunityCount() {
  try {
    const raw = localStorage.getItem(VIEWED_KEY)
    return raw ? JSON.parse(raw).length : 0
  } catch {
    return 0
  }
}
