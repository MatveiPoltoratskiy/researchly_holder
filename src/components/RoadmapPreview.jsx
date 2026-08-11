import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../lib/motion'

const INTERVIEW_FIELDS = [
  { label: 'Interest', value: 'Neuroscience' },
  { label: 'Level', value: 'Junior' },
  { label: 'Location', value: 'New York, NY' },
  { label: 'Timing', value: 'Summer' },
  { label: 'Paid?', value: "Doesn't matter" },
]

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const MATCHES = [
  { badge: 'S', variant: 'a', name: 'Summer Undergraduate Research Program', uni: 'Stanford University', tags: [['Summer'], ['In-person'], ['High Match', 'green']], pct: 96 },
  { badge: 'J', variant: 'b', name: 'Undergraduate Research Fellows', uni: 'The Jackson Laboratory', tags: [['Year-round'], ['Paid'], ['High Match', 'green']], pct: 93 },
  { badge: 'C', variant: 'c', name: 'Undergraduate Research Apprenticeship', uni: 'Cold Spring Harbor Laboratory', tags: [['Summer'], ['Research'], ['Good Match', 'amber']], pct: 90 },
  { badge: 'M', variant: 'd', name: 'Research Science Institute', uni: 'MIT / Center for Excellence in Education', tags: [['Summer'], ['High School'], ['High Match', 'green']], pct: 89 },
  { badge: 'SB', variant: 'e', name: 'Simons Summer Research Program', uni: 'Stony Brook University', tags: [['Summer'], ['High School'], ['Good Match', 'amber']], pct: 86 },
]

