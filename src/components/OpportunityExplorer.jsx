import { useEffect, useMemo, useRef, useState } from 'react'
import { CANADA_OPPORTUNITIES } from '../data/canadaOpportunities'
import { FIELDS } from '../data/fields'
import OpportunityMap from './OpportunityMap'

const SORTS = {
  recommended: { label: 'Recommended for you', fn: null },
  'best-match': { label: 'Best match', fn: null },
  name: { label: 'Name (A–Z)', fn: (a, b) => a.name.localeCompare(b.name) },
  verified: {
    label: 'Verified first',
    fn: (a, b) => (CONFIDENCE_RANK[b.confidence] ?? 0) - (CONFIDENCE_RANK[a.confidence] ?? 0),
  },
}
const CONFIDENCE_RANK = { high: 2, medium: 1, low: 0 }

const FIELD_META = {
  'pre-med': { label: 'Pre-Med', cls: 'opp-tag--premed' },
  biology: { label: 'Biology', cls: 'opp-tag--bio' },
  chemistry: { label: 'Chemistry', cls: 'opp-tag--chem' },
  physics: { label: 'Physics', cls: 'opp-tag--physics' },
}
const FIELD_ORDER = ['pre-med', 'biology', 'chemistry', 'physics']
const LIVE_FIELD_SET = new Set(FIELD_ORDER)

const CONFIDENCE_LABEL = { high: 'Verified', medium: 'Needs check', low: 'Unconfirmed' }
const MODE_LABEL = { 'in-person': 'In person', remote: 'Remote', hybrid: 'Hybrid' }
const AVAILABILITY_LABEL = { summer: 'Summer', 'year-round': 'Year-round', 'academic-year': 'Academic year' }

// "big name" recommendation matcher: Ivy League + peer-prestige US schools, plus the
// specific Canadian names most students in this age group already recognize. Maps to a
// canonical short name, AND doubles as the fixed display-priority order for the "Big names"
// row below (earlier in this list = shown first). This exists because several of these
// schools have many rows each (U of T alone has ~9 department-level pages), so naively
// taking "the first 8 matches in dataset order" silently fills the whole row with whichever
// school happens to have the most entries in the underlying CSV, never even reaching
// Harvard/Stanford/Yale/MIT — picking one card per named school here guarantees every big
// name on this list gets a slot, regardless of how many rows it happens to have.
const BIG_NAME_SCHOOLS = [
  ['Harvard', /harvard/i],
  ['Stanford', /stanford university/i],
  ['MIT', /massachusetts institute of technology|(^|\W)mit(\W|$)/i],
  ['Yale', /yale university/i],
  ['Princeton', /princeton university/i],
  ['Columbia', /columbia university/i],
  ['UPenn', /university of pennsylvania/i],
  ['Johns Hopkins', /johns hopkins/i],
  ['Caltech', /california institute of technology|caltech/i],
  ['Cornell', /cornell university/i],
  ['Brown', /brown university/i],
  ['Dartmouth', /dartmouth/i],
  ['U of T', /university of toronto/i],
  ['McGill', /mcgill university/i],
  ['UBC', /university of british columbia/i],
]
function bigNameSchool(org = '') {
  return BIG_NAME_SCHOOLS.find(([, pattern]) => pattern.test(org))?.[0] || null
}

// hand-picked for being small, unusual, or otherwise not-the-obvious-choice, rather than
// derived from any field in the data. A deliberate curation, not an algorithm.
const NICHE_IDS = [
  'triumf-undergrad-coop',
  'seed2stem-icord-ubc',
  'rockefeller-ssrp',
  'cshl-urp',
  'perimeter-issyp',
  'xavier-pelletier-bccancer',
  'rice-physics-reu',
  'broad-summer-scholars',
  'mcgill-youth-biodiversity',
  'carleton-dsri',
  'magee-womens-hs',
  'ila-dalhousie-scholarship',
]
const NICHE_RANK = new Map(NICHE_IDS.map((id, i) => [id, i]))
const BIG_NAME_RANK = new Map(BIG_NAME_SCHOOLS.map(([school], i) => [school, i]))

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// the small badge shown directly on a card in the main list — reuses the same big-name/
// niche categorization that drives the "Recommended for you" sort, so a card's badge and
// its position in that sort always agree
function recommendTagFor(o) {
  const school = bigNameSchool(o.org)
  if (school) return school
  if (NICHE_RANK.has(o.id)) return 'Niche pick'
  return null
}

