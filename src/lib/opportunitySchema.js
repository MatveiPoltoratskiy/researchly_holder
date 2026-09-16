import { VALID_FOCUS_IDS } from '../data/fields.js'

/**
 * Schema contract for one opportunity record.
 *
 * Every field below is load-bearing for matching except `blurb`/`selectivity`, which are
 * display-only. The eligibility fields (`levels`, `availability`, `mode`) are used as HARD
 * filters, so an error there doesn't just misrank a result — it shows a student a program
 * they cannot apply to, which wastes their time. Hence the validator.
 *
 *   id           string, unique, kebab-case
 *   name         string — the program's own name, as it appears officially
 *   org          string — hosting institution
 *   url          string — official application/info page
 *   focus        string[] — field ids from fields.js. Tag generously but honestly:
 *                a hospital bench program is legitimately biology + pre-med + neuroscience.
 *   levels       string[] — from LEVELS. Who is ELIGIBLE, not who is encouraged.
 *   mode         'in-person' | 'remote' | 'hybrid'
 *   location     { label, lat, lon, country } — lat/lon nullable for multi-site programs
 *   availability 'summer' | 'year-round' | 'academic-year'
 *   paid         boolean — true if the student RECEIVES money (stipend/salary)
 *   cost         number | null — what the student PAYS. 0 = free. null = unknown/varies.
 *   stipend      number | null — amount received, if known
 *   deadline     ISO date string | null — the CLOSING date of the current application
 *                cycle, and ONLY that: never a scholarship/early-bird/priority/recommendation-
 *                letter/registration deadline, an event date, or a past cycle's date carried
 *                forward without evidence it still applies. null when unverified — never guess,
 *                and never infer a precise date solely from a typical/previous cycle.
 *   selectivity  'very-high' | 'high' | 'medium' | 'open'
 *   isDirectory  boolean (optional) — a network where each site takes its OWN application
 *                (e.g. NSF REU). Present these as "browse sites", not "apply".
 *   multiSite    boolean (optional) — ONE application, but placement across several
 *                campuses (e.g. SSP). Present normally; just don't promise a location.
 *   verified     boolean — has a human checked this against the official page this cycle?
 *
 *   deadlineStatus   'confirmed' | 'rolling' (optional, omitted == unconfirmed) — 'confirmed'
 *                means `deadline` was read off the official site for the CURRENT cycle;
 *                'rolling' means the official site explicitly says applications are accepted
 *                on a rolling basis (deadline stays null either way — this field is what tells
 *                the UI "rolling" from "we just don't know"). Omit entirely rather than writing
 *                'unconfirmed' — absence IS the unconfirmed state, same as `deadline: null`.
 *   deadlineSource   string | null (optional) — absolute URL of the SPECIFIC page the deadline
 *                (or rolling-admission statement) was read from, which may not be the same
 *                page as `url` (e.g. a dedicated "Important Dates" or FAQ page). Required
 *                alongside deadlineStatus: 'confirmed' — a confirmed deadline with no source
 *                is a smell, not a fact.
 *   deadlineNote     string | null (optional) — one short human-readable line on why this is
 *                considered current/verified (e.g. "2026 cycle dates, from the program's
 *                Important Dates page, checked 2026-09-15"), or a caveat (e.g. "site states
 *                only 'typically opens January' — no exact date announced yet, kept
 *                unconfirmed"). This is the paper trail a fabrication complaint gets checked
 *                against, so write it like someone will.
 *   applicationOpens ISO date string | null (optional) — the cycle's OPENING date, when the
 *                official site states an application window ("opens Jan 15, closes Mar 30")
 *                rather than just a closing deadline. `deadline` still carries the closing
 *                date in that case; this is purely additive context.
 *
 * ---- the CURRENT cycle is closed, and there's no closing date to give (nextOpening*) ----
 * These fields are the other half of "not confirmed": `deadline`/`applicationOpens` above are
 * for when we know a window's dates; `nextOpening*` is for when the current cycle has closed
 * and the official site says something about when the NEXT one starts, but not the eventual
 * deadline. Never both at once — a record with a real `deadline` is not "closed" in this sense.
 *
 *   applicationStatus 'closed' (optional, omitted == open or unknown) — set ONLY when the
 *                official site itself says the current cycle is closed/not yet open. Requires
 *                `deadline` to stay null (if you know a real upcoming deadline, use `deadline`
 *                + deadlineStatus: 'confirmed' instead — that's a MORE precise fact than this).
 *   nextOpeningPrecision  'exact' | 'month' | 'year' | 'pattern' | 'vague' (optional) — how
 *                specific the official site's statement about reopening actually is. Only set
 *                alongside applicationStatus: 'closed'. Pick the weakest one the evidence
 *                actually supports — do not round a vaguer statement up to a more precise one:
 *                  'exact'   — a full date ("applications open March 1, 2027"). -> nextOpeningDate
 *                  'month'   — month + year for the confirmed upcoming cycle ("opens January
 *                              2027", "check back in December 2026"). -> nextOpeningMonth + nextOpeningYear
 *                  'year'    — only a year for the confirmed upcoming cycle ("reopens in 2027",
 *                              or "next year" when today's date resolves that unambiguously).
 *                              -> nextOpeningYear only
 *                  'pattern' — a recurring/typical month, NOT tied to a confirmed upcoming year
 *                              ("applications typically open every January"). -> nextOpeningMonth
 *                              only (never nextOpeningYear — that would claim more than "typically")
 *                  'vague'   — closed, reopening mentioned with no usable month or year at all
 *                              ("applications will reopen next year" with no date to anchor it,
 *                              or "check back later") -> neither field set; the fact alone is
 *                              recorded via nextOpeningNote
 *   nextOpeningDate   ISO date string | null (optional) — set only when precision is 'exact'.
 *   nextOpeningMonth  integer 1-12 | null (optional) — set when precision is 'month' or 'pattern'.
 *   nextOpeningYear   integer | null (optional) — set when precision is 'month' or 'year'.
 *   nextOpeningSource string | null (optional) — absolute URL of the specific page this was
 *                read from. Required whenever nextOpeningPrecision is set, same reasoning as
 *                deadlineSource — an unsourced "next opening" claim is exactly as much of a
 *                smell as an unsourced deadline. If the only lead was a search-result snippet
 *                that couldn't be verified by opening the actual page, this still points at
 *                whatever page the snippet came from (for a reader to check themselves) — but
 *                nextOpeningConfidence must be 'anticipated' in that case, never 'confirmed'.
 *   nextOpeningConfidence 'confirmed' | 'anticipated' (optional) — ONLY applies to precision
 *                'exact'/'month'/'year' (a 'pattern' or 'vague' claim is inherently soft, so
 *                this is omitted for those). 'confirmed' means an official, non-hedged
 *                statement that was actually read on the source page ("applications open
 *                January 2027", "closed until January 2027"). 'anticipated' means the
 *                reopening itself is stated with a hedge ("we plan to reopen in January
 *                2027", "expected to reopen"), is contingent on something else (e.g. pending
 *                grant renewal), or was found only via a search-result snippet that couldn't
 *                be independently verified by reading the actual source page. When in doubt,
 *                pick 'anticipated' — this field exists specifically so a tentative signal
 *                doesn't get displayed with the same confidence as a definitive one.
 *   nextOpeningCheckedAt ISO date string | null (optional) — the date this specific fact was
 *                last verified (research/check date, not a value read off the official site).
 *                Set alongside nextOpeningPrecision so a stale claim can be told from a fresh
 *                one later without re-deriving it from git history.
 *   nextOpeningNote   string | null (optional) — one short line: the actual quote/paraphrase
 *                and where it came from. This is what lets someone re-verify "typically opens
 *                January" is really what the site said, not an inference from past cycles.
 *
 * isDirectory and multiSite both exempt a record from the coordinate requirement, but they
 * are NOT interchangeable — they imply different application instructions for the student.
 */

