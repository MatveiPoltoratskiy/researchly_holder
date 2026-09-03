import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion, usePauseAnimationsOffscreen } from '../lib/motion'
import { Link } from '../lib/router'

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
        style={{ transform: `translateY(-${step * 1.28}em)`, transition: animated ? undefined : 'none' }}
      >
        {LOOP_WORDS.map((word, i) => (
          <em key={i} ref={(el) => { emRefs.current[i] = el }}>{word}</em>
        ))}
      </span>
      .
    </span>
  )
}

const SYMBOL_POOL = [
  'α', 'β', 'γ', 'δ', 'λ', 'μ', 'π', 'Ω', 'Σ', 'Δ', 'θ', 'φ', 'Ψ', 'Ξ', 'ε', 'ρ', 'τ', 'ω',
  'H₂O', 'NH₃', 'CO₂', 'C₆H₁₂O₆', 'NaCl', 'O₂', 'CH₄', 'C₆H₁₀N₂O₂',
  '∫', '∇', '∂', '∞', '≈', '≠', '√', '∴', '±',
  'E = mc²', 'F = ma', 'ħ', 'ΔE', 'v = λf',
  'DNA', 'RNA', 'ATP', 'mRNA', 'ADP',
]

function randSymbol() {
  return SYMBOL_POOL[Math.floor(Math.random() * SYMBOL_POOL.length)]
}

