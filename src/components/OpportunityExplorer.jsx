import { useMemo, useState } from 'react'
import { CANADA_OPPORTUNITIES } from '../data/canadaOpportunities'

const FIELD_META = {
  'pre-med': { label: 'Pre-Med', cls: 'opp-tag--premed' },
  biology: { label: 'Biology', cls: 'opp-tag--bio' },
  chemistry: { label: 'Chemistry', cls: 'opp-tag--chem' },
  physics: { label: 'Physics', cls: 'opp-tag--physics' },
}
const FIELD_ORDER = ['pre-med', 'biology', 'chemistry', 'physics']

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

function OpportunityCard({ o }) {
  const primary = FIELD_ORDER.find((f) => o.focus.includes(f)) || o.focus[0]
  const initial = (o.org || o.name).trim()[0]?.toUpperCase() || '?'

  return (
    <article className="opp-card">
      <div className={`opp-badge ${FIELD_META[primary]?.cls || ''}`}>{initial}</div>
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

export default function OpportunityExplorer() {
  const [activeFields, setActiveFields] = useState(() => new Set(FIELD_ORDER))
  const [level, setLevel] = useState('all')

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

  return (
    <section className="opp-explorer">
      <div className="container opp-container">
        <div className="opp-private-note">
          Private prototype — hand-curated Canada dataset, still mid-verification. Not linked
          from the live site.
        </div>

        <div className="opp-header">
          <h1 className="opp-heading">
            We found <span className="opp-heading-count">{filtered.length}</span> opportunit
            {filtered.length === 1 ? 'y' : 'ies'}
          </h1>
          <p className="opp-subheading">Canada · pre-med, biology, chemistry &amp; physics</p>
        </div>

        <div className="opp-filters">
          <div className="opp-chip-row">
            {FIELD_ORDER.map((f) => (
              <button
                key={f}
                type="button"
                className={`opp-chip ${FIELD_META[f].cls} ${activeFields.has(f) ? 'is-active' : ''}`}
                onClick={() => toggleField(f)}
              >
                {FIELD_META[f].label}
                <span className="opp-chip-count">{counts[f]}</span>
              </button>
            ))}
          </div>
          <div className="opp-level-row">
            {[
              ['all', 'All levels'],
              ['hs', 'High school'],
              ['undergrad', 'Undergrad'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`opp-level-btn ${level === key ? 'is-active' : ''}`}
                onClick={() => setLevel(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="opp-list">
          {filtered.map((o) => (
            <OpportunityCard key={o.id} o={o} />
          ))}
          {filtered.length === 0 && (
            <div className="opp-empty">No opportunities match this combination yet.</div>
          )}
        </div>
      </div>
    </section>
  )
}
