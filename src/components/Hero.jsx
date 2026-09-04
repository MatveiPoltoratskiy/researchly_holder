import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion, usePauseAnimationsOffscreen } from '../lib/motion'
import { Link } from '../lib/router'
import SymbolField from './SymbolField'

// the "before" side of the promise — cycled in place of "curious" so the headline
// still reads naturally no matter which one is showing when a visitor lands
const FLICKER_WORDS = ['curious', 'ready', 'driven']
// one extra copy of the first word tacked on the end — scrolling onto that duplicate
// and then snapping the track back to real index 0 (same word, so the snap is invisible)
// is what makes the vertical scroll read as an endless loop instead of visibly resetting
const LOOP_WORDS = [...FLICKER_WORDS, FLICKER_WORDS[0]]

function FlickerWord() {
  const [step, setStep] = useState(0)
  const [animated, setAnimated] = useState(true)
  const [width, setWidth] = useState(null)
  const emRefs = useRef([])

  useEffect(() => {
    if (prefersReducedMotion()) return
    const STEADY_DELAY = 2200 // where it settles once it slows down
    let delay = 260 // rapid on page load
    let timer

    function tick() {
      setStep((s) => s + 1)
      delay = Math.min(STEADY_DELAY, delay * 1.4 + 90) // ramps down from rapid to a steady pace
      timer = setTimeout(tick, delay)
    }

    timer = setTimeout(tick, delay)
    return () => clearTimeout(timer)
  }, [])

  // width tracks whichever word is CURRENTLY showing, not the widest word in the set —
  // a flex column with every word stacked (for the vertical scroll transition) naturally
  // sizes itself to its widest child, so without this the shortest word would sit inside
  // a box wide enough for the longest one, reading as an awkward gap after "Come"
  useEffect(() => {
    const el = emRefs.current[step]
    if (el) setWidth(el.getBoundingClientRect().width)
  }, [step])

  useEffect(() => {
    if (step !== LOOP_WORDS.length - 1) return
    // scrolled onto the duplicate — once that slide finishes, snap back to the real
    // first word with no transition, then re-enable it on the next frame
    const t = setTimeout(() => {
      setAnimated(false)
      setStep(0)
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)))
    }, 520)
    return () => clearTimeout(t)
  }, [step])

  return (
    <span className="th-word" style={width ? { width } : undefined}>
      <span
        className="th-word-viewport"
        style={{ transform: `translateY(-${step * 1.5}em)`, transition: animated ? undefined : 'none' }}
      >
        {LOOP_WORDS.map((word, i) => (
          <em key={i} ref={(el) => { emRefs.current[i] = el }}>{word}</em>
        ))}
      </span>
      .
    </span>
  )
}