export default function RoadmapPreview() {
  const cardRef = useRef(null)
  const sheenRef = useRef(null)
  const rafRef = useRef(null)
  const pausedRef = useRef(false)
  const [phase, setPhase] = useState('interview')
  const [activeField, setActiveField] = useState(0)
  const [filledCount, setFilledCount] = useState(0)
  const [runId, setRunId] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  // plays on mount (and again via the replay button): cursor "fills out" the interview
  // field by field, then the card crossfades into the matches list. The pause button lets
  // this be paused/resumed at any point without restarting it.
  useEffect(() => {
    if (prefersReducedMotion()) {
      setPhase('matches')
      return
    }
    let cancelled = false

    async function pausableWait(ms) {
      const step = 50
      let elapsed = 0
      while (elapsed < ms) {
        if (cancelled) return
        await wait(step)
        if (!pausedRef.current) elapsed += step
      }
    }

    async function run() {
      for (let i = 0; i < INTERVIEW_FIELDS.length; i++) {
        if (cancelled) return
        setActiveField(i)
        await pausableWait(400)
        if (cancelled) return
        setFilledCount(i + 1)
        await pausableWait(430)
      }
      if (cancelled) return
      await pausableWait(500)
      if (cancelled) return
      setPhase('loading')
      await pausableWait(400)
      if (cancelled) return
      setPhase('matches')
    }
    run()
    return () => {
      cancelled = true
    }
  }, [runId])

  function handleReplay() {
    setPaused(false)
    setFilledCount(0)
    setActiveField(0)
    setPhase('interview')
    setRunId((id) => id + 1)
  }

  function handleTogglePause() {
    setPaused((p) => !p)
  }

  useEffect(() => {
    const card = cardRef.current
    if (!card || prefersReducedMotion()) return

    function handleMouseMove(e) {
      const rect = card.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      const rotY = (px - 0.5) * 12
      const rotX = (0.5 - py) * 12
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        card.classList.add('is-tilting')
        card.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale(1.015)`
      })
      if (sheenRef.current) {
        sheenRef.current.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,.6), transparent 60%)`
      }
    }

    function handleMouseLeave() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      card.classList.remove('is-tilting')
      card.style.transform = ''
    }

    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('mouseleave', handleMouseLeave)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className="hero-card-wrap">
      <div className="hero-card" aria-hidden="true">
        <div className="hero-card-scale">
          <div className="hero-card-inner" ref={cardRef}>
            <div className="card-sheen" ref={sheenRef}></div>
            <div className="card-head">
              <div className="card-head-left">
                <svg viewBox="0 0 60 60"><use href="#mascot-tiny" /></svg>
                <div>
                  <div className="card-title">Your Research Path</div>
                  <div className="card-sub">
                    {phase === 'interview' && 'Tell us about you — takes 30 seconds.'}
                    {phase === 'loading' && 'Finding your matches…'}
                    {phase === 'matches' && 'Personalized matches based on your goals and interests.'}
                  </div>
                </div>
              </div>
              <div className="card-avatar"><svg viewBox="0 0 24 24"><use href="#icon-avatar" /></svg></div>
            </div>

            {phase === 'interview' && (
              <div className="card-interview">
                <div className="card-label">Quick interview</div>
                <div className="card-irows">
                  {INTERVIEW_FIELDS.map((f, i) => (
                    <div
                      key={f.label}
                      className={`card-irow${i < filledCount ? ' is-done' : i === activeField ? ' is-active' : ''}`}
                    >
                      <span className="card-irow-label">{f.label}</span>
                      {i < filledCount && <span className="card-irow-value">{f.value}</span>}
                    </div>
                  ))}
                  <span className="card-cursor" style={{ '--row': activeField }} aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path d="M5 3l14 8-6 2-2 6z" fill="var(--navy)" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>
            )}

            {phase === 'loading' && (
              <div className="card-loading">
                <svg className="card-loading-spinner" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="34 100" />
                </svg>
                <span>Finding your matches…</span>
              </div>
            )}

            {phase === 'matches' && (
              <div className="card-body">
                <div className="card-rail">
                  <span className="is-active"><svg viewBox="0 0 24 24"><use href="#icon-home" /></svg></span>
                  <span><svg viewBox="0 0 24 24"><use href="#icon-list" /></svg></span>
                  <span><svg viewBox="0 0 24 24"><use href="#icon-compass" /></svg></span>
                  <span><svg viewBox="0 0 24 24"><use href="#icon-bookmark" /></svg></span>
                  <span><svg viewBox="0 0 24 24"><use href="#icon-user" /></svg></span>
                </div>
                <div className="card-main">
                  <div className="card-label">Top program matches</div>
                  {MATCHES.map((m) => (
                    <div className="match-row" key={m.name}>
                      <div className={`u-badge u-badge--${m.variant}`}>{m.badge}</div>
                      <div className="match-info">
                        <div className="match-name">{m.name}</div>
                        <div className="match-uni">{m.uni}</div>
                        <div className="match-tags">
                          {m.tags.map(([label, tone]) => (
                            <span key={label} className={`tag${tone ? ` tag-${tone}` : ''}`}>{label}</span>
                          ))}
                        </div>
                      </div>
                      <div className="match-score">
                        <div className="pct">{m.pct}%</div>
                        <div className="lbl">Match</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {phase === 'matches' && <div className="card-foot">View full roadmap →</div>}
          </div>

          <div className={`hero-mascot${phase !== 'matches' ? ' is-compact' : ''}`} aria-hidden="true">
            <div className="hero-mascot-float">
              <img src="/assets/mascot-logo.png" alt="" />
            </div>
          </div>
        </div>
      </div>

      <div className="hero-card-controls">
        <button type="button" className="hero-card-control" onClick={handleTogglePause}>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            {paused ? (
              <path d="M6 4l14 8-14 8Z" fill="currentColor" />
            ) : (
              <path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" />
            )}
          </svg>
          {paused ? 'Resume demo' : 'Pause demo'}
        </button>
        <button type="button" className="hero-card-control" onClick={handleReplay}>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><use href="#icon-replay" /></svg>
          Replay demo
        </button>
      </div>
    </div>
  )
}
