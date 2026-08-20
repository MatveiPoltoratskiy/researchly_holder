import { useEffect, useRef, useState } from 'react'
import { burstConfetti } from '../lib/confetti'

// A card-shuffle, not a color grid: three small cards (the "matches" being sorted) cycle
// through the stack in a loop, each one landing on top in turn — reads as "searching
// through options," not a generic spinner, and reuses the card-stack motif already
// established elsewhere on the site (see .how-cardstack) instead of borrowing someone
// else's loading pattern wholesale.
const CARD_COLORS = ['var(--cover)', 'var(--pine)', 'var(--gold)']

export default function InterviewLoading({ onDone }) {
  const [burst, setBurst] = useState(false)
  const iconRef = useRef(null)
  // the parent passes a fresh inline arrow function on every one of its own re-renders —
  // keeping the latest one in a ref (rather than the effect's dependency array) means the
  // timers below only ever get set up once, on mount, instead of being cleared and
  // restarted by every unrelated parent re-render (which was silently preventing onDone
  // from ever firing before this fix)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (iconRef.current) burstConfetti(iconRef.current, 18)
    // plays the shuffle for a beat, then "speeds up" (burst class shortens the cycle +
    // scales the stack up) right before handing off to the results page
    const burstTimer = setTimeout(() => setBurst(true), 1950)
    const doneTimer = setTimeout(() => onDoneRef.current?.(), 2450)
    return () => {
      clearTimeout(burstTimer)
      clearTimeout(doneTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`interview-loading ${burst ? 'is-bursting' : ''}`}>
      <div className="interview-loading-visual">
        <span className="interview-loading-glow" aria-hidden="true" />
        {/* three dots orbiting the stack, one per card color — a second, distinct motion
            layered on top of the shuffle itself rather than just scaling the same effect up */}
        <div className="interview-loading-orbit" aria-hidden="true">
          {CARD_COLORS.map((color, i) => (
            <span key={i} className="interview-loading-orbit-dot" style={{ '--dot-color': color, '--dot-i': i }} />
          ))}
        </div>
        <div className="interview-loading-stack" ref={iconRef} aria-hidden="true">
          {CARD_COLORS.map((color, i) => (
            <span key={i} className="interview-loading-card" style={{ '--card-color': color, '--card-i': i }} />
          ))}
        </div>
      </div>
      <h1 className="interview-loading-title">Finding your best matches</h1>
      <p className="interview-loading-subtext">Ranking by fit, timing, and location</p>
    </div>
  )
}
