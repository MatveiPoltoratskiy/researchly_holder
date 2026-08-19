import { useMemo, useRef, useState } from 'react'
import { CANADA_OPPORTUNITIES } from '../data/canadaOpportunities'
import { FIELDS } from '../data/fields'
import OpportunityMap from './OpportunityMap'

const SORTS = {
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

function OpportunityCard({ o, selected, onSelect, cardRef }) {
  const primary = FIELD_ORDER.find((f) => o.focus.includes(f)) || o.focus[0]

  // clicking anywhere on the card selects it (highlights it + pans the map to its pin),
  // except the actual "View program" link, which should just follow through as normal
  function handleCardClick(e) {
    if (e.target.closest('a')) return
    onSelect(o.id)
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

export default function OpportunityExplorer() {
  const [activeFields, setActiveFields] = useState(() => new Set(FIELD_ORDER))
  const [level, setLevel] = useState('all')
  const [costFilters, setCostFilters] = useState(() => new Set())
  const [sortKey, setSortKey] = useState('best-match')
  const [selectedId, setSelectedId] = useState(null)
  const listTopRef = useRef(null)
  const cardRefs = useRef(new Map())

  // selecting from the map (a pin the list hasn't scrolled to) should bring the matching
  // card into view; selecting from the list itself already has it in view, so this is a
  // no-op there — safe to call from both directions
  function selectOpportunity(id) {
    setSelectedId((prev) => (prev === id ? null : id))
    cardRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // triggered directly from filter clicks (not a state-watching effect) so it only ever
  // fires from a real user interaction, never on mount or on an unrelated re-render
  function scrollToResults() {
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

    const sortFn = SORTS[sortKey]?.fn
    return sortFn ? [...list].sort(sortFn) : list
  }, [activeFields, level, costFilters, sortKey])

  const activeFieldLabels = FIELD_ORDER.filter((f) => activeFields.has(f)).map((f) => FIELD_META[f].label)

  return (
    <section className="opp-explorer">
      <div className="container opp-container">
        <div className="opp-private-note">
          Private prototype: hand-curated Canada dataset, still mid-verification. Not linked
          from the live site.
        </div>

        <div className="opp-header">
          <p className="opp-eyebrow">We found</p>
          <h1 className="opp-heading">
            <span className="opp-heading-count">{filtered.length}</span> opportunit
            {filtered.length === 1 ? 'y' : 'ies'}
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
            <div ref={listTopRef} className="opp-scroll-anchor" />
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
            </div>
            <div className="opp-list">
              {filtered.map((o) => (
                <OpportunityCard
                  key={o.id}
                  o={o}
                  selected={o.id === selectedId}
                  onSelect={selectOpportunity}
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

          <div className="opp-map-col">
            <OpportunityMap opportunities={filtered} selectedId={selectedId} onSelect={selectOpportunity} />
          </div>
        </div>
      </div>
    </section>
  )
}
