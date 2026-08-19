import { useEffect, useState } from 'react'

// 3x3 grid, brand colors instead of a single accent, each cell staggered on a diagonal
// so the wave reads as moving from top-left to bottom-right
const CELL_COLORS = [
  'var(--cover)', 'var(--gold)', 'var(--pine)',
  'var(--gold)', 'var(--cover)', 'var(--spine)',
  'var(--pine)', 'var(--spine)', 'var(--cover)',
]

export default function InterviewLoading({ onDone }) {
  const [burst, setBurst] = useState(false)

  useEffect(() => {
    // plays the wave for a beat, then "speeds up" (burst class shortens the animation
    // duration + scales the grid up) right before handing off to the results page
    const burstTimer = setTimeout(() => setBurst(true), 1000)
    const doneTimer = setTimeout(() => onDone?.(), 1550)
    return () => {
      clearTimeout(burstTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div className={`interview-loading ${burst ? 'is-bursting' : ''}`}>
      <div className="interview-loading-grid" aria-hidden="true">
        {CELL_COLORS.map((color, i) => (
          <span key={i} className="interview-loading-cell" style={{ '--cell-color': color, '--cell-i': i }} />
        ))}
      </div>
      <h1 className="interview-loading-title">Finding your best matches</h1>
      <p className="interview-loading-subtext">Ranking by fit, timing, and location</p>
    </div>
  )
}
