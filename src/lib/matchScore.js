import { distanceKm, FIELD_TO_FOCUS, scoreOpportunity } from './matchOpportunities'
import { GOAL_BY_ID } from './userGoal'

/**
 * The card-level "94% match" score — separate from matchOpportunities.js (which powers
 * the interview's own matches screen and the "Best for your interests & location" sort).
 * This one is explicitly tied to the profile a student builds on the opportunities page
 * itself: up to 3 chosen interests, their goal, and whatever the interview/geolocation
 * already told us about level and location. Weights are plain numbers on purpose — the
 * brief calls for "easy to modify" over anything clever.
 */
export const MATCH_WEIGHTS = {
  interest: 30,
  eligibility: 25,
  location: 15,
  type: 15,
  goal: 15,
}

const FOCUS_LABEL = {
  'pre-med': 'Pre-Med',
  biology: 'Biology',
  chemistry: 'Chemistry',
  physics: 'Physics',
  neuroscience: 'Neuroscience',
}

function levelRangeText(levels) {
  const hsGrades = levels.filter((l) => l.startsWith('hs-')).map((l) => l.split('-')[1])
  const ugYears = levels.filter((l) => l.startsWith('ugrad-')).map((l) => l.split('-')[1])
  const parts = []
  if (hsGrades.length) parts.push(`Grade ${hsGrades.length > 1 ? `${hsGrades[0]}–${hsGrades[hsGrades.length - 1]}` : hsGrades[0]}`)
  if (ugYears.length) parts.push(`undergrad year ${ugYears.length > 1 ? `${ugYears[0]}–${ugYears[ugYears.length - 1]}` : ugYears[0]}`)
  return parts.join(' and ') || 'your level'
}

// interest: up to 3 chosen majors vs. the opportunity's real focus[] tags — falls back to
// the single interview field when no majors have been picked yet
function interestFactor(o, profile) {
  const picks = profile.interestIds || []
  if (picks.length) {
    const matched = picks.filter((id) => o.focus.includes(id))
    const ratio = matched.length / picks.length
    if (matched.length) {
      const labels = matched.map((id) => FOCUS_LABEL[id] || id)
      const detail =
        labels.length > 1
          ? `You picked ${labels.join(' and ')} as top interests, and this is tagged ${labels.join(' and ')}.`
          : `You picked ${labels[0]} as a top interest, and this is tagged ${labels[0]}.`
      return { ratio, detail }
    }
    return { ratio: 0.12, detail: null }
  }
  if (profile.field) {
    const mapped = FIELD_TO_FOCUS[profile.field]
    if (mapped && o.focus.includes(mapped)) {
      return { ratio: 0.75, detail: `From your interview, you're focused on ${FOCUS_LABEL[mapped] || mapped} — this is tagged ${FOCUS_LABEL[mapped] || mapped}.` }
    }
    return { ratio: 0.3, detail: null }
  }
  return { ratio: 0.45, detail: null }
}

// eligibility: exact grade/year match against the listing's real levels[] array
function eligibilityFactor(o, profile) {
  if (!profile.level) return { ratio: 0.5, detail: null }
  if (o.levels.includes(profile.level)) {
    return { ratio: 1, detail: `You qualify right now — it's open to ${levelRangeText(o.levels)}.` }
  }
  return { ratio: 0.1, detail: null }
}

// location: real haversine distance to the student's coordinates, or remote-fit if they
// asked for remote-only
function locationFactor(o, profile) {
  if (profile.remoteOnly) {
    if (o.mode === 'remote') return { ratio: 1, detail: "It's fully remote, matching what you asked for." }
    if (o.mode === 'hybrid') return { ratio: 0.55, detail: null }
    return { ratio: 0.15, detail: null }
  }
  if (profile.locationCoords && o.lat != null && o.lon != null) {
    const km = distanceKm(profile.locationCoords.lat, profile.locationCoords.lon, o.lat, o.lon)
    const place = profile.locationLabel ? ` from ${profile.locationLabel}` : ''
    if (km < 60) return { ratio: 1, detail: `It's only about ${Math.round(km)}km${place} — one of the closest matches you have.` }
    if (km < 250) return { ratio: 0.65, detail: `It's about ${Math.round(km)}km${place}.` }
    if (km < 800) return { ratio: 0.35, detail: null }
    return { ratio: 0.15, detail: null }
  }
  if (o.mode === 'remote') return { ratio: 0.6, detail: null }
  return { ratio: 0.4, detail: null }
}

