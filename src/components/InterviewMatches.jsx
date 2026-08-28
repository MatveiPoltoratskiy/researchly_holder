import { useEffect, useState } from 'react'
import SymbolField from './SymbolField'
import { celebrateMatches } from '../lib/confetti'
import { prefersReducedMotion } from '../lib/motion'

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
  neuroscience: 'var(--rose)',
  mathematics: 'var(--ribbon)',
  'computer-science': 'var(--spine)',
  psychology: 'var(--mauve)',
  'environmental-science': 'var(--sage-front)',
  humanitarian: 'var(--teal-deep)',
}
const FOCUS_LABEL = {
  'pre-med': 'Pre-Med',
  biology: 'Biology',
  chemistry: 'Chemistry',
  physics: 'Physics',
  neuroscience: 'Neuroscience',
  mathematics: 'Mathematics',
  'computer-science': 'Computer Science',
  psychology: 'Psychology',
  'environmental-science': 'Environmental Science',
  humanitarian: 'Humanitarian & Social Impact',
}

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
  if (!o.matchUniqueReason) return null
  const hook = PITCH_HOOKS[stableHash(String(o.id)) % PITCH_HOOKS.length]
  return `${hook}: ${o.matchUniqueReason}.`
}

// A results-preview screen, not a copy of any particular reference: our own card shell
// (the interview's cream/navy/orange language, org favicons, field-color coding already
// used throughout this feature), and a real computed match score instead of a
// decorative one, front and center in bold orange per the brief.
// warm-palette decoy colors, cycled through during the glitch — kept inside the brand's
// existing accent set (no neon/RGB-split) so the effect reads as dramatic, not gimmicky
const GLITCH_COLORS = ['var(--rose)', 'var(--gold)', 'var(--ribbon)']

export default function InterviewMatches({ matches, onContinue }) {
  const finalCount = matches.length
  const [displayCount, setDisplayCount] = useState(finalCount)
  const [glitchColor, setGlitchColor] = useState(null)
  // bumped on every swap so the digit span remounts instead of re-rendering in place —
  // a remount is what makes the CSS entrance animation actually replay each time (a
  // same-node text change alone wouldn't restart it), which is what makes each digit
  // swap read as a smooth morph instead of a clunky instant cut
  const [tick, setTick] = useState(0)

  // fires once, right as this screen lands — the actual "you're done" payoff moment,
  // not on every re-render (matches/onContinue don't change identity mid-screen anyway)
  useEffect(() => {
    celebrateMatches()
  }, [])

  // the count morphs through a few decoy digits before landing on the real one — a
  // slot-machine flicker rather than a plain fade-in, since this is the single payoff
  // number on the whole screen and deserves more drama than a static digit
  useEffect(() => {
    if (prefersReducedMotion()) return
    let cancelled = false
    const timeouts = []

    function randomDecoy() {
      let n
      do {
        n = 1 + Math.floor(Math.random() * 9)
      } while (n === finalCount)
      return n
    }

    const decoys = [randomDecoy(), randomDecoy(), randomDecoy()]
    const STEP_MS = 150
    decoys.forEach((n, i) => {
      timeouts.push(
        setTimeout(() => {
          if (cancelled) return
          setDisplayCount(n)
          setGlitchColor(GLITCH_COLORS[i % GLITCH_COLORS.length])
          setTick((t) => t + 1)
        }, STEP_MS * (i + 1))
      )
    })
    timeouts.push(
      setTimeout(() => {
        if (cancelled) return
        setDisplayCount(finalCount)
        setGlitchColor(null)
        setTick((t) => t + 1)
      }, STEP_MS * (decoys.length + 1))
    )

    return () => {
      cancelled = true
      timeouts.forEach(clearTimeout)
    }
  }, [finalCount])

  return (
    <section className="interview-page interview-matches-page">
      {/* an ambient field of the same chemistry/physics/math/biology symbols used
          elsewhere on the site (Contact page), not new iconography invented for this
          screen — fixed to the viewport so it reads as one surrounding aura rather than
          scrolling away with the card */}
      <div className="im-matches-symbol-field" aria-hidden="true">
        <SymbolField
          rows={7}
          cols={16}
          opacityRange={[0.16, 0.26]}
          fontSizeRange={[16, 28]}
          colors={['var(--symbol-tan)', 'var(--cover-dark)', 'var(--ribbon)', 'var(--navy)', 'var(--gold)']}
        />
      </div>
      <div className="container interview-container interview-container--matches">
        <div className="im-matches-card-wrap">
          <span className="im-matches-glow" aria-hidden="true" />
          <div className="im-matches-card">
            <p className="im-matches-eyebrow">Based on your answers</p>
            <h1 className="interview-question">
              We found{' '}
              <span className="im-matches-count-wrap">
                <span
                  key={tick}
                  className={`im-matches-count ${glitchColor ? 'is-glitching' : 'is-settled'}`}
                  // both properties needed — see the -webkit-text-fill-color comment on
                  // .im-matches-count in index.css for why `color` alone isn't enough here
                  style={glitchColor ? { color: glitchColor, WebkitTextFillColor: glitchColor } : undefined}
                >
                  {displayCount}
                </span>
              </span>{' '}
              strong matches
            </h1>

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
      </div>
    </section>
  )
}
