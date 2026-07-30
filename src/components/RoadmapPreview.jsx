import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../lib/motion'

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
    <div className="hero-card" aria-hidden="true">
      <div className="hero-card-scale">
        <div className="hero-card-inner" ref={cardRef}>
          <div className="card-sheen" ref={sheenRef}></div>
          <div className="card-head">
            <div className="card-head-left">
              <svg viewBox="0 0 60 60"><use href="#mascot-tiny" /></svg>
              <div>
                <div className="card-title">Your Research Path</div>
                <div className="card-sub">Personalized matches based on your goals and interests.</div>
              </div>
            </div>
            <div className="card-avatar"><svg viewBox="0 0 24 24"><use href="#icon-avatar" /></svg></div>
          </div>
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
          <div className="card-foot">View full roadmap →</div>
        </div>
      </div>
      <div className="hero-mascot" aria-hidden="true">
        <div className="hero-mascot-float">
          <img src="/assets/mascot-logo.png" alt="" />
        </div>
      </div>
    </div>
  )
}
