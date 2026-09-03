import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../lib/motion'

const REVIEWS = [
  { color: 'var(--cover)', text: "Bro this is actually sick, I found research internships that I didn’t know even existed even with my resume being cooked." },
  { color: 'var(--pine)', text: "Clean layout overall. Didn’t feel overwhelming, which is rare for research and all of these websites in one." },
  { color: 'var(--navy)', text: "ngl I thought this was gonna be another ChatGPT wrapper but it’s actually saving my med school requirements." },
  { color: 'var(--cover)', text: "Everything just makes sense. It’s like a mix of Khan Academy and research opportunities in one." },
  { color: 'var(--pine)', text: "This would’ve saved me days when I was looking for summer research a few months ago, crazy find." },
  { color: 'var(--navy)', text: "Finally something that is a free tool for students, and I actually understand what I’m supposed to do next instead of opening 15 tabs." },
  { color: 'var(--cover)', text: "I didn’t even realize there were research programs for high school students. This roadmap helped me understand where I could start!" },
  { color: 'var(--pine)', text: "It feels like the kind of tool I wish existed when I first started looking into research, would’ve saved me hours." },
  { color: 'var(--navy)', text: "I finally know where to start, I’m so mad I didn’t have this during summer internship season…" },
]

function ReviewCard({ color, text }) {
  return (
    <div className="review-card">
      <div className="review-head">
        <span className="review-quote" style={{ background: color }}>&ldquo;</span>
        <span className="review-stars">★★★★★</span>
      </div>
      <p className="review-text">{text}</p>
    </div>
  )
}

const SPEED_PX_PER_SEC = 36

export default function ReviewCarousel() {
  // rendered twice back-to-back so a -50% translateX loop is seamless
  const looped = [...REVIEWS, ...REVIEWS]

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
    const first = track?.querySelector('.review-card')
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
        <p className="reviews-kicker">Students like you say&hellip;</p>
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
        <button type="button" className="reviews-arrow reviews-arrow--prev" aria-label="Previous reviews" onClick={() => step(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>

        <div className="reviews-track-wrap">
          <div className="reviews-track" ref={trackRef}>
            {looped.map((review, i) => (
              <ReviewCard key={i} {...review} />
            ))}
          </div>
        </div>

        <button type="button" className="reviews-arrow reviews-arrow--next" aria-label="Next reviews" onClick={() => step(1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </section>
  )
}