export const LEVELS = [
  'hs-9', 'hs-10', 'hs-11', 'hs-12',
  'ugrad-1', 'ugrad-2', 'ugrad-3', 'ugrad-4',
]

export const MODES = ['in-person', 'remote', 'hybrid']
export const AVAILABILITY = ['summer', 'year-round', 'academic-year']
export const SELECTIVITY = ['very-high', 'high', 'medium', 'open']
export const DEADLINE_STATUSES = ['confirmed', 'rolling']
export const APPLICATION_STATUSES = ['closed']
export const NEXT_OPENING_PRECISIONS = ['exact', 'month', 'year', 'pattern', 'vague']
export const NEXT_OPENING_CONFIDENCES = ['confirmed', 'anticipated']

const REQUIRED = ['id', 'name', 'org', 'url', 'focus', 'levels', 'mode', 'location', 'availability', 'paid']

/** Returns an array of human-readable problems. Empty array = valid. */
export function validateOpportunity(o, seenIds = new Set()) {
  const errs = []
  const at = (msg) => `${o?.id || '(no id)'}: ${msg}`

  if (!o || typeof o !== 'object') return ['record is not an object']

  for (const key of REQUIRED) {
    if (o[key] === undefined || o[key] === null) errs.push(at(`missing required field "${key}"`))
  }
  if (o.id && seenIds.has(o.id)) errs.push(at('duplicate id'))

  if (o.focus) {
    if (!Array.isArray(o.focus) || o.focus.length === 0) errs.push(at('focus must be a non-empty array'))
    else for (const f of o.focus) {
      if (!VALID_FOCUS_IDS.includes(f)) errs.push(at(`unknown focus id "${f}"`))
    }
  }
  if (o.levels) {
    if (!Array.isArray(o.levels) || o.levels.length === 0) errs.push(at('levels must be a non-empty array'))
    else for (const l of o.levels) {
      if (!LEVELS.includes(l)) errs.push(at(`unknown level "${l}"`))
    }
  }
  if (o.mode && !MODES.includes(o.mode)) errs.push(at(`mode must be one of ${MODES.join(', ')}`))
  if (o.availability && !AVAILABILITY.includes(o.availability)) {
    errs.push(at(`availability must be one of ${AVAILABILITY.join(', ')}`))
  }
  if (o.selectivity && !SELECTIVITY.includes(o.selectivity)) {
    errs.push(at(`selectivity must be one of ${SELECTIVITY.join(', ')}`))
  }
  if (o.paid !== undefined && typeof o.paid !== 'boolean') errs.push(at('paid must be a boolean'))
  if (o.url && !/^https?:\/\//.test(o.url)) errs.push(at('url must be absolute'))
  if (o.deadline && Number.isNaN(Date.parse(o.deadline))) errs.push(at(`unparseable deadline "${o.deadline}"`))
  if (o.applicationOpens && Number.isNaN(Date.parse(o.applicationOpens))) {
    errs.push(at(`unparseable applicationOpens "${o.applicationOpens}"`))
  }
  if (o.deadlineStatus !== undefined && !DEADLINE_STATUSES.includes(o.deadlineStatus)) {
    errs.push(at(`deadlineStatus must be one of ${DEADLINE_STATUSES.join(', ')}, or omitted`))
  }
  if (o.deadlineStatus === 'confirmed' && !o.deadline) {
    errs.push(at('deadlineStatus is "confirmed" but deadline is null'))
  }
  if (o.deadlineStatus === 'confirmed' && !o.deadlineSource) {
    errs.push(at('deadlineStatus is "confirmed" but deadlineSource is missing — a confirmed deadline needs a source'))
  }
  if (o.deadlineStatus === 'rolling' && o.deadline) {
    errs.push(at('deadlineStatus is "rolling" but deadline is set — rolling admissions has no fixed date'))
  }
  if (o.deadlineSource && !/^https?:\/\//.test(o.deadlineSource)) errs.push(at('deadlineSource must be an absolute URL'))

  if (o.applicationStatus !== undefined && !APPLICATION_STATUSES.includes(o.applicationStatus)) {
    errs.push(at(`applicationStatus must be one of ${APPLICATION_STATUSES.join(', ')}, or omitted`))
  }
  if (o.applicationStatus === 'closed' && o.deadline) {
    errs.push(at('applicationStatus is "closed" but deadline is set — use deadline + deadlineStatus instead of applicationStatus/nextOpening for a known future date'))
  }
  if (o.nextOpeningPrecision !== undefined) {
    if (!NEXT_OPENING_PRECISIONS.includes(o.nextOpeningPrecision)) {
      errs.push(at(`nextOpeningPrecision must be one of ${NEXT_OPENING_PRECISIONS.join(', ')}, or omitted`))
    }
    if (o.applicationStatus !== 'closed') {
      errs.push(at('nextOpeningPrecision is set but applicationStatus is not "closed"'))
    }
    if (!o.nextOpeningSource) {
      errs.push(at('nextOpeningPrecision is set but nextOpeningSource is missing — an unsourced next-opening claim is a smell, not a fact'))
    }
    if (o.nextOpeningPrecision === 'exact' && !o.nextOpeningDate) {
      errs.push(at('nextOpeningPrecision is "exact" but nextOpeningDate is missing'))
    }
    if (o.nextOpeningPrecision === 'month' && (!o.nextOpeningMonth || !o.nextOpeningYear)) {
      errs.push(at('nextOpeningPrecision is "month" but nextOpeningMonth/nextOpeningYear is missing'))
    }
    if (o.nextOpeningPrecision === 'year' && (!o.nextOpeningYear || o.nextOpeningMonth)) {
      errs.push(at('nextOpeningPrecision is "year" requires nextOpeningYear and no nextOpeningMonth'))
    }
    if (o.nextOpeningPrecision === 'pattern' && (!o.nextOpeningMonth || o.nextOpeningYear)) {
      errs.push(at('nextOpeningPrecision is "pattern" requires nextOpeningMonth and no nextOpeningYear (a pattern is not tied to one confirmed year)'))
    }
    if (o.nextOpeningPrecision === 'vague' && (o.nextOpeningMonth || o.nextOpeningYear)) {
      errs.push(at('nextOpeningPrecision is "vague" but a month/year is set — use "month"/"year"/"pattern" instead if it\'s actually that specific'))
    }
    if (['exact', 'month', 'year'].includes(o.nextOpeningPrecision) && !o.nextOpeningConfidence) {
      errs.push(at(`nextOpeningPrecision is "${o.nextOpeningPrecision}" but nextOpeningConfidence is missing — say whether this was a definitive statement or a hedged/unverified one`))
    }
    if (['pattern', 'vague'].includes(o.nextOpeningPrecision) && o.nextOpeningConfidence) {
      errs.push(at(`nextOpeningConfidence doesn't apply to precision "${o.nextOpeningPrecision}" — a pattern/vague claim is inherently soft`))
    }
  }
  if (o.nextOpeningConfidence !== undefined && !NEXT_OPENING_CONFIDENCES.includes(o.nextOpeningConfidence)) {
    errs.push(at(`nextOpeningConfidence must be one of ${NEXT_OPENING_CONFIDENCES.join(', ')}, or omitted`))
  }
  if (o.nextOpeningDate && Number.isNaN(Date.parse(o.nextOpeningDate))) {
    errs.push(at(`unparseable nextOpeningDate "${o.nextOpeningDate}"`))
  }
  if (o.nextOpeningMonth != null && (o.nextOpeningMonth < 1 || o.nextOpeningMonth > 12)) {
    errs.push(at('nextOpeningMonth must be 1-12'))
  }
  if (o.nextOpeningSource && !/^https?:\/\//.test(o.nextOpeningSource)) {
    errs.push(at('nextOpeningSource must be an absolute URL'))
  }

  // in-person programs need coordinates for distance matching, unless they legitimately
  // have no single location (a directory of sites, or one application placed across campuses)
  if (o.mode === 'in-person' && !o.isDirectory && !o.multiSite && o.location && o.location.lat == null) {
    errs.push(at('in-person program has no coordinates: add lat/lon, or set multiSite/isDirectory if it genuinely has no single location'))
  }
  return errs
}

export function validateAll(list) {
  const seen = new Set()
  const errors = []
  for (const o of list) {
    errors.push(...validateOpportunity(o, seen))
    if (o?.id) seen.add(o.id)
  }
  return {
    ok: errors.length === 0,
    errors,
    total: list.length,
    verified: list.filter((o) => o.verified).length,
  }
}
