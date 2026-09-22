import { useEffect, useRef, useState } from 'react'

// A roadmap-style step tracker (5 stops, filling in one at a time) instead of
// InterviewLoading.jsx's card-shuffle — that one reads as "sorting through options,"
// this one needs to read as "walking through a pipeline," since the professor directory
// behind it is a fixed, already-built dataset rather than something being ranked live.
const STEPS = [
  { id: 'background', label: 'Your background', icon: 'icon-user' },
  { id: 'interests', label: 'Research interests', icon: 'icon-search' },
  { id: 'directory', label: 'Ivy League faculty', icon: 'icon-people' },
  { id: 'filter', label: 'Field & school', icon: 'icon-grad-cap' },
  { id: 'ready', label: 'Your professors', icon: 'icon-book' },
]

const STATUS_MESSAGES = [
  'Reading your background…',
  'Scanning your research interests…',
  'Searching 64 verified professors…',
  'Matching by field and school…',
  'Lining up your directory…',
]

const STEP_DURATION = 520
const HOLD_AFTER_LAST = 480

export default function ProfessorFinderLoading({ interests, onDone, onCancel }) {
  const [activeStep, setActiveStep] = useState(0)
  // same latest-callback-in-a-ref trick as InterviewLoading.jsx: the parent re-renders
  // with a fresh inline onDone on every keystroke elsewhere in the tree, and keeping it
  // out of the effect's dependency array keeps these timers from being torn down and
  // restarted mid-animation by an unrelated re-render.
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    const timers = STEPS.slice(1).map((_, i) => setTimeout(() => setActiveStep(i + 1), STEP_DURATION * (i + 1)))
    const doneTimer = setTimeout(() => onDoneRef.current?.(), STEP_DURATION * STEPS.length + HOLD_AFTER_LAST)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(doneTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const trimmed = interests?.trim()
  const interestsLabel = trimmed ? (trimmed.length > 56 ? `${trimmed.slice(0, 56)}…` : trimmed) : 'your interests'

  return (
    <div className="pfl">
      <span className="pfl-eyebrow">Setting up your directory</span>
      <h1 className="pfl-title">Finding your professors</h1>
      <p className="pfl-subtext">
        Matching <em>{interestsLabel}</em> against 64 verified Ivy League faculty.
      </p>

      <div className="pfl-steps">
        {STEPS.map((step, i) => (
          <div key={step.id} className={`pfl-step-col ${i < activeStep ? 'is-line-filled' : ''}`}>
            <div className={`pfl-step ${i < activeStep ? 'is-done' : i === activeStep ? 'is-current' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <use href={`#${step.icon}`} />
              </svg>
            </div>
            <span className={`pfl-step-label ${i <= activeStep ? 'is-active' : ''}`}>{step.label}</span>
          </div>
        ))}
      </div>

      <div className="pfl-status">
        <span className="pfl-status-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        {STATUS_MESSAGES[activeStep]}
      </div>

      <button type="button" className="pfl-cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  )
}
