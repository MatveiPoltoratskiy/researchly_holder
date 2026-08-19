import { useMemo, useRef, useState } from 'react'
import { CANADA_OPPORTUNITIES } from '../data/canadaOpportunities'
import { FIELDS } from '../data/fields'

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

function OpportunityCard({ o }) {
  const primary = FIELD_ORDER.find((f) => o.focus.includes(f)) || o.focus[0]

  return (
    <article className="opp-card">
      <div className={`opp-badge ${FIELD_META[primary]?.cls || ''}`}>
        <svg width="20" height="20" aria-hidden="true">
          <use href={`#${iconForOrg(o.org)}`} />
        </svg>
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
        </div>
        <div className="opp-foot">
          <span className="opp-pay">{payLabel(o)}</span>
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
  const listTopRef = useRef(null)

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

  const counts = useMemo(() => {
    const c = { 'pre-med': 0, biology: 0, chemistry: 0, physics: 0 }
    for (const o of CANADA_OPPORTUNITIES) {
      for (const f of o.focus) if (f in c) c[f] += 1
    }
    return c
  }, [])

  const filtered = useMemo(() => {
    return CANADA_OPPORTUNITIES.filter((o) => {
      const fieldMatch = o.focus.some((f) => activeFields.has(f))
      if (!fieldMatch) return false
      if (level === 'all') return true
      if (level === 'hs') return o.levels.some((l) => l.startsWith('hs'))
      return o.levels.some((l) => l.startsWith('ugrad'))
    })
  }, [activeFields, level])

  const activeFieldLabels = FIELD_ORDER.filter((f) => activeFields.has(f)).map((f) => FIELD_META[f].label)

  return (
    <section className="opp-explorer">
      <div className="container opp-container">
        <div className="opp-private-note">
          Private prototype — hand-curated Canada dataset, still mid-verification. Not linked
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
          </aside>

          <div className="opp-results">
            <div ref={listTopRef} className="opp-scroll-anchor" />
            <div className="opp-list">
              {filtered.map((o) => (
                <OpportunityCard key={o.id} o={o} />
              ))}
              {filtered.length === 0 && (
                <div className="opp-empty">No opportunities match this combination yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
