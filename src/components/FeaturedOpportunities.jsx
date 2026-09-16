import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../lib/motion'
import { CANADA_OPPORTUNITIES } from '../data/canadaOpportunities'
import { OrgLogo, iconForOrg } from './OrgLogo'
import { deadlineCellLabel } from '../lib/deadlineStatus'
import { Link } from '../lib/router'

// A hand-picked, deliberately varied set of real records from the live dataset — different
// fields, levels, countries, price points, and (on purpose) different deadline states, so
// the strip itself demonstrates the deadline system rather than just listing programs.
// Looked up by id at render time, never copied, so an edit to the underlying record (a
// confirmed deadline landing, say) shows up here automatically with nothing to keep in sync.
const FEATURED_IDS = [
  'perimeter-issyp',
  'amgen-stanford',
  'umanitoba-science-usra',
  'sickkids-ssure',
  'natgeo-young-explorers-grant',
  'rockefeller-surf',
  'triumf-undergrad-coop',
  'shad-canada',
  'simons-summer-research-sbu',
  'mcgill-youth-biodiversity',
]
const FEATURED = FEATURED_IDS.map((id) => CANADA_OPPORTUNITIES.find((o) => o.id === id)).filter(Boolean)

function opportunityType(o) {
  if (o.isGrant) return 'Grant / Award'
  if (o.availability === 'academic-year') return 'Academic-Year Program'
  if (o.availability === 'year-round') return 'Year-Round Program'
  return 'Summer Program'
}

function FeaturedCard({ o }) {
  return (
    <Link to="/opportunities" className="feature-card">
      <div className="feature-card-head">
        <div className="feature-card-badge">
          <OrgLogo org={o.org} url={o.url} iconId={iconForOrg(o.org)} />
        </div>
        <span className="feature-card-type">{opportunityType(o)}</span>
      </div>
      <h3 className="feature-card-name">{o.name}</h3>
      <div className="feature-card-org">{o.org}</div>
      <div className="feature-card-meta">
        <span className="feature-card-meta-item">
          <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-pin" /></svg>
          <span className="feature-card-meta-text">{o.locationLabel}</span>
        </span>
        <span className="feature-card-meta-item">
          <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-calendar" /></svg>
          <span className="feature-card-meta-text">{deadlineCellLabel(o)}</span>
        </span>
      </div>
    </Link>
  )
}

const SPEED_PX_PER_SEC = 36

export default function FeaturedOpportunities() {
  // rendered twice back-to-back so a -50% translateX loop is seamless
  const looped = [...FEATURED, ...FEATURED]

  const trackRef = useRef(null)
  const posRef = useRef(0) // current translateX, always <= 0
  const setWidthRef = useRef(0) // px width of one full (non-doubled) set of cards
  const rafRef = useRef(null)
  const lastTsRef = useRef(null)
  const [paused, setPaused] = useState(prefersReducedMotion())

  function applyTransform(withTransition) {
    const track = trackRef.current
    if (!track) return
    track.style.transition = withTransition ? 'transform .45s cubic-bezier(.4,0,.2,1)' : 'none'
    track.style.transform = `translateX(${posRef.current}px)`
  }

  useEffect(() => {
    function measure() {
      const track = trackRef.current
      if (!track) return
      setWidthRef.current = track.scrollWidth / 2
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    if (paused) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastTsRef.current = null
      return
    }

    function tick(ts) {
      if (lastTsRef.current == null) lastTsRef.current = ts
      const dt = (ts - lastTsRef.current) / 1000
      lastTsRef.current = ts

      posRef.current -= SPEED_PX_PER_SEC * dt
      const setWidth = setWidthRef.current
      if (setWidth && posRef.current <= -setWidth) posRef.current += setWidth

      applyTransform(false)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastTsRef.current = null
    }
  }, [paused])

  function step(dir) {
    setPaused(true)
    const track = trackRef.current
    const first = track?.querySelector('.feature-card')
    const cardStep = first ? first.getBoundingClientRect().width + 22 : 300
    const setWidth = setWidthRef.current
    posRef.current -= dir * cardStep
    if (setWidth) {
      if (posRef.current <= -setWidth) posRef.current += setWidth
      if (posRef.current > 0) posRef.current -= setWidth
    }
    applyTransform(true)
  }

  function handleReplay() {
    posRef.current = 0
    applyTransform(true)
    setPaused(false)
  }

  return (
    <section className="reviews-section">
      <div className="reviews-head">
        <p className="reviews-kicker">Already on Researchly&hellip;</p>
        <div className="reviews-controls">
          <button type="button" className="reviews-control" onClick={() => setPaused((p) => !p)}>
            {paused ? (
              <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4l14 8-14 8V4Z" fill="currentColor" /></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="4" height="16" fill="currentColor" /><rect x="14" y="4" width="4" height="16" fill="currentColor" /></svg>
            )}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button type="button" className="reviews-control" onClick={handleReplay}>
            <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-replay" /></svg>
            Replay
          </button>
        </div>
      </div>

      <div className="reviews-row">
        <button type="button" className="reviews-arrow reviews-arrow--prev" aria-label="Previous opportunities" onClick={() => step(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>

        <div className="reviews-track-wrap">
          <div className="reviews-track" ref={trackRef}>
            {looped.map((o, i) => (
              <FeaturedCard key={`${o.id}-${i}`} o={o} />
            ))}
          </div>
        </div>

        <button type="button" className="reviews-arrow reviews-arrow--next" aria-label="Next opportunities" onClick={() => step(1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      <Link to="/opportunities" className="feature-view-all">
        Browse all opportunities
        <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </Link>
    </section>
  )
}