function levelRangeLabel(levels) {
  const hs = levels.filter((l) => l.startsWith('hs')).map((l) => l.split('-')[1])
  const ug = levels.filter((l) => l.startsWith('ugrad'))
  const parts = []
  if (hs.length) {
    parts.push(hs.length > 1 ? `Gr. ${hs[0]}–${hs[hs.length - 1]}` : `Gr. ${hs[0]}`)
  }
  if (ug.length) parts.push(ug.length === 4 ? 'Undergrad' : 'Undergrad (early)')
  return parts.join(' · ')
}

function payLabel(o) {
  if (!o.paid) return 'Unpaid'
  if (o.stipend) return `Paid · $${o.stipend.toLocaleString()}`
  return 'Paid'
}

// distinct from payLabel above: this is what the STUDENT pays to attend (tuition/fee),
// not what they receive — the two are unrelated (a program can pay a stipend AND still
// have no attendance cost, or vice versa), so they get their own line.
function costLabel(o) {
  if (o.cost === 0) return 'Free to attend'
  if (o.cost != null && o.cost > 0) return `Costs $${o.cost.toLocaleString()} to attend`
  return null
}

// Placeholder until the interview/profile-matching system exists: a stable, id-derived
// percentage so the "Match rate" field has something real-feeling to show rather than
// looking broken. Once interview answers exist, swap this for an actual computed score.
function matchRateFor(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return 58 + (hash % 41) // 58-98, skews positive since these are already curated matches
}

// Real category icons instead of a plain letter — matched off the org name, since we
// don't have actual company/hospital logo assets for these records yet.
function iconForOrg(org = '') {
  const s = org.toLowerCase()
  if (/hospital|health(?!.*(institutes|research council))|sunnybrook|sickkids|baycrest|bloorview|sinai|clinic|centre for addiction/.test(s)) {
    return 'icon-building'
  }
  if (/university|college|department of|school of|cheriton/.test(s)) return 'icon-grad-cap'
  if (/nserc|cihr|mitacs|council|foundation|innovates|institutes of health/.test(s)) return 'icon-badge-check'
  return 'icon-flask'
}