export default function Hero() {
  const heroRef = useRef(null)
  const landscapeRef = useRef(null)
  const symbolFieldRef = useRef(null)
  const symbolElsRef = useRef([])
  const cycleTimerRef = useRef(null)
  const resizeTimerRef = useRef(null)

  usePauseAnimationsOffscreen(heroRef)

  // ambient chem/math symbols scattered across the sky band above the landscape —
  // positioned relative to where the landscape actually sits, so the band tracks it
  // instead of a hardcoded pixel offset that drifts out of place at other heights
  useEffect(() => {
    const symbolField = symbolFieldRef.current
    const heroEl = heroRef.current
    const landscapeEl = landscapeRef.current
    if (!symbolField || !heroEl || !landscapeEl) return

    const reduceMotion = prefersReducedMotion()

    function buildSymbolField() {
      symbolField.innerHTML = ''
      symbolElsRef.current = []

      const heroRect = heroEl.getBoundingClientRect()
      const landscapeRect = landscapeEl.getBoundingClientRect()
      if (!heroRect.height) return

      const landscapeTopPct = ((landscapeRect.top - heroRect.top) / heroRect.height) * 100
      const bandTopPct = Math.max(4, landscapeTopPct * 0.15)
      const bandHeightPct = Math.max(10, landscapeTopPct * 0.7)

      // sparser and bigger than a "texture" — few enough to read as individual
      // formulas/symbols floating in the sky, not a dense wallpaper pattern
      const cols = 5
      const rows = 2
      const cellW = 100 / cols
      const cellH = bandHeightPct / rows

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const xPct = (col + 0.5) * cellW + (Math.random() - 0.5) * cellW * 0.5
          const yPct = bandTopPct + (row + 0.5) * cellH + (Math.random() - 0.5) * cellH * 0.5

          const opacity = 0.45 + Math.random() * 0.15
          const fontSize = 28 + Math.random() * 16
          const rot = -5 + Math.random() * 10
          const waveAmp = 5 + Math.random() * 3
          const waveDur = 5.4 + Math.random() * 0.6
          const waveDelay = (xPct / 100) * waveDur * 0.9

          const span = document.createElement('span')
          span.textContent = randSymbol()
          span.style.left = xPct.toFixed(2) + '%'
          span.style.top = yPct.toFixed(2) + '%'
          span.style.fontSize = fontSize.toFixed(1) + 'px'
          span.style.setProperty('--rot', rot.toFixed(1) + 'deg')
          span.style.setProperty('--wave-amp', waveAmp.toFixed(1) + 'px')
          span.style.setProperty('--wave-dur', waveDur.toFixed(2) + 's')
          span.style.setProperty('--wave-delay', '-' + waveDelay.toFixed(2) + 's')
          span.style.opacity = opacity.toFixed(3)
          span.dataset.targetOpacity = opacity.toFixed(3)
          symbolField.appendChild(span)
          symbolElsRef.current.push(span)
        }
      }
    }

    function cycleSymbols() {
      if (heroEl.classList.contains('is-offscreen')) return
      const els = symbolElsRef.current
      const n = els.length
      if (!n) return
      const swapCount = Math.max(1, Math.round(n * (0.12 + Math.random() * 0.13)))
      const idxs = {}
      while (Object.keys(idxs).length < swapCount && Object.keys(idxs).length < n) {
        idxs[Math.floor(Math.random() * n)] = true
      }
      Object.keys(idxs).forEach((key) => {
        const el = els[key]
        if (!el) return
        el.style.opacity = '0'
        setTimeout(() => {
          let next = randSymbol()
          let tries = 0
          while (next === el.textContent && tries < 5) {
            next = randSymbol()
            tries++
          }
          el.textContent = next
          requestAnimationFrame(() => {
            el.style.opacity = el.dataset.targetOpacity
          })
        }, 90)
      })
    }

    function scheduleSymbolCycle() {
      const delay = 1000 + Math.random() * 1000
      cycleTimerRef.current = setTimeout(() => {
        cycleSymbols()
        scheduleSymbolCycle()
      }, delay)
    }

    buildSymbolField()
    if (!reduceMotion) scheduleSymbolCycle()

    function handleResize() {
      clearTimeout(resizeTimerRef.current)
      resizeTimerRef.current = setTimeout(buildSymbolField, 300)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(cycleTimerRef.current)
      clearTimeout(resizeTimerRef.current)
    }
  }, [])

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
      <div className="symbol-field" ref={symbolFieldRef} aria-hidden="true"></div>

      <div className="th-frame">
        <div className="th-flank th-flank--left">
          <div className="th-card-shell" style={{ '--rot': '-8deg', '--stagger': '76px' }}>
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
          <div className="th-card-shell" style={{ '--rot': '8deg', '--stagger': '46px' }}>
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

      <div className="landscape-wrap" ref={landscapeRef}>
        <div className="hero-hills-glow" aria-hidden="true" />
        <svg className="scene-svg" viewBox="0 0 1536 538" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
          <polygon points="0,560 0,320 90,260 180,300 260,230 340,280 430,190 520,260 610,210 700,150 780,200 860,160 950,220 1040,180 1130,240 1220,190 1310,250 1400,210 1480,260 1536,230 1536,560" fill="var(--sage-back)" stroke="rgba(65,92,57,.3)" strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points="0,560 0,380 70,330 150,360 230,300 310,350 400,290 480,340 570,270 650,330 730,280 820,340 900,290 990,350 1080,300 1170,360 1260,310 1350,350 1440,300 1536,340 1536,560" fill="var(--sage-mid)" />
          <use className="tree-group" href="#scene-trees" x="130" y="330" width="34" height="46" />
          <use className="tree-group" href="#scene-trees" x="300" y="320" width="30" height="42" />
          <use className="tree-group" href="#scene-trees" x="1230" y="320" width="32" height="44" />
          <use className="tree-group" href="#scene-trees" x="1400" y="330" width="30" height="42" />
          <polygon points="0,560 0,420 60,380 140,400 220,360 300,400 380,360 460,410 520,460 520,560" fill="var(--sage-front)" />
          <polygon points="1020,560 1020,460 1090,400 1160,420 1240,370 1320,410 1400,370 1480,400 1536,420 1536,560" fill="var(--sage-front)" />
          <use className="tree-group" href="#scene-trees" x="470" y="368" width="44" height="62" />
          <use className="tree-group" href="#scene-trees" x="540" y="380" width="38" height="54" />
          <use className="tree-group" href="#scene-trees" x="980" y="378" width="40" height="56" />
          <use className="tree-group" href="#scene-trees" x="1050" y="368" width="44" height="62" />
          <rect x="0" y="460" width="1536" height="100" fill="var(--stone)" />
          <g stroke="#00000012" strokeWidth="1">
            <line x1="0" y1="490" x2="1536" y2="490" />
            <line x1="0" y1="520" x2="1536" y2="520" />
          </g>
          <use href="#prop-books" x="4" y="378" width="220" height="157" />
          <use href="#prop-microscope" x="300" y="336" width="150" height="193" />
          <use href="#prop-flasks" x="1210" y="322" width="185" height="206" />
          <use href="#prop-plant" x="1400" y="342" width="140" height="172" />
        </svg>
      </div>
    </div>
  )
}
