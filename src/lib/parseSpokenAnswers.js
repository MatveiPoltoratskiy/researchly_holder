/**
 * Turns a raw speech transcript ("I'm a junior in high school interested in biology,
 * mostly genetics, I did a science fair project last year and I'm hoping to find
 * something paid this summer near Boston") into a partial version of Interview.jsx's
 * `answers` shape — keyword/heuristic matching only, no AI call, so this stays entirely
 * client-side and free (per the user's explicit choice over an LLM-based parser).
 *
 * Deliberately conservative: every field here is either confidently matched or left
 * null/empty, never guessed. Interview.jsx starts the student at the first *unanswered*
 * step, so anything this misses just becomes a normal guided question — a wrong guess
 * would be worse than a gap, since it'd need to be noticed and corrected instead of just
 * answered.
 */

import { DISPLAYED_FIELDS, OPP_TYPES, EXPERIENCE_LEVELS, PAID_PREFS } from '../components/Interview'
import { WORLD_CITIES } from '../data/worldCities'

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function containsAny(text, phrases) {
  return phrases.some((phrase) => new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'i').test(text))
}

const NEGATION_WORDS = ['never', 'not', "haven't", 'havent', "hasn't", 'hasnt', "don't", 'dont', "didn't", 'didnt', 'no ']

// Same as containsAny, but a match doesn't count if a negation word sits shortly before
// it — "I've never done research before" must NOT read as a claim of research
// experience just because "research before" appears in it. Looks back ~30 characters
// (roughly 4-5 words), which is enough for "never really done any" without reaching
// back far enough to misfire on an unrelated earlier negation.
function containsAnyUnnegated(text, phrases) {
  for (const phrase of phrases) {
    const match = new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'i').exec(text)
    if (!match) continue
    const before = text.slice(Math.max(0, match.index - 30), match.index).toLowerCase()
    if (!NEGATION_WORDS.some((w) => before.includes(w))) return true
  }
  return false
}

// Extra informal phrasings beyond each field's own label/subfocus text — a student
// talking out loud says "helping sick people," not "clinical & patient-facing."
const FIELD_SYNONYMS = {
  biology: ['biology', 'wildlife', 'organisms', 'living things'],
  'pre-med': ['pre-med', 'premed', 'medicine', 'medical school', 'becoming a doctor', 'helping patients', 'helping sick people'],
  neuroscience: ['neuroscience', 'the brain', 'brains'],
  chemistry: ['chemistry', 'chemicals', 'chemical reactions'],
  'computer-science': ['computer science', 'coding', 'programming', 'software', 'artificial intelligence', 'machine learning'],
  physics: ['physics', 'space', 'astronomy', 'the universe', 'physics research'],
  engineering: ['engineering', 'building things', 'building machines', 'robotics'],
  mathematics: ['math', 'mathematics', 'numbers', 'statistics'],
  psychology: ['psychology', 'the mind', 'human behavior'],
  'environmental-science': ['environmental science', 'the environment', 'climate', 'sustainability', 'conservation'],
  humanitarian: ['humanitarian', 'social impact', 'nonprofit', 'helping communities', 'community research'],
}

function detectField(text) {
  for (const field of DISPLAYED_FIELDS) {
    const phrases = [field.label.toLowerCase(), ...(FIELD_SYNONYMS[field.id] || [])]
    if (containsAny(text, phrases)) return field
  }
  return null
}

function detectSubfocus(text, field) {
  if (!field?.subfocus?.length) return []
  // labels are compound ("Genetics & genomics", "Clinical & patient-facing") and nobody
  // says the whole phrase out loud — split on & / , and match on any one part instead of
  // requiring the exact full label verbatim
  return field.subfocus
    .filter((sf) => {
      const parts = sf.label.toLowerCase().split(/[&,]/).map((p) => p.trim()).filter(Boolean)
      return containsAny(text, parts)
    })
    .map((sf) => sf.id)
}

function detectOppTypes(text) {
  const matches = []
  if (containsAny(text, ['internship', 'research internship'])) matches.push('research-internship')
  if (containsAny(text, ['summer program', 'summer'])) matches.push('summer-program')
  if (containsAny(text, ['year round', 'year-round', 'during the school year', 'ongoing', 'weekly'])) {
    matches.push('year-round-program')
  }
  // guard against OPP_TYPES ever changing shape without this file being updated
  return matches.filter((id) => OPP_TYPES.some((t) => t.id === id))
}

const GRADE_WORD_TO_HS = { freshman: 'hs-9', freshmen: 'hs-9', sophomore: 'hs-10', junior: 'hs-11', senior: 'hs-12' }
const GRADE_WORD_TO_UGRAD = { freshman: 'ugrad-1', freshmen: 'ugrad-1', sophomore: 'ugrad-2', junior: 'ugrad-3', senior: 'ugrad-4' }
const ORDINAL_TO_UGRAD = {
  '1st': 'ugrad-1', first: 'ugrad-1',
  '2nd': 'ugrad-2', second: 'ugrad-2',
  '3rd': 'ugrad-3', third: 'ugrad-3',
  '4th': 'ugrad-4', fourth: 'ugrad-4',
}
const ORDINAL_TO_HS_GRADE = { '9th': 'hs-9', ninth: 'hs-9', '10th': 'hs-10', tenth: 'hs-10', '11th': 'hs-11', eleventh: 'hs-11', '12th': 'hs-12', twelfth: 'hs-12' }