// opportunity type: summer / year-round / hands-on internship, from the interview's
// oppType answer
function typeFactor(o, profile) {
  const wants = profile.oppType || []
  if (!wants.length) return { ratio: 0.5, detail: null }
  const wantsSummer = wants.includes('summer-program')
  const wantsYearRound = wants.includes('year-round-program')
  const wantsInternship = wants.includes('research-internship')
  const hit =
    (wantsSummer && o.availability === 'summer') ||
    (wantsYearRound && (o.availability === 'year-round' || o.availability === 'academic-year')) ||
    (wantsInternship && !o.isDirectory)
  if (!hit) return { ratio: 0.25, detail: null }
  const askedFor = wantsSummer ? 'a summer program' : wantsYearRound ? 'a year-round commitment' : 'hands-on research experience'
  const thisIs =
    o.availability === 'summer' ? 'a summer program' : o.availability === 'year-round' ? 'a year-round commitment' : o.availability === 'academic-year' ? 'an academic-year program' : 'a structured research opportunity'
  return { ratio: 1, detail: `You said you want ${askedFor} — this is ${thisIs}.` }
}

// goal alignment: keyword hits are checked against the opportunity's own real name/blurb
// text, never invented — a goal with no keyword system (broad ones like "get experience")
// falls back to a soft, silent credit rather than a fabricated-sounding reason
const GOAL_KEYWORDS = {
  mentor: ['mentor', 'mentorship'],
  'independent-project': ['independent research', 'independent project', 'original research', 'capstone'],
  'science-fair': ['science fair', 'regeneron', 'isef', 'science and engineering fair'],
  'major-competition': ['isef', 'regeneron', 'olympiad', 'science bowl', 'competition'],
}
function goalFactor(o, profile) {
  if (!profile.goalId) return { ratio: 0.5, detail: null }
  const keywords = GOAL_KEYWORDS[profile.goalId]
  if (keywords) {
    const haystack = `${o.name} ${o.blurb}`.toLowerCase()
    const hit = keywords.find((k) => haystack.includes(k))
    if (hit) {
      const goalLabel = GOAL_BY_ID[profile.goalId]?.label || 'your goal'
      return { ratio: 1, detail: `This one specifically mentions "${hit}" — right in line with your goal to ${goalLabel.toLowerCase()}.` }
    }
    return { ratio: 0.35, detail: null }
  }
  // 'experience' and 'portfolio' are broad enough that any real structured program
  // (not just a link directory) meaningfully serves them
  return o.isDirectory ? { ratio: 0.45, detail: null } : { ratio: 0.8, detail: null }
}

const FACTORS = {
  interest: interestFactor,
  eligibility: eligibilityFactor,
  location: locationFactor,
  type: typeFactor,
  goal: goalFactor,
}

/**
 * profile: { interestIds, field, level, locationCoords, locationLabel, remoteOnly,
 * oppType, goalId } — every key optional; missing signals fall back to neutral credit
 * rather than penalizing the score, since a student who hasn't set a goal yet shouldn't
 * see match scores tank across the board.
 */
export function computeMatchScore(o, profile = {}) {
  const parts = {}
  for (const key of Object.keys(MATCH_WEIGHTS)) {
    parts[key] = FACTORS[key](o, profile)
  }
  const raw = Object.keys(MATCH_WEIGHTS).reduce((sum, key) => sum + parts[key].ratio * MATCH_WEIGHTS[key], 0)
  const pct = Math.round(Math.min(97, Math.max(32, raw)))

  const reasons = Object.entries(parts)
    .filter(([, v]) => v.detail)
    .sort((a, b) => b[1].ratio * MATCH_WEIGHTS[b[0]] - a[1].ratio * MATCH_WEIGHTS[a[0]])
    .slice(0, 3)
    .map(([, v]) => v.detail)

  return { pct, reasons, parts }
}

/**
 * The single source of truth for "what match % does this student see for this card" —
 * used identically by the card in the list and by the detail modal it opens into, so the
 * two never show different numbers for the same opportunity. Once the student has taken
 * the interview, that's real signal and always wins; the profile-based score here is only
 * ever a stand-in for a visitor who hasn't.
 */
export function resolveMatchScore(o, { interviewAnswers, matchProfile } = {}) {
  if (interviewAnswers) {
    const { pct, reasons } = scoreOpportunity(o, interviewAnswers)
    return { pct, reasons, isInterviewBased: true }
  }
  const { pct, reasons } = computeMatchScore(o, matchProfile || {})
  return { pct, reasons, isInterviewBased: false }
}
