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