function detectLevel(text) {
  // explicit "9th grade" / "ninth grade" wins outright — least ambiguous phrasing possible
  for (const [word, id] of Object.entries(ORDINAL_TO_HS_GRADE)) {
    if (new RegExp(`\\b${word}\\s*grade\\b`, 'i').test(text)) return id
  }
  // "2nd year of college" / "third year at [school]" / "first year undergrad" — only
  // trusted once "college"/"university"/"undergrad" is mentioned somewhere in the
  // transcript too, since "first year" alone is meaningless without that context
  const isCollegeContext = /\b(college|university|undergrad|undergraduate)\b/i.test(text)
  if (isCollegeContext) {
    for (const [word, id] of Object.entries(ORDINAL_TO_UGRAD)) {
      if (new RegExp(`\\b${word}\\s*year\\b`, 'i').test(text)) return id
    }
  }
  // bare "freshman"/"sophomore"/"junior"/"senior" — disambiguate by whether college/
  // university/undergrad was mentioned anywhere else in the transcript
  const gradeMap = isCollegeContext ? GRADE_WORD_TO_UGRAD : GRADE_WORD_TO_HS
  for (const [word, id] of Object.entries(gradeMap)) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(text)) return id
  }
  return null
}

function detectExperience(text) {
  // most-specific/confident claims checked first, so "I've done research before and I'm
  // still new to a lot of it" resolves to the stronger claim rather than the hedge.
  // Negation-guarded: "I've never done research before" must fall through to the
  // 'exploring' check below, not match here just because "research before" appears.
  if (containsAnyUnnegated(text, ['published', 'publication', 'research before', 'prior research', 'already done research'])) {
    return EXPERIENCE_LEVELS.find((l) => l.id === 'experienced')?.id
  }
  if (containsAnyUnnegated(text, ['competitions', 'competition', 'olympiad', 'self-taught', 'self taught', 'regularly'])) {
    return EXPERIENCE_LEVELS.find((l) => l.id === 'regular-practice')?.id
  }
  if (containsAnyUnnegated(text, ['a little experience', 'some experience', 'a class project', 'dabbled', 'a club', 'science fair'])) {
    return EXPERIENCE_LEVELS.find((l) => l.id === 'some-experience')?.id
  }
  if (containsAny(text, ['new to this', 'just starting', 'never done', 'no experience', 'beginner', 'first time'])) {
    return EXPERIENCE_LEVELS.find((l) => l.id === 'exploring')?.id
  }
  return null
}

function detectPaidPref(text) {
  if (containsAny(text, ["doesn't matter", 'does not matter', 'either way', 'either is fine', "don't care", 'no preference'])) {
    return PAID_PREFS.find((p) => p.id === 'doesnt-matter')?.id
  }
  // negation-guarded so "it doesn't need to be paid" or "doesn't have to pay" don't
  // register as wanting a paid position
  const wantsPaid = containsAnyUnnegated(text, ['stipend', 'paid', 'paying', 'salary', 'scholarship money'])
  const wantsFree = containsAny(text, ['free to attend', 'no cost', "doesn't cost", 'does not cost', 'cost nothing', 'unpaid is fine'])
  if (wantsPaid && !wantsFree) return PAID_PREFS.find((p) => p.id === 'paid-only')?.id
  if (wantsFree && !wantsPaid) return PAID_PREFS.find((p) => p.id === 'free-to-attend')?.id
  return null
}

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function detectTimeline(text) {
  const lower = text.toLowerCase()
  let monthIndex = MONTH_NAMES.findIndex((m) => new RegExp(`\\b${m}\\b`).test(lower))
  if (monthIndex === -1 && /\bsummer\b/.test(lower)) monthIndex = 5 // June, as a single-value stand-in for "summer"
  if (monthIndex === -1) return { applyStart: null, applyEnd: null }

  const now = new Date()
  let year = now.getFullYear()
  if (monthIndex < now.getMonth()) year += 1 // nearest *future* occurrence, same window the MonthPicker offers
  const start = new Date(year, monthIndex, 1)
  const end = new Date(year, monthIndex + 1, 0)
  return { applyStart: toISODate(start), applyEnd: toISODate(end) }
}

function detectLocation(text) {
  const lower = text.toLowerCase()
  if (/\bremote\b/.test(lower)) return { location: '', locationCoords: null, remoteOnly: true }

  // longest city name first, so "New York" wins over a shorter false match before it
  const sorted = [...WORLD_CITIES].sort((a, b) => b.length - a.length)
  for (const city of sorted) {
    const name = city.split(',')[0]
    if (new RegExp(`\\b${escapeRegex(name.toLowerCase())}\\b`).test(lower)) {
      return { location: city, locationCoords: null, remoteOnly: false }
    }
  }
  return { location: '', locationCoords: null, remoteOnly: false }
}

/**
 * @param {string} transcript
 * @returns partial answers — every key Interview.jsx's `answers` state expects, either
 *   filled in with a confident match or left at its empty default.
 */
export function parseSpokenAnswers(transcript) {
  const text = (transcript || '').trim()
  const field = detectField(text)
  const { location, locationCoords, remoteOnly } = detectLocation(text)
  const { applyStart, applyEnd } = detectTimeline(text)

  return {
    field: field?.id || null,
    subfocus: detectSubfocus(text, field),
    oppType: detectOppTypes(text),
    level: detectLevel(text),
    location,
    locationCoords,
    remoteOnly,
    experience: detectExperience(text),
    applyStart,
    applyEnd,
    paidPref: detectPaidPref(text),
  }
}