export default function Hero() {
  const heroRef = useRef(null)

  usePauseAnimationsOffscreen(heroRef)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const cards = heroRef.current?.querySelectorAll('[data-tilt]') || []
    const handlers = []
    cards.forEach((card) => {
      function onMove(e) {
        const rect = card.getBoundingClientRect()
        const px = (e.clientX - rect.left) / rect.width
        const py = (e.clientY - rect.top) / rect.height
        const rotY = (px - 0.5) * 10
        const rotX = (0.5 - py) * 10
        card.classList.add('is-tilting')
        card.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale(1.02)`
      }
      function onLeave() {
        card.classList.remove('is-tilting')
        card.style.transform = ''
      }
      card.addEventListener('mousemove', onMove)
      card.addEventListener('mouseleave', onLeave)
      handlers.push([card, onMove, onLeave])
    })
    return () => {
      handlers.forEach(([card, onMove, onLeave]) => {
        card.removeEventListener('mousemove', onMove)
        card.removeEventListener('mouseleave', onLeave)
      })
    }
  }, [])

  return (
    <div className="hero th-hero" ref={heroRef}>
      {/* ambient background texture, same treatment as the how-it-works/contact
          sections — faded out behind the headline/phones via a radial mask so it only
          reads near the edges instead of competing with the actual content */}
      <div className="hero-ambient-symbol-field" aria-hidden="true">
        <SymbolField
          rows={9}
          cols={20}
          opacityRange={[0.16, 0.24]}
          fontSizeRange={[12, 20]}
          colors={['var(--symbol-tan)', 'var(--cover-dark)']}
        />
      </div>
      <div className="th-frame">
        <div className="th-flank th-flank--left">
          <div className="th-card-shell" style={{ '--rot': '-8deg', '--stagger': '132px' }}>
            <div className="th-phone" data-tilt>
              <div className="th-phone-notch" />
              <div className="th-phone-camera" />
              <div className="th-phone-btn th-phone-btn--mute" />
              <div className="th-phone-btn th-phone-btn--vol-up" />
              <div className="th-phone-btn th-phone-btn--vol-down" />
              <div className="th-phone-btn th-phone-btn--power" />
              <div className="th-phone-screen">
                <div className="th-phone-status">
                  <span>9:41</span>
                  <span className="th-phone-battery" />
                </div>
                <div className="th-chrome">
                  <div className="th-chrome-dots"><span /><span /><span /></div>
                  <span className="th-chrome-meta">Step 1 of 5</span>
                </div>
                <p className="th-iq-question">What kind of opportunity?</p>
                <div className="th-iq-option">
                  <span className="th-iq-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24"><use href="#icon-search" /></svg>
                  </span>
                  <span className="th-iq-main">
                    <span className="th-iq-label">Research internship</span>
                    <span className="th-iq-desc">Hands-on work in a real lab</span>
                  </span>
                  <span className="th-iq-check" />
                </div>
                <div className="th-iq-option is-selected">
                  <span className="th-iq-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24"><use href="#icon-calendar" /></svg>
                  </span>
                  <span className="th-iq-main">
                    <span className="th-iq-label">Summer program</span>
                    <span className="th-iq-desc">A structured multi-week program</span>
                  </span>
                  <span className="th-iq-check" />
                </div>
                <div className="th-iq-option">
                  <span className="th-iq-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24"><use href="#icon-replay" /></svg>
                  </span>
                  <span className="th-iq-main">
                    <span className="th-iq-label">Year-round program</span>
                    <span className="th-iq-desc">An ongoing school-year commitment</span>
                  </span>
                  <span className="th-iq-check" />
                </div>
                <button className="th-iq-continue" type="button">Continue</button>
              </div>
            </div>
          </div>
        </div>

        <div className="th-center">
          <h1>
            Come <FlickerWord />
            <br />
            Leave with a research path.
          </h1>
          <p className="th-sub">
            Answer a few questions about your interests, academic level, and goals. Researchly
            helps you find research opportunities that actually fit you.
          </p>
          <div className="th-cta-wrap">
            <Link className="th-cta-btn" to="/interview">Build my research path →</Link>
            <p className="th-cta-hint">Takes about 2 minutes.</p>
          </div>
        </div>

        <div className="th-flank th-flank--right">
          <div className="th-card-shell" style={{ '--rot': '8deg', '--stagger': '102px' }}>
            <div className="th-phone" data-tilt>
              <div className="th-mascot" aria-hidden="true">
                <img src="/assets/mascot-logo.png" alt="" />
              </div>
              <div className="th-phone-notch" />
              <div className="th-phone-camera" />
              <div className="th-phone-btn th-phone-btn--mute" />
              <div className="th-phone-btn th-phone-btn--vol-up" />
              <div className="th-phone-btn th-phone-btn--vol-down" />
              <div className="th-phone-btn th-phone-btn--power" />
              <div className="th-phone-screen">
                <div className="th-phone-status">
                  <span>9:41</span>
                  <span className="th-phone-battery" />
                </div>
                <div className="th-chrome">
                  <div className="th-chrome-dots"><span /><span /><span /></div>
                  <span className="th-chrome-meta">Matched for you</span>
                </div>

                <div className="th-opp">
                  <div className="th-opp-head">
                    <span className="th-crest" style={{ color: 'var(--cover)' }}>
                      <svg viewBox="0 0 24 24"><use href="#crest-shield" /></svg>
                      <span>A</span>
                    </span>
                    <div className="th-opp-heading">
                      <p className="th-opp-title">Amgen Scholars Program</p>
                      <p className="th-opp-org">University of Toronto</p>
                    </div>
                    <span className="th-opp-save">
                      <svg width="14" height="14" viewBox="0 0 24 24"><use href="#icon-bookmark" /></svg>
                    </span>
                  </div>
                  <div className="th-opp-detail-row">
                    <span className="th-opp-detail"><svg viewBox="0 0 24 24"><use href="#icon-dollar" /></svg>Paid</span>
                    <span className="th-opp-detail"><svg viewBox="0 0 24 24"><use href="#icon-pin" /></svg>Toronto, ON</span>
                  </div>
                  <div className="th-opp-tags">
                    <span className="th-opp-tag">Pre-Med</span>
                    <span className="th-opp-tag th-tag-green">High Match</span>
                  </div>
                </div>

                <div className="th-opp">
                  <div className="th-opp-head">
                    <span className="th-crest" style={{ color: 'var(--pine)' }}>
                      <svg viewBox="0 0 24 24"><use href="#crest-shield" /></svg>
                      <span>M</span>
                    </span>
                    <div className="th-opp-heading">
                      <p className="th-opp-title">Research Science Institute</p>
                      <p className="th-opp-org">MIT / CEE</p>
                    </div>
                    <span className="th-opp-save">
                      <svg width="14" height="14" viewBox="0 0 24 24"><use href="#icon-bookmark" /></svg>
                    </span>
                  </div>
                  <div className="th-opp-detail-row">
                    <span className="th-opp-detail"><svg viewBox="0 0 24 24"><use href="#icon-dollar" /></svg>Free</span>
                    <span className="th-opp-detail"><svg viewBox="0 0 24 24"><use href="#icon-pin" /></svg>Cambridge, MA</span>
                  </div>
                  <div className="th-opp-tags">
                    <span className="th-opp-tag">High School</span>
                    <span className="th-opp-tag th-tag-green">High Match</span>
                  </div>
                </div>

                <div className="th-opp">
                  <div className="th-opp-head">
                    <span className="th-crest" style={{ color: 'var(--navy)' }}>
                      <svg viewBox="0 0 24 24"><use href="#crest-shield" /></svg>
                      <span>S</span>
                    </span>
                    <div className="th-opp-heading">
                      <p className="th-opp-title">Simons Summer Research</p>
                      <p className="th-opp-org">Stony Brook University</p>
                    </div>
                    <span className="th-opp-save">
                      <svg width="14" height="14" viewBox="0 0 24 24"><use href="#icon-bookmark" /></svg>
                    </span>
                  </div>
                  <div className="th-opp-detail-row">
                    <span className="th-opp-detail"><svg viewBox="0 0 24 24"><use href="#icon-dollar" /></svg>Paid</span>
                    <span className="th-opp-detail"><svg viewBox="0 0 24 24"><use href="#icon-pin" /></svg>Stony Brook, NY</span>
                  </div>
                  <div className="th-opp-tags">
                    <span className="th-opp-tag">High School</span>
                    <span className="th-opp-tag">Good Match</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* solid-color ground band sitting IN FRONT of the phones (higher z-index) — this is
          what gives them a hard, flat cutoff at the bottom instead of a rounded case edge,
          as if they're planted in the plaza rather than floating in front of it */}
      <div className="th-ground-cutoff" aria-hidden="true" />

      <div className="landscape-wrap">
        <img className="scene-img" src="/assets/hero-scene.png" alt="" aria-hidden="true" />
      </div>
    </div>
  )
}