// Real org logos, sourced live off each record's own domain via free favicon services —
// no per-record manual sourcing needed. (Clearbit's Logo API, the usual first choice for
// this, was discontinued and its domain no longer even resolves — checked directly before
// wiring this up.) Google's favicon service goes first since it's the most complete; DuckDuckGo
// is the second try; the category icon glyph is the final fallback if a domain has neither.
function domainFromUrl(url) {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function OrgLogo({ org, url, iconId }) {
  const domain = domainFromUrl(url)
  const [stage, setStage] = useState(domain ? 'google' : 'icon')

  if (stage === 'google') {
    return (
      <img
        className="opp-logo-img"
        src={`https://www.google.com/s2/favicons?sz=128&domain=${domain}`}
        alt={`${org} logo`}
        onError={() => setStage('duckduckgo')}
      />
    )
  }
  if (stage === 'duckduckgo') {
    return (
      <img
        className="opp-logo-img opp-logo-img--favicon"
        src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
        alt={`${org} logo`}
        onError={() => setStage('icon')}
      />
    )
  }
  return (
    <svg width="20" height="20" aria-hidden="true">
      <use href={`#${iconId}`} />
    </svg>
  )
}

function OpportunityCard({ o, selected, onSelect, onOpenDetail, cardRef, recommendTag }) {
  const primary = FIELD_ORDER.find((f) => o.focus.includes(f)) || o.focus[0]

  // clicking anywhere on the card selects it (highlights it + pans the map to its pin) and
  // opens the full detail modal, except the actual "View program" link, which should just
  // follow through as normal
  function handleCardClick(e) {
    if (e.target.closest('a')) return
    onSelect(o.id)
    onOpenDetail(o.id)
  }

  return (
    <article
      ref={cardRef}
      className={`opp-card ${selected ? 'is-selected' : ''}`}
      onClick={handleCardClick}
    >
      <span className="opp-card-select-hint">{selected ? 'Selected, shown on map' : 'Click to locate on map'}</span>
      <div className={`opp-badge ${FIELD_META[primary]?.cls || ''}`}>
        <OrgLogo org={o.org} url={o.url} iconId={iconForOrg(o.org)} />
      </div>
      <div className="opp-card-body">
        <div className="opp-card-top">
          <div>
            <h3 className="opp-title">{o.name}</h3>
            <div className="opp-org">{o.org}</div>
          </div>
          <span className={`opp-confidence opp-confidence--${o.confidence}`}>
            {CONFIDENCE_LABEL[o.confidence] || o.confidence}
          </span>
        </div>
        <p className="opp-blurb">{o.blurb}</p>
        <div className="opp-tags">
          {o.focus.map((f) =>
            FIELD_META[f] ? (
              <span key={f} className={`opp-tag ${FIELD_META[f].cls}`}>
                {FIELD_META[f].label}
              </span>
            ) : null
          )}
          <span className="opp-tag opp-tag--muted">{levelRangeLabel(o.levels)}</span>
          {o.locationLabel && <span className="opp-tag opp-tag--muted">{o.locationLabel}</span>}
          {o.equityNote && <span className="opp-tag opp-tag--equity">{o.equityNote}</span>}
          {o.isGrant && <span className="opp-tag opp-tag--grant">Financial Grant/Award</span>}
          {recommendTag && <span className="opp-tag opp-tag--recommend">{recommendTag}</span>}
        </div>
        <div className="opp-foot">
          <span className="opp-pay">{payLabel(o)}</span>
          {costLabel(o) && (
            <>
              <span className="opp-dot">·</span>
              <span className={`opp-cost ${o.cost > 0 ? 'opp-cost--paid' : ''}`}>{costLabel(o)}</span>
            </>
          )}
          <span className="opp-dot">·</span>
          <span className="opp-deadline">
            {o.deadline ? `Deadline ${o.deadline}` : 'Deadline not confirmed'}
          </span>
          {o.url ? (
            <a className="opp-link" href={o.url} target="_blank" rel="noreferrer">
              View program →
            </a>
          ) : (
            <span className="opp-link opp-link--disabled">No official link yet</span>
          )}
        </div>
      </div>
    </article>
  )
}

function MajorsFilter({ activeFields, toggleField, counts }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="opp-side-section">
      <button
        type="button"
        className="opp-side-heading"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Majors
        <svg width="16" height="16" className={`opp-chevron ${open ? 'is-open' : ''}`} aria-hidden="true">
          <use href="#icon-chevron-down" />
        </svg>
      </button>
      <div className={`opp-collapse ${open ? '' : 'is-closed'}`}>
        <div className="opp-collapse-inner">
          <div className="opp-major-list">
            {FIELDS.map((f) => {
              const live = LIVE_FIELD_SET.has(f.id)
              const count = live ? counts[f.id] : 0
              const checked = live && activeFields.has(f.id)
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`opp-major-row ${live ? '' : 'is-soon'} ${checked ? 'is-checked' : ''}`}
                  onClick={() => live && toggleField(f.id)}
                  disabled={!live}
                >
                  <span className="opp-major-check" aria-hidden="true">
                    {checked && (
                      <svg width="10" height="8" viewBox="0 0 10 8">
                        <path
                          d="M1 4.2 3.6 6.8 9 1.2"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <span className="opp-major-label">{f.label}</span>
                  {live ? (
                    <span className="opp-major-count">{count}</span>
                  ) : (
                    <span className="opp-major-soon">Soon</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function OpportunityDetailModal({ o, onClose }) {
  // Escape-to-close, and lock page scroll while open so the backdrop reads as modal, not
  // just an overlapping card
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const details = [
    ['Application deadline', o.deadline || 'Not confirmed'],
    ['Program dates', AVAILABILITY_LABEL[o.availability] || o.availability],
    ['Eligibility', levelRangeLabel(o.levels) || 'Not confirmed'],
    ['Cost to attend', costLabel(o) || 'Not confirmed'],
    ['Stipend / pay', payLabel(o)],
    ['Match rate', `${matchRateFor(o.id)}%`, 'Preview, based on your interview once built'],
  ]

  return (
    <div className="opp-modal-backdrop" onClick={onClose}>
      <div className="opp-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="opp-modal-close" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="opp-modal-header">
          <div className="opp-modal-eyebrow">
            {o.focus.map((f) => FIELD_META[f]?.label).filter(Boolean).join(' · ')}
          </div>
          <div className="opp-modal-title-row">
            <div className="opp-modal-logo">
              <OrgLogo org={o.org} url={o.url} iconId={iconForOrg(o.org)} />
            </div>
            <div>
              <h2 className="opp-modal-title">{o.name}</h2>
              <div className="opp-modal-org">{o.org}</div>
            </div>
          </div>
        </div>

        <div className="opp-modal-status-row">
          <span className={`opp-confidence opp-confidence--${o.confidence}`}>
            {CONFIDENCE_LABEL[o.confidence] || o.confidence}
          </span>
          {o.locationLabel && <span className="opp-modal-status-item">{o.locationLabel}</span>}
          <span className="opp-modal-status-item">{MODE_LABEL[o.mode] || o.mode}</span>
        </div>

        <p className="opp-modal-blurb">{o.blurb}</p>

        <div className="opp-modal-grid">
          {details.map(([label, value, caption]) => (
            <div key={label} className="opp-modal-cell">
              <div className="opp-modal-cell-label">{label}</div>
              <div className="opp-modal-cell-value">{value}</div>
              {caption && <div className="opp-modal-cell-caption">{caption}</div>}
            </div>
          ))}
        </div>

        <div className="opp-tags opp-modal-tags">
          {o.focus.map((f) =>
            FIELD_META[f] ? (
              <span key={f} className={`opp-tag ${FIELD_META[f].cls}`}>
                {FIELD_META[f].label}
              </span>
            ) : null
          )}
          {o.equityNote && <span className="opp-tag opp-tag--equity">{o.equityNote}</span>}
          {o.isGrant && <span className="opp-tag opp-tag--grant">Financial Grant/Award</span>}
        </div>

        {o.url ? (
          <a className="opp-modal-cta" href={o.url} target="_blank" rel="noreferrer">
            View program
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M7 17 17 7M9 7h8v8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        ) : (
          <div className="opp-modal-cta opp-modal-cta--disabled">No official link yet</div>
        )}
      </div>
    </div>
  )
}

export default function OpportunityExplorer() {
  const [activeFields, setActiveFields] = useState(() => new Set(FIELD_ORDER))
  const [level, setLevel] = useState('all')
  const [costFilters, setCostFilters] = useState(() => new Set())
  const [sortKey, setSortKey] = useState('recommended')
  const [userLocation, setUserLocation] = useState(null)
  const [locationStatus, setLocationStatus] = useState('idle')
  const [selectedId, setSelectedId] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [shownCount, setShownCount] = useState(() => CANADA_OPPORTUNITIES.length)
  const [countShimmer, setCountShimmer] = useState(false)
  const listScrollRef = useRef(null)
  const cardRefs = useRef(new Map())
  const shimmerTimeoutRef = useRef(null)

  // clicking a card should only pan the MAP to that location, never move the page/list
  // itself (the card is already right there under the cursor). Selecting from the map is
  // different: that pin's card might be scrolled out of view in the list, so that path
  // still brings it into view. scrollIntoView({block:'center'}) was previously called
  // unconditionally here and re-centered the card even when it didn't need to move,
  // which is exactly the unwanted "whole page repositions" jump.
  function selectOpportunity(id, { scrollCardIntoView = false } = {}) {
    setSelectedId((prev) => (prev === id ? null : id))
    if (scrollCardIntoView) {
      cardRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // triggered directly from filter clicks (not a state-watching effect) so it only ever
  // fires from a real user interaction, never on mount or on an unrelated re-render. The
  // results panel scrolls internally now, so this scrolls THAT panel back to top rather
  // than the page
  function scrollToResults() {
    listScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // major changes get a deliberate ~200ms "recalculating" beat on the count instead of an
  // instant swap: shownCount holds the OLD value until the shimmer finishes, then jumps to
  // whatever filtered.length is at that moment (read via the ref below, never stale)
  function triggerCountShimmer() {
    setCountShimmer(true)
    clearTimeout(shimmerTimeoutRef.current)
    shimmerTimeoutRef.current = setTimeout(() => {
      setShownCount(filteredLenRef.current)
      setCountShimmer(false)
    }, 200)
  }

  function toggleField(f) {
    setActiveFields((prev) => {
      const next = new Set(prev)
      if (next.has(f)) {
        if (next.size > 1) next.delete(f)
      } else {
        next.add(f)
      }
      return next
    })
    triggerCountShimmer()
    scrollToResults()
  }

  function selectLevel(key) {
    setLevel(key)
    scrollToResults()
  }

  // "free" and "costs money" are independent on/off toggles rather than a single
  // free<->paid switch: both off shows everything (incl. unconfirmed cost), turning one
  // on isolates it, turning both on shows either (excludes only unknown-cost records)
  function toggleCostFilter(key) {
    setCostFilters((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
    scrollToResults()
  }

  // powers the "Recommended for you" sort: big-name/near-you ranking needs real
  // coordinates, which only the browser's own Geolocation API can give us here (no
  // geocoding service or API key wired up for this prototype)
  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported')
      return
    }
    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setLocationStatus('granted')
      },
      () => setLocationStatus('denied'),
      { timeout: 8000 }
    )
  }

  const counts = useMemo(() => {
    const c = { 'pre-med': 0, biology: 0, chemistry: 0, physics: 0 }
    for (const o of CANADA_OPPORTUNITIES) {
      for (const f of o.focus) if (f in c) c[f] += 1
    }
    return c
  }, [])

  const filtered = useMemo(() => {
    const list = CANADA_OPPORTUNITIES.filter((o) => {
      const fieldMatch = o.focus.some((f) => activeFields.has(f))
      if (!fieldMatch) return false

      if (level !== 'all') {
        const levelMatch =
          level === 'hs' ? o.levels.some((l) => l.startsWith('hs')) : o.levels.some((l) => l.startsWith('ugrad'))
        if (!levelMatch) return false
      }

      if (costFilters.size > 0) {
        const isFree = o.cost === 0
        const isPaidToAttend = o.cost != null && o.cost > 0
        const matchesFree = costFilters.has('free') && isFree
        const matchesPaid = costFilters.has('paid') && isPaidToAttend
        if (!matchesFree && !matchesPaid) return false
      }

      return true
    })

    if (sortKey === 'recommended') {
      // three tiers: big names first, then the hand-picked niche list, then everything
      // else — within the big-name and "everything else" tiers, distance breaks ties once
      // location is known; the niche tier keeps its own hand-picked order regardless,
      // since that curation IS the point of that tier
      return [...list].sort((a, b) => {
        const tierOf = (o) => (bigNameSchool(o.org) ? 0 : NICHE_RANK.has(o.id) ? 1 : 2)
        const tierA = tierOf(a)
        const tierB = tierOf(b)
        if (tierA !== tierB) return tierA - tierB

        if (tierA === 1) return (NICHE_RANK.get(a.id) ?? 99) - (NICHE_RANK.get(b.id) ?? 99)

        if (userLocation) {
          const da = a.lat != null ? distanceKm(userLocation.lat, userLocation.lon, a.lat, a.lon) : Infinity
          const db = b.lat != null ? distanceKm(userLocation.lat, userLocation.lon, b.lat, b.lon) : Infinity
          if (da !== db) return da - db
        }
        if (tierA === 0) {
          return (BIG_NAME_RANK.get(bigNameSchool(a.org)) ?? 99) - (BIG_NAME_RANK.get(bigNameSchool(b.org)) ?? 99)
        }
        return 0
      })
    }

    const sortFn = SORTS[sortKey]?.fn
    return sortFn ? [...list].sort(sortFn) : list
  }, [activeFields, level, costFilters, sortKey, userLocation])

  const filteredLenRef = useRef(filtered.length)
  filteredLenRef.current = filtered.length

  // level/cost/sort changes update the displayed count immediately as before. Only a
  // major toggle (via triggerCountShimmer above) intentionally holds it back
  useEffect(() => {
    if (!countShimmer) setShownCount(filtered.length)
  }, [filtered.length])

  useEffect(() => () => clearTimeout(shimmerTimeoutRef.current), [])

  const activeFieldLabels = FIELD_ORDER.filter((f) => activeFields.has(f)).map((f) => FIELD_META[f].label)
  const detailOpportunity = detailId ? CANADA_OPPORTUNITIES.find((o) => o.id === detailId) : null

  return (
    <section className="opp-explorer">
      <div className="container opp-container">
        <div className="opp-header">
          <p className="opp-eyebrow">We found</p>
          <h1 className="opp-heading">
            <span className={`opp-heading-count ${countShimmer ? 'is-shimmer' : ''}`}>{shownCount}</span> opportunit
            {shownCount === 1 ? 'y' : 'ies'}
          </h1>
          <div className="opp-prioritized">
            <span>Prioritized for</span>
            {activeFieldLabels.map((label) => (
              <span key={label} className="opp-priority-pill">
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="opp-layout">
          <aside className="opp-sidebar">
            <MajorsFilter activeFields={activeFields} toggleField={toggleField} counts={counts} />

            <div className="opp-side-section">
              <div className="opp-side-heading opp-side-heading--static">Level</div>
              <div className="opp-level-col">
                {[
                  ['all', 'All levels'],
                  ['hs', 'High school'],
                  ['undergrad', 'Undergrad'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`opp-level-btn ${level === key ? 'is-active' : ''}`}
                    onClick={() => selectLevel(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="opp-side-section">
              <div className="opp-side-heading opp-side-heading--static">Cost to attend</div>
              <div className="opp-major-list">
                {[
                  ['free', 'Free'],
                  ['paid', 'Costs money'],
                ].map(([key, label]) => {
                  const checked = costFilters.has(key)
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`opp-major-row is-live ${checked ? 'is-checked' : ''}`}
                      onClick={() => toggleCostFilter(key)}
                    >
                      <span className="opp-major-check" aria-hidden="true">
                        {checked && (
                          <svg width="10" height="8" viewBox="0 0 10 8">
                            <path
                              d="M1 4.2 3.6 6.8 9 1.2"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="opp-major-label">{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>

          <div className="opp-results">
            <div className="opp-list-toolbar">
              <label className="opp-sort">
                Sort by
                <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                  {Object.entries(SORTS).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {sortKey === 'recommended' && locationStatus !== 'granted' && (
                <button
                  type="button"
                  className="opp-locate-btn"
                  onClick={requestLocation}
                  disabled={locationStatus === 'loading'}
                >
                  {locationStatus === 'loading' ? 'Locating…' : '📍 Use my location'}
                </button>
              )}
              {sortKey === 'recommended' && locationStatus === 'denied' && (
                <span className="opp-locate-note">Location denied, showing general picks.</span>
              )}
              {sortKey === 'recommended' && locationStatus === 'unsupported' && (
                <span className="opp-locate-note">Location isn't supported here.</span>
              )}
            </div>
            <div ref={listScrollRef} className="opp-list-scroll">
              <div className="opp-list">
                {filtered.map((o) => (
                  <OpportunityCard
                    key={o.id}
                    o={o}
                    selected={o.id === selectedId}
                    onSelect={selectOpportunity}
                    onOpenDetail={setDetailId}
                    recommendTag={recommendTagFor(o)}
                    cardRef={(el) => {
                      if (el) cardRefs.current.set(o.id, el)
                      else cardRefs.current.delete(o.id)
                    }}
                  />
                ))}
                {filtered.length === 0 && (
                  <div className="opp-empty">No opportunities match this combination yet.</div>
                )}
              </div>
            </div>
          </div>

          <div className="opp-map-col">
            <OpportunityMap
              opportunities={filtered}
              selectedId={selectedId}
              onSelect={(id) => selectOpportunity(id, { scrollCardIntoView: true })}
            />
          </div>
        </div>
      </div>

      {detailOpportunity && <OpportunityDetailModal o={detailOpportunity} onClose={() => setDetailId(null)} />}
    </section>
  )
}
