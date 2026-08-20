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

  useEffect(() => {
    if (iconRef.current) burstConfetti(iconRef.current, 18)
    // plays the shuffle for a beat, then "speeds up" (burst class shortens the cycle +
    // scales the stack up) right before handing off to the results page
    const burstTimer = setTimeout(() => setBurst(true), 950)
    const doneTimer = setTimeout(() => onDone?.(), 1450)
    return () => {
      clearTimeout(burstTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div className={`interview-loading ${burst ? 'is-bursting' : ''}`}>
      <div className="interview-loading-stack" ref={iconRef} aria-hidden="true">
        {CARD_COLORS.map((color, i) => (
          <span key={i} className="interview-loading-card" style={{ '--card-color': color, '--card-i': i }} />
        ))}
      </div>
      <h1 className="interview-loading-title">Finding your best matches</h1>
      <p className="interview-loading-subtext">Ranking by fit, timing, and location</p>
    </div>
  )
}
