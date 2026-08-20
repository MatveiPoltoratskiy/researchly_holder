import { useState } from 'react'

// Small standalone favicon-fallback logo, deliberately not imported from
// OpportunityExplorer.jsx — keeps this component's chunk lean instead of pulling in the
// larger map/list module just for one badge.
function OrgLogo({ org, url }) {
  const domain = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, '')
    } catch {
      return null
    }
  })()
  const [stage, setStage] = useState(domain ? 'google' : 'letter')

  if (stage === 'google') {
    return (
      <img
        className="im-match-logo-img"
        src={`https://www.google.com/s2/favicons?sz=128&domain=${domain}`}
        alt=""
        onError={() => setStage('duckduckgo')}
      />
    )
  }
  if (stage === 'duckduckgo') {
    return (
      <img
        className="im-match-logo-img"
        src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
        alt=""
        onError={() => setStage('letter')}
      />
    )
  }
  return <span className="im-match-logo-letter">{(org.trim()[0] || '?').toUpperCase()}</span>
}

const FOCUS_COLOR = {
  'pre-med': 'var(--cover)',
  biology: 'var(--pine)',
  chemistry: 'var(--gold)',
  physics: 'var(--navy)',
}
const FOCUS_LABEL = { 'pre-med': 'Pre-Med', biology: 'Biology', chemistry: 'Chemistry', physics: 'Physics' }

function levelHint(levels) {
  const hs = levels.some((l) => l.startsWith('hs'))
  const ug = levels.some((l) => l.startsWith('ugrad'))
  if (hs && ug) return 'HS & undergrad'
  if (hs) return 'High school'
  if (ug) return 'Undergrad'
  return null
}

// A small pool of hooks, not one canned phrase — a stable per-card hash picks one so the
// same opportunity always reads the same way instead of reshuffling on every re-render.
const PITCH_HOOKS = [
  'Straight-up good fit',
  "This one's calling your name",
  'Hard to ignore',
  'Low-key ideal',
  'Rare combo',
  'Worth a serious look',
  'Stands out fast',
  "Don't sleep on this one",
]

function stableHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

function pitchFor(o) {
  if (!o.matchReasons.length) return null
  const hook = PITCH_HOOKS[stableHash(String(o.id)) % PITCH_HOOKS.length]
  return `${hook} — ${o.matchReasons.join(', plus ')}.`
}

// A results-preview screen, not a copy of any particular reference: our own card shell
// (the interview's cream/navy/orange language, org favicons, field-color coding already
// used throughout this feature), and a real computed match score instead of a
// decorative one, front and center in bold orange per the brief.
export default function InterviewMatches({ matches, onContinue }) {
  return (
    <section className="interview-page interview-matches-page">
      <div className="container interview-container">
        <div className="im-matches-card">
          <p className="im-matches-eyebrow">Based on your answers</p>
          <h1 className="interview-question">
            We found <span className="im-matches-count">{matches.length}</span> strong matches
          </h1>
          <p className="interview-subtext">
            Ranked by field, eligibility, format, pay, and location, closest fit first.
          </p>

          <div className="im-match-list">
            {matches.map((o) => {
              const primary = o.focus.find((f) => FOCUS_COLOR[f]) || o.focus[0]
              const color = FOCUS_COLOR[primary] || 'var(--cover)'
              const hint = levelHint(o.levels)
              return (
                <a
                  key={o.id}
                  className="im-match-card"
                  href={o.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ '--focus-color': color }}
                >
                  <span className="im-match-logo">
                    <OrgLogo org={o.org} url={o.url} />
                  </span>
                  <span className="im-match-main">
                    <span className="im-match-top-row">
                      {FOCUS_LABEL[primary] && <span className="im-match-field-tag">{FOCUS_LABEL[primary]}</span>}
                      {hint && <span className="im-match-meta">{hint}</span>}
                      {o.paid && <span className="im-match-meta">Paid</span>}
                    </span>
                    <span className="im-match-name">{o.name}</span>
                    <span className="im-match-org">{o.org}</span>
                    {pitchFor(o) && <span className="im-match-pitch">{pitchFor(o)}</span>}
                  </span>
                  <span className="im-match-pct">
                    <span className="im-match-pct-num">{o.matchPct}%</span>
                    <span className="im-match-pct-label">match</span>
                  </span>
                </a>
              )
            })}
          </div>

          <button type="button" className="interview-continue-btn im-matches-cta" onClick={onContinue}>
            See all your matches
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-arrow" /></svg>
          </button>
        </div>
      </div>
    </section>
  )
}
