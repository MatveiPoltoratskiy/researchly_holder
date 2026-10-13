import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion, usePauseAnimationsOffscreen } from '../lib/motion'
import SymbolField from './SymbolField'
import InterviewCta from './InterviewCta'

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
    // +6px buffer: italic text's rightmost ink (especially with the text-stroke this font
    // gets) can paint slightly past its own layout box — without this, whichever word
    // happens to be widest gets its last letter shaved off by .th-word's overflow:hidden.
    if (el) setWidth(el.getBoundingClientRect().width + 6)
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
          rows={6}
          cols={14}
          opacityRange={[0.11, 0.18]}
          fontSizeRange={[12, 20]}
          colors={['var(--symbol-tan)', 'var(--cover-dark)']}
        />
      </div>
      <div className="th-frame">
        <div className="th-flank th-flank--left">
          <div className="th-card-shell" style={{ '--rot': '-3deg', '--stagger': '102px' }}>
            {/* the provided mockup photo, used whole (its own bezel, notch, and tilt) rather
                than cropping just the screen into our coded bezel — that split the phone's
                natural camera-angle tilt from a dead-straight bezel, so the map/banner inside
                looked crooked. Using the photo as a single unit keeps everything consistent,
                masked out of its own background/props so it drops into the scene cleanly. */}
            <img className="th-phone-image" src="/assets/hero-phone-map.png" alt="" data-tilt />
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
            <InterviewCta className="th-cta-btn">Build my research path →</InterviewCta>
            <p className="th-cta-hint">Used by 1,500+ students.</p>
          </div>
        </div>

        <div className="th-flank th-flank--right">
          {/* hero-phone-matches-right.png: a single flat image, same treatment as the
              left phone (see that comment) rather than a live CSS overlay — the "Matched
              for you" cards are baked in, perspective-warped to this photo's own screen
              area in Python/PIL/OpenCV (not hand-tuned CSS), so there's no runtime
              alignment between a photo and separately-positioned HTML to get wrong. Built
              from: (1) hero-phone-map.png's screen erased to a transparent window, same
              as the left phone's bezel; (2) the card content re-rendered flat via PIL
              using the live design's own colors/type; (3) a cv2 perspective warp of (2)
              into (1)'s screen-corner coordinates, composited and mirrored as one piece. */}
          <div className="th-card-shell" style={{ '--rot': '3deg', '--stagger': '102px' }}>
            <img className="th-phone-image" src="/assets/hero-phone-matches-right.png" alt="" data-tilt />
            <div className="th-mascot" aria-hidden="true">
              <img src="/assets/mascot-logo.png" alt="" />
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
